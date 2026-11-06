// ===== Boss talk that notices you (Cam 2026-11-06: "do them all", after the Undertale / Eastward dialogue study) =====
// Lessons, not content: the talk remembers you across runs, notices what you did on the board, names the story choice it
// holds against you, lets one champion butt in on another, and offers a reply only that boss would fall for.
// talk.js builds the scenes and calls in here. Nothing in this file changes combat except the Parley reply (sim.js).

// ----- 1. bosses remember past runs (G.meta.bossMem, written by noteBossMemory in finishSiege) -----
// per boss: again = met before, nothing settled; beat = you beat it last time; slayer = same, naming the legend who landed the
// last hit; lost = it broke your keep last time; vet = you've met five times or more. {n} = times met, {slayer} = that legend.
const BOSS_MEM = {
  grubnose: {
    again: "Oi! BIG HOUSE! It's me again. Grubnose. King of the ditch. You remember the bucket. Everybody remembers the bucket.",
    beat: "YOU. Last time you knocked me flat and I had to walk home. In the rain. With the bucket on my head. It filled up.",
    slayer: "Where's {slayer}? Last time {slayer} bonked me so hard I saw two buckets. One of them was nice. I want it back.",
    lost: "Hah! Remember me? Last time I got IN. I still have one of your spoons. I eat soup with it. Royally.",
    vet: "Visit number {n}! I've started a little scrapbook of your castle. It's mostly drawings of rafters." },
  gloop: {
    again: "Hello again, dear. Mother remembers you. Mother remembers everyone who has ever popped one of her babies.",
    beat: "You splashed me all over the field last time, dear. It took me a week to find my left side.",
    slayer: "Is {slayer} still with you, dear? Last time {slayer} popped me like a bubble. Mother has been practising being tougher.",
    lost: "Ooh, you came back! Last time Mother got all the way into your kitchen. Your larder still smells of bog. You're welcome.",
    vet: "That's {n} visits now, dear. The babies have started calling you Auntie Castle." },
  wyrm: {
    again: "You again. How fortunate. You appear in my notes as \"recurring character\". Underline. Question mark.",
    beat: "Last time, you won. It was a terrible ending. Unearned. The critics agreed. The critics were zombies, but still.",
    slayer: "Ah. Is {slayer} here? {slayer} slew me in our last draft. I've written them a much sadder fate this time.",
    lost: "Welcome back. Last time I burned your keep in chapter three. The reviews called it \"too short\". Let's fix that.",
    vet: "Our {n}th meeting. I'm calling this edition \"The Siege, Again, Revised\". Readers love a series." },
  ringmaster: {
    again: "Back by popular demand! Well. MY demand. Welcome back to Malgoth's Infernal Carnival!",
    beat: "You! You closed my show last time! The imps got refunds! Do you know how hard it is to refund fire?",
    slayer: "Where is {slayer}? {slayer} stole my finale last time! Nobody takes a bow on MY stage but me!",
    lost: "Encore! Last time your keep went up in such lovely flames. The crowd begged for a sequel. Here it is!",
    vet: "Performance number {n}! Season tickets for the castle! The imps have learned all your names." },
  sporebaron: {
    again: "We meet again. I never forget a castle. I've grown on several. I may still be growing on yours.",
    beat: "You beat me last time, darling. I had to regrow from a single spore. One very embarrassed spore.",
    slayer: "Is {slayer} about? {slayer} composted me last time. Rather rude of them. I've been stewing in the leaf litter about it.",
    lost: "Hello again. Last time my court took your cellar. There's a lovely patch of me down there still. Do say hello.",
    vet: "Our {n}th little chat. I think of you as an old friend. A friend I would like to decompose." },
  matriarch: {
    again: "You. I have your file. It is a large file. Shall we add to it?",
    beat: "According to my records, you won last time. I have filed a complaint. Against the result.",
    slayer: "Is {slayer} present? I'd like a word. {slayer} assaulted an HOA officer last time. I have it on a form.",
    lost: "Welcome back. Last time I condemned your property. I see you rebuilt without a permit. Again.",
    vet: "This is your {n}th violation. The board has given you a nickname. The board is still mostly me." },
  trashpaw: {
    again: "Well, look who's back, sugar. Mama never forgets a kitchen.",
    beat: "You chased me off last time, sugar. Forty babies, no dinner. Mama is HUNGRY.",
    slayer: "Where's {slayer}, honey? {slayer} whacked Mama with a ladle last time. Mama wants that ladle.",
    lost: "Sugar! We got in last time! The babies still talk about the pantry. The lasagne. The second lasagne.",
    vet: "Visit {n}, sugar. The babies think of your bins as a timeshare." },
  colossus: {
    again: "RECOGNITION: CASTLE. STATUS: STILL STANDING. CORRECTING STATUS.",
    beat: "PREVIOUS ENCOUNTER: DEFEAT. I WAS TOWED HOME BY A HORSE. THE HORSE WAS ALSO DISAPPOINTED.",
    slayer: "SCANNING FOR: {slayer}. {slayer} DENTED MY LEFT KNEE LAST CYCLE. IT STILL SQUEAKS IN B FLAT.",
    lost: "PREVIOUS ENCOUNTER: CASTLE FLATTENED. CUSTOMER SATISFACTION: HIGH. REPEATING SERVICE.",
    vet: "ENCOUNTER NUMBER {n}. YOU ARE NOW A REGULAR. REGULARS GET A DISCOUNT ON DEMOLITION." },
  pinchbeard: {
    again: "Ahoy again, landlubbers! Pinchbeard never forgets a moat with good parking.",
    beat: "Ye sank me last time! Me and three hundred crabs, bobbin' in the moat. Most embarrassin' night of me life.",
    slayer: "Where be {slayer}? {slayer} pinched me back last time! Nobody pinches the Pinchbeard!",
    lost: "Har! Last time we plundered ye proper. I've still got yer drawbridge chain. It's a lovely necklace.",
    vet: "That's {n} raids now! I've named a crab after ye. He's grumpy and he's surrounded by water." },
  goosegod: {
    again: "HONK. (Translation: You. I remember you. Geese remember everything. Especially bread.)",
    beat: "HONK HONK. (Translation: Last time you won. I have been honking about it for weeks. Ask anyone.)",
    slayer: "HONK. (Translation: Where is {slayer}? {slayer} plucked a feather last time. I want it back. It was my best one.)",
    lost: "HONK. (Translation: Last time I took your castle. I sat on it like an egg. It did not hatch. Disappointing.)",
    vet: "HONK. (Translation: Meeting number {n}. I have a whole flock now. They are all named after your walls.)" },
};
BOSS_MEM.shardgoose = BOSS_MEM.goosegod;
function bossMem(meta, id) { const M = meta.bossMem = meta.bossMem || {}; return M[id] || (M[id] = { met: 0, beat: 0, lost: 0 }); }
// the opener a boss uses when it has met you in an earlier run, or null on a first meeting
function memoryOpener(id) {
  const L = BOSS_MEM[id], m = G.meta.bossMem && G.meta.bossMem[id]; if (!L || !m || !m.met) return null;
  const sl = m.slayer && HERO_BY_ID[m.slayer] ? talkVoiceFirst(HERO_BY_ID[m.slayer].name) : null;
  let s = m.met >= 5 && Math.random() < 0.5 ? L.vet : m.last === 'beat' ? (sl && Math.random() < 0.6 ? L.slayer : L.beat) : m.last === 'lost' ? L.lost : L.again;
  const n = m.met + 1, ord = n + (n % 100 >= 11 && n % 100 <= 13 ? 'th' : ['th', 'st', 'nd', 'rd'][n % 10] || 'th');
  return s.replace(/\{slayer\}/g, sl || 'your champion').replace(/\{n\}th/g, ord).replace(/\{n\}/g, n);
}
// called from finishSiege: met on the first siege of a horde, beat / lost when its boss siege is decided, lost when it ends a run
function noteBossMemory(run, meta, B, rep) {
  if (run.finale === 'ready' || !meta) return;
  const s = rep.siege, id = bossFor(s), m = bossMem(meta, id);
  if ((s - 1) % 5 === 0) m.met++;
  if (isBossSiege(s)) {
    if (B.bossKilled) { m.beat++; m.last = 'beat'; m.slayer = B.bossSlayer || null; }
    else if (rep.breach) { m.lost++; m.last = 'lost'; m.slayer = null; }
  } else if (rep.breach && rep.breach.over) { m.lost++; m.last = 'lost'; m.slayer = null; }
}

