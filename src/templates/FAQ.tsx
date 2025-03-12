import { useTranslations } from 'next-intl';

import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Section } from '@/features/landing/Section';

export const FAQ = () => {
  const t = useTranslations('FAQ');

  // ✅ Explicitly retrieve as raw JSON
  const faqs = t.raw('items') as { question: string; answer: string }[] || [];

  return (
    <Section>
      {faqs.length > 0
        ? (
            faqs.map((faq, index) => (
              <AccordionItem key={faq.question} value={`item-${index + 1}`}>
                <AccordionTrigger>{faq.question}</AccordionTrigger>
                <AccordionContent>{faq.answer}</AccordionContent>
              </AccordionItem>
            ))
          )
        : (
            <p>No FAQs available.</p>
          )}

    </Section>
  );
};
