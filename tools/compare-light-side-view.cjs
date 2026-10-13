const fs=require('node:fs');const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');
(async()=>{
 const b=await chromium.launch({channel:'chrome',headless:true}),p=await b.newPage({viewport:{width:1100,height:430}});
 const readLight=async file=>{await p.setContent(fs.readFileSync(file,'utf8'));return p.evaluate(()=>[...document.querySelectorAll('article')].find(a=>a.querySelector('h2').textContent.startsWith('Light ·')).querySelector('img').src);};
 const before=await readLight('../elemental-gameplay-before-light.html'),after=await readLight('../elemental-gameplay-preview.html');
 const html='<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Light castle side view</title><style>body{margin:0;padding:20px;background:#172231;color:#eee;font:16px system-ui}h1{margin:0 0 12px;font-size:25px}main{display:grid;grid-template-columns:1fr 1fr;gap:12px}figure{margin:0;background:#243347;padding:8px}figcaption{margin:0 0 8px}img{width:100%;image-rendering:pixelated}@media(max-width:700px){main{grid-template-columns:1fr}}</style><h1>Light castle · actual gameplay</h1><main><figure><figcaption>Before</figcaption><img src="'+before+'"></figure><figure><figcaption>After · side elevation</figcaption><img src="'+after+'"></figure></main>';
 fs.writeFileSync('../light-castle-comparison.html',html);await p.setContent(html);await p.screenshot({path:'docs/light-castle-comparison.png',fullPage:true});await b.close();
})().catch(e=>{console.error(e);process.exit(1)});
