// Report measured alpha bounds for checked-in layout metadata, not guessed dimensions.
const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');
const {pathToFileURL}=require('node:url');const fs=require('node:fs');
(async()=>{
 const b=await chromium.launch({channel:'chrome',headless:true}),p=await b.newPage();
 await p.goto(pathToFileURL(process.cwd()+'/index.html').href);
 await p.waitForFunction(()=>Object.keys(CASTLE_ART).length===12);
 const result=await p.evaluate(()=>Object.fromEntries(Object.entries(CASTLE_ART).map(([el,a])=>[el,{w:a.w,h:a.h,aspect:a.w/a.h,slots:CASTLE_SHAPES[el].slots}])));
 fs.writeFileSync('assets/castles/layouts.json',JSON.stringify(result,null,2)+'\n');
 console.log(JSON.stringify(result));await b.close();
})().catch(e=>{console.error(e);process.exit(1)});
