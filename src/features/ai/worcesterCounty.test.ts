import { describe, expect, it } from 'vitest';

import sitemap from '@/app/sitemap';
import { AppConfig } from '@/utils/AppConfig';

import { buildFaqJsonLd } from './content';
import {
  AUTOMATIONS,
  buildBreadcrumbJsonLd,
  buildServiceJsonLd,
  HOME_TOWN,
  INDUSTRY_EXAMPLES,
  SERVICE_AREAS,
  VOICE_AGENT_USES,
  WORCESTER_COUNTY_DESCRIPTION,
  WORCESTER_COUNTY_FAQ,
  WORCESTER_COUNTY_H1,
  WORCESTER_COUNTY_INTRO,
  WORCESTER_COUNTY_PATH,
  WORCESTER_COUNTY_TITLE,
  WORCESTER_COUNTY_URL,
} from './worcesterCounty';

// The towns William asked the page to serve — service areas, not offices.
const REQUIRED_TOWNS = [
  'Worcester',
  'Rutland',
  'Holden',
  'Sterling',
  'Barre',
  'Spencer',
  'Leicester',
  'Paxton',
  'West Boylston',
  'Shrewsbury',
  'Auburn',
  'Millbury',
  'Westborough',
  'Northborough',
  'Grafton',
];

const REQUIRED_QUESTIONS = [
  'What is AI automation?',
  'What is an AI voice agent?',
  'Can an AI agent answer business phone calls?',
  'Can it capture leads?',
  'Can AI automation work with my existing website or CRM?',
  'Do you provide AI automation in Worcester County?',
  'How much does AI automation cost?',
];

// What the live Atlas demo (src/features/atlas/content.ts) actually does. A
// new use added to the page without being added here fails the build — on
// purpose: the page must not promise what the demo cannot do.
const ATLAS_SUPPORTED_USES = [
  'Answering inbound calls',
  'Answering common questions',
  'Collecting lead information',
  'Qualifying inquiries',
  'Routing information to you',
  'Appointment and scheduling workflows, where configured',
  'After-hours call handling',
  'Fewer missed opportunities',
];

const REQUIRED_INDUSTRIES = [
  'Contractors',
  'Cleaning companies',
  'Landscapers',
  'Auto shops and detailers',
  'Real estate',
  'Fitness studios and gyms',
  'Retail shops',
  'Property management',
  'Bakeries and cafes',
  'Professional services',
];

describe('Worcester County page copy', () => {
  it('uses the agreed title and H1 and stays inside what Google displays', () => {
    expect(WORCESTER_COUNTY_TITLE).toBe('AI Automation Worcester County, MA | Business Builder');
    expect(WORCESTER_COUNTY_H1).toBe('AI Automation for Worcester County Small Businesses');
    expect(WORCESTER_COUNTY_TITLE.length).toBeLessThanOrEqual(65);
    expect(WORCESTER_COUNTY_DESCRIPTION.length).toBeLessThanOrEqual(160);
  });

  it('states the who/what/where up top', () => {
    expect(WORCESTER_COUNTY_INTRO).toContain('Business Builder provides AI automation and integration for small businesses throughout Worcester County and Central Massachusetts');
  });

  it('uses the singular brand name everywhere (matches the DBA certificate)', () => {
    const everything = JSON.stringify({
      WORCESTER_COUNTY_TITLE,
      WORCESTER_COUNTY_DESCRIPTION,
      WORCESTER_COUNTY_INTRO,
      AUTOMATIONS,
      VOICE_AGENT_USES,
      INDUSTRY_EXAMPLES,
      WORCESTER_COUNTY_FAQ,
      service: buildServiceJsonLd(),
    });

    expect(everything).not.toMatch(/Business Builders\b/);
  });

  it('lists every required town exactly once, with Rutland as the home base', () => {
    expect([...SERVICE_AREAS].sort()).toEqual([...REQUIRED_TOWNS].sort());
    expect(new Set(SERVICE_AREAS).size).toBe(SERVICE_AREAS.length);
    expect(HOME_TOWN).toBe('Rutland');
    expect(SERVICE_AREAS).toContain(HOME_TOWN);
  });

  it('covers the seven automation topics and ten trades William asked for', () => {
    const titles = AUTOMATIONS.map(a => a.title);

    expect(titles).toEqual([
      'Lead intake and follow-up',
      'CRM and workflow automation',
      'Email and SMS workflows',
      'Forms and document processing',
      'AI chatbots and knowledge assistants',
      'Connecting the software you already run',
    ]);
    expect(INDUSTRY_EXAMPLES.map(i => i.industry)).toEqual(REQUIRED_INDUSTRIES);
  });

  it('only claims voice-agent uses the Atlas demo supports', () => {
    expect(VOICE_AGENT_USES.map(u => u.title)).toEqual(ATLAS_SUPPORTED_USES);

    const text = JSON.stringify(VOICE_AGENT_USES).toLowerCase();

    // Atlas does not transfer live calls, text callers, or write to a CRM.
    expect(text).not.toMatch(/transfer|texts you|text you|writes to your crm/);
  });

  it('answers every required FAQ question', () => {
    const questions = WORCESTER_COUNTY_FAQ.map(f => f.question);
    for (const q of REQUIRED_QUESTIONS) {
      expect(questions).toContain(q);
    }
    for (const faq of WORCESTER_COUNTY_FAQ) {
      expect(faq.answer.length).toBeGreaterThan(40);
    }
  });

  it('names every service-area town in the Worcester County FAQ answer', () => {
    const answer = WORCESTER_COUNTY_FAQ.find(
      f => f.question === 'Do you provide AI automation in Worcester County?',
    )!.answer;
    for (const town of REQUIRED_TOWNS) {
      expect(answer).toContain(town);
    }
  });
});

