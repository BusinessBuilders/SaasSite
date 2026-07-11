/*
 * NVIDIA Inception — private-AI repositioning of the homepage.
 * Faithful port of Desktop/NvidiaInception/website.html onto the BB template.
 * TEMPORARY: roll back via tag `pre-nvidia-rollback-2026-06-28` after acceptance.
 *
 * Honesty guardrails (legal application — do not soften into over-claims):
 *  - Eve = in private beta, not "fully live".
 *  - Robotics / actuators = R&D; motor is a COMMERCIAL Eagle Power BLDC.
 *    Custom work = machined housing + cycloidal drive + assembly. No "hand-wound".
 *  - Company = Donovan Farms Inc (DBA Business Builders).
 */

const CALENDLY = 'https://calendly.com/donovan-business-builder/15minute';
const EMAIL = 'Donovan@business-builder.online';

const Container = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`mx-auto max-w-6xl px-6 md:px-8 ${className}`}>{children}</div>
);

const Diamond = () => <span className="mt-1 flex-none font-extrabold text-bb-orange">◆</span>;

// ─────────────────────────────────────────────────────────────────────────────
// HERO — rig cluster, lead positioning
// ─────────────────────────────────────────────────────────────────────────────
export const NvidiaHero = () => (
  <section className="border-b border-[color:var(--bb-border-hair)] py-20 md:py-28">
    <Container className="grid grid-cols-1 items-center gap-10 md:grid-cols-[1.1fr_0.9fr] md:gap-14">
      <div>
        <div className="bb-anim bb-d1 bb-eyebrow">
          Private AI&nbsp;&nbsp;·&nbsp;&nbsp;hand-built&nbsp;&nbsp;·&nbsp;&nbsp;runs on your own machine
        </div>
        <h1 className="bb-anim bb-d2 mt-5 font-bb-display-2 text-5xl font-extrabold leading-[1.02] tracking-tight text-bb-cream-bright md:text-7xl">
          Private AI for
          {' '}
          <br className="hidden md:block" />
          your business.
          {' '}
          <br />
          <span className="text-bb-orange">Hardware and software, hand-built.</span>
        </h1>
        <p className="bb-anim bb-d3 mt-6 max-w-xl text-lg text-bb-taupe md:text-xl">
          A voice assistant, private document scanning, and automation — running on a machine we build and you
          own. Your data never leaves the building.
        </p>
        <div className="bb-anim bb-d3 mt-9 flex flex-wrap gap-3.5">
          <a href={CALENDLY} target="_blank" rel="noopener noreferrer" className="bb-btn bb-btn-primary">
            Book a demo
          </a>
          <a href="#eve" className="bb-btn bb-btn-ghost">Meet Eve</a>
        </div>
        <div className="bb-anim bb-d4 mt-7 flex flex-wrap gap-2.5">
          {['Runs on-prem', '$0 / minute', 'You own it', 'Hand-built'].map(t => (
            <span key={t} className="bb-tag bb-tag-ghost">{t}</span>
          ))}
        </div>
      </div>
      <div className="bb-anim bb-d2">
        <div className="bb-shot h-[420px] md:h-[560px]">
          <img src="/nvidia/rig2-clean.png" alt="Our 8x RTX 3090 GPU cluster, built and running" />
        </div>
        <div className="bb-cap">8× RTX 3090 cluster — built &amp; running</div>
      </div>
    </Container>
  </section>
);

// ─────────────────────────────────────────────────────────────────────────────
// PRIVATE DOCUMENT SCANNING — split + redacted-document graphic
// ─────────────────────────────────────────────────────────────────────────────
export const NvidiaScanning = () => (
  <section id="scan" className="border-t border-[color:var(--bb-border-hair)] bg-bb-black-soft py-20 md:py-24">
    <Container className="grid grid-cols-1 items-center gap-10 md:grid-cols-2 md:gap-14">
      <div>
        <div className="bb-eyebrow">Private document scanning</div>
        <h2 className="mt-3 font-bb-display-2 text-3xl font-extrabold leading-tight text-bb-cream-bright md:text-4xl">
          Point it at your paperwork.
          {' '}
          <br />
          It
          {' '}
          <span className="text-bb-orange">stays in the building.</span>
        </h2>
        <p className="mt-4 max-w-xl text-lg text-bb-taupe">
          We read your documents, contracts, and records into a private AI that lives on your hardware. Ask it
          anything in plain English — and none of it ever touches the cloud.
        </p>
        <ul className="mt-6 flex flex-col gap-4">
          {[
            ['Scan it once', '— contracts, invoices, records, files'],
            ['Ask in plain English', '— find anything in seconds'],
            ['Automate the back-office', '— the paperwork grind, handled'],
            ['Nothing leaves', '— it runs on your machine, on-site'],
          ].map(([b, rest]) => (
            <li key={b} className="flex gap-3 text-[17px] leading-snug">
              <Diamond />
              <span>
                <b className="text-bb-cream-bright">{b}</b>
                {' '}
                {rest}
              </span>
            </li>
          ))}
        </ul>
      </div>
      {/* redacted-document graphic — no photo needed */}
      <div
        className="relative flex min-h-[360px] flex-col justify-center gap-3.5 overflow-hidden rounded-md border border-[color:var(--bb-border-soft)] p-11"
        style={{ background: 'radial-gradient(120% 80% at 80% 0%, #21190f, #14110d)' }}
      >
        <div className="absolute right-5 top-5 rotate-[7deg] rounded border-2 border-bb-orange px-2.5 py-1.5 text-[11px] font-extrabold uppercase tracking-[0.16em] text-bb-orange">
          Private · On-site
        </div>
        {[['72%', false], ['38%', true], ['88%', false], ['60%', false], ['46%', true], ['80%', false], ['52%', false]].map(([w, red], i) => (
          <div
            key={i}
            className="h-2.5 rounded-[3px]"
            style={{ width: w as string, background: red ? 'var(--bb-orange)' : 'rgba(245,230,200,0.14)', opacity: red ? 0.9 : 1 }}
          />
        ))}
        <div className="mt-2 flex items-center gap-2.5 text-xs font-bold uppercase tracking-[0.14em] text-bb-teal-soft">
          ◆ encrypted · never leaves your building
        </div>
      </div>
    </Container>
  </section>
);