// ----- 2. bosses notice your board -----
// star: your best 2- or 3-star legend ({star} = name, {stars} = "two-star" / "three-star"), stack: four or more of one
// element ({el}, {n}), reroll: lots of shop rerolls since the last talk ({n}), hoard: sitting on 30+ gold ({gold}).
const BOSS_NOTICE = {
  grubnose: { star: "What's that, a {stars} {star}? Shiny! I want to put them in the ditch and look at them.",
    stack: "{n} {el} champions? Is that a theme? Goblins don't have themes. We have mud.",
    reroll: "I heard you shook the shop {n} times. The shopkeeper's been crying in our ditch. We gave him a rock.",
    hoard: "{gold} gold, just sitting there? I could buy a bucket with NO HOLE. Two buckets!" },
  gloop: { star: "Oh, is {star} {stars} now, dear? They grow up so fast. Mine just split.",
    stack: "{n} {el} champions, dear? You're building a family. Mother approves. Mother will still drown it.",
    reroll: "Rerolling {n} times, dear? Patience. Mother waited three hundred years for a bog this nice.",
    hoard: "{gold} gold under the mattress, dear? Mother can smell it. Mother can smell everything." },
  wyrm: { star: "A {stars} {star}. Every story needs a chosen one. They usually die in act two.",
    stack: "{n} {el} champions. A motif. Heavy-handed, but I respect it.",
    reroll: "You rerolled your shop {n} times. Indecisive. I'm writing you as indecisive.",
    hoard: "{gold} gold and nothing to spend it on. A tragic flaw. Greed, chapter nine." },
  ringmaster: { star: "A {stars} {star}! Now THAT'S a headliner! I'd pay to see them. I'd pay MORE to see them lose!",
    stack: "{n} {el} acts in one show? Darling, the audience wants variety!",
    reroll: "{n} rerolls! You're auditioning half the realm! Can I sell tickets to that?",
    hoard: "{gold} gold in the till and no show to spend it on? Tragic! Buy a balloon!" },
  sporebaron: { star: "Ah, a {stars} {star}. A prize specimen. They'll make a splendid compost.",
    stack: "{n} {el} sorts all together. Monoculture, darling. Very bad for the soil.",
    reroll: "Rerolling {n} times? Do sit still. Things only grow when you sit still.",
    hoard: "{gold} gold, hoarded like acorns. A squirrel's strategy. Squirrels rot too." },
  matriarch: { star: "A {stars} {star}. Over the height limit for champions in this zone. Noted.",
    stack: "{n} {el} champions on one lot? That's a zoning violation.",
    reroll: "{n} shop rerolls this season. Excessive noise. There will be a fine.",
    hoard: "{gold} gold, undeclared. The association will be taking its cut." },
  trashpaw: { star: "Ooh, {star}'s gone all {stars}, sugar. Shiny. Mama likes shiny.",
    stack: "{n} {el} kids in one house? Honey, that's MY trick.",
    reroll: "You went through that shop {n} times, sugar. Mama knows a bin-digger when she sees one.",
    hoard: "{gold} gold in the jar, sugar? Mama knows where you keep the jar." },
  colossus: { star: "UNIT {star} DETECTED. RATING: {stars}. THREAT LEVEL: SPARKLY.",
    stack: "{n} {el} UNITS. PATTERN DETECTED. PATTERN DOES NOT COMPUTE AS ART.",
    reroll: "SHOP REFRESHED {n} TIMES. YOU ARE PRESSING THE BUTTON LIKE ME.",
    hoard: "{gold} GOLD STORED. RECOMMENDED USE: OIL. FOR ME." },
  pinchbeard: { star: "That {stars} {star}'s a fine bit o' treasure. I'll be wantin' that for me hold.",
    stack: "{n} {el} hands on deck? Ye've got yerself a crew. A doomed crew.",
    reroll: "{n} times ye shook that shop! Like a crab lookin' for a bigger shell.",
    hoard: "{gold} gold buried in yer keep? X marks the spot, matey." },
  goosegod: { star: "Honk. (Translation: {star} is {stars} now. Shiny. I will steal them for the nest.)",
    stack: "HONK. (Translation: {n} {el} champions. A flock. You are learning from the goose.)",
    reroll: "Honk honk. (Translation: {n} rerolls. You honk at the shop like a goose honks at a door.)",
    hoard: "HONK. (Translation: {gold} gold. Gold is nice. Bread is nicer. Give me the bread.)" },
};
BOSS_NOTICE.shardgoose = BOSS_NOTICE.goosegod;
// what on the board a boss could comment on right now; one comment per scene, and never the same thing twice in a run
function boardNotice(run, bossId) {
  const L = BOSS_NOTICE[bossId]; if (!L) return null;
  const said = run.noticed = run.noticed || [], opts = [];
  const top = run.roster.filter(h => !h.vault && heroStar(h) >= 2).sort((a, b) => heroStar(b) - heroStar(a))[0];
  if (top) { const k = 'star:' + top.uid + ':' + heroStar(top); if (!said.includes(k)) opts.push([k, L.star, { star: talkVoiceFirst(heroDisplayName(top)), stars: heroStar(top) === 3 ? 'three-star' : 'two-star' }]); }
  const els = {}; for (const h of run.roster) if (h.place && h.el) els[h.el] = (els[h.el] || 0) + 1;
  const big = Object.keys(els).sort((a, b) => els[b] - els[a])[0];
  if (big && els[big] >= 4 && ELEMENTS[big]) { const k = 'stack:' + big; if (!said.includes(k)) opts.push([k, L.stack, { el: ELEMENTS[big].name, n: els[big] }]); }
  const rr = (run.shopRerolls || 0) - (run.rrNoticed || 0);
  if (rr >= 6) opts.push(['reroll:' + run.siege, L.reroll, { n: rr }]);
  if (run.gold >= 30 && !said.includes('hoard:' + factionIndex(run.siege))) opts.push(['hoard:' + factionIndex(run.siege), L.hoard, { gold: run.gold }]);
  if (!opts.length) return null;
  const [k, s, v] = pick(opts);
  return { line: s.replace(/\{(\w+)\}/g, (m, x) => v[x] != null ? v[x] : m), seal: () => { said.push(k); if (k.startsWith('reroll')) run.rrNoticed = run.shopRerolls || 0; } };
}

