// ===== Talk dialogue (Cam 2026-10-23) =====
// Cam: "the hero just says verbatim what you select". The reply cards say WHAT the hero does; this file decides HOW they
// say it. Every line is picked by the voice's temper, the boss, and how the run is going (a champion lost last siege,
// cracked walls, an empty purse, the boss's mood after the story choices). Bosses answer the tone of the reply, and
// react to the story choices made in front of them. Nothing here changes a gameplay effect.

// what each boss's scenes are about, so a reply can throw it back at them. gripe / offer / threat: noun phrases for the
// scene of that kind, jab: the thing to mock in a taunt.
const TALK_TOPIC = {
  grubnose: { gripe: 'a bucket with a hole in it', offer: 'rocks for a rafter', threat: 'every cousin, even Steve', jab: 'bucket' },
  gloop: { gripe: 'a few popped slimelets', offer: 'your jar deal', threat: 'the whole bog', jab: 'wobble' },
  wyrm: { gripe: 'a zombie book review', offer: 'the villain part in your book', threat: 'your final chapter', jab: 'novel' },
  ringmaster: { gripe: 'imps who want weekends', offer: 'five stars for a burning balloon', threat: 'your grand finale', jab: 'top hat' },
  sporebaron: { gripe: 'one scrubbed-off cousin', offer: 'forty-one pinecones for the keep', threat: 'spore season', jab: 'cap' },
  matriarch: { gripe: 'our pink banners', offer: 'a form in Yeti, in triplicate', threat: 'your inspection', jab: 'clipboard' },
  trashpaw: { gripe: 'a locked bin lid', offer: 'the lasagne deal', threat: 'the family reunion', jab: 'bin' },
  colossus: { gripe: 'a little squeaking', offer: 'oil for zero destruction', threat: 'your firmware update', jab: 'warranty' },
  pinchbeard: { gripe: 'a few late-night shanties', offer: 'the keep for a bucket of sand', threat: 'your boarding party', jab: 'beard' },
  goosegod: { gripe: 'a chicken union', offer: 'a manifesto that only says honk', threat: 'your bread heist', jab: 'beak' },
};
TALK_TOPIC.shardgoose = Object.assign({}, TALK_TOPIC.goosegod, { threat: 'all twelve shards' });

