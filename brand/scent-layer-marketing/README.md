# Scent Layer Marketing Pack

This folder customizes the marketing plugin for **Scent Layer** — your friend's niche and designer fragrance decant business. The marketing plugin's skills (`/draft-content`, `/brand-review`, `/campaign-plan`, `/email-sequence`, `/seo-audit`, `/competitive-brief`, `/performance-report`) will look in this file set to know Scent Layer's voice, audience, messaging, and channels — instead of asking those questions every single time you run a command.

## What's Inside

| File | Purpose |
|---|---|
| `BRAND.md` | Master brand context — read this first. Snapshot, positioning, voice, what we don't sound like. |
| `AUDIENCE.md` | The three Scent Layer personas — Curious Beginner, Fragrance Explorer, Collector. |
| `MESSAGING.md` | The four messaging pillars and example headlines for each. |
| `STYLE_GUIDE.md` | Punctuation, capitalization, fragrance terminology rules, what to avoid. |
| `PRODUCT_GLOSSARY.md` | Fragrance vocabulary used in copy (sillage, EDP, chypre, etc.). |
| `CHANNELS.md` | Website + social media playbook: content types, SEO targets, posting cadence. |
| `COMPETITORS.md` | Seed competitive landscape — direct, adjacent, positioning gaps. |

## How to Use It

### Option 1 — Keep these files in a working folder (recommended)

1. Save this `scent-layer-marketing/` folder somewhere on your computer where you'll work on Scent Layer marketing (e.g., `Documents/Scent Layer/`).
2. In Claude / Cowork, connect that folder as your workspace.
3. From then on, any time you run a marketing command, Claude will see these files and apply them automatically. You can paste new drafts in chat, and `/brand-review` will check them against `BRAND.md` + `STYLE_GUIDE.md`.

### Option 2 — Reference them in chat

If you'd rather not keep a connected folder, just say "use the Scent Layer brand context I have in this conversation" and the marketing skills will use what we've drafted here.

### Option 3 — Edit them as you learn

Treat these as living documents. As you publish content and see what works, update:

- `MESSAGING.md` — add or refine pillars.
- `COMPETITORS.md` — new entrants, competitor moves.
- `CHANNELS.md` — posting cadence, new SEO themes.
- `STYLE_GUIDE.md` — terms that keep slipping into copy that shouldn't, or new terms that should be added.

## Try It Out

Once these files are in place, here are example prompts that will use them automatically:

- **Draft a product description:**
  > Draft a product description for Maison Francis Kurkdjian *Baccarat Rouge 540*, 5ml decant, $24.

- **Plan a campaign:**
  > Plan a six-week launch campaign for Scent Layer's "Fall Gourmand Five" decant set, $58.

- **Review some copy:**
  > Brand-review this caption: "✨ Indulge in the enchanting elixir of mystery 🌿 Tap to shop our newest niche obsession!! ✨"

- **Draft an email sequence:**
  > Draft a five-email welcome sequence for new Scent Layer subscribers from the Find Your Scent quiz.

- **Run a competitive scan:**
  > Build a competitive brief comparing Scent Layer to The Perfumed Court and Scentbird, focused on positioning gaps we can own.

- **SEO audit angle:**
  > Suggest 10 blog topics for Scent Layer focused on FragranceTok-curious beginners.

## What's Next

A few things to add to this folder over time:

1. **Real product catalog** — A list of the houses and fragrances Scent Layer currently stocks. Right now `PRODUCT_GLOSSARY.md` covers commonly-stocked houses, but a CSV or table of actual SKUs would let Claude write product-specific copy directly.
2. **Sample published content** — Drop a few of your friend's existing captions, product descriptions, and emails into a `examples/` subfolder. `/brand-review` and `/draft-content` will use them as voice training material.
3. **Real customer data / personas** — As Scent Layer learns who's actually buying, refine `AUDIENCE.md` from "three educated guesses" to "three observed segments."
4. **Visual identity** — If there's a logo, color palette, or photography style, drop them into `assets/` and reference them in `STYLE_GUIDE.md`.
