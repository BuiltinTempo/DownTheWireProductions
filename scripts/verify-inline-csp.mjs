import { createHash } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';

const pages = readdirSync('.').filter(
  (name) => name.endsWith('.html') && !/^google[a-z0-9]+\.html$/i.test(name)
);
if (pages.length < 28) throw new Error('Unexpectedly few public HTML pages');
let scripts = 0;
for (const page of pages) {
  const html = readFileSync(page, 'utf8');
  const meta = html.match(/<meta\s+http-equiv="Content-Security-Policy"\s+content="([^"]+)"/i);
  if (!meta) throw new Error(page + ': CSP meta missing');
  const directives = meta[1].split(';').map((s) => s.trim());
  const script = directives.find((s) => s.startsWith('script-src '));
  if (!script) throw new Error(page + ': script-src missing');
  if (!script.includes("'self'") || script.includes("'unsafe-inline'")) {
    throw new Error(page + ': unsafe script-src configuration');
  }
  // Browser-level egress restrictions are deliberately specific to DTW's
  // current static asset and form architecture. Any integration addition
  // requires an explicit, reviewed update to this allowlist.
  const requiredResourceRules = [
    "connect-src 'self' https://xefzruxeqmwxotorxmmh.supabase.co",
    "img-src 'self' data:",
    "frame-src 'none'",
    "worker-src 'none'",
    "media-src 'self'"
  ];
  for (const rule of requiredResourceRules) {
    if (!directives.includes(rule)) {
      throw new Error(page + ': missing or unexpected resource policy: ' + rule);
    }
  }
  // Prevent accidental third-party images or embedded frames from silently
  // requiring a weaker policy.
  if (/<iframe\b/i.test(html) || /<(?:img|source|video|audio)\b[^>]*\bsrc(?:set)?\s*=\s*["']https?:\/\//i.test(html)) {
    throw new Error(page + ': new external image/embed requires security review');
  }
  if (!directives.includes("script-src-attr 'none'")) {
    throw new Error(page + ': inline event handlers not disabled');
  }
  if (/\bon[a-z]+\s*=|javascript:/i.test(html)) {
    throw new Error(page + ': possible inline handler or javascript URL');
  }
  const expected = new Set();
  for (const match of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi)) {
    const attrs = match[1], code = match[2];
    const src = attrs.match(/\bsrc\s*=\s*(['"])(.*?)\1/i);
    if (src) {
      if (/^(?:[a-z]+:|\/\/)/i.test(src[2])) {
        throw new Error(page + ': remote script requires explicit review');
      }
      continue;
    }
    if (!code.trim()) continue;
    const hash = createHash('sha256').update(code, 'utf8').digest('base64');
    expected.add("'sha256-" + hash + "'");
    scripts++;
  }
  const declared = [...script.matchAll(/'sha256-[A-Za-z0-9+/=]+'/g)].map((m) => m[0]);
  if (declared.length !== expected.size || new Set(declared).size !== expected.size ||
      declared.some((x) => !expected.has(x))) {
    throw new Error(page + ': inline scripts changed without refreshing CSP hashes');
  }
}
console.log('PASS: approved hashes cover ' + scripts + ' inline scripts across ' + pages.length + ' pages');
