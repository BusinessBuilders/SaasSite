/**
 * Copy source for the AI marketing pages (/ai-automation and /private-ai).
 * The FAQ arrays feed BOTH the visible accordions and the FAQPage JSON-LD,
 * so schema and on-page text cannot drift apart.
 */

export const CALENDLY_URL
  = 'https://calendly.com/donovan-business-builder/15minute';

export type FaqItem = { question: string; answer: string };

export const buildFaqJsonLd = (items: readonly FaqItem[]) => ({
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  'mainEntity': items.map(item => ({
    '@type': 'Question',
    'name': item.question,
    'acceptedAnswer': { '@type': 'Answer', 'text': item.answer },
  })),
});

export const AI_AUTOMATION_FAQ: readonly FaqItem[] = [
  {
    question: 'What is AI integration for a small business?',
    answer:
      'It means connecting AI to the systems you already use — your website, inbox, documents, and scheduling — so it does one specific job with your real information: answering customer questions, processing paperwork, or qualifying leads. It is built into your operation, not another app you have to check.',
  },
  {
    question: 'What does AI automation cost?',
    answer:
      'Every engagement starts with a $1,500 discovery sprint: we scope one workflow, look at your real data, and define the test the finished system has to pass. You get a fixed quote before any build starts. Deployed systems carry a monthly care plan that covers hosting, monitoring, and tuning.',
  },
  {
    question: 'Can a chatbot answer from our own documents?',
    answer:
      'Yes — that is the most common build. The chatbot answers from your actual manuals, policies, or price sheets, cites the source it pulled from, and hands the conversation to a human when it is not sure. It does not make things up when it cannot find an answer.',
  },
  {
    question: 'What happens when the AI does not know the answer?',
    answer:
      'It escalates to a person — by design. Before handoff we demonstrate the failure path to you: unclear question in, human handoff out. A system that guesses confidently is worse than no system, and we do not ship those.',
  },
  {
    question: 'Do we have to send our data to OpenAI or another AI cloud?',
    answer:
      'Not if you cannot. For businesses with privacy or compliance constraints — medical, legal, financial, trade secrets — we run private AI on hardware we control, so your data never leaves the environment you approve. See our Private AI service for details.',
  },
  {
    question: 'How long does an AI automation project take?',
    answer:
      'It depends on the workflow, and that is exactly what the discovery sprint pins down — you get a timeline alongside your fixed quote before committing to the build.',
  },
] as const;

export const PRIVATE_AI_FAQ: readonly FaqItem[] = [
  {
    question: 'Why can\'t we just use ChatGPT?',
    answer:
      'For many businesses you can, and we build on those APIs when they fit. But if your data is regulated or confidential — patient records, case files, client financials, trade secrets — sending it to someone else\'s cloud may be a compliance violation or a risk you simply cannot take. Private AI gives you the automation without the data ever leaving your control.',
  },
  {
    question: 'Where does our data actually go?',
    answer:
      'To a private AI endpoint running on hardware we control, reachable only over a locked private connection — never the open internet. Your data is not used to train anyone\'s models and is never shared between clients. If you operate under a regulatory framework like HIPAA, your compliance officer signs off on the setup before anything ships — we build to your requirements; we don\'t certify them.',
  },
  {
    question: 'Is a private model as good as ChatGPT?',
    answer:
      'Frontier cloud models are stronger at general tasks — that is the honest answer. But your business does not need general; it needs one job done reliably. We size the private model to pass the same acceptance test we hold every build to, run on your real cases. If it cannot pass, we tell you before you commit to the engagement.',
  },
  {
    question: 'What does private AI cost?',
    answer:
      'Engagements start at $3,500 per month. Exact scope is quoted after a discovery call — book one and we will tell you in plain terms what your workflow needs.',
  },
] as const;

// ---------------------------------------------------------------------------
// Page titles, descriptions and the copy blocks of /ai-automation and
// /private-ai. They live here rather than in the page files so the pages and
// the plain-text digest at /llms-full.txt (src/app/llms-full.txt/route.ts)
// read the same strings — an AI assistant quoting the digest quotes the page.
// ---------------------------------------------------------------------------

export const AI_AUTOMATION_TITLE = 'AI Integration & Automation Services | Business Builder';
export const AI_AUTOMATION_DESCRIPTION
  = 'We build AI into the systems you already run — chatbots that answer from your documents, document automation, AI intake that never sleeps. Sprints from $1,500.';
