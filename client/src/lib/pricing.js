// Client-side sample pricing. Mirrors SAMPLE_PRICES_CENTS in
// server/src/services/stripe.js so the cart can show live per-line and
// subtotal figures before the user hits Stripe. Keep the two in sync.

export const SAMPLE_PRICES_CENTS = {
  '2ml':  600,
  '5ml':  1200,
  '10ml': 2200,
  '30ml': 5500,
};

export function unitPriceCents(size) {
  return SAMPLE_PRICES_CENTS[size] ?? SAMPLE_PRICES_CENTS['5ml'];
}

// Lowest size price, used for "from $X" labels on cards / detail pages.
export const FROM_PRICE_CENTS = Math.min(...Object.values(SAMPLE_PRICES_CENTS));

export function formatMoney(cents, currency = 'USD') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: Number.isInteger(cents / 100) ? 0 : 2,
  }).format(cents / 100);
}

// Total cents for a cart-items array of { size, qty }.
export function cartSubtotalCents(items) {
  return items.reduce((sum, it) => sum + unitPriceCents(it.size) * it.qty, 0);
}
