# UI/UX Design Specification
## Product: ClauseIQX

**Version:** 2.0 (Final Merged)
**Design objective:** Make complex legal information understandable without creating false confidence.

---

## 1. UX Principles

1. **Explain, don't decide.** Use: "This clause says…", "A practical point to review is…", "You may want to ask a lawyer…". Avoid: "You should definitely…", "This is illegal.", "You will win.", "You do not need a lawyer."
2. **Evidence before interpretation.** Every important AI explanation exposes a source reference; nothing is presented as a bare, unattributed fact.
3. **Progressive disclosure.** Show the simplified explanation first; let the user drill into the exact source clause.
4. **Uncertainty is visible.** Never hide uncertainty behind a numeric confidence score alone — say what's unclear in words.
5. **Calm visual language.** Not every flagged clause should look like an emergency; reserve alarming visual treatment for genuine system errors, not legal review points.

---

## 2. Information Architecture

```text
Home
 ├─ New Review
 │    ├─ Upload Document
 │    ├─ Document Details
 │    └─ Processing
 ├─ Projects
 │    ├─ Overview (Summary)
 │    ├─ Clauses (filterable explorer)
 │    ├─ Review Points
 │    ├─ Key Dates
 │    ├─ Ask (Q&A)
 │    ├─ Compare
 │    ├─ Lawyer Prep
 │    └─ Export
 ├─ Privacy & Data
 ├─ Help / Safety
 └─ Account
```

---

## 3. Main Dashboard

**Header:** product name · New Review · Projects · Privacy · Account.

**Hero:**
> **Understand your legal documents more clearly.**
> Upload a document to get a plain-language explanation, key clauses, questions, and review points. This tool provides legal information, not professional legal advice.

Primary CTA: **Start a document review** · Secondary CTA: **Compare two documents**

Project cards show: document count, last activity, and an "open review points" count (neutral badge styling, not a danger indicator).

---

## 4. Upload Screen

Components: drag/drop zone, browse button, accepted formats + size/page limit shown inline (not just on error), optional jurisdiction selector, optional document-type selector, privacy statement:

> Your document is private to your account. We process it to provide the requested analysis. Review the retention and deletion controls before continuing.

If jurisdiction is skipped: store **"unknown"**, never guess.

Validation errors must explain plainly: unsupported type, file too large, corrupted file, page limit exceeded, scan required/failed — never expose parser internals.

Upload progress uses staged, honest status text (not a fake percentage): **Secure upload → Security check → Read document → Organize sections → Prepare analysis.**

If processing fails: plain-language explanation, retry option, delete option, and a request ID preserved for support (without exposing internals).

---

## 5. Document Overview (Summary Tab)

```text
------------------------------------------------
Document name                    [Compare] [Export]
Jurisdiction | Type | Pages
------------------------------------------------
[Contextual notice] This is informational, not legal advice.

Summary
Plain-language overview, short paragraphs + bullets.
"Payment is due within 30 days of invoice." [Source: p. 4]

Key points
[card] Payment  [card] Term  [card] Termination  [card] Liability

Review points
[Informational]  [Worth reviewing]  [Worth a closer look]

Key dates
...

[Ask a question →]
------------------------------------------------
```

Clicking a source link opens the document viewer at the exact location (page + highlighted passage).

---

## 6. Clause Explorer

Two-pane desktop layout (source viewer stacked below/beside the explanation on mobile):

```text
Left: clause list, filterable by:
 All | Obligations | Rights | Dates | Money | Termination | Liability | Privacy | Disputes | Review points

Right: [Category] Termination
 Plain language: ...
 Who is affected: ...
 What triggers it: ...
 Potential practical significance: ...
 Source: [Open on page 7]
```

---

## 7. Review Points (not "Risk Flags")

Never rely on red/yellow/green alone — always **text label + icon + pattern**.

Example card:
> **Worth a closer look — Broad indemnity**
> "Review this provision carefully — it appears to require one party to cover a broad range of claims or losses."
> *Why this was flagged* → *Exact source* → *What information is missing* → *Questions for a lawyer*

Every card includes: *"This is a review prompt generated from the document, not a legal conclusion."*

---

## 8. Ask (Q&A)

Chat layout: user question → AI answer → evidence cards → limitations → follow-up suggestions.

**Answer structure:**
```text
Short answer
What the document says
Source: Clause 8.2, page 6
What is not clear
Questions you could ask a lawyer
```

**Abstention / unsupported question:**
> "I can't reliably answer that from the document alone. The answer may depend on jurisdiction and facts that aren't available here."
> — followed by useful next steps, never a dead end.

**High-stakes question** (e.g. "will I win," "is this legal"): show a contextual warning, then what the document says, what remains unknown, and questions/facts to take to a professional. Never terminate with a bare refusal.

Streaming responses: no focus jumps; concise status updates via an `aria-live` region.

---

## 9. Compare Screen