// ----- 8. name the grudge -----
// the story choice the boss holds against you (or thanks you for), in the hero's own words. {said} = what the hero said.
const BOSS_GRUDGE = {
  grubnose: { rude: "\"{said},\" you said. I HEARD. Goblins have big ears. Huge ears. Look at them.", kind: "\"{said},\" you said. Nobody ever said a thing like that to a goblin. I wrote it on the leaf." },
  gloop: { rude: "\"{said},\" you said, dear. Mother heard. Mother was in the drain.", kind: "\"{said},\" you said. Mother remembers that, dear. Mother wobbled for an hour." },
  wyrm: { rude: "\"{said},\" you said. I quoted it in full. Chapter eleven. You are the villain now.", kind: "\"{said},\" you said. Lovely line. I put it on the back cover." },
  ringmaster: { rude: "\"{said}!\" you said! In front of my IMPS! They do impressions of you now!", kind: "\"{said},\" you said! The imps clapped! I had to dock their wages for it!" },
  sporebaron: { rude: "\"{said},\" you said. It's in the court records. Mouldering nicely.", kind: "\"{said},\" you said. Terribly decent of you. It's almost a shame. Almost." },
  matriarch: { rude: "\"{said},\" you said. Verbatim. It's on the form. Page one.", kind: "\"{said},\" you said. It has been noted. In the good column. The good column is very short." },
  trashpaw: { rude: "\"{said},\" you said, sugar. Mama heard. Mama always hears.", kind: "\"{said},\" you said, honey. Mama won't forget that. Mama's still gonna eat your kitchen." },
  colossus: { rude: "PLAYBACK: \"{said}.\" RUDENESS: CONFIRMED. GRUDGE: SAVED TO DISK.", kind: "PLAYBACK: \"{said}.\" KINDNESS: CONFIRMED. I HAVE SAVED IT. I PLAY IT AT NIGHT." },
  pinchbeard: { rude: "\"{said},\" ye said! I've had it tattooed on a crab so I never forget it!", kind: "\"{said},\" ye said. A fine thing to say to an old pirate. Still boardin' ye, though." },
  goosegod: { rude: "HONK. (Translation: \"{said},\" you said. The goose remembers.)", kind: "honk. (Translation: \"{said},\" you said. The goose remembers that too.)" },
};
// story choices are kept per horde: the last kind one and the last rude one (main.js calls this when a story card is picked)
function noteStoryChoice(run, story, o) {
  if (!story) return; const st = encStance(o), f = story.f != null ? story.f : factionIndex(run.siege);
  if (story.p === 1 || !run.storyNote || run.storyNote.f !== f) run.storyNote = { f };
  if (st === 'kind' || st === 'truce') run.storyNote.kind = o.label; else if (st === 'rude' || st === 'fight') run.storyNote.rude = o.label;
}
function grudgeLine(run, bossId, f) {
  const N = run.storyNote, L = BOSS_GRUDGE[bossId]; if (!N || N.f !== f || !L) return null;
  const m = run.mood || 0, label = m <= -1 ? N.rude : m >= 1 ? N.kind : null; if (!label) return null;
  const g = encGist({ label }), said = 'We should ' + g;
  return (m <= -1 ? L.rude : L.kind).replace('{said}', said);
}

