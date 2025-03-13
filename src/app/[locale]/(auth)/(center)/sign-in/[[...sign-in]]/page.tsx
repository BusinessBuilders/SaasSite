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

  return (
    <SignIn
      path={getI18nPath('/sign-in', props.params.locale)}
      redirectUrl={redirectUrl}
      signUpUrl={signUpUrl}
    />
  );
};

export default SignInPage;
