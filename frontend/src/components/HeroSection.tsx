import { Link } from 'react-router-dom';
import { ArrowRight, Gauge, MousePointerClick, Network, Play } from 'lucide-react';
import { buttonClass } from './ui/Button';
import { DEMO_HERO_BENEFITS } from '../constants/demoData';

const HERO_ICONS = {
  pointer: MousePointerClick,
  gauge: Gauge,
  network: Network,
} as const;

export function HeroSection() {
  return (
    <section id="home" className="relative isolate scroll-mt-24 overflow-hidden bg-primary-dark">
      <img
        src="/images/hero-spinning-mill.jpg"
        alt="Spinning hall of a textile mill with long rows of yarn machines and a worker in protective clothing"
        className="absolute inset-0 h-full w-full object-cover object-center"
        loading="eager"
        decoding="async"
      />
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-r from-primary-dark/95 via-primary-dark/80 to-primary-dark/10"
      />
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-r from-primary-dark/60 to-transparent"
      />

      <div className="relative mx-auto flex min-h-[540px] max-w-7xl flex-col justify-center px-4 py-16 sm:px-6 lg:min-h-[560px] lg:px-8">
        <div className="max-w-[38rem]">
          <p className="inline-flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.22em] text-white/90">
            <span aria-hidden className="h-0.5 w-8 bg-accent" />
            FROM YARN TO THE WORLD
          </p>

          <h1 className="mt-5 font-display text-[clamp(2.5rem,5.4vw,4rem)] font-extrabold leading-[1.08] tracking-tight text-white">
            Textile Manufacturing
            <span className="text-accent"> System</span>
          </h1>

          <p className="mt-5 max-w-xl text-base leading-relaxed text-white/85 sm:text-lg">
            Digitally manage your entire textile production from raw material to delivery.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
            <Link to="/signup" className={buttonClass('primary', 'lg')}>
              Get Started
              <ArrowRight aria-hidden className="size-4" />
            </Link>
            <a href="#features" className={buttonClass('onDarkOutline', 'lg')}>
              <Play aria-hidden className="size-4" />
              Watch Video
            </a>
          </div>

          <ul className="mt-10 grid max-w-2xl gap-5 sm:grid-cols-3">
            {DEMO_HERO_BENEFITS.map((benefit) => {
              const Icon = HERO_ICONS[benefit.icon];
              return (
                <li key={benefit.id} className="flex items-start gap-3">
                  <span className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-lg border border-white/20 bg-white/10 text-white">
                    <Icon aria-hidden className="size-5" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-white">
                      {benefit.title}
                    </p>
                    <p className="mt-0.5 text-sm leading-snug text-white/75">
                      {benefit.description}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="pointer-events-none absolute bottom-8 right-8 hidden max-w-xs rounded-xl border border-white/20 bg-white/10 px-5 py-4 backdrop-blur-sm xl:block">
          <p className="font-display text-sm font-bold text-white">
            Modern Textile Manufacturing
          </p>
          <p className="mt-1.5 text-xs leading-relaxed text-white/80">
            Spinning · Weaving · Dyeing · Quality · Dispatch
          </p>
        </div>
      </div>
    </section>
  );
}
