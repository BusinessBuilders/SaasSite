import { cn } from '@/utils/Helpers';

export const Section = (props: {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  description?: string;
  className?: string;
  // Section titles are real headings so the page outline is visible to
  // Google and screen readers. Default h2; the page's main section passes h1.
  titleAs?: 'h1' | 'h2' | 'h3';
}) => {
  const TitleTag = props.titleAs ?? 'h2';

  return (
    <div className={cn('px-3 py-16', props.className)}>
      {(props.title || props.subtitle || props.description) && (
        <div className="mx-auto mb-12 max-w-screen-md text-center">
          {props.subtitle && (
            <p className="bg-gradient-to-r from-brand-gold via-brand-orange to-brand-rust bg-clip-text text-sm font-bold text-transparent">
              {props.subtitle}
            </p>
          )}

          {props.title && (
            <TitleTag className="mt-1 text-3xl font-bold">{props.title}</TitleTag>
          )}

          {props.description && (
            <p className="mt-2 text-lg text-muted-foreground">
              {props.description}
            </p>
          )}
        </div>
      )}

      <div className="mx-auto max-w-screen-lg">{props.children}</div>
    </div>
  );
};
