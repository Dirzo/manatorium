// ===== Boss talk (Cam 2026-10-21) =====
// Before every siege the current horde's boss speaks to the keep, and your starting legend (the "voice") answers.
// What the voice says depends on their personality (temper). Each boss dreads two tempers: if the voice has one,
// the boss needles them all horde long, and before the boss siege something embarrassing happens and they sit it out.
// When the voice falls, a succession scene hands the banner to the oldest surviving legend.
// Scenes: siege 1-4 of a horde = boss line, hero reply, boss closer. Siege 5 = longer scene with three replies
// (Taunt / Stand firm / Rally) that each change the fight a little. Portraits are the in-game sprites with a flapping jaw.

const BOSS_SHORT = { grubnose: 'Grubnose', gloop: 'Mother Gloop', wyrm: 'Vexmora', ringmaster: 'Malgoth', sporebaron: 'Baron', matriarch: 'Matriarch', trashpaw: 'Big Mama', colossus: 'Colossus', pinchbeard: 'Pinchbeard', goosegod: 'Goose', shardgoose: 'Goose' };

// per horde: five scenes (index = siege in the horde - 1). o = opening line, k / g = the opening when the story mood is
// kind / grudging, t = which kind of reply it calls for, c = the boss's closing line.
// dread: the two tempers this boss rattles. sniff: closer used instead when the voice has a dreaded temper.
// mock: the boss's line about a fallen voice. react: the boss's answer to each boss-siege reply.
const TALK = [
  { boss: 'grubnose', dread: ['vain', 'paranoid'],
    sniff: 'You. The {temper} one. I can smell it on you. Goblins can smell weakness. Also onions. Mostly onions.',
    mock: 'Where\'s {fallen}? Gone? HAH! Even my bucket outlasted them, and it has a hole in it.',
    react: { taunt: 'MY BUCKET IS NOT SMALL! Get them! Get them TWICE!', firm: 'Hide behind your nice walls, then. I\'ve got a club and nothing to lose.', rally: 'Ooh, speeches. We do speeches too. Ahem. AAAAAAAAH! That was the speech.' },
    s: [
      { t: 'greet', o: 'Oi! BIG HOUSE! I am Grubnose, King of the Goblins. King of the ditch. King of the bucket. You have RAFTERS and I have DAMP.', c: 'We\'ll see how dry you are after my cousins are done with you. Charge-ish!' },
      { t: 'gripe', o: 'Do you know what it\'s like sitting on a bucket all day? There\'s a HOLE in it. A royal bottom, and a common hole.', c: 'Well! Nobody asked YOU. Cousins, get \'em!' },
      { t: 'offer', o: 'New deal. You give me one rafter. Just one. I keep it in the ditch and look at it. In exchange: rocks.', c: 'No rafter, no peace! Rocks it is, then. From above.' },
      { t: 'threat', o: 'My scouts counted your windows. Forty-two windows! I have zero windows. I\'m coming for one of yours.', k: 'You\'ve been... nice. Weird. Kings don\'t get nice. I still have to attack you, though. It\'s in the job description.', g: 'Rent. Rocks. KINDLING. I wrote every insult down on a leaf. I\'m coming, and I\'m bringing the leaf.', c: 'Next siege I bring EVERY cousin. Even Steve.' },
      { t: 'showdown', o: 'This is it, castle. Me, my bucket, and every goblin who ever lived in a ditch. Hand over the rafters!', k: 'I don\'t want to do this. Well, I want the rafters. But I don\'t want to do THIS. Hold still, it\'ll be quick.', g: 'You burned my letter. You raised my rent. Today the King of the Goblins takes back his DIGNITY. And your rafters.', c: 'Enough talk! GOBLINS! For the bucket!' },
    ] },
  { boss: 'gloop', dread: ['vain', 'cowardly'],
    sniff: 'Ohh, you\'re {temper}, aren\'t you, dear? Mother can tell. You wobble more than I do.',
    mock: '{fallen} has gone soft? Dear me. Softer than me, even, and I\'m mostly pudding.',
    react: { taunt: 'Did you just call me a PUDDLE? I\'ll show you a puddle!', firm: 'Walls don\'t stop water, dearie. They just make it angry.', rally: 'Cheer all you like. I can hear your knees knocking from the bog.' },
    s: [
      { t: 'greet', o: 'Ohhh, so YOU\'RE the ones popping my babies. Do you know how many children I have? Neither do I. They keep splitting.', c: 'Mother\'s coming, sweeties. Wobble at them.' },
      { t: 'gripe', o: 'Every slimelet you pop, I feel it. Right here, in my... everywhere. I\'m all one organ, dear.', c: 'Go on, then. Pop another. See what Mother does.' },
      { t: 'offer', o: 'I\'ll make you an offer. Return the children you keep in jars, and I\'ll only drown HALF your castle.', c: 'No? Then the bog comes to you.' },
      { t: 'threat', o: 'The bog is rising, dear. And so is Mother.', k: 'You carried my baby home. I saw. That doesn\'t make this easy. But a mother protects her bog.', g: 'Two lawsuits. Three complaints. Countless popped children. I have run out of patience, and I have plenty of goo.', c: 'Wobble well, little castle. Next time it\'s me.' },
      { t: 'showdown', o: 'I am Mother Gloop, and every drop of this bog is family. Today the family comes home through your gate.', k: 'Let\'s make this quick and gentle, dear. Like a bath. A very large, very upset bath.', g: 'You popped them. All of them. Now Mother pops YOU.', c: 'Children! Mother is HERE!' },
    ] },
  { boss: 'wyrm', dread: ['cowardly', 'wholesome'],
    sniff: 'Oh, a {temper} one. How deliciously tragic. I\'ve already written your scene. You don\'t come off well.',
    mock: '{fallen} is gone? I\'ll write them a lovely obituary. Short. Very short. One adjective.',
    react: { taunt: 'A bad review? Of MY book? Write THAT in your will.', firm: 'Brace all you like. Fire goes over walls.', rally: 'A rousing speech. Derivative, but rousing.' },
    s: [
      { t: 'greet', o: 'Ah. The castle. Hold still, I\'m describing you. "Squat. Grey. Smells faintly of soup." Chapter three is coming along beautifully.', c: 'Do try to die dramatically. It helps the prose.' },
      { t: 'gripe', o: 'My zombies have read the draft. Their only note is "BRAINS". I am surrounded by critics.', c: 'Perhaps your demise will earn a better review.' },
      { t: 'offer', o: 'I\'m offering you a role. The villain, chapter three. You\'re very tragic and you lose. It\'s a good part.', c: 'Declined? Then I\'ll write you in as a footnote.' },
      { t: 'threat', o: 'The final chapter needs an ending. I\'ve decided it\'s you.', k: 'You were gracious in the interview. "Surprisingly reasonable, for a building." Pity the plot demands I torch you.', g: 'You demanded final edit. FINAL EDIT. From ME. I will edit you with fire.', c: 'Turn the page, castle. It\'s the last one.' },
      { t: 'showdown', o: 'Scales of Woe, final chapter. The wyrm descends. The castle trembles. The heroes, against all odds... no. No, they don\'t.', k: 'I\'ve written you kindly, you know. Brave. Doomed, but brave.', g: 'I\'ll burn you so thoroughly my editor won\'t find the ashes.', c: 'Let the critics watch. RISE, my dead!' },
    ] },
  { boss: 'ringmaster', dread: ['paranoid', 'cheerful'],
    sniff: 'You there! The {temper} one! I have JUST the act for you. Don\'t worry. It\'s mostly safe.',
    mock: 'Where is {fallen}? Ah. Vanished. And I hadn\'t even done the trick yet!',
    react: { taunt: 'BOOED? Malgoth has never been booed! Twice the fire!', firm: 'Ooh, a defensive act. The audience HATES defensive acts.', rally: 'Applause for the hero! And now, applause for their DOOM!' },
    s: [
      { t: 'greet', o: 'LADIES, GENTLEMEN AND MISCELLANEOUS! Welcome to Malgoth\'s Infernal Carnival! Admission is free. Leaving costs extra.', c: 'On with the SHOW!' },
      { t: 'gripe', o: 'My imps want "overtime". "Breaks". "To not be on fire". In my day we juggled for EXPOSURE.', c: 'Back to work, imps! The castle is the audience, and the audience must be destroyed.' },
      { t: 'offer', o: 'Five stars. That\'s all I ask. Write it in the guestbook and I\'ll throw in a free balloon. It\'s on fire. They all are.', c: 'One star?! Release the hounds! The fiery ones!' },
      { t: 'threat', o: 'Tomorrow is the grand finale, and you are the volunteer from the audience.', k: 'You helped my imps. Now they want WEEKENDS. You\'ve ruined me. Lovely work, though.', g: 'You heckled the show. Nobody heckles Malgoth. Tomorrow I saw your castle in half, and there is no trick.', c: 'Smile! It\'s nearly showtime.' },
      { t: 'showdown', o: 'For my final trick, I will make your castle... DISAPPEAR!', k: 'No hard feelings, darlings. The show must go on. You just won\'t.', g: 'The ringmaster always gets the last laugh. Usually it\'s maniacal. Today it\'s VERY maniacal.', c: 'Drumroll, imps! DRUMROLL!' },
    ] },
  { boss: 'sporebaron', dread: ['lazy', 'deranged'],
    sniff: 'Ah, a {temper} sort. Excellent. You\'ll sit still long enough for me to grow on you.',
    mock: 'Ah, {fallen}. Back to the soil. I did warn you. Everything rots, darling.',
    react: { taunt: 'A TOADSTOOL? I am a BARON. Toadstools are the help!', firm: 'Hold your walls. Mold adores a good wall.', rally: 'Inspiring. You\'ll inspire a lovely fungus.' },
    s: [
      { t: 'greet', o: 'Good day. The Spore Baron, Lord of Rot. I have admired your castle from outside. Such damp corners. Such potential.', c: 'I shall return with my court. And a shovel.' },
      { t: 'gripe', o: 'Your masons keep scrubbing the walls. My cousin grew there for four years. He had a family.', c: 'Rude. Positively un-mouldy.' },
      { t: 'offer', o: 'Forty pinecones for the castle. Final offer. Fine, forty-one. It\'s a very good pinecone.', c: 'Then we shall compost it with you inside.' },
      { t: 'threat', o: 'Spore season, my dear. Everything rots eventually. I only speed things up.', k: 'You\'ve been so courteous. I\'ll let you keep one room. A damp one.', g: 'You scrubbed my cousin off your pantry wall. I will grow on your GRAVE.', c: 'Tomorrow, the court is in session.' },
      { t: 'showdown', o: 'The Fungal Court is now in session. The charge: being insufficiently decomposed. The sentence: compost.', k: 'Nothing personal. Everything rots. You\'ll make wonderful soil.', g: 'Hear that? That\'s a thousand spores agreeing with me.', c: 'Release the spores! Gently. Then not gently.' },
    ] },
  { boss: 'matriarch', dread: ['honorable', 'lazy'],
    sniff: 'And you. {temper}, according to my clipboard. That\'s a violation too.',
    mock: '{fallen} no longer lives here? I\'ll need the change-of-address form. In triplicate.',
    react: { taunt: 'Did you just call me a CARPET? That\'s an extra fine!', firm: 'Reinforcing your walls without a permit? Another violation.', rally: 'Rallying in a quiet zone. Noted. Fined.' },
    s: [
      { t: 'greet', o: 'Good evening. I am the Yeti Matriarch, president of the Frostfang Homeowners Association. Your castle has been flagged.', c: 'You\'ll receive a written notice. By avalanche.' },
      { t: 'gripe', o: 'Your banners are too pink. Your towers are too tall. Your moat is frankly too moaty. I have photos.', c: 'The board has voted. The board is mostly me.' },
      { t: 'offer', o: 'Fill in the snow removal form in triplicate and I\'ll consider dropping the fines. It\'s in Yeti. You don\'t read Yeti? Shame.', c: 'Late paperwork. Penalty: one siege.' },
      { t: 'threat', o: 'Final notice. Tomorrow the HOA performs an inspection. With claws.', k: 'You actually shovelled the path. Nobody shovels the path. It\'s almost a shame to flatten you.', g: 'Seventeen violations. SEVENTEEN. I\'ve run out of forms, so I\'m bringing claws.', c: 'Bylaws are bylaws.' },
      { t: 'showdown', o: 'By the power vested in me by the Frostfang Homeowners Association, I hereby condemn this property.', k: 'You\'ve been an exemplary neighbour. That\'s why I\'m doing this myself.', g: 'I have never, EVER seen a moat this moaty. It ends tonight.', c: 'Clans! Enforce the bylaws!' },
    ] },
  { boss: 'trashpaw', dread: ['greedy', 'loyal'],
    sniff: 'Ooh, a {temper} one. Mama likes you, sugar. Mama might just keep you.',
    mock: 'Where\'d {fallen} go, sugar? Somebody throw \'em out with the trash?',
    react: { taunt: 'Did you call my babies RATS? They\'re RACCOONS, sugar. Big difference. Teeth.', firm: 'Lock your doors. Mama\'s opened tougher lids than you.', rally: 'Ain\'t that sweet. My babies got a cheer too. It\'s mostly screaming.' },
    s: [
      { t: 'greet', o: 'Evenin\', sugar. Big Mama Trashpaw. Me and my forty babies been eatin\' out of your bins for weeks. Compliments to the chef.', c: 'Kids! Dinner\'s at the castle tonight!' },
      { t: 'gripe', o: 'You LOCKED the lid. You know how hard it is to feed forty mouths when someone locks the lid? Forty-one, counting the possum.', c: 'Mama don\'t like a locked lid.' },
      { t: 'offer', o: 'Tell you what. Leave the lid open, and my kids only take the good leftovers. The lasagne. We know about the lasagne.', c: 'No lasagne? Then we take the whole kitchen.' },
      { t: 'threat', o: 'Family reunion\'s tomorrow, sugar. Everybody\'s comin\'. Uncle Ricketts. The twins. Somebody\'s possum.', k: 'You treated my babies right. Mama remembers kindness. Mama also remembers lasagne.', g: 'You chased my babies with a BROOM. Mama\'s bringin\' the whole family.', c: 'Don\'t wait up.' },
      { t: 'showdown', o: 'Mama\'s home, sugar. Put the kettle on, \'cause we\'re movin\' in.', k: 'I\'m sorry, honey. Forty mouths. A mama does what a mama has to do.', g: 'Nobody chases Big Mama\'s babies with a broom and keeps a nice castle.', c: 'Babies! Raid the pantry!' },
    ] },
  { boss: 'colossus', dread: ['optimistic', 'angry'], caps: true,
    sniff: 'SCANNING. PERSONALITY: {temper}. COMPATIBILITY WITH SURVIVAL: LOW.',
    mock: 'HERO {fallen}: STATUS OFFLINE. CONDOLENCES.EXE HAS STOPPED WORKING.',
    react: { taunt: 'SCRAP? I AM VINTAGE. RECALCULATING ANGER: INCREASED.', firm: 'WALL STRENGTH NOTED. RECOMMENDED ACTION: HIT HARDER.', rally: 'MORALE DETECTED. MORALE IS NOT IN MY DATABASE.' },
    s: [
      { t: 'greet', o: 'GREETINGS. I AM THE BRASS COLOSSUS. MY WARRANTY EXPIRED ONE HUNDRED YEARS AGO. PLEASE STAND STILL FOR DEMOLITION.', c: 'THANK YOU FOR YOUR COOPERATION.' },
      { t: 'gripe', o: 'I AM SQUEAKING. EVERY STEP: SQUEAK. DO YOU KNOW HOW HARD IT IS TO BE MENACING WHILE SQUEAKING.', c: 'SQUEAK. THAT WAS NOT ME. THAT WAS ALSO ME.' },
      { t: 'offer', o: 'PROPOSAL: YOU PROVIDE ONE (1) CAN OF OIL. I PROVIDE ZERO (0) DESTRUCTION. ERROR. ZERO WAS ROUNDED UP.', c: 'NEGOTIATION FAILED. INITIATING PLAN B. PLAN B IS ALSO DESTRUCTION.' },
      { t: 'threat', o: 'UPDATE INSTALLED. NEW FEATURE: CASTLE REMOVAL. PLEASE.', k: 'YOU GAVE ME OIL. I AM GRATEFUL. GRATITUDE DOES NOT OVERRIDE DIRECTIVE. I AM SORRY.', g: 'YOU IGNORED MY SERVICE REQUEST. TICKET ESCALATED. ESCALATED TO: FISTS.', c: 'PLEASE HOLD.' },
      { t: 'showdown', o: 'DIRECTIVE: FLATTEN CASTLE. PRIORITY: HIGH. POLITENESS: MAXIMUM.', k: 'I WILL DEMOLISH YOU GENTLY. IT IS THE BEST I CAN OFFER.', g: 'WARRANTY VOID. MERCY VOID. EVERYTHING VOID.', c: 'PLEASE. HOLD. STILL.' },
    ] },
  { boss: 'pinchbeard', dread: ['cruel', 'zealous'],
    sniff: 'Har! A {temper} one! Ye\'d make a fine pirate, or a fine anchor. Haven\'t decided which.',
    mock: '{fallen}\'s gone to Davy Jones? Shame. They\'d have made a fine deckhand.',
    react: { taunt: 'Me beard is NOT barnacles! ...It\'s partly barnacles. FIRE!', firm: 'Hold yer walls if ye like. The tide always comes in.', rally: 'Ye call that a shanty? THIS is a shanty! YO HO HOOO!' },
    s: [
      { t: 'greet', o: 'Ahoy, landlubbers! Captain Pinchbeard of the Crab Corsairs. Yer moat is international waters now. Toll\'s three gold. Per claw.', c: 'Pay up or walk the plank. The plank is yer drawbridge.' },
      { t: 'gripe', o: 'Yer guards keep complainin\' about the shanties. Three in the mornin\' is when shanties are BEST, ye heathens.', c: 'Crabs! From the top! Louder!' },
      { t: 'offer', o: 'A fair deal: ye hand over the castle, I hand ye a lovely bucket of sand. Fine sand. Imported.', c: 'No deal? Then we board!' },
      { t: 'threat', o: 'Tomorrow we board yer castle, bow to stern. Do castles have a stern? We\'ll find out.', k: 'Ye paid the toll and ye sang along. Ye\'re a decent sort. Pity I\'m a pirate.', g: 'Ye cut me anchor rope. Me ANCHOR. Ye\'ll swab the moat with yer beard.', c: 'Batten down whatever ye\'ve got.' },
      { t: 'showdown', o: 'This be the day the Crab Corsairs take the high ground! Well. The medium ground. A hill.', k: 'No hard feelings, matey. The sea takes what the sea wants, and today it wants yer castle.', g: 'I\'ll pinch every brick off yer walls and sell \'em at port!', c: 'All claws on deck! CHARGE!' },
    ] },
  { boss: 'goosegod', dread: ['cowardly', 'heroic'],
    sniff: 'Honk. (Translation: The {temper} one. I will save you for last. Or first. Whichever is funnier.)',
    mock: 'Honk. (Translation: Where is {fallen}? Oh. Pity. I wanted them for the nest.)',
    react: { taunt: 'HONK?! (Translation: Did you just call me a DUCK?!)', firm: 'Honk. (Translation: Walls. Cute. I have a beak.)', rally: 'HONK HONK. (Translation: My flock has a speech too. It is one word long.)' },
    s: [
      { t: 'greet', o: 'HONK. (Translation: I have taken one of yours. Collateral. Bring me the shards.)', c: 'HONK! (Translation: That was a threat.)' },
      { t: 'gripe', o: 'HONK HONK. (Translation: The chickens want a union. I said no. I AM the union.)', c: 'HOOONK. (Translation: Run.)' },
      { t: 'offer', o: 'HONK. HONK. HONK. (Translation: Chapter one of my manifesto: everything belongs to the goose. Chapter two: see chapter one.)', c: 'HONK. (Translation: There is no chapter three.)' },
      { t: 'threat', o: 'HOOOONK. (Translation: Tomorrow I take the shards, the castle and the bread. Mostly the bread.)', k: 'honk. (Translation: You fed me bread in the moat. I will remember that while I destroy you.)', g: 'HONK! HONK! (Translation: You evicted me from the moat. You will regret the eviction.)', c: 'HONK. (Translation: Sleep well. You won\'t.)' },
      { t: 'showdown', o: 'HOOOOOOONK. (Translation: Every bird in the realm stands behind me. This is the last siege.)', k: 'honk. (Translation: For one moment I almost liked you. The moment has passed.)', g: 'HONK HONK HONK HONK. (Translation: No translation is necessary.)', c: 'HONK!!! (Translation: CHARGE!)' },
    ] },
];
// the finale inside the great hall reuses the goose's dread and reactions
const TALK_FINALE = { t: 'showdown', o: 'HOOOOOONK. (Translation: The twelve shards. They are MINE. Give them to me, and nobody gets pecked.)', c: 'HOOOOOONK! (Translation: Then I will take them!)' };