Header: **Document A vs Document B** (never "old/new" unless the user explicitly designates versions — don't infer chronology from upload order).

Summary strip: e.g. "7 material changes · 3 obligation changes · 2 date changes · 1 new termination provision."

Diff view:
```text
DOCUMENT A                         DOCUMENT B
"...30 days..."                    "...14 days..."

Why this may matter:
"Notice period changed from 30 to 14 days."
Source: A p.3 · B p.3
```

Filters: All · Material · Dates · Money · Obligations · Liability · Termination · Privacy.

Mobile: defaults to a list-of-changes view rather than side-by-side panes (also the accessible alternative for screen-reader/low-vision/cognitive accessibility — always available, not mobile-only).

---

## 10. Lawyer Prep Screen

Purpose: help the user have a more efficient professional consultation — **never** represented as a legal case assessment.

Sections: situation summary → documents reviewed → key clauses → important dates → facts still needed → questions for lawyer → user notes. Fully editable before export.

---

## 11. Disclaimer Design

Not footer-only. Shown contextually at: onboarding, first analysis, high-stakes question, export.

> "This tool provides general legal information and document analysis. It is not a lawyer and does not provide legal advice. For decisions that could materially affect your rights, finances, safety, immigration status, employment, housing, or legal proceedings, consider consulting a qualified legal professional."

---

## 12. Design System

### 12.1 Color Palette (contrast-checked)
| Token | Hex | Usage | Contrast |
|---|---|---|---|
| `--color-bg` | #FAFAF8 | App background | — |
| `--color-surface` | #FFFFFF | Cards/panels | — |
| `--color-text-primary` | #1F2430 | Body text | 13.6:1 on bg |
| `--color-text-secondary` | #545B6B | Secondary text | 5.8:1 on bg |
| `--color-primary` | #2C5F6F | Primary actions | 5.1:1 on white |
| `--color-obligation` | #3E6E5B | Obligation tag (+icon, never color-only) | — |
| `--color-review` | #8A5A2B | Review-point tag, muted amber-brown, never alarm red (+icon) | — |
| `--color-deadline` | #4A5B8C | Deadline tag (+icon) | — |
| `--color-danger-real` | #B3261E | Reserved only for genuine system errors — never for legal review points | 4.6:1 on white |

*Rationale:* legal review points deliberately avoid red/error styling so users don't conflate "worth reviewing" with "system error" or "this is illegal."

### 12.2 Typography
Humanist sans-serif (e.g., Inter) for UI/plain-language content, 16px base, 1.5 line-height minimum. Source-document rendering may preserve native formatting (via PDF.js) to visually distinguish "their words" from "our explanation."

### 12.3 Spacing
8px base scale (8/16/24/32/48). Two-pane layouts collapse to tabbed single-column under 768px.

### 12.4 Components (build once, reuse — no one-off styles)
Button, Input, Select, FileDropzone, Alert, Badge, Card, Tabs, Accordion, Modal, Drawer, Tooltip, SourceCitation, ConfidenceBadge, DocumentViewer, ChatMessage, DiffViewer, EmptyState, ErrorState, LoadingState.

### 12.5 Iconography
Every semantic icon paired with a visible text label at first use, and a tooltip elsewhere — never icon-only for meaning-bearing indicators.

---

## 13. Interaction Patterns & Error States

Every page needs: loading state, empty state, permission error, not-found, processing state, AI-unavailable state, retry, and deletion confirmation.

- Loading: skeletons + staged progress text for anything >3s, never a bare spinner with no context, never a fake percentage.
- Empty states: one explanatory sentence + a primary CTA.
- Errors: human-readable, never raw technical detail.
- Deletion confirmation: identifies what will be deleted without revealing unnecessary document contents; final account deletion requires typed confirmation.
- Undo-friendly: deleting a single document shows a brief undo toast before permanent removal.

---

## 14. Accessibility (WCAG 2.2 AA)

- Full keyboard operability, visible focus, skip-to-content link, logical tab order.
- Semantic landmarks (header/nav/main/aside/footer) and proper heading hierarchy.
- Severity/confidence communicated via text + icon + label, color is a supplement only.
- Focus never removed without a replacement target.
- `prefers-reduced-motion` respected.
- Minimum comfortable reading size and line height; contrast ratios per TRD §11.
- AI streaming content: `aria-live="polite"`, announced without causing focus jumps.
- Diff viewer's list-of-changes view is a first-class accessible alternative, not an afterthought.
- Minimum 44×44px touch targets on mobile.

---

## 15. Responsive Design

- **Mobile priority order:** Summary → Review Points → Key Dates → Ask → Source.
- **Tablet:** two-column layouts where space permits.
- **Desktop:** document viewer + analysis pane side by side.

---

## 16. UX Acceptance Criteria

- A first-time user understands the product's purpose within 10 seconds.
- Users find the document summary without excessive scrolling.
- Every material AI claim traces to source evidence.
- A user can find how to delete their document within two clicks from the project view.
- Review-point labels never imply a legal conclusion (spot-checked in copy review).
- All core workflows work with keyboard navigation only.
- Screen-reader testing finds no blocking defects.

---

## 17. Frontend Design System & Live Deployment

- **Design System Implementation**: Built using modern Vanilla CSS tokens, dark mode palette, glassmorphic UI card depth, smooth micro-animations, and responsive layouts.
- **Production Build & Hosting**: Exported statically via Next.js Turbopack and deployed to **Firebase Hosting**.
- **Live URL**: [https://clauseiqx.web.app](https://clauseiqx.web.app)
- **Deployment Script**: `npm run deploy`

