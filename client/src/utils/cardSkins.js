/**
 * cardSkins.js — Central card image mapping.
 *
 * Uses import.meta.glob (eager) so Vite can statically analyze and bundle
 * every asset at build time — avoids the dynamic new URL() limitation where
 * template-literal paths are not statically analyzable and cause random
 * failures, especially for long filenames or paths with special characters.
 *
 * To add a new skin pack:
 *   1. Drop images into  client/src/assets/cards/<PackName>/
 *   2. Add a new CARD_SKIN_MAP variant below and register in SKIN_PACKS.
 */

// ---------------------------------------------------------------------------
// Eagerly import every card image so Vite bundles + fingerprints them all.
// Keys are relative to THIS file (utils/), e.g.:
//   '../assets/cards/BoomKitten/Skip/Skip-Commandeer-a-Bunnyraptor.jpg'
// ---------------------------------------------------------------------------
const _modules = import.meta.glob(
  '../assets/cards/**/*.{jpg,jpeg,png,webp}',
  { eager: true }
);

// Build lookup cache: 'PackName/FolderName/filename.jpg' and relative keys
const _cache = {};
for (const [rawPath, mod] of Object.entries(_modules)) {
  const keyWithPack = rawPath.replace('../assets/cards/', '');
  _cache[keyWithPack] = mod.default;

  if (rawPath.startsWith('../assets/cards/BoomKitten/')) {
    const keyBoomKitten = rawPath.replace('../assets/cards/BoomKitten/', '');
    _cache[keyBoomKitten] = mod.default;
  }
}

