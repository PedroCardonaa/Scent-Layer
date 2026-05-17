import { Link } from 'react-router-dom';
import { Nav } from '../components/Nav.jsx';
import { Footer } from '../components/Footer.jsx';
import { useDocumentMeta } from '../lib/seo.js';

/**
 * Two simple legal pages. Content is intentionally plain — no boilerplate
 * legalese, no fake confidence. These are starting points; have an actual
 * lawyer review before relying on them past a soft launch.
 */

export function PrivacyPage() {
  useDocumentMeta({
    title: 'Privacy',
    description: 'How Scent Layer collects, uses, and protects the information you share with us.',
  });
  return (
    <>
      <Nav />
      <article className="legal-page">
        <p className="legal-eyebrow">Privacy Policy</p>
        <h1 className="legal-title">What we collect and<br/><em>what we don't.</em></h1>
        <p className="legal-effective">Last updated: 2026</p>

        <Section title="Short version">
          <p>We collect the minimum data needed to run a sampling and sourcing business: your name and email when you order a sample or request a bottle, your wishlist when you create an account, anonymous usage analytics if you opt in. We don't sell your data to anyone. Ever.</p>
        </Section>

        <Section title="Account data">
          <p>If you create a Scent Layer account, we store your email address and a one-way hash of your password. We use that to authenticate you and to associate your wishlist and quiz result with your profile. You can delete your account at any time by emailing us; we'll remove your personal data within 30 days.</p>
        </Section>

        <Section title="Order data">
          <p>When you place a sample order or sourcing request, we save your name, email, the fragrance and size you requested, and any message you included. We use this to fulfill the order. We share your name and shipping address with the carrier when we ship. We don't share order data with the fragrance houses, retailers, or any other third party.</p>
        </Section>

        <Section title="Cookies and analytics">
          <p>We use Google Analytics to understand which fragrances and tools resonate. GA drops cookies on your device only if you've explicitly accepted the consent banner — decline and nothing about you is recorded. IP addresses are anonymized in transit. You can revoke consent at any time by clearing the <code>sl_analytics_consent</code> entry in your browser's storage; we'll show the banner again on your next visit.</p>
          <p>We also use minimal first-party storage (<code>localStorage</code>) for your theme preference, wishlist for guests, and visit count. None of that leaves your browser.</p>
        </Section>

        <Section title="Email">
          <p>We send transactional email (order confirmations, sourcing replies) through Resend. If you join a waitlist, you'll get one email when we launch. We don't run continuous marketing nurture sequences without explicit subscription, and there's an unsubscribe link in every email we send.</p>
        </Section>

        <Section title="Third parties">
          <p>The services we rely on:</p>
          <ul className="legal-list">
            <li><strong>Anthropic</strong> — powers the AI features (Layer Builder, Similar Scents, Quiz, Compare). Your queries to those features are sent to Anthropic for processing. They do not store the content for training.</li>
            <li><strong>Resend</strong> — sends transactional email on our behalf.</li>
            <li><strong>Google Analytics</strong> — only if you've opted in via the cookie banner.</li>
            <li><strong>Vercel and Railway</strong> — host the site and backend respectively.</li>
            <li><strong>Sentry</strong> — captures application errors for debugging. No personal data is included in error reports.</li>
          </ul>
        </Section>

        <Section title="Your rights">
          <p>If you live in a jurisdiction that grants you rights over your personal data (GDPR, CCPA, etc.), those rights apply here. Email <a href="mailto:scentlayer@gmail.com">scentlayer@gmail.com</a> to request a copy of what we hold about you, to correct it, or to delete it. We'll respond within 30 days.</p>
        </Section>

        <Section title="Changes">
          <p>If we materially change how we handle your data, we'll update this page and notify anyone with a Scent Layer account by email. Trivial wording fixes won't trigger a notification.</p>
        </Section>

        <Section title="Contact">
          <p>Questions about anything on this page: <a href="mailto:scentlayer@gmail.com">scentlayer@gmail.com</a>.</p>
        </Section>

        <p className="legal-back"><Link to="/">← Back to home</Link></p>
      </article>
      <Footer />
    </>
  );
}