// ----- 4. a reply only this boss would fall for (needs a kind story path this horde) -----
// Parley: the boss starts the fight 15% weaker and doesn't open with its fury, but drops half the gold (sim.js).
const BOSS_PARLEY = {
  grubnose: { label: 'Offer him the guest room', said: "Grubnose. We have a guest room. It has a roof. And a bucket. With no hole.", react: "A ROOF? A bucket with no HOLE? ...I still have to fight you. It's the job. But I'll fight you SOFTLY." },
  gloop: { label: 'Offer to babysit', said: "Mother Gloop, you look exhausted. Let us mind the little ones for an afternoon.", react: "An afternoon off? Oh, dear. Oh, I could weep. I'll still flood you, but I'll do it with a smile." },
  wyrm: { label: 'Offer to co-write the ending', said: "Vexmora, what if the last chapter has two authors? You and us.", react: "A collaboration? How... modern. Fine. I'll go easy on you. For the sake of the sequel." },
  ringmaster: { label: 'Give a standing ovation', said: "Everyone, on your feet! Bravo, Malgoth! BRAVO!", react: "A standing ovation? For ME? Oh, I'm verklempt. The imps are crying. Let's make this a short show." },
  sporebaron: { label: 'Offer him the cellar', said: "Baron, the cellar is dark and damp and it's yours. No scrubbing. Ever.", react: "No scrubbing? EVER? You'd do that for an old mushroom? Well. I suppose I can rot you slowly." },
  matriarch: { label: 'Hand in every form', said: "Here are all the forms, Matriarch. Filled in. In triplicate. In Yeti.", react: "In... Yeti? Correct Yeti? This is the best paperwork I've ever seen. I will flatten you gently." },
  trashpaw: { label: 'Promise her the lasagne', said: "Big Mama, after this, there's a lasagne with your name on it. A big one.", react: "With my NAME on it? Oh, sugar. Mama's heart is meltin'. Mama's still comin' in, but she's takin' her shoes off." },
  colossus: { label: 'Hand over the oil can', said: "Here, big fella. A full can of oil. For your knees.", react: "OIL. OIL. OIL. SQUEAKING: STOPPED. HAPPINESS: ONLINE. DEMOLITION: SET TO GENTLE." },
  pinchbeard: { label: 'Offer him the moat, toll-free', said: "Captain, the moat's yours. Free parking. Forever.", react: "FREE PARKIN'? Ye magnificent landlubbers! Fine. We board ye, but we wipe our claws first." },
  goosegod: { label: 'Offer the whole loaf', said: "Goose. The whole loaf. Not a crumb. The whole thing.", react: "...honk. (Translation: The WHOLE loaf. Nobody has ever offered the goose the whole loaf. I will peck you less.)" },
};
const PARLEY_CARD = { k: 'parley', mod: 'parley', sub: 'The boss starts 15% weaker and skips its fury opener, but drops half the gold.' };
// the fourth card for this boss siege: open when you were kind this horde, shown locked otherwise so players learn it exists
function parleyChoice(run, bossId, finale) {
  const P = BOSS_PARLEY[bossId]; if (!P || finale) return null;
  return Object.assign({}, PARLEY_CARD, { label: P.label, locked: (run.mood || 0) < 1 });
}