// ---------------------------------------------------------------------------
// BoomKitten skin pack.
//
// IMPORTANT — Normal cat cards (cat_taco, cat_watermelon, …) each map to
// their OWN single image so the card name always matches the artwork.
// Previously all 6 cat types shared a common pool, which caused a cat_taco
// card to randomly show a feral-cat image while still reading "Mèo Taco".
// ---------------------------------------------------------------------------
const BOOM_KITTEN_SKINS = {
  defuse: [
    'Defuse/Defuse-Via-3AM-Flatulence.jpg',
    'Defuse/Defuse-Via-Belly-Rubs.jpg',
    'Defuse/Defuse-Via-Catnip-Sandwiches.jpg',
    'Defuse/Defuse-Via-Catnip-Sweater.jpg',
    'Defuse/Defuse-Via-Crate.jpg',
    'Defuse/Defuse-Via-Excessive-Ball-Cleaning.jpg',
    'Defuse/Defuse-Via-Flattering-LARP.jpg',
    'Defuse/Defuse-Via-Kitten-Therapy.jpg',
    'Defuse/Defuse-Via-Laser-Pointer.jpg',
    'Defuse/Defuse-Via-Laser-Tag.jpg',
    'Defuse/Defuse-Via-Mauling-a-Baby.jpg',
    'Defuse/Defuse-Via-Nature-Documentaries.jpg',
    'Defuse/Defuse-Via-Participation-in-Kitten-Yoga.jpg',
    'Defuse/Defuse-Via-Porkback-Riding-into-the-Sunset-Together.jpg',
    'Defuse/Defuse-Via-Scratching.jpg',
    'Defuse/Defuse-Via-Spay-Neuter.jpg',
    'Defuse/Defuse-Via-Tummy-Rubs.jpg',
    'Defuse/Defuse-Via-Turning-Into-Tuna.jpg',
  ],
  nope: [
    'Nope/Nope-A-Jackanope-Bounds-into-the-Room.jpg',
    'Nope/Nope-Awaken-the-Narnope.jpg',
    'Nope/Nope-Deliver-some-Nope-on-Your-Jump-Rope.jpg',
    'Nope/Nope-Feed-your-Apponent-Some-Cantanope.jpg',
    'Nope/Nope-Feed-your-Opponent-a-Nope-Sandwich.jpg',
    'Nope/Nope-Nopestradamus-Speaks-the-Truth.jpg',
    'Nope/Nope-Put-on-Your-Necktie-of-Nope.jpg',
    'Nope/Nope-The-Pope-of-Nope-has-Spoken.jpg',
    'Nope/Nope-Win-the-Nopebell-Peace-Prize.jpg',
    'Nope/Nope-a-Nope-Ninja.jpg',
  ],
  skip: [
    'Skip/Skip-Commandeer-a-Bunnyraptor.jpg',
    'Skip/Skip-Crab-Walk-with-Some-Crabs.jpg',
    'Skip/Skip-Don-a-Portable-Cheetah-Butt.jpg',
    'Skip/Skip-Engage-the-Hypergoat.jpg',
    'Skip/Skip-Evade-Dirty-Sasquatch-Underpants.jpg',
    'Skip/Skip-Go-Base-Jumping-Using-a-Pair-of-Old-Lady-Boobs.jpg',
    'Skip/Skip-Play-a-Game-of-Whale-Boner-Tetherball.jpg',
    'Skip/Skip-Sail-Away-on-Your-Penis-Balloon.jpg',
  ],
  super_skip: [
    'Super_Skip/Super-Skip.jpg',
    'Super_Skip/Super-Skip-Hitch-A-Ride-on-a-Corgihorse.jpg',
  ],
  see_the_future_1: [
    'See_the_future_3x/See-the-Future-Ask-the-All-Seeing-Goat-Wizard.jpg',
    'See_the_future_3x/See-the-Future-Attach-a-Butterfly-to-Your-Genitals.jpg',
    'See_the_future_3x/See-the-Future-Crawl-Inside-a-Goat-Butt.jpg',
    'See_the_future_3x/See-the-Future-Deploy-the-Special-Ops-Bunnies.jpg',
    'See_the_future_3x/See-the-Future-Discover-a-Boob-Wizard.jpg',
    'See_the_future_3x/See-the-Future-Drink-an-Entire-Bottle-of-Bald-Eagle-Tears.jpg',
    'See_the_future_3x/See-the-Future-Fear-Upon-a-Unicorn-Enchilada.jpg',
    'See_the_future_3x/See-the-Future-Rub-the-Belly-of-a-Pig-a-Corn.jpg',
    'See_the_future_3x/See-the-Future-Summon-the-Mantis-Shrimp.jpg',
    'See_the_future_3x/See-the-Future-Weave-an-Infinity-Boner.jpg',
  ],
  see_the_future_3: [
    'See_the_future_3x/See-the-Future-Ask-the-All-Seeing-Goat-Wizard.jpg',
    'See_the_future_3x/See-the-Future-Attach-a-Butterfly-to-Your-Genitals.jpg',
    'See_the_future_3x/See-the-Future-Crawl-Inside-a-Goat-Butt.jpg',
    'See_the_future_3x/See-the-Future-Deploy-the-Special-Ops-Bunnies.jpg',
    'See_the_future_3x/See-the-Future-Discover-a-Boob-Wizard.jpg',
    'See_the_future_3x/See-the-Future-Drink-an-Entire-Bottle-of-Bald-Eagle-Tears.jpg',
    'See_the_future_3x/See-the-Future-Fear-Upon-a-Unicorn-Enchilada.jpg',
    'See_the_future_3x/See-the-Future-Rub-the-Belly-of-a-Pig-a-Corn.jpg',
    'See_the_future_3x/See-the-Future-Summon-the-Mantis-Shrimp.jpg',
    'See_the_future_3x/See-the-Future-Weave-an-Infinity-Boner.jpg',
  ],
  see_the_future_5: [
    'See_the_future_5x/See-the-Future-5x.jpg',
  ],
  alter_the_future_3: [
    'Alter_the_future_3x/Alter-the-Future-Cat-Wizard.jpg',
    'Alter_the_future_3x/Alter-the-Future-Furmaid.jpg',
    'Alter_the_future_3x/Alter-the-Future-Golden-Haired-Manatee.jpg',
    'Alter_the_future_3x/Alter-the-Future-Time-Traveling-Crab.jpg',
  ],
  alter_the_future_3_now: [
    'Alter_the_future_3x_now/Alter-the-Future-3x-now.jpg',
  ],
  alter_the_future_5: [
    'Alter_the_future_5x/Alter-the-Future-5x.jpg',
  ],
  shuffle: [
    'Shuffle/Shuffle-A-Kraken-Emerges-and-Hes-Super-Upset.jpg',
    'Shuffle/Shuffle-A-Plague-of-Bat-Farts.jpg',
    'Shuffle/Shuffle-A-Transdimensional-Litter-Box-Materializes.jpg',
    'Shuffle/Shuffle-Abracrab-Lincoln.jpg',
    'Shuffle/Shuffle-An-Asparagus-Bun-Dragon-Appears.jpg',
    'Shuffle/Shuffle-An-Electromagnetic-Pomeranian-Storm.jpg',
    'Shuffle/Shuffle-Discover-You-Have-a-Toilet-Werewolf.jpg',
    'Shuffle/Shuffle-Smoke-Some-Crack-with-a-Baby-Owl.jpg',
  ],
  draw_from_bottom: [
    'Draw_Bottom/Draw-from-the-Bottom.jpg',
  ],
  favor: [
    'Favor/Favor-Fall-So-Deeply-in-Love.jpg',
    'Favor/Favor-Get-Enslaved-by-Party-Squirrels.jpg',
    'Favor/Favor-Rub-Peanut-Butter-on-Your-Belly-Button.jpg',
    'Favor/Favor-Take-Your-Friends-Beard-Sailing.jpg',
    'Favor/Favor-Teach-Someone-a-New-Palindrome.jpg',
    'Favor/Favour-Give-A-Horsey-Ride-To-A-Horse.jpg',
  ],
  // Each normal-cat type maps to its own single dedicated image.
  // This prevents the name/art mismatch (e.g. "Mèo Taco" showing a Feral-Cat).
  cat_taco:       ['NormalCat/Tacocat.jpg'],
  cat_watermelon: ['NormalCat/Cattermelon.jpg'],
  cat_beard:      ['NormalCat/Beard-Cat.jpg'],
  cat_rainbow:    ['NormalCat/Rainbow-Ralphing-Cat.jpg'],
  cat_potato:     ['NormalCat/Hairy-Potato-Cat.jpg'],
  feral_cat:      ['NormalCat/Feral-Cat.jpg'],
  reverse: [
    'Reverse/Reverse-Go-Back-In-Time-And-Steal-A-Pregnant-Dinosaur.jpg',
    'Reverse/Reverse-Receive-A-Hairy-Tummy-Massage.jpg',
    'Reverse/Reverse-Return-From-An-Unpleasant-Doctor-s-Visit.jpg',
    'Reverse/Reverse-Try-Something-New-Today.jpg',
  ],
  attack_2x: [
    'Attack_2x/Attack-Bear-o-Dactyl.jpg',
    'Attack_2x/Attack-Catterwocky.jpg',
    'Attack_2x/Attack-Crab-a-Pult.jpg',
    'Attack_2x/Attack-Grow-a-Magnifient-Squid-Arm-and-Start-Slapping-Fat-Babies.jpg',
    'Attack_2x/Attack-Penguin-Diarrhea.jpg',
    'Attack_2x/Attack-Rubber-Duck-Collection.jpg',
    'Attack_2x/Attack-Thousand-Year-Back-Hair.jpg',
    'Attack_2x/Attack-Torture-Bunnies.jpg',
  ],
  personal_attack: [
    'Personal_Attack/Personal-Attack-Finally-Throw-Up-All-the-Crayons-You-Ate-When-You-Were-A-Kid.jpg',
    'Personal_Attack/Personal-Attack-Get-Cursed-at-by-a-Heck-Beaver.jpg',
    'Personal_Attack/Personal-Attack-Give-Yourself-a-Fierce-Spankin.jpg',
    'Personal_Attack/Personal-Attack-Listen-to-the-Boastings-of-Some-Very-Accomplished-Trout.jpg',
  ],
  bury: [
    'Bury/Bury-Bury-Something-That-Probably-Shouldnt-be-Buried.jpg',
    'Bury/Bury-Clean-Up-While-Your-Cat-Watches.jpg',
  ],
  swap_top_and_bottom: ['Swap_Top_Bottom/Swap-Top-and-Bottom.jpg'],
  catomic_bomb:        ['Catomic_Bomb/Catomic-Bomb.jpg'],
  mark:                ['Mark/Mark.jpg'],
  ill_take_that: [
    "I'll_Take_That/Ill-Take-That-A-Hedgehog-Hogs-the-Blankets.jpg",
    "I'll_Take_That/Ill-Take-That-Send-in-a-Seagull-Who-Steals-Things.jpg",
    "I'll_Take_That/Ill-Take-That-Send-in-a-Vampug.jpg",
    "I'll_Take_That/Ill-Take-That-Send-the-Klepto-Cat.jpg",
  ],
  garbage_collection: ['Garbage_Collection/Garbage-Collection.jpg'],
  pot_luck: [
    'Potluck/Pot-Luck-Dog-Pile-Until-it-Reaches-the-Stars.jpg',
    'Potluck/Potluck-Share-with-the-Group-at-Catnip-Anonymous.jpg',
  ],
  streaking_kitten: ['Streaking_Kitten/Streaking-Kitten.jpg'],
  exploding_kitten: [
    'Boom/Exploding-Kitten-Alien.jpg',
    'Boom/Exploding-Kitten-C4.jpg',
    'Boom/Exploding-Kitten-Car-Off-Cliff.jpg',
    'Boom/Exploding-Kitten-House-Grenade.jpg',
    'Boom/Exploding-Kitten-Nuclear-Bombs.jpg',
    'Boom/Exploding-Kitten-Playground.jpg',
    'Boom/Exploding-Kitten-Science.jpg',
    'Boom/Exploding-Kitten-TNT-Ship.jpg',
    'Boom/Exploding-Kitten-Warp-Core.jpg',
    'Boom/Exploing-Kitten-Balloon-Bomb.jpg',
    'Boom/Exploing-Kitten-Divide-By-Zero.jpg',
    'Boom/Exploing-Kitten-Holy-Water-Balloons.jpg',
    'Boom/Exploing-Kitten-Pepper.jpg',
  ],
  imploding_kitten: ['Imploding_Kitten/Imploding-Kitten.jpg'],
  curse_of_the_cat_butt: [
    'Blind/1-Curse-of-the-Cat-Butt.jpg',
    'Blind/2-Blind-As-A-Bat.jpg',
  ],
  hidden: [
    'Blind/2-Blind-As-A-Bat.jpg',
  ],
  clairvoyance_now: [
    'Blind/1-Curse-of-the-Cat-Butt.jpg',
    'Blind/2-Blind-As-A-Bat.jpg',
  ],
  target_attack_2x: [
    'Target_Attack_2x/Targeted-Attack-2x-Deploy-The-Groin-Kicking-Panda-Bear.jpg',
    'Target_Attack_2x/Targeted-Attack-2x-Fire-The-Fat-Hamster-Crossbow.jpg',
    'Target_Attack_2x/Targeted-Attack-Unleash-a-Shark-Who-Hurts-with-Words-Instead-of-Teeth.jpg',
  ],
  share_the_future_3: [
    'Share_The_Future_3x/Share-the-Future-Listen-to-the-Words-of-an-Emo-Emu.jpg',
    'Share_The_Future_3x/Share-the-Future-Send-in-the-Recon-Sloth.jpg',
  ],
};