// per temper: style = how they talk (the personality card), more = extra takes merged into VOICE (talk.js), tail = a
// line added when the run calls for it, enc = how they answer a choice card, by its stance (encStance). In enc lines
// {g} is what the player picked, in the hero's own words (TALK_GIST). Caps keys ({BOSS}, {TOPIC}) are shouted.
const TEMPER_TALK = {
  heroic: { style: 'Brave and earnest. Always first through the gate.',
    more: { gripe: 'All this over {q}? Then let us settle it on the field, {boss}.', offer: '{Q}? A hero\'s answer is no.', threat: 'Bring {q}. I will be waiting at the gate.',
      taunt: 'Your {jab} will make a fine trophy for the great hall, {boss}!', firm: 'Plant your feet, everyone. Today the walls lean on us.', rally: 'Look at me! If I can stand here, so can you! FORWARD!' },
    tail: { loss: '{lost} fell last siege. I fight for them now too.', hurt: 'The walls are cracked. The people behind them are not.', broke: 'Our purse is empty. Our courage is not.',
      kind: 'We treated you fairly. Remember that when you lose.', grudge: 'I admit we were not kind to you. That does not open the gate.' },
    enc: { kind: 'It\'s the right thing to do. We {g}.', rude: 'Not my finest hour. But we {g}.', loot: 'The keep needs the coin. We {g}, and we spend it well.', spend: 'Worth every coin. We {g}.',
      risky: 'Fortune favours the brave. We {g}!', mend: 'Strong walls save lives. We {g}.', train: 'Every lesson now is a life saved later. We {g}.', fight: 'A challenge? I accept. We {g}!',
      truce: 'Even a foe deserves a way out. We {g}.', go: 'Decided. We {g}.' } },
  cheerful: { style: 'Sunny about everything, even sieges.',
    more: { gripe: 'Aww, {q}? That\'s so small! You\'ll feel better after we beat you!', offer: '{Q}? Ha! Cute! No!', threat: 'Ooh, {q}! I\'ll make a banner! It\'ll say WELCOME! Then GO HOME!',
      taunt: 'Is that {jab} new, {boss}? It\'s ADORABLE. Like your chances!', firm: 'Big smiles, strong walls! Nobody\'s getting in, la la la!', rally: 'Everybody, on three! One, two... we\'re AMAZING!' },
    tail: { loss: 'I miss {lost} so much. They\'d want me smiling, so I\'m smiling. Mostly.', hurt: 'The walls look a bit crumbly! Crumbly is fine! Cookies are crumbly!',
      broke: 'We\'re broke! That\'s okay! The best things in life are free! Like winning!', kind: 'We\'ve been really nice to you! Can we be nice-ish today too?', grudge: 'Okay, we were a teeny bit mean. Sorry! Still beating you!' },
    enc: { kind: 'Ooh, let\'s {g}! It\'ll make their whole week!', rude: 'Hee, this is naughty. Let\'s {g}!', loot: 'Ooh, shiny! Let\'s {g}!', spend: 'Treat time! Let\'s {g}!',
      risky: 'What\'s the worst that could happen? Let\'s {g}!', mend: 'Fix-it day! Let\'s {g}!', train: 'Learning is FUN! Let\'s {g}!', fight: 'A fight? Fun! Let\'s {g}!',
      truce: 'Friends after the fight? Let\'s {g}!', go: 'Ooh, ooh! Let\'s {g}!' } },
  honorable: { style: 'Formal, fair and bound by their word.',
    more: { gripe: 'All this over {q}, {boss}? Bring it before a proper court, not my gate.', offer: '{Q}? I decline, with respect.', threat: 'Bring {q}. We shall answer with steel, and fairly.',
      taunt: 'Your {jab} is no banner, {boss}. Raise a true one and face me!', firm: 'Ranks closed. We hold here, by our word.', rally: 'Stand, all of you! A keep that holds together is never taken!' },
    tail: { loss: '{lost} fell with honour last siege. Their place in the line is mine to fill.', hurt: 'The walls are wounded. Our word is not.', broke: 'We are poor in gold, {boss}. Rich in oaths.',
      kind: 'We have dealt fairly with you. I ask the same in battle.', grudge: 'We wronged you, and I own it. The siege is still a siege.' },
    enc: { kind: 'It is only proper. We {g}.', rude: 'It is beneath us, but... very well. We {g}.', loot: 'A fair price, fairly taken. We {g}.', spend: 'A debt is a debt. We {g}.',
      risky: 'A gamble, but an honest one. We {g}.', mend: 'Duty first. We {g}.', train: 'Discipline wins sieges. We {g}.', fight: 'A challenge has been made. We {g}.',
      truce: 'Mercy is ours to offer. We {g}.', go: 'So decided. We {g}.' } },
  wholesome: { style: 'Kind to everyone, even the enemy.',
    more: { gripe: 'Oh no, {q}? That must be so hard. Want a hug? From a distance?', offer: '{Q}? That\'s sweet of you, but no thank you.', threat: 'Bring {q} if you must. I\'ll have tea ready for after.',
      taunt: 'Your {jab} is very nice, {boss}! Shame about everything else.', firm: 'Everyone stay cosy and safe inside, okay? I\'ll hold the door.', rally: 'I\'m so proud of every single one of you. Now let\'s go!' },
    tail: { loss: 'I knitted {lost} a scarf. I\'ll keep it warm for them.', hurt: 'The walls have boo-boos. We\'ll patch them after, with love.', broke: 'We don\'t have much gold, but we have each other!',
      kind: 'We\'ve been friends, sort of! Can we keep it friendly?', grudge: 'I\'m really sorry about before. I\'ll still have to stop you, though.' },
    enc: { kind: 'Aww, of course! Let\'s {g}.', rude: 'Oh dear. I\'ll feel bad about it, but let\'s {g}.', loot: 'It would help the keep... okay. Let\'s {g}.', spend: 'It\'s nice to give. Let\'s {g}.',
      risky: 'Ooh, nervous! Let\'s {g}, carefully.', mend: 'Everything deserves a little fixing. Let\'s {g}.', train: 'Growing together! Let\'s {g}.', fight: 'I\'ll be gentle! Let\'s {g}.',
      truce: 'Everyone deserves a second chance. Let\'s {g}.', go: 'Okay! Let\'s {g}.' } },
  zealous: { style: 'Fiery, loud, and very sure of the light.',
    more: { gripe: '{Q}?! The light does not weep for {q}!', offer: '{Q}? A deal with darkness? NEVER!', threat: 'Bring {q}! Every foe is fuel for the fire!',
      taunt: 'I will cleanse that {jab} with holy fire, {boss}!', firm: 'These walls are sacred! Let them break upon the stone!', rally: 'Feel the fire, all of you! TO GLORY!' },
    tail: { loss: '{lost} burns in the light now. I will burn here, for them!', hurt: 'The walls are scorched! So am I! We burn on!', broke: 'Gold is nothing! Faith fills the purse!',
      kind: 'We showed you mercy! Mercy has run out!', grudge: 'We struck you before, and we will strike you again!' },
    enc: { kind: 'Mercy is also a weapon! We {g}!', rude: 'The wicked get no comfort! We {g}!', loot: 'Gold for the cause! We {g}!', spend: 'A tithe for the light! We {g}!',
      risky: 'The light protects the bold! We {g}!', mend: 'Rebuild the temple! We {g}!', train: 'Train until the sword sings! We {g}!', fight: 'Trial by combat! We {g}!',
      truce: 'Let them kneel and be spared! We {g}!', go: 'It is decreed! We {g}!' } },
  wise: { style: 'Calm, dry, and three moves ahead.',
    more: { gripe: 'All this over {q}? I have read about sieges started for less. Not many.', offer: '{Q}. I did the sums, {boss}. They do not add up.', threat: 'Bring {q}. I have already planned for it. Twice.',
      taunt: 'That {jab} of yours tells me everything about you, {boss}. None of it good.', firm: 'Let them spend themselves on the stone. Walls are patient. So am I.', rally: 'Breathe. Aim. Now. Every one of you, exactly as we practised.' },
    tail: { loss: 'We lost {lost} last siege. I have learned from it. You will not like the lesson.', hurt: 'The walls are weak on the east side. I know. So we fight from the west.',
      broke: 'We are short of gold. Wisdom, fortunately, is free.', kind: 'We were kind to you, {boss}. Kindness is a long game.', grudge: 'We made an enemy of you. Enemies make mistakes. I am counting on it.' },
    enc: { kind: 'Kindness now saves blood later. We {g}.', rude: 'Unkind, but useful. We {g}.', loot: 'Gold is options. We {g}.', spend: 'A sound investment. We {g}.',
      risky: 'The odds are acceptable. We {g}.', mend: 'Walls before glory. We {g}.', train: 'Knowledge compounds. We {g}.', fight: 'Sometimes the quickest way is through. We {g}.',
      truce: 'An enemy who can surrender is half beaten. We {g}.', go: 'On reflection, we {g}.' } },
  loyal: { style: 'Team first, always.',
    more: { gripe: 'All this over {q}? You picked the wrong keep. My friends live here.', offer: '{Q}? I asked the team. The team says no.', threat: 'Bring {q}. You\'ll find all of us at the gate. Together.',
      taunt: 'Nobody follows you for that {jab}, {boss}. They follow you because they\'re scared.', firm: 'Shoulder to shoulder. If one stone shakes, we all lean on it.', rally: 'I\'ve got your back and you\'ve got mine. Let\'s GO, team!' },
    tail: { loss: '{lost} stood next to me every siege. That spot stays theirs. I\'ll fight for two.', hurt: 'The walls are hurting. So we stand in front of them.', broke: 'Who needs gold? I\'ve got friends.',
      kind: 'We treated you like one of the pack, {boss}. Shame you didn\'t stay.', grudge: 'We weren\'t nice to you. I\'d do it again for the team.' },
    enc: { kind: 'That\'s what friends do. We {g}.', rude: 'If it helps the team, we {g}.', loot: 'For the team purse! We {g}.', spend: 'Team treat. We {g}.',
      risky: 'If it goes wrong, we go wrong together. We {g}.', mend: 'The keep is home. We {g}.', train: 'Everybody gets better together. We {g}.', fight: 'Pick on one of us, pick on all of us. We {g}.',
      truce: 'Even the other side has a pack. We {g}.', go: 'Whatever\'s best for the team. We {g}.' } },
  optimistic: { style: 'Sure it will all work out.',
    more: { gripe: '{Q}? That\'s not a problem, {boss}, that\'s a chance to grow!', offer: '{Q}? I bet something even better comes along. Like you losing!', threat: 'Bring {q}! More foes, more chances to win!',
      taunt: 'Look on the bright side, {boss}! After today you won\'t need that {jab}!', firm: 'These walls have held every time so far. I like those odds!', rally: 'This is it, everyone! I have a GREAT feeling about this one!' },
    tail: { loss: '{lost} fell last siege. I like to think they\'re cheering us on.', hurt: 'The walls are a little cracked. More room for sunlight!', broke: 'We\'re out of gold. So it\'s all up from here!',
      kind: 'We\'ve been nice, you\'ve been nice-ish. Maybe this ends nice!', grudge: 'Things got bumpy between us. Bumps smooth out!' },
    enc: { kind: 'Good things come back around! We {g}!', rude: 'It\'ll probably work out fine! We {g}!', loot: 'Lucky us! We {g}!', spend: 'It\'ll pay off, I just know it! We {g}!',
      risky: 'I\'ve got a really good feeling. We {g}!', mend: 'Good as new soon! We {g}!', train: 'Better every day! We {g}!', fight: 'We\'ll totally win this! We {g}!',
      truce: 'Maybe they\'ll say yes! We {g}!', go: 'This\'ll be great! We {g}!' } },
  angry: { style: 'Everything comes out as a shout.',
    more: { gripe: '{TOPIC}?! THAT\'S what this is about?! I\'M the one who\'s upset!', offer: '{TOPIC}?! I\'M INSULTED! NO!', threat: 'BRING {TOPIC}! BRING IT ALL! I\'LL BE AT THE GATE, YELLING!',
      taunt: 'I\'M GOING TO FOLD THAT {JAB} IN HALF, {BOSS}!', firm: 'WE\'RE STAYING RIGHT HERE! BEHIND THE WALL! ANGRILY!', rally: 'THEY WANT OUR KEEP?! EVERYBODY SCREAM AT THEM WITH ME!' },
    tail: { loss: '{LOST} IS GONE AND IT\'S YOUR FAULT! I\'M SO ANGRY I CAN\'T SEE!', hurt: 'LOOK WHAT YOU DID TO MY WALLS! I JUST GOT ANGRIER!', broke: 'WE\'RE BROKE! YOU KNOW WHAT\'S FREE?! YELLING!',
      kind: 'WE WERE NICE TO YOU! AND THIS IS THE THANKS?!', grudge: 'YEAH, WE WERE MEAN! YOU DESERVED IT! STILL DO!' },
    enc: { kind: 'FINE! We {g}! But I\'m not happy about it!', rude: 'YES! We {g}! Serves them right!', loot: 'Gold?! GIVE! We {g}!', spend: 'UGH, money! Fine! We {g}!',
      risky: 'Whatever! We {g}! What\'s the worst that happens?!', mend: 'Fix the stupid walls! We {g}!', train: 'Training? I\'ll train ANGRY! We {g}!', fight: 'FINALLY! We {g}!',
      truce: 'A truce?! FINE! We {g}! Don\'t make me regret it!', go: 'FINE! We {g}!' } },
  deranged: { style: 'Nobody, including them, knows what comes next.',
    more: { gripe: '{Q}? I had {q} for breakfast once! Hee hee!', offer: '{Q}?! Yes! No! I\'ll trade you for a spoon!', threat: 'Bring {q}! I drew a picture of it! It\'s mostly teeth!',
      taunt: 'I talk to your {jab} at night, {boss}. It says you snore!', firm: 'Lock the doors! Lock the windows! Lock the moon!', rally: 'The voices are cheering! ALL of them! CHARGE!' },
    tail: { loss: '{lost} still talks to me. They say hi. They say BITE.', hurt: 'The walls have holes! Now the walls can breathe! Hee!', broke: 'No gold! I\'ll pay you in buttons. I have SO many buttons.',
      kind: 'We were nice to you! I wrote it on my arm! Look!', grudge: 'We were mean! I forget why! Isn\'t that funny?' },
    enc: { kind: 'The goat in my head says be nice! We {g}!', rude: 'Hee hee hee. We {g}.', loot: 'Shiny shiny shiny! We {g}!', spend: 'Money is just round paper! We {g}!',
      risky: 'YES! We {g}! I don\'t know what happens! Exciting!', mend: 'Walls are friends! We {g}!', train: 'Brain go big! We {g}!', fight: 'Ooh, a fight! We {g}! Bring a fork!',
      truce: 'Hug the enemy! Bite them a little! We {g}!', go: 'Eeny, meeny... we {g}!' } },
  greedy: { style: 'Asks what everything is worth.',
    more: { gripe: '{Q}? Sounds expensive. For you.', offer: '{Q}? I\'ve seen better deals in a goblin\'s pocket.', threat: 'Bring {q}. Bring it with full pockets. I\'ll empty them.',
      taunt: 'What\'s that {jab} worth, {boss}? Never mind. I\'ll find out when I sell it.', firm: 'Nobody touches the walls. The walls hold the vault.', rally: 'Bonus to whoever does the most damage! I\'m keeping score. I\'m winning.' },
    tail: { loss: '{lost} owed me nine gold. Now you owe me nine gold, {boss}. Plus interest.', hurt: 'Do you know what wall repairs cost? I do. I\'m billing you.',
      broke: 'We\'re broke, {boss}. Which makes you our next payday.', kind: 'We were nice to you for free. I don\'t do free. This is where I collect.', grudge: 'We fleeced you before. We\'ll fleece you again.' },
    enc: { kind: 'Nice is good for business. We {g}.', rude: 'Nice doesn\'t pay. We {g}.', loot: 'Now we\'re talking! We {g}!', spend: 'It hurts me to say it, but we {g}.',
      risky: 'High risk, high reward. We {g}.', mend: 'Cheaper than a new castle. We {g}.', train: 'Free lessons are the best lessons. We {g}.', fight: 'Losers pay. We {g}.',
      truce: 'A truce costs nothing. We {g}.', go: 'What\'s in it for me? ...Fine. We {g}.' } },
  cowardly: { style: 'Brave words, shaking knees.',
    more: { gripe: '{Q}? Th-that sounds awful. Please don\'t take it out on m-me.', offer: '{Q}? I... um... my friends say no. Sorry! Don\'t be mad!', threat: '{Q}?! Oh no. Oh no no. Can I be sick first?',
      taunt: 'Y-your {jab} is s-silly, {boss}! ...Did I say that out loud?', firm: 'Everyone stay behind the wall! Especially me!', rally: 'G-go! Be brave! I\'ll be brave right behind you! Way behind!' },
    tail: { loss: '{lost} was braver than me. They\'re gone and I\'m still here. I\'m so scared.', hurt: 'Th-the walls have holes. Holes let things IN.', broke: 'We have no gold. Please don\'t rob us. Oh, you\'re a siege. That\'s worse.',
      kind: 'We were n-nice to you! Please remember that! Please!', grudge: 'I-I didn\'t want to be mean! That was the others!' },
    enc: { kind: 'B-being nice is safe, right? We {g}.', rude: 'Um. Please don\'t be mad. We {g}.', loot: 'Is it safe? Okay. We {g}.', spend: 'If it keeps them away... we {g}.',
      risky: 'Oh no. Oh no no. ...Fine. We {g}.', mend: 'Thicker walls, please! We {g}!', train: 'Learning is safer than fighting. We {g}.', fight: 'Wh-why me? Okay. We {g}.',
      truce: 'Yes! Peace! Please! We {g}!', go: 'I-I guess we {g}?' } },
  vain: { style: 'Mostly worried about their hair.',
    more: { gripe: '{Q}? Darling, the real tragedy here is your outfit.', offer: '{Q}? Nothing in that deal matches my cape.', threat: 'Bring {q}. Give me ten minutes first. My hair.',
      taunt: 'That {jab} is SO last season, {boss}.', firm: 'Stay behind the walls, everyone. Bruises clash with everything.', rally: 'Look at me, darlings! Now fight like you want to be in my portrait!' },
    tail: { loss: '{lost} was the second most beautiful legend here. I\'ll shine for both of us.', hurt: 'The walls are a mess. Like your face, {boss}, but fixable.', broke: 'No gold? Then I\'ll just have to be priceless.',
      kind: 'We were gracious to you, {boss}. I was especially gracious. Everyone noticed.', grudge: 'We were rude to you. Well, you started it. With that outfit.' },
    enc: { kind: 'Generosity looks good on me. We {g}.', rude: 'They\'ll never forget it. Good. We {g}.', loot: 'Gold goes with everything. We {g}.', spend: 'Luxury is never a waste. We {g}.',
      risky: 'Danger is very flattering on me. We {g}.', mend: 'A beautiful castle for a beautiful me. We {g}.', train: 'I\'m already perfect, but fine. We {g}.', fight: 'Someone paint this. We {g}.',
      truce: 'Mercy makes a lovely portrait. We {g}.', go: 'Obviously, we {g}.' } },
  cruel: { style: 'Enjoys all of this a little too much.',
    more: { gripe: '{Q}? Delicious. Tell me how much it hurts.', offer: '{Q}? Charming. I\'ll take your offer, and then your teeth.', threat: 'Bring {q}. Come close, so I can hear you scream.',
      taunt: 'I\'ll keep that {jab}, {boss}. To remember today.', firm: 'Let them pile up at the walls. It makes them easier to count.', rally: 'Hunt them, everyone. Slowly. Make it last.' },
    tail: { loss: '{lost} fell last siege. Somebody out there did that. I\'m going to find them.', hurt: 'You cracked my walls. I\'ll crack something of yours.', broke: 'We\'re poor. Poor makes people mean. Lucky me, I started mean.',
      kind: 'Those kind deeds weren\'t for you, {boss}. They were to make this hurt more.', grudge: 'Oh, we were cruel to you. And we\'re just getting started.' },
    enc: { kind: 'Kindness. Ugh. It\'ll make the betrayal sweeter later. We {g}.', rude: 'Perfect. We {g}.', loot: 'Take it all. We {g}.', spend: 'Money buys pain too. We {g}.',
      risky: 'If it hurts someone, I\'m in. We {g}.', mend: 'Stronger walls, louder screams. We {g}.', train: 'Sharper blades. We {g}.', fight: 'Oh, finally. We {g}.',
      truce: 'Let them hope. Hope breaks so nicely. We {g}.', go: 'Mm. We {g}.' } },
  paranoid: { style: 'Sees a plot behind everything.',
    more: { gripe: '{Q}? That\'s exactly what someone with a SECRET would complain about.', offer: '{Q}? It\'s a trap. Everything\'s a trap.', threat: 'Bring {q}. I already knew. I\'ve known for weeks.',
      taunt: 'I know what\'s under that {jab}, {boss}. Soon EVERYONE will know.', firm: 'Lock every door! Then lock the locks!', rally: 'Trust nobody out there! Trust us! Mostly! GO!' },
    tail: { loss: '{lost} fell last siege. An accident? I don\'t think so.', hurt: 'The walls are cracked. From the INSIDE. Think about it.', broke: 'Our gold is gone. Who took it? WHO?!',
      kind: 'We were nice to you. You probably wrote it down. To use against us.', grudge: 'We were rude because you were plotting. Prove you weren\'t!' },
    enc: { kind: 'Being nice is good cover. We {g}.', rude: 'They were up to something. We {g}.', loot: 'Take it before someone else does. We {g}.', spend: 'Fine. But I want a receipt. We {g}.',
      risky: 'This could be a trap. It\'s always a trap. We {g} anyway.', mend: 'Thicker walls, fewer spies. We {g}.', train: 'Always be ready. We {g}.', fight: 'Strike before they strike us. We {g}.',
      truce: 'Keep your enemies closer. We {g}.', go: 'Don\'t tell anyone, but we {g}.' } },
  lazy: { style: 'Wants this over with so they can nap.',
    more: { gripe: '{Q}? Sounds tiring. Could you be upset more quietly?', offer: '{Q}? Too much reading. No.', threat: 'Bring {q}. Wake me when you get here.',
      taunt: 'I\'d mock that {jab} properly, {boss}, but it\'s a lot of effort.', firm: 'Just stand behind the wall. Standing is basically sitting.', rally: 'Everybody go fast so we can be done. I\'ll be... over here.' },
    tail: { loss: '{lost} used to wake me for sieges. Now nobody does. I\'m up anyway.', hurt: 'The walls are falling down. Me too, but on purpose.', broke: 'No gold. Fine. Less to carry.',
      kind: 'We were nice to you. That was a lot of effort. Don\'t waste it.', grudge: 'We were rude. It was easier than being nice.' },
    enc: { kind: 'Being nice is less paperwork. We {g}.', rude: 'Quickest option. We {g}.', loot: 'Gold just sits there. Like me. We {g}.', spend: 'Paying is faster than arguing. We {g}.',
      risky: 'Whatever\'s quickest. We {g}.', mend: 'Fix it now, less fixing later. We {g}.', train: 'Fine. Learning, sitting down. We {g}.', fight: 'Ugh. Quick fight. We {g}.',
      truce: 'Peace means naps. We {g}.', go: 'Mm. Yeah. We {g}.' } },
};
// the reply kinds get their extra takes; regular scenes ask for the boss's topic ({q}), so those only play when it is known
for (const t in TEMPER_TALK) { const V = VOICE[t]; if (!V) continue; for (const k in TEMPER_TALK[t].more) V[k] = [].concat(V[k], TEMPER_TALK[t].more[k]); }