// ----- 6. champions banter: once a horde another champion butts in on the voice -----
// cut: what the champion blurts out (by their temper), back: how the voice answers (by the voice's group). {me} = the voice,
// {mate} = the champion who butted in, {boss} = the boss.
const BANTER_CUT = {
  heroic: "Wait! Let me say something brave too. Ahem. {boss}! I am ALSO here!",
  cheerful: "Ooh, ooh, can I talk? Hi, {boss}! Big fan! Going to beat you!",
  honorable: "Pardon me, {me}. Protocol says the second-in-command also gets a word. My word is: no.",
  wholesome: "Sorry, sorry. Just wanted to say, {boss}, your hat is lovely. Okay. Carry on.",
  zealous: "ENOUGH TALK! The light demands we SHOUT at them! I'm shouting! HAH!",
  wise: "If I may, {me}. You're answering a question {boss} didn't ask. Classic you.",
  loyal: "Whatever {me} said, I agree with it! I didn't hear it, but I agree!",
  optimistic: "This is going great, everyone. Really great. I can feel it.",
  angry: "Can we stop talking and START HITTING? I've been holding this axe for ages!",
  cruel: "Let me tell {boss} what we'll do to their camp. It involves a lot of salt.",
  greedy: "Quick question, {boss}. If we win, do we get your stuff? Asking for me.",
  vain: "Is the light on me? Hold on. Okay. Now it is. You may continue, {me}.",
  deranged: "I licked the castle wall this morning. It tastes like victory. And moss.",
  paranoid: "Don't trust them, {me}! That's what they WANT you to think. I don't know what they want you to think!",
  cowardly: "Um. Hi. I'm only standing here because the door is locked. Hello.",
  lazy: "Is this going to take long? I left a nap running.",
};
const BANTER_BACK = {
  kind: "Thank you, {mate}. Next time let me finish, though.",
  fierce: "{mate}! I was in the middle of a threat!",
  sharp: "Noted, {mate}. Unhelpful, but noted.",
  odd: "Who said that? Oh. It's you. Hello, {mate}.",
  timid: "Th-thanks, {mate}. You can do the talking from now on.",
};
// a fielded champion who doesn't talk like the voice, if this horde hasn't had its banter yet
function banterMate(run, h, f) {
  if (run.banter === f) return null;
  const g = talkGroup(h), mates = run.roster.filter(x => x !== h && x.place && !x.vault && talkGroup(x) !== g);
  return mates.length ? pick(mates) : null;
}

