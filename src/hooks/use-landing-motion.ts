import { useEffect, useRef } from "react";

/** Progressive enhancement: content stays visible when motion or JS is unavailable. */
export function useLandingMotion() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const root = ref.current;
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!root || !("IntersectionObserver" in window)) return;
    let observer: IntersectionObserver | undefined;
    const sections = root.querySelectorAll<HTMLElement>(
      ".workflow-grid article, .service-preview, .solution-copy, .bottom-cta",
    );
    const update = () => {
      observer?.disconnect();
      sections.forEach((section) => section.removeAttribute("data-reveal"));
      if (preference.matches) return;
      observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            entry.target.setAttribute("data-reveal", "visible");
            observer?.unobserve(entry.target);
          });
        },
        { threshold: 0.12 },
      );
      sections.forEach((section) => observer?.observe(section));
    };
    update();
    preference.addEventListener("change", update);
    return () => {
      observer?.disconnect();
      preference.removeEventListener("change", update);
    };
  }, []);
  return ref;
}
