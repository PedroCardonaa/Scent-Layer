import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Editorial descriptions stay in sync with client/src/lib/fallback-catalog.js.
// Brand voice: short, verb-first when possible, notes named directly,
// no reviewer clichés ("settles into", "lingers on").
const FRAGRANCES = [
  { id: 1,  name: "Aventus",              brand: "Creed",              type: "niche",    family: "Fresh",    top: "Pineapple, Bergamot, Apple",   heart: "Birch, Patchouli, Rose",   base: "Musk, Oak Moss, Ambergris",   season: ["Spring","Summer"],                 time: ["Daytime","Evening"],                       mood: ["Confident","Bold"],     bg: "p-bg-1",  badge: "Iconic",
    description: "Pineapple cuts the opening with juice and acid. Birch smoke arrives ten minutes in and stays. The most-copied fragrance of the last decade — for good reason. Wears like a thesis statement." },
  { id: 2,  name: "Baccarat Rouge 540",   brand: "MFK",                type: "niche",    family: "Oriental", top: "Jasmine, Saffron",             heart: "Amberwood, Ambergris",     base: "Fir Resin, Cedar",            season: ["Fall","Winter"],                   time: ["Evening","Night"],                          mood: ["Romantic","Confident"], bg: "p-bg-4",  badge: "SOTW",
    description: "Saffron and jasmine signal something is about to happen. Ambroxan delivers — it glows on skin like firelight, hours past the spray. Polarizing. Never forgettable." },
  { id: 3,  name: "Blanche",              brand: "Byredo",             type: "niche",    family: "Floral",   top: "Aldehydes, Pink Pepper",       heart: "Peony, Rose",              base: "Sandalwood, Musk",            season: ["Spring","Summer"],                 time: ["Morning","Daytime"],                        mood: ["Minimal","Relaxed"],    bg: "p-bg-2",  badge: null,
    description: "Aldehydic cleanness — soap, white florals, ironed linen. Almost minimalist in execution. Reads as someone who has their life together." },
  { id: 4,  name: "Santal 33",            brand: "Le Labo",            type: "niche",    family: "Woody",    top: "Cardamom, Iris",               heart: "Violet, Ambrette Seeds",   base: "Sandalwood, Cedar, Leather",  season: ["Fall","Winter"],                   time: ["Daytime","Evening"],                        mood: ["Confident","Relaxed"],  bg: "p-bg-6",  badge: "Bestseller",
    description: "Creamy sandalwood with iris, cardamom, a hint of leather. Sits so close to skin that strangers lean in to figure out what they're smelling. The defining unisex of the last decade." },
  { id: 5,  name: "Replica — Jazz Club",  brand: "Maison Margiela",    type: "designer", family: "Oriental", top: "Rum, Bergamot",                heart: "Tobacco, Clary Sage",      base: "Vanilla, Musk",               season: ["Fall","Winter"],                   time: ["Evening","Night"],                          mood: ["Bold","Romantic"],      bg: "p-bg-8",  badge: null,
    description: "Rum, tobacco, vanilla. The smell of a hotel bar in November — leather banquettes, low light, somebody playing piano. Pure scene-setting." },
  { id: 6,  name: "Sauvage EDP",          brand: "Dior",               type: "designer", family: "Fresh",    top: "Bergamot, Pepper",             heart: "Lavender, Vetiver",        base: "Ambroxan, Cedar",             season: ["Spring","Summer","Fall"],          time: ["Daytime","Evening"],                        mood: ["Confident","Bold"],     bg: "p-bg-5",  badge: "Top Pick",
    description: "Bergamot bright on top; lavender and vetiver underneath; ambroxan everywhere. Built to project without thinking about it. Why every other person on a Friday night smells like this." },
  { id: 7,  name: "Black Opium",          brand: "YSL",                type: "designer", family: "Gourmand", top: "Pink Pepper, Orange Blossom",  heart: "Coffee, Jasmine",          base: "Vanilla, Patchouli",          season: ["Fall","Winter"],                   time: ["Evening","Night"],                          mood: ["Bold","Romantic"],      bg: "p-bg-7",  badge: null,
    description: "Coffee and vanilla bound together by jasmine. Sweet in a way that reads as confidence, not sugar. A long-term commitment — projects for hours." },
  { id: 8,  name: "Tobacco Vanille",      brand: "Tom Ford",           type: "designer", family: "Oriental", top: "Tobacco Leaf, Spice",          heart: "Vanilla, Cacao",           base: "Tonka Bean, Sandalwood",      season: ["Fall","Winter"],                   time: ["Evening","Night"],                          mood: ["Bold","Confident"],     bg: "p-bg-3",  badge: "Luxury",
    description: "Pipe tobacco — sweet, dried, slightly nutty — wrapped in vanilla and tonka. Reads as winter weight, expensive cigars, a fire that didn't need to be lit. Heavy, intentionally." },
  { id: 9,  name: "Silver Mountain Water",brand: "Creed",              type: "niche",    family: "Fresh",    top: "Bergamot, Mandarin",           heart: "Green Tea, Blackcurrant",  base: "Musk, Sandalwood",            season: ["Spring","Summer"],                 time: ["Morning","Daytime"],                        mood: ["Relaxed","Minimal"],    bg: "p-bg-10", badge: null,
    description: "Green tea, bergamot, blackcurrant. Cold and clean — the air just after rain on a mountain. Pairs with linen and brunch and absolutely nothing else." },
  { id: 10, name: "Ombre Leather",        brand: "Tom Ford",           type: "designer", family: "Woody",    top: "Cardamom, Floral Accord",      heart: "Leather, Jasmine",         base: "Amber, Oakmoss, Vetiver",     season: ["Fall","Winter"],                   time: ["Evening","Night"],                          mood: ["Confident","Bold"],     bg: "p-bg-9",  badge: null,
    description: "Leather sharpened with cardamom, kept warm by amber. Reads as someone in an unbuttoned blazer. Structured but never stiff." },
  { id: 11, name: "Flowerbomb",           brand: "Viktor & Rolf",      type: "designer", family: "Floral",   top: "Tea, Bergamot",                heart: "Jasmine, Rose, Orchid",    base: "Patchouli, Musk",             season: ["Spring","Fall"],                   time: ["Daytime","Evening"],                        mood: ["Romantic","Relaxed"],   bg: "p-bg-11", badge: null,
    description: "Jasmine, rose, and orchid stacked tall. The name is a literal description — a wall of florals with patchouli underneath. Worn for an effect, not a vibe." },
  { id: 12, name: "Neroli Portofino",     brand: "Tom Ford",           type: "designer", family: "Fresh",    top: "Neroli, Bergamot",             heart: "Lavender, Myrtle",         base: "Amber, Oakmoss, Angelica",    season: ["Spring","Summer"],                 time: ["Morning","Daytime"],                        mood: ["Relaxed","Confident"],  bg: "p-bg-12", badge: null,
    description: "Neroli with bergamot and lavender — citrus pulled toward Mediterranean rock and salt. Smells like the second day of a vacation that's going well." },
  { id: 13, name: "Rose 31",              brand: "Le Labo",            type: "niche",    family: "Floral",   top: "Cumin, Bergamot",              heart: "Rose, Geranium",           base: "Cedar, Amber, Musk",          season: ["Spring","Summer"],                 time: ["Daytime","Evening"],                        mood: ["Romantic","Confident"], bg: "p-bg-2",  badge: null,
    description: "Rose, but dry — cumin and cedar pull it away from anything floral or sentimental. Works on anyone, intentionally. A rose for people who don't wear roses." },
  { id: 14, name: "Molecule 01",          brand: "Escentric Molecules",type: "niche",    family: "Woody",    top: "Iso E Super",                  heart: "Iso E Super",              base: "Iso E Super",                 season: ["Spring","Summer","Fall","Winter"],time: ["Morning","Daytime","Evening","Night"],     mood: ["Minimal","Confident"],  bg: "p-bg-5",  badge: "Cult",
    description: "One ingredient: Iso E Super. Smells barely there to the wearer but unforgettable to the person you're standing next to. Reacts uniquely to every skin. Worn by people who don't want to advertise." },
  { id: 15, name: "Acqua di Giò Profumo", brand: "Armani",             type: "designer", family: "Fresh",    top: "Marine Note, Bergamot",        heart: "Sage, Geranium",           base: "Incense, Patchouli",          season: ["Spring","Summer"],                 time: ["Daytime","Evening"],                        mood: ["Confident","Relaxed"],  bg: "p-bg-10", badge: null,
    description: "Marine notes meet incense. Cleaner than the original Acqua di Giò, darker than its successors. The 'Profumo' version specifically — accept no substitutes." },
  { id: 16, name: "Good Girl",            brand: "Carolina Herrera",   type: "designer", family: "Gourmand", top: "Almond, Coffee",               heart: "Tuberose, Jasmine",        base: "Cocoa, Sandalwood, Tonka",    season: ["Fall","Winter"],                   time: ["Evening","Night"],                          mood: ["Bold","Romantic"],      bg: "p-bg-7",  badge: null,
    description: "Almond, coffee, cocoa, tuberose. Sweet but with teeth — the gourmand element pulled toward something darker than dessert. Statement scent, statement bottle." },
];

async function main() {
  console.log(`Seeding ${FRAGRANCES.length} fragrances…`);
  for (const f of FRAGRANCES) {
    await prisma.fragrance.upsert({
      where: { id: f.id },
      update: f,
      create: f,
    });
  }
  console.log('Done.');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
