'use client';

import { UserButton } from '@clerk/nextjs';
import { Menu } from 'lucide-react';
import { useState } from 'react';

import { LocaleSwitcher } from '@/components/LocaleSwitcher';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Sidebar } from '@/features/dashboard/Sidebar';

export const DashboardTopBar = () => {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex h-16 items-center justify-between border-b bg-background px-4 lg:px-6">
      <div className="lg:hidden">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="size-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0">
            <Sidebar />
          </SheetContent>
        </Sheet>
      </div>

      <div className="flex-1" />

      <div className="flex items-center gap-2">
        <ThemeToggle />
        <LocaleSwitcher />
        <UserButton
          userProfileMode="navigation"
          userProfileUrl="/dashboard/user-profile"
          appearance={{
            elements: {
              rootBox: 'px-2 py-1.5',
            },
          }}
        />
      </div>
    </div>
  );
};
