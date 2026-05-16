import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Nav } from '../components/Nav.jsx';
import { Footer } from '../components/Footer.jsx';
import { useApp } from '../context/AppContext.jsx';

const TABS = [
  { key: 'top10',         label: 'Top 10 Lists' },
  { key: 'occasions',     label: 'Occasion Pairings' },
  { key: 'concentration', label: 'Concentration Guide' },
  { key: '101',           label: 'Fragrance 101' },
  { key: 'glossary',      label: 'Glossary' },
  { key: 'sourcing',      label: 'About Sourcing' },
];

const LISTS = {
  compliments: [
    { id: 2, why: "Stops people mid-sentence. The most complimented fragrance on earth for a reason." },
    { id: 1, why: "Timeless, powerful, instantly recognizable. Aventus never goes unnoticed." },
    { id: 6, why: "Sauvage EDP strikes the perfect balance of fresh and warm — everyone responds." },
    { id: 4, why: "Santal 33 draws people in rather than announcing itself. Cult for a reason." },
    { id: 8, why: "Tobacco Vanille is opulent — the kind of scent people smell across the room." },
    { id: 3, why: "Blanche's clean powdery florals are universally loved and never polarizing." },
    { id: 11, why: "Flowerbomb has decades of proven crowd appeal." },
    { id: 5, why: "Jazz Club has a cinematic warmth people can't help but comment on." },
    { id: 7, why: "Black Opium's coffee-vanilla drydown is addictive and memorable." },
    { id: 14, why: "Molecule 01 works with your skin chemistry — uniquely personal on everyone." },
  ],
  summer: [
    { id: 9, why: "Silver Mountain Water is pure, crisp, and effortless in the heat." },
    { id: 6, why: "Sauvage EDP's bergamot and ambroxan shine brightest in warm weather." },
    { id: 3, why: "Blanche is clean and airy — perfect for humid days." },
    { id: 15, why: "Acqua di Giò Profumo brings marine freshness made for summer." },
    { id: 12, why: "Neroli Portofino smells like a Mediterranean holiday." },
    { id: 13, why: "Rose 31 is a dry spiced rose that handles heat without going sour." },
    { id: 1, why: "Aventus opens with pineapple brightness ideal for warmer months." },
    { id: 14, why: "Molecule 01 sits close to skin — ideal for close-quarters summer wear." },
    { id: 16, why: "Good Girl's brightness lifts in the heat without becoming overwhelming." },
    { id: 2, why: "BR540's amber warmth reads differently — and beautifully — in summer sun." },
  ],
  winter: [
    { id: 8, why: "Tobacco Vanille was born for cold weather — rich, warm, enveloping." },
    { id: 2, why: "Baccarat Rouge 540 glows in winter — the amber reads like firelight on skin." },
    { id: 5, why: "Jazz Club is a winter staple — rum, tobacco, vanilla. Perfect." },
    { id: 4, why: "Santal 33's creamy sandalwood wraps around you like a warm layer." },
    { id: 10, why: "Ombre Leather is dark, structured, and built for cold-weather confidence." },
    { id: 6, why: "Sauvage EDP's base notes deepen and become more complex in the cold." },
    { id: 7, why: "Black Opium's coffee and patchouli drydown is comforting in cold air." },
    { id: 1, why: "Aventus smokes and warms in winter — base notes last all day in the cold." },
    { id: 11, why: "Flowerbomb's patchouli base becomes richer in cold weather." },
    { id: 9, why: "Silver Mountain Water's clean lines cut through even the coldest air." },
  ],
  office: [
    { id: 14, why: "Molecule 01 is the definition of office-appropriate — present but never overpowering." },
    { id: 9, why: "Silver Mountain Water is clean, fresh, and completely inoffensive." },
    { id: 3, why: "Blanche is quietly elegant — the fragrance equivalent of a well-tailored shirt." },
    { id: 13, why: "Rose 31's dry woody rose is sophisticated and professionally appropriate." },
    { id: 15, why: "Acqua di Giò Profumo projects just enough without filling the entire room." },
    { id: 12, why: "Neroli Portofino is bright and clean — the ideal morning scent." },
    { id: 6, why: "Sauvage EDT at 2 sprays is perfectly calibrated for the office." },
    { id: 4, why: "Santal 33 sits close to skin — noticed only when colleagues are close." },
    { id: 11, why: "Flowerbomb EDP at a single spray is warm and subtle enough for most workplaces." },
    { id: 16, why: "Good Girl at 1 spray is office-appropriate — push beyond that and it's a statement." },
  ],
  date: [
    { id: 2, why: "There's a reason BR540 is legendary. It's not subtle — in the best possible way." },
    { id: 8, why: "Tobacco Vanille is intimate, warm, and designed for close proximity." },
    { id: 5, why: "Jazz Club is the most romantic fragrance on this list — cinematic and memorable." },
    { id: 10, why: "Ombre Leather is dark and confidently seductive." },
    { id: 4, why: "Santal 33 is understated romance — noticed only when someone gets close." },
    { id: 7, why: "Black Opium's coffee-vanilla drydown is deeply appealing in intimate settings." },
    { id: 1, why: "Aventus makes a statement before you say a word. That's the point." },
    { id: 11, why: "Flowerbomb's name says it all — warm, floral, and designed to be remembered." },
    { id: 13, why: "Rose 31 is dry, confident romance that doesn't try too hard." },
    { id: 16, why: "Good Girl. Exactly the right name for exactly the right occasion." },
  ],
  niche: [
    { id: 1, why: "Aventus by Creed is the gold standard of niche — copied endlessly, never matched." },
    { id: 2, why: "Baccarat Rouge 540 changed the fragrance industry when it launched." },
    { id: 4, why: "Santal 33 is Le Labo's masterpiece — a cult classic for good reason." },
    { id: 3, why: "Blanche is quietly perfect — underrated even among fragrance enthusiasts." },
    { id: 14, why: "Molecule 01 is a marvel — it smells different on every single person." },
    { id: 13, why: "Rose 31 proves that rose can be dry, woody, and completely unisex." },
    { id: 9, why: "Silver Mountain Water is Creed at its most effortlessly elegant." },
    { id: 5, why: "Jazz Club's storytelling through scent is what niche is supposed to do." },
    { id: 10, why: "Ombre Leather is Tom Ford Private Blend at its most wearable." },
    { id: 12, why: "Neroli Portofino is the perfect luxury escape — summer in a bottle." },
  ],
};

