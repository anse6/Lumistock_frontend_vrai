import { useEffect, useRef } from 'react';

/**
 * A custom hook that uses IntersectionObserver to add a "revealed" class 
 * to elements when they enter the viewport.
 */
export const useScrollReveal = (threshold = 0.1) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('revealed');
          }
        });
      },
      { threshold }
    );

    const elements = containerRef.current?.querySelectorAll('.reveal-on-scroll');
    elements?.forEach((el) => observer.observe(el));

    return () => {
      elements?.forEach((el) => observer.unobserve(el));
    };
  }, [threshold]);

  return containerRef;
};
