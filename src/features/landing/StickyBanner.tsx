export const StickyBanner = (props: { children: React.ReactNode }) => (
  <div className="sticky top-0 z-50 bg-primary p-4 text-center text-lg font-semibold text-primary-foreground [&_a:hover]:text-brand-gold [&_a]:text-brand-orange">
    {props.children}
  </div>
);
