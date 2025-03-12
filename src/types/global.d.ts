import type { OrgPermission, OrgRole } from '@/types/Auth';

// Use type safe message keys with `next-intl`
type Messages = typeof import('../locales/en.json');

// eslint-disable-next-line ts/consistent-type-definitions
declare interface IntlMessages extends Messages {}

declare global {
  // eslint-disable-next-line ts/consistent-type-definitions
  interface ClerkAuthorization {
    permission: OrgPermission;
    role: OrgRole;
  }
}
declare namespace JSX {
  type IntrinsicElements = {
    'elevenlabs-convai': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
  };
}
