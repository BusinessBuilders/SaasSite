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