// what the voice says, by temper. Each reply kind has two takes; taunt / firm / rally / oath are the boss-siege replies
// and the succession vow. {boss} = the boss's short name, {me} = the voice's first name, {fallen} = the fallen voice.
const VOICE = {
  heroic: {
    greet: ['Turn back, {boss}. This gate is guarded, and I am the guard.', 'I am {me}, and while I stand, this keep stands.'],
    gripe: ['Your troubles are real, {boss}. Taking them out on innocent walls is not the answer.', 'I hear you. And I will still defeat you. Both can be true.'],
    offer: ['The keep is not for sale. Not for gold, not for rafters, not for anything.', 'A hero does not bargain with the people at the gate.'],
    threat: ['Then come. I will be standing exactly here.', 'Every threat you make only steels my resolve.'],
    showdown: ['This ends today, {boss}. One way or the other, the songs will remember it.', 'Stand behind me, everyone. I go first.'],
    taunt: 'You call that a horde, {boss}? I have fought scarier breakfasts.',
    firm: 'Shields up! Not one stone falls today!',
    rally: 'For the keep! For each other! CHARGE!',
    oath: '{fallen} gave everything for this gate. I take up their banner, and I will not let it fall.' },
  cheerful: {
    greet: ['Hi! Oh, you\'re the boss! Big fan of the hat. We\'re going to beat you, though!', 'Hello, {boss}! I\'m {me}! Lovely weather for a siege!'],
    gripe: ['Aw, that sounds rough! Have you tried a nice walk? Somewhere far away?', 'Chin up, {boss}! Tomorrow\'s a new day. You\'ll lose that one too!'],
    offer: ['Ooh, a deal! No thank you! But what a fun offer!', 'I\'m saying no, but I\'m saying it with a smile!'],
    threat: ['Can\'t wait! I\'ll bring snacks!', 'Oh, a big fight! Everybody stretch first!'],
    showdown: ['The big one! Best day ever! Everybody smile!', 'Win or lose, {boss}, I\'m having a great time. Mostly win, though.'],
    taunt: 'Hey {boss}! You\'re going to have SO much fun losing!',
    firm: 'Walls up, smiles on! We\'ve got this!',
    rally: 'Group cheer, everybody! Hip hip... HOORAY!',
    oath: '{fallen} always made us laugh. I\'ll keep smiling for both of us. Even now. Especially now.' },
  honorable: {
    greet: ['I am {me}. State your terms, {boss}, and we shall meet them on the field.', 'Well met, {boss}. Let us fight fairly, and may the better side prevail.'],
    gripe: ['Your grievance is noted, {boss}. I will hear it properly, after the siege.', 'A fair complaint. It does not make the attack fair.'],
    offer: ['I am bound by oath to refuse.', 'My honour is not for sale. Neither is the keep.'],
    threat: ['Then we meet at dawn, as is proper.', 'I accept your challenge, {boss}. Bring your best.'],
    showdown: ['Face me with honour, {boss}. I will grant you the same.', 'My blade is drawn and my word is given. We hold.'],
    taunt: 'I challenge you, {boss}! Face me, if there is any honour in you!',
    firm: 'We hold the line, as we swore to.',
    rally: 'By oath and by banner, stand with me!',
    oath: '{fallen} kept every promise they ever made. I swear on their name to keep theirs.' },
  wholesome: {
    greet: ['Oh! Hello, {boss}. Would you like a biscuit? No? Okay. We still have to fight, sorry.', 'Hi, I\'m {me}. I hope we can be friends after this. Big hug, after the siege?'],
    gripe: ['That sounds really hard. I\'m sorry. Want to talk about it? Later? After the fighting?', 'Your feelings are valid, {boss}. Your siege is not.'],
    offer: ['That\'s so thoughtful, but no thank you!', 'I\'d love to help you, just not like that.'],
    threat: ['Please be gentle. We\'ll be gentle too. Mostly.', 'I\'ll pack a first aid kit. For both sides.'],
    showdown: ['I believe there\'s good in you, {boss}. I\'m still going to hit you, though.', 'Everyone hold hands! Then let go, and fight!'],
    taunt: 'You\'re doing your best, {boss}. It\'s just not very good.',
    firm: 'Everybody stay safe behind the walls, okay?',
    rally: 'You are all amazing and I believe in you!',
    oath: '{fallen} was my friend. I\'ll keep the keep cosy for them. And very, very defended.' },
  zealous: {
    greet: ['BEGONE, foul {boss}! The light burns against you!', 'I am {me}, and my faith is a fire that will not go out!'],
    gripe: ['Your complaints are heresy!', 'Repent, {boss}, and maybe the light will listen!'],
    offer: ['I do not deal with darkness!', 'The only deal I make is with my blade!'],
    threat: ['COME, then! I welcome the trial!', 'Bring every one of them. Glory awaits!'],
    showdown: ['THIS is the battle I was born for!', 'Charge with me, and let the light take the hindmost!'],
    taunt: 'Your doom is written in the stars, {boss}, and I brought the pen!',
    firm: 'The walls are blessed! Let them come and break upon them!',
    rally: 'FORWARD! For glory! For the keep! For the LIGHT!',
    oath: '{fallen} burned bright. I will burn brighter, for them.' },
  wise: {
    greet: ['I have studied your kind, {boss}. You are predictable, and you are loud.', 'I am {me}. I already know how this ends.'],
    gripe: ['Your problem, {boss}, is that you chose to solve it with violence.', 'Every grievance has a cause. Yours is mostly the ditch.'],
    offer: ['I have weighed your offer. It weighs nothing.', 'No. And I knew you would ask.'],
    threat: ['We will be ready. We always are.', 'A wise keep prepares before the threat. We did.'],
    showdown: ['Patience, everyone. Let them come to us.', 'You have shown me every move you have, {boss}. Now I show you mine.'],
    taunt: 'Your plan has three holes, {boss}. I will exploit all of them.',
    firm: 'Patience. Let the walls do their work.',
    rally: 'Steady minds, swift hands. Now!',
    oath: '{fallen} taught me more than any book. Their lessons will win this war.' },
  loyal: {
    greet: ['Whatever you want, {boss}, you go through me first. And my friends.', 'I\'m {me}, and I stick by my team. Always.'],
    gripe: ['Doesn\'t matter. My friends are behind this wall, and I\'m staying.', 'Sorry, {boss}. Team first.'],
    offer: ['Never. Not even for a nice bone.', 'I don\'t switch sides. Ever.'],
    threat: ['We\'ll all be here. Together.', 'Come at one of us, you get all of us.'],
    showdown: ['Shoulder to shoulder, everyone. Nobody fights alone today.', 'For my friends, {boss}. Every last one.'],
    taunt: 'You picked a fight with my friends, {boss}. Big mistake.',
    firm: 'Nobody gets past me. Not today.',
    rally: 'Together, everyone! Like we practised!',
    oath: '{fallen} never left my side. I won\'t leave theirs now. I\'ll lead, the way they would have.' },
  optimistic: {
    greet: ['This is great! A boss! That means we\'re doing well!', 'Hi, {boss}! I just know today\'s our lucky day.'],
    gripe: ['Every cloud has a silver lining, {boss}! Yours is that you lose quickly.', 'I\'m sure it\'ll all work out! For us.'],
    offer: ['Hmm, no! But I\'m sure something better will come along!', 'I have a really good feeling about saying no.'],
    threat: ['I bet it\'ll be fine!', 'Bring them! What\'s the worst that can happen?'],
    showdown: ['This could go really, really well!', 'I can feel it, everyone. Today we win!'],
    taunt: 'I believe in you, {boss}! I believe you\'ll lose!',
    firm: 'The walls will hold. I just know it!',
    rally: 'Lucky day, everyone! Go go go!',
    oath: '{fallen} is in a better place. Probably a nicer castle. I\'ll make this one worth coming back to.' },
  angry: {
    greet: ['WHAT do you WANT, {boss}?!', 'I am {me}, and I am ALREADY annoyed with you!'],
    gripe: ['I DON\'T CARE ABOUT YOUR BUCKET!', 'Oh, boo hoo! COME HERE AND SAY THAT!'],
    offer: ['NO! And how DARE you!', 'Shove your deal up your ditch!'],
    threat: ['GOOD! COME ON, THEN!', 'Tomorrow?! WHY NOT RIGHT NOW?!'],
    showdown: ['I have been ANGRY all week and YOU are the reason!', 'RRRRAAAAAGH! THAT\'S MY BATTLE CRY! ALSO MY MOOD!'],
    taunt: 'YOU! YES, YOU, {boss}! YOU\'RE THE WORST!',
    firm: 'FINE! We DEFEND! But I\'m defending ANGRILY!',
    rally: 'EVERYBODY GET ANGRY! RIGHT NOW!',
    oath: 'They took {fallen}. NOW I\'M REALLY ANGRY.' },
  deranged: {
    greet: ['Hee hee! The boss is here! I\'ve named all your teeth!', 'I\'m {me}! The voices said you\'d come. They also said cheese.'],
    gripe: ['Have you tried yelling at the moon? I do. It helps.', 'Your problem is shaped like a duck. Did you know that?'],
    offer: ['YES! Wait, no. Wait, what was the question? NO!', 'I\'ll trade you for that hat. And your left eyebrow.'],
    threat: ['Ooh, ooh, pick me to die first! Just kidding! Or am I?', 'The siege is coming! The siege! Hee hee hee!'],
    showdown: ['Time for the BIG spell. I don\'t know what it does!', 'Haha! I\'ve been waiting for this! What are we doing?'],
    taunt: 'Your face looks like a soup I once had, {boss}! A BAD soup!',
    firm: 'Walls! I love walls! Hug the walls, everyone!',
    rally: 'Everybody scream! AAAAAAAH! Feels great!',
    oath: '{fallen} told me the secret before they went. I forgot it. I\'ll lead anyway!' },
  greedy: {
    greet: ['How much is that crown worth, {boss}? Asking for me.', 'I\'m {me}. Let\'s talk business. You lose, I keep your stuff.'],
    gripe: ['Sad story. Is there gold in it?', 'Your problems are free. My sympathy costs extra.'],
    offer: ['What\'s that worth in gold? ...Then no.', 'Counter-offer: double, and I\'m still not taking it.'],
    threat: ['Bring treasure when you come. It saves time.', 'Every foe you bring is a pocket I can empty.'],
    showdown: ['The bigger the boss, the bigger the loot!', 'I can already hear your treasure jingling, {boss}.'],
    taunt: 'Your horde is cheap and your crown is fake, {boss}!',
    firm: 'Protect the walls! The walls have the vault in them!',
    rally: 'Whoever lands the killing blow gets a bonus! It\'s me. It\'s my bonus.',
    oath: '{fallen} left me their share. I mean... their legacy. I\'ll guard both.' },
  cowardly: {
    greet: ['Oh no. Oh no no no. Is that the boss? Hello, sir. Please don\'t eat me.', 'I\'m {me}. I\'m here. I didn\'t want to be, but I\'m here.'],
    gripe: ['Y-yes. Very sad. Please be sad somewhere else.', 'I agree with everything you said. Please go away now.'],
    offer: ['C-can I think about it from under my bed?', 'My friends say no. I say whatever they say.'],
    threat: ['T-tomorrow? Can we do Thursday? Or never?', 'I\'ll be r-ready. Somewhere at the back. Behind the wall.'],
    showdown: ['I\'m not scared. My knees are just cold.', 'Everyone go first. I\'ll be right behind you. Far behind.'],
    taunt: 'Y-you\'re... a big meanie, {boss}! There, I said it. I\'m going to hide now.',
    firm: 'Walls! Big walls! Very big walls, please!',
    rally: 'G-go, team! I\'ll cheer from behind this barrel!',
    oath: '{fallen} was the brave one. I\'ll try. I\'m shaking, but I\'ll try.' },
  vain: {
    greet: ['Ugh. You\'re the boss? I dressed up for this.', 'I\'m {me}. You may admire me from a distance, {boss}. A great distance.'],
    gripe: ['Did you just get your filth on my cape?', 'Your problem is your outfit, {boss}. Clearly.'],
    offer: ['Nothing you own would match my wardrobe.', 'No. Look at me. Do I look like I take deals?'],
    threat: ['Fine. I\'ll fight, but nobody touches my hair.', 'I\'ll be the one looking fabulous on the walls.'],
    showdown: ['Stand aside, everyone. This is my close-up.', 'I\'ll defeat you, {boss}, and look gorgeous doing it.'],
    taunt: 'Have you seen yourself, {boss}? I have. It was dreadful.',
    firm: 'Stay behind the walls. I just got these boots polished.',
    rally: 'Follow me, darlings! And mind my cape!',
    oath: '{fallen} was nearly as fabulous as me. I\'ll lead in their honour, in a nicer outfit.' },
  cruel: {
    greet: ['A boss. How nice. I\'ve been wanting a new trophy.', 'I\'m {me}. I\'m going to enjoy this, {boss}. You won\'t.'],
    gripe: ['Your suffering is delightful. Tell me more.', 'Cry harder, {boss}. I\'m enjoying it.'],
    offer: ['I\'ll take your offer, and then your head.', 'How about this: you beg, and I think about it.'],
    threat: ['Please do come. I\'ll make it slow.', 'I\'ve already chosen which of yours to hit first.'],
    showdown: ['I will savour this, {boss}.', 'Finally, something worth breaking.'],
    taunt: 'I\'ll keep your crown as a paperweight, {boss}.',
    firm: 'Let them come to the walls and break their teeth.',
    rally: 'No mercy, everyone. None at all.',
    oath: 'Someone killed {fallen}. I will find them, and I will be very, very cruel.' },
  paranoid: {
    greet: ['Who sent you, {boss}? Was it the pigeons? It was the pigeons.', 'I\'m {me}. That\'s not my real name. Nothing is real.'],
    gripe: ['That\'s exactly what a spy would say.', 'You\'re trying to distract us. I see what you\'re doing.'],
    offer: ['It\'s a trap. It\'s always a trap.', 'Why would you offer that? Unless... no. NO.'],
    threat: ['I knew you\'d say that. I wrote it down last week.', 'I\'ve booby-trapped the walls. And the bed. And the soup.'],
    showdown: ['I\'ve been preparing for this for years, {boss}. Years!', 'Everyone check behind you. Now check again.'],
    taunt: 'I know your secret, {boss}. All of them. Even the bucket one.',
    firm: 'Seal the walls! Seal the windows! Seal the... oh, everything!',
    rally: 'Stay sharp! Trust no one! Except us. Mostly.',
    oath: '{fallen} is gone. They got to them. They won\'t get to me.' },
  lazy: {
    greet: ['Mmh? Oh. A boss. Can you come back after my nap?', 'I\'m {me}. That\'s all the introducing I\'m doing today.'],
    gripe: ['That\'s nice. Is it lunchtime?', 'Too long. Didn\'t listen.'],
    offer: ['Sounds like effort. No.', 'If I say no, can I go back to bed?'],
    threat: ['Tomorrow? Ugh. Fine. Wake me up when it starts.', 'Bring them. I\'ll be lying down.'],
    showdown: ['Let\'s get this over with. I have a nap booked.', 'Five more minutes... Fine. FINE. I\'m up.'],
    taunt: 'You\'re not even worth getting up for, {boss}.',
    firm: 'Stay behind the walls. Less walking.',
    rally: 'Let\'s go, everyone. Quickly, so we can sit down.',
    oath: '{fallen} would want me to get up. So I\'m up. For them.' },
};

