import { useEffect } from 'react';

/**
 * Observes every `.reveal` element on the page and adds `.is-visible` when it
 * enters the viewport. Elements are revealed immediately when the user prefers
 * reduced motion.
 */
export function useReveal(): void {
  useEffect(() => {
    const nodes = Array.from(document.querySelectorAll<HTMLElement>('.reveal'));

    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;

    if (prefersReducedMotion || typeof IntersectionObserver === 'undefined') {
      nodes.forEach((node) => node.classList.add('is-visible'));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -6% 0px' },
    );

    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, []);
}