// ─────────────────────────────────────────────────────────────────────────────
// MEET EVE — flagship voice AI (beta)
// ─────────────────────────────────────────────────────────────────────────────
export const NvidiaEve = () => (
  <section id="eve" className="border-t border-[color:var(--bb-border-hair)] py-20 md:py-24">
    <Container className="grid grid-cols-1 items-center gap-10 md:grid-cols-2 md:gap-14">
      <div className="md:order-1">
        <div className="bb-shot h-[360px] md:h-[420px]">
          <img src="/nvidia/eve-glow.png" alt="Eve — concept render" />
        </div>
        <div className="bb-cap">Eve — concept render</div>
      </div>
      <div className="md:order-2">
        <div className="flex items-center gap-3">
          <span className="bb-eyebrow">Our flagship</span>
          <span className="bb-tag bb-tag-teal">In private beta</span>
        </div>
        <h2 className="mt-3 font-bb-display-2 text-3xl font-extrabold leading-tight text-bb-cream-bright md:text-4xl">
          Meet Eve. A local
          {' '}
          <br />
          AI
          {' '}
          <span className="text-bb-orange">chief-of-staff.</span>
        </h2>
        <p className="mt-4 max-w-xl text-lg text-bb-taupe">
          She listens, talks back, and hands the rest to her agents — running on your own box, no API keys, no
          per-minute cost. In active development today.
        </p>
        <ul className="mt-6 flex flex-col gap-4">
          {[
            ['Full-duplex voice', '— always listening, interrupt her any time'],
            ['Hands work to her agents', '— delegates the busywork, reports back'],
            ['Trust built into the code', '— she knows who’s talking; risky tools are gated'],
            ['Yours, on-site', '— your data and memory never leave'],
          ].map(([b, rest]) => (
            <li key={b} className="flex gap-3 text-[17px] leading-snug">
              <Diamond />
              <span>
                <b className="text-bb-cream-bright">{b}</b>
                {' '}
                {rest}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </Container>
  </section>
);

// ─────────────────────────────────────────────────────────────────────────────
// HOW WE BUILD — the full stack, proof photos
// ─────────────────────────────────────────────────────────────────────────────
export const NvidiaHowWeBuild = () => (
  <section id="build" className="border-t border-[color:var(--bb-border-hair)] bg-bb-black-soft py-20 md:py-24">
    <Container className="grid grid-cols-1 items-center gap-10 md:grid-cols-2 md:gap-14">
      <div>
        <div className="bb-eyebrow">The whole stack</div>
        <h2 className="mt-3 font-bb-display-2 text-3xl font-extrabold leading-tight text-bb-cream-bright md:text-4xl">
          We build the software
          {' '}
          <br />
          — and the
          {' '}
          <span className="text-bb-orange">machine.</span>
        </h2>
        <p className="mt-4 max-w-xl text-lg text-bb-taupe">
          Most AI shops rent their compute and hand you a login. We don’t. We run our own GPU cluster, machine
          our own parts on the CNC, and explore robotics R&amp;D in the shop — so the AI we put in your business
          is something we built end to end.
        </p>
        <ul className="mt-6 flex flex-col gap-4">
          {[
            ['8× RTX 3090 GPU cluster', '— our own compute'],
            ['CNC mill', '— we machine our own metal parts'],
            ['Custom actuator R&D', '— machined housings, cycloidal drives'],
            ['Local models', '— we run and tune them ourselves'],
          ].map(([b, rest]) => (
            <li key={b} className="flex gap-3 text-[17px] leading-snug">
              <Diamond />
              <span>
                <b className="text-bb-cream-bright">{b}</b>
                {' '}
                {rest}
              </span>
            </li>
          ))}
        </ul>
      </div>
      <div>
        <div className="bb-shot h-[420px] md:h-[500px]">
          <img src="/nvidia/goodcrop.png" alt="Our shop — GPU rig, 3D printer, bench, and AI workstation" className="!object-top" />
        </div>
        <div className="bb-cap">our shop — rig, printer, bench &amp; AI workstation</div>
        <div className="mt-3.5 grid grid-cols-1 gap-3.5 sm:grid-cols-2">
          <div>
            <div className="bb-shot h-44"><img src="/nvidia/cnc.png" alt="CNC mill — metal parts made here" /></div>
            <div className="bb-cap !text-[10px]">CNC mill — metal parts made here</div>
          </div>
          <div>
            <div className="bb-shot h-44"><img src="/nvidia/actuator-clean.png" alt="Custom actuator housing with commercial BLDC motor" /></div>
            <div className="bb-cap !text-[10px]">Actuator R&amp;D — housing + cycloidal drive</div>
          </div>
        </div>
      </div>
    </Container>
  </section>
);

// ─────────────────────────────────────────────────────────────────────────────
// WHY US — 6 cards
// ─────────────────────────────────────────────────────────────────────────────
const WHY = [
  ['You own it', 'It runs on a machine that’s yours. Buy it once — it’s yours to keep.'],
  ['Data stays on-site', 'Your documents and conversations never leave your building. Privacy is the default.'],
  ['We show up', 'We set it up in person and tune it to how you actually work — not a ticket queue.'],
  ['Right-sized', 'Built for a real small business — not an enterprise AI factory you’d never use.'],
  ['Hand-built', 'We write the code and wire the machines ourselves. No black box, no middleman.'],
  ['Here to stay', 'Bootstrapped and profitable. We answer to customers, not a runway clock.'],
];
export const NvidiaWhy = () => (
  <section id="why" className="border-t border-[color:var(--bb-border-hair)] py-20 md:py-24">
    <Container>
      <div className="mb-10 max-w-3xl">
        <div className="bb-eyebrow">Why Business Builders</div>
        <h2 className="mt-3 font-bb-display-2 text-3xl font-extrabold text-bb-cream-bright md:text-4xl">
          Local. Private.
          {' '}
          <span className="text-bb-orange">Yours.</span>
        </h2>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {WHY.map(([h, p]) => (
          <div
            key={h}
            className="rounded-lg border border-[color:var(--bb-border-hair)] bg-bb-black-warm p-6 transition hover:-translate-y-0.5 hover:border-[color:var(--bb-border-soft)]"
          >
            <h3 className="mb-2 font-bb-body text-lg font-bold text-bb-cream-bright">{h}</h3>
            <p className="text-[15px] text-bb-taupe">{p}</p>
          </div>
        ))}
      </div>
    </Container>
  </section>
);

// ─────────────────────────────────────────────────────────────────────────────
// ABOUT — legal entity
// ─────────────────────────────────────────────────────────────────────────────
export const NvidiaAbout = () => (
  <section className="border-t border-[color:var(--bb-border-hair)] bg-bb-black-soft py-20 md:py-24">
    <Container>
      <div className="bb-eyebrow">About</div>
      <h2 className="mt-3 font-bb-display-2 text-3xl font-extrabold text-bb-cream-bright md:text-4xl">
        Donovan Farms Inc,
        {' '}
        <span className="text-bb-orange">dba Business Builders.</span>
      </h2>
      <hr className="bb-rule-double my-6 max-w-[420px]" />
      <p className="max-w-3xl text-lg text-bb-cream md:text-xl">
        We build private AI and run our own machines. Bootstrapped, profitable, and hands-on — we write the code,
        wire the hardware, machine our own parts, and explore robotics R&amp;D in the shop. Founded and run by Bill
        Donovan.
      </p>
    </Container>
  </section>
);

// ─────────────────────────────────────────────────────────────────────────────
// CONTACT — email CTA
// ─────────────────────────────────────────────────────────────────────────────
export const NvidiaContact = () => (
  <section id="contact" className="border-t border-[color:var(--bb-border-hair)] py-20 text-center md:py-24">
    <Container>
      <div className="bb-eyebrow">Let’s build it</div>
      <h2 className="mt-3.5 font-bb-display-2 text-3xl font-extrabold text-bb-cream-bright md:text-4xl">
        Private AI, built for
        {' '}
        <span className="text-bb-orange">your shop.</span>
      </h2>
      <p className="mx-auto mt-4 max-w-xl text-lg text-bb-taupe">
        Tell us what eats your time. We’ll show you what a private, on-prem AI can take off your plate.
      </p>
      <a href={`mailto:${EMAIL}`} className="mt-6 inline-block text-xl font-semibold text-bb-teal-soft hover:text-bb-cream">
        {EMAIL}
      </a>
      <div className="mt-7">
        <a href={CALENDLY} target="_blank" rel="noopener noreferrer" className="bb-btn bb-btn-primary">
          Book a demo
        </a>
      </div>
    </Container>
  </section>
);
