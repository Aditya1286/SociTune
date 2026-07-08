import { useEffect, useState } from "react";
import type { Transition, Variants } from "framer-motion";

// ─── Reduced Motion ───────────────────────────────────────────────────────────

export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  return reduced;
}

// ─── Spring Presets ───────────────────────────────────────────────────────────

/** Standard UI spring — fast settle, no wobble */
export const spring: Transition = {
  type: "spring",
  stiffness: 340,
  damping: 30,
};

/** Snappy spring for buttons and chips */
export const springSnappy: Transition = {
  type: "spring",
  stiffness: 420,
  damping: 28,
};

/** Smooth spring for layout morphs (layoutId, poster) */
export const springLayout: Transition = {
  type: "spring",
  stiffness: 260,
  damping: 32,
};

/** Gentle spring for progress bar fill */
export const springProgress: Transition = {
  type: "spring",
  stiffness: 55,
  damping: 20,
};

/** Dialog / modal spring — slightly heavier settle */
export const springModal: Transition = {
  type: "spring",
  stiffness: 300,
  damping: 34,
};

// ─── Standard Animation Variants ─────────────────────────────────────────────

/** Fade + scale from 0.96 — the "no-pop-in" standard */
export const fadeScale: Variants = {
  hidden: { opacity: 0, scale: 0.96 },
  visible: { opacity: 1, scale: 1, transition: spring },
  exit: { opacity: 0, scale: 0.96, transition: { ...spring, duration: 0.15 } },
};

/** Spring slide from right */
export const slideFromRight: Variants = {
  hidden: { opacity: 0, x: 24 },
  visible: { opacity: 1, x: 0, transition: spring },
  exit: { opacity: 0, x: -24, transition: spring },
};

/** Spring slide from left */
export const slideFromLeft: Variants = {
  hidden: { opacity: 0, x: -24 },
  visible: { opacity: 1, x: 0, transition: spring },
  exit: { opacity: 0, x: 24, transition: spring },
};

/** Fade only — for reduced-motion fallback */
export const fadeOnly: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.15 } },
};

/** Spring up from y: 8 */
export const springUp: Variants = {
  hidden: { opacity: 0, y: 8, scale: 0.97 },
  visible: { opacity: 1, y: 0, scale: 1, transition: spring },
  exit: { opacity: 0, y: -6, scale: 0.97, transition: { ...spring, duration: 0.15 } },
};

// ─── Stagger Helpers ──────────────────────────────────────────────────────────

/** Container variants for staggered children */
export const staggerContainer = (staggerMs = 35): Variants => ({
  hidden: {},
  visible: {
    transition: {
      staggerChildren: staggerMs / 1000,
      delayChildren: 0.05,
    },
  },
});

/** Child item for stagger lists */
export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 8, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: spring,
  },
  exit: {
    opacity: 0,
    y: -4,
    scale: 0.95,
    transition: { ...spring, duration: 0.18 },
  },
};

// ─── Utility: pick variant set based on reduced-motion preference ─────────────

export function motionVariants(
  full: Variants,
  reduced: Variants = fadeOnly
): (isReduced: boolean) => Variants {
  return (isReduced) => (isReduced ? reduced : full);
}
