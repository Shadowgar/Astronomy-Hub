# LEGACY REFERENCE NOTICE

This document is retained for planning/history context only.
Active execution authority is feature-first under docs/features/*.

# UI Phase B — Visual Model

This document defines the visual and interaction expectations for Phase B: an operations-focused UI. It is concise and prescriptive — treat this as a non-negotiable visual contract.

## 1. Core Principle
- The interface is NOT a dashboard of reports. It is a command center / operational interface focused on action and situational awareness.

## 2. Signal vs Text
- Conditions = signals, not paragraphs. Surface concise, scannable facts (e.g., "Cloud: 20%", "Moon: Waxing Crescent").
- Targets = actionable objects, not list items. Each target reads as an entity and an interaction affordance (name, short context, direction).
- Alerts = signals, not descriptions. Keep titles strong; metadata is supportive and de-emphasized.
- Moon = supporting context. Provide concise summary lines that inform decisions, not long technical dumps.

## 3. Visual Priority
- Hero: dominant focal point — conveys current status and immediate directive.
- Targets: primary interaction zone — clear affordances to act or inspect.
- Conditions: quick status scan — high signal-to-noise, minimal prose.
- Alerts: secondary signals — visible but visually de-emphasized relative to hero/targets.
- Moon: tertiary support — small, contextual panel.

## 4. Panel Behavior
- Panels are visual zones with header + body rhythm, clear separators, and internal structure — not plain text containers.
- Each panel must present a short header, a compact body of signals or items, and clear affordances (buttons, links, expanders).
- Use spacing, subtle elevation, and borders to communicate grouping and hierarchy.

## 5. Anti-Patterns (Critical)
Do NOT ship interfaces that match any of the following:
- Label-heavy rows that read like field dumps ("category: X", "start_time: Y").
- Paragraph-heavy panels intended for reading — panels must be scannable at a glance.
- "Data report" UI where raw contract keys and full payloads are shown to users.
- Stacked card dashboards with equal weight for every module — the hero and action zones must dominate.

## 6. Interaction Model
- Targets must feel selectable: visual hover/pressed affordance, concise context, clear next action.
- Alerts must feel like signals: bold title, muted metadata, action to inspect or acknowledge.
- Hero must feel directive: a clear status indicator, short plan/summary, top recommendation, and a primary action.

Adhere strictly: these rules are design constraints for Phase B visuals. Any deviation must be explicitly reviewed and approved.
