"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger, useGSAP);

const MOTION_OK = "(prefers-reduced-motion: no-preference)";
const outline = "text-transparent [-webkit-text-stroke:1px_var(--outline)]";

/* Hairline at the top that fills as the page scrolls */
export function ScrollProgress() {
  const ref = useRef<HTMLDivElement>(null);
  useGSAP(() => {
    const mm = gsap.matchMedia();
    mm.add(MOTION_OK, () => {
      gsap.fromTo(ref.current, { scaleX: 0 }, { scaleX: 1, ease: "none", scrollTrigger: { start: 0, end: "max", scrub: 0.3 } });
    });
    return () => mm.revert();
  });
  return <div ref={ref} aria-hidden className="fixed inset-x-0 top-0 z-[45] h-[2px] origin-left scale-x-0 bg-[var(--accent)]" />;
}

/* Two rows of large text that slide in opposite directions as you scroll past */
export function ScrollMarquee({ items }: { items: string[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const row = [...items, ...items, ...items];

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        const q = gsap.utils.selector(ref);
        const st = { trigger: ref.current, start: "top bottom", end: "bottom top", scrub: true };
        gsap.fromTo(q(".mq-a"), { xPercent: 0 }, { xPercent: -30, ease: "none", scrollTrigger: st });
        gsap.fromTo(q(".mq-b"), { xPercent: -30 }, { xPercent: 0, ease: "none", scrollTrigger: st });

        // Rows lean into the scroll: faster scrolling, harder skew
        const rows = q(".mq-a, .mq-b");
        const skew = gsap.quickTo(rows, "skewX", { duration: 0.5, ease: "power3" });
        let rest: gsap.core.Tween | undefined;
        ScrollTrigger.create({
          trigger: ref.current,
          start: "top bottom",
          end: "bottom top",
          onUpdate: (self) => {
            skew(gsap.utils.clamp(-14, 14, -self.getVelocity() / 180));
            rest?.kill();
            rest = gsap.delayedCall(0.12, () => skew(0));
          },
        });
      });
      return () => mm.revert();
    },
    { scope: ref }
  );

  return (
    <div ref={ref} aria-hidden className="space-y-3 overflow-hidden border-t border-[var(--ink-10)] py-10">
      <div className="mq-a flex w-max gap-10 whitespace-nowrap font-serif text-7xl font-light text-[var(--fg)] sm:text-[13vw] sm:leading-none">
        {row.map((t, i) => <span key={i}>{t}</span>)}
      </div>
      <div className={`mq-b flex w-max gap-10 whitespace-nowrap font-serif text-7xl font-light sm:text-[13vw] sm:leading-none ${outline}`}>
        {row.map((t, i) => <span key={i}>{t}</span>)}
      </div>
    </div>
  );
}