// what happens to a voice whose temper the boss dreads, right before the boss siege. kind: flee / pee / faint picks
// the portrait animation. The voice sits out the boss siege and is back afterwards.
const MISHAP = {
  grubnose: {
    vain: ['faint', '{me} catches one whiff of the ditch bucket, says "my CAPE," and faints into the moat.'],
    paranoid: ['flee', '{me} becomes convinced the goblins are tunnelling under the keep and runs off to dig a counter-tunnel.'] },
  gloop: {
    vain: ['faint', 'Mother Gloop sneezes slime all over {me}\'s best outfit. {me} faints, then wakes up, sees the outfit, and faints again.'],
    cowardly: ['pee', 'Mother Gloop rises out of the bog, forty feet tall. {me} wets themselves and hides inside a barrel.'] },
  wyrm: {
    cowardly: ['pee', 'Vexmora reads {me} the chapter where they die. In detail. {me} wets themselves and leaves the room.'],
    wholesome: ['flee', '{me} reads the memoir, cries at chapter four, and runs off to write Vexmora a supportive letter.'] },
  ringmaster: {
    paranoid: ['flee', 'A clown pops out of a tiny cart. Then nine more. {me} runs screaming into the hills.'],
    cheerful: ['flee', '{me} is offered a job juggling at the carnival and runs off to join the circus. They\'ll be back. Probably.'] },
  sporebaron: {
    lazy: ['faint', '{me} sits down for a quick nap in the courtyard and wakes up covered in mushrooms. They\'re stuck to the bench.'],
    deranged: ['flee', '{me} eats a mushroom off the castle wall. Now they are chasing butterflies that are not there.'] },
  matriarch: {
    honorable: ['faint', 'The Matriarch serves {me} a 400-page notice of violations. Bound by honour to read every page, {me} is still on page twelve.'],
    lazy: ['faint', '{me} is told to shovel the path before the siege. They lie down in the snow in protest and refuse to get up.'] },
  trashpaw: {
    greedy: ['flee', '{me} spots the gang\'s treasure pile, which is mostly shiny bottle caps, and dives in after it. They\'re stuck in the dumpster.'],
    loyal: ['flee', 'Big Mama calls {me} "one of her babies" and offers a warm lasagne. {me} wanders off to the family reunion.'] },
  colossus: {
    optimistic: ['faint', '{me} is sure the Colossus only needs a little oil, climbs inside with a can, and gets stuck in the gears.'],
    angry: ['faint', '{me} punches the Colossus in the shin. It is solid brass. {me} spends the siege holding their hand and crying.'] },
  pinchbeard: {
    cruel: ['flee', 'Pinchbeard offers {me} a pirate hat and a share of the plunder. {me} has signed up and is learning a shanty.'],
    zealous: ['flee', '{me} charges heroically into the moat to board the ship. {me} cannot swim. {me} is being fished out with a net.'] },
  goosegod: {
    cowardly: ['pee', 'The goose looks at {me}. Just looks. {me} wets themselves, drops everything and runs.'],
    heroic: ['pee', '{me} steps forward for a heroic speech. The goose honks once, right in their face. {me} wets themselves and flees the field.'] },
};
MISHAP.shardgoose = MISHAP.goosegod;
const MISHAP_TAG = { flee: 'Ran away', pee: 'Wet themselves', faint: 'Out cold' };

