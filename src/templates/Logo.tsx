import Image from 'next/image';

import { cn } from '@/utils/Helpers';

export const Logo = (props: {
  variant?: 'icon' | 'full';
  className?: string;
}) => {
  const variant = props.variant ?? 'icon';

  if (variant === 'full') {
    return (
      <div className={cn('relative h-14 w-[112px]', props.className)}>
        <Image
          src="/assets/images/logo-navbar.png"
          alt="Business Builder"
          fill
          className="object-contain"
          sizes="112px"
          priority
        />
      </div>
    );
  }

  return (
    <div className={cn('flex items-center gap-2', props.className)}>
      <Image
        src="/assets/images/logo-icon.png"
        alt="Business Builder"
        width={32}
        height={32}
        className="size-8"
        priority
      />
      <span className="text-lg font-semibold tracking-tight">
        Business Builder
      </span>
    </div>
  );
};
