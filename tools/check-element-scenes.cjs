const fs=require('node:fs'),path=require('node:path');const {pathToFileURL}=require('node:url');
const {chromium}=require(process.env.PLAYWRIGHT_PATH || 'playwright');
(async()=>{const browser=await chromium.launch({channel:'chrome',headless:true});const page=await browser.newPage({viewport:{width:1440,height:1000}});const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(pathToFileURL(path.resolve('index.html')).href);
await page.waitForFunction(()=>G.meta&&Object.keys(CASTLE_ART).length===12);
const result=await page.evaluate(()=>{
 const cards=[],hashes=new Set(),backgrounds=new Set();let checked=0;
 const gridBefore=JSON.stringify(GRID);
 const fingerprint=cv=>{const bytes=cv.getContext('2d').getImageData(0,0,cv.width,cv.height).data;let sum=0;for(let i=0;i<bytes.length;i++)sum=(sum*31+bytes[i])>>>0;return sum;};
 for(const el of EL_KEYS)for(let fi=0;fi<10;fi++){
  const r=newRun(newMeta());r.castleEl=el;r.siege=fi*5+1;r.stats.bosses=Array(5).fill({});r.tech={walls1:1,walls2:1,rafters1:1,rafters2:1,ballista1:1,ballista2:1,fountain:1};
  const ranged=HEROES.filter(h=>isRangedHero(h.id)).slice(0,3);ranged.forEach((d,i)=>{const h=addDraftedHero(r,{id:d.id,rolls:{ad:6,ap:6,def:6}});h.place={type:'rafter',i};});
  G.run=r;G.meta=newMeta();G.B=null;G.phase='prep';rebuildPrepUnits();
  const bg=buildBackground(fi,el),signature=fingerprint(bg);
  if(signature!==fingerprint(buildBackground(fi,el)))throw Error('Terrain changes on redraw: '+el);
  backgrounds.add(signature);
  renderFrame(G,0);const g=R.lctx;
  for(let i=0;i<10;i++){const id=FACTIONS[fi].pool[i%FACTIONS[fi].pool.length];drawUnit(g,{key:'e:'+id,side:'enemy',x:335+(i%4)*35,y:127+Math.floor(i/4)*43,hp:1,maxHp:1},0);}
  cards.push({el,fi,name:FACTIONS[fi].name,src:R.lo.toDataURL()});
  for(let tier=0;tier<=10;tier++){r.stats.bosses=Array(tier).fill({});const cv=buildCastle(r);if(cv.width!==110||cv.height!==270)throw Error('Footprint changed');const key=R.castleKey;if(!key.startsWith('sprite16'))throw Error('Sprite fell back to old architecture');const rf=R.castleFlags;castlePreviewURL(el);if(R.castle!==cv||R.castleKey!==key||R.castleFlags!==rf)throw Error('Preview corrupted renderer');checked++;}
 }
 for(const el of EL_KEYS){const r=newRun(newMeta());r.castleEl=el;const cv=buildCastle(r);const bytes=cv.getContext('2d').getImageData(0,0,110,270).data;let sum=0;for(let i=0;i<bytes.length;i++)sum=(sum*31+bytes[i])>>>0;hashes.add(sum);}
 if(hashes.size!==12)throw Error('Architectures identical');
 if(backgrounds.size!==120)throw Error('Element/horde scenery missing');
 if(JSON.stringify(GRID)!==gridBefore)throw Error('Terrain changed placement grid');
 return {cards,checked};
});if(errors.length)throw Error(errors.join('\n'));await page.close();
const gallery=await browser.newPage({viewport:{width:1600,height:1500}});
const html='<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Elemental architecture preview</title><style>body{margin:0;padding:18px;background:#172231;color:#eee;font:16px system-ui}h1{margin:0}select{padding:10px;margin:12px 0;background:#26394a;color:#fff}img{width:100%;image-rendering:pixelated}main{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}@media(max-width:900px){main{grid-template-columns:1fr}}article{margin:10px 0;background:#223246;padding:10px}h2{font-size:18px;margin:0 0 8px}small{color:#b9c8b9}</style><h1>Elemental castles & surroundings</h1><small>Actual 480 × 270 game renderer. Three occupied rafter slots. Select the attacking horde.</small><br><select id="horde">'+result.cards.filter(c=>c.el==='fire').map(c=>'<option value="'+c.fi+'">'+c.name+'</option>').join('')+'</select><main id="scenes"></main><script>const cards='+JSON.stringify(result.cards)+';function show(){document.getElementById("scenes").innerHTML=cards.filter(c=>c.fi===+document.getElementById("horde").value).map(c=>`<article><h2>${c.el.toUpperCase()} · ${c.name}</h2><img src="${c.src}"></article>`).join("")}document.getElementById("horde").onchange=show;show();</script>';
fs.writeFileSync('../elemental-preview.html',html);await gallery.setContent(html);await gallery.screenshot({path:'docs/elemental-all-elements.png',fullPage:true});
// Verify real combat and saved elemental run loading on both browser sizes.
for(const el of Object.keys(result.cards.reduce((a,c)=>(a[c.el]=true,a),{})))for(const viewport of [{width:1440,height:1000},{width:390,height:844}]){
 const p=await browser.newPage({viewport});const es=[];p.on('pageerror',e=>es.push(e.message));await p.goto(pathToFileURL(path.resolve('index.html')).href);
 await p.locator('#tNew').click();await p.locator('.dcard').first().click();
 await p.evaluate(el=>{G.run.castleEl=el;G.run.tech.rafters1=1;G.run.tech.rafters2=1;G.run.roster[0].place={type:'rafter',i:0};changed();},el);
 await p.locator('#beginBtn').click();await p.waitForFunction(()=>G.phase==='siege'&&G.B.t>2);
 await p.reload();await p.waitForFunction(el=>G.hasRun&&G.run.castleEl===el&&G.run.tech.rafters2===1,el);if(es.length)throw Error(es.join('\n'));await p.close();
}
console.log('Passed '+result.checked+' tier/element/horde cases; 120 rendered scenes; distinct silhouettes; desktop/mobile combat and saved-run reload.');await browser.close();})().catch(e=>{console.error(e);process.exit(1)});