const LIST_TABS = [
  { key: 'compliments', label: 'Most Complimented' },
  { key: 'summer',      label: 'Best for Summer' },
  { key: 'winter',      label: 'Best for Winter' },
  { key: 'office',      label: 'Office Safe' },
  { key: 'date',        label: 'Date Night' },
  { key: 'niche',       label: 'Best Niche' },
];

const OCCASIONS = [
  { name: 'First Date',     bg: 'linear-gradient(160deg,#2a1a20,#4a2838)', vibe: 'Warm and close to skin. You want to be noticed when they lean in, not from across the room.',     picks: [{ id: 2, note: 'The ultimate' },   { id: 4, note: 'Understated' },     { id: 5, note: 'Cinematic' }] },
  { name: 'Job Interview',  bg: 'linear-gradient(160deg,#1a2030,#2a3848)', vibe: 'Confident but invisible. Be remembered for your answers, not your scent. One spray, pulse points only.', picks: [{ id: 14, note: 'Safest pick' },   { id: 9, note: 'Clean & sharp' },   { id: 3, note: 'Quietly elegant' }] },
  { name: 'Night Out',      bg: 'linear-gradient(160deg,#1a1228,#302040)', vibe: 'Project. This is the time to go bold — the room is loud, the lighting is low, and you want your trail to linger.', picks: [{ id: 1, note: 'Commands the room' },{ id: 8, note: 'Rich & warm' }, { id: 7, note: 'Bold & sensual' }] },
  { name: 'Summer Wedding', bg: 'linear-gradient(160deg,#1a2820,#304838)', vibe: 'Elegant and occasion-appropriate. Complement the event, don\'t compete with it.',                                  picks: [{ id: 12, note: 'Perfect for it' },  { id: 3, note: 'Clean elegance' }, { id: 13, note: 'Sophisticated' }] },
  { name: 'Travel',         bg: 'linear-gradient(160deg,#202818,#384030)', vibe: 'Light and adaptable. 5ml or 10ml decants are your best friend — check the spray calculator.',                     picks: [{ id: 15, note: 'Versatile everywhere' },{ id: 9, note: 'Fresh & easy' },   { id: 14, note: 'Ultra-portable' }] },
  { name: 'Casual Weekend', bg: 'linear-gradient(160deg,#282018,#403828)', vibe: 'No rules. This is the moment for something you genuinely love wearing.',                                          picks: [{ id: 4, note: 'Weekend classic' },{ id: 6, note: 'Easy all-day' }, { id: 11, note: 'Effortless' }] },
];

