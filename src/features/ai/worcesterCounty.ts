/**
 * Copy source for /ai-automation-worcester-county-ma — the local landing page
 * for AI automation, integration and AI voice agents across Worcester County
 * and Central Massachusetts.
 *
 * Same rule as content.ts: the arrays below feed BOTH the visible page and its
 * JSON-LD (FAQPage, Service, BreadcrumbList), so structured data and on-page
 * text cannot drift apart. Edit the data here; never hand-edit the schema.
 *
 * Every voice-agent capability listed here is one the live Atlas demo
 * (/atlas, src/features/atlas/content.ts) actually performs today: answering
 * the call with an AI disclosure, answering questions from the facts it is
 * given, taking the caller's name and number, asking what they need,
 * transcribing the conversation for the owner, and — where a calendar is
 * connected — offering open times and booking. Do not add a use here that
 * Atlas cannot do (live call transfer, texting the caller, CRM writes).
 */
import { ATLAS_PHONE_DISPLAY, ATLAS_PHONE_TEL } from '@/features/atlas/content';
import { AppConfig } from '@/utils/AppConfig';

import type { FaqItem } from './content';

export const WORCESTER_COUNTY_PATH = '/ai-automation-worcester-county-ma';
export const WORCESTER_COUNTY_URL = `${AppConfig.siteUrl}${WORCESTER_COUNTY_PATH}`;
export const AI_AUTOMATION_PATH = '/ai-automation';
export const ATLAS_PATH = '/atlas';

export { ATLAS_PHONE_DISPLAY, ATLAS_PHONE_TEL };

// Google shows about 65 characters of a title and 160 of a description;
// the unit test holds both limits.
export const WORCESTER_COUNTY_TITLE
  = 'AI Automation Worcester County, MA | Business Builder';
export const WORCESTER_COUNTY_DESCRIPTION
  = 'AI automation, integration and AI voice agents for small businesses across Worcester County and Central Massachusetts. Based in Rutland, MA. From $1,500.';
export const WORCESTER_COUNTY_H1
  = 'AI Automation for Worcester County Small Businesses';

// The one-paragraph answer near the top of the page: who, what, where.
export const WORCESTER_COUNTY_INTRO
  = 'Business Builder provides AI automation and integration for small businesses throughout Worcester County and Central Massachusetts. We are based in Rutland and build AI into the systems you already run: your phone line, website, inbox, scheduling, and paperwork.';

// Citable definition — the "direct answer" block. Kept to one plain paragraph
// so a search engine or an AI assistant can quote it whole.
export const AI_AUTOMATION_DEFINITION
  = 'AI automation means using software that can read, listen, and write to handle one specific, repeatable job in your business: answering a call, qualifying a lead, pulling the fields out of an invoice, drafting a follow-up. It is connected to the tools you already use, so the work gets done without someone re-typing it — and when the AI is not sure, it hands off to a person instead of guessing.';

// Towns are SERVICE AREAS, not offices. The only address is Rutland.
export const HOME_TOWN = 'Rutland';
export const SERVICE_AREAS = [
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
] as const;

export type Automation = {
  n: string;
  title: string;
  body: string;
  /** One concrete "in practice" line — an illustration, not a client story. */
  example: string;
};

export const AUTOMATIONS: readonly Automation[] = [
  {
    n: '01',
    title: 'Lead intake and follow-up',
    body: 'Every inquiry from your website, phone, or forms is answered in seconds, checked against your criteria, and logged. A draft follow-up waits for your review, so the person who reached out Saturday night is not still waiting on Monday.',
    example: 'A quote request comes in at 9 p.m. By 9:01 the customer has a reply, and you have the lead with the details you need to price it.',
  },
  {
    n: '02',
    title: 'CRM and workflow automation',
    body: 'When a lead lands, the record gets created, the right person gets notified, and the next task gets assigned. We wire the steps you do by hand today into the tools you already use — and you can see the log of every step.',
    example: 'New lead in, contact created in your CRM, a text to the owner, a task for the estimator. No copy-and-paste in between.',
  },
  {
    n: '03',
    title: 'Email and SMS workflows',
    body: 'Confirmations, reminders, review requests, and follow-ups that go out on schedule, in your words, from your systems. Text messaging is set up with opt-in and STOP handling so you stay inside the carrier rules.',
    example: 'Appointment booked, confirmation sent, reminder the day before, a thank-you and review request the day after.',
  },
  {
    n: '04',
    title: 'Forms and document processing',
    body: 'Intake forms, invoices, applications, and the PDFs that pile up — read, checked, extracted into the fields you need, and filed where they belong. The stack on the desk becomes a searchable record.',
    example: 'Supplier invoices arrive by email, the totals and line items land in your spreadsheet or accounting system, and the exceptions are flagged for a human.',
  },
  {
    n: '05',
    title: 'AI chatbots and knowledge assistants',
    body: 'A chatbot that answers from your own manuals, price sheets, and policies, cites where the answer came from, and hands the conversation to a person when it is not sure. Customer-facing on your website, or internal for your team.',
    example: '“Do you service my model?” answered from your own service list, with the page it came from, and a callback booked if the customer wants one.',
  },
  {
    n: '06',
    title: 'Connecting the software you already run',
    body: 'Your website, scheduling tool, CRM, spreadsheets, accounting, and inbox rarely talk to each other. We connect them so information entered once shows up everywhere it is needed, with no re-typing.',
    example: 'A booking on your website creates the calendar event, the customer record, and the invoice draft — one entry, three systems.',
  },
] as const;

