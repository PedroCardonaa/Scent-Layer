import Stripe from 'stripe';

const apiKey = process.env.STRIPE_SECRET_KEY;
if (!apiKey) console.warn('[stripe] STRIPE_SECRET_KEY not set, checkout will return 503');

export const stripe = apiKey
  ? new Stripe(apiKey, { apiVersion: '2024-12-18.acacia' })
  : null;

export const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

// Per-size USD price in cents. Tune as needed; matches the cart's
// existing sample sizes. The cart UI displays totals derived from
// these numbers, so update both when changing prices.
export const SAMPLE_PRICES_CENTS = {
  '2ml':  600,
  '5ml':  1200,
  '10ml': 2200,
  '30ml': 5500,
};

/**
 * Compute the unit price (cents) for a cart line item. Falls back
 * to the 5ml price if the size string isn't recognized.
 */
export function unitPriceFor(size) {
  return SAMPLE_PRICES_CENTS[size] ?? SAMPLE_PRICES_CENTS['5ml'];
}