export function TermsPage() {
  useDocumentMeta({
    title: 'Terms',
    description: 'The terms governing your use of Scent Layer and any orders you place with us.',
  });
  return (
    <>
      <Nav />
      <article className="legal-page">
        <p className="legal-eyebrow">Terms of Service</p>
        <h1 className="legal-title">The rules of<br/><em>using Scent Layer.</em></h1>
        <p className="legal-effective">Last updated: 2026</p>

        <Section title="Using the site">
          <p>You're welcome to browse, sample, and source through Scent Layer. By using the site you agree to use it for personal, lawful purposes — not for resale, scraping, automated abuse of the AI endpoints, or anything that interferes with other users' experience. We may revoke access if you violate these terms.</p>
        </Section>

        <Section title="What we sell">
          <p>Samples are decanted by Scent Layer from full-size, authenticated bottles into clean glass atomizers in sizes of 2ml, 5ml, 10ml, or 30ml. We are not the original manufacturer of the fragrance — we are a sampler and concierge sourcing service. Brand names and fragrance names are trademarks of their respective owners and used here solely to identify the products you may sample or source.</p>
          <p>Full-bottle sourcing is a concierge service: you tell us what you want, we source it through our supplier network, we confirm pricing with you before any bottle is purchased on your behalf, and we authenticate every bottle before it ships.</p>
        </Section>

        <Section title="Pricing and payment">
          <p>Sample prices are fixed at the size you select at order time. Full-bottle sourcing prices vary by current market availability and are quoted in writing before purchase. You're under no obligation to accept a quote.</p>
          <p>Until payment integration is live, sample orders are processed as requests — we'll confirm pricing and arrange payment manually within 24 hours. Once payment is wired in, prices on the site are what you pay.</p>
        </Section>

        <Section title="Shipping">
          <p>Orders ship within one week of payment, usually faster. We use protective packaging and provide tracking. Shipping cost depends on destination and order size, calculated at checkout (or quoted with the order when checkout isn't yet live).</p>
        </Section>

        <Section title="Returns and refunds">
          <p>Decanted samples cannot be returned once opened, for hygiene reasons. Unopened full-size bottles may be returned within 14 days of delivery for a refund, less shipping. If you receive a bottle or sample that turns out to be inauthentic, contact us — we will refund or replace it. This authenticity guarantee is the foundation of the business; if we ever fall short of it, we make it right.</p>
        </Section>

        <Section title="Fragrance and skin">
          <p>Fragrance ingredients can cause allergic reactions in a small percentage of users. Before applying any fragrance broadly, test on a small skin area and wait 24 hours. We are not liable for individual allergic responses to fragrance ingredients. If you have known fragrance allergies, please disclose them in your order notes.</p>
        </Section>

        <Section title="No fragrance house affiliation">
          <p>Scent Layer is independent. We are not sponsored, endorsed, affiliated with, or licensed by any of the fragrance houses whose products we sample or source. References to brand names are nominative and used to identify the products you may want.</p>
        </Section>

        <Section title="Liability">
          <p>Scent Layer's total liability for any claim related to an order is limited to the amount you paid for that order. We don't accept liability for indirect, incidental, or consequential losses — including loss of opportunity, loss of enjoyment, etc.</p>
        </Section>

        <Section title="Changes to these terms">
          <p>We may update these terms. The "last updated" date will change, and material changes will be communicated by email to anyone with an account. Continued use of the site after a change means you accept the updated terms.</p>
        </Section>

        <Section title="Contact">
          <p>Questions, returns, complaints, or anything else: <a href="mailto:scentlayer@gmail.com">scentlayer@gmail.com</a>.</p>
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
      <h2 className="legal-h2">{title}</h2>
      {children}
    </section>
  );
}
