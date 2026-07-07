import { Link } from 'react-router-dom';
import { Nav } from '../components/Nav.jsx';
import { Footer } from '../components/Footer.jsx';
import { useDocumentMeta } from '../lib/seo.js';

/**
 * Customer-facing info pages: Shipping & Returns and FAQ. Reuses the
 * legal-page layout classes. Copy states the real policies wired into
 * checkout (free US shipping over $50, $5.95 flat below).
 */

export function ShippingPage() {
  useDocumentMeta({
    title: 'Shipping & Returns',
    description: 'Shipping rates, delivery times, and the return policy for Scent Layer samples and decants.',
  });
  return (
    <>
      <Nav />
      <article className="legal-page">
        <p className="legal-eyebrow">Shipping &amp; Returns</p>
        <h1 className="legal-title">How your samples<br/><em>get to you.</em></h1>
        <p className="legal-effective">Last updated: July 2026</p>

        <Section title="Shipping rates">
          <ul className="legal-list">
            <li><strong>US orders over $50</strong> — free standard shipping.</li>
            <li><strong>US orders under $50</strong> — flat $5.95 standard shipping.</li>
            <li><strong>Canada, UK, Australia, New Zealand, Ireland</strong> — rates shown at checkout.</li>
          </ul>
          <p>Standard delivery runs 3–7 business days from the day your order ships. Every package includes tracking, emailed the moment the label prints.</p>
        </Section>

        <Section title="Processing time">
          <p>Samples are decanted to order, we don't pre-fill and let vials sit. Orders placed before 2pm ET ship the same or next business day; everything else ships within 2 business days.</p>
        </Section>

        <Section title="Packaging">
          <p>Every decant ships in a glass atomizer with a labeled size and batch, padded and boxed so it arrives intact. 30ml sizes ship in travel-safe cases.</p>
        </Section>

        <Section title="Returns">
          <p>Fragrance is personal, and decants are made to order, so we handle returns case by case rather than hiding behind a blanket no-returns policy:</p>
          <ul className="legal-list">
            <li><strong>Damaged or leaked in transit</strong> — photo within 7 days of delivery and we reship free, no questions.</li>
            <li><strong>Wrong item</strong> — our mistake, we reship the right one and you keep the wrong one.</li>
            <li><strong>Changed your mind</strong> — unopened decants can be returned within 14 days for a refund minus shipping. Opened decants can't be restocked, that's a hygiene line we won't cross.</li>
          </ul>
          <p>Start any return by emailing <a href="mailto:scentlayer@gmail.com">scentlayer@gmail.com</a> with your order number.</p>
        </Section>

        <Section title="Authenticity guarantee">
          <p>Every decant is drawn from a sealed retail bottle we sourced and verified ourselves. If you ever doubt a sample's authenticity, we'll refund it in full and review the batch.</p>
        </Section>

        <p className="legal-back"><Link to="/">← Back to home</Link></p>
      </article>
      <Footer />
    </>
  );
}

export function FAQPage() {
  useDocumentMeta({
    title: 'FAQ',
    description: 'Common questions about Scent Layer samples, decanting, authenticity, sizes, and shipping.',
  });
  return (
    <>
      <Nav />
      <article className="legal-page">
        <p className="legal-eyebrow">FAQ</p>
        <h1 className="legal-title">Questions we get<br/><em>every week.</em></h1>

        <Section title="Are these real fragrances?">
          <p>Yes. Every sample is decanted from a sealed, full-size retail bottle we bought and verified. We don't buy "oil versions", clones, or anything from a market stall. If a bottle can't be verified, it doesn't get decanted.</p>
        </Section>

        <Section title="What exactly is a decant?">
          <p>A decant is a smaller amount of a genuine fragrance transferred from its original bottle into a clean glass atomizer. Same juice, smaller pour. It's how you wear a $300 fragrance for two weeks before deciding whether it deserves shelf space.</p>
        </Section>

        <Section title="Which size should I get?">
          <ul className="legal-list">
            <li><strong>2ml (~30 sprays)</strong> — enough to wear it two or three times. First contact.</li>
            <li><strong>5ml (~85 sprays)</strong> — a solid week or two. The sweet spot for deciding.</li>
            <li><strong>10ml (~175 sprays)</strong> — a month of regular wear.</li>
            <li><strong>30ml (~510 sprays)</strong> — a travel bottle in its own right.</li>
          </ul>
        </Section>

        <Section title="Why do prices differ per fragrance?">
          <p>Pricing tracks the real bottle. A fragrance that retails at $495 per 100ml costs more per ml than one that retails at $35. Our sample prices are computed from each fragrance's actual retail per-ml cost plus a fair decanting margin, so an expensive sample means an expensive bottle, not an arbitrary markup.</p>
        </Section>

        <Section title="How long will my sample last before it goes off?">
          <p>Stored away from heat and direct sun, a decant keeps for a year or more. The atomizers we use seal well; the biggest enemy is a hot car, not time.</p>
        </Section>

        <Section title="Do you ship internationally?">
          <p>Currently: US, Canada, UK, Australia, New Zealand, and Ireland. US orders over $50 ship free; other rates appear at checkout. See <Link to="/shipping">Shipping &amp; Returns</Link> for the full policy.</p>
        </Section>

        <Section title="Can you get a fragrance you don't list?">
          <p>Usually, yes. Use the "Source a bottle" option on any page and tell us what you're hunting. If we can verify a legitimate source, we'll quote you a price for a sample or the full bottle.</p>
        </Section>

        <Section title="I found my signature. Now what?">
          <p>Congratulations, that's the whole point. We source full bottles at a discount for people who sampled first, and your sample purchases are credited toward the bottle when you buy through us.</p>
        </Section>

        <p className="legal-back"><Link to="/">← Back to home</Link></p>
      </article>
      <Footer />
    </>
  );
}

function Section({ title, children }) {
  return (
    <section className="legal-section">
      <h2 className="legal-section-title">{title}</h2>
      {children}
    </section>
  );
}
