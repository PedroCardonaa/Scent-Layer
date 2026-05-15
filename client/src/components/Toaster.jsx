import { Toaster as SonnerToaster } from 'sonner';

/**
 * Branded Sonner toaster: stacks toasts, dark editorial card, gold accent on <span>.
 * Mounted once at the App root. Callers fire toasts via `useApp().showToast(msg)`
 * or by importing `toast` from 'sonner' directly.
 */
export function Toaster() {
  return (
    <SonnerToaster
      position="bottom-center"
      duration={2800}
      visibleToasts={3}
      gap={8}
      offset={32}
      toastOptions={{
        unstyled: true,
        classNames: {
          toast:
            'flex items-center gap-3 px-6 py-3 bg-deep2 text-cream font-sans text-[0.72rem] border border-gold/30 shadow-[0_8px_32px_rgba(0,0,0,0.35)] animate-fade-up [&_span]:text-gold',
          title: 'leading-snug',
        },
      }}
    />
  );
}
