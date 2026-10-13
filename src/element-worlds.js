// Each world specifies both materials and construction, independently of the horde.
const ELEMENT_WORLDS = {
  ice: {sky:['#6f94b7','#d7e5ef'],hill:'#8eaabb',soil:'#c2d9db',shade:'#9fbec7',fleck:'#e9f3ed',bed:'#719cac',stone:'#d6edf0',light:'#f6ffff',accent:'#72b7d3',road:'#b0c8d1'},
  lightning: {sky:['#3b4666','#9ca7b2'],hill:'#58677b',soil:'#6b7478',shade:'#555e68',fleck:'#93979a',bed:'#313c51',stone:'#68788c',light:'#9bafba',accent:'#9ee5ed',road:'#87918e'},
  dark: {sky:['#26213e','#86708e'],hill:'#50415f',soil:'#63566d',shade:'#4c4058',fleck:'#82728b',bed:'#302b40',stone:'#6d5d7c',light:'#9685a4',accent:'#b18bd4',road:'#827183'},
  light: {sky:['#88abcb','#f3e6c2'],hill:'#aab4a0',soil:'#c3be91',shade:'#a4a77e',fleck:'#e1d9ad',bed:'#afa686',stone:'#e2dfc6',light:'#fff7db',accent:'#d5b365',road:'#ded1a7'},
  void: {sky:['#17132d','#625175'],hill:'#39324e',soil:'#4f4966',shade:'#383349',fleck:'#726481',bed:'#211d36',stone:'#6d6086',light:'#a188b7',accent:'#b098ee',road:'#756884'},
  salty: {sky:['#6b99b1','#dce6cd'],hill:'#789da5',soil:'#b8c5bc',shade:'#91aaa7',fleck:'#e3e7d4',bed:'#7e999d',stone:'#d9dfcf',light:'#f8f5e4',accent:'#668eaa',road:'#c5c9b4'},
  sweet: {sky:['#aaa0c9','#f3d7d0'],hill:'#bb9eae',soil:'#c6adae',shade:'#a18c9f',fleck:'#e6c5c3',bed:'#967585',stone:'#edc5ce',light:'#fff0db',accent:'#b583aa',road:'#e2c8b1'},
  meat: {sky:['#7a6669','#d8b08e'],hill:'#947b6d',soil:'#957c68',shade:'#756354',fleck:'#bba084',bed:'#554c43',stone:'#997256',light:'#c49e72',accent:'#dfb99a',road:'#b49674'},
  treat: {sky:['#a5aeb1','#eee0ba'],hill:'#a49f77',soil:'#b3a173',shade:'#918757',fleck:'#d5c18a',bed:'#826348',stone:'#c9a268',light:'#ecd197',accent:'#ab754d',road:'#d3b684'}
};
for (const [el,s] of Object.entries(ELEMENT_WORLDS)) ELEMENT_SCENES[el]={sky:s.sky,hill:s.hill,ground:s.soil,edge:s.fleck,grass:s.shade,fleck:s.fleck,road:s.road};

function worldPainter(g) {
  const p=(x,y,w,h,c)=>{g.fillStyle=c;g.fillRect(Math.round(x),Math.round(y),w,h);};
  const poly=(pts,c)=>{g.fillStyle=c;g.beginPath();pts.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));g.closePath();g.fill();};
  const ring=(x,y,r,col)=>{for(let dy=-r;dy<=r;dy++){const w=Math.round(Math.sqrt(r*r-dy*dy));p(x-w,y+dy,w*2+1,1,col);}};
  return {p,poly,ring};
}