const GLOSSARY = [
  { term: 'Accord', def: 'A blend of ingredients that together create a unified scent impression. An "amber accord" is not one ingredient but a combination that evokes amber.' },
  { term: 'Aldehydic', def: 'A soapy, powdery, or waxy quality in fragrance. Iconic in classic perfumery — Chanel No.5 is the defining example of an aldehydic fragrance.' },
  { term: 'Ambergris', def: 'A rare animalic fixative. Used in trace amounts to give warmth, depth, and extraordinary longevity. Almost always synthetic today.' },
  { term: 'Animalic', def: 'Scents that evoke skin, fur, musk, or barnyard. Can be subtle and sexy or bold and raw. Civet, castoreum, and ambergris are classic animalic notes.' },
  { term: 'Base Notes', def: 'The final layer of a fragrance — woods, resins, musks — that emerges after the top and heart notes fade. What you smell hours after application.' },
  { term: 'Chypre', def: 'A family of fragrances built on oakmoss, labdanum, and bergamot. Rich, earthy, and complex. Pronounced "sheep-ruh".' },
  { term: 'Concentration', def: 'The percentage of fragrance oil in a bottle. Higher concentration = stronger and longer-lasting. Ranges from EDC (2-4%) to Parfum (20-40%).' },
  { term: 'Decant', def: 'A small amount of fragrance transferred from a larger bottle for sampling or travel. Typically 1ml, 2ml, 5ml, or 10ml.' },
  { term: 'Dry-down', def: 'The final phase of a fragrance after it has fully settled on skin — the base notes. How a fragrance smells 30–60 minutes after application.' },
  { term: 'EDT', def: 'Eau de Toilette. 5-15% fragrance oil. Lasts 3-5 hours. The most popular format for designer fragrances.' },
  { term: 'EDP', def: 'Eau de Parfum. 15-20% fragrance oil. Richer and longer-lasting than EDT. Common in both designer and niche releases.' },
  { term: 'Extrait', def: 'Also called Pure Parfum. The highest concentration at 20-40%. Intense, skin-close, and long-lasting. Priced accordingly.' },
  { term: 'Fixative', def: 'An ingredient that slows evaporation and helps a fragrance last longer. Musks, resins, and woods commonly serve as fixatives.' },
  { term: 'Fougère', def: 'A fragrance family built on lavender, oakmoss, and coumarin. The backbone of classic men\'s cologne. Pronounced "foo-zhair", French for fern.' },
  { term: 'Green', def: 'Notes that evoke cut grass, leaves, stems, or herbs. Fresh and naturalistic — think vetiver, galbanum, violet leaf.' },
  { term: 'Heart Notes', def: 'The middle phase that emerges as top notes fade. The true character of the scent — typically florals, spices, or green accords.' },
  { term: 'Longevity', def: 'How long a fragrance lasts on skin from first spray to undetectable. Affected by concentration, skin type, and humidity.' },
  { term: 'Musk', def: 'Originally from deer glands, now almost entirely synthetic. Creates warmth, softness, and a skin-like quality that anchors many fragrances.' },
  { term: 'Niche', def: 'Fragrances from independent houses that prioritize artistic vision over mass appeal. Typically pricier, more unique, higher-quality ingredients.' },
  { term: 'Nose', def: 'The perfumer who creates a fragrance. A term of respect — like "chef" in cooking.' },
  { term: 'Oud', def: 'Agarwood resin. One of the most expensive ingredients in perfumery — dark, woody, animalic, and deeply complex. Central to Middle Eastern perfumery.' },
  { term: 'Projection', def: 'How far a fragrance radiates from the skin into surrounding air. High projection = sillage you leave in a room. Also called "throw".' },
  { term: 'Sillage', def: 'The trail a fragrance leaves in the air as you move through it. From the French word for "wake". Pronounced "see-yazh".' },
  { term: 'Skin Scent', def: 'A fragrance that stays close to skin rather than projecting outward. Intimate and personal — only detectable when someone is very close.' },
  { term: 'Top Notes', def: 'The first impression after spraying. Usually citrus, herbs, or light florals. Lasts 15-30 minutes.' },
  { term: 'Vetiver', def: 'A grass from tropical regions with a deep, earthy, smoky, woody scent. One of the most versatile base notes in perfumery.' },
];

