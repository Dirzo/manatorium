const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');const {pathToFileURL}=require('node:url');
(async()=>{
 const b=await chromium.launch({channel:'chrome',headless:true}),p=await b.newPage();
 await p.goto(pathToFileURL(process.cwd()+'/index.html').href);await p.waitForFunction(()=>Object.keys(CASTLE_ART).length===12);
 const count=await p.evaluate(()=>{let count=0;
  for(const el of EL_KEYS)for(let tier=0;tier<=10;tier++){
   const r=newRun(newMeta());r.castleEl=el;r.stats.bosses=Array(tier).fill({});r.tech.rafters1=1;r.tech.rafters2=1;
   const a=CASTLE_ART[el],s=castleShape(r);
   if(Math.abs(s.height-s.width*a.h/a.w)>.51)throw Error('Stretched '+el);
   if(Math.abs(s.x+s.width/2-55)>.51)throw Error('Off-center horizontally '+el);
   if(s.height<124&&Math.abs(s.y+s.height/2-174)>.51)throw Error('Short castle sunk into corner '+el);
   if(s.x<0||s.x+s.width>110||s.y<0||s.baseY>236)throw Error('Castle clipped '+el);
   if(['ice','meat','salty'].includes(el)&&s.height<140)throw Error('Castle still too small '+el);
   for(let i=0;i<3;i++){const pos=rafterPosition(r,i);if(pos.x<s.x||pos.x>s.x+s.width||pos.y<s.y||pos.y>s.baseY)throw Error('Defender outside castle '+el);}
   const B=startBattle(r,newMeta()),e=spawnEnemy(B,'grunt',{x:CASTLE_X+11,y:220});
   e.climb={phase:'climb',t:1.39,y0:220};siegeTricks(B,e,.02);
   if(!e.onRafter||e.y!==castleRafterY(r))throw Error('Ladder missed moved deck '+el);
   count++;
  }return count;
 });console.log('Passed '+count+' size, centering, proportion, defender and ladder checks.');await b.close();
})().catch(e=>{console.error(e);process.exit(1)});