describe('Worcester County structured data', () => {
  it('FAQPage mirrors the visible FAQ, question for question', () => {
    const schema = buildFaqJsonLd(WORCESTER_COUNTY_FAQ);

    expect(schema['@type']).toBe('FAQPage');
    expect(schema.mainEntity.map(q => q.name)).toEqual(
      WORCESTER_COUNTY_FAQ.map(f => f.question),
    );
    expect(schema.mainEntity.map(q => q.acceptedAnswer.text)).toEqual(
      WORCESTER_COUNTY_FAQ.map(f => f.answer),
    );
  });

  it('Service schema names the provider by the site-wide @id and serves the county and every town', () => {
    const service = buildServiceJsonLd();

    expect(service['@type']).toBe('Service');
    expect(service.url).toBe(WORCESTER_COUNTY_URL);
    expect(WORCESTER_COUNTY_URL).toBe(`${AppConfig.siteUrl}${WORCESTER_COUNTY_PATH}`);
    // Same @id as the ProfessionalService in src/app/[locale]/layout.tsx —
    // one organization, not a duplicate.
    expect(service.provider['@id']).toBe(AppConfig.siteUrl);
    expect(service.provider.name).toBe('Business Builder');
    expect(service.provider.telephone).toBe('+19787901002');
    expect(service.provider.address.addressLocality).toBe('Rutland');

    const areas = service.areaServed.map(a => a.name);

    expect(areas).toContain('Worcester County, Massachusetts');
    expect(areas).toContain('Central Massachusetts');

    for (const town of REQUIRED_TOWNS) {
      expect(areas).toContain(town);
    }
  });

  it('Service schema offers the discovery sprint at the visible price and points the voice agent at /atlas', () => {
    const service = buildServiceJsonLd();

    expect(service.offers.price).toBe('1500');
    expect(service.offers.priceCurrency).toBe('USD');

    const items = service.hasOfferCatalog.itemListElement.map(o => o.itemOffered);
    const voice = items.find(i => i.name === 'AI voice agents and AI receptionists');

    expect(voice && 'url' in voice ? voice.url : undefined).toBe(`${AppConfig.siteUrl}/atlas`);

    for (const automation of AUTOMATIONS) {
      expect(items.map(i => i.name)).toContain(automation.title);
    }
  });

  it('Breadcrumb walks Home → AI Automation → Worcester County', () => {
    const crumbs = buildBreadcrumbJsonLd().itemListElement;

    expect(crumbs.map(c => c.item)).toEqual([
      AppConfig.siteUrl,
      `${AppConfig.siteUrl}/ai-automation`,
      WORCESTER_COUNTY_URL,
    ]);
    expect(crumbs.map(c => c.position)).toEqual([1, 2, 3]);
  });
});

describe('sitemap', () => {
  it('lists the Worcester County page exactly once, at its canonical URL, with a lastModified date', () => {
    const entries = sitemap().filter(e => e.url === WORCESTER_COUNTY_URL);

    expect(entries).toHaveLength(1);
    expect(entries[0]!.lastModified).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    // No French twin: the page is English-only and /fr canonicalizes here.
    expect(sitemap().some(e => e.url.includes(`/fr${WORCESTER_COUNTY_PATH}`))).toBe(false);
  });

  it('keeps the voice-agent demo in the sitemap (it is meant to be indexed)', () => {
    expect(sitemap().some(e => e.url === `${AppConfig.siteUrl}/atlas`)).toBe(true);
  });
});
