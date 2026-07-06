import { motion, useReducedMotion } from 'framer-motion';
import { ShoppingCart } from 'lucide-react';
import { buttonVariants } from './Button.jsx';
import { ScentTile } from '../ScentTile.jsx';
import { cn } from '../../lib/cn.js';

/**
 * 21st.dev-style hover-reveal product card, adapted for fragrance.
 *
 * Removed from the generic template:
 *   - star rating + review count   (no review system on Scent Layer yet)
 *   - discount %   (no prices yet)
 *   - Heart favorite button   (conflicts with the typographic ♡ wishlist
 *     already on every other product card)
 *
 * Added:
 *   - Brand pre-title in the corner badge
 *   - Family + season chips inside the reveal overlay
 *   - "Order Sample" → opens SampleModal
 *   - "Source Full Bottle" → opens SourceModal
 */
export function ProductRevealCard({
  fragrance,
  image,
  description,
  onOrderSample,
  onSourceBottle,
  enableAnimations = true,
  className,
}) {
  const shouldReduceMotion = useReducedMotion();
  const shouldAnimate = enableAnimations && !shouldReduceMotion;

  const containerVariants = {
    rest: { scale: 1, y: 0 },
    hover: shouldAnimate
      ? { scale: 1.02, y: -6, transition: { type: 'spring', stiffness: 300, damping: 30, mass: 0.8 } }
      : {},
  };

  const imageVariants = {
    rest: { scale: 1 },
    hover: shouldAnimate ? { scale: 1.08 } : {},
  };

  const overlayVariants = {
    rest: { y: '100%', opacity: 0 },
    hover: {
      y: '0%',
      opacity: 1,
      transition: {
        type: 'spring',
        stiffness: 400,
        damping: 28,
        mass: 0.6,
        staggerChildren: 0.08,
        delayChildren: 0.05,
      },
    },
  };

  const contentVariants = {
    rest: { opacity: 0, y: 16 },
    hover: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 400, damping: 25 } },
  };

  const notes = [fragrance.top, fragrance.heart, fragrance.base].filter(Boolean);
  const seasonText = (fragrance.season ?? []).join(' · ');
  const description_ = description ?? notes.join(' → ');

  return (
    <motion.div
      initial="rest"
      whileHover="hover"
      animate="rest"
      variants={containerVariants}
      className={cn(
        'relative w-full overflow-hidden cursor-none',
        'bg-deep border border-gold/20',
        'shadow-[0_24px_60px_-20px_rgba(0,0,0,0.6)]',
        className,
      )}
    >
      {/* Visual: photo when provided, ScentTile placeholder otherwise
          (product photography is removed in the commerce restyle). */}
      <div className="relative overflow-hidden">
        {image ? (
          <motion.img
            src={image}
            alt={fragrance.name}
            className="h-72 w-full object-cover"
            variants={imageVariants}
            transition={{ type: 'spring', stiffness: 280, damping: 30 }}
          />
        ) : (
          <motion.div
            className="h-72 w-full"
            variants={imageVariants}
            transition={{ type: 'spring', stiffness: 280, damping: 30 }}
          >
            <ScentTile fragrance={fragrance} showInitial={false} />
          </motion.div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-deep2/80 via-deep2/10 to-transparent" />

        {/* Brand badge */}
        <div className="absolute top-4 left-4 bg-deep2/85 backdrop-blur-sm text-gold px-3 py-1 border border-gold/30 text-[0.55rem] tracking-[0.22em] uppercase">
          {fragrance.brand}
        </div>

        {/* Family badge */}
        {fragrance.family && (
          <div className="absolute top-4 right-4 bg-gold/90 text-deep2 px-3 py-1 text-[0.55rem] tracking-[0.18em] uppercase font-medium">
            {fragrance.family}
          </div>
        )}
      </div>

      {/* Always-visible footer */}
      <div className="p-7 space-y-3 bg-deep2">
        <h3 className="font-serif text-2xl font-light leading-tight text-cream">
          {fragrance.name}
        </h3>
        {seasonText && (
          <p className="text-[0.62rem] tracking-[0.2em] uppercase text-taupe">{seasonText}</p>
        )}
      </div>

      {/* Reveal overlay */}
      <motion.div
        variants={overlayVariants}
        className="absolute inset-0 bg-deep2/95 backdrop-blur-xl flex flex-col justify-end"
      >
        <div className="p-7 space-y-5">
          <motion.div variants={contentVariants}>
            <p className="text-[0.58rem] tracking-[0.28em] uppercase text-gold mb-2">The Composition</p>
            <p className="text-[0.78rem] leading-[1.85] text-cream/65">{description_}</p>
          </motion.div>

          <motion.div variants={contentVariants} className="grid grid-cols-3 gap-2 text-[0.6rem]">
            <Chip label="Top"   value={fragrance.top} />
            <Chip label="Heart" value={fragrance.heart} />
            <Chip label="Base"  value={fragrance.base} />
          </motion.div>

          <motion.div variants={contentVariants} className="space-y-2 pt-2">
            <button
              type="button"
              onClick={onOrderSample}
              className={cn(buttonVariants({ variant: 'default' }), 'w-full h-12')}
            >
              <ShoppingCart className="w-3.5 h-3.5 mr-2" strokeWidth={1.5} />
              Order Sample
            </button>
            <button
              type="button"
              onClick={onSourceBottle}
              className={cn(buttonVariants({ variant: 'outline' }), 'w-full h-10')}
            >
              Source Full Bottle
            </button>
          </motion.div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function Chip({ label, value }) {
  if (!value) return <div />;
  return (
    <div className="bg-white/[0.04] border border-gold/15 px-2 py-2 text-center">
      <div className="text-[0.5rem] tracking-[0.2em] uppercase text-taupe mb-1">{label}</div>
      <div className="font-serif text-[0.82rem] text-cream leading-tight">{value}</div>
    </div>
  );
}
