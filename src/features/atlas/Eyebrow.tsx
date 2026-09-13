// src/features/atlas/Eyebrow.tsx — the brand's "/// LABEL ///" section eyebrow.
//
// The slashes live here rather than in the page markup on purpose: written
// inline as JSX text they read to ESLint as a stray `//` comment
// (react/no-comment-textnodes), and the fix is a component, not a disabled
// rule. Built from a template literal, so there is no text node to misread.
import { cn } from '@/utils/Helpers';

type Props = {
  /** The label itself, without slashes — they are added here. */
  children: string;
  className?: string;
};

export const Eyebrow = ({ children, className }: Props) => (
  <p className={cn('bb-eyebrow', className)}>{`/// ${children} ///`}</p>
);
