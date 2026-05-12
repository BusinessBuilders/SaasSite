import Image from 'next/image';

import { cn } from '@/utils/Helpers';

export const Logo = (props: {
  variant?: 'default' | 'full';
  className?: string;
}) => {
  const variant = props.variant ?? 'default';

  if (variant === 'full') {
    return (
      <div className={cn('relative h-14 w-[112px]', props.className)}>
        <Image
          src="/assets/images/logo-navbar-light.png"
          alt="Business Builder"
          fill
          className="object-contain dark:hidden"
          sizes="112px"
          priority
        />
        <Image
          src="/assets/images/logo-navbar-dark.png"
          alt="Business Builder"
          fill
          className="hidden object-contain dark:block"
          sizes="112px"
          priority
        />
      </div>
    );
  }

  return (
    <div className={cn('relative h-10 w-[160px]', props.className)}>
      <Image
        src="/assets/images/logo-navbar-light.png"
        alt="Business Builder"
        fill
        className="object-contain dark:hidden"
        sizes="160px"
        priority
      />
      <Image
        src="/assets/images/logo-navbar-dark.png"
        alt="Business Builder"
        fill
        className="hidden object-contain dark:block"
        sizes="160px"
        priority
      />
    </div>
  );
};
