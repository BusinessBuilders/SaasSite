import { unstable_setRequestLocale } from 'next-intl/server';

import { Footer } from '@/templates/Footer';
import { Navbar } from '@/templates/Navbar';
import {
  NvidiaAbout,
  NvidiaContact,
  NvidiaEve,
  NvidiaHero,
  NvidiaHowWeBuild,
  NvidiaScanning,
  NvidiaWhy,
} from '@/templates/nvidia/NvidiaSections';

// NVIDIA Inception repositioning — homepage leads as a private-AI company.
// Roll back via tag `pre-nvidia-rollback-2026-06-28`.
export function generateMetadata() {
  return {
    title: 'Business Builders — Private AI for Small Business, Hand-Built',
    description:
      'We build private, on-premise AI for small businesses — a local voice assistant (Eve), private document scanning, and automation — on machines we build and you own. Your data never leaves the building.',
  };
}

const IndexPage = (props: { params: { locale: string } }) => {
  unstable_setRequestLocale(props.params.locale);

  return (
    <>
      <Navbar />
      <NvidiaHero />
      <NvidiaScanning />
      <NvidiaEve />
      <NvidiaHowWeBuild />
      <NvidiaWhy />
      <NvidiaAbout />
      <NvidiaContact />
      <Footer />
    </>
  );
};

export default IndexPage;