export type VoiceAgentUse = { title: string; body: string };

export const VOICE_AGENT_SUMMARY
  = 'An AI voice agent — often called an AI receptionist — answers your business phone and talks with the caller in natural language. Ours is called Atlas. It opens by saying it is an AI, answers common questions from the facts you give it, takes the caller’s name and number, asks what they need, and sends you the conversation. Where a calendar is connected, it can offer open times and book.';

export const VOICE_AGENT_USES: readonly VoiceAgentUse[] = [
  {
    title: 'Answering inbound calls',
    body: 'Picks up every call on the line you point at it, any hour, and opens with a plain statement that it is an AI.',
  },
  {
    title: 'Answering common questions',
    body: 'Hours, services, service area, what to expect on the first visit — answered from the facts you give it, in your words.',
  },
  {
    title: 'Collecting lead information',
    body: 'Takes the caller’s name, number, and what they need, so a call you could not answer still becomes a lead.',
  },
  {
    title: 'Qualifying inquiries',
    body: 'Asks the questions you would ask first, so you know before you call back whether it is a job you want.',
  },
  {
    title: 'Routing information to you',
    body: 'Every conversation is transcribed and sent to you, so the details are waiting when you are off the ladder or out of the truck.',
  },
  {
    title: 'Appointment and scheduling workflows, where configured',
    body: 'Connected to a calendar, it can offer real open times and book a call. It only says a time is booked when the booking actually went through.',
  },
  {
    title: 'After-hours call handling',
    body: 'Nights, weekends, and the hours you are on a job. The phone gets answered either way.',
  },
  {
    title: 'Fewer missed opportunities',
    body: 'A missed call is a customer dialing the next name on the list. An answered one is a message you can act on.',
  },
] as const;

export type IndustryExample = { industry: string; example: string };

// Illustrations of what we set up for each trade — NOT a client list. The
// page says so in the sentence above the grid.
export const INDUSTRY_EXAMPLES: readonly IndustryExample[] = [
  {
    industry: 'Contractors',
    example: 'Estimate requests answered and captured while you are on site, with the job details filed against the lead.',
  },
  {
    industry: 'Cleaning companies',
    example: 'Quote requests qualified by home size and frequency; recurring-visit reminders sent without anyone typing them.',
  },
  {
    industry: 'Landscapers',
    example: 'Spring cleanup and mowing inquiries answered in season — when the phone rings most and the crew is out.',
  },
  {
    industry: 'Auto shops and detailers',
    example: '“Do you work on my model?” answered from your own list; drop-off and pickup confirmations by text.',
  },
  {
    industry: 'Real estate',
    example: 'Showing requests and listing questions answered fast, contact details captured, the follow-up drafted for the agent.',
  },
  {
    industry: 'Fitness studios and gyms',
    example: 'Class, membership, and trial questions handled; new-member intake forms processed into your system.',
  },
  {
    industry: 'Retail shops',
    example: 'Hours, stock, and order questions answered; special-order requests logged and sent to the right person.',
  },
  {
    industry: 'Property management',
    example: 'Maintenance requests taken and categorized around the clock; tenant applications read and filed.',
  },
  {
    industry: 'Bakeries and cafes',
    example: 'Custom-order and catering inquiries captured with the details you need to quote; holiday cutoffs communicated.',
  },
  {
    industry: 'Professional services',
    example: 'Intake for accountants, attorneys, and consultants: the first questions asked, documents collected, the appointment booked.',
  },
] as const;

const serviceAreaSentence = SERVICE_AREAS.filter(t => t !== HOME_TOWN);

