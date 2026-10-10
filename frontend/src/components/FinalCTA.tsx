import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { buttonClass } from './ui/Button';

export function FinalCTA() {
  return (
    <section
      id="contact"
      className="textile-pattern relative scroll-mt-24 overflow-hidden bg-primary-dark py-20 lg:py-24"
    >
      <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
        <div className="reveal mx-auto max-w-3xl">
          <p className="inline-flex items-center gap-2.5 text-xs font-semibold uppercase tracking-[0.18em] text-accent">
            <span aria-hidden className="h-0.5 w-7 bg-accent" />
            Get Started
          </p>
          <h2 className="mt-4 font-display text-3xl font-extrabold tracking-tight text-white lg:text-4xl">
            Ready to Digitize Your Textile Operations?
          </h2>
          <p className="mt-4 text-base leading-relaxed text-white/80 lg:text-lg">
            Bring your factory workflows together and gain clearer visibility
            from yarn receipt to final delivery.
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
            <Link to="/signin" className={buttonClass('onDark', 'lg')}>
              Get Started
              <ArrowRight aria-hidden className="size-4" />
            </Link>
            <a href="#contact-details" className={buttonClass('onDarkOutline', 'lg')}>
              Contact Us
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