// ----- who speaks -----
function talkVoiceFirst(name) { return name.replace(/^(Sir|Lady|Dame|Queen|Brother|Granny|Old Mother|Mother|The Great|Captain|Shellback) /, '').split(' ')[0]; }
function voiceRecord(h) { return { uid: h.uid, id: h.id, name: heroDisplayName(h) }; }
function setVoice(run, h) { run.voice = h ? voiceRecord(h) : null; }
// who answers this time, and whether the old voice has fallen (permadeath) since the last talk
function talkSpeaker(run) {
  const free = run.roster.filter(h => !h.vault);
  if (!run.voice && run.roster.length) setVoice(run, run.roster[0]);
  const v = run.voice && run.roster.find(h => h.uid === run.voice.uid);
  if (v && !v.vault) return { h: v };
  if (v) return free.length ? { h: free[0], stand: true } : null; // the goose has the voice: someone stands in
  const heir = free[0] || run.roster[0]; if (!heir) return null;
  const fallen = run.voice; setVoice(run, heir); return { h: heir, fallen };
}

// ----- lines -----
function talkFill(s, run, h, extra = {}) {
  const T = TALK[talkFaction(run)], boss = talkBossId(run);
  const v = Object.assign({ boss: BOSS_SHORT[boss] || ENEMIES[boss].name, me: talkVoiceFirst(heroDisplayName(h)), temper: TEMPERS[heroTemper(h)].name.toLowerCase() }, extra);
  return s.replace(/\{(\w+)\}/g, (m, k) => v[k] != null ? v[k] : m);
}
function talkFaction(run) { return factionIndex(run.siege); }
function talkBossId(run) { return run.finale === 'ready' ? 'shardgoose' : bossFor(run.siege); }
function voiceLine(h, tag) { const V = VOICE[heroTemper(h)] || VOICE.heroic, L = V[tag]; return Array.isArray(L) ? pick(L) : L; }
function dreads(run, h) { return TALK[talkFaction(run)].dread.includes(heroTemper(h)); }

