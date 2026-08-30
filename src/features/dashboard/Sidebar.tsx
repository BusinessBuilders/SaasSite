'use client';

import {
  CreditCard,
  ExternalLink,
  Globe,
  LayoutDashboard,
  PenTool,
  Settings,
  Share2,
  Sparkles,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { ScrollArea } from '@/components/ui/scroll-area';
import { Logo } from '@/templates/Logo';
import { cn } from '@/utils/Helpers';

type NavItem = {
  href: string;
  label: string;
  icon: React.ReactNode;
  external?: boolean;
};

const navItems: NavItem[] = [
  {
    href: '/dashboard',
    label: 'Overview',
    icon: <LayoutDashboard className="size-5" />,
  },
  {
    href: 'https://business-builder.online',
    label: 'My Website',
    icon: <Globe className="size-5" />,
    external: true,
  },
  {
    href: 'https://social.business-builder.online',
    label: 'Social Media',
    icon: <Share2 className="size-5" />,
    external: true,
  },
  {
    href: '/blog',
    label: 'Blog',
    icon: <PenTool className="size-5" />,
    external: true,
  },
  {
    href: '/dashboard/ai-tools',
    label: 'AI Tools',
    icon: <Sparkles className="size-5" />,
  },
  {
    href: '/dashboard/billing',
    label: 'Billing',
    icon: <CreditCard className="size-5" />,
  },
  {
    href: '/dashboard/user-profile',
    label: 'Settings',
    icon: <Settings className="size-5" />,
  },
];

export const Sidebar = ({ className }: { className?: string }) => {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard' || pathname === '/en/dashboard';
    }
    return pathname.includes(href.replace('/dashboard', ''));
  };

  return (
    <div className={cn('flex h-full flex-col border-r bg-background', className)}>
      <div className="flex h-16 items-center border-b px-6">
        <Link href="/dashboard">
          <Logo />
        </Link>
      </div>

      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="flex flex-col gap-1">
          {navItems.map(item => (
            item.external
              ? (
                  <a
                    key={item.href}
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                  >
                    {item.icon}
                    {item.label}
                    <ExternalLink className="ml-auto size-3 opacity-50" />
                  </a>
                )
              : (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                      isActive(item.href)
                        ? 'bg-accent text-accent-foreground font-medium'
                        : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                    )}
                  >
                    {item.icon}
                    {item.label}
                  </Link>
                )
          ))}
        </nav>
      </ScrollArea>
    </div>
  );
};
