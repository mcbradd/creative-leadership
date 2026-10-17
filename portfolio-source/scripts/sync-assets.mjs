import {cp,mkdir,readdir,writeFile} from 'node:fs/promises';
for (const type of ['brand','evidence','generated']) {
  await mkdir(`public/media/${type}`,{recursive:true});
  for (const file of await readdir(`assets/${type}`)) {
    if (/\.(webp|jpg|svg)$/.test(file) && !file.includes('-original') || type==='brand'&&file==='apple-touch-icon.png') await cp(`assets/${type}/${file}`,`public/media/${type}/${file}`);
  }
}
await cp('assets/fonts','public/fonts',{recursive:true});
await writeFile('public/release.json',JSON.stringify({commit:process.env.GITHUB_SHA||'local',builtAt:new Date().toISOString()}));