// how a boss hears the tone of the reply: kind, fierce, sharp, odd or timid voices (talkGroup)
const TALK_GROUP = { heroic: 'kind', honorable: 'kind', wholesome: 'kind', cheerful: 'kind', optimistic: 'kind', loyal: 'kind', zealous: 'fierce', angry: 'fierce', cruel: 'fierce',
  wise: 'sharp', greedy: 'sharp', vain: 'sharp', deranged: 'odd', paranoid: 'odd', cowardly: 'timid', lazy: 'timid' };
function talkGroup(h) { return TALK_GROUP[heroTemper(h)] || 'kind'; }
// per boss: retort = the answer to the tone of the hero's reply, said before the closing line. pleased / peeved = what
// the boss calls out from the lair when the hero makes a story choice in front of them.
const BOSS_BACKTALK = {
  grubnose: { retort: { kind: 'Nice words! Goblins can\'t eat nice words. We tried.', fierce: 'Ooh, shouty! I like shouty. Shouty gets clubbed last.', sharp: 'Clever-clogs, eh? Clever doesn\'t keep you dry.',
    odd: '...What? Cousins, did that make sense to you? No? Good.', timid: 'HAH! Look at them shake! Even my bucket\'s braver!' },
    pleased: 'Hey! That was... nice. Nobody\'s nice to the bucket king. I\'m writing this on a leaf.', peeved: 'OI! I SAW THAT! That\'s going on the leaf! The insult leaf!' },
  gloop: { retort: { kind: 'Such manners, dear. Mother will drown you politely.', fierce: 'Temper, temper! Mother doesn\'t like shouting at the table.', sharp: 'Oh, a clever one. Clever ones taste of vinegar.',
    odd: 'Are you feeling alright, dear? You seem lumpier than usual.', timid: 'Aww, you\'re trembling. So am I! It\'s just how I\'m made, though.' },
    pleased: 'Mother saw that, dear. Mother wobbles with gratitude.', peeved: 'Mother saw that. Mother is now a very angry pudding.' },
  wyrm: { retort: { kind: 'Noble. Earnest. Dull. I\'ll have to punch up your dialogue.', fierce: 'Such fire! Amateur fire, but fire.', sharp: 'Witty. I\'m stealing that for chapter four.',
    odd: 'I can\'t use any of that. The readers would think I made it up.', timid: 'A trembling hero. A classic. Readers adore a coward\'s last stand.' },
    pleased: 'Oh, that\'s a lovely scene. You\'ve earned a kinder adjective.', peeved: 'Rude. You\'ve just been rewritten as the comic relief.' },
  ringmaster: { retort: { kind: 'Heartwarming! The audience is weeping into their popcorn. Which is on fire.', fierce: 'Rage! Wonderful! The crowd loves a firebrand!', sharp: 'A heckler with a vocabulary. How novel.',
    odd: '...Are you an act? You should be an act. You\'re hired. Also doomed.', timid: 'Stage fright! Don\'t worry, darling, the stage is about to be on fire anyway.' },
    pleased: 'A crowd-pleaser! The imps will talk about this for weeks.', peeved: 'BOOO! Malgoth boos YOU! How does it feel?' },
  sporebaron: { retort: { kind: 'How courteous. Courtesy composts beautifully.', fierce: 'So much heat. Mould adores a warm host.', sharp: 'A sharp tongue. A soft centre, I expect. There always is.',
    odd: 'You\'ve been eating the wrong mushrooms, haven\'t you? Not mine, I hope. Mine are expensive.', timid: 'Shaking already? Excellent. It spreads the spores.' },
    pleased: 'How very civil. I may let you keep a damp room.', peeved: 'Positively un-mouldy behaviour. It\'s going in the court records.' },
  matriarch: { retort: { kind: 'Polite. Noted. Politeness does not cancel fines.', fierce: 'Raised voices after curfew. That\'s a violation.', sharp: 'Clever answers are not on the form. Soon, neither are you.',
    odd: 'I have no form for whatever that was. I\'ll have to make one.', timid: 'Hiding behind the walls is not a permitted use of the walls.' },
    pleased: 'Acceptable. I\'ll remove one violation. One.', peeved: 'That is a violation. I\'m adding it to the list. The list is now two scrolls.' },
  trashpaw: { retort: { kind: 'Aw, sugar, you\'re sweet. Sweet stuff\'s the first thing my babies eat.', fierce: 'Ooh, feisty! Mama likes feisty. Keeps the kids sharp.', sharp: 'Smart mouth, sugar. Smart mouths still need feedin\'.',
    odd: 'Honey, you been eatin\' out of the wrong bins.', timid: 'Shh, shh, sugar. It\'s alright. It\'ll all be over real quick.' },
    pleased: 'Aw, sugar. Mama won\'t forget that.', peeved: 'Oh, it\'s like THAT, is it? Mama\'s takin\' notes.' },
  colossus: { retort: { kind: 'KINDNESS DETECTED. PROCESSING. PROCESSING. STILL DEMOLISHING.', fierce: 'VOLUME EXCEEDS SAFE LEVELS. MATCHING VOLUME.', sharp: 'SARCASM DETECTED. UPDATING DICTIONARY.',
    odd: 'INPUT NOT RECOGNISED. HAVE YOU TRIED TURNING YOURSELF OFF AND ON AGAIN.', timid: 'FEAR DETECTED. FEAR IS THE CORRECT RESPONSE.' },
    pleased: 'GRATITUDE.EXE IS RUNNING. THANK YOU.', peeved: 'RUDENESS LOGGED. FILED UNDER: GRUDGES.' },
  pinchbeard: { retort: { kind: 'Har, what a fine speech. I\'ll carve it on yer tombstone.', fierce: 'Fiery! Ye\'d make a grand pirate, if ye lived.', sharp: 'Clever words don\'t float, matey.',
    odd: 'Ye\'ve been at the rum. Or the rum\'s been at ye.', timid: 'Shiver me timbers! No, wait, that\'s you. Yer timbers. Shiverin\'.' },
    pleased: 'Har! Ye\'ve a sailor\'s heart! A small one, but a sailor\'s.', peeved: 'Ye scurvy brick-pile! I\'ll remember that at high tide!' },
  goosegod: { retort: { kind: 'Honk. (Translation: Sweet. Like bread. I will eat you like bread.)', fierce: 'HONK! (Translation: You do not out-shout a goose.)', sharp: 'Honk. (Translation: Very clever. The goose is cleverer.)',
    odd: '...Honk? (Translation: Even I do not understand you. Respect.)', timid: 'Honk honk. (Translation: Yes. Be afraid. That is correct.)' },
    pleased: 'honk. (Translation: Noted. Kindly.)', peeved: 'HONK. (Translation: Noted. Not kindly.)' },
};
BOSS_BACKTALK.shardgoose = BOSS_BACKTALK.goosegod;