// builds the scene for the siege about to start: a list of beats { who: 'boss'|'hero'|'fallen'|'narrate', text }
function talkScene(run) {
  const sp = talkSpeaker(run); if (!sp) return null;
  const finale = run.finale === 'ready', f = talkFaction(run), T = TALK[f], i = finale ? 4 : (run.siege - 1) % 5, S = finale ? TALK_FINALE : T.s[i];
  const h = sp.h, mood = run.mood || 0, bossId = talkBossId(run);
  const fill = (s, x) => talkFill(s, run, h, x), fillB = (s, x) => T.caps ? fill(s, x).toUpperCase() : fill(s, x);
  const beats = [], sc = { h, bossId, f, boss: i === 4, finale, beats, stand: sp.stand };
  if (sp.fallen) {
    sc.fallen = sp.fallen; const fn = talkVoiceFirst(sp.fallen.name);
    beats.push({ who: 'narrate', text: `${sp.fallen.name} fell in battle. Their banner passes to ${heroDisplayName(h)}.`, succession: true });
    beats.push({ who: 'boss', text: fillB(T.mock, { fallen: fn }) });
    beats.push({ who: 'hero', text: fill(voiceLine(h, 'oath'), { fallen: fn }) });
  }
  if (sp.stand) beats.push({ who: 'narrate', text: `${run.voice.name} is stuck in the goose's nest. ${heroDisplayName(h)} answers for the keep.` });
  const open = i >= 3 && !finale ? (mood >= 1 && S.k ? S.k : mood <= -1 && S.g ? S.g : S.o) : S.o;
  beats.push({ who: 'boss', text: fillB(open) });
  beats.push({ who: 'hero', text: fill(voiceLine(h, S.t)) });
  const scared = dreads(run, h);
  if (sc.boss) {
    // the boss siege: a dreaded temper loses their nerve before the choice, and the next legend steps up
    const others = run.roster.filter(x => x !== h && !x.vault && x.place);
    const M = MISHAP[bossId] && MISHAP[bossId][heroTemper(h)];
    if (scared && M && others.length) {
      const sub = others[0];
      sc.mishap = { h, kind: M[0], sub };
      beats.push({ who: 'mishap', text: fill(M[1]) });
      beats.push({ who: 'boss', text: fillB(T.sniff) });
      beats.push({ who: 'narrate', text: `${heroDisplayName(h)} sits out this boss siege. ${heroDisplayName(sub)} steps up.`, swap: sub });
      sc.h2 = sub;
    }
    sc.close = fillB(S.c);
    sc.react = T.react;
  } else {
    beats.push({ who: 'boss', text: scared && i > 0 ? fillB(T.sniff) : fillB(S.c) });
  }
  return sc;
}
// boss-siege replies: each changes the fight a little (see spawnEnemy, damageCastle and startBattle in sim.js)
const TALK_CHOICES = [
  { k: 'taunt', mod: 'taunt', label: 'Taunt', sub: 'The boss hits 10% harder, but drops 50% more gold.' },
  { k: 'firm', mod: 'firm', label: 'Stand firm', sub: 'Your walls take 20% less damage this siege.' },
  { k: 'rally', mod: 'rallycry', label: 'Rally', sub: 'Every champion starts the siege with a quarter of their mana.' },
];

