// Gameplay captures use real wave spawning, movement, attacks and the full app UI.
const fs=require('node:fs'),path=require('node:path');const {pathToFileURL}=require('node:url');
const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');
(async()=>{
 const b=await chromium.launch({channel:'chrome',headless:true});
 const p=await b.newPage({viewport:{width:1440,height:1050}}),errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.goto(pathToFileURL(path.resolve('index.html')).href);await p.waitForFunction(()=>G.meta&&Object.keys(CASTLE_ART).length===12);
 await p.locator('#tNew').click();await p.locator('.dcard').first().click();
 const elements=await p.evaluate(()=>EL_KEYS),cards=[];
 for(let i=0;i<elements.length;i++){
  const el=elements[i];
  const card=await p.evaluate(({el,i})=>{
   UI.closeModal();G.paused=true;G.B=null;G.selected=null;
   const r=newRun(newMeta());r.castleEl=el;r.siege=16+(i%3);r.stats.bosses=Array(3).fill({});
   r.tech={walls1:1,walls2:1,rafters1:1,rafters2:1,ballista1:1,ballista2:1,fountain:1};
   const ranged=HEROES.filter(h=>isRangedHero(h.id)).slice(0,3),front=HEROES.filter(h=>!isRangedHero(h.id)).slice(0,3);
   [...ranged,...front].forEach((d,j)=>{const h=addDraftedHero(r,{id:d.id,rolls:{ad:6,ap:6,def:6}});h.level=8;h.el=el;h.place=j<3?{type:'rafter',i:j}:{type:'ground',c:3,r:(j-3)*2+1};});
   G.run=r;G.meta=newMeta();G.hasRun=true;G.phase='prep';changed();beginSiege();
   // Advance the same simulation the animation loop uses; no posed enemy sprites.
   for(let j=0;j<1500&&!G.B.done;j++){
    stepBattle(G.B,1/60);stepFX(1/60);
    const visible=G.B.enemies.filter(e=>e.alive&&e.x<435);
    if(G.B.t>12&&visible.length>=9&&visible.some(e=>e.x<330))break;
   }
   if(G.B.done)throw Error('Capture ended before combat: '+el);
   renderFrame(G,0);UI.hud();UI.renderRoster();UI.renderIntel();
   return {el,name:ELEMENTS[el].name,horde:FACTIONS[factionIndex(r.siege)].name,t:G.B.t,alive:G.B.enemies.filter(e=>e.alive&&e.x<W).length,src:R.lo.toDataURL()};
  },{el,i});
  if(!card.alive)throw Error('No live horde in '+el);
  cards.push(card);
  if(el==='fire')await p.screenshot({path:'docs/gameplay-fire-full.png',fullPage:true});
 }
 if(errors.length)throw Error(errors.join('\n'));
 const html='<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Elemental castles in combat</title><style>body{margin:0;padding:18px;background:#172231;color:#eee;font:16px system-ui}h1{margin:0 0 8px}small{color:#bbc8ca}main{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;margin-top:20px}article{background:#223246;padding:10px}h2{font-size:18px;margin:0 0 8px}img{width:100%;image-rendering:pixelated}@media(max-width:950px){main{grid-template-columns:1fr}}</style><h1>All twelve elements in combat</h1><small>Actual game engine: live heroes, wave spawning, movement, attacks and effects. Staged roster for comparison.</small><main>'+cards.map(c=>'<article><h2>'+c.name+' · '+c.horde+'</h2><img src="'+c.src+'"><small>'+c.t.toFixed(1)+' seconds into siege · '+c.alive+' enemies on screen</small></article>').join('')+'</main>';
 fs.writeFileSync('../elemental-gameplay-preview.html',html);
 const gallery=await b.newPage({viewport:{width:1600,height:1500}});await gallery.setContent(html);await gallery.screenshot({path:'docs/elemental-gameplay.png',fullPage:true});
 console.log(cards.map(({el,t,alive})=>({el,t:+t.toFixed(1),alive})));await b.close();
})().catch(e=>{console.error(e);process.exit(1)});