const EDU = [
  { title: 'How to apply fragrance', body: <>Spray on <strong>pulse points</strong> — wrists, neck, behind the ears, inner elbows. These areas generate heat which amplifies and diffuses the scent. Don't rub your wrists together after spraying — it crushes the top notes and shortens the life of the fragrance.</>, tip: <><strong>Pro tip:</strong> Spray on moisturized skin. Fragrance lasts significantly longer on hydrated skin. An unscented lotion applied first works perfectly.</> },
  { title: 'The pyramid structure', body: <>Every fragrance is built in three layers. <strong>Top notes</strong> are what you smell in the first 15 minutes. <strong>Heart notes</strong> emerge as the top fades and define the character. <strong>Base notes</strong> are what lingers for hours. Always test on skin for at least 30 minutes before deciding.</>, tip: <><strong>Pro tip:</strong> Never buy based on the spray card alone. The real fragrance reveals itself on your skin — not paper.</> },
  { title: 'Sillage vs longevity', body: <><strong>Sillage</strong> (see-yazh) is the trail a fragrance leaves in the air around you. <strong>Longevity</strong> is how long it lasts on skin. These are independent — a fragrance can project heavily for two hours, or sit quietly on skin for twelve. Knowing which you want helps you choose the right concentration.</>, tip: <><strong>Pro tip:</strong> For offices, prioritize longevity over sillage. For evenings and events, prioritize projection.</> },
  { title: 'Skin chemistry is everything', body: <>The same fragrance smells different on every person. Your skin's <strong>pH, moisture level, and diet</strong> all affect how a scent develops. This is why a fragrance that smells incredible on someone else might not work the same way on you. Always test before committing to a full bottle.</>, tip: <><strong>Pro tip:</strong> Test no more than 3 fragrances per session. Your nose fatigues quickly after that.</> },
  { title: 'How to store your bottles', body: <>Fragrance degrades when exposed to <strong>light, heat, and air</strong>. Keep bottles away from bathroom shelves and windowsills. A dark drawer or closet shelf is ideal. Original boxes provide extra protection. A properly stored fragrance can last 5–10 years easily.</>, tip: <><strong>Pro tip:</strong> Don't display your collection near sunlight, no matter how good it looks. Light breaks down the juice within months.</> },
  { title: 'Building a fragrance wardrobe', body: <>Think of fragrance like clothing — you don't wear the same outfit everywhere. A well-rounded wardrobe includes a <strong>fresh daytime scent</strong>, a <strong>warm evening scent</strong>, and a <strong>seasonal wildcard</strong>. Start with one you love unconditionally, then layer out from there.</>, tip: <><strong>Pro tip:</strong> Your signature scent should be one you reach for automatically — not your most expensive bottle, but the one that feels most like you.</> },
  { title: 'Niche vs designer', body: <><strong>Designer fragrances</strong> (Dior, YSL, Chanel) are made to appeal broadly and produced at scale. <strong>Niche fragrances</strong> (Le Labo, Byredo, Creed) prioritize artistic vision, use higher-quality ingredients, and are made in smaller batches. Neither is objectively better — they serve different purposes.</>, tip: <><strong>Pro tip:</strong> Start with designer to learn your preferences, then move into niche once you know what you're looking for.</> },
  { title: 'How to layer fragrances', body: <>Layering means applying two fragrances intentionally to create something new. Apply the <strong>heavier, base-rich scent first</strong>, then the lighter one on top. Let each dry slightly before adding the next. Use the <strong>Layer Builder</strong> to analyze combinations before trying them on skin.</>, tip: <><strong>Pro tip:</strong> Start with fragrances from the same house — brands like Tom Ford design their scents to complement each other.</> },
];

export function ExtrasPage() {
  const { fragrances, openSampleModal, openSourceModal } = useApp();
  const { hash } = useLocation();
  const [tab, setTab] = useState(() => {
    const t = hash.replace('#', '');
    return TABS.find(x => x.key === t)?.key ?? 'top10';
  });
  const [listKey, setListKey] = useState('compliments');
  const [glossaryQ, setGlossaryQ] = useState('');

  useEffect(() => { document.body.classList.add('dark'); return () => document.body.classList.remove('dark'); }, []);

  // Keep the active tab in sync with the URL hash so footer links like
  // /explore#sourcing work even when the user is already on /explore.
  useEffect(() => {
    const t = hash.replace('#', '');
    if (t && TABS.find(x => x.key === t)) setTab(t);
  }, [hash]);

  const filteredGlossary = useMemo(() => {
    const q = glossaryQ.trim().toLowerCase();
    if (!q) return GLOSSARY;
    return GLOSSARY.filter(g => g.term.toLowerCase().includes(q) || g.def.toLowerCase().includes(q));
  }, [glossaryQ]);

  const getF = (id) => fragrances.find(f => f.id === id);

  return (
    <>
      <Nav theme="dark" />

      <div className="page-hero">
        <p className="page-hero-label">Explore</p>
        <h1 className="page-hero-title">Everything you need to<br/><em>know your scent.</em></h1>
      </div>

      <div className="tab-strip">
        {TABS.map(t => (
          <button key={t.key} type="button" className={`ext-tab ${tab === t.key ? 'active' : ''}`} onClick={() => setTab(t.key)}>{t.label}</button>
        ))}
      </div>

      {tab === 'top10' && (
        <div className="ext-page">
          <div className="ext-intro">
            <p className="ext-label">Curated Rankings</p>
            <h2 className="ext-title">The lists worth <em>reading.</em></h2>
            <p className="ext-sub">Opinionated and curated — not algorithmic. Real picks from people who actually wear this stuff.</p>
          </div>
          <div className="list-tabs">
            {LIST_TABS.map(l => (
              <button key={l.key} type="button" className={`list-tab ${listKey === l.key ? 'active' : ''}`} onClick={() => setListKey(l.key)}>{l.label}</button>
            ))}
          </div>
          <div className="top10-list">
            {LISTS[listKey].map((item, i) => {
              const p = getF(item.id);
              if (!p) return null;
              return (
                <div key={`${listKey}-${item.id}`} className="top10-item">
                  <div className="top10-rank">{String(i + 1).padStart(2, '0')}</div>
                  <div>
                    <div className="top10-brand">{p.brand}</div>
                    <div className="top10-name">{p.name}</div>
                    <div className="top10-notes">{p.top}</div>
                  </div>
                  <div className="top10-right">
                    <div className="top10-why">{item.why}</div>
                    <div className="top10-actions">
                      <button type="button" className="sample-btn" onClick={() => openSampleModal(`${p.name} — ${p.brand}`)}>Order Sample</button>
                      <button type="button" className="source-link" style={{ marginTop: 6, borderTop: 'none', padding: '4px 0 0' }} onClick={() => openSourceModal(`${p.name} — ${p.brand}`)}>or full bottle →</button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {tab === 'occasions' && (
        <div className="ext-page" id="occasions">
          <div className="ext-intro">
            <p className="ext-label">Wear it Right</p>
            <h2 className="ext-title">The right scent for <em>every moment.</em></h2>
            <p className="ext-sub">Context is everything in fragrance. Here's exactly what to reach for — and why — for every situation.</p>
          </div>
          <div className="occasions-grid">
            {OCCASIONS.map(o => (
              <div key={o.name} className="occ-card">
                <div className="occ-visual" style={{ background: o.bg }}><span className="occ-visual-label">{o.name}</span></div>
                <div className="occ-body">
                  <h3 className="occ-name">{o.name}</h3>
                  <p className="occ-vibe">{o.vibe}</p>
                  <p className="occ-picks-label">Recommended picks</p>
                  {o.picks.map(pk => {
                    const p = getF(pk.id);
                    if (!p) return null;
                    return (
                      <div key={pk.id} className="occ-pick">
                        <div>
                          <div className="occ-pick-name">{p.name}</div>
                          <div className="occ-pick-brand">{p.brand} · {pk.note}</div>
                        </div>
                        <button type="button" className="occ-pick-btn" onClick={() => openSampleModal(`${p.name} — ${p.brand}`)}>Sample</button>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'concentration' && (
        <div className="ext-page">
          <div className="ext-intro">
            <p className="ext-label">Know What You're Buying</p>
            <h2 className="ext-title">EDT vs EDP vs <em>Parfum.</em></h2>
            <p className="ext-sub">The percentage of fragrance oil determines longevity, projection, and price. Here's the full breakdown.</p>
          </div>
          <div className="conc-grid">
            <ConcentrationCard type="EDC"     full="Eau de Cologne"          bar={12}  oil="2–4%"   longevity="1–2 hours"   projection="Light"     bestFor="Hot weather, gym"       desc="The lightest concentration. Fresh, fleeting, and perfect for casual use when you don't need lasting power." examples={['4711 Original Eau de Cologne','Acqua di Parma Colonia']} />
            <ConcentrationCard type="EDT"     full="Eau de Toilette"         bar={32}  oil="5–15%"  longevity="3–5 hours"   projection="Moderate"  bestFor="Daily wear, office"     desc="The most popular concentration. Versatile and appropriate for almost any setting. Most designer releases live here." examples={['Dior Sauvage EDT','Creed Aventus EDT']} />
            <ConcentrationCard type="EDP"     full="Eau de Parfum"           bar={62}  oil="15–20%" longevity="6–8 hours"   projection="Strong"    bestFor="Evenings, occasions"    desc="Richer and longer-lasting. Base notes get more development time. Where most niche houses operate." examples={['Dior Sauvage EDP','YSL Black Opium EDP']} />
            <ConcentrationCard type="Parfum"  full="Pure Parfum / Extrait"  bar={100} oil="20–40%" longevity="10–24 hours" projection="Intimate"  bestFor="Special occasions"      desc="The most concentrated form. Fewer sprays needed, stays close to skin, lasts into the next morning. A luxury experience." examples={['Chanel No.5 Parfum','Tom Ford Noir Extreme Parfum']} />
          </div>
        </div>
      )}

      {tab === '101' && (
        <div className="ext-page" id="101">
          <div className="ext-intro">
            <p className="ext-label">The Basics</p>
            <h2 className="ext-title">Everything you need to <em>get started.</em></h2>
            <p className="ext-sub">Eight things that will immediately change how you shop, wear, and think about scent.</p>
          </div>
          <div className="edu-grid">
            {EDU.map((e, i) => (
              <div key={i} className="edu-card reveal">
                <p className="edu-num">0{i + 1}</p>
                <h3 className="edu-title">{e.title}</h3>
                <p className="edu-body">{e.body}</p>
                <div className="edu-tip">{e.tip}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'glossary' && (
        <div className="ext-page" id="glossary">
          <div className="ext-intro">
            <p className="ext-label">Fragrance Dictionary</p>
            <h2 className="ext-title">Know what they're <em>talking about.</em></h2>
            <p className="ext-sub">Every term you'll encounter in fragrance, explained plainly.</p>
          </div>
          <input className="glossary-search" placeholder="Search a term…" value={glossaryQ} onChange={(e) => setGlossaryQ(e.target.value)} />
          <div>
            {filteredGlossary.length === 0
              ? <div className="glossary-empty">No terms found for "{glossaryQ}"</div>
              : filteredGlossary.map(g => (
                  <div key={g.term} className="glossary-item">
                    <div className="glossary-term">{g.term}</div>
                    <div className="glossary-def">{g.def}</div>
                  </div>
                ))}
          </div>
        </div>
      )}

      {tab === 'sourcing' && (
        <div className="ext-page" id="sourcing">
          <div className="ext-intro">
            <p className="ext-label">How Scent Layer Works</p>
            <h2 className="ext-title">Sourcing &amp; <em>transparency.</em></h2>
            <p className="ext-sub">Where the samples come from, how full-bottle sourcing works, and the legal disclaimers that come with operating in this space honestly.</p>
          </div>

          <div className="sourcing-process">
            <div className="sourcing-process-col">
              <p className="sourcing-process-label">Sample orders</p>
              <h3 className="sourcing-process-title">Decanted from <em>authentic full bottles.</em></h3>
              <ol className="sourcing-steps-list">
                <li><span className="sourcing-step-tag">01</span><div><strong>We acquire the full-size bottle</strong> from authorized retailers, brand boutiques, or trusted suppliers. Every source is vetted before we work with them.</div></li>
                <li><span className="sourcing-step-tag">02</span><div><strong>We authenticate before we pour.</strong> Batch codes are cross-referenced against the manufacturer, packaging is inspected, the scent itself is profile-checked against a reference bottle.</div></li>
                <li><span className="sourcing-step-tag">03</span><div><strong>We decant into glass atomizers</strong> — 2ml, 5ml, 10ml, or 30ml — in a clean environment. Each sample is labeled with fragrance name, size, and fill date.</div></li>
                <li><span className="sourcing-step-tag">04</span><div><strong>It ships in protective packaging</strong> within the week, tracked. Samples are recommended to be used within 12 months of fill date for best fidelity.</div></li>
              </ol>
            </div>
            <div className="sourcing-process-col">
              <p className="sourcing-process-label">Full-bottle sourcing</p>
              <h3 className="sourcing-process-title">A request-based <em>concierge service.</em></h3>
              <ol className="sourcing-steps-list">
                <li><span className="sourcing-step-tag">01</span><div><strong>You tell us what you want</strong> — name, brand, size, concentration, batch year if you care. Anything we can find, we'll quote.</div></li>
                <li><span className="sourcing-step-tag">02</span><div><strong>We find it through our network</strong> — boutique distributors, parallel-import suppliers, brand-direct contacts. We aim for 20–40% below manufacturer retail, but availability and pricing vary by bottle.</div></li>
                <li><span className="sourcing-step-tag">03</span><div><strong>We authenticate the specific bottle</strong> before we confirm. If anything looks off, we don't ship it — we either swap for a verified one or refund.</div></li>
                <li><span className="sourcing-step-tag">04</span><div><strong>You confirm the quote, we ship.</strong> No surprises on price. Full tracking. We stand behind authenticity — full refund if a bottle ever proves inauthentic.</div></li>
              </ol>
            </div>
          </div>

          <div className="disclaimer">
            <p className="disclaimer-label">Disclaimers</p>
            <h3 className="disclaimer-title">The honest <em>fine print.</em></h3>
            <p className="disclaimer-lede">Scent Layer operates in a sampling and concierge-sourcing model. The points below are real and worth understanding before you place an order.</p>
            <ul className="disclaimer-list">
              <li>
                <strong>Trademark notice.</strong>
                All brand names, fragrance names, and logos referenced on this site are the property of their respective owners. Scent Layer is not affiliated with, endorsed by, sponsored by, or licensed by any of the perfume houses listed. Names are used solely to identify products you may want to sample or source.
              </li>
              <li>
                <strong>Sample decanting.</strong>
                Sample-size bottles (2ml–30ml) are decanted by Scent Layer from authentic full-size bottles we have acquired and verified. Brands do not sell these sizes themselves — these are not factory pours. The juice inside is unchanged; the bottle is ours.
              </li>
              <li>
                <strong>Sourcing channels.</strong>
                Full-bottle requests are filled through a mix of authorized retailers, parallel imports, and trusted secondary-market suppliers. This is standard for fragrance concierge work and is how we deliver below-retail pricing. Items sourced outside the manufacturer's authorized channel may not be covered by the manufacturer's warranty, even when fully authentic.
              </li>
              <li>
                <strong>Authenticity guarantee.</strong>
                Every bottle and sample is authenticated before it ships. If you receive something we sourced and it is not what we represented it to be, contact us — we will refund or replace it. This guarantee is the foundation of our business.
              </li>
              <li>
                <strong>Skin sensitivity.</strong>
                Fragrance ingredients can cause allergic reactions in a small percentage of users. Before applying any fragrance broadly, test on a small skin area (inner wrist) and wait 24 hours. Discontinue use if irritation occurs. Scent Layer is not liable for individual allergic responses to fragrance ingredients.
              </li>
              <li>
                <strong>Pricing &amp; availability.</strong>
                Sample pricing is fixed at the size selected at order. Full-bottle sourcing pricing depends on current market availability and is confirmed in writing before any bottle is purchased on your behalf. We will never charge you for a bottle without a confirmed quote you've accepted.
              </li>
              <li>
                <strong>Returns.</strong>
                Decanted samples cannot be returned once opened, for hygiene reasons. Unopened full-size bottles may be returned within 14 days of delivery for a refund, less shipping. Detailed return terms are confirmed at order time.
              </li>
              <li>
                <strong>Color &amp; performance variation.</strong>
                Fragrance smells different on every skin chemistry and develops differently depending on temperature, humidity, and time of day. A sample that doesn't work for you doesn't mean it's defective — it means it's not for you. That's exactly what sampling is for.
              </li>
            </ul>

            <p className="disclaimer-footer">
              Questions about a specific bottle, batch year, or process detail not covered here? Email <a href="mailto:scentlayer@gmail.com">scentlayer@gmail.com</a>. We'll answer honestly before any order is placed.
            </p>
          </div>
        </div>
      )}

      <Footer />
    </>
  );
}

function ConcentrationCard({ type, full, bar, oil, longevity, projection, bestFor, desc, examples }) {
  return (
    <div className="conc-card">
      <div className="conc-type">{type}</div>
      <div className="conc-full">{full}</div>
      <div className="conc-bar-label">Oil Concentration</div>
      <div className="conc-bar"><div className="conc-bar-fill" style={{ width: `${bar}%` }} /></div>
      <div className="conc-stat"><span className="conc-stat-label">Oil content</span><span className="conc-stat-val">{oil}</span></div>
      <div className="conc-stat"><span className="conc-stat-label">Longevity</span><span className="conc-stat-val">{longevity}</span></div>
      <div className="conc-stat"><span className="conc-stat-label">Projection</span><span className="conc-stat-val">{projection}</span></div>
      <div className="conc-stat"><span className="conc-stat-label">Best for</span><span className="conc-stat-val">{bestFor}</span></div>
      <p className="conc-desc">{desc}</p>
      <p className="conc-ex-label">Examples</p>
      {examples.map(e => <p key={e} className="conc-ex">{e}</p>)}
    </div>
  );
}
