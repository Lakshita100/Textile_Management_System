import { useEffect, useState } from 'react';

/**
 * Tracks which page section is currently in view so the navigation can show a
 * clear active state. Pass a stable array reference (module-level constant).
 */
export function useScrollSpy(ids: string[], offset = 140): string {
  const [activeId, setActiveId] = useState<string>(ids[0] ?? '');

  useEffect(() => {
    const computeActive = () => {
      const position = window.scrollY + offset;
      let current = ids[0] ?? '';

      for (const id of ids) {
        const element = document.getElementById(id);
        if (!element) continue;
        const top = element.getBoundingClientRect().top + window.scrollY;
        if (top <= position) current = id;
      }

      const reachedBottom =
        window.innerHeight + window.scrollY >=
        document.documentElement.scrollHeight - 8;
      if (reachedBottom) current = ids[ids.length - 1] ?? current;

      setActiveId(current);
    };

    computeActive();
    window.addEventListener('scroll', computeActive, { passive: true });
    window.addEventListener('resize', computeActive);
    return () => {
      window.removeEventListener('scroll', computeActive);
      window.removeEventListener('resize', computeActive);
    };
  }, [ids, offset]);

  return activeId;
}
