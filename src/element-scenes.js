// First architecture pass: three elements, independently composed with ten hordes.
const ELEMENT_SCENES = {
  fire: { sky: ['#46394e', '#efa577'], hill: '#75595e', ground: '#938576', edge: '#b7a18b', grass: '#776e67', fleck: '#baab93', road: '#bca28b' },
  water: { sky: ['#699bc1', '#d4ebdf'], hill: '#69969f', ground: '#8cb8ad', edge: '#b0d5bd', grass: '#709d97', fleck: '#bad9c6', road: '#c1ccc3' },
  nature: { sky: ['#759aa5', '#d1dfba'], hill: '#567d69', ground: '#83aa72', edge: '#bad393', grass: '#698d60', fleck: '#bdd699', road: '#b8aa7b' }
};
function elementArchitecture(run) {
  const el = run.castleEl; if (!ELEMENT_SCENES[el]) return null;
  if (CASTLE_ART[el]) return drawArtCastle(run);
  if (!['fire','water','nature'].includes(el)) return null;
  const T = run.tech || {}, tier = Math.min(10, castleTier(run)), rf = rafterSlots(run);
  const key = ['architecture2', el, tier, rf, ...['walls1','walls2','bastion','ballista1','ballista2','ballista3','fountain'].map(k => !!T[k])].join();
  if (R.castleKey === key) return R.castle;
  const cv = document.createElement('canvas'); cv.width = 110; cv.height = H;
  const g = cv.getContext('2d'); R.castleFlags = []; R.castleTorches = []; R.castleGlow = [];
  const p = (x,y,w,h,col) => { g.fillStyle=col; g.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h)); };
  // Scanline polygons preserve a strict pixel grid, including roofs and roots.
  const polygon = (pts,col) => { const min=Math.floor(Math.min(...pts.map(a=>a[1]))), max=Math.ceil(Math.max(...pts.map(a=>a[1])));
    for(let y=min;y<max;y++){const xs=[];for(let i=0;i<pts.length;i++){const a=pts[i],b=pts[(i+1)%pts.length];if((a[1]<=y&&b[1]>y)||(b[1]<=y&&a[1]>y)) xs.push(a[0]+(y-a[1])*(b[0]-a[0])/(b[1]-a[1]));}xs.sort((a,b)=>a-b);for(let i=0;i<xs.length;i+=2)p(Math.ceil(xs[i]),y,Math.floor(xs[i+1])-Math.ceil(xs[i])+1,1,col);}
  };
  const wall = (x,y,w,h,col,seam) => {p(x-1,y-1,w+2,h+2,OUTLINE);p(x,y,w,h,col);
    for(let yy=y+5,row=0;yy<y+h;yy+=7,row++){p(x,yy,w,1,seam);for(let xx=x+((row%2)*5);xx<x+w;xx+=10)p(xx,yy-5,1,5,seam);}
    p(x,y,2,h,shade(col,.16));p(x+w-3,y,3,h,shade(col,-.2));};
  const crenels = (x,y,w,col) => {p(x-1,y,w+2,4,OUTLINE);p(x,y,w,2,shade(col,.25));for(let xx=x;xx<x+w-3;xx+=8){p(xx-1,y-6,6,7,OUTLINE);p(xx,y-5,4,6,col);p(xx,y-5,4,1,shade(col,.3));}};
  const window = (x,y,col) => {p(x-1,y+1,6,11,OUTLINE);p(x,y,4,10,col);p(x+1,y-1,2,2,OUTLINE);p(x+2,y,1,10,shade(col,-.35));p(x-2,y+11,8,2,'#a6a998');};
  const leaf = (x,y,w,h) => {polygon([[x,y+4],[x+w*.2,y],[x+w*.7,y-2],[x+w,y+4],[x+w-2,y+h],[x+3,y+h]],OUTLINE);polygon([[x+2,y+5],[x+w*.25,y+1],[x+w*.7,y],[x+w-2,y+5],[x+w-4,y+h-2],[x+4,y+h-2]],'#355e43');p(x+5,y+3,w-12,3,'#668d4b');p(x+3,y+7,w-6,2,'#487b43');};
  const base = el==='fire'?'#62606a':el==='water'?'#829a9e':'#6b7754';
  polygon([[2,217],[92,213],[104,231],[85,240],[6,235]],OUTLINE);polygon([[3,219],[90,215],[100,230],[83,237],[7,233]],base);
  if(el==='fire'){
    // Stepped black basalt furnace, stout gatehouse and a taller rear chimney.
    const rise=Math.min(20,tier*2), stone='#586070', seam='#343d50';
    wall(7,42-rise,21,177+rise,stone,seam);crenels(6,42-rise,23,stone);
    wall(31,80,42,139,stone,seam);crenels(30,80,44,stone);
    wall(76,103,20,116,stone,seam);crenels(75,103,22,stone);
    wall(43,29-rise,12,37+rise,'#424a5a',seam);p(41,28-rise,16,4,'#a07858');
    wall(29,120,47,99,'#626573',seam);crenels(28,120,49,stone);
    for(const x of [13,38,61,83]) {window(x,x===13?83:135,'#ffbd65');p(x+1,187,1,24,'#ff8744');}
    for(let yy=88;yy<208;yy+=29){p(8,yy,18,3,'#867764');p(8,yy+1,18,1,'#cf975b');}
    for(const x of [10,48,84])R.castleTorches.push({x,y:x===48?27-rise:100});
    if(tier>=5){p(34,96,35,3,'#d9a04e');p(37,94,5,3,'#e4b96c');p(60,94,5,3,'#e4b96c');}
    // A masonry fighting terrace bears all existing rafter coordinates.
    if(rf){p(3,67,95,6,OUTLINE);p(4,68,93,3,'#a38b6d');for(const x of [5,29,57,88]){p(x,73,4,x===88?31:14,'#41495c');p(x,73,7,4,'#77716c');}p(4,67,93,1,'#dfb778');}
  }else if(el==='water'){
    // Open aqueduct arcades support upper fighting deck and a tiered reservoir.
    wall(5,76,24,143,'#c1d7d4','#8da9ae');wall(68,90,28,129,'#ccdcd5','#95b3b6');
    wall(35,108,31,111,'#d9e4d7','#a0b6b0');crenels(35,108,31,'#cfdfd8');
    const ty=38-Math.min(16,tier*1.6);wall(8,ty,18,33,'#dfebdf','#a2b9b9');
    polygon([[4,ty],[17,ty-14],[30,ty]],OUTLINE);polygon([[6,ty-1],[17,ty-12],[28,ty-1]],'#3e759e');p(10,ty-5,15,1,'#69a4be');
    wall(74,72,17,19,'#e2e9dc','#a0b8b6');polygon([[70,72],[82,57],[95,72]],OUTLINE);polygon([[72,71],[82,59],[93,71]],'#39789e');
    // Arcades leave dark open arches, unlike a solid curtain wall.
    for(const [yy,xx] of [[86,28],[124,6]]){p(xx,yy,62,7,'#8eaeb3');p(xx,yy,62,2,'#eef4de');for(let x=xx+4;x<xx+55;x+=16){p(x,yy+8,11,16,'#446d83');p(x+2,yy+5,7,4,'#446d83');p(x+2,yy+7,2,15,'#698a9d');}}
    for(const x of [12,45,79])window(x,x===45?135:153,'#92d7ea');
    p(32,101,33,5,'#528aab');p(32,100,33,1,'#b7eeef');p(30,106,38,3,'#e0eada');
    // Waterfalls sit behind the champion deck and away from targeting lanes.
    for(const [x,yy,h] of [[29,106,110],[94,100,112]]){p(x,yy,3,h,'#519ec8');p(x,yy,1,h,'#b7f3ef');for(let y=yy+5;y<yy+h;y+=9)p(x+1,y,2,2,'#e0fcf2');}
    if(rf){p(3,67,95,6,OUTLINE);p(4,67,93,3,'#e1ecda');p(4,70,93,2,'#7fabae');for(const x of [6,29,60,91]){p(x,72,3,13,'#a9c4c0');p(x-2,72,7,3,'#d9e6d7');}}
    if(tier>=5){wall(46,43,14,20,'#e2e9dc','#a0b8b6');polygon([[43,43],[53,29],[63,43]],'#3e759e');}
  }else{
    // Living branches, hollow-trunk gateway and stone/root foundation.
    wall(7,151,89,67,'#83967a','#5f755f');
    polygon([[8,219],[19,96],[8,57],[27,44],[39,73],[36,133],[48,219]],OUTLINE);
    polygon([[11,216],[22,97],[11,59],[26,48],[36,74],[33,134],[44,216]],'#76533d');
    polygon([[38,218],[45,72],[37,39],[52,22-Math.min(tier,10)],[67,42],[59,95],[69,218]],OUTLINE);
    polygon([[41,218],[48,71],[40,40],[52,25-Math.min(tier,10)],[64,44],[56,96],[66,218]],'#986c48');
    polygon([[70,218],[77,100],[65,81],[79,60],[94,83],[89,117],[96,219]],'#614b39');
    for(const x of [24,49,57,82]){p(x,84,2,67,'#b18759');for(let y=90;y<150;y+=13)p(x+3,y,1,7,'#4e3b30');}
    polygon([[16,120],[5,91],[7,87],[25,115]],'#76533d');polygon([[58,113],[92,74],[96,77],[67,132]],'#986c48');
    leaf(1,34,38,19);leaf(29,13-Math.min(tier,8),44,24);leaf(67,49,38,20);
    if(tier>=4)leaf(32,88,40,15);if(tier>=7)leaf(1,127,28,15);
    for(const x of [12,43,80])window(x,154,'#d6cb81');
    for(const [x,dx] of [[20,-17],[37,-20],[62,21],[81,18]])polygon([[x,181],[x+6,212],[x+dx,234],[x+dx+7,236],[x+12,218],[x+8,181]],'#72553b');
    if(rf){p(3,67,95,6,OUTLINE);p(4,67,93,3,'#c5a174');p(4,70,93,2,'#7b573b');for(const x of [8,34,60,91])polygon([[x,72],[x+2,91],[x+7,91],[x+6,73],[x+12,72]],'#76533d');}
  }
  // Shared gameplay anchors, rendered in the materials of each architecture.
  const gx=62,gy=174,gate=el==='fire'?'#39364c':el==='water'?'#486d7a':'#493b2d';
  polygon([[gx-3,gy+39],[gx-3,gy],[gx+3,gy-9],[gx+13,gy-13],[gx+24,gy-7],[gx+27,gy+39]],OUTLINE);
  polygon([[gx,gy+38],[gx,gy],[gx+5,gy-6],[gx+13,gy-9],[gx+22,gy-5],[gx+24,gy+38]],gate);
  for(let x=gx+3;x<gx+24;x+=5){p(x,gy+12,3,25,el==='fire'?'#8b674c':'#947653');p(x,gy+1,1,12,'#c0c5b8');}
  p(gx+1,gy+28,22,2,'#343b42');p(gx+1,gy+7,22,1,'#c0c5b8');
  polygon([[65,213],[85,213],[101,190],[90,190]],OUTLINE);polygon([[67,212],[84,212],[98,192],[90,192]],el==='water'?'#b7c9c0':'#a28159');
  for(let i=0;i<4;i++)p(83-i*4,197+i*4,12,1,el==='water'?'#e4e9da':'#d0ad78');
  if(T.walls1)for(const x of [8,33,93])p(x,181,3,T.walls2?37:25,el==='fire'?'#94816d':el==='water'?'#e8eedc':'#aec29c');
  if(T.bastion)for(let y=226;y<H;y+=9){p(89,y,7,3,'#4a4d45');polygon([[93,y],[101,y+1],[94,y+4]],'#c3b888');}
  else for(let y=236;y<H;y+=8){p(90,y-8,7,14,'#775b40');p(92,y-10,3,3,'#c2a578');}
  if(rf)RAFTER_XS.forEach((x,i)=>p(x-3,68,6,1,i<rf?'#e6ba63':'#596456'));
  if(T.ballista1){p(78,97,18,4,'#574939');p(80,101,2,9,'#574939');p(91,101,2,9,'#574939');p(82,94,17,2,'#c6cfcd');polygon([[92,88],[100,94],[92,102],[95,95]],T.ballista3?'#e3b764':T.ballista2?'#99c5d2':'#aaa7a0');}
  if(T.fountain){p(100,118,8,4,'#7d9ca1');p(101,118,6,2,'#92dfea');p(103,111,2,8,'#d8f9ed');}
  for(let i=0;i<tier;i++)drawTrophy(g,5+i*7,220,i);
  R.castleKey=key;R.castle=cv;return cv;
}
function drawElementScenery(g,el){
  if(!ELEMENT_SCENES[el])return;
  if (ELEMENT_WORLDS[el]) { drawExtendedScenery(g,el); return; }
  const p=(x,y,w,h,col)=>{g.fillStyle=col;g.fillRect(x,y,w,h);};
  if(el==='fire'){
    // Volcano is behind the skyline. Lava remains outside the playable grid.
    for(let y=25;y<87;y++){const w=Math.floor((y-25)*.68);p(260-w,y,w*2,1,y<39?'#ad755c':'#6c5861');}
    p(255,26,10,2,'#ffc684');p(259,28,2,24,'#ec935e');
    for(let y=42;y<87;y++){const x=260+Math.round(Math.sin(y*.17)*3);p(x,y,2+Math.floor((y-42)/18),1,'#c37958');if(y%4<2)p(x,y,1,1,'#f3aa61');}
    for(let i=0;i<29;i++){const y=47+Math.floor(hash(i,3)*38),w=Math.floor((y-25)*.6),x=260-w+Math.floor(hash(i,4)*w*2);p(x,y,3+Math.floor(hash(i,5)*7),1,'#80616a');}
    for(let i=0;i<8;i++){const y=14-i*2;p(258-i,y,7+i,2,i%2?'#876c76':'#725d71');}
  }else if(el==='water'){
    p(121,75,198,3,'#c0d2c6');p(121,78,198,2,'#73989c');
    for(let x=125;x<315;x+=27){p(x,78,4,16,'#89aaa8');p(x-1,90,6,3,'#c0d2c6');p(x+4,80,20,2,'#a6c3b9');p(x+4,82,3,4,'#a6c3b9');p(x+21,82,3,4,'#a6c3b9');}
  }else{
    for(const [x,y,s] of [[132,78,1],[225,72,1.25],[287,82,.8]]){
      p(x,y-2,3,18,'#6f6048');p(x+1,y,1,13,'#9a8054');p(x-2,y+15,8,2,'#526e4c');
      for(let i=0;i<22;i++){
        const dx=Math.round((hash(i,x)-.5)*25*s),dy=Math.round((hash(i,y)-.5)*16*s);
        const col=dy>0?'#41664b':i%3===0?'#92ac72':'#6c925e';
        p(x+dx,y-7+dy,5+i%4,3+i%3,col);p(x+dx+1,y-9+dy,3+i%3,2,col);
        if(i%4===0)p(x+dx+2,y-8+dy,2,1,'#abc18b');
      }
      p(x+2,y+1,5,1,'#756447');p(x-3,y+5,5,1,'#756447');
    }
  }
}
function drawHordeCamp(g,fi){
  // Props are restricted to the distant sky/edge; never cover placement cells.
  const p=(x,y,w,h,col)=>{g.fillStyle=col;g.fillRect(x,y,w,h);};
  const x=415,y=76,F=FACTIONS[fi];p(x+23,y-23,2,33,'#67523d');p(x+25,y-22,12,9,F.tint);p(x+26,y-21,2,7,'#d9c494');
  if(fi===0||fi===6){p(x,y-15,3,25,'#735f46');p(x+15,y-15,3,25,'#735f46');p(x-2,y-17,22,4,'#b29165');p(x+3,y-25,12,8,'#74614a');for(let yy=y-8;yy<y+9;yy+=7)p(x,yy,18,2,'#806d50');if(fi===6){p(x-9,y+5,10,5,'#7e8291');p(x-8,y+3,8,2,'#a9acb4');}}
  else if(fi===1){p(x-10,y+2,42,7,'#537e72');p(x-5,y+3,29,2,'#82af91');for(const xx of [x-6,x+13]){p(xx,y-12,2,15,'#617f62');p(xx-3,y-14,7,3,'#8b9170');}}
  else if(fi===2){p(x,y-19,14,29,'#758090');p(x+3,y-24,8,5,'#758090');p(x+5,y-14,4,14,'#38485c');for(let i=0;i<3;i++){p(x-15+i*18,y+6,6,7,'#86908e');p(x-14+i*18,y+3,4,3,'#86908e');}}
  else if(fi===3){for(let yy=y-23;yy<y;yy++){const w=Math.floor((yy-y+24)*.65);p(x+7-w,yy,w*2,1,'#aa626d');if(yy%3===0)p(x+7,yy,w,1,'#e0b68b');}p(x-7,y,30,9,'#7c445e');p(x+4,y+2,7,7,'#43334c');}
  else if(fi===4){p(x+4,y-5,6,16,'#c8b59d');for(let yy=0;yy<12;yy++){const w=yy<6?yy*3:(12-yy)*3;p(x+7-w,y-17+yy,w*2,1,'#9d729d');}p(x,y-12,3,2,'#eed8b8');p(x+12,y-10,4,2,'#eed8b8');}
  else if(fi===5){for(const xx of [x-10,x+9]){p(xx,y-20,4,30,'#99b4c7');p(xx-2,y-20,8,3,'#c8e2e5');p(xx-3,y-10,10,3,'#c8e2e5');}p(x-10,y+10,40,2,'#d0e7e9');}
  else if(fi===7){p(x-8,y-11,34,20,'#8c775e');p(x-5,y-9,28,3,'#c0a26a');p(x+12,y-30,6,19,'#8c775e');p(x+10,y-32,10,3,'#c4b18c');for(const xx of [x-1,x+15]){p(xx,y,6,6,'#3e424e');p(xx+2,y+2,2,2,'#c4ad6e');}}
  else if(fi===8){p(x+4,y-30,2,29,'#896e50');for(let yy=0;yy<19;yy++)p(x+6,y-28+yy,Math.floor(yy*.9)+1,1,'#d7c9ae');p(x-9,y+1,39,3,'#695b4c');p(x-5,y+4,31,4,'#a88c63');}
  else if(fi===9){p(x-13,y+3,44,8,'#ad9967');for(let i=0;i<9;i++)p(x-10+i*4,y+1+(i%3),2,3,'#d6c797');p(x+5,y-10,2,12,'#a4906b');p(x-3,y-13,18,4,'#e7d8ba');}
}
