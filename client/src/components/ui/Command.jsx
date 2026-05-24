import { forwardRef } from 'react';
import { Command as CommandPrimitive } from 'cmdk';
import { cn } from '../../lib/cn.js';

/**
 * shadcn-style Command primitive built on cmdk. Tailwind-classed but using the
 * Scent Layer palette tokens defined in tailwind.config.js so it sits visually
 * inside the dark editorial design system.
 */

export const Command = forwardRef(({ className, ...props }, ref) => (
  <CommandPrimitive
    ref={ref}
    // Note: NO `overflow-hidden` here, it would clip the absolutely
    // positioned CommandList dropdown out of view when callers position
    // it with `absolute top-full`.
    className={cn('flex w-full flex-col text-cream', className)}
    {...props}
  />
));
Command.displayName = 'Command';

export const CommandInput = forwardRef(({ className, ...props }, ref) => (
  <CommandPrimitive.Input
    ref={ref}
    className={cn(
      "w-full bg-white/5 border border-gold/20 text-cream font-sans text-[0.83rem] px-4 py-3 outline-none transition-colors focus:border-gold placeholder:text-cream/30",
      className,
    )}
    {...props}
  />
));
CommandInput.displayName = 'CommandInput';

export const CommandList = forwardRef(({ className, ...props }, ref) => (
  <CommandPrimitive.List
    ref={ref}
    className={cn('max-h-[220px] overflow-y-auto', className)}
    {...props}
  />
));
CommandList.displayName = 'CommandList';

export const CommandEmpty = forwardRef(({ className, ...props }, ref) => (
  <CommandPrimitive.Empty
    ref={ref}
    className={cn('px-4 py-3 text-[0.72rem] text-cream/40 italic font-serif', className)}
    {...props}
  />
));
CommandEmpty.displayName = 'CommandEmpty';

export const CommandGroup = forwardRef(({ className, ...props }, ref) => (
  <CommandPrimitive.Group
    ref={ref}
    className={cn('overflow-hidden', className)}
    {...props}
  />
));
CommandGroup.displayName = 'CommandGroup';

export const CommandItem = forwardRef(({ className, ...props }, ref) => (
  <CommandPrimitive.Item
    ref={ref}
    className={cn(
      "flex items-center justify-between gap-3 px-4 py-2.5 text-[0.78rem] cursor-none border-b border-white/[0.04] last:border-b-0",
      "data-[selected=true]:bg-gold/10 data-[selected=true]:text-gold",
      "aria-selected:bg-gold/10 aria-selected:text-gold",
      className,
    )}
    {...props}
  />
));
CommandItem.displayName = 'CommandItem';
