---
name: Calculator Compliance Matrix
description: Exact UGC point values, thresholds, and rules implemented in the three faculty calculators (API legacy, CAS Promotion, Research Score). Source of truth for future edits.
type: feature
---

# Calculator Compliance Matrix

Source: TOOL ACCURACY audit (team review, June 2026) + UGC Regulations 2010 (4th Amendment 2016) + UGC Regulations 2018, Appendix II Table 2.

## Tool 1 — API Score Calculator (Legacy)
File: `src/pages/tools/APIScoreCalculator.tsx`
Framework: **UGC 2010 (4th Amendment, 2016)** — kept ONLY for pre-2018 / arrears cases.

- Category I (max 125): Lectures (50, formula hours÷7.5 Asst / ÷7.75 Assoc-Prof), Excess teaching (10), Prep (20), Innovative methodology (20), **Examination duties = 25** (not 10).
- Category II (max 50): Student/extension (25), **Corporate/governance = 15** (separated from admin), Professional dev (15). **Awards REMOVED from Cat II → moved to Cat III.**
- Category III: per-item caps REMOVED (UGC restrictions are %-based on aggregate, not item caps). Includes journals, books, projects, guidance, training, **Awards (relocated)**.
- Authorship multiplier (Cat III publications only): sole = 1.00 · first/principal = 0.70 · co = 0.30/(N-1).
- Warn when Cat II < 15 (mandatory minimum after Awards reclassification).

## Tool 2 — CAS Promotion Eligibility Checker
File: `src/pages/tools/PromotionChecker.tsx`
Framework: **UGC Regulations, 2018** (standalone — NOT "4th Amendment"; never label it as such).

Cat I/II numerical API scores ABOLISHED; replaced by APAR Grading Grid (Excellent/Good/Satisfactory/Unsatisfactory).

- **Stage 1 → 2 (AL10→AL11)**: APAR Good/Sat in 3/4 yrs · years-in-post by qualification (PhD 4, M.Phil/PG 5, Master's 6) · Orientation **21 days** (not 28) · ≥1 publication in assessment period.
- **Stage 2 → 3 (AL11→AL12)**: APAR 4/5 · 5 yrs at AL11 · pubs: University = 3, College = 2 · PhD MANDATORY for University Teachers, desirable for College · 2 Refresher/FDP (2 wk / 10 days each).
- **Stage 3 → Associate (AL12→AL13A)**: APAR 2/3 · 3 yrs at AL12 · Total Research Score ≥ **70** (Appendix II Table 2) · 1 Refresher / RM Workshop.
- **Associate → Professor (AL13A→AL14)**: APAR 2/3 · 3 yrs as Associate · Total Research Score ≥ **120** · 10 pubs total with **≥3 in current assessment period**.

## Tool 3 — Research Score Calculator
File: `src/pages/tools/ResearchScoreCalculator.tsx`
Framework: **UGC 2018, Appendix II, Table 2**.

- Faculty base (per paper): Sciences/Engg/Medical = **8** · Humanities/Arts/SocSci = **10**.
- Impact-factor augmentation (added to base): No IF +5 · <1 +10 · 1–2 +15 · 2–5 +20 · 5–10 +25 · >10 +30.
- Authorship: sole ×1.0 · 2 authors ×0.7 (each) · >2 first/principal ×0.7 · >2 joint ×0.3 (each joint author).
- Books: Authored Intl **12** · National **10** · Chapter **5**.
- Projects (₹10 L threshold, NOT 5 L): Completed >10L **10** · <10L **5** · Ongoing >10L **5** · <10L **2** · Consultancy **3**.
- Guidance: PhD awarded sole **10** · PhD joint **7** (70% of 10) · Thesis submitted **5** · M.Phil/PG dissertation **2**.
- Patents: International **10** · National **7**.
- Conference proceedings live under Cat 6 (not Publications).
- **30% cap rule**: combined Cat 5(b) + Cat 6 ≤ 30% of final total. Implementation: if cappableRaw > 0.30 × (uncapped + cappableRaw), then allowedCap = (3/7) × uncapped.
- **3-of-6 categories minimum**: warn (don't suppress total) when score sourced from <3 categories.

## Shared
- `src/lib/ugcRegulations.ts` — SINGLE SOURCE OF TRUTH for thresholds, doc URLs, draft-2025 highlights, regime cutoff (18-Jul-2018). All tools must import constants from here instead of hardcoding.
- `src/components/tools/APARGradingGrid.tsx` — per-year dropdown grid.
- `src/components/tools/RegulationDisclaimer.tsx` — framework-aware legal disclaimer; mounted on all three tools.
- `src/components/tools/Draft2025Notice.tsx` — collapsible "Draft 2025 — NOT yet notified" advisory; mounted on all three tools + summary page at `/regulations/draft-2025`.
- `src/components/tools/RegimeSelector.tsx` — wizard on PromotionChecker that recommends API (2010/2016) vs Research Score (2018) using `recommendRegime()`.
- `src/components/tools/FDPTracker.tsx` — orientation/refresher/FDP log with per-stage validation (FDP_REQUIREMENTS).
- Never silently change point values without updating this memory AND `ugcRegulations.ts`.

## Draft UGC Regulations 2025 (awareness only)
- Released 6-Jan-2025 by MoE for public feedback. NOT YET NOTIFIED.
- Current calculators continue to use 2010/2016 and 2018 math; Draft 2025 surfaces only as awareness panels.
- Key proposed shifts: API retired → "Notable Contributions"; NET optional for ME/MTech; notional/contractual service counts; discipline-agnostic recruitment; expanded VC eligibility.
- Switch tool math to Draft-2025 ONLY after Gazette notification.

## UGC-CARE List (Feb 2024)
- UGC withdrew the UGC-CARE List in Feb 2024 and discontinued ugccare.unipune.ac.in.
- Journal Quality Checker must surface a "post-CARE" notice and route users to Scopus / WoS / ABDC as authoritative sources.
- Replacement "UGC Reference List of Quality Journals" still pending.