// ----- 5. text that performs: each boss types at its own pace, with its own lettering -----
// spd: typing pace (x the base), stop: pause at . ! ? (x), cls: lettering class on the bubble (style.css)
const TALK_TEXT = {
  grubnose: { spd: 0.8, stop: 1, cls: 'tx-jitter' }, gloop: { spd: 1.15, stop: 1.2, cls: 'tx-wobble' }, wyrm: { spd: 1.7, stop: 1.6, cls: 'tx-smoke' },
  ringmaster: { spd: 0.9, stop: 1.8, cls: 'tx-show' }, sporebaron: { spd: 1.25, stop: 1.3, cls: 'tx-posh' }, matriarch: { spd: 1, stop: 1, cls: 'tx-frost' },
  trashpaw: { spd: 0.55, stop: 0.6, cls: 'tx-chatter' }, colossus: { spd: 1.1, stop: 0, cls: 'tx-robot' }, pinchbeard: { spd: 1, stop: 1.2, cls: 'tx-sea' },
  goosegod: { spd: 1, stop: 1.3, cls: 'tx-goose' }, shardgoose: { spd: 1, stop: 1.3, cls: 'tx-goose' },
  hero: { spd: 1, stop: 1, cls: '' }, timid: { spd: 1.2, stop: 1.5, cls: 'tx-shaky' }, fierce: { spd: 0.85, stop: 0.8, cls: '' },
};
// the typed text as html: shouted words (ALL CAPS) shake, honks are huge, and a wobbly speaker wobbles every letter
function talkTextHTML(s, cls) {
  const e = esc(s);
  if (cls === 'tx-robot') return e;
  if (cls === 'tx-wobble') { let n = 0; return e.split(' ').map(w => `<span class="w">${w.replace(/(&[a-z]+;|.)/g, c => `<i style="--d:${(n++ % 9) * 0.07}s">${c}</i>`)}</span>`).join(' '); }
  return e.replace(/\b([A-Z][A-Z]{2,})\b/g, w => /^HO+NK$/.test(w) ? `<b class="honk">${w}</b>` : `<b class="yell">${w}</b>`);
}