function drawExtendedTerrain(g,el) {
  const s=ELEMENT_WORLDS[el],{p,poly,ring}=worldPainter(g);
  p(0,94,W,H-94,s.soil);
  for(let i=0;i<125;i++){
    const x=Math.floor(hash(i,54)*W),y=98+Math.floor(hash(i,55)*172),w=3+Math.floor(hash(i,56)*12);
    p(x,y,w,2,s.shade);if(i%3===0)p(x+1,y-1,w-2,1,s.fleck);
  }
  // Shared approach connects the gate to the marching lane, using local materials.
  for(let x=80;x<W;x++){
    const y=Math.round(180+34*Math.max(0,1-(x-80)/145));
    p(x,y-11,1,23,s.road);p(x,y+12,1,1,s.shade);
    if(hash(x,32)>.7)p(x,y-7+Math.floor(hash(x,33)*15),2,1,s.fleck);
  }
  const L=96,T=104,RIGHT=192;
  const court=(c=s.bed)=>poly([[L,T+8],[L+8,T],[RIGHT-8,T],[RIGHT,T+8],[RIGHT,258],[RIGHT-8,270],[L,270]],c);
  const edgePosts=(col)=>{for(const [x,y] of [[101,103],[187,103],[187,255]]){p(x-2,y-8,5,12,col);p(x-3,y-9,7,2,s.light);p(x,y-7,1,8,s.accent);}};
  if(el==='ice') {
    // Separate polygonal ice floes and branching seams instead of masonry courses.
    court();
    for(let row=0;row<7;row++)for(let col=0;col<4;col++){
      const x=L+4+col*23,y=T+3+row*23,h=hash(col,row+41);
      poly([[x+2,y],[x+16,y],[x+20,y+5],[x+18,y+18],[x+7,y+20],[x,y+14]],h>.4?s.stone:'#bcdae3');
      p(x+3,y+1,12,1,s.light);p(x+17,y+6,1,8,s.accent);p(x+7,y+12,5,1,s.accent);p(x+11,y+9,1,4,s.accent);
    }
    for(const [x,y] of [[20,254],[72,259],[210,101],[287,99],[306,258],[353,246]]){
      poly([[x-4,y],[x-3,y-12],[x,y-20],[x+4,y-11],[x+4,y]],'#7eacc4');p(x,y-17,1,15,'#e1f9fa');
      poly([[x+4,y],[x+8,y-10],[x+11,y],[x+4,y]],'#b1d6e2');p(x-6,y,19,2,s.light);
    }
    for(let x=0;x<350;x+=7)p(x,267+Math.round(Math.sin(x*.08)*2),7,3,'#eff4e9');
  }else if(el==='lightning') {
    court();
    for(let row=0;row<7;row++)for(let col=0;col<4;col++){
      const x=L+3+col*23,y=T+3+row*23;p(x,y,20,20,s.stone);p(x+1,y,18,1,s.light);p(x+18,y+2,1,16,s.bed);
      p(x+4,y+4,12,12,'#536475');p(x+6,y+6,8,8,'#76889a');for(const dx of [2,17])for(const dy of [2,17])p(x+dx,y+dy,1,1,'#d2c6a0');
    }
    // Copper busbars and conductors run along the court's edges.
    for(const x of [98,190]){p(x,111,2,150,'#bb9565');p(x+1,111,1,150,'#e3c38a');}
    for(const y of [107,174,263]){p(98,y,94,2,'#b78b5c');p(98,y,94,1,'#e1bf86');}
    for(const [x,y] of [[207,100],[279,99],[207,258],[312,258]]){p(x-4,y,9,4,'#36445a');p(x,y-15,2,15,'#a8bbc3');for(let yy=y-13;yy<y;yy+=4){p(x-3,yy,8,2,'#c19a65');p(x-2,yy,6,1,s.accent);}p(x-2,y-17,6,2,s.accent);}
  }else if(el==='dark') {
    court();
    for(let row=0;row<8;row++)for(let col=0;col<4;col++){
      const x=L+4+col*23,y=T+3+row*21;
      poly([[x+9,y],[x+19,y+9],[x+9,y+18],[x,y+9]],s.stone);p(x+8,y+1,3,1,s.light);p(x+9,y+7,1,5,s.bed);
    }
    edgePosts('#514358');
    for(const [x,y] of [[14,250],[58,257],[212,98],[297,98],[347,250]]){p(x-5,y,13,3,'#3c334d');p(x-2,y-11,6,11,'#75627f');poly([[x-4,y-11],[x+1,y-18],[x+6,y-11]],'#9b86a4');p(x,y-8,2,5,'#b796d4');}
    // Low lilac mist breaks the soil silhouette without obscuring defenders.
    for(let x=3;x<350;x+=19){p(x,265,14,2,'#85738f');p(x+4,264,8,1,'#9b88a3');}
  }else if(el==='light') {
    court();
    for(let y=T+3;y<270;y+=16)for(let x=L+3;x<190;x+=16){p(x,y,14,14,s.stone);p(x,y,14,1,s.light);p(x+6,y+6,3,3,'#c8b68c');}
    // A radiant medallion is set into the marble rather than drawn over units.
    ring(145,186,29,'#c5ab70');ring(145,186,27,'#f2e7bd');ring(145,186,22,'#c5ab70');ring(145,186,20,'#e7dfbf');
    for(let i=-15;i<=15;i++){const w=15-Math.abs(i);if(Math.abs(i)<2||w<3)p(145-w,186+i,w*2+1,1,'#d6b462');}
    edgePosts('#dfddc5');
    for(const [x,y] of [[23,256],[66,252],[212,98],[294,98],[346,251]]){p(x-4,y,10,3,'#a6a085');p(x-2,y-12,6,12,'#e8e1c7');p(x-3,y-14,8,2,'#f7ebc8');p(x,y-12,1,11,'#c9b57a');}
    for(let i=0;i<22;i++){const x=210+Math.floor(hash(i,44)*113),y=110+Math.floor(hash(i,45)*145);p(x,y,3,1,'#e7d8a2');p(x+1,y-1,1,3,'#e7d8a2');}
  }else if(el==='void') {
    // Three fractured floating terraces, joined by narrow violet energy spans.
    p(96,105,96,165,'#211c36');
    for(let row=0;row<7;row++)for(let col=0;col<4;col++){
      const x=L+3+col*23,y=T+4+row*23;
      poly([[x+2,y],[x+18,y],[x+20,y+4],[x+18,y+17],[x+4,y+20],[x,y+15]],s.stone);
      p(x+3,y,13,1,s.light);p(x+4,y+18,9,1,'#9e81c2');p(x+10,y+6,1,5,s.bed);
      if(col<3)p(x+20,y+9,3,2,'#9b74d3');if(row<6)p(x+8,y+20,2,3,'#9b74d3');
    }
    for(const [x,y] of [[23,252],[65,261],[213,99],[302,99],[215,255],[351,251]]){
      p(x-8,y+3,18,2,s.shade);poly([[x,y-14],[x+8,y-5],[x+1,y+1],[x-7,y-6]],'#8f72ba');p(x,y-13,1,13,'#c1a1ee');p(x+1,y-1,5,1,'#4b3a68');
    }
    for(let x=99;x<332;x++){const y=268+Math.round(Math.sin(x*.08)*2);p(x,y,1,2,'#9870cd');}
  }else if(el==='salty') {
    court('#b6c5bb');
    for(let row=0;row<7;row++)for(let col=0;col<4;col++){
      const x=L+3+col*23,y=T+4+row*23;
      p(x,y,20,19,s.stone);p(x+2,y,15,2,s.light);p(x+17,y+3,3,13,'#a3bcb8');p(x+4,y+14,4,2,'#b7c8bf');
      p(x+7,y+5,6,1,s.light);p(x+9,y+3,2,5,s.light);
    }
    // The salt fort's wooden causeways and tidal flats are distinct from Water canals.
    for(const y of [131,218]){p(96,y,107,9,'#6a7877');for(let x=97;x<202;x+=6){p(x,y,5,7,'#a0a593');p(x,y,5,1,'#e0d8b8');}}
    for(let x=0;x<350;x++){const y=260+Math.round(Math.sin(x*.05)*3);p(x,y,1,H-y,'#638d9e');if(x%17<9)p(x,y,1,2,'#e1e6d3');}
    for(const [x,y] of [[18,254],[62,253],[211,100],[286,100],[347,255]]){p(x-5,y,13,3,s.light);p(x-2,y-5,6,5,'#e5e8d9');p(x,y-9,2,5,'#f5f4e4');p(x+5,y-3,3,3,'#d5ddd1');}
  }else if(el==='sweet') {
    court('#ab8595');
    for(let row=0;row<7;row++)for(let col=0;col<4;col++){
      const x=L+3+col*23,y=T+3+row*23,c=(row+col)%2?'#efcad3':'#f3e0c7';
      p(x,y,20,20,c);p(x+1,y,18,2,'#fff0dc');p(x+2,y+18,18,2,'#bf9ca3');
      if((col+row)%3===0){p(x+6,y+7,5,2,'#c895b2');p(x+11,y+11,2,3,'#99b9be');}
    }
    for(const x of [98,191])for(let y=107;y<263;y+=5){p(x,y,2,5,(y%10<5)?'#efd8cb':'#c78fa2');}
    for(const [x,y] of [[17,252],[58,258],[211,99],[291,99],[348,249]]){p(x,y-14,2,16,'#ddccb7');ring(x+1,y-16,5,'#bb8dac');ring(x+1,y-16,3,'#efc7d4');p(x,y-18,2,4,'#fff0d8');p(x-4,y+1,11,2,s.shade);}
    for(let i=0;i<22;i++){const x=210+Math.floor(hash(i,83)*116),y=112+Math.floor(hash(i,84)*140);p(x,y,3,1,i%2?'#eed9b9':'#a682b0');}
  }else if(el==='meat') {
    // Charred timber planks and rib braces form a smokehouse yard.
    court();
    for(let y=107;y<270;y+=8)for(let col=0;col<4;col++){
      const x=L+3+col*23;p(x,y,21,6,(Math.floor(y/8)+col)%3?s.stone:'#87664f');p(x,y,21,1,s.light);p(x+2,y+3,12,1,'#75533f');p(x+18,y+2,1,1,'#d9c19e');
    }
    for(const x of [99,190]){p(x,109,2,150,'#d7c1a0');for(let y=113;y<259;y+=20)p(x-1,y,4,3,'#e9d6b3');}
    for(const [x,y] of [[18,254],[66,258],[215,99],[289,99],[350,252]]){p(x-7,y,16,4,'#4d4844');p(x-5,y-2,12,2,'#827266');p(x-3,y-3,8,2,'#cf9b6a');p(x-2,y-5,6,2,'#e4bd81');p(x+1,y-8,2,2,'#9a897d');}
    for(const y of [103,265])for(let x=105;x<313;x+=16){p(x,y,11,2,'#bda286');p(x+1,y-1,3,4,'#ddc5a3');}
  }else if(el==='treat') {
    court('#916c4c');
    // Large waffle slabs have deep square pockets and baked, uneven edges.
    for(let row=0;row<7;row++)for(let col=0;col<4;col++){
      const x=L+3+col*23,y=T+4+row*23;p(x,y,20,19,s.stone);p(x+1,y,18,2,s.light);p(x,y+17,20,2,'#a67d4f');
      for(const dx of [3,11])for(const dy of [4,11]){p(x+dx,y+dy,6,5,'#ad7e4d');p(x+dx+1,y+dy+1,4,3,'#dab373');p(x+dx+1,y+dy+4,4,1,'#e8c68b');}
    }
    for(const y of [106,263]){p(98,y,94,2,'#ddb96f');p(98,y+1,94,1,'#f2d99c');}
    for(const [x,y] of [[19,253],[67,257],[211,99],[296,99],[348,251]]){
      p(x,y-14,1,15,'#89683e');for(let dy=2;dy<12;dy+=3){p(x-3,y-dy,3,2,'#dbc18a');p(x+1,y-dy-1,3,2,'#e4cd96');}p(x-6,y+1,13,2,s.shade);
    }
    for(let i=0;i<30;i++){const x=209+Math.floor(hash(i,95)*115),y=111+Math.floor(hash(i,96)*145);p(x,y,2+i%2,1,'#e2c991');}
  }
}

