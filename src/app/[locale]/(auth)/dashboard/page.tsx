import { currentUser } from '@clerk/nextjs/server';
import { eq } from 'drizzle-orm';
import {
  CreditCard,
  ExternalLink,
  Globe,
  PenTool,
  Share2,
  Sparkles,
  Zap,
} from 'lucide-react';
import Link from 'next/link';

import { buttonVariants } from '@/components/ui/buttonVariants';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { db } from '@/libs/DB';
import { organizationSchema } from '@/models/Schema';
import { cn } from '@/utils/Helpers';

const DashboardIndexPage = async () => {
  const user = await currentUser();
  const userId = user?.id || '';
  const firstName = user?.firstName || 'there';

  // Get org/subscription data
  const orgData = await db
    .select()
    .from(organizationSchema)
    .where(eq(organizationSchema.id, userId));

  const org = orgData[0];
  const plan = org?.plan || 'free';
  const status = org?.subscriptionStatus || 'free';
  const tokens = org?.tokenBalance ?? 100;
  const isPaid = plan !== 'free';

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          {`Welcome back, ${firstName}`}
        </h1>
        <p className="text-muted-foreground">
          Here&apos;s what&apos;s happening with your business today.
        </p>
      </div>

      {/* Upgrade banner for free users */}
      {!isPaid && (
        <Card className="border-brand-orange/50 bg-gradient-to-r from-brand-orange/10 to-brand-gold/10">
          <CardContent className="flex items-center justify-between p-6">
            <div className="flex items-center gap-3">
              <Zap className="size-8 text-brand-orange" />
              <div>
                <p className="font-semibold">Upgrade to unlock all features</p>
                <p className="text-sm text-muted-foreground">
                  Get more AI tokens, social platforms, and a custom domain.
                </p>
              </div>
            </div>
            <Link
              href="/pricing"
              className={cn(buttonVariants({ size: 'lg' }), 'bg-brand-orange hover:bg-brand-orange-hover')}
            >
              View Plans
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Stats cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Current Plan</CardTitle>
            <CreditCard className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize">{plan}</div>
            <p className="text-xs text-muted-foreground">
              {status === 'active' ? 'Active subscription' : status === 'past_due' ? 'Payment past due' : 'Free tier'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">AI Tokens</CardTitle>
            <Sparkles className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tokens.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Tokens remaining this month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Billing</CardTitle>
            <CreditCard className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isPaid ? 'Active' : 'Free'}
            </div>
            <Link href="/dashboard/billing" className="text-xs text-brand-teal hover:underline">
              Manage billing →
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Quick actions */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Globe className="size-5" />
              My Website
            </CardTitle>
            <CardDescription>Edit and manage your business website</CardDescription>
          </CardHeader>
          <CardContent>
            <a
              href="https://business-builder.online"
              target="_blank"
              rel="noopener noreferrer"
              className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'w-full')}
            >
              Edit Website
              <ExternalLink className="ml-2 size-3" />
            </a>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Share2 className="size-5" />
              Social Media
            </CardTitle>
            <CardDescription>Schedule posts and manage accounts</CardDescription>
          </CardHeader>
          <CardContent>
            <a
              href="https://social.business-builder.online"
              target="_blank"
              rel="noopener noreferrer"
              className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'w-full')}
            >
              Manage Social
              <ExternalLink className="ml-2 size-3" />
            </a>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <PenTool className="size-5" />
              Blog
            </CardTitle>
            <CardDescription>Write and publish blog posts</CardDescription>
          </CardHeader>
          <CardContent>
            <a
              href="/blog/ghost"
              target="_blank"
              rel="noopener noreferrer"
              className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'w-full')}
            >
              Write a Post
              <ExternalLink className="ml-2 size-3" />
            </a>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DashboardIndexPage;