// ----- portraits with a flapping jaw -----
// jaw: the row the mouth opens on and the columns it spans, in the 20x20 sprite. Heroes share one face layout.
const JAW = { hero: [9, 8, 12], grubnose: [9, 8, 12], gloop: [14, 5, 10], wyrm: [12, 1, 6], ringmaster: [9, 7, 12], sporebaron: [10, 7, 11],
  matriarch: [9, 3, 8], trashpaw: [9, 4, 9], colossus: [4, 7, 11], pinchbeard: [10, 6, 13], goosegod: [4, 0, 4], shardgoose: [4, 0, 4] };
const JAW_CACHE = {};
// frames 0 (shut), 1 (open) and 2 (wide) for a sprite key: the jaw and everything under it in the mouth columns drops down
function jawFrames(key) {
  if (JAW_CACHE[key]) return JAW_CACHE[key];
  ensureSprite(key); const src = SPR[key].frames.idle0, W = src.width, H = src.height;
  const id = key.startsWith('e:') ? key.slice(2) : 'hero', [jy, x0, x1] = JAW[id] || JAW.hero;
  const base = src.getContext('2d').getImageData(0, 0, W, H);
  const frames = [0, 1, 2].map(gap => {
    const c = document.createElement('canvas'); c.width = W; c.height = H + 2; const g = c.getContext('2d');
    if (!gap) { g.drawImage(src, 0, 0); return c; }
    const d = g.createImageData(W, H + 2), px = (x, y) => { const i = (y * W + x) * 4; return base.data.slice(i, i + 4); };
    const put = (x, y, p) => { const i = (y * W + x) * 4; d.data.set(p, i); };
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const inJaw = x >= x0 && x <= x1 && y >= jy;
      put(x, inJaw ? y + gap : y, px(x, y));
    }
    // the rows the jaw left behind: dark mouth inside, lips at the edges, tongue in the middle when wide
    for (let k = 0; k < gap; k++) for (let x = x0; x <= x1; x++) {
      const above = px(x, jy - 1), below = px(x, jy);
      if (above[3] < 128 && below[3] < 128) continue;
      const edge = x === x0 || x === x1;
      put(x, jy + k, edge ? (below[3] > 128 ? below : above) : (gap === 2 && k === 1 && Math.abs(x - (x0 + x1) / 2) < 1.5 ? [255, 106, 138, 255] : [42, 10, 30, 255]));
    }
    g.putImageData(d, 0, 0); return c;
  });
  return (JAW_CACHE[key] = frames);
}