function drawExtendedScenery(g,el) {
  const s=ELEMENT_WORLDS[el],{p,poly,ring}=worldPainter(g);
  if(el==='ice') {
    for(const [x,y,w] of [[151,58,38],[224,34,65],[295,65,36]]){poly([[x-w/2,94],[x,y],[x+w/2,94]],'#9fbeca');poly([[x,y],[x+8,y+16],[x+4,y+14],[x-3,y+18],[x-9,y+17]],'#edf4ed');p(x+1,y+18,2,25,'#c2dce0');}
  }else if(el==='lightning') {
    for(const [x,y] of [[139,68],[228,56],[299,71]]){p(x,y,3,29,'#576c80');for(let yy=y;yy<y+16;yy+=4){p(x-5,yy,13,2,'#8e9eaa');p(x-3,yy,9,1,'#b3bfc0');}p(x+1,y-8,1,8,'#b8d4d8');}
    poly([[238,20],[231,31],[235,31],[229,42],[242,28],[236,28]],'#c5e0df');
  }else if(el==='dark') {
    ring(240,30,12,'#b3a5bd');ring(246,27,12,s.sky[0]);
    for(const [x,y] of [[135,77],[220,64],[298,74]]){p(x,y,6,20,'#615469');p(x-5,y+17,17,2,'#5a4c63');poly([[x-3,y],[x+3,y-8],[x+10,y]],'#70607d');p(x+2,y+6,2,5,'#b193c6');}
  }else if(el==='light') {
    p(125,76,186,4,'#d9d6b9');p(125,75,186,1,'#f0e3ba');for(let x=133;x<304;x+=25){p(x,80,4,14,'#b5b99f');p(x-2,80,8,2,'#e4dfc0');p(x-2,93,8,2,'#d9d6b9');}
    poly([[189,75],[216,57],[243,75]],'#e4d4a4');p(196,73,40,2,'#b9ad87');
  }else if(el==='void') {
    ring(243,37,19,'#89709e');ring(243,37,15,'#30223f');ring(247,34,11,'#181326');
    for(let i=0;i<18;i++){const x=130+Math.floor(hash(i,11)*186),y=49+Math.floor(hash(i,12)*42);p(x,y,4+i%6,3,'#5d4c73');p(x,y,4+i%6,1,'#9780ae');}
  }else if(el==='salty') {
    p(112,87,220,8,'#729da9');for(let x=112;x<332;x+=17)p(x,90,9,1,'#b4cdcd');
    for(const [x,y] of [[144,82],[214,74],[293,84]]){poly([[x-16,94],[x-9,y],[x,y-3],[x+13,94]],'#d6dfcf');p(x-8,y+3,6,1,'#edf0dc');}
  }else if(el==='sweet') {
    for(const [x,y] of [[139,81],[225,68],[294,83]]){p(x,y,2,15,'#a2858b');ring(x+1,y-8,10,'#c5a0b4');ring(x-2,y-10,5,'#e4bfc8');p(x-4,y-10,3,2,'#f2d7cd');}
    p(157,87,27,6,'#cfb6bd');p(160,85,21,2,'#efceca');
  }else if(el==='meat') {
    for(const [x,y] of [[144,78],[223,71],[290,80]]){p(x-10,y,24,16,'#7e6a5c');poly([[x-13,y],[x,y-12],[x+17,y]],'#9c7c65');p(x+8,y-19,4,12,'#7e6a5c');p(x+7,y-22,6,2,'#a18c7e');p(x-2,y+5,6,9,'#514a46');}
  }else if(el==='treat') {
    for(let x=121;x<318;x+=13){p(x,86,1,8,'#a58d58');p(x-2,81,5,5,'#cdb986');p(x-1,79,3,2,'#e1cf9d');}
    p(235,72,4,22,'#907d58');p(228,84,18,10,'#b2a078');poly([[225,84],[237,72],[249,84]],'#d2bf92');p(235,58,3,27,'#b8ac89');p(224,68,26,3,'#dbd0ab');
  }
}
