// Editorial copy for major notes. Each entry adds hand-crafted context
// on top of the auto-generated fragrance list — what the note actually
// is, where it sits in the pyramid, and what it pairs with. Notes not
// in this list still get a /notes/:slug page; the page just falls back
// to a slug-derived heading and the fragrance grid.
//
// Voice: short, specific, no marketing words. Never "embark", never
// "journey". Cite real fragrances by name and brand.

export const NOTE_CATALOG = {
  oud: {
    name: 'Oud',
    eyebrow: 'Agarwood resin · base',
    blurb: 'Resinous agarwood from infected aquilaria trees — one of the most expensive ingredients in perfumery. Dark, woody, faintly animalic, deeply complex. The backbone of Middle Eastern fragrance for centuries; the western interpretations smooth out the funk and lean into the depth. Try Oud Wood for the gateway version, Halfeti for the dramatic one, Oud for Greatness for projection.',
    pairs: ['Saffron', 'Rose', 'Leather'],
  },
  iris: {
    name: 'Iris',
    eyebrow: 'Orris root · heart',
    blurb: "Iris in perfumery comes from the rhizome, not the flower — three to five years aged, ground, distilled. Smells cool, powdery, slightly metallic, sometimes carrot-like. The most expensive natural raw material in the industry. Reads as quietly expensive. Santal 33's quiet glow, Blanche's clean stretch, Another 13's depth all hinge on it.",
    pairs: ['Sandalwood', 'Violet', 'Cardamom'],
  },
  vetiver: {
    name: 'Vetiver',
    eyebrow: 'Grass root · base',
    blurb: 'Haitian or Indian vetiver — distilled from the dried roots of a tropical grass. Smoky, earthy, slightly nutty, deeply rooted. One of the most versatile base notes in perfumery; works in colognes, ouds, gourmands, and chypres alike. The grown-up backbone of Terre d\'Hermès, the structural depth of Bal d\'Afrique.',
    pairs: ['Bergamot', 'Cedar', 'Grapefruit'],
  },
  amber: {
    name: 'Amber',
    eyebrow: 'Resinous accord · base',
    blurb: 'Not the fossilized tree resin — perfumery amber is an accord, usually built from labdanum, benzoin, vanilla, and styrax. Warm, slightly sweet, vaguely powdery. The defining note of "oriental" fragrances. Anything labeled amber-this or amber-that is leaning on a synthetic molecule like ambroxan or ambrocenide doing the heavy lifting.',
    pairs: ['Vanilla', 'Labdanum', 'Tonka'],
  },
  saffron: {
    name: 'Saffron',
    eyebrow: 'Spice · heart',
    blurb: 'The dried stigmas of the Crocus sativus flower. In fragrance, it reads as leathery, slightly metallic, faintly sweet, with a quiet warmth. Often used to bridge florals and oud, or to add depth to rose. Used heavily in Baccarat Rouge 540, Halfeti, Ani — anywhere the composition needs a Middle Eastern spice signature.',
    pairs: ['Rose', 'Oud', 'Leather'],
  },
  ambroxan: {
    name: 'Ambroxan',
    eyebrow: 'Synthetic molecule · base',
    blurb: 'A synthetic isolate of ambergris — the salty, warm, glowing molecule responsible for the "skin scent" effect in most modern fragrances. Dosed heavily in BR540, Sauvage EDP, and Oud for Greatness; in trace amounts everywhere else. The reason a fragrance you can barely smell on yourself fills a room. People either love it or refuse to wear it.',
    pairs: ['Vanilla', 'Cedar', 'Pepper'],
  },
  bergamot: {
    name: 'Bergamot',
    eyebrow: 'Citrus · top',
    blurb: "The skin of a small Italian citrus fruit, cold-pressed. Bright, slightly bitter, slightly floral — sharper than orange, more grown-up than lemon. The most common top note in perfumery; appears in roughly half of every fragrance ever made. Earl Grey tea owes its character to bergamot oil. Sets the tone in the first ten minutes, then disappears.",
    pairs: ['Lavender', 'Vetiver', 'Neroli'],
  },
  tobacco: {
    name: 'Tobacco',
    eyebrow: 'Leaf · heart',
    blurb: 'Dried tobacco leaf. Sweet, slightly nutty, faintly smoky — closer to pipe tobacco than cigarette smoke. Reads as warmth and old leather, autumn afternoons, dim restaurants. The defining note of Tobacco Vanille, Jazz Club, Lord George. Easier to wear than its reputation suggests — sweeter than smoky in most compositions.',
    pairs: ['Vanilla', 'Rum', 'Honey'],
  },
  sandalwood: {
    name: 'Sandalwood',
    eyebrow: 'Wood · base',
    blurb: 'Heart-wood from the slow-growing Santalum trees of India and Australia. Creamy, warm, faintly milky — radically different from cedar or oak. The most prized variety (Mysore) is functionally extinct; modern fragrances use Australian or synthetic versions. The note that makes Santal 33 a global signature; the quiet heart of Tam Dao.',
    pairs: ['Iris', 'Cardamom', 'Rose'],
  },
  jasmine: {
    name: 'Jasmine',
    eyebrow: 'White floral · heart',
    blurb: "Jasmine absolute — the headspace of the night-blooming flower captured via solvent extraction. Indolic, narcotic, slightly animalic at full strength. Reads heavy and feminine in old compositions; in modern fragrances it's diffused, used as a softening transition. Carnal Flower wears jasmine loud; Coromandel hides it under patchouli.",
    pairs: ['Sandalwood', 'Tuberose', 'Ylang'],
  },
  leather: {
    name: 'Leather',
    eyebrow: 'Accord · base',
    blurb: 'Not an extract — leather in perfumery is an accord, usually built from birch tar, isobutyl quinoline, castoreum, and styrax. Smoky, dry, faintly animalic. Reads as expensive jackets, saddle leather, old library chairs. Tom Ford\'s Ombre Leather pulls it warm; Interlude Man pulls it dark. The accord that ages well on any skin.',
    pairs: ['Tobacco', 'Oud', 'Birch Tar'],
  },
  vanilla: {
    name: 'Vanilla',
    eyebrow: 'Pod · base',
    blurb: 'Madagascar vanilla pods, extracted as absolute or tincture. Warm, sweet, slightly boozy from the natural ethanol. The most common gourmand note in perfumery — used in trace amounts everywhere, dosed heavily in Tobacco Vanille, Khamrah, Memoirs of a Trespasser. Pulls a composition toward dessert when overdosed; adds glow when restrained.',
    pairs: ['Tonka', 'Amber', 'Tobacco'],
  },
  rose: {
    name: 'Rose',
    eyebrow: 'Floral · heart',
    blurb: "The classical centerpiece. Damask or centifolia, distilled or extracted. Smells like the flower until perfumers do something to it — cumin pulls Rose 31 dry, oud pulls Halfeti dark, raspberry and patchouli pull Portrait of a Lady into something theatrical. Roses are what perfumers reach for when they want to show what they can do.",
    pairs: ['Saffron', 'Patchouli', 'Oud'],
  },
  patchouli: {
    name: 'Patchouli',
    eyebrow: 'Leaf · base',
    blurb: 'Distilled from the dried, fermented leaves of the Pogostemon plant. Dark, earthy, slightly sweet, faintly camphorous. The modern fractioned versions strip out the hippie 70s character and leave a clean depth. The structural backbone of half of modern perfumery — Coromandel, Aventus, Portrait of a Lady all pivot on it.',
    pairs: ['Rose', 'Vanilla', 'Bergamot'],
  },
  pepper: {
    name: 'Pink Pepper',
    eyebrow: 'Spice · top',
    blurb: 'Berries of the Schinus tree — not actually related to black pepper. Sharp, slightly fruity, bright. Modern perfumery uses it almost everywhere as a top-note spike that wakes up softer florals or sweeter bases. The faint zing in Replica Jazz Club, the brightness in Mango Skin, the sparkle in Pegasus.',
    pairs: ['Bergamot', 'Rose', 'Cardamom'],
  },
  cardamom: {
    name: 'Cardamom',
    eyebrow: 'Spice · top to heart',
    blurb: 'Green cardamom pods, distilled. Cool, slightly camphorous, faintly citrus. Bridges fresh and warm — works at the top of a cologne or in the heart of an oriental. The defining spice of Declaration; the quiet structural note in Santal 33, Layton, and Cedrat Boise.',
    pairs: ['Iris', 'Sandalwood', 'Bergamot'],
  },
  cedar: {
    name: 'Cedar',
    eyebrow: 'Wood · base',
    blurb: 'Atlas or Virginia cedarwood, distilled from the heart-wood. Dry, sharp, faintly pencil-shaving. Cheaper and more reliable than sandalwood; appears in almost every modern composition as a structural anchor. Provides the dry backbone in Sauvage, Bleu de Chanel EDP, Terre d\'Hermès.',
    pairs: ['Vetiver', 'Bergamot', 'Iris'],
  },
  musk: {
    name: 'Musk',
    eyebrow: 'Synthetic isolates · base',
    blurb: 'Originally extracted from a gland of the Tibetan musk deer — now entirely synthetic, since the deer is endangered. Modern white musks (galaxolide, habanolide, ethylene brassylate) are clean, soft, slightly powdery — the "fresh laundry" character in Blanche, Silver Mountain Water, and Bal d\'Afrique. Adds warmth, longevity, and that just-bathed quality.',
    pairs: ['Iris', 'Vanilla', 'Bergamot'],
  },
  fig: {
    name: 'Fig',
    eyebrow: 'Fruit + leaf · heart',
    blurb: 'Fig in perfumery covers three distinct accords: the sweet fruit (lactonic, milky), the green leaf (sharp, photosynthetic), and the wood (dry, slightly coconutty). Philosykos uses all three — making it the reference. Marfa, Gris Charnel, and Debaser all pull from different parts of the same tree.',
    pairs: ['Coconut', 'Cedar', 'Green Notes'],
  },
};