// ---------------------------------------------------------------------------
// Skin pack registry
// ---------------------------------------------------------------------------
const SKIN_PACKS = {
  BoomKitten: BOOM_KITTEN_SKINS,
};

const DEFAULT_PACK = 'BoomKitten';

const CARD_TYPE_ALIASES = {
  Skip: 'skip',
  Reverse: 'reverse',
  Attack: 'attack_2x',
  Favor: 'favor',
  superskip: 'super_skip',
  super_skip: 'super_skip',
  attack: 'attack_2x',
  see_the_future: 'see_the_future_3',
  draw_from_the_bottom: 'draw_from_bottom',
  shuffle_now: 'shuffle',
};

function normalizeCardType(cardType) {
  if (!cardType) return cardType;
  const directAlias = CARD_TYPE_ALIASES[cardType];
  if (directAlias) return directAlias;
  const normalized = String(cardType).trim().toLowerCase().replace(/[\s-]+/g, '_');
  return CARD_TYPE_ALIASES[normalized] || normalized;
}

const FALLBACK_SKINS = {
  attack_of_the_dead: [
    'Zombie_Kittens/Attack-Of-The-Dead-Burn-Some-Bread-To-Summon-A-Toast-Ghost.jpg',
    'Zombie_Kittens/Attack-Of-The-Dead-Gift-Tickets-To-Some-Terrible-Zombie-Stand-Up.jpg',
    'Zombie_Kittens/Attack-Of-The-Dead-Release-A-Swam-Of-Zom-Bees.jpg',
  ],
  feed_the_dead: [
    'Zombie_Kittens/Feed-The-Dead-Give-Your-Friend-A-Hand.jpg',
    'Zombie_Kittens/Feed-The-Dead-Take-Special-Care-Of-A-Picky-Zombie.jpg',
  ],
  grave_robber: [
    'Zombie_Kittens/Grave-Robber-Return-The-Terrible-Tie-You-Were-Buried-With.jpg',
  ],
  clairvoyance: [
    'Zombie_Kittens/clairvoyance.png',
  ],
  clairvoyance_now: [
    'Zombie_Kittens/clairvoyance.png',
  ],
  dig_deeper: [
    'Zombie_Kittens/Dig-Deeper-Get-More-Than-You-Bargained-For.jpg',
    'Zombie_Kittens/Dig-Deeper-Make-A-Deal-With-A-Devil-In-A-Bad-Disguise.jpg',
    'Zombie_Kittens/Dig-Deeper-Pity-The-Zombie-With-Zero-Upper-Body-Strength.jpg',
    'Zombie_Kittens/Dig-Deeper-Tend-To-Your-Dying-Garden.jpg',
  ],
  zombie_kitten: [
    'Zombie_Kittens/Zombie-Kitten-Always-Land-On-Your-Feet.jpg',
    'Zombie_Kittens/Zombie-Kitten-Become-An-Alien-Incubator.jpg',
    'Zombie_Kittens/Zombie-Kitten-Cough-Up-A-Hairball-With-A-Hairdo.jpg',
    'Zombie_Kittens/Zombie-Kitten-Friendship-Lasts-All-Weekend.jpg',
    'Zombie_Kittens/Zombie-Kitten-Learn-To-Entertain-Yourself.jpg',
  ],
  godcat: [
    'Good_vs_Evil/Godcat-The-Best-Of-The-Blessed.jpg',
  ],
  devilcat: [
    'Good_vs_Evil/Devilcat-The-Worst-Of-The-Cursed.jpg',
  ],
  armageddon: [
    'Good_vs_Evil/Armageddon-Anything-Can-Become-Armor.jpg',
    'Good_vs_Evil/Armageddon-Fight-Outside.jpg',
    'Good_vs_Evil/Armageddon-Showdown.jpg',
  ],
  reveal_the_future_3x: [
    'Good_vs_Evil/Reveal-The-Future-Extra-Pair-of-Eyes.jpg',
    'Good_vs_Evil/Reveal-The-Future-Go-Back-In-Time.jpg',
    'Good_vs_Evil/Reveal-The-Future-Particle-Accelerator.jpg',
  ],
  barking_kitten: [
    'Barking_Kittens/Barking-Kitten-Dog-House.jpg',
    'Barking_Kittens/Barking-Kitten-Fence.jpg',
  ],
};

