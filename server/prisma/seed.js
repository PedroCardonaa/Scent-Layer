import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const FRAGRANCES = [
  { id: 1,  name: "Aventus",              brand: "Creed",              type: "niche",    family: "Fresh",    top: "Pineapple, Bergamot, Apple",   heart: "Birch, Patchouli, Rose",   base: "Musk, Oak Moss, Ambergris",   season: ["Spring","Summer"],                  time: ["Daytime","Evening"],                       mood: ["Confident","Bold"],     bg: "p-bg-1",  badge: "Iconic"      },
  { id: 2,  name: "Baccarat Rouge 540",   brand: "MFK",                type: "niche",    family: "Oriental", top: "Jasmine, Saffron",             heart: "Amberwood, Ambergris",     base: "Fir Resin, Cedar",            season: ["Fall","Winter"],                    time: ["Evening","Night"],                          mood: ["Romantic","Confident"], bg: "p-bg-4",  badge: "SOTW"        },
  { id: 3,  name: "Blanche",              brand: "Byredo",             type: "niche",    family: "Floral",   top: "Aldehydes, Pink Pepper",       heart: "Peony, Rose",              base: "Sandalwood, Musk",            season: ["Spring","Summer"],                  time: ["Morning","Daytime"],                        mood: ["Minimal","Relaxed"],    bg: "p-bg-2",  badge: null          },
  { id: 4,  name: "Santal 33",            brand: "Le Labo",            type: "niche",    family: "Woody",    top: "Cardamom, Iris",               heart: "Violet, Ambrette Seeds",   base: "Sandalwood, Cedar, Leather",  season: ["Fall","Winter"],                    time: ["Daytime","Evening"],                        mood: ["Confident","Relaxed"],  bg: "p-bg-6",  badge: "Bestseller"  },
  { id: 5,  name: "Replica — Jazz Club",  brand: "Maison Margiela",    type: "designer", family: "Oriental", top: "Rum, Bergamot",                heart: "Tobacco, Clary Sage",      base: "Vanilla, Musk",               season: ["Fall","Winter"],                    time: ["Evening","Night"],                          mood: ["Bold","Romantic"],      bg: "p-bg-8",  badge: null          },
  { id: 6,  name: "Sauvage EDP",          brand: "Dior",               type: "designer", family: "Fresh",    top: "Bergamot, Pepper",             heart: "Lavender, Vetiver",        base: "Ambroxan, Cedar",             season: ["Spring","Summer","Fall"],           time: ["Daytime","Evening"],                        mood: ["Confident","Bold"],     bg: "p-bg-5",  badge: "Top Pick"    },
  { id: 7,  name: "Black Opium",          brand: "YSL",                type: "designer", family: "Gourmand", top: "Pink Pepper, Orange Blossom",  heart: "Coffee, Jasmine",          base: "Vanilla, Patchouli",          season: ["Fall","Winter"],                    time: ["Evening","Night"],                          mood: ["Bold","Romantic"],      bg: "p-bg-7",  badge: null          },
  { id: 8,  name: "Tobacco Vanille",      brand: "Tom Ford",           type: "designer", family: "Oriental", top: "Tobacco Leaf, Spice",          heart: "Vanilla, Cacao",           base: "Tonka Bean, Sandalwood",      season: ["Fall","Winter"],                    time: ["Evening","Night"],                          mood: ["Bold","Confident"],     bg: "p-bg-3",  badge: "Luxury"      },
  { id: 9,  name: "Silver Mountain Water",brand: "Creed",              type: "niche",    family: "Fresh",    top: "Bergamot, Mandarin",           heart: "Green Tea, Blackcurrant",  base: "Musk, Sandalwood",            season: ["Spring","Summer"],                  time: ["Morning","Daytime"],                        mood: ["Relaxed","Minimal"],    bg: "p-bg-10", badge: null          },
  { id: 10, name: "Ombre Leather",        brand: "Tom Ford",           type: "designer", family: "Woody",    top: "Cardamom, Floral Accord",      heart: "Leather, Jasmine",         base: "Amber, Oakmoss, Vetiver",     season: ["Fall","Winter"],                    time: ["Evening","Night"],                          mood: ["Confident","Bold"],     bg: "p-bg-9",  badge: null          },
  { id: 11, name: "Flowerbomb",           brand: "Viktor & Rolf",      type: "designer", family: "Floral",   top: "Tea, Bergamot",                heart: "Jasmine, Rose, Orchid",    base: "Patchouli, Musk",             season: ["Spring","Fall"],                    time: ["Daytime","Evening"],                        mood: ["Romantic","Relaxed"],   bg: "p-bg-11", badge: null          },
  { id: 12, name: "Neroli Portofino",     brand: "Tom Ford",           type: "designer", family: "Fresh",    top: "Neroli, Bergamot",             heart: "Lavender, Myrtle",         base: "Amber, Oakmoss, Angelica",    season: ["Spring","Summer"],                  time: ["Morning","Daytime"],                        mood: ["Relaxed","Confident"],  bg: "p-bg-12", badge: null          },
  { id: 13, name: "Rose 31",              brand: "Le Labo",            type: "niche",    family: "Floral",   top: "Cumin, Bergamot",              heart: "Rose, Geranium",           base: "Cedar, Amber, Musk",          season: ["Spring","Summer"],                  time: ["Daytime","Evening"],                        mood: ["Romantic","Confident"], bg: "p-bg-2",  badge: null          },
  { id: 14, name: "Molecule 01",          brand: "Escentric Molecules",type: "niche",    family: "Woody",    top: "Iso E Super",                  heart: "Iso E Super",              base: "Iso E Super",                 season: ["Spring","Summer","Fall","Winter"], time: ["Morning","Daytime","Evening","Night"],     mood: ["Minimal","Confident"],  bg: "p-bg-5",  badge: "Cult"        },
  { id: 15, name: "Acqua di Giò Profumo", brand: "Armani",             type: "designer", family: "Fresh",    top: "Marine Note, Bergamot",        heart: "Sage, Geranium",           base: "Incense, Patchouli",          season: ["Spring","Summer"],                  time: ["Daytime","Evening"],                        mood: ["Confident","Relaxed"],  bg: "p-bg-10", badge: null          },
  { id: 16, name: "Good Girl",            brand: "Carolina Herrera",   type: "designer", family: "Gourmand", top: "Almond, Coffee",               heart: "Tuberose, Jasmine",        base: "Cocoa, Sandalwood, Tonka",    season: ["Fall","Winter"],                    time: ["Evening","Night"],                          mood: ["Bold","Romantic"],      bg: "p-bg-7",  badge: null          },
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
