// scripts/indexnow.mjs — tell Bing (and every other IndexNow engine: Yandex,
// Seznam, Naver…) which pages changed, so they are crawled within minutes
// instead of whenever the sitemap is next read. ChatGPT search draws on Bing's
// index, so this is the fastest route from "deployed" to "findable there".
//
// Run AFTER a deploy, from the repo root:
//   npm run seo:indexnow                    # every URL in the live sitemap
//   npm run seo:indexnow -- /atlas /pricing # just these paths
//
// The key is public by design: IndexNow proves ownership by fetching
// https://business-builder.online/<key>.txt, which is the file in public/.
// Google does not use IndexNow — Search Console is still the Google path.
// Plain Node script (no bundler), so the site URL is spelled out here; keep it
// equal to `siteUrl` in src/utils/AppConfig.ts.
const SITE_URL = 'https://business-builder.online';

const KEY = 'e89ca2a534c9703412fdd83bcc0f05e5';
const HOST = new URL(SITE_URL).host;
const ENDPOINT = 'https://api.indexnow.org/indexnow';

const sitemapUrls = async () => {
  const res = await fetch(`${SITE_URL}/sitemap.xml`);
  if (!res.ok) {
    throw new Error(`sitemap.xml returned ${res.status} — is the site deployed?`);
  }
  const xml = await res.text();
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]);
};

const args = process.argv.slice(2);
const urlList = args.length > 0
  ? args.map(path => new URL(path, SITE_URL).toString())
  : await sitemapUrls();

// IndexNow only accepts URLs on the host that owns the key.
const foreign = urlList.filter(url => new URL(url).host !== HOST);
if (foreign.length > 0) {
  throw new Error(`Not on ${HOST}: ${foreign.join(', ')}`);
}

const keyCheck = await fetch(`${SITE_URL}/${KEY}.txt`);
if (!keyCheck.ok || (await keyCheck.text()).trim() !== KEY) {
  throw new Error(`Key file ${SITE_URL}/${KEY}.txt is not live yet — deploy first.`);
}

const res = await fetch(ENDPOINT, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json; charset=utf-8' },
  body: JSON.stringify({
    host: HOST,
    key: KEY,
    keyLocation: `${SITE_URL}/${KEY}.txt`,
    urlList,
  }),
});

// 200 = accepted, 202 = accepted and key validation pending. Anything else is
// a real failure and the exit code says so.
console.log(`IndexNow → ${res.status} ${res.statusText} for ${urlList.length} URL(s):`);
for (const url of urlList) {
  console.log(`  ${url}`);
}
if (res.status !== 200 && res.status !== 202) {
  console.error(await res.text());
  process.exit(1);
}
