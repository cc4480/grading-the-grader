// Independent re-derivation of SecScan findings from the LIVE response.
//
// A separate code path from the scanner (no scanner imports). Passive only: single GETs of pages the
// scanner itself fetched (home page, routes it names, robots.txt, security.txt, files named in a
// finding) plus DNS TXT lookups. It sends the scanner's own User-Agent so a site sees the same
// visitor, and it never tries to get past a challenge page: a refused re-fetch is recorded as
// "refused", not worked around.
//
// usage: node verify-secscan.mjs <capture.json> <out.json> [--only=host1,host2] [--conc=4]
import fs from 'node:fs';
import dns from 'node:dns/promises';

const args = process.argv.slice(2);
const [capturePath, outPath] = args;
const only = (args.find((a) => a.startsWith('--only=')) || '').slice(7).split(',').filter(Boolean);
const CONC = Number((args.find((a) => a.startsWith('--conc=')) || '--conc=4').slice(7));

const UA = 'Mozilla/5.0 (compatible; SecScan-Security-Bot/1.0; +https://secscan.us/bot)';
const REQ_HEADERS = { 'User-Agent': UA, 'Cache-Control': 'no-cache, no-store', Pragma: 'no-cache' };
const TIMEOUT_MS = 20000;
const MAX_BYTES = 2 * 1024 * 1024;

// ---------- http ----------
async function readCapped(res) {
  const reader = res.body && res.body.getReader ? res.body.getReader() : null;
  if (!reader) return await res.text();
  const chunks = [];
  let n = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    n += value.length;
    if (n >= MAX_BYTES) { try { await reader.cancel(); } catch { /* ignore */ } break; }
  }
  return new TextDecoder().decode(Buffer.concat(chunks));
}

// Follows redirects by hand so Set-Cookie lines from every hop are kept.
async function get(url, maxHops = 8) {
  const setCookies = [];
  let cur = url;
  for (let hop = 0; hop <= maxHops; hop++) {
    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), TIMEOUT_MS);
    let res;
    try {
      res = await fetch(cur, { headers: REQ_HEADERS, redirect: 'manual', signal: ctl.signal });
    } catch (e) { clearTimeout(timer); throw e; }
    const sc = res.headers.getSetCookie ? res.headers.getSetCookie() : [];
    for (const c of sc) setCookies.push(c);
    const loc = res.headers.get('location');
    if ([301, 302, 303, 307, 308].includes(res.status) && loc) {
      clearTimeout(timer);
      try { await res.body?.cancel(); } catch { /* ignore */ }
      cur = new URL(loc, cur).toString();
      continue;
    }
    let body = '';
    try { body = await readCapped(res); } catch { /* keep what we have */ }
    clearTimeout(timer);
    return { url: cur, status: res.status, headers: res.headers, body, setCookies };
  }
  throw new Error('too many redirects');
}

function refusedReason(h) {
  if ([401, 403, 406, 429, 451, 503].includes(h.status)) return `HTTP ${h.status}`;
  const cfm = h.headers.get('cf-mitigated');
  if (cfm) return `cf-mitigated: ${cfm}`;
  if (h.body.length < 30000 &&
      /(just a moment|attention required|access denied|verify you are (a )?human|px-captcha|awswaf|challenge-platform|_incapsula_|are you a robot|enable javascript and cookies)/i.test(h.body)) {
    return 'challenge-page markers';
  }
  return null;
}