// what the boss-siege reply cards promise, before the hero puts it in their own words
const TALK_INTENT = { taunt: 'Mock {boss} to their face.', firm: 'Dig in behind the walls.', rally: 'Fire up the champions.', goad: 'Wind the goose up on purpose.' };

// the choice cards in the hero's own words: base-form verb phrases that fit "We {g}." Labels missing here fall back to
// the label itself, lower-cased.
const TALK_GIST = {
  // story chapters (lore.js)
  'Send a polite reply': 'write him back, nicely', 'Use it as kindling': 'burn his letter to warm our hands', 'Send him a nicer bucket': 'buy him a shiny new bucket',
  'Return the bucket full of rocks': 'send his bucket back full of rocks', 'Fix the leak in his ditch': 'pay to fix his leaky ditch', 'Raise the rent': 'put his rent up',
  'Let him rent the moat': 'let him move into the moat', 'Evict him': 'kick him out of the moat',
  'Apologize to Mother Gloop': 'say sorry to Mother Gloop', 'Argue they split themselves': 'point out they split all on their own', 'Carry it back to the bog': 'carry the little one home',
  'Keep it as a pet': 'keep the slimelet as a pet', 'Pin it on the wall': 'pin the card up on the wall', 'Settle out of court': 'settle with the slimelet',
  'Give a gracious interview': 'give her a nice interview', 'Demand final edit': 'insist on approving her book', 'Join the book club': 'join the zombie book club',
  'Spoil the ending': 'spoil the book\'s ending', 'Sign autographs': 'sign autographs for the tourists', 'Write a rebuttal': 'write our side of the story',
  'Smuggle them snacks': 'sneak the imps some snacks', 'Buy front row seats': 'buy the best seats in the house', 'Five stars, wonderful show': 'give the show five stars',
  'Two stars, too many imps': 'give the show two stars', 'Hire them as stagehands': 'hire the imps as stagehands', 'Wave goodbye': 'wave them off',
  'Politely decline': 'say no, politely', 'Laugh at the pinecones': 'laugh at his pinecones', 'Give it a nice dark shelf': 'give the ambassador a nice dark shelf',
  'Scrub the pantry': 'scrub the pantry clean', 'Start a mushroom garden': 'let them grow in a garden', 'Sell them at market': 'sell the mushrooms at market',
  'Repaint the banners beige': 'paint our banners beige', 'Add MORE pink': 'paint the keep even pinker', 'Shovel it': 'shovel the path ourselves',
  'Build a snowman blocking it': 'build a snowman right on the path', 'Propose a hot tub': 'vote for a hot tub', 'Propose a refund': 'vote for a refund, with our cut',
  'Leave the lid open': 'leave the bin lid open for them', 'Buy a heavier lid': 'get a heavier lid', 'Bring a casserole': 'bring a casserole to the reunion',
  'Hose them down': 'turn the hose on them', 'Adopt the possum': 'adopt the little possum', 'Take the coin': 'take the possum\'s coin',
  'Lend it the oil': 'give the big fellow some oil', 'Sell it oil at a markup': 'sell it oil at triple the price', 'Say please back': 'say please right back',
  'Unplug the router': 'pull the plug on their update', 'Rebuild it as a statue': 'rebuild the Colossus as a statue', 'Sell the scrap': 'sell the brass for scrap',
  'Pay the toll': 'pay the pirate his toll', 'Issue him a ticket': 'write the pirate a parking ticket', 'Sing along': 'sing along with the shanties',
  'Throw a boot': 'throw a boot at the singers', 'Ask him to scout for you': 'ask the old pirate to keep watch for us', 'Take his treasure map': 'take the map off his hands',
  'Leave out bread': 'leave some bread out for the goose', 'Double the guard': 'put twice the guards on the walls', 'Offer them asylum': 'take the chickens in',
  'Stay out of bird politics': 'keep our beaks out of bird business', 'Read the whole thing': 'read every single honk', 'Use it as wallpaper': 'paper the walls with the manifesto',
  'Offer a truce after the siege': 'offer a truce, once the fighting\'s done', 'Tell them to come and take it': 'tell them to come and try',
  'Ask the smith to reforge': 'have the smith reforge something',
  // trade-off cards (data.js)
  'Offer dental': 'give the goblins dental', 'Break the strike': 'raid the union fund', 'Open the sack': 'open the clanking sack', 'Return to sender': 'throw the sack back over the wall',
  'Pay the rent': 'pay the goblins their rent', 'Refuse to pay': 'tear up the invoice', 'Let it flood': 'let the ditch flood the field', 'Patch it': 'patch up that ditch',
  'Charge pig rides': 'sell pig rides in the mud', 'Lay down planks': 'lay planks across the mud', 'Bring it soup': 'bring the poor dragon some soup', 'Sell tickets': 'sell tickets to the sneezing',
  'Switch it on': 'switch the windmill on', 'Sell it for parts': 'sell the windmill for parts', 'Buy the demo model': 'buy his fog machine', 'Find him and shoo him': 'find that salesman and shoo him off',
  'Let them dig': 'let everyone dig', 'Claim it first': 'stake the claim before they do', 'Build snow forts': 'build snow forts all over the field', 'Sell snowcones': 'sell snowcones by the bucket',
  'Attend and dance': 'go to the wedding and dance badly', 'Object to the marriage': 'stand up and object at the wedding', 'Tell her the truth': 'tell Granny the truth about her boy',
  'Lie and take the casserole': 'fib to Granny and keep her casserole', 'Invest 4 gold': 'put money into the rock business', 'Steal the idea': 'steal their business plan',
  'Free him': 'get the mime out of his box', 'Applaud': 'give the mime a standing ovation', 'Buy a round for the house': 'buy the whole tavern a drink', 'Start a bar fight': 'start a brawl',
  'Pay for the full reading': 'pay for her whole reading', 'Ask about the weather': 'ask her for a weather forecast instead', 'Befriend the goose': 'make friends with the goose',
  'Chase it out': 'chase that goose off the throne', 'Pay the "fine"': 'pay the accountant his "fine"', 'Commit light tax fraud': 'cook the books, just a little',
  'Roll him to the Armory': 'roll the wizard to the Armory', 'Roll him downhill': 'roll the wizard down the hill', 'Hire the consultant': 'hire the "consultant"', 'Pull off the coat': 'yank off that trench coat',
  'Catch it with engineering': 'catch that cheese with engineering', 'Eat it': 'eat the whole wheel', 'Hug it': 'give the mimic a big hug', 'Hug it, but nervously': 'hug the mimic, very carefully',
  'Accept the duel': 'square up to the chicken', 'Decline': 'turn the chicken down', 'Read the plans': 'read the horde\'s mail', 'Send party invitations': 'invite the whole horde to a party',
  'Add a mustache': 'paint a big mustache on the portrait', 'Sell the painting': 'sell the portrait', 'Keep it': 'keep the shard for ourselves', 'Send it on': 'send the crate on its way',
  'Give them a job': 'give the intern a job', 'Eat the walking dinner': 'eat dinner before it walks off', 'Build them a stage': 'build the bard a proper stage', 'Let them sing once': 'let the bard sing one song',
  'Read the scroll': 'read the pigeon\'s scroll', 'Feed the pigeons': 'share some bread with the pigeons', 'Build a hot tub': 'turn the spring into a hot tub', 'Pipe it onto the field': 'pipe the hot water onto the field',
  'Drink the screaming one': 'try the screaming potion', 'Drink the calm one': 'try the calm potion', 'Feed it to a hero': 'feed that mushroom to one of us', 'Feed it to the horde': 'slip that mushroom to the horde',
  'Buy the mystery box (4g)': 'buy the mystery box', 'Haggle aggressively': 'haggle the dragon down hard', 'Quick patch': 'let the masons patch us up', 'Proper job (5g)': 'pay for the proper job',
  // boon cards
  'Take the gold': 'take the purse', 'Train every hero': 'take the lessons, all of us', 'Reforge an item': 'have something reforged',
};
// choices whose fx would read the wrong way
const TALK_STANCE = { 'Tell her the truth': 'kind', 'Bring it soup': 'kind', 'Free him': 'kind', 'Feed the pigeons': 'kind', 'Adopt the possum': 'kind', 'Befriend the goose': 'kind',
  'Give them a job': 'kind', 'Let him rent the moat': 'kind', 'Start a bar fight': 'fight', 'Chase it out': 'fight', 'Break the strike': 'rude', 'Lie and take the casserole': 'rude',
  'Commit light tax fraud': 'rude', 'Steal the idea': 'rude', 'Refuse to pay': 'rude', 'Evict him': 'rude', 'Decline': 'go', 'Wave goodbye': 'go', 'Reforge an item': 'go', 'Ask the smith to reforge': 'go' };
