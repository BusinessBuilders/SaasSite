import { SignIn } from '@clerk/nextjs';
import { getTranslations } from 'next-intl/server';

import { getI18nPath } from '@/utils/Helpers';

export async function generateMetadata(props: { params: { locale: string } }) {
  const t = await getTranslations({
    locale: props.params.locale,
    namespace: 'SignIn',
  });
  return {
    title: t('meta_title'),
    description: t('meta_description'),
  };
}

const SignInPage = (props: {
  params: { locale: string };
  searchParams?: { redirect_url?: string };
}) => {
  // Get the redirect URL
  const redirectUrl = props.searchParams?.redirect_url;

  // Create the sign-up URL with the same redirect
  const signUpUrl = redirectUrl
    ? `/sign-up?redirect_url=${redirectUrl}`
    : '/sign-up';

  // Clerk 5 removed the legacy `redirectUrl` prop. Use `forceRedirectUrl` so
  // a `?redirect_url=...` query param (set by BuyNowButton when an unauth
  // user clicks Buy Now) actually wins over the default dashboard redirect
  // after sign-in. `fallbackRedirectUrl` covers the no-query-param case.
  return (
    <SignIn
      path={getI18nPath('/sign-in', props.params.locale)}
      forceRedirectUrl={redirectUrl}
      fallbackRedirectUrl={getI18nPath('/dashboard', props.params.locale)}
      signUpUrl={signUpUrl}
    />
  );
};

export default SignInPage;