// ----- 7. emotes and little actions: a mark over the speaker's head and a small move, read from the line -----
const KIND_WORDS = /\b(friend|hug|sorry|love|lovely|nice|thank|thanks|kind|gentle|cosy|biscuit|smile)\b/i;
function talkEmote(text, who, h) {
  const t = String(text), shout = /\b[A-Z]{3,}\b/.test(t.replace(/HONK/g, '')), bang = /!/.test(t), ask = /\?\s*$/.test(t) || /\?\)?$/.test(t);
  const g = who === 'hero' && h ? talkGroup(h) : null;
  if (who === 'boss') return shout && bang ? 'anger' : ask ? 'q' : bang ? 'bang' : null;
  if (g === 'timid') return 'sweat';
  if (ask) return 'q';
  if (g === 'kind' && KIND_WORDS.test(t)) return 'heart';
  if (g === 'fierce' && bang) return 'anger';
  if (g === 'odd') return Math.random() < 0.5 ? 'note' : null;
  return bang ? 'bang' : null;
}
const EMOTE_GLYPH = { anger: '!!', q: '?', bang: '!', heart: '♥', note: '♪', sweat: '' };
const EMOTE_MOVE = { anger: 'mv-stomp', q: 'mv-tilt', bang: 'mv-hop', heart: 'mv-hop', note: 'mv-sway', sweat: 'mv-shiver' };