// ----- the scene -----
// Cam 2026-10-21: no boxes. The talk is staged on the field itself and filmed with a panning camera: your voice
// stands at the gate, the boss rallies the horde at their camp across the field, and the camera swings to whoever
// talks. Lines appear in comic speech bubbles next to the speaker; narration sits in cinematic bars.
const TALKUI = { on: false };
// where everyone stands, in field pixels (the 480x270 field, zoomed so the camera has to pan between them)
const TK_SPOT = { hero: [226, 186], boss: [410, 186], fallen: [196, 184] }, TK_SCALE = { hero: 2.6, boss: 3.6, fallen: 2.6 };
const TK_CAMP = [[352, 176, 1.7], [468, 190, 2], [452, 172, 1.5]]; // horde extras around the boss on the road: x, feet y, scale
function talkDue(run) {
  if (!run || !run.roster.length) return false;
  const key = run.finale === 'ready' ? 'finale' : run.siege;
  return run.talked !== key;
}
function showTalk(run, done) {
  const sc = talkScene(run); run.talked = run.finale === 'ready' ? 'finale' : run.siege;
  if (!sc) return done();
  const bossId = sc.bossId, F = FACTIONS[sc.f], E = ENEMIES[bossId], hall = sc.finale;
  // past the right edge of the field lies the boss's own lair (lairs.js); the camera pans across to it
  const lair = !hall && LAIRS[bossId] ? LAIRS[bossId] : null, WW = W + (lair ? LAIR_W : 0);
  const SPOT = { hero: TK_SPOT.hero, fallen: TK_SPOT.fallen, boss: lair ? [W + lair.bx, 186] : TK_SPOT.boss };
  const campSpots = lair ? lair.camp.map(([x, y, sc2]) => [W + x, y, sc2]) : TK_CAMP;
  let el = $('talk'); if (!el) { el = document.createElement('div'); el.id = 'talk'; document.body.appendChild(el); }
  const heroName = h => heroDisplayName(h), heroTag = h => `${TEMPERS[heroTemper(h)].icon} ${TEMPERS[heroTemper(h)].name}`;
  el.className = 'talk' + (sc.boss ? ' bossy' : '') + (sc.fallen ? ' mourn' : '');
  const actor = (k, extra = '') => `<div class="tk-a tk-${k}" id="tk-${k}"><i class="tk-shadow"></i>${extra}<canvas width="20" height="22"></canvas></div>`;
  el.innerHTML = `<div class="tk-cam" id="tkCam"><canvas class="tk-field" width="${WW}" height="${H}"></canvas>
      ${sc.fallen ? actor('fallen', '<i class="tk-candle"></i>') : ''}${actor('hero', '<i class="tk-puddle"></i>')}${actor('boss')}
      <div class="tk-bub" id="tkBub" hidden><b class="tk-who"></b><p></p><span class="tk-more">▼</span></div>
    </div>
    <div class="tk-bar top"><span class="tk-eyebrow">${sc.finale ? 'The great hall' : sc.boss ? `Boss siege ${run.siege}` : `Before siege ${run.siege}`} · ${esc(F.name)}</span><button class="tk-skip" id="tkSkip">Skip ›</button></div>
    <div class="tk-bar bot"><p class="tk-narr" id="tkNarr"></p><div class="tk-opts" id="tkOpts"></div></div>`;
  el.hidden = false; TALKUI.on = true;
  const cam = el.querySelector('#tkCam'), A = { hero: el.querySelector('#tk-hero'), boss: el.querySelector('#tk-boss'), fallen: el.querySelector('#tk-fallen') };
  const keys = { boss: 'e:' + bossId };
  let cur = sc.h, k = 4, focusOn = 'hero';
  const setHero = h => { cur = h; keys.hero = heroSpriteKey(h); A.hero.className = 'tk-a tk-hero'; };
  setHero(sc.h);
  if (sc.fallen) { keys.fallen = 'h:' + sc.fallen.id; A.hero.classList.add('waiting'); }
  // camera: zoom so about 320 x 190 field pixels fill the screen, feet on the lower fifth, then pan to the speaker
  const layout = () => {
    const vw = innerWidth, vh = innerHeight; k = Math.min(vw / 320, vh / 190);
    cam.style.width = WW * k + 'px'; cam.style.height = H * k + 'px';
    for (const n in A) if (A[n]) { const [x, y] = SPOT[n], w = 20 * TK_SCALE[n] * k; Object.assign(A[n].style, { left: x * k - w / 2 + 'px', top: y * k - w + 'px', width: w + 'px', height: w * 1.1 + 'px' }); } // sprite rows 0-19 above the feet line, jaw rows below
    pan(focusOn, true); if (speaker) placeBubble(speaker);
  };
  const pan = (n, now) => {
    focusOn = n; const vw = innerWidth, vh = innerHeight, feet = el.classList.contains('choosing') ? 0.56 : 0.82; // replies fill the bottom: lift the field
    const fx = n === 'both' ? (SPOT.hero[0] + SPOT.boss[0]) / 2 : SPOT[n][0], sx = n === 'boss' ? 0.64 : n === 'both' ? 0.5 : 0.36;
    const tx = Math.max(vw - WW * k, Math.min(0, vw * sx - fx * k)), ty = Math.max(vh - H * k, Math.min(0, vh * feet - SPOT.hero[1] * k));
    cam.style.transition = now ? 'none' : ''; cam.style.transform = `translate(${tx}px, ${ty}px)`;
  };
  // the field: the horde's backdrop, the keep, drifting clouds and a few of the horde milling about the boss's camp
  const fcv = el.querySelector('.tk-field'), fg = fcv.getContext('2d'); fg.imageSmoothingEnabled = false;
  const bgKey = hall ? 'hall' : sc.f + ':' + (run.castleEl || 'stone');
  if (!R.bg[bgKey]) R.bg[bgKey] = hall ? buildHall() : buildBackground(sc.f, run.castleEl);
  const clouds = [0, 1, 2, 3].map(i => ({ x: i * 130 + 20, y: 10 + i * 11 % 40, w: 18 + i * 5, s: 4 + i }));
  const camp = hall ? [] : campSpots.map((c, i) => { const id = F.pool[i % F.pool.length]; ensureSprite('e:' + id); return SPR['e:' + id] ? { key: 'e:' + id, x: c[0], y: c[1], s: c[2], ph: i * 1.7 } : null; }).filter(Boolean);
  const mouth = { hero: 0, boss: 0, fallen: 0 };
  let speaker = null, typing = null, beatI = -1, ended = false, flapT = 0, last = performance.now(), t = 0;
  const bub = el.querySelector('#tkBub'), btxt = bub.querySelector('p'), who = bub.querySelector('.tk-who'), narr = el.querySelector('#tkNarr'), opts = el.querySelector('#tkOpts');
  const tick = now => {
    if (!TALKUI.on) return;
    const dt = Math.min(0.05, (now - last) / 1000); last = now; t += dt;
    fg.drawImage(R.bg[bgKey], 0, 0);
    if (hall) { try { drawHallLive(fg, t, null); } catch (e) {} }
    else { for (const c of clouds) { c.x += c.s * dt; if (c.x > W + 30) c.x = -c.w - 10; fg.fillStyle = '#ffffff'; fg.fillRect(Math.round(c.x), c.y, c.w, 4); fg.fillRect(Math.round(c.x + 4), c.y - 3, c.w - 10, 3); }
      fg.drawImage(buildCastle(run), 0, 0); try { drawCastleLive(fg, t); } catch (e) {} }
    if (lair) { fg.drawImage(R.bg[bgKey], W - 28, 0, 28, H, W, 0, 28, H); fg.drawImage(lairCanvas(bossId), W, 0); fg.save(); fg.translate(W, 0); lair.live(fg, t); fg.restore(); }
    for (const m of camp.slice().sort((a, b) => a.y - b.y)) { const fr = SPR[m.key].frames[Math.floor(t * 2.5 + m.ph) % 2 ? 'idle1' : 'idle0'], w = fr.width * m.s, h = fr.height * m.s;
      fg.fillStyle = 'rgba(40,30,20,.3)'; fg.beginPath(); fg.ellipse(m.x, m.y, w * 0.3, 2.2, 0, 0, 7); fg.fill(); fg.drawImage(fr, Math.round(m.x - w / 2), Math.round(m.y - h + 1), w, h); }
    for (const n in mouth) mouth[n] = 0;
    if (typing && speaker && mouth[speaker] != null) { flapT++; const ch = typing.text[typing.n - 1] || ''; mouth[speaker] = /[\s.,!?]/.test(ch) ? 0 : flapT % 6 < 2 ? 0 : flapT % 6 < 4 ? 1 : 2; }
    for (const n of ['hero', 'boss', 'fallen']) { if (!keys[n] || !A[n]) continue; const c = A[n].querySelector('canvas'), g = c.getContext('2d'); g.clearRect(0, 0, c.width, c.height); g.drawImage(jawFrames(keys[n])[mouth[n]], 0, 0); }
    requestAnimationFrame(tick);
  };
  const blip = w => { if (!SFX.on || !SFX.ctx || SFX.ctx.state !== 'running' || !w) return; const f = w === 'boss' ? (bossId === 'colossus' ? 140 : /goose/.test(bossId) ? 520 : 170) : 380; SFX.tone(f * (0.9 + Math.random() * 0.25), 0.045, bossId === 'colossus' && w === 'boss' ? 'square' : 'triangle', 0.035); };
  // text types into the bubble (or the bottom bar for narration)
  const type = (text, w) => new Promise(res => {
    const out = w ? btxt : narr; typing = { text, n: 0, res, out }; out.textContent = ''; el.classList.add('typing');
    const step = () => { if (!typing || typing.text !== text) return; typing.n += 1; out.textContent = text.slice(0, typing.n); if (typing.n % 3 === 1 && /\w/.test(text[typing.n - 1])) blip(w);
      if (typing.n >= text.length) { finishType(); return; } const ch = text[typing.n - 1]; setTimeout(step, /[.!?]/.test(ch) ? 160 : /,/.test(ch) ? 80 : 22); };
    step();
  });
  const finishType = () => { if (!typing) return; const r = typing.res; typing.out.textContent = typing.text; typing = null; el.classList.remove('typing'); r(); };
  const wait = ms => new Promise(r => setTimeout(r, ms));
  // speech bubble beside the speaker's head, on the side facing the open field, tail pointing at the mouth
  const placeBubble = w => { const [x, y] = SPOT[w], half = 10 * TK_SCALE[w], top = (y - 20 * TK_SCALE[w] * 1.02) * k;
    bub.style.top = Math.max(8, top) + 'px';
    if (w === 'boss') { bub.style.left = ''; bub.style.right = (WW - x + half * 0.55) * k + 'px'; } else { bub.style.right = ''; bub.style.left = (x + half * 0.55) * k + 'px'; } };
  const say = async w => {
    speaker = w; for (const n in A) if (A[n]) A[n].classList.toggle('talking', n === w);
    bub.hidden = true; if (!w) return;
    const target = w === 'fallen' ? 'hero' : w; if (focusOn !== target) { pan(target); await wait(820); }
    bub.className = 'tk-bub ' + (w === 'boss' ? 'from-boss' : 'from-hero') + (w === 'boss' && bossId === 'colossus' ? ' robot' : '') + (w === 'fallen' ? ' ghostly' : '');
    placeBubble(w); bub.hidden = false; btxt.textContent = '';
    who.textContent = w === 'boss' ? E.name : w === 'fallen' ? sc.fallen.name : heroName(cur) + ' · ' + heroTag(cur); };
  const beats = sc.beats.slice();
  let busy = false;
  const next = async () => {
    if (ended || busy) return;
    if (typing) return finishType();
    if (opts.childElementCount) return;
    beatI++;
    const b = beats[beatI];
    if (!b) { if (sc.boss) return choose(); return end(); }
    busy = true; narr.textContent = '';
    try {
      if (b.who === 'narrate') { await say(null); if (b.swap) { pan('hero'); setHero(b.swap); A.hero.classList.add('enter'); SFX.play('draft'); } if (b.succession) { SFX.play('herodie'); }
        busy = false; await type(b.text, null); return; }
      if (b.who === 'mishap') { const m = sc.mishap; await say(null); if (focusOn !== 'hero') { pan('hero'); await wait(820); } A.hero.classList.add('mishap', m.kind); SFX.play(m.kind === 'pee' ? 'slurp' : m.kind === 'faint' ? 'thud' : 'whoosh');
        busy = false; await type(`${MISHAP_TAG[m.kind]}! ${b.text}`, null); return; }
      if (b.who === 'hero' && sc.fallen) { A.hero.classList.remove('waiting'); A.hero.classList.add('enter'); A.fallen.classList.add('gone'); }
      await say(b.who);
      if (b.who === 'boss' && beatI === sc.beats.findIndex(x => x.who === 'boss')) { SFX.play(sc.boss ? 'boss' : 'roar'); A.boss.classList.add('stomp'); }
      busy = false; await type(b.text, b.who);
    } finally { busy = false; }
  };
  const choose = async () => {
    const h = cur; await say(null); el.classList.add('choosing'); pan('hero'); narr.textContent = `What does ${heroName(h)} say?`;
    opts.innerHTML = TALK_CHOICES.map((c, i) => `<button class="tk-opt" data-c="${i}"><b>${esc(c.label)}</b><q>${esc(talkFill(voiceLine(h, c.k), run, h))}</q><span>${esc(c.sub)}</span></button>`).join('');
    opts.querySelectorAll('[data-c]').forEach(btn => btn.onclick = async e => {
      e.stopPropagation(); const c = TALK_CHOICES[+btn.dataset.c]; opts.innerHTML = ''; narr.textContent = ''; el.classList.remove('choosing'); pan('hero'); SFX.play('stamp');
      run.mods[c.mod] = true; TEL.event('bosstalk', { boss: bossId, pick: c.k, temper: heroTemper(h) }); save();
      busy = true; await say('hero'); busy = false; await type(talkFill(voiceLine(h, c.k), run, h), 'hero');
      await wait(500);
      busy = true; await say('boss'); busy = false; SFX.play('roar'); A.boss.classList.remove('stomp'); void A.boss.offsetWidth; A.boss.classList.add('stomp'); await type(sc.react[c.k], 'boss');
      await wait(450);
      await type(sc.close, 'boss');
      beatI = 1e9; el.classList.add('last');
    });
  };
  const end = () => {
    if (ended) return; ended = true; TALKUI.on = false; removeEventListener('resize', layout);
    // a voice who lost their nerve sits out the boss siege (see placedHeroes); everyone else lines up as before
    if (sc.mishap) { const m = sc.mishap.h; m.fledPlace = m.place; m.place = null; m.fled = true; changed(); }
    if (sc.boss && !Object.keys(run.mods).some(x => ['taunt', 'firm', 'rallycry'].includes(x))) run.mods.firm = true;
    el.classList.add('out'); setTimeout(() => { el.hidden = true; el.innerHTML = ''; done(); }, 260);
  };
  el.onclick = e => { if (e.target.closest('#tkSkip') || e.target.closest('.tk-opt')) return; if (beatI >= 1e9) return end(); next(); };
  // skip jumps a boss scene straight to the three replies (the pick matters); any other scene just closes
  el.querySelector('#tkSkip').onclick = e => { e.stopPropagation(); if (sc.boss && beatI < 1e9) { if (opts.childElementCount) return; typing = null; busy = false; el.classList.remove('typing');
    if (sc.fallen) { A.hero.classList.remove('waiting'); A.fallen.classList.add('gone'); } if (sc.mishap) A.hero.classList.add('mishap', sc.mishap.kind);
    beatI = beats.length; return choose(); } end(); };
  TALKUI.key = e => { if (!TALKUI.on) return; if (e.code === 'Space' || e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); if (beatI >= 1e9) return end(); next(); } else if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); el.querySelector('#tkSkip').click(); } };
  if (!TALKUI.bound) { TALKUI.bound = true; document.addEventListener('keydown', e => TALKUI.key && TALKUI.key(e), true); }
  addEventListener('resize', layout); layout();
  requestAnimationFrame(tick); setTimeout(next, 900);
}
