import { forwardRef } from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva } from 'class-variance-authority';
import { cn } from '../../lib/cn.js';

/**
 * shadcn-style Button, palette-mapped onto Scent Layer tokens directly.
 * (We don't carry the full shadcn CSS-variable theme, concrete classes are
 * less abstract but simpler to read against our existing CSS.)
 */
export const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap text-[0.7rem] font-medium tracking-[0.2em] uppercase transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 font-sans',
  {
    variants: {
      variant: {
        default:
          'bg-gold text-deep2 hover:bg-gold-light',
        destructive:
          'bg-[#c97070] text-cream hover:bg-[#d68080]',
        outline:
          'border border-cream/30 bg-transparent text-cream hover:border-gold hover:text-gold',
        secondary:
          'bg-cream text-ink hover:bg-warm-white',
        ghost:
          'bg-transparent text-cream hover:text-gold',
        link:
          'text-gold underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-10 px-5',
        sm: 'h-9 px-3',
        lg: 'h-12 px-8',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

export const Button = forwardRef(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = 'Button';
