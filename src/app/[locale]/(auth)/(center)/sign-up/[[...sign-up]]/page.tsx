import { SignUp } from '@clerk/nextjs';
import { getTranslations } from 'next-intl/server';

import { getI18nPath } from '@/utils/Helpers';

export async function generateMetadata(props: { params: { locale: string } }) {
  const t = await getTranslations({
    locale: props.params.locale,
    namespace: 'SignUp',
  });
  return {
    title: t('meta_title'),
    description: t('meta_description'),
  };
}

const SignUpPage = (props: {
  params: { locale: string };
  searchParams?: { redirect_url?: string };
}) => {
  // Get the redirect URL
  const redirectUrl = props.searchParams?.redirect_url;

  // Create the sign-in URL with the same redirect
  const signInUrl = redirectUrl
    ? `/sign-in?redirect_url=${redirectUrl}`
    : '/sign-in';

  // Instead of using redirectUrl directly, sanitize it first
  // This helps prevent issues with special characters in URLs during SSR
  const safeRedirectUrl = redirectUrl && typeof redirectUrl === 'string'
    ? decodeURIComponent(redirectUrl) // Decode once to handle any encoding issues
    : undefined;

  return (
    <SignUp
      path={getI18nPath('/sign-up', props.params.locale)}
      redirectUrl={safeRedirectUrl}
      signInUrl={signInUrl}
      afterSignUpUrl={safeRedirectUrl} // Use the sanitized URL here too
    />
  );
};

export default SignUpPage;