export const WORCESTER_COUNTY_FAQ: readonly FaqItem[] = [
  {
    question: 'What is AI automation?',
    answer: AI_AUTOMATION_DEFINITION,
  },
  {
    question: 'What is an AI voice agent?',
    answer: `${VOICE_AGENT_SUMMARY} You can talk to Atlas in your browser at business-builder.online/atlas.`,
  },
  {
    question: 'Can an AI agent answer business phone calls?',
    answer: 'Yes. Set up on your business line, an AI voice agent answers every call, tells the caller it is an AI, answers common questions, and takes a message with the caller’s name, number, and what they need. It does not replace you on the calls that need you; it makes sure those callers are captured and you have what you need to call back.',
  },
  {
    question: 'Can it capture leads?',
    answer: 'Yes — capturing leads is the main job. The caller’s name, number, and request are recorded and sent to you, and where a calendar is connected the agent can offer open times and book an appointment. Web forms and chat inquiries can be captured and qualified the same way.',
  },
  {
    question: 'Can AI automation work with my existing website or CRM?',
    answer: 'In most cases, yes. We build onto what you already run: your website (whether we host it or not), your CRM, scheduling tool, spreadsheets, accounting, and inbox. The discovery sprint is where we confirm exactly what your tools allow before we quote the build.',
  },
  {
    question: 'Do you provide AI automation in Worcester County?',
    answer: `Yes. Business Builder is based in ${HOME_TOWN}, Massachusetts, and works with small businesses throughout Worcester County and Central Massachusetts, including ${serviceAreaSentence.slice(0, -1).join(', ')}, and ${serviceAreaSentence.at(-1)}. We meet on-site where it helps and work remotely where it does not.`,
  },
  {
    question: 'How much does AI automation cost?',
    answer: 'Every engagement starts with a $1,500 discovery sprint: one workflow, your real data, and a plain-English acceptance test the finished system has to pass. You get a fixed quote and a timeline before any build starts. Deployed systems carry a monthly care plan that covers hosting, monitoring, and tuning. Businesses that cannot send data to a public AI cloud can run on private AI, which starts at $3,500 per month.',
  },
  {
    question: 'Is my data sent to OpenAI or another AI cloud?',
    answer: 'Only when it fits your situation and you approve it. For regulated or confidential data — medical, legal, financial, trade secrets — we run the same automation on private AI endpoints on hardware we control, so the data never leaves the environment you sign off on.',
  },
  {
    question: 'Can I try the AI voice agent before I buy?',
    answer: `Yes. Atlas, our AI receptionist, runs live at business-builder.online/atlas. Pick a sample business type or describe your own, tap once, and talk to it out loud in your browser — or call the live line at ${ATLAS_PHONE_DISPLAY}.`,
  },
] as const;

// ---------------------------------------------------------------------------
// Structured data. The provider carries the SAME @id as the site-wide
// ProfessionalService schema in src/app/[locale]/layout.tsx, so a crawler
// merges the two into one organization instead of seeing a duplicate.
// ---------------------------------------------------------------------------

const WORCESTER_COUNTY_AREA = {
  '@type': 'AdministrativeArea',
  'name': 'Worcester County, Massachusetts',
};

export const buildServiceJsonLd = () => ({
  '@context': 'https://schema.org',
  '@type': 'Service',
  '@id': `${WORCESTER_COUNTY_URL}#service`,
  'name': 'AI Automation for Small Businesses in Worcester County, MA',
  'serviceType': 'AI automation and integration',
  'description': WORCESTER_COUNTY_DESCRIPTION,
  'url': WORCESTER_COUNTY_URL,
  'provider': {
    '@type': 'ProfessionalService',
    '@id': AppConfig.siteUrl,
    'name': AppConfig.name,
    'url': AppConfig.siteUrl,
    'telephone': '+19787901002',
    'address': {
      '@type': 'PostalAddress',
      'addressLocality': HOME_TOWN,
      'addressRegion': 'MA',
      'postalCode': '01543',
      'addressCountry': 'US',
    },
  },
  'areaServed': [
    WORCESTER_COUNTY_AREA,
    { '@type': 'AdministrativeArea', 'name': 'Central Massachusetts' },
    ...SERVICE_AREAS.map(name => ({
      '@type': 'City',
      name,
      'containedInPlace': WORCESTER_COUNTY_AREA,
    })),
  ],
  'hasOfferCatalog': {
    '@type': 'OfferCatalog',
    'name': 'AI automation services',
    'itemListElement': [
      {
        '@type': 'Offer',
        'itemOffered': {
          '@type': 'Service',
          'name': 'AI voice agents and AI receptionists',
          'description': VOICE_AGENT_SUMMARY,
          'url': `${AppConfig.siteUrl}${ATLAS_PATH}`,
        },
      },
      ...AUTOMATIONS.map(item => ({
        '@type': 'Offer',
        'itemOffered': {
          '@type': 'Service',
          'name': item.title,
          'description': item.body,
        },
      })),
    ],
  },
  'offers': {
    '@type': 'Offer',
    'name': 'Discovery sprint',
    'description': 'One workflow scoped against your real data, with a fixed quote and timeline before any build starts.',
    'price': '1500',
    'priceCurrency': 'USD',
    'url': WORCESTER_COUNTY_URL,
  },
});

export const buildBreadcrumbJsonLd = () => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  'itemListElement': [
    {
      '@type': 'ListItem',
      'position': 1,
      'name': 'Home',
      'item': AppConfig.siteUrl,
    },
    {
      '@type': 'ListItem',
      'position': 2,
      'name': 'AI Automation',
      'item': `${AppConfig.siteUrl}${AI_AUTOMATION_PATH}`,
    },
    {
      '@type': 'ListItem',
      'position': 3,
      'name': 'Worcester County, MA',
      'item': WORCESTER_COUNTY_URL,
    },
  ],
});
