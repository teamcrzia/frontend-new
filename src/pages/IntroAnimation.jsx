import { useEffect, useState } from "react";
import { BookOpen, PenTool, Code, Briefcase, Heart, Zap } from "lucide-react";
import "../styles/IntroAnimation.css";

// 🔥 Signature moment: the app's modes (Study, Content, Code, Career,
// Emotion) converge from the edges and fuse into the single Zap mark
// at center — "one AI, every mode of thinking."
//
// Plays once per real page load (refresh, new tab, or right after
// login/signup/onboarding redirects into /chat) — but NOT when the
// user navigates away to another page (e.g. /settings) and back via
// React Router, since that's just a client-side route change and
// doesn't reload the page.
//
// This works because `hasPlayedThisPageLoad` is a plain module-level
// variable, not React state or sessionStorage. A JS module only
// re-executes (resetting this back to false) on an actual page load —
// SPA route navigation never touches it.
let hasPlayedThisPageLoad = false;

const orbitingIcons = [
  { Icon: BookOpen, className: "orbit-1" },
  { Icon: PenTool, className: "orbit-2" },
  { Icon: Code, className: "orbit-3" },
  { Icon: Briefcase, className: "orbit-4" },
  { Icon: Heart, className: "orbit-5" },
];

const IntroAnimation = ({ theme = "dark" }) => {
  const [visible, setVisible] = useState(() => !hasPlayedThisPageLoad);
  const [exiting, setExiting] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    if (!visible) return;

    hasPlayedThisPageLoad = true;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    setReducedMotion(prefersReducedMotion);

    const holdTime = prefersReducedMotion ? 200 : 2400;
    const exitTime = prefersReducedMotion ? 200 : 500;

    const startExit = setTimeout(() => setExiting(true), holdTime);
    const finish = setTimeout(() => setVisible(false), holdTime + exitTime);

    return () => {
      clearTimeout(startExit);
      clearTimeout(finish);
    };
  }, [visible]);

  if (!visible) return null;

  return (
    <div className={`intro-overlay ${theme} ${exiting ? "intro-exit" : ""}`}>
      {!reducedMotion && (
        <div className="intro-orbit-field">
          {orbitingIcons.map(({ Icon, className }) => (
            <div key={className} className={`intro-orbit-icon ${className}`}>
              <Icon size={20} strokeWidth={2} />
            </div>
          ))}
        </div>
      )}

      <div className="intro-fusion-flash" />

      <div className="intro-mark">
        <Zap size={60} fill="currentColor" />
      </div>
    </div>
  );
};

export default IntroAnimation;