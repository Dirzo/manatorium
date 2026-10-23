// Static, integer-pixel terrain. Decoration never changes the combat grid or collision.
function drawElementTerrain(g, el) {
  if (ELEMENT_WORLDS[el]) { drawExtendedTerrain(g,el); return; }
  const p = (x,y,w,h,c) => { g.fillStyle=c; g.fillRect(Math.round(x),Math.round(y),w,h); };
  const poly = (points,c) => { g.fillStyle=c; g.beginPath(); points.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y)); g.closePath();g.fill(); };
  const fire=el==='fire', water=el==='water';
  const pal=fire ? {soil:'#685c59',shade:'#514851',fleck:'#87736b',bed:'#3b3745',stones:['#625d69','#706674','#7c707b'],light:'#94828a',seam:'#49424f',road:'#927e72'}
    : water ? {soil:'#779e99',shade:'#628e8b',fleck:'#a3c2ac',bed:'#6d969c',stones:['#b7cbc3','#c7d5c9','#a9c3bf'],light:'#e0e7d5',seam:'#779b9d',road:'#a6bcb1'}
    : {soil:'#709359',shade:'#5b7b49',fleck:'#94af6a',bed:'#52664c',stones:['#919b74','#a0a782','#85916b'],light:'#bec09a',seam:'#637451',road:'#9d9970'};
  p(0,94,W,H-94,pal.soil);
  // Broad patches read as a landscape, rather than a flat carpet of single-pixel noise.
  for(let i=0;i<110;i++) {
    const x=Math.floor(hash(i,21)*W),y=98+Math.floor(hash(i,22)*172),w=4+Math.floor(hash(i,23)*13);
    p(x,y,w,2,pal.shade);p(x+2,y-2,Math.max(2,w-4),2,pal.shade);
    if(i%3===0)p(x+2,y,w-2,1,pal.fleck);
  }
  // The approach bends from the castle gate into the horde's marching lane.
  for(let x=80;x<W;x++) {
    const yy=Math.round(180+34*Math.max(0,1-(x-80)/145));
    p(x,yy-11,1,23,pal.road);p(x,yy+11,1,2,pal.shade);
    if(hash(x,63)<.32)p(x,yy-8+Math.floor(hash(x,64)*17),2,1,pal.fleck);
  }
  const left=96,right=GRID.x+GRID.courtCols*GRID.cell,top=104;
  // Stepped outline gives each courtyard a built foundation, blended into its biome.
  if(fire) {
    poly([[left,top+12],[left+12,top],[right-12,top],[right,top+12],[right,258],[right-12,270],[left,270]],pal.bed);
    // Broad, chamfered basalt slabs are reinforced with riveted iron seams.
    for(let row=0;row<8;row++)for(let col=0;col<4;col++) {
      const x=left+3+col*23,y=top+5+row*21,h=hash(col,row+51);
      if(row===0&&(col===0||col===3))continue;
      poly([[x+3,y],[x+18,y],[x+21,y+3],[x+21,y+15],[x+18,y+18],[x+3,y+18],[x,y+15],[x,y+3]],pal.stones[Math.floor(h*3)]);
      p(x+4,y,13,1,pal.light);p(x+20,y+4,1,10,pal.seam);p(x+4,y+17,13,1,pal.seam);
      p(x+2,y+3,1,1,'#b7a393');p(x+18,y+14,1,1,'#b7a393');
      if(h>.6){p(x+8,y+6,1,5,pal.seam);p(x+9,y+10,4,1,pal.seam);}
    }
  }else if(water) {
    poly([[left,top+8],[left+8,top],[right-8,top],[right,top+8],[right,260],[right-8,268],[left,268]],pal.bed);
    // Pale limestone terraces surround inset blue mosaic squares.
    for(let row=0;row<7;row++)for(let col=0;col<4;col++) {
      const x=left+4+col*23,y=top+5+row*22;
      p(x,y,20,19,pal.stones[(row+col)%3]);p(x,y,20,1,pal.light);p(x,y+18,20,1,pal.seam);
      p(x+4,y+4,12,11,'#81afb4');p(x+5,y+5,10,9,'#b4d0cd');
      p(x+8,y+7,4,4,'#719faa');p(x+9,y+8,2,2,'#e7e7cb');
      if((col+row)%3===0)p(x+1,y+15,3,2,'#8aa79c');
    }
  }else {
    // The forest court is a clearing of separate, uneven stepping stones.
    // Grass and exposed roots remain visible between every placement cell.
    for(let row=0;row<7;row++)for(let col=0;col<4;col++) {
      const h=hash(col,row+34),x=GRID.x+col*22-7,y=GRID.y+row*22-5;
      poly([[x+3,y],[x+14,y-1],[x+18,y+3],[x+17,y+12],[x+12,y+16],[x+1,y+14],[x-1,y+7]],pal.seam);
      poly([[x+3,y],[x+13,y],[x+16,y+3],[x+15,y+11],[x+11,y+13],[x+2,y+12],[x+1,y+7]],pal.stones[Math.floor(h*3)]);
      p(x+4,y+1,8,1,pal.light);p(x+3,y+11,5,2,pal.shade);p(x+2,y+9,3,2,pal.fleck);
      if(h>.5){p(x+8,y+4,1,4,pal.seam);p(x+9,y+7,3,1,pal.seam);}
      p(x+17,y+17,3,1,'#a6bd78');p(x+18,y+15,1,3,'#a6bd78');
    }
  }
  if(fire) {
    // Basalt terrace with iron braces; molten channels stay beyond the placement cells.
    for(const y of [99,267])for(let x=89;x<345;x++) {
      const yy=y+Math.round(Math.sin(x*.065)*2);
      p(x,yy-2,1,7,'#423744');p(x,yy,1,3,'#e56e38');
      if(x%11<6)p(x,yy+1,1,1,'#ffc068');
    }
    for(let y=111;y<263;y+=22){p(190,y,4,15,'#393743');p(191,y+1,2,2,'#b6a1a0');p(191,y+12,2,2,'#b6a1a0');}
    // A stone causeway spans the upper lava trench; broken volcanic shelves flank it.
    p(102,97,79,8,'#44404b');for(let x=105;x<179;x+=11)p(x,97,9,2,'#81727b');
    for(const [x,y,w] of [[12,248,31],[51,259,32],[208,243,24],[276,119,19],[349,243,28]]) {
      poly([[x,y],[x+4,y-7],[x+w-6,y-9],[x+w,y-3],[x+w-2,y+4],[x,y+4]],'#413b48');
      p(x+5,y-7,w-13,2,'#8b7074');p(x+6,y-1,w-11,1,'#b56042');
    }
    for(const [x,y] of [[211,95],[308,96],[207,257]]) {
      p(x-3,y,7,4,'#383442');p(x-2,y-4,5,4,'#946b52');p(x-1,y-8,3,4,'#ed8845');p(x,y-7,1,2,'#ffce75');
    }
  } else if(water) {
    // The keep sits in a lake; its court is an island reached by bridges.
    for(let y=221;y<H;y++){const edge=91+Math.round(Math.sin(y*.1)*4);p(0,y,edge,1,'#497f97');}
    for(let x=88;x<344;x++) {
      const yy=260+Math.round(Math.sin(x*.04)*3);p(x,yy,1,H-yy,'#49889f');p(x,yy-2,1,2,'#cee0ce');
      if(x%13<7)p(x,yy+4,1,1,'#94c8cb');
    }
    p(192,108,10,148,'#4c899f');p(192,108,2,148,'#d2dfcc');p(201,108,2,148,'#b6d1c4');
    for(let y=113;y<255;y+=17)p(196,y,4,1,'#a0d4d4');
    // Three crossings keep the visual canal from reading as a blocked combat route.
    for(const y of [133,177,221]){p(189,y-7,16,15,'#768f92');p(189,y-7,16,2,'#e1e7d4');p(189,y+6,16,2,'#a6c0b8');for(let x=190;x<204;x+=4)p(x,y-4,3,9,'#c3d1c6');}
    for(const [x,y] of [[104,103],[182,103],[183,251]]) {
      p(x-3,y,8,4,'#5c818b');p(x-2,y-10,6,10,'#c9d9cf');p(x-4,y-12,10,3,'#e1e9d8');p(x,y-9,2,8,'#91b4b7');
    }
    // Water gardens and reeds around the outer bank, outside the battlefield.
    for(const [x,y] of [[27,255],[63,248],[224,262],[299,264],[349,253]]) {
      p(x-4,y,12,2,'#709ca1');p(x,y-2,6,2,'#8bb08a');p(x+3,y-3,2,1,'#d6d690');
      p(x-3,y-10,1,10,'#496c60');p(x-5,y-7,2,1,'#a1bc90');
    }
    for(let i=0;i<16;i++){const x=Math.floor(hash(i,91)*80),y=235+Math.floor(hash(i,92)*32);p(x,y,4+i%4,1,'#83b9c3');}
  } else {
    // A moss-covered clearing and timber footways grow from the living fortress.
    for(const y of [102,261])for(let x=87;x<315;x+=3){const yy=y+Math.round(Math.sin(x*.065)*3);p(x,yy,5,4,'#426343');if(x%9===0)p(x,yy-1,4,2,'#92ad66');}
    for(const [x,y,dx] of [[88,239,38],[84,254,63],[188,111,26],[184,253,44]]) {
      for(let i=0;i<dx;i++){const yy=y+Math.round(Math.sin(i*.08)*4);p(x+i,yy,1,4,'#58483b');p(x+i,yy,1,1,'#a18253');}
    }
    for(const y of [137,225]){p(189,y-5,18,12,'#554734');for(let x=191;x<205;x+=4){p(x,y-5,3,10,'#967952');p(x,y-5,3,1,'#c0a272');}}
    for(let i=0;i<32;i++){
      const x=205+Math.floor(hash(i,71)*122),y=113+Math.floor(hash(i,72)*145);
      p(x,y,3,1,'#abc583');p(x+1,y-2,1,3,'#b5cc90');if(i%5===0)p(x+1,y-3,2,2,'#e4c57d');
    }
    for(const [x,y] of [[18,251],[53,262],[207,257],[303,99],[354,247]]) {
      p(x-8,y,19,4,'#42613e');p(x-5,y-4,13,5,'#60854b');p(x-2,y-6,7,3,'#88a35e');
      p(x+5,y-7,2,7,'#ddc2a0');p(x+3,y-9,6,3,'#b98164');p(x+4,y-9,2,1,'#edd0a1');
    }
  }
}
