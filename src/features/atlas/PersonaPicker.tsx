'use client';
// src/features/atlas/PersonaPicker.tsx — which business Atlas answers as.
// A real radio group: arrow keys move the selection, one tab stop for the
// whole set, and every card says out loud whether the business is a sample or
// the visitor's own, so nobody mistakes "Maple Street Landscaping" for a client.
import { useRef } from 'react';

import type { AtlasPersona } from '@/app/api/atlas/session/schema';

import { trackAtlas } from './analytics';
import { ATLAS_PERSONAS } from './content';

type Props = {
  value: AtlasPersona;
  onChange: (persona: AtlasPersona) => void;
  /** Locks the picker while a session is being set up or is running. */
  disabled?: boolean;
};

export const PersonaPicker = ({ value, onChange, disabled = false }: Props) => {
  const ref = useRef<HTMLDivElement>(null);

  const select = (persona: AtlasPersona) => {
    onChange(persona);
    trackAtlas('atlas_persona_selected', { persona });
  };

  // Roving focus: ← ↑ / → ↓ move to the neighbouring card and select it, which
  // is what a screen-reader user expects from role="radiogroup". The handler
  // lives on the radios, not the group, so the group itself never needs to be
  // a tab stop.
  const onKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    const step = { ArrowLeft: -1, ArrowUp: -1, ArrowRight: 1, ArrowDown: 1 }[event.key];
    if (step === undefined || disabled) {
      return;
    }
    event.preventDefault();
    const at = ATLAS_PERSONAS.findIndex(p => p.key === value);
    const next = ATLAS_PERSONAS[(at + step + ATLAS_PERSONAS.length) % ATLAS_PERSONAS.length];
    if (!next) {
      return;
    }
    select(next.key);
    ref.current?.querySelector<HTMLButtonElement>(`[data-persona="${next.key}"]`)?.focus();
  };

  return (
    <div
      ref={ref}
      role="radiogroup"
      aria-label="Which business should Atlas answer as?"
      className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4"
    >
      {ATLAS_PERSONAS.map((persona) => {
        const checked = persona.key === value;
        return (
          <button
            key={persona.key}
            type="button"
            role="radio"
            aria-checked={checked}
            data-persona={persona.key}
            tabIndex={checked ? 0 : -1}
            disabled={disabled}
            onClick={() => select(persona.key)}
            onKeyDown={onKeyDown}
            className="rounded-md border-2 p-2.5 text-left transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bb-cream disabled:cursor-not-allowed disabled:opacity-60 sm:p-3"
            style={{
              borderColor: checked ? 'var(--bb-orange)' : 'var(--bb-border-hair)',
              background: checked ? 'var(--bb-umber)' : 'var(--bb-bg-elevated)',
            }}
          >
            <span
              className="block text-[13px] font-bold leading-tight sm:text-sm sm:leading-snug"
              style={{ color: checked ? 'var(--bb-cream-bright)' : 'var(--bb-cream)' }}
            >
              {persona.title}
            </span>
            <span
              className="mt-1 block text-[11px] leading-snug sm:text-xs"
              style={{ color: 'var(--bb-fg-muted)' }}
            >
              {persona.tagline}
            </span>
            <span
              className="mt-1.5 block text-[10px] leading-snug sm:mt-2 sm:text-[11px]"
              style={{ color: 'var(--bb-fg-subtle)' }}
            >
              {persona.sample ? `Sample business: ${persona.sample}` : 'Uses only what you tell it'}
            </span>
          </button>
        );
      })}
    </div>
  );
};
