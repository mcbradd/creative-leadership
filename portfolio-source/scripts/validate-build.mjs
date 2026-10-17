import {readFile,stat} from 'node:fs/promises';
import path from 'node:path';
const routes=['','projects','projects/overlords-and-outlaws','projects/ai-art-direction-review','projects/colorbreak','projects/whatnot-month-one','projects/phase-rs-ai-measurement','work','judging-ai-output','about','contact'];
const failures=[];
for(const route of routes){const file=path.join('dist',route,'index.html');const html=await readFile(file,'utf8');if((html.match(/<h1(?:\s|>)/g)||[]).length!==1)failures.push(`${route}: needs one h1`);if(!html.includes('rel="canonical"'))failures.push(`${route}: canonical missing`);if(/\[ADD:|TODO|undefined/.test(html))failures.push(`${route}: unfinished content`);for(const [,url]of html.matchAll(/(?:src|href)="(\/[^"#?]*)/g)){if(!url||url.startsWith('//'))continue;const target=path.join('dist',decodeURI(url).replace(/^\/creative-leadership\/portfolio/, ''));try{const info=await stat(target);if(info.isDirectory())await stat(path.join(target,'index.html'));}catch{failures.push(`${route}: missing ${url}`);}}}
await stat('dist/404.html');await stat('dist/sitemap-index.xml');
if(failures.length){console.error([...new Set(failures)].join('\n'));process.exit(1);}console.log(`Validated ${routes.length} page routes, 404, sitemap, headings, metadata, and local assets.`);
