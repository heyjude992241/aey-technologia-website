"use client";

import { useEffect } from "react";

export default function SectionSnap() {
  useEffect(() => {
    let snapTimer = 0;

    const snapToNearestSection = () => {
      const sections = Array.from(
        document.querySelectorAll<HTMLElement>(".launch-scene, .what-we-do, .contact-section"),
      );
      if (sections.length === 0) {
        return;
      }

      const currentPosition = window.scrollY;
      const nearestSection = sections.reduce((nearest, section) =>
        Math.abs(section.offsetTop - currentPosition) < Math.abs(nearest.offsetTop - currentPosition)
          ? section
          : nearest,
      );
      const targetPosition = nearestSection.offsetTop;

      if (Math.abs(targetPosition - currentPosition) < 2) {
        return;
      }

      window.scrollTo({
        top: targetPosition,
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
      });
    };

    const handleScroll = () => {
      window.clearTimeout(snapTimer);
      snapTimer = window.setTimeout(snapToNearestSection, 140);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.clearTimeout(snapTimer);
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return null;
}