// what kind of choice a card option is, read from its effects
function encStance(o) {
  if (TALK_STANCE[o.label]) return TALK_STANCE[o.label];
  const fx = o.fx;
  if (/bossdeal/.test(fx)) return 'truce';
  if (/bossmad|duel/.test(fx)) return 'fight';
  if (/mood:1/.test(fx)) return 'kind';
  if (/mood:-1/.test(fx)) return 'rude';
  if (/gamble|haggle|secret|item:|comp:|mod:giant|mod:tiny|mustache/.test(fx)) return 'risky';
  if (/gold:\d/.test(fx) && !/xp|heal/.test(fx)) return 'loot';
  if (/heal|maxhp/.test(fx)) return 'mend';
  if (/xp/.test(fx)) return 'train';
  if (/pay:|gold:-/.test(fx)) return 'spend';
  return 'go';
}
function encGist(o) { return TALK_GIST[o.label] || o.label.charAt(0).toLowerCase() + o.label.slice(1); }

// how the run is going, for the voice to bring up: a champion who fell in the last siege, cracked walls, an empty purse,
// and the boss's mood after this horde's story choices
function talkSituation(run, h) {
  const s = {}, last = run.siege - 1;
  const lost = (run.stats && run.stats.fallen || []).filter(f => f.s === last && (!run.voice || f.id !== run.voice.id) && f.id !== h.id).pop();
  if (lost && HERO_BY_ID[lost.id]) s.loss = talkVoiceFirst(HERO_BY_ID[lost.id].name);
  if (run.castle && run.castle.max && run.castle.hp / run.castle.max < 0.4) s.hurt = true;
  if (run.gold < 3) s.broke = true;
  if ((run.mood || 0) >= 1) s.kind = true; else if ((run.mood || 0) <= -1) s.grudge = true;
  return s;
}
// the extra line a voice adds when the run calls for it, from the situations allowed here (first that applies wins).
// sc.tailed: one aside per scene, so the voice doesn't bring the same thing up twice.
function talkTail(sc, run, h, kinds) {
  if (sc.tailed) return '';
  const s = sc.sit || (sc.sit = talkSituation(run, h)), T = TEMPER_TALK[heroTemper(h)] || TEMPER_TALK.heroic;
  for (const k of kinds) if (s[k] && T.tail[k]) { sc.tailed = true; return ' ' + talkFill(T.tail[k], run, h, { lost: s.loss }); }
  return '';
}
// the hero's line for a picked choice card
function encSay(run, h, o) {
  const T = TEMPER_TALK[heroTemper(h)] || TEMPER_TALK.heroic, st = encStance(o);
  return talkFill(T.enc[st] || T.enc.go, run, h, { g: encGist(o) });
}
// what the boss calls out from the lair when a story choice is about them; null when it isn't
function encBossAside(sc, enc, o) {
  if (!enc.story || enc.f !== sc.f || sc.finale) return null;
  const st = encStance(o), B = BOSS_BACKTALK[sc.bossId]; if (!B) return null;
  return st === 'kind' || st === 'truce' ? B.pleased : st === 'rude' || st === 'fight' ? B.peeved : null;
}
// what the boss says back to the tone of the hero's reply
function bossRetort(sc, h) { const B = BOSS_BACKTALK[sc.bossId]; return B ? B.retort[talkGroup(h)] : ''; }
