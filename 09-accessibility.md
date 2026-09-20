# 09 — Accessibility & Inclusive Design (a11y)
## Product: ClauseIQX — Legal Document Intelligence

**Version:** 2.0  
**Audit Reference:** [ACCESSIBILITY.md](./ACCESSIBILITY.md)  
**Standard:** WCAG 2.2 Level AA  
**Status:** Implemented & Verified  

---

## 1. Accessibility Philosophy

Legal documents are complex and high-stakes. The ClauseIQX interface is built to ensure people with visual, cognitive, motor, or auditory impairments can comfortably review, understand, and navigate contract information without barriers:

- **Non-Alarmist, Non-Color-Only Indicators:** Legal "Review Points" are styled in muted warm amber tones with distinct semantic icons and text badges. Alarm red is strictly reserved for genuine application runtime errors, preventing users from mistaking a review point for an invalid contract or system failure.
- **Cognitive Clarity:** Dense legal text is paired with plain-language explanations, progressive disclosure tabs, and collapsible deep-dives.

---

## 2. WCAG 2.2 AA Implementation Checklist

| Criterion | Implementation | Verification |
|---|---|---|
| **1.4.3 Contrast (Minimum)** | Text-to-background contrast exceeds 4.5:1 (e.g., `#F1F5F9` on `#0F172A` = 13.6:1). UI controls exceed 3:1. | Automated scan & manual contrast check |
| **1.4.1 Use of Color** | Status indicators, confidence badges, and clause types pair color with visible icons and text labels (e.g., `[!] Review Point`, `[✓] Verified Citation`). | Visual & screen-reader validation |
| **2.1.1 Keyboard Navigable** | All tabs, modals, file dropzones, dropdowns, and chat inputs are accessible via <kbd>Tab</kbd>, <kbd>Enter</kbd>, <kbd>Space</kbd>, and arrow keys. | Full keyboard-only walkthrough |
| **2.4.1 Bypass Blocks** | Skip-to-content anchor link positioned at top of page, allowing keyboard users to bypass navigation bars. | Tab order testing |
| **2.4.7 Focus Visible** | High-contrast focus rings (`2px solid var(--accent)`) with focus offset on all interactive buttons, inputs, and links. | CSS focus-visible inspection |
| **2.3.3 Animation from Interactions** | CSS media query `@media (prefers-reduced-motion: reduce)` disables card entrances, floating glows, and smooth transitions. | Reduced-motion OS setting test |
| **4.1.2 Name, Role, Value** | Semantic HTML5 (`<header>`, `<nav>`, `<main>`, `<aside>`, `<footer>`, `<dialog>`) with descriptive ARIA labels on icon buttons. | Axe-Core & DOM audit |
| **4.1.3 Status Messages** | Streaming AI responses use `aria-live="polite"` so screen readers announce incoming answers without jumping focus. | VoiceOver / NVDA test |
| **2.5.5 Target Size** | Interactive buttons, tabs, and navigation items meet or exceed 44×44px touch targets on mobile devices. | Viewport & touch emulation |

---

## 3. Keyboard Navigation Shortcuts

| Key Combination | Action |
|---|---|
| <kbd>Tab</kbd> / <kbd>Shift + Tab</kbd> | Move focus forward / backward between interactive elements |
| <kbd>Enter</kbd> / <kbd>Space</kbd> | Activate button, toggle accordion, expand citation card |
| <kbd>Escape</kbd> | Close active modal, dialog, or dropdown menu |
| <kbd>Arrow Keys</kbd> | Navigate between tabs and segmented control pills |