/* Pinned section: scrolling advances through the steps, one at a time */
export function ProcessPinned({ steps, title, stage }: { steps: string[][]; title: string; stage?: { current: { ry2: number } } }) {
  const ref = useRef<HTMLElement>(null);
  const n = steps.length;

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        const q = gsap.utils.selector(ref);
        const nums = q(".pp-num");
        const titles = q(".pp-title");
        const bodies = q(".pp-body");
        const dots = q(".pp-dot");
        const labels = q(".pp-label");

        gsap.set(nums.slice(1), { yPercent: 100 });
        gsap.set(titles.slice(1), { yPercent: 110 });
        gsap.set(bodies.slice(1), { opacity: 0, y: 20 });
        gsap.set(dots.slice(1), { opacity: 0.3, scale: 1 });
        gsap.set(labels.slice(1), { opacity: 0.35 });

        const tl = gsap.timeline({
          defaults: { ease: "none" },
          scrollTrigger: {
            trigger: ref.current,
            start: "top top",
            end: `+=${n * 90}%`,
            pin: true,
            scrub: 0.7,
            anticipatePin: 1,
            snap: { snapTo: 1 / (n - 1), duration: { min: 0.25, max: 0.7 }, delay: 0.05, ease: "power2.inOut" },
          },
        });

        tl.fromTo(q(".pp-fill"), { scaleY: 0 }, { scaleY: 1, duration: n - 1 }, 0);
        if (stage) tl.fromTo(stage.current, { ry2: 0 }, { ry2: (n - 1) * Math.PI * 0.75, duration: n - 1, immediateRender: false }, 0);

        for (let i = 1; i < n; i++) {
          const pos = i - 0.6;
          tl.to(nums[i - 1], { yPercent: -100, duration: 0.6, ease: "power3.inOut" }, pos)
            .to(nums[i], { yPercent: 0, duration: 0.6, ease: "power3.inOut" }, pos)
            .to(titles[i - 1], { yPercent: -110, duration: 0.3, ease: "power2.in" }, pos)
            .to(bodies[i - 1], { opacity: 0, y: -20, duration: 0.25 }, pos)
            .to(titles[i], { yPercent: 0, duration: 0.4, ease: "power3.out" }, pos + 0.25)
            .to(bodies[i], { opacity: 1, y: 0, duration: 0.3 }, pos + 0.35)
            .to(dots[i - 1], { opacity: 0.3, scale: 1, duration: 0.25 }, pos)
            .to(dots[i], { opacity: 1, scale: 1.7, duration: 0.3 }, pos + 0.25)
            .to(labels[i - 1], { opacity: 0.35, duration: 0.25 }, pos)
            .to(labels[i], { opacity: 1, duration: 0.3 }, pos + 0.25);
        }
      });
      return () => mm.revert();
    },
    { scope: ref }
  );

  return (
    <section ref={ref} className="relative border-t border-[var(--ink-10)]">
      {/* Reduced motion: a plain list, no pinning */}
      <div className="hidden px-6 py-24 motion-reduce:block sm:px-12">
        <h2 className="font-serif text-4xl font-light sm:text-5xl">{title}</h2>
        <ol className="mt-12 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map(([t, b], i) => (
            <li key={t} className="border-t border-[var(--ink-20)] pt-5">
              <span className="text-sm text-[var(--ink-50)]">{i + 1}</span>
              <h3 className="mt-3 font-serif text-2xl font-light">{t}</h3>
              <p className="mt-2 text-sm text-[var(--ink-60)]">{b}</p>
            </li>
          ))}
        </ol>
      </div>

      <div className="relative h-screen min-h-[600px] overflow-hidden motion-reduce:hidden">
        <div data-slot="pp" aria-hidden className="pointer-events-none absolute right-[10%] top-[12vh] hidden h-[76vh] w-[26vw] lg:block" />
        <p className="absolute left-6 top-[12vh] text-sm text-[var(--accent)] sm:left-12">{title}</p>

        <div className="pointer-events-none absolute left-[3vw] top-[16vh] h-[22vw] w-[70vw] overflow-hidden sm:h-[17vw]">
          {steps.map((_, i) => (
            <span
              key={i}
              aria-hidden
              className={`pp-num absolute inset-0 block font-serif text-[26vw] font-light leading-[0.85] sm:text-[20vw] ${outline}`}
            >
              {String(i + 1).padStart(2, "0")}
            </span>
          ))}
        </div>

        <div className="absolute inset-x-6 bottom-[10vh] sm:inset-x-12">
          <div className="relative h-[1.15em] overflow-hidden font-serif text-5xl font-light tracking-tight sm:text-7xl lg:text-8xl">
            {steps.map(([t], i) => (
              <h3 key={i} className="pp-title absolute inset-0 whitespace-nowrap">{t}.</h3>
            ))}
          </div>
          <div className="relative mt-5 h-20 max-w-md">
            {steps.map(([, b], i) => (
              <p key={i} className="pp-body absolute inset-0 leading-relaxed text-[var(--ink-60)]">{b}</p>
            ))}
          </div>
        </div>

        {/* Progress rail */}
        <div className="absolute right-6 top-1/2 hidden h-[44vh] -translate-y-1/2 sm:right-12 sm:block">
          <div className="relative h-full w-px bg-[var(--ink-20)]">
            <div className="pp-fill absolute inset-x-0 top-0 h-full origin-top bg-[var(--accent)]" />
            {steps.map(([t], i) => (
              <div key={i} className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2" style={{ top: `${(i / (n - 1)) * 100}%` }}>
                <span className="pp-dot block h-2.5 w-2.5 rounded-full border border-[var(--accent)] bg-[var(--accent)]" />
                <span className="pp-label absolute right-6 top-1/2 -translate-y-1/2 whitespace-nowrap text-xs text-[var(--accent)]">{t}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* Giant wordmark that fills with color as the footer comes into view */
export function BigWordmark({ word }: { word: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const cls = "text-center font-serif font-light leading-[0.8] tracking-tight text-[26vw]";

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        const q = gsap.utils.selector(ref);
        const st = { trigger: ref.current, start: "top bottom", end: "bottom 85%", scrub: 0.6 };
        gsap.fromTo(q(".wm-fill"), { clipPath: "inset(100% 0% 0% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", ease: "none", scrollTrigger: st });
        gsap.fromTo(q(".wm-line"), { yPercent: 18 }, { yPercent: 0, ease: "none", scrollTrigger: st });
      });
      return () => mm.revert();
    },
    { scope: ref }
  );

  return (
    <div ref={ref} aria-hidden className="relative select-none overflow-hidden border-t border-[var(--ink-10)] px-4 pt-20">
      <div className="wm-line relative">
        <p className={`${cls} ${outline}`}>{word}</p>
        <p className={`wm-fill ${cls} absolute inset-x-0 top-0 text-[var(--accent)]`}>{word}</p>
      </div>
    </div>
  );
}