import { Link } from 'react-router-dom';
import { ArrowRight, Gauge, MousePointerClick, Network } from 'lucide-react';
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
        className="absolute inset-0 bg-primary-dark/60 lg:bg-primary-dark/25"
      />
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-r from-primary-dark via-primary-dark/85 to-transparent"
      />

      <div className="relative mx-auto flex min-h-[600px] max-w-7xl flex-col justify-center px-4 py-16 sm:px-6 lg:min-h-[620px] lg:px-8">
        <div className="max-w-2xl">
          <p className="inline-flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.22em] text-white/85">
            <span aria-hidden className="h-0.5 w-8 bg-accent" />
            From Yarn to the World
          </p>

          <h1 className="mt-5 font-display text-4xl font-extrabold leading-[1.08] tracking-tight text-white sm:text-5xl lg:text-6xl">
            Textile Manufacturing <span className="text-accent">System</span>
          </h1>

          <p className="mt-5 max-w-xl text-base leading-relaxed text-white/85 sm:text-lg">
            Digitally manage your entire textile production from raw material to
            delivery.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
            <Link to="/signin" className={buttonClass('primary', 'lg')}>
              Get Started
              <ArrowRight aria-hidden className="size-4" />
            </Link>
            <a href="#features" className={buttonClass('onDarkOutline', 'lg')}>
              Explore Features
            </a>
          </div>

          <ul className="mt-12 grid max-w-2xl gap-6 sm:grid-cols-3">
            {DEMO_HERO_BENEFITS.map((benefit) => {
              const Icon = HERO_ICONS[benefit.icon];
              return (
                <li key={benefit.id} className="flex items-start gap-3">
                  <span className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-lg border border-white/25 bg-white/10 text-white">
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

        <div className="pointer-events-none absolute bottom-8 right-8 hidden max-w-xs rounded-lg border border-white/25 bg-primary-dark/60 px-5 py-4 backdrop-blur-sm xl:block">
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