/**
 * Number of skin variants for a card type.
 * Used by the server (deck.js SKIN_COUNTS) to set the random range.
 */
export function getSkinCount(cardType, pack = DEFAULT_PACK) {
  const resolvedType = normalizeCardType(cardType);
  const skins = SKIN_PACKS[pack]?.[resolvedType] || FALLBACK_SKINS[resolvedType];
  return skins ? skins.length : 1;
}

/**
 * Resolves the image URL for a card.
 * Uses the pre-built _cache from import.meta.glob so every path is
 * statically known to Vite and correctly bundled/fingerprinted.
 *
 * @param {string} cardType  - e.g. 'defuse', 'cat_taco'
 * @param {number} skinIndex - 0-based index (assigned by server)
 * @param {string} pack      - skin pack name (default: 'BoomKitten')
 * @returns {string|null}
 */
export function getCardImageUrl(cardType, skinIndex = 0, pack = DEFAULT_PACK) {
  const resolvedType = normalizeCardType(cardType);
  const skins = SKIN_PACKS[pack]?.[resolvedType] || FALLBACK_SKINS[resolvedType];
  if (!skins || skins.length === 0) return null;
  const idx = Math.abs(Math.floor(skinIndex)) % skins.length;
  return _cache[skins[idx]] ?? null;
}

/**
 * Full skins array for a card type (useful for preloading).
 */
export function getCardSkins(cardType, pack = DEFAULT_PACK) {
  const resolvedType = normalizeCardType(cardType);
  return SKIN_PACKS[pack]?.[resolvedType] ?? FALLBACK_SKINS[resolvedType] ?? [];
}