// ---------- csp ----------
function parsePolicy(str) {
  const m = new Map();
  for (const part of str.split(';')) {
    const toks = part.trim().split(/\s+/).filter(Boolean);
    if (!toks.length) continue;
    const name = toks[0].toLowerCase();
    if (!m.has(name)) m.set(name, toks.slice(1));
  }
  return m;
}
function enforcingPolicies(home) {
  const out = [];
  const v = home.headers.get('content-security-policy');
  if (v) for (const p of v.split(/\s*,\s+(?=[a-z][a-z-]*(?:\s|$))/i)) out.push(parsePolicy(p));
  for (const mm of home.body.matchAll(/<meta[^>]+http-equiv\s*=\s*["']?content-security-policy["']?[^>]*>/gi)) {
    const c = /content\s*=\s*"([^"]*)"|content\s*=\s*'([^']*)'/i.exec(mm[0]);
    if (c) out.push(parsePolicy(c[1] ?? c[2]));
  }
  return out;
}
const FALLBACK = { 'script-src': 'default-src', 'style-src': 'default-src', 'object-src': 'default-src' };
function eff(policy, name) {
  if (policy.has(name)) return policy.get(name);
  const fb = FALLBACK[name];
  return fb && policy.has(fb) ? policy.get(fb) : null;
}
const isNeutralised = (toks) => toks.some((t) => /^'(nonce-|sha256-|sha384-|sha512-|strict-dynamic)/i.test(t));

// ---------- dns ----------
async function txt(name) {
  try { return (await dns.resolveTxt(name)).map((p) => p.join('')); }
  catch (e) { if (e.code === 'ENOTFOUND' || e.code === 'ENODATA') return []; throw e; }
}
function chainOf(host) {
  const labels = host.toLowerCase().replace(/\.$/, '').split('.');
  const out = [];
  for (let i = 0; i <= labels.length - 2; i++) out.push(labels.slice(i).join('.'));
  return out;
}
async function findRecord(chain, prefix, re) {
  for (const name of chain) {
    const recs = await txt(prefix + name);
    const hit = recs.find((r) => re.test(r));
    if (hit) return { name: prefix + name, record: hit };
  }
  return null;
}

// ---------- helpers ----------
const SECOND_LEVEL = new Set(['co.uk', 'org.uk', 'ac.uk', 'gov.uk', 'com.au', 'co.jp', 'co.nz']);
function registrable(host) {
  const l = host.toLowerCase().split('.');
  const last2 = l.slice(-2).join('.');
  return SECOND_LEVEL.has(last2) ? l.slice(-3).join('.') : last2;
}
const metaHas = (body, key) =>
  new RegExp(`<meta[^>]+(?:property|name)\\s*=\\s*["']${key}["']`, 'i').test(body);
const ok = (detail) => ({ outcome: 'confirmed', detail });
const bad = (detail) => ({ outcome: 'disagrees', detail });
const nr = (detail) => ({ outcome: 'not-reproduced', detail });
// Claims that fetch their own URL (a source map, a spec, robots.txt...) do not depend on the home page answering.
const OWN = 'own';
const REFUSE_CODES = [401, 403, 406, 429, 451, 503];
const refusedFetch = (h, url) => (REFUSE_CODES.includes(h.status) ? { outcome: 'refused', detail: `HTTP ${h.status} on re-fetch of ${url}; not re-derived` } : null);

function headerAbsent(name, label) {
  return (c) => {
    const v = c.home.headers.get(name);
    return v ? bad(`${label} present on re-fetch: ${v.slice(0, 80)}`) : ok(`${label} absent on re-fetch`);
  };
}

// ---------- internal-route claims ----------
function routesFromEvidence(ev) {
  return [...ev.matchAll(/•\s*(\/\S*)\s*\((?:crawled|probed)\)/g)].map((m) => m[1]);
}
function routeClaim(test) {
  return async (c, f) => {
    const routes = routesFromEvidence(f.evidence || '').slice(0, 4);
    if (!routes.length) return nr('no routes parsed from evidence');
    const origin = new URL(c.home.url).origin;
    const notes = [];
    for (const p of routes) {
      let h;
      try { h = await get(origin + p); } catch (e) { return nr(`route ${p}: ${e.message}`); }
      const why = refusedReason(h);
      if (why) return { outcome: 'refused', detail: `route ${p}: ${why}` };
      if (h.status >= 400) return nr(`route ${p}: HTTP ${h.status}`);
      const r = test(h);
      if (!r) return bad(`route ${p}: header present on re-fetch`);
      notes.push(p);
    }
    return ok(`${notes.length} route(s) re-fetched, header absent on each: ${notes.join(' ')}`);
  };
}

// ---------- cookies ----------
function cookieLine(lines, name) {
  return lines.find((c) => c.split('=')[0].trim() === name);
}
function hasAttr(line, attr) {
  const low = line.toLowerCase();
  return attr === 'httponly' ? /;\s*httponly\b/.test(low) : attr === 'secure' ? /;\s*secure\b/.test(low) : /;\s*samesite\s*=/.test(low);
}
function cookieClaim(attr) {
  return async (c, f) => {
    const ev = f.evidence || '';
    // Inner-page form: "[Direct probe] GET <url> Set-Cookie: name=<redacted>; attrs". The scanner's own line is
    // in the evidence, so it can be checked for internal consistency as well as against a live re-fetch.
    const inner = /GET (https?:\/\/\S+)\s+Set-Cookie:\s*([^=\s]+)=(.*)$/.exec(ev.replace(/\s+/g, ' '));
    if (inner) {
      const [, url, name, rest] = inner;
      const recordedLacks = !hasAttr(`${name}=${rest}`, attr);
      let h;
      try { h = await get(url); } catch (e) { return nr(`inner page re-fetch failed: ${e.message}`); }
      const why = refusedReason(h);
      if (why) return { outcome: 'refused', detail: `inner page ${url}: ${why}; the scanner's recorded line ${recordedLacks ? 'does lack' : 'HAS'} ${attr}` };
      const line = cookieLine(h.setCookies, name);
      if (!line) return nr(`cookie ${name} not set on re-fetch of ${url} (varies per visit); the scanner's recorded line ${recordedLacks ? 'lacks' : 'HAS'} ${attr}`);
      return hasAttr(line, attr) ? bad(`cookie ${name} HAS ${attr} on re-fetch of ${url}`) : ok(`cookie ${name} lacks ${attr} on re-fetch of ${url}`);
    }
    // Home-page form: "Affected cookie: a" or "Affected cookies: a, b, a"
    const m = /Affected cookies?:\s*(.+?)\s*$/.exec(ev.replace(/\s+/g, ' '));
    if (!m) return nr('no cookie name or Set-Cookie line in evidence');
    const names = [...new Set(m[1].split(',').map((s) => s.trim()).filter(Boolean))];
    const seen = [], absent = [], wrong = [];
    for (const n of names) {
      const line = cookieLine(c.home.setCookies, n);
      if (!line) { absent.push(n); continue; }
      (hasAttr(line, attr) ? wrong : seen).push(n);
    }
    if (wrong.length) return bad(`HAS ${attr} on re-fetch: ${wrong.join(', ')}`);
    if (!seen.length) return nr(`none of ${names.join(', ')} in this re-fetch's Set-Cookie (varies per visit)`);
    return ok(`${seen.join(', ')} lack ${attr}${absent.length ? `; not set on re-fetch: ${absent.join(', ')}` : ''}`);
  };
}

// ---------- claim table ----------
const NEEDS_HTTP = true;
const CLAIMS = [
  [/^Missing Content-Security-Policy \(CSP\)$/, NEEDS_HTTP, (c) => {
    const hdr = c.home.headers.get('content-security-policy');
    const meta = enforcingPolicies(c.home).length > 0;
    return !hdr && !meta ? ok('no CSP header and no meta CSP on re-fetch') : bad(`CSP present on re-fetch (header=${!!hdr}, meta=${meta})`);
  }],
  [/^Content-Security-Policy is report-only/, NEEDS_HTTP, (c) => {
    const ro = c.home.headers.get('content-security-policy-report-only');
    const enf = enforcingPolicies(c.home).length > 0;
    return ro && !enf ? ok('report-only header present, no enforcing policy') : bad(`report-only=${!!ro}, enforcing=${enf}`);
  }],
  [/^Missing Clickjacking Protection/, NEEDS_HTTP, (c) => {
    const xfo = c.home.headers.get('x-frame-options');
    const fa = enforcingPolicies(c.home).some((p) => p.has('frame-ancestors'));
    return !xfo && !fa ? ok('no X-Frame-Options, no frame-ancestors') : bad(`XFO="${xfo || ''}", frame-ancestors=${fa}`);
  }],
  [/^X-Frame-Options Header Misconfigured/, NEEDS_HTTP, (c) => {
    const xfo = (c.home.headers.get('x-frame-options') || '').trim();
    if (!xfo) return bad('X-Frame-Options absent on re-fetch');
    return /^(deny|sameorigin)$/i.test(xfo) ? bad(`valid value "${xfo}"`) : ok(`non-standard value: ${xfo.slice(0, 60)}`);
  }],
  [/^Missing X-Content-Type-Options: nosniff$/, NEEDS_HTTP, (c) => {
    const v = (c.home.headers.get('x-content-type-options') || '').toLowerCase();
    return v.includes('nosniff') ? bad(`header present: ${v}`) : ok(`header="${v}" (not nosniff)`);
  }],
  [/^Missing Permissions-Policy Header$/, NEEDS_HTTP, headerAbsent('permissions-policy', 'Permissions-Policy')],
  [/^Missing Referrer-Policy Header$/, NEEDS_HTTP, headerAbsent('referrer-policy', 'Referrer-Policy')],
  [/^Missing Cross-Origin-Resource-Policy/, NEEDS_HTTP, headerAbsent('cross-origin-resource-policy', 'CORP')],
  [/^Missing Cross-Origin-Embedder-Policy/, NEEDS_HTTP, headerAbsent('cross-origin-embedder-policy', 'COEP')],
  [/^Missing Cross-Origin-Opener-Policy/, NEEDS_HTTP, headerAbsent('cross-origin-opener-policy', 'COOP')],
  [/^Missing Strict-Transport-Security/, NEEDS_HTTP, headerAbsent('strict-transport-security', 'HSTS')],
  [/^Missing Cache-Control Headers$/, NEEDS_HTTP, (c) => {
    const cc = c.home.headers.get('cache-control');
    const pr = c.home.headers.get('pragma');
    return !cc && !pr ? ok('Cache-Control and Pragma both absent') : bad(`Cache-Control="${cc || ''}" Pragma="${pr || ''}"`);
  }],
  [/^X-Powered-By Header Discloses/, NEEDS_HTTP, (c) => {
    const v = c.home.headers.get('x-powered-by');
    return v ? ok(`X-Powered-By: ${v}`) : bad('X-Powered-By absent on re-fetch');
  }],
  [/^Server Version Disclosure$/, NEEDS_HTTP, (c, f) => {
    const m = /Server:\s*(.+?)\s*$/.exec((f.evidence || '').replace(/\s+/g, ' '));
    const live = c.home.headers.get('server') || '';
    if (!m) return nr('no Server value in evidence');
    return live.toLowerCase().includes(m[1].toLowerCase().slice(0, 40)) ? ok(`Server: ${live}`) : bad(`live Server="${live}", scanner saw "${m[1]}"`);
  }],
  [/^Permissive CORS Policy/, NEEDS_HTTP, (c) => {
    const v = c.home.headers.get('access-control-allow-origin');
    return v === '*' ? ok('Access-Control-Allow-Origin: *') : bad(`ACAO="${v || ''}"`);
  }],
  [/^HSTS max-age Too Short$/, NEEDS_HTTP, (c, f) => {
    const sts = c.home.headers.get('strict-transport-security') || '';
    const m = /max-age\s*=\s*(\d+)/i.exec(sts);
    const min = Number((/minimum recommended:\s*(\d+)/.exec(f.evidence || '') || [])[1] || 15552000);
    if (!m) return bad(`no max-age in re-fetched STS ("${sts}")`);
    return Number(m[1]) < min ? ok(`max-age=${m[1]} < ${min}`) : bad(`live max-age=${m[1]} >= ${min}`);
  }],
  [/^CSP Missing object-src/, NEEDS_HTTP, (c) => {
    const ps = enforcingPolicies(c.home);
    if (!ps.length) return nr('no CSP on re-fetch');
    const none = ps.some((p) => { const t = eff(p, 'object-src'); return t && t.length === 1 && t[0].toLowerCase() === "'none'"; });
    return none ? bad("effective object-src is 'none'") : ok(`effective object-src: ${ps.map((p) => (eff(p, 'object-src') || ['(absent)']).join(' ')).join(' | ').slice(0, 80)}`);
  }],
  [/^CSP Missing base-uri/, NEEDS_HTTP, (c) => {
    const ps = enforcingPolicies(c.home);
    if (!ps.length) return nr('no CSP on re-fetch');
    return ps.some((p) => p.has('base-uri')) ? bad('base-uri present') : ok('no base-uri directive');
  }],
  [/^Weak Content-Security-Policy/, NEEDS_HTTP, (c) => {
    const ps = enforcingPolicies(c.home);
    if (!ps.length) return nr('no CSP on re-fetch');
    let note = '';
    for (const p of ps) {
      const t = eff(p, 'script-src') || [];
      const low = t.map((x) => x.toLowerCase());
      if (low.includes("'unsafe-eval'")) return ok("script-src has 'unsafe-eval'");
      if (low.includes("'unsafe-inline'")) {
        if (!isNeutralised(t)) return ok("script-src has 'unsafe-inline' with no nonce/hash/strict-dynamic");
        note = "'unsafe-inline' present but neutralised by nonce/hash/strict-dynamic";
      }
    }
    return bad(note || "neither 'unsafe-inline' nor 'unsafe-eval' in effective script-src");
  }],
  [/^CSP script-src Contains Wildcard/, NEEDS_HTTP, (c) => {
    const ps = enforcingPolicies(c.home);
    if (!ps.length) return nr('no CSP on re-fetch');
    const wild = [];
    for (const p of ps) for (const t of eff(p, 'script-src') || []) if (t === '*') wild.push(t);
    if (wild.length) return ok('bare * in effective script-src');
    const near = [];
    for (const p of ps) for (const t of eff(p, 'script-src') || []) if (/\*|^(https?|data|blob):$/i.test(t)) near.push(t);
    return bad(`no bare * in effective script-src; wildcard-ish tokens: ${near.slice(0, 6).join(' ') || 'none'}`);
  }],
  [/^Content-Security-Policy Allows Inline Styles/, NEEDS_HTTP, (c) => {
    const ps = enforcingPolicies(c.home);
    if (!ps.length) return nr('no CSP on re-fetch');
    for (const p of ps) {
      const t = eff(p, 'style-src') || [];
      if (t.map((x) => x.toLowerCase()).includes("'unsafe-inline'")) return isNeutralised(t) ? bad("'unsafe-inline' neutralised by nonce/hash") : ok("style-src has 'unsafe-inline'");
    }
    return bad("no 'unsafe-inline' in effective style-src");
  }],
  [/^Mixed Content/, NEEDS_HTTP, (c, f) => {
    const urls = [...(f.evidence || '').matchAll(/http:\/\/[^\s"'<>)]+/g)].map((m) => m[0]);
    if (!urls.length) return nr('no http:// URL in evidence');
    const missing = urls.filter((u) => !c.home.body.includes(u));
    return missing.length ? nr(`not in re-fetched HTML: ${missing.join(' ')}`) : ok(`${urls.length} http:// subresource(s) present in HTML`);
  }],
  [/^External Resources Missing Subresource Integrity/, NEEDS_HTTP, (c, f) => {
    const m = /(?:src|href)="([^"]+)"/.exec(f.evidence || '');
    if (!m) return nr('no URL in evidence');
    const i = c.home.body.indexOf(m[1].replace(/&/g, '&amp;')) >= 0 ? c.home.body.indexOf(m[1].replace(/&/g, '&amp;')) : c.home.body.indexOf(m[1]);
    if (i < 0) return nr(`${m[1].slice(0, 70)} not in re-fetched HTML`);
    const start = c.home.body.lastIndexOf('<', i);
    const end = c.home.body.indexOf('>', i);
    const tag = c.home.body.slice(start, end + 1);
    return /integrity\s*=/i.test(tag) ? bad('tag has integrity=') : ok('tag found, no integrity= attribute');
  }],
  [/^Missing security\.txt/, OWN, async (c) => {
    const origin = new URL(c.r.finalUrl || c.r.url).origin;
    const real = [];
    let tried = 0, refused = 0;
    for (const p of ['/.well-known/security.txt', '/security.txt']) {
      try {
        const h = await get(origin + p);
        tried++;
        if (REFUSE_CODES.includes(h.status)) { refused++; continue; }
        const ct = h.headers.get('content-type') || '';
        if (h.status === 200 && !/html/i.test(ct) && /^\s*(contact|expires)\s*:/im.test(h.body)) real.push(p);
      } catch { /* treated as absent */ }
    }
    if (real.length) return bad(`real security.txt at ${real.join(' ')}`);
    if (tried && refused === tried) return { outcome: 'refused', detail: 'both security.txt paths refused the re-fetch; not re-derived' };
    return ok('no real security.txt at /.well-known/ or /');
  }],
  [/^Apache Server Status Page Exposed/, OWN, async (c, f) => {
    const m = /GET (https?:\/\/\S+)/.exec(f.evidence || '');
    if (!m) return nr('no URL in evidence');
    let h;
    try { h = await get(m[1]); } catch (e) { return nr(e.message); }
    { const rf = refusedFetch(h, m[1]); if (rf) return rf; }
    const real = h.status === 200 && /Apache Server Status for|Server uptime:|Total accesses:|Current Time:/i.test(h.body);
    return real ? ok(`HTTP 200, ${h.body.length} bytes, Apache server-status signature present`) : bad(`HTTP ${h.status}, no Apache server-status signature (${h.body.length} bytes)`);
  }],
  [/^Apache Server Info Page Exposed/, OWN, async (c, f) => {
    const m = /GET (https?:\/\/\S+)/.exec(f.evidence || '');
    if (!m) return nr('no URL in evidence');
    let h;
    try { h = await get(m[1]); } catch (e) { return nr(e.message); }
    { const rf = refusedFetch(h, m[1]); if (rf) return rf; }
    const real = h.status === 200 && /Apache Server Information|Server Settings|Module Magic Number|Server Root:|Loaded Modules/i.test(h.body);
    return real ? ok(`HTTP 200, ${h.body.length} bytes, Apache server-info signature present`) : bad(`HTTP ${h.status}, no Apache server-info signature (${h.body.length} bytes)`);
  }],
  [/^robots\.txt Discloses/, OWN, async (c, f) => {
    const m = /GET (https?:\/\/\S+)/.exec(f.evidence || '');
    if (!m) return nr('no robots URL in evidence');
    const want = [...(f.evidence || '').matchAll(/Disallow:\s*(\S+)/g)].map((x) => x[1]);
    let h;
    try { h = await get(m[1]); } catch (e) { return nr(e.message); }
    { const rf = refusedFetch(h, m[1]); if (rf) return rf; }
    if (h.status !== 200) return nr(`robots.txt HTTP ${h.status}`);
    const lines = h.body.split(/\r?\n/).map((l) => l.trim().toLowerCase());
    const miss = want.filter((w) => !lines.some((l) => l.startsWith('disallow:') && l.slice(9).trim() === w.toLowerCase()));
    return miss.length ? bad(`Disallow not in live robots.txt: ${miss.join(' ')}`) : ok(`${want.length} Disallow line(s) present`);
  }],
  [/^Exposed API Documentation/, OWN, async (c, f) => {
    const m = /GET (https?:\/\/\S+)/.exec(f.evidence || '');
    if (!m) return nr('no URL in evidence');
    let h;
    try { h = await get(m[1]); } catch (e) { return nr(e.message); }
    { const rf = refusedFetch(h, m[1]); if (rf) return rf; }
    if (/\.ya?ml(\?|$)/i.test(m[1])) {
      const looks = h.status === 200 && !/<html/i.test(h.body.slice(0, 400)) && /^\s*(openapi|swagger)\s*:/m.test(h.body);
      return looks ? ok('HTTP 200, YAML body starts with an openapi:/swagger: key') : bad(`HTTP ${h.status}, body is not an OpenAPI YAML document`);
    }
    try {
      const j = JSON.parse(h.body);
      return h.status === 200 && (j.openapi || j.swagger) ? ok(`HTTP 200, valid ${j.openapi ? 'openapi ' + j.openapi : 'swagger ' + j.swagger} JSON`) : bad(`HTTP ${h.status}, JSON lacks openapi/swagger`);
    } catch {
      // A large spec is cut at the read cap and cannot parse; judge it by its head instead.
      if (h.status === 200 && h.body.length >= MAX_BYTES * 0.99 && /"(openapi|swagger)"\s*:\s*"[23]\./.test(h.body.slice(0, 8000))) {
        return ok(`HTTP 200, body longer than the ${MAX_BYTES}-byte read cap; its head carries an openapi/swagger version key`);
      }
      return bad(`HTTP ${h.status}, body is not JSON`);
    }
  }],
  [/^JavaScript Source Map Exposed/, OWN, async (c, f) => {
    const m = /Source map URL:\s*(\S+)/.exec(f.evidence || '');
    if (!m) return nr('no source map URL in evidence');
    let h;
    try { h = await get(m[1]); } catch (e) { return nr(e.message); }
    { const rf = refusedFetch(h, m[1]); if (rf) return rf; }
    try {
      const j = JSON.parse(h.body);
      const valid = h.status === 200 && Array.isArray(j.sources) && typeof j.mappings === 'string';
      if (!valid) return bad(`HTTP ${h.status}, not a valid source map`);
      const full = /Full source code/i.test(f.name);
      const withContent = Array.isArray(j.sourcesContent) && j.sourcesContent.some((s) => typeof s === 'string' && s.length);
      return full && !withContent ? bad('valid map but no sourcesContent') : ok(`valid map, ${j.sources.length} source(s), sourcesContent=${withContent}`);
    } catch {
      // A large map is cut at the read cap and cannot parse; judge it by its head instead.
      if (h.status === 200 && h.body.length >= MAX_BYTES * 0.99 && /"version"\s*:\s*3/.test(h.body.slice(0, 8000)) && /"sources"\s*:/.test(h.body.slice(0, 200000))) {
        return ok(`HTTP 200, body longer than the ${MAX_BYTES}-byte read cap; its head looks like a version-3 source map (sourcesContent not checked)`);
      }
      return bad(`HTTP ${h.status}, body is not JSON`);
    }
  }],
  [/^\.gitignore Exposes/, OWN, async (c, f) => {
    const m = /GET (https?:\/\/\S+)/.exec(f.evidence || '');
    if (!m) return nr('no URL in evidence');
    let h;
    try { h = await get(m[1]); } catch (e) { return nr(e.message); }
    { const rf = refusedFetch(h, m[1]); if (rf) return rf; }
    return h.status === 200 && !/<html/i.test(h.body.slice(0, 500)) ? ok(`HTTP 200, ${h.body.length} bytes, not HTML`) : bad(`HTTP ${h.status}`);
  }],
  [/^No Structured Data Found/, NEEDS_HTTP, (c) => (/ld\+json/i.test(c.home.body) ? bad('ld+json present in HTML') : ok('no ld+json in HTML'))],
  [/^Twitter Card Metadata Absent/, NEEDS_HTTP, (c) => (metaHas(c.home.body, 'twitter:card') ? bad('twitter:card present') : ok('no twitter:card meta'))],
  [/^Incomplete Open Graph Metadata/, NEEDS_HTTP, (c, f) => {
    // Evidence lists each tag as "og:key: value"; an absent or empty one is "og:key: (absent)" or "og:key:" followed by the next key.
    const absent = [...(f.evidence || '').replace(/\s+/g, ' ').matchAll(/(og:[a-z:_]+):\s*(?:\(absent\)|(?=og:[a-z])|$)/g)].map((m) => m[1]);
    if (!absent.length) return nr('no empty or absent og: tags found in evidence');
    const content = (key) => {
      for (const t of c.home.body.match(/<meta\b[^>]*>/gi) || []) {
        if (!new RegExp(`(?:property|name)\\s*=\\s*["']${key}["']`, 'i').test(t)) continue;
        const m = /content\s*=\s*"([^"]*)"|content\s*=\s*'([^']*)'/i.exec(t);
        return m ? (m[1] ?? m[2]) : '';
      }
      return null;
    };
    const filled = absent.filter((k) => (content(k) || '').trim());
    return filled.length ? bad(`now present with content: ${filled.join(' ')}`) : ok(`absent or empty on re-fetch: ${absent.join(' ')}`);
  }],
  [/^Canonical URL Points to an External Domain/, NEEDS_HTTP, (c) => {
    const m = /<link[^>]+rel\s*=\s*["']canonical["'][^>]*href\s*=\s*["']([^"']+)["']/i.exec(c.home.body) ||
              /<link[^>]+href\s*=\s*["']([^"']+)["'][^>]*rel\s*=\s*["']canonical["']/i.exec(c.home.body);
    if (!m) return nr('no canonical link in re-fetched HTML');
    let ch;
    try { ch = new URL(m[1], c.home.url).hostname; } catch { return nr('unparseable canonical'); }
    const ph = new URL(c.home.url).hostname;
    if (ch === ph) return bad('canonical host equals page host');
    return registrable(ch) === registrable(ph)
      ? bad(`canonical ${ch} is a sibling host on the same registrable domain (${registrable(ph)}) as ${ph}`)
      : ok(`canonical ${ch} vs page ${ph}`);
  }],
  [/^Scan was intercepted by a bot-protection challenge/, NEEDS_HTTP, (c) => {
    const why = refusedReason(c.home);
    return why ? ok(`re-fetch also refused/challenged: ${why}`) : nr(`re-fetch served HTTP ${c.home.status} with no challenge markers`);
  }],
  // routes
  [/^Content-Security-Policy Missing on \d+ Internal Route/, NEEDS_HTTP, routeClaim((h) => !h.headers.get('content-security-policy') && !enforcingPolicies(h).length)],
  [/^X-Frame-Options \/ frame-ancestors Missing on \d+ Internal Route/, NEEDS_HTTP, routeClaim((h) => !h.headers.get('x-frame-options') && !enforcingPolicies(h).some((p) => p.has('frame-ancestors')))],
  [/^X-Content-Type-Options Missing on \d+ Internal Route/, NEEDS_HTTP, routeClaim((h) => !(h.headers.get('x-content-type-options') || '').toLowerCase().includes('nosniff'))],
  [/^Referrer-Policy Missing on \d+ Internal Route/, NEEDS_HTTP, routeClaim((h) => !h.headers.get('referrer-policy'))],
  [/^Strict-Transport-Security Missing on \d+ Internal Route/, NEEDS_HTTP, routeClaim((h) => !h.headers.get('strict-transport-security'))],
  // cookies
  [/^Session Cookie Missing HttpOnly/, NEEDS_HTTP, cookieClaim('httponly')],
  [/^Session Cookie Missing Secure/, NEEDS_HTTP, cookieClaim('secure')],
  [/^Session Cookie Missing SameSite/, NEEDS_HTTP, cookieClaim('samesite')],
  [/^Non-Session Cookie Readable by JavaScript/, NEEDS_HTTP, cookieClaim('httponly')],
  [/^Non-Session Cookie Missing Secure/, NEEDS_HTTP, cookieClaim('secure')],
  [/^Non-Session Cookie Missing SameSite/, NEEDS_HTTP, cookieClaim('samesite')],
  // dns (no http needed)
  [/^Missing DMARC Record/, !NEEDS_HTTP, async (c) => {
    const hit = await findRecord(c.chain, '_dmarc.', /^v=DMARC1/i);
    return hit ? bad(`DMARC found at ${hit.name}: ${hit.record.slice(0, 80)}`) : ok(`no v=DMARC1 TXT at _dmarc.{${c.chain.join(', ')}}`);
  }],
  [/^DMARC Policy Set to None/, !NEEDS_HTTP, async (c) => {
    const hit = await findRecord(c.chain, '_dmarc.', /^v=DMARC1/i);
    if (!hit) return bad('no DMARC record found');
    const p = (/(?:^|;)\s*p\s*=\s*(\w+)/i.exec(hit.record) || [])[1];
    return (p || '').toLowerCase() === 'none' ? ok(`${hit.name}: p=none`) : bad(`${hit.name}: p=${p}`);
  }],
  [/^DMARC Record Missing Aggregate Report Address/, !NEEDS_HTTP, async (c) => {
    const hit = await findRecord(c.chain, '_dmarc.', /^v=DMARC1/i);
    if (!hit) return bad('no DMARC record found');
    return /(?:^|;)\s*rua\s*=/i.test(hit.record) ? bad(`${hit.name} has rua=`) : ok(`${hit.name}: no rua= (${hit.record.slice(0, 70)})`);
  }],
  [/^Missing SPF Record/, !NEEDS_HTTP, async (c) => {
    const hit = await findRecord(c.chain, '', /^v=spf1/i);
    return hit ? bad(`SPF found at ${hit.name}: ${hit.record.slice(0, 80)}`) : ok(`no v=spf1 TXT at {${c.chain.join(', ')}}`);
  }],
  [/^SPF Record Uses \?all/, !NEEDS_HTTP, async (c) => {
    const hit = await findRecord(c.chain, '', /^v=spf1/i);
    if (!hit) return bad('no SPF record found');
    return /\s\?all\b/i.test(hit.record) ? ok(`${hit.name}: ...?all`) : bad(`${hit.name}: ${hit.record.slice(-60)}`);
  }],
];

// ---------- run ----------
const capture = JSON.parse(fs.readFileSync(capturePath, 'utf8'));
let sites = capture.results.filter((r) => !r.failed);
if (only.length) sites = sites.filter((r) => only.some((o) => r.url.includes(o)));

const records = [];
const siteInfo = [];

async function verifySite(r) {
  const info = { site: r.url, finalUrl: r.finalUrl, status: null, refused: null, error: null, findings: r.findings.length };
  const ctx = { r, home: null, refused: null, chain: [] };
  const target = r.finalUrl || r.url;
  try { ctx.chain = chainOf(new URL(target).hostname); } catch { ctx.chain = []; }
  try {
    ctx.home = await get(target);
    info.status = ctx.home.status;
    ctx.refused = refusedReason(ctx.home);
    info.refused = ctx.refused;
  } catch (e) {
    info.error = e.message;
  }
  for (const f of r.findings) {
    const family = f.name.replace(/\d+/g, 'N');
    const rec = { site: r.url, severity: f.severity, name: f.name, family };
    const claim = CLAIMS.find(([re]) => re.test(f.name));
    if (!claim) { rec.outcome = 'no-check'; rec.detail = 'no independent check coded'; records.push(rec); continue; }
    const [, needsHttp, fn] = claim;
    try {
      if (needsHttp === true && !ctx.home) { Object.assign(rec, nr(`re-fetch failed: ${info.error}`)); }
      else if (needsHttp === true && ctx.refused && !/^Scan was intercepted/.test(f.name)) { rec.outcome = 'refused'; rec.detail = `re-fetch refused (${ctx.refused}); not re-derived`; }
      else Object.assign(rec, await fn(ctx, f));
    } catch (e) {
      rec.outcome = 'not-reproduced';
      rec.detail = `check error: ${e.message}`;
    }
    records.push(rec);
  }
  siteInfo.push(info);
  console.log(`done ${r.url} (${info.status ?? info.error}${info.refused ? ', refused: ' + info.refused : ''})`);
}

let next = 0;
async function worker() {
  while (next < sites.length) { const r = sites[next++]; await verifySite(r); }
}
await Promise.all(Array.from({ length: CONC }, worker));

// ---------- report ----------
const mergeInto = (args.find((a) => a.startsWith('--merge-into=')) || '').slice(13);
let allRecords = records, allSiteInfo = siteInfo, passes = [{ at: new Date().toISOString(), sites: sites.map((r) => r.url) }];
if (mergeInto) {
  // Replace only the re-checked sites' records in an earlier verification; every other site keeps its earlier result.
  const prev = JSON.parse(fs.readFileSync(mergeInto, 'utf8'));
  const redone = new Set(sites.map((r) => r.url));
  allRecords = [...prev.records.filter((r) => !redone.has(r.site)), ...records];
  allSiteInfo = [...prev.siteInfo.filter((s) => !redone.has(s.site)), ...siteInfo];
  passes = [...(prev.summary.passes || [{ at: prev.summary.verifiedAt, sites: 'all' }]), ...passes];
}
const by = (k) => allRecords.reduce((m, r) => (m[r[k]] = (m[r[k]] || 0) + 1, m), {});
const summary = {
  verifiedAt: new Date().toISOString(),
  userAgent: UA,
  sites: allSiteInfo.length,
  claims: allRecords.length,
  byOutcome: by('outcome'),
  passes,
};
fs.writeFileSync(outPath, JSON.stringify({ summary, siteInfo: allSiteInfo, records: allRecords }, null, 1));
console.log('\nSUMMARY', JSON.stringify(summary));
for (const r of records.filter((x) => x.outcome === 'disagrees')) console.log(`DISAGREES  ${r.site} [${r.severity}] ${r.name}\n           ${r.detail}`);
for (const r of records.filter((x) => x.outcome === 'not-reproduced')) console.log(`NOT-REPRO  ${r.site} [${r.severity}] ${r.name}\n           ${r.detail}`);
