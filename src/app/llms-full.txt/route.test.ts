import { describe, expect, it } from 'vitest';

import {
  AI_AUTOMATION_FAQ,
  PRIVATE_AI_FAQ,
} from '@/features/ai/content';
import {
  SERVICE_AREAS,
  WORCESTER_COUNTY_FAQ,
  WORCESTER_COUNTY_H1,
} from '@/features/ai/worcesterCounty';
import { ATLAS_FAQ, ATLAS_PHONE_DISPLAY } from '@/features/atlas/content';

import { GET } from './route';

describe('/llms-full.txt', () => {
  it('serves plain text', async () => {
    const res = GET();

    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toBe('text/plain; charset=utf-8');
    expect((await res.text()).startsWith('# Business Builder')).toBe(true);
  });

  it('carries every FAQ from every AI page, verbatim', async () => {
    const text = await GET().text();

    for (const item of [...AI_AUTOMATION_FAQ, ...WORCESTER_COUNTY_FAQ, ...ATLAS_FAQ, ...PRIVATE_AI_FAQ]) {
      expect(text).toContain(`Q: ${item.question}\nA: ${item.answer}`);
    }
  });

  it('names the Worcester County page, every town and the live demo', async () => {
    const text = await GET().text();

    expect(text).toContain(WORCESTER_COUNTY_H1);
    expect(text).toContain('https://business-builder.online/ai-automation-worcester-county-ma');
    expect(text).toContain('https://business-builder.online/atlas');
    expect(text).toContain(ATLAS_PHONE_DISPLAY);

    for (const town of SERVICE_AREAS) {
      expect(text).toContain(town);
    }
  });

  it('uses the singular brand name and no placeholders', async () => {
    const text = await GET().text();

    expect(text).not.toMatch(/Business Builders\b/);
    expect(text).not.toMatch(/lorem|example\.com|TODO|coming soon/i);
  });
});
