UI Phase B — Layout Blueprint

Purpose
- A precise, renderable layout specification for Phase B (command-center UI). Use this as the authoritative blueprint for programmatic UI reconstruction.

1) EXACT PAGE STRUCTURE (ASCII)

Header (full width)
┌──────────────────────────────────────────────────────────────────────────────────────────────┐
│ HEADER: left=logo/title | center=location controls | right=mode selector                 │
└──────────────────────────────────────────────────────────────────────────────────────────────┘

Primary Panel (Hero, full width)
┌──────────────────────────────────────────────────────────────────────────────────────────────┐
│ PRIMARY PANEL: status | summary (center) | recommendation/action                         │
│  [status 20%] [summary 60%] [recommendation/action 20%]                                     │
└──────────────────────────────────────────────────────────────────────────────────────────────┘

Row 1 (two equal columns)
┌──────────────────────────────────────────────────────────────────────────────────────────────┐
│ CONDITIONS (left)                          │ RECOMMENDED TARGETS (right)                 │
│  - header                                   │  - header                                   │
│  - dense signal rows                         │  - compact selectable list rows             │
└──────────────────────────────────────────────────────────────────────────────────────────────┘

Row 2 (two equal columns)
┌──────────────────────────────────────────────────────────────────────────────────────────────┐
│ ALERTS / EVENTS (left)                     │ SATELLITE PASSES (right)                    │
│  - header                                   │  - header                                   │
│  - bold signal titles                        │  - compact path / visibility rows           │
└──────────────────────────────────────────────────────────────────────────────────────────────┘

Row 3 (small supporting panel)
┌──────────────────────────────────────────────────────────────────────────────────────────────┐
│ MOON SUMMARY (small full-width or centered small-panel)                                     │
│  - one-line summary with darkness window and short note                                     │
└──────────────────────────────────────────────────────────────────────────────────────────────┘

Notes:
- Page width: center container max-width = 1600px. Desktop viewport layout uses the two-column grid for rows 1 & 2.
- Panels are grouped visually as `panel` surfaces (rounded corners, subtle elevation, 1px border).

2) PANEL COMPOSITION RULES

General panel composition
- Each panel = HEADER + BODY.
  - HEADER: single-line title on left, small control cluster on right (stale badge / retry / small menu).
  - BODY: stacked compact rows or short signal lines; no paragraphs.
- Internal spacing: header -> body gap = 8px; body row gap = 8–12px.
- Borders & elevation: panel background = surface-bg; border = 1px solid surface-border; radius = 8–10px; subtle shadow.

Primary Panel (Hero)
- Full-width, visually dominant: larger padding (approx 20px), rounded corners, stronger shadow.
- Internal horizontal layout with three regions and suggested proportional widths:
  - Left (status): 18–22% width, contains a concise status token (e.g., "TONIGHT: GOOD").
  - Center (summary): 56–64% width, includes a short title and single-line summary (max 2 lines) and darkness window line.
  - Right (recommendation/action): 16–22% width, contains top recommended target brief and a primary CTA button.
- All hero elements are signals/affordances (no free-form paragraphs).

Conditions panel
- Header: "Conditions"
- Body: rows for Location, Cloud cover, Moon, Best darkness, Summary (single-line summary only).
- Row density: compact; each row is a short label + value in one line.

Recommended Targets panel
- Header: "Recommended Targets"
- Body: compact selectable rows (max 5 visible): each row contains
  - Primary line: `Name` (prominent)
  - Secondary line: `Category · Direction` (muted)
- Row interaction: hover highlight, subtle chevron or expansion affordance for details.

Alerts / Events panel
- Header: "Alerts / Events"
- Body: ordered signals; each entry:
  - Title (bold)
  - Muted metadata line (category · relevance · priority)
  - Short summary (single sentence or one-line) optionally present
- Alerts are signals; favor presence/ack actions over long narrative.

Satellite Passes panel
- Header: "Satellite Passes"
- Body: compact rows each with:
  - Name (prominent)
  - Visible: (visibility)
  - Peak elevation: (degrees)
  - Path: start → end
- Keep rows short and scannable.

Moon panel
- Small supporting panel that contains a single short sentence: e.g. "Waxing Crescent — Peak darkness 01:04 – 03:12. Notes: …"

3) DENSITY RULES (strict)
- No large empty panels. If a panel has little content, reduce vertical padding and/or introduce subtle placeholder signal rows.
- No paragraphs inside panels. Text should be single-line signals or at most two-line summaries.
- Rows must be compact: vertical spacing between related rows = 8–12px. Avoid >18px for related zones.
- Keep controls small and unobtrusive; prioritize content density.

4) SURFACE HIERARCHY
- Page (canvas): full-bleed background color.
- Panel (surface): rounded rectangle, 1px border, subtle elevation. Panels are the primary grouping primitives.
- Inner rows: compact horizontal strips inside panels; use subtle separators only when necessary.

5) VISUAL LANGUAGE
- Clean, GitHub-style clarity: restrained typography, clear spacing, muted metadata, bright affordances when interactive.
- Command-center density: tighter vertical rhythm, clear focal hero, balanced two-column operational rows, and small supporting panels.
- Color usage: use tokens for surfaces, dividers, and muted text. Avoid decorative flourishes; use hierarchy, spacing, and subtle elevation.

Implementation hints for an AI renderer
- Build a centered container (max-width 1600px) with rows as defined.
- Render panels as rounded surfaces with internal `header` and `body` zones.
- Enforce the hero column widths precisely (left ~20%, center ~60%, right ~20%).
- Ensure each data row renders as `label` + `value` on a single line, with the label visually bold or semibold and the value regular/muted.
- For empty-state panels, show 1–2 muted placeholder signal lines instead of blank space.

This blueprint should enable a deterministic visual reconstruction of Phase B's command-center UI.
