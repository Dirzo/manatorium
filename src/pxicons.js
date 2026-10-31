// ===== Hand-made pixel icons (Cam 2026-10-31: "create unique art for each icon instead of emojis") =====
// Every class, race, element, personality, boon, tactic, combo, tech branch and HUD button gets its own 10x10 map,
// drawn with the same ink outline as the 16px sprites. pxi(name) returns an <img> tag; pxiURL(name) a data URL.
const PXI_PAL = {
  k: '#1a1230', w: '#ffffff', W: '#c9d4ee', s: '#c9d0ea', S: '#8a94b8', d: '#555a80',
  y: '#ffcf3a', Y: '#fff1a8', o: '#ff8a3a', O: '#ffd0b0', a: '#c86a1a',
  r: '#ff3d6e', R: '#ff7a9a', m: '#b0204a',
  c: '#5fd3ff', C: '#bff4ff', u: '#3a64c9', U: '#24408a',
  g: '#3a9a4a', G: '#7ce05a', l: '#1f6a3a',
  p: '#a98aff', P: '#d8c8ff', v: '#6a3ab0',
  b: '#9a6332', B: '#5a3a1a', t: '#e8b07a', T: '#ffd8b0',
  n: '#ff9fd0', N: '#ffd0ea', e: '#efe6cc', x: '#2a1a4a', z: '#000000',
};
const PXI = {
  // ---- classes ----
  'cls-guardian': ['.yyyyyyyy.', 'yuuuuuuuuy', 'yuCCuuuuuy', 'yuCuuyyuuy', 'yuuuyyyyuy', 'yuuuuyyuuy', '.yuuuyyuy.', '.yuuuuuuy.', '..yuuuuy..', '...yyyy...'],
  'cls-berserker': ['.SS....SS.', 'SsSS..SSsS', 'SssS..SssS', '.SSbbbbSS.', '...bbbb...', '...b..b...', '..b....b..', '.b......b.', 'b........b', '..........'],
  'cls-ranger': ['......bb..', '.....w..b.', '....w....b', '...w.....b', 'rrbbbbbbbS', '...w.....b', '....w....b', '.....w..b.', '......bb..', '..........'],
  'cls-mage': ['....y.....', '...yYy....', '.yyYwYyy..', '..yYYYy...', '...y.y..pp', '..y...ypPp', '......pPPp', '.....pPp..', '....pp....', '...pp.....'],
  'cls-cleric': ['...yyyy...', '...yYYy...', '.yyyYYyyy.', 'yYYYwwYYYy', 'yYYYwwYYYy', '.yyyYYyyy.', '...yYYy...', '...yYYy...', '...yYYy...', '...yyyy...'],
  'cls-rogue': ['........sw', '.......sws', '......sws.', '.....sws..', '..y.sws...', '...yws....', '...byy....', '..bb..y...', '.bb.......', 'vv........'],
  // ---- races ----
  'race-human': ['..SSSSSS..', '.SssssssS.', 'SsSSSSSSsS', 'SsTTTTTTsS', 'SsTkTTkTsS', 'SsTTTTTTsS', '.STTttTTS.', '..TTTTTT..', '...uuuu...', '..uuuuuu..'],
  'race-elf': ['...GGGG...', '..GggggG..', 'T.gTTTTg.T', 'TTTTTTTTTT', '.TTkTTkTT.', '..TTTTTT..', '..TTttTT..', '...TTTT...', '...gGGg...', '..gGGGGg..'],
  'race-dwarf': ['..SSSSSS..', '.SsSSSSsS.', '.SSSSSSSS.', '.TTkTTkTT.', '.TTTTTTTT.', 'oooTttTooo', 'oOooooooOo', '.oOooooOo.', '..oOooOo..', '...oooo...'],
  'race-orc': ['..GGGGGG..', '.GGGGGGGG.', 'GGrkGGkrGG', 'GGGGGGGGGG', 'GGGggggGGG', 'GwGkkkkGwG', 'GwGGGGGGwG', '.GGGGGGGG.', '..GGGGGG..', '..........'],
  'race-skeleton': ['..eeeeee..', '.eeeeeeee.', 'eeeeeeeeee', 'eekkeekkee', 'eekkeekkee', 'eeeeeeeeee', '.eeekkeee.', '..eeeeee..', '..ekekek..', '..eeeeee..'],
  'race-beast': ['.nn....nn.', 'nNNn..nNNn', 'nNNn..nNNn', '.nn....nn.', '..........', '...nnnn...', '..nNNNNn..', '.nNNNNNNn.', '.nNNNNNNn.', '..nnnnnn..'],
  'race-toad': ['.GG....GG.', 'GwkG..GkwG', 'GkkGGGGkkG', 'GGGGGGGGGG', 'GGGGGGGGGG', 'GrrrrrrrrG', 'GGGGGGGGGG', '.GYYYYYYG.', '.GYYYYYYG.', '..GG..GG..'],
  // ---- elements ----
  'el-fire': ['....r.....', '...rr...r.', '...rrr.rr.', '..rrorrrr.', '.rrooorrr.', '.rroOoorr.', 'rroOYOoorr', 'rroOYYOorr', '.rroYYorr.', '..rrrrrr..'],
  'el-water': ['....c.....', '....c.....', '...cCc....', '...cCc....', '..cCwCc...', '.cCwCCCc..', '.cCCCCCc..', '.ucCCCcu..', '..uuccuu..', '...uuuu...'],
  'el-nature': ['......GGG.', '....GGGGG.', '...GGlGGG.', '..GGlGGGG.', '..GlGGGG..', '.GlGGGG...', '.lGGGG....', '.l........', 'l.........', '..........'],
  'el-ice': ['....C.....', '..C.C.C...', '...CwC....', 'C.cCwCc.C.', '.CCwwwCC..', 'C.cCwCc.C.', '...CwC....', '..C.C.C...', '....C.....', '..........'],
  'el-lightning': ['....yyyy..', '...yYYy...', '..yYYy....', '.yYYyyyy..', 'yYYYYYYy..', '...yYYy...', '..yYYy....', '.yYy......', 'yYy.......', 'y.........'],
  'el-dark': ['...vvvv...', '..vxxxpv..', '.vxxxxpPv.', 'vxxxxxpPPv', 'vxxxxpPPPv', 'vxxxxpPPPv', 'vxxxxxpPPv', '.vxxxxxpv.', '..vxxxxv..', '...vvvv...'],
  'el-light': ['....y.....', '.y..y..y..', '..yYYYy...', '..YYwYY...', 'yyYwwwYyy.', '..YYwYY...', '..yYYYy...', '.y..y..y..', '....y.....', '..........'],
  'el-void': ['...pppp...', '.pp....p..', 'p..vvv..p.', 'p.v...v.p.', 'p.v.k.v..p', 'p..v..v..p', '.p..vv..p.', '..p....p..', '...pppp...', '..........'],
  'el-salty': ['..wwwwww..', '.wsssssw..', '.wSsSsSw..', '.wsssssw..', '.WWWWWWW..', '.WwwwwwW..', '.WwwwwwW..', '.WwwwwwW..', '.WWWWWWW..', '..........'],
  'el-sweet': ['n........n', 'nn..nn..nn', 'nNnnNNnnNn', '.nNNwNNNn.', '.nNwNNNNn.', '.nNNNNNNn.', 'nNnnNNnnNn', 'nn..nn..nn', 'n........n', '..........'],
  'el-meat': ['......ee..', '.....eeee.', '....beee..', '..rrrbe...', '.rRRRrr...', 'rRRRRRrr..', 'rRmRRRmr..', 'rRRRRRRr..', '.rrRRRr...', '..rrrr....'],
  'el-treat': ['...rrrr...', '..rrRRrr..', '..rrrrrr..', '.nnnnnnnn.', 'nNwNNNwNNn', 'nnnnnnnnnn', '.ybybybyb.', '.ybybybyb.', '..ybybyb..', '..........'],
  // ---- personalities ----
  'tmp-heroic': ['...yyyy...', '..yTTTTy..', '..TkTTkT..', '..TTttTT..', '...TTTT...', 'rr.uuuu.rr', 'rRruuuurRr', '.rRuyyuRr.', '..ruuuur..', '..uu..uu..'],
  'tmp-cheerful': ['..yyyyyy..', '.yYYYYYYy.', 'yYYkYYkYYy', 'yYYkYYkYYy', 'yYYYYYYYYy', 'yRYkYYkYRy', 'yYYYkkYYYy', '.yYYYYYYy.', '..yyyyyy..', '..........'],
  'tmp-honorable': ['.uu....rr.', '..uu..rr..', '...urrr...', '....ur....', '...yyyy...', '..yYYYYy..', '..yYwYYy..', '..yYYYYy..', '...yyyy...', '..........'],
  'tmp-wholesome': ['.bb....bb.', 'bBtbbbbtBb', '.bbtttbbb.', '.bkbbbkbb.', '.bbbttbbb.', '..bbkkbb..', '.bbbttbbb.', 'bbbttttbbb', '.bbbttbbb.', '..bb..bb..'],
  'tmp-zealous': ['....r.....', '...ror....', '...roor...', '..roYoor..', '.roYYYor..', '.roYwYor..', '.rooYoor..', '..roooor..', '...rrrr...', '..........'],
  'tmp-wise': ['.bb....bb.', '.bbbbbbbb.', 'bYYbbbbYYb', 'bYkYbbYkYb', 'bYYbyybYYb', '.bbbyybbb.', '.bttbbttb.', '.bttttttb.', '..bbbbbb..', '...y..y...'],
  'tmp-loyal': ['.BB...BB..', 'BbbB.BbbB.', 'Bbbbbbbbb.', '.bkbbbkbb.', '.bbbbbbbb.', '..bbkkbbr.', '..bbbbrrr.', '...bbbr...', '..........', '..........'],
  'tmp-optimistic': ['..rrrrrr..', '.rooooooR.', 'royyyyyyor', 'roygggggyo', 'rygcccccgy', 'ygcu..ucgy', 'gcu....ucg', 'cu......uc', 'w........w', 'ww......ww'],
  'tmp-angry': ['..rrrrrr..', '.rRRRRRRr.', 'rRkRRRRkRr', 'rRRkRRkRRr', 'rRkkRRkkRr', 'rRRRRRRRRr', 'rRRkkkkRRr', '.rRkRRkRr.', '..rrrrrr..', '..........'],
  'tmp-deranged': ['..pppppp..', '.pPPPPPPp.', 'pPkkPPkkPp', 'pkPkPkPkPp', 'pPkkPPkkPp', 'pPPPPPPPPp', 'pPkkkkkkPp', '.pPkwwkPp.', '..pppGpp..', '......G...'],
  'tmp-greedy': ['...yyyy...', '....bb....', '...bbbb...', '..btttbb..', '.btttttbb.', 'bttyyyttbb', 'bttyttttbb', 'btttyyttbb', '.bttttytb.', '..bbbbbb..'],
  'tmp-cowardly': ['..cccccc..', '.cCCCCCCc.', 'cCwkCCwkCc', 'cCwwCCwwCc', 'cCCCCCCCCc', 'cCCCkkCCCc', 'cCCkkkkCCc', '.cCCkkCCc.', '..cccccc..', 'c........c'],
  'tmp-vain': ['...yyyy...', '..yCCCCy..', '.yCwCCCCy.', '.yCCwCCCy.', '.yCCCCCCy.', '..yCCCCy..', '...yyyy...', '....yy....', '....yy....', '...yyyy...'],
  'tmp-cruel': ['r........r', 'rr......rr', '.rrrrrrrr.', 'rRRRRRRRRr', 'rRyRRRRyRr', 'rRRRRRRRRr', 'rRwRwRwRRr', '.rRRRRRRr.', '..rrrrrr..', '..........'],
  'tmp-paranoid': ['..........', '...wwww...', '.wwWWWWww.', 'wWWcuucWWw', 'wWcukkucWw', 'wWWcuucWWw', '.wwWWWWww.', '...wwww...', '..........', '..........'],
  'tmp-lazy': ['......CCC.', '.......C..', '......CCC.', '..CC......', '...C......', '..CC......', '..........', '.pppppppp.', 'pPPPPPPPPp', 'pppppppppp'],
  // ---- boons ----
  'boon-warchest': ['..........', '.bbbbbbbb.', 'bBBBBBBBBb', 'bbbbyybbbb', 'yyyyYYyyyy', 'bbbbyybbbb', 'bBBBBBBBBb', 'bBBBBBBBBb', 'bbbbbbbbbb', '..........'],
  'boon-parts': ['..S.S.....', '.SSSSS....', 'SSsssSS...', '.Ss.sS.bb.', 'SSsssSSbBb', '.SSSSS.bBb', '..S.S..bBb', '.....bbbBb', '....bBBBb.', '.....bbb..'],
  'boon-recruit': ['........yy', '.......yYy', '......yYy.', 'b...yyYy..', 'bbyyYYy...', 'yyYYYy....', 'YYYyy.....', '.yy.......', '..........', '..........'],
  'boon-eagle': ['..bbbb....', '.bwwwwb...', 'bwwkwwwyy.', 'bwwwwwyyy.', '.bwwwwb...', 'bbbbbbbb..', 'BbBbBbBbb.', '.BbBbBbBb.', '..BBBBBB..', '...y..y...'],
  'boon-haggler': ['..........', '..........', 'uu......rr', 'uuTT..ttrr', 'uuTTTttttr', 'uu.TTTttrr', 'uu..TTt.rr', '..........', '..........', '..........'],
  'boon-drill': ['b.......b.', '.b.....b..', '..b...b...', 'rrrrrrrrrr', 'rwrwrwrwrw', 'rrwrwrwrwr', 'rwrwrwrwrw', 'rrrrrrrrrr', '.SSSSSSSS.', '..........'],
  'boon-banker': ['....yy....', '...yYYy...', '..yYYYYy..', '.yyyyyyyy.', '..s.s.s.s.', '..s.s.s.s.', '..s.s.s.s.', '..s.s.s.s.', '.ssssssss.', 'SSSSSSSSSS'],
  'boon-smith': ['..........', 'SSSSSSSS..', 'SssssssssS', '.SSSSSSSS.', '...SssS...', '...SssS...', '..SSSSSS..', '.SssssssS.', '.SSSSSSSS.', '..........'],
  'boon-hide': ['SSSSSSSSSS', 'SssSssSssS', 'SsSSSSSSsS', 'SSsdsdsSSS', 'SsSdsdsSsS', 'SSsdsdsSSS', '.SsSSSSsS.', '.SSsssSSS.', '..SSSSSS..', '...SSSS...'],
  'boon-windfall': ['..y....y..', '.yYy..yYy.', '..y....y..', '...yyyy...', '..yYYYYy..', 'yyyyyyyyyy', 'yYYYYYYYYy', 'yyyyyyyyyy', 'yYYYYYYYYy', 'yyyyyyyyyy'],
  'boon-hymn': ['..........', 'y.........', 'yy........', 'yYyyyyyyyy', 'yYYYYYYYYy', 'yYyyyyyyyy', 'yy..b.b...', 'y...b.b...', '..........', '..........'],
  'boon-mend': ['bbbbbbbbbb', 'bobobbobob', 'bbbbbbbbbb', 'boboboboob', 'bbbbbbbbbb', '....SS....', '...SssS...', '....bb....', '....bb....', '....bb....'],
  'boon-heart': ['.rr....rr.', 'rRRr..rRRr', 'rRwRrrRRRr', 'rRRRRRRRRr', 'rRRRyyRRRr', '.rRRyyRRr.', '..rRRRRr..', '...rRRr...', '....rr....', '..........'],
  'boon-charter': ['.YYYYYYY..', 'YyyyyyyyY.', '.Y.kkkk.Y.', '.Y......Y.', '.Y.kkk..Y.', '.Y....rrY.', '.Y...rRRr.', 'YyyyyyrRr.', '.YYYYYYrr.', '......r.r.'],
  'boon-blessing': ['....w.....', '....w..y..', '..wwYww...', '....w.....', '.y..w..p..', '......pPp.', '..y....p..', '.yYy......', '..y...c...', '.....cCc..'],
  'boon-vault': ['..........', 'y..y..y..y', 'yy.yy.yy.y', 'yyyyyyyyyy', 'yYrYYcYYry', 'yYYYYYYYYy', 'yyyyyyyyyy', '..........', '..........', '..........'],
  'boon-fortune': ['..rr..rr..', '...rrrr...', 'ppppRRpppp', 'pPPPRRPPPp', 'pPPPRRPPPp', 'ppppRRpppp', '.pPPRRPPp.', '.pPPRRPPp.', '.pPPRRPPp.', '.pppRRppp.'],
  // ---- horde tactics ----
  'tac-warband': ['s........s', '.s......s.', '..s....s..', '...s..s...', '....ss....', '....ss....', '...s..s...', '.bbs..sbb.', '.b......b.', 'b........b'],
  'tac-blitz': ['.r...r....', '..r...r...', '...r...r..', '....r...r.', '.....r...r', '....r...r.', '...r...r..', '..r...r...', '.r...r....', '..........'],
  'tac-captain': ['.y..y..y..', '.yy.yy.yy.', '.yyyyyyyy.', '.SSSSSSSS.', 'SssssssssS', 'SskkSSkksS', 'SSSSssSSSS', '.SSs..sSS.', '..S....S..', '..........'],
  'tac-swarm': ['.G.....G..', 'GkG...GkG.', '.G..G..G..', '...GkG....', 'G...G...G.', 'kG.....GkG', 'G..G....G.', '..GkG.....', '...G...G..', '......GkG.'],
  'tac-shieldwall': ['SSS.SSS.SS', 'SrS.SrS.Sr', 'SrS.SrS.Sr', 'SSS.SSS.SS', '.S...S...S', 'SSS.SSS.SS', 'SrS.SrS.Sr', 'SrS.SrS.Sr', 'SSS.SSS.SS', '.S...S...S'],
  'tac-airraid': ['..........', 'p........p', 'pp.p..p.pp', 'pPpppppPPp', 'pPPpwpwPPp', '.pPppppPp.', '..p.pp.p..', '....pp....', '..........', '..........'],
  // ---- element combos ----
  'cmb-nova': ['....y.....', '.y..y..y..', '..y.y.y...', '...yYy....', 'yyyYwYyyy.', '...yYy....', '..y.y.y...', '.y..y..y..', '....y.....', '..........'],
  'cmb-rain': ['.....oo...', '....oYYo..', '...oYwYo..', '..roYYo...', '.rroo.....', 'rr........', 'r...r.....', '...rr.....', '..rr......', '..........'],
  'cmb-wave': ['..........', '..cc......', '.cCCc...c.', 'cC..Cc.cC.', 'c....cCc..', '..cc......', '.cCCc...c.', 'cC..Cc.cC.', 'c....cCc..', '..........'],
  'cmb-heal': ['...GGGG...', '...GwwG...', '...GwwG...', 'GGGGwwGGGG', 'GwwwwwwwwG', 'GwwwwwwwwG', 'GGGGwwGGGG', '...GwwG...', '...GwwG...', '...GGGG...'],
  'cmb-shield': ['..cccccc..', '.cCCCCCCc.', 'cCC....CCc', 'cC......Cc', 'cC..uu..Cc', 'cC..uu..Cc', 'cC......Cc', '.cC....Cc.', '..cCCCCc..', '...cccc...'],
  'cmb-haste': ['..........', '...yyy....', '.....yy...', 'cccccccyy.', '.......yYy', 'cccccccyy.', '.....yy...', '...yyy....', '..........', '..........'],
  'cmb-rage': ['...rrrr...', '..rRRRRr..', '.rRrRrRRr.', '.rRrRrRRr.', '.rRRRRRRr.', '.rRRRRRr..', '..rRRRr...', '..rRRRr...', '..ruuur...', '..uuuuu...'],
  'cmb-freeze': ['C...C...C.', '.C..C..C..', '..CCwCC...', '.CCwwwCC..', 'CwwwCwwwC.', '.CCwwwCC..', '..CCwCC...', '.C..C..C..', 'C...C...C.', '..........'],
  'cmb-gold': ['...yyyy...', '.yyYYYYyy.', '.yYyyyyYy.', 'yYyYYYYyYy', 'yYyYyyyyYy', 'yYyYYYyyYy', 'yYyyyYyyYy', '.yYYYYyYy.', '.yyYYYYyy.', '...yyyy...'],
  'cmb-shred': ['S......S..', 'SsS..SsS..', '.SsSSsS...', '..SssS....', '...SS.....', '..b..b....', '.bBb.bBb..', '.bBb.bBb..', '..b...b...', '..........'],
  'cmb-vortex': ['...pppp...', '.pp....p..', 'p..ppp..p.', 'p.p...p.p.', 'p.p.P..p.p', 'p..p..p..p', '.p..pp..p.', '..p.....p.', '...ppppp..', '..........'],
  'cmb-critter': ['..........', '...b..b...', '..bbbbbb..', '.bbkbbkbb.', '.bbbbbbbb.', '.bbbnnbbb.', '..bbbbbb..', '...bttb...', '..bb..bb..', '..........'],
  'cmb-execute': ['......SSS.', '.....SssS.', '....SssS..', '...SssS...', '..bSsS....', '.bbbS.....', '.bBb......', 'bBb.......', 'Bb........', '..........'],
  'cmb-beam': ['..........', '..........', 'yyyyyyyyyy', 'YYYYYYYYYY', 'wwwwwwwwww', 'YYYYYYYYYY', 'yyyyyyyyyy', '..........', '..........', '..........'],
  'cmb-bolts': ['...yyyy...', '..yYYy....', '.yYyy.....', 'yYYYYYy...', '...yYy.yyy', '..yYy.yYy.', '.yy..yYyy.', '....yYYYYy', '.......yy.', '......y...'],
  'cmb-roots': ['....G.....', '...GgG....', '....g.....', '...bgb....', '..b.b.b...', '.b..b..b..', 'b..b.b..b.', '..b...b...', '.b.....b..', 'b.......b.'],
  'cmb-salt': ['....w.....', '...wWw..w.', '....w..wWw', '.w.....w..', 'wWw.......', '.w...w....', '....wWw...', '.....w.w..', '..w...wWw.', '.wWw...w..'],
  'cmb-candy': ['..nnnn....', '.nNwNNn...', 'nNnnnnNn..', 'nNnNNnNn..', 'nNnNnnNn..', '.nNnnNn...', '..nnnn....', '....w.....', '....w.....', '....w.....'],
  'cmb-ham': ['.....ee...', '....eeee..', '...beee...', '.rrrb.....', 'rRRRrr....', 'rRwRRRr...', 'rRRRRRr...', '.rRRRr....', '..rrr.....', '..........'],
  'cmb-pinata': ['......ss..', '.....s....', '..rrrryy..', '.rRRryYYy.', 'rRRryYYyc.', '.rrcccyc..', '..cCCcc...', '..c..c....', '..c..c....', '..........'],
  // ---- tech branches ----
  'tech-stone': ['SSSSSSSSSS', 'SssSSssssS', 'SSSSSSSSSS', 'SsssssSssS', 'SSSSSSSSSS', 'SssSssssSS', 'SSSSSSSSSS', 'SsssssSssS', 'SSSSSSSSSS', '..........'],
  'tech-gear': ['...SSSS...', '.S.SssS.S.', '.SSssssSS.', 'SSss..ssSS', 'Sss....ssS', 'Sss....ssS', 'SSss..ssSS', '.SSssssSS.', '.S.SssS.S.', '...SSSS...'],
  'tech-flask': ['...SSS....', '....w.....', '....w.....', '...wCw....', '..wGGGw...', '.wGGwGGw..', 'wGGGGGGGw.', 'wGlGGGlGw.', '.wwwwwww..', '..........'],
  'tech-bag': ['...bbbb...', '....yy....', '...bbbb...', '..bBBBBb..', '.bBByyBBb.', 'bBByYYyBBb', 'bBBByyBBBb', 'bBBBBBBBBb', '.bBBBBBBb.', '..bbbbbb..'],
  'tech-key': ['.yyy......', 'yYYYy.....', 'yY.Yy.....', 'yYYYy.....', '.yyYyyyyyy', '....yyyyYy', '.......y.y', '.......y..', '..........', '..........'],
  // ---- HUD and buttons ----
  'ui-sound': ['......y...', '.....yYy..', '.....y.Yy.', '.....y..y.', '.....y....', '..yyyy....', '.yYYYy....', '.yYYYy....', '..yyy.....', '..........'],
  'ui-mute': ['r.....y..r', '.r...yYyr.', '..r..y.r..', '.....yr...', '....ry....', '..yrry....', '.yrYYy....', '.rYYYy....', 'r.yyy.....', '..........'],
  'ui-full': ['ccc....ccc', 'c........c', 'c........c', '..........', '..........', '..........', '..........', 'c........c', 'c........c', 'ccc....ccc'],
  'ui-exitfull': ['..c....c..', '..c....c..', 'ccc....ccc', '..........', '..........', '..........', '..........', 'ccc....ccc', '..c....c..', '..c....c..'],
  'ui-menu': ['..........', '.YYYYYYYY.', '.yyyyyyyy.', '..........', '.YYYYYYYY.', '.yyyyyyyy.', '..........', '.YYYYYYYY.', '.yyyyyyyy.', '..........'],
  'ui-lock': ['...SSSS...', '..S....S..', '..S....S..', '.yyyyyyyy.', '.yYYYYYYy.', '.yYYkkYYy.', '.yYYkkYYy.', '.yYYYYYYy.', '.yyyyyyyy.', '..........'],
  'ui-unlock': ['...SSSS...', '..S....S..', '..S.......', '.yyyyyyyy.', '.yYYYYYYy.', '.yYYkkYYy.', '.yYYkkYYy.', '.yYYYYYYy.', '.yyyyyyyy.', '..........'],
  'ui-repair': ['..SSSS....', '.SssssS...', '.SSSSSS...', '...bb.....', '...bb.....', '...bb.oo..', '...bbo.o..', '...bb.oo..', '...bb.....', '...bb.....'],
  'ui-flag': ['b.........', 'byyyyyy...', 'byYYYYyyy.', 'byYrrYYYy.', 'byYrrYYy..', 'byYYYyyy..', 'byyyy.....', 'b.........', 'b.........', 'bb........'],
  'ui-check': ['..........', '........G.', '.......GG.', '......GG..', 'G....GG...', 'GG..GG....', '.GGGG.....', '..GG......', '..........', '..........'],
  'ui-skull': ['..wwwwww..', '.wwwwwwww.', 'wwkkwwkkww', 'wwkkwwkkww', 'wwwwkkwwww', '.wwwwwwww.', '..wkwkww..', '..wwwwww..', '..........', '..........'],
  'ui-back': ['..........', '...c......', '..cc......', '.cCcccccc.', 'cCCCCCCCc.', '.cCcccccc.', '..cc......', '...c......', '..........', '..........'],
  'ui-recall': ['..cccc....', '.c....c...', 'c......c..', 'c.......c.', 'c.......c.', '.......c..', '..c...c...', '.ccccc....', '..c.......', '..........'],
  'ui-jump': ['....c.....', '....c.....', '....c.....', '....c.....', '.c..c..c..', '..c.c.c...', '...ccc....', '....c.....', '.yyyyyyy..', '..........'],
  'ui-reroll': ['..yyyyy...', '.y.....y..', 'y.......y.', 'y......yyy', 'y.......y.', '..........', '.y.....y..', 'yyy....y..', '.y.....y..', '..yyyyy...'],
  'ui-team': ['..........', '..TT..TT..', '.TTTTTTTT.', '..TT..TT..', '.uuuuuuuu.', 'uuuuuuuuuu', 'uu.uuuu.uu', '...uuuu...', '...u..u...', '..........'],
  'ui-scout': ['..........', '..SS..SS..', '.SccSSccS.', 'ScCwccCwcS', 'SccccSsccS', '.SccS.ScS.', '..SS...SS.', '..........', '..........', '..........'],
  'ui-stats': ['..........', '........G.', '........G.', '.....r..G.', '.....r..G.', '..y..r..G.', '..y..r..G.', '..y..r..G.', 'SSSSSSSSSS', '..........'],
  'ui-up': ['..........', '....y.....', '...yYy....', '..yYYYy...', '.yYYYYYy..', '...yYy....', '...yYy....', '...yYy....', '..........', '..........'],
  'ui-down': ['..........', '...yYy....', '...yYy....', '...yYy....', '.yYYYYYy..', '..yYYYy...', '...yYy....', '....y.....', '..........', '..........'],
  'ui-play': ['..........', '..G.......', '..GG......', '..GwG.....', '..GwwG....', '..GwwwG...', '..GwwG....', '..GwG.....', '..GG......', '..G.......'],
  'ui-close': ['..........', '.r......r.', '..r....r..', '...r..r...', '....rr....', '....rr....', '...r..r...', '..r....r..', '.r......r.', '..........'],
  'ui-star': ['....y.....', '....y.....', '...yYy....', 'yyyYYYyyy.', '.yYYwYYy..', '..yYYYy...', '..yYyYy...', '.yYy.yYy..', '.yy...yy..', '..........'],
  'ui-dust': ['..........', '...SS.....', '..SsSS.S..', '.SssssSsS.', 'SsssssssS.', '.SssSssS..', '..SS..S...', '..........', '..........', '..........'],
  'ui-daze': ['....y.....', '...yYy....', '..yy.yy...', 'y.......y.', 'Yy.....yY.', 'y.......y.', '..yy.yy...', '...yYy....', '....y.....', '..........'],
  'ui-dot': ['..........', '..........', '...wwww...', '..wWWWWw..', '..wWWWWw..', '..wWWWWw..', '..wWWWWw..', '...wwww...', '..........', '..........'],
};
const PXI_URL = {};
function pxiCanvas(name, px = 2) {
  const rows = PXI[name] || PXI['ui-dot'], N = 12;
  const c = document.createElement('canvas'); c.width = c.height = N * px; const ctx = c.getContext('2d');
  const g = new PixGrid(N, N);
  rows.forEach((r, y) => [...r].slice(0, 10).forEach((ch, x) => { if (PXI_PAL[ch]) g.set(x + 1, y + 1, PXI_PAL[ch], true); }));
  g.finish();
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { const col = g.get(x, y); if (col) { ctx.fillStyle = col; ctx.fillRect(x * px, y * px, px, px); } }
  return c;
}
function pxiURL(name, px = 2) { const k = name + '@' + px; return PXI_URL[k] || (PXI_URL[k] = pxiCanvas(name, px).toDataURL()); }
// an inline icon that sits on the text line; cls adds sizing hooks (pxi-lg, pxi-xl)
function pxi(name, cls = '', alt = '') { return `<img class="px pxi ${cls}" src="${pxiURL(name, 3)}" alt="${alt}" draggable="false">`; }
// the data tables keep an `icon` field for their HTML. In the browser it becomes the pixel icon (the emoji stays for Node tools).
(function pxiWire() {
  if (typeof document === 'undefined') return;
  const wire = (table, prefix, key = k => k) => { for (const k in table) { const nm = prefix + key(k); if (!PXI[nm]) continue; Object.defineProperty(table[k], 'icon', { get: () => pxi(nm), configurable: true, enumerable: true }); Object.defineProperty(table[k], 'iconName', { value: nm, configurable: true }); } };
  wire(CLASSES, 'cls-'); wire(TEMPERS, 'tmp-'); wire(TACTICS, 'tac-');
  if (typeof BOONS !== 'undefined') wire(BOONS, 'boon-');
  for (const k in EL_ICON) EL_ICON[k] = pxi('el-' + k);
  for (const k in RACE_ICON) RACE_ICON[k] = pxi('race-' + k);
  const st = document.documentElement.style; st.setProperty('--pxi-dust', `url(${pxiURL('ui-dust', 3)})`); st.setProperty('--pxi-daze', `url(${pxiURL('ui-daze', 3)})`); st.setProperty('--pxi-coin', `url(${iconURL('coin', 3)})`);
})();
// plain text version of a table entry's name for places that set textContent
const pxiText = T => T.name;
