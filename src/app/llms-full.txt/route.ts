// /llms-full.txt — the whole marketing offer as one plain-text document for
// AI assistants and their crawlers (the companion to public/llms.txt, which
// is the short index). See https://llmstxt.org.
//
// Nothing here is typed by hand: every section is built from the same data
// modules that render the pages (src/features/ai/content.ts,
// src/features/ai/worcesterCounty.ts, src/features/atlas/content.ts), so an
// assistant that quotes this file quotes the live pages, and editing a page's
// copy updates this file on the next build with no second place to maintain.
import {
  AI_AUTOMATION_BUILDS,
  AI_AUTOMATION_DESCRIPTION,
  AI_AUTOMATION_FAQ,
  AI_AUTOMATION_PROCESS,
  AI_AUTOMATION_STRAIGHT_ANSWERS,
  AI_AUTOMATION_TITLE,
  CALENDLY_URL,
  type FaqItem,
  PRIVATE_AI_DESCRIPTION,
  PRIVATE_AI_FAQ,
  PRIVATE_AI_HOW_IT_WORKS,
  PRIVATE_AI_TITLE,
  PRIVATE_AI_WHO_FOR,
} from '@/features/ai/content';
import {
  AI_AUTOMATION_DEFINITION,
  AI_AUTOMATION_PATH,
  ATLAS_PATH,
  AUTOMATIONS,
  HOME_TOWN,
  INDUSTRY_EXAMPLES,
  SERVICE_AREAS,
  VOICE_AGENT_SUMMARY,
  VOICE_AGENT_USES,
  WORCESTER_COUNTY_DESCRIPTION,
  WORCESTER_COUNTY_FAQ,
  WORCESTER_COUNTY_H1,
  WORCESTER_COUNTY_INTRO,
  WORCESTER_COUNTY_PATH,
} from '@/features/ai/worcesterCounty';
import {
  ATLAS_DESCRIPTION,
  ATLAS_FAQ,
  ATLAS_PHONE_DISPLAY,
  ATLAS_STEPS,
  ATLAS_TITLE,
} from '@/features/atlas/content';
import { AppConfig } from '@/utils/AppConfig';

// Static: the text depends only on source data, never on the request.
export const dynamic = 'force-static';

const url = (path: string) => `${AppConfig.siteUrl}${path}`;
const heading = (title: string) => title.replace(/ \| Business Builder$/, '');
const faq = (items: readonly FaqItem[]) =>
  items.map(item => `Q: ${item.question}\nA: ${item.answer}`).join('\n\n');
const numbered = (items: readonly { title: string; body: string }[]) =>
  items.map((item, i) => `${i + 1}. ${item.title}\n   ${item.body}`).join('\n');

const buildText = () => {
  const sections: string[] = [];
  const add = (...lines: string[]) => sections.push(lines.join('\n'));

  add(
    `# ${AppConfig.name} — full text for AI assistants`,
    '',
    `${AppConfig.name} is the DBA of Donovan Farms Inc., a family-owned Massachusetts company. This file is generated from the same data that renders the pages listed below, so it always says what the site says. Short index: ${url('/llms.txt')}`,
    '',
    `Phone: 978-790-1002 · Email: donovan@business-builder.online · Book a 15-minute call: ${CALENDLY_URL} · Contact page: ${url('/contact')}`,
  );

  add(
    `## ${heading(AI_AUTOMATION_TITLE)}`,
    `URL: ${url(AI_AUTOMATION_PATH)}`,
    '',
    AI_AUTOMATION_DESCRIPTION,
    '',
    '### What we build',
    numbered(AI_AUTOMATION_BUILDS),
    '',
    '### How we work',
    numbered(AI_AUTOMATION_PROCESS),
    '',
    '### Straight answers',
    AI_AUTOMATION_STRAIGHT_ANSWERS.map(item => `- ${item.title} ${item.body}`).join('\n'),
    '',
    '### FAQ',
    faq(AI_AUTOMATION_FAQ),
  );

  const towns = SERVICE_AREAS.map(town => (town === HOME_TOWN ? `${town} (home base — the only office)` : town));
  add(
    `## ${WORCESTER_COUNTY_H1}`,
    `URL: ${url(WORCESTER_COUNTY_PATH)}`,
    '',
    WORCESTER_COUNTY_DESCRIPTION,
    '',
    WORCESTER_COUNTY_INTRO,
    '',
    '### What is AI automation?',
    AI_AUTOMATION_DEFINITION,
    '',
    '### What we automate for local businesses',
    AUTOMATIONS.map(item => `${item.n}. ${item.title}\n   ${item.body}\n   In practice: ${item.example}`).join('\n'),
    '',
    '### AI voice agents and AI receptionists',
    VOICE_AGENT_SUMMARY,
    `Live demo: ${url(ATLAS_PATH)} · Live line: ${ATLAS_PHONE_DISPLAY}`,
    VOICE_AGENT_USES.map(use => `- ${use.title}: ${use.body}`).join('\n'),
    '',
    '### Who it is for (examples of what we set up, not a client list)',
    INDUSTRY_EXAMPLES.map(item => `- ${item.industry}: ${item.example}`).join('\n'),
    '',
    '### Service areas (service areas, not offices)',
    `Worcester County and Central Massachusetts: ${towns.join(', ')}.`,
    '',
    '### FAQ',
    faq(WORCESTER_COUNTY_FAQ),
  );

  add(
    `## ${heading(ATLAS_TITLE)}`,
    `URL: ${url(ATLAS_PATH)}`,
    '',
    ATLAS_DESCRIPTION,
    `Live line: ${ATLAS_PHONE_DISPLAY}`,
    '',
    '### What happens after you talk to Atlas',
    numbered(ATLAS_STEPS),
    '',
    '### FAQ',
    faq(ATLAS_FAQ),
    '',
    `Privacy detail for the voice demo: ${url('/privacy-policy#atlas-voice-demo')}`,
  );

  add(
    `## ${heading(PRIVATE_AI_TITLE)}`,
    `URL: ${url('/private-ai')}`,
    '',
    PRIVATE_AI_DESCRIPTION,
    '',
    '### Who it is for',
    PRIVATE_AI_WHO_FOR.map(item => `- ${item.field}: ${item.reason}`).join('\n'),
    '',
    '### How it works',
    numbered(PRIVATE_AI_HOW_IT_WORKS),
    '',
    '### FAQ',
    faq(PRIVATE_AI_FAQ),
  );

  add(
    '## Websites and hosting',
    `URL: ${url('/pricing')}`,
    '',
    'Self-service website plans from $20 per month; done-for-you plans from $99 per month. Blog: https://business-builder.online/blog',
  );

  return `${sections.join('\n\n')}\n`;
};

export function GET() {
  return new Response(buildText(), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