export const PRIVATE_AI_TITLE
  = 'Private AI on Hardware You Control | Business Builder';
export const PRIVATE_AI_DESCRIPTION
  = 'AI automation for businesses that can\'t send their data to OpenAI. Private endpoints on hardware we control, monitored around the clock. From $3,500/month.';

export const AI_AUTOMATION_BUILDS = [
  {
    n: '01',
    title: 'A chatbot trained on your documents',
    body: 'It reads your manuals, price sheets, and policies — then answers customers with the source cited, right in the reply. When it is not sure, it hands the conversation to your team instead of guessing. Your knowledge, working the counter.',
  },
  {
    n: '02',
    title: 'Paperwork that handles itself',
    body: 'Invoices, intake forms, applications — read, checked, extracted, and filed. The stack on your desk becomes a searchable record, and the re-typing disappears.',
  },
  {
    n: '03',
    title: 'Intake that never sleeps',
    body: 'Every lead answered in seconds, any hour. Qualified against your criteria, routed to your calendar or your phone, with a draft follow-up waiting for your review in the morning.',
  },
];

export const AI_AUTOMATION_PROCESS = [
  {
    n: '01',
    title: 'Discovery sprint — $1,500',
    body: 'One workflow, scoped tight. We take your real documents and real cases, then define the acceptance test with you — 20 to 50 actual questions or tasks the finished system must pass. You leave with a fixed quote and a timeline.',
  },
  {
    n: '02',
    title: 'The build',
    body: 'We build against that test with the simplest tool that clears it. If a straightforward integration does the job, we will not sell you a custom model.',
  },
  {
    n: '03',
    title: 'Prove it, live',
    body: 'Before handoff you watch the system pass your acceptance test on your own cases. We also show you what happens when it is unsure: it hands off to a human. It never guesses.',
  },
  {
    n: '04',
    title: 'The care plan',
    body: 'Everything we deploy stays monitored. If it breaks at 2 a.m., we get the alert — not your customers. Monthly tuning keeps it sharp as your business changes.',
  },
];

export const AI_AUTOMATION_STRAIGHT_ANSWERS = [
  {
    title: '“Trained on your data” usually doesn’t mean training.',
    body: 'Nine times out of ten, what a business actually needs is a system that retrieves the right page of its own documents and answers from it — not a custom-trained model. The first is a solid, affordable build; the second costs multiples more. We will tell you which one you actually need, even when it is the cheaper answer.',
  },
  {
    title: 'Every answer shows its work.',
    body: 'Chatbots we build cite the document they pulled the answer from. If no source exists, the bot says so and routes the question to your team.',
  },
  {
    title: 'No silent failures.',
    body: 'Every system we ship fails loudly — an alert to a human — never a made-up answer to a customer. A system that pretends to work is worse than one that is down.',
  },
];

export const PRIVATE_AI_WHO_FOR = [
  {
    field: 'Medical & dental practices',
    reason:
      'Patient records and privacy obligations don\'t mix with public AI clouds.',
  },
  {
    field: 'Law firms',
    reason: 'Case files and privileged communications stay privileged.',
  },
  {
    field: 'Accounting & finance',
    reason: 'Client financials never become someone else\'s training data.',
  },
  {
    field: 'Manufacturers & builders',
    reason:
      'Trade secrets, bids, and contracts that forbid third-party processing.',
  },
];

export const PRIVATE_AI_HOW_IT_WORKS = [
  {
    n: '01',
    title: 'Your own AI endpoint',
    body: 'A capable AI model running on hardware we control — not a shared public service. Your tools talk to it exactly the way they would talk to ChatGPT. The difference is where it lives, and who can see it: you, and nobody else.',
  },
  {
    n: '02',
    title: 'A locked connection',
    body: 'The endpoint is never exposed to the open internet. Access runs over a private, encrypted link with keys — your systems in, everyone else out.',
  },
  {
    n: '03',
    title: 'Watched around the clock',
    body: 'Health checks and alerts are part of the build, not an add-on. If anything stops, a human gets paged. It never fails silently.',
  },
  {
    n: '04',
    title: 'Sized to the job',
    body: 'We fit the smallest model that passes your acceptance test — so you are not paying for capacity you will never use.',
  },
];
