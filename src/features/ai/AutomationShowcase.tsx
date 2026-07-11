'use client';

import { useRef } from 'react';

import { gsap, useGSAP } from '@/libs/gsap';

/**
 * Hero panel for /ai-automation: a "job board" of three illustrative
 * automations. GSAP staggers the tickets in, then cycles a gentle focus
 * across them. Reduced-motion visitors see all three tickets, static.
 */

type Job = {
  tag: string;
  input: string;
  steps: string[];
  dotClass: string;
  tagClass: string;
};

const JOBS: Job[] = [
  {
    tag: 'CUSTOMER QUESTION · 9:48 PM',
    input: '“Do you service my model? It’s a 2019.”',
    steps: [
      'Answer pulled from your service manual',
      'Source cited in the reply',
      'Callback booked for the morning',
    ],
    dotClass: 'bg-bb-orange',
    tagClass: 'text-bb-orange',
  },
  {
    tag: 'NEW LEAD · 2:14 AM',
    input: 'Website form — kitchen remodel, full details',
    steps: [
      'Qualified against your criteria',
      'Follow-up drafted for your review',
      'On your board before you open',
    ],
    dotClass: 'bg-bb-teal-soft',
    tagClass: 'text-bb-teal-soft',
  },
  {
    tag: 'PAPERWORK · INBOX',
    input: 'Supplier invoice PDF hits your email',
    steps: [
      'Line items read and checked',
      'Extracted into your records',
      'Filed where your bookkeeper looks',
    ],
    dotClass: 'bg-bb-brick',
    tagClass: 'text-bb-brick',
  },
];

export const AutomationShowcase = () => {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        const tickets = gsap.utils.toArray<HTMLElement>('[data-ticket]');

        gsap.from(tickets, {
          y: 20,
          opacity: 0,
          duration: 0.6,
          ease: 'power3.out',
          stagger: 0.12,
          scrollTrigger: { trigger: ref.current, start: 'top 85%' },
        });

        // Perpetual focus cycle: one ticket "worked on" at a time.
        const tl = gsap.timeline({ repeat: -1, delay: 1.6 });
        tickets.forEach((ticket) => {
          const others = tickets.filter(t => t !== ticket);
          tl.to(ticket, {
            opacity: 1,
            x: 6,
            duration: 0.35,
            ease: 'power2.out',
          })
            .to(
              others,
              { opacity: 0.45, x: 0, duration: 0.35, ease: 'power2.out' },
              '<',
            )
            .to({}, { duration: 2.4 });
        });
      });
    },
    { scope: ref },
  );

  return (
    <div
      ref={ref}
      className="rounded-lg border border-[color:var(--bb-border-soft)] bg-bb-black-soft p-5 md:p-6"
      role="group"
      aria-label="Examples of automations we build"
    >
      <div className="mb-4 flex items-center justify-between font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-bb-dust">
        <span>/// On the bench tonight</span>
        <span className="flex items-center gap-2 text-bb-cream">
          <span
            className="size-2 animate-pulse rounded-full bg-bb-orange motion-reduce:animate-none"
            aria-hidden
          />
          Working
        </span>
      </div>

      <div className="flex flex-col gap-3">
        {JOBS.map(job => (
          <article
            key={job.tag}
            data-ticket
            className="rounded-md border border-[color:var(--bb-border-hair)] bg-bb-black-warm p-4"
          >
            <div
              className={`flex items-center gap-2 font-mono text-[11px] font-semibold uppercase tracking-[0.14em] ${job.tagClass}`}
            >
              <span
                className={`size-1.5 rounded-full ${job.dotClass}`}
                aria-hidden
              />
              {job.tag}
            </div>
            <p className="mt-2 text-sm font-semibold text-bb-cream">
              {job.input}
            </p>
            <ul className="mt-3 flex flex-col gap-1.5">
              {job.steps.map(step => (
                <li
                  key={step}
                  className="flex items-start gap-2 text-sm text-bb-taupe"
                >
                  <span aria-hidden className="mt-px text-bb-dust">
                    ◆
                  </span>
                  {step}
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </div>
  );
};
