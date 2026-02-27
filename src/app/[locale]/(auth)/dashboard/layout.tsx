import { getTranslations } from 'next-intl/server';

import { DashboardTopBar } from '@/features/dashboard/DashboardTopBar';
import { Sidebar } from '@/features/dashboard/Sidebar';

export async function generateMetadata(props: { params: { locale: string } }) {
  const t = await getTranslations({
    locale: props.params.locale,
    namespace: 'Dashboard',
  });

  return {
    title: t('meta_title'),
    description: t('meta_description'),
  };
}

export default function DashboardLayout(props: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar — hidden on mobile, shown on lg+ */}
      <div className="hidden w-64 shrink-0 lg:block">
        <Sidebar className="h-full" />
      </div>

      {/* Main content area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <DashboardTopBar />

        <main className="flex-1 overflow-y-auto bg-muted">
          <div className="mx-auto max-w-screen-xl px-4 py-6 lg:px-8">
            {props.children}
          </div>
        </main>
      </div>
    </div>
  );
}

export const dynamic = 'force-dynamic';
