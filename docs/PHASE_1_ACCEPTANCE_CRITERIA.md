# Phase 1 Acceptance Criteria

Phase 1 is complete only when all of the following are true.

## Core Access
- Astronomy Hub can be opened from the intended local project environment
- Phase 1 docs exist and match implemented behavior
- The app runs locally without requiring Raspberry Pi deployment

## Location
- Default: the system uses the ORAS Observatory preset when no override is provided
- User may optionally enter manual latitude/longitude coordinates to override the Active Observing Location for the current session only
- Disallowed for Phase 1: browser geolocation, map pickers, reverse geocoding, saved locations, account-based preferences, or a location database
- Location state (default or manual override) updates the displayed dashboard data
 - Functional inputs for manual override (Phase 1): `latitude` (required), `longitude` (required), `elevation_ft` (optional)
 - Phase 1 explicitly excludes address search/autocomplete and external geocoding APIs (these are deferred to a later phase)

## Dashboard Behavior
- Dashboard loads without overwhelming the user
- Primary mounted Phase 1 surface is the command-center module grid shell (`ObservingHero` and `AboveMeScene` are non-default/non-mounted in the current Phase 1 runtime)
- Dashboard clearly shows:
  - observing conditions
  - recommended targets
  - upcoming satellite passes
  - alerts / notable events
- Dashboard remains understandable within about 10 seconds of viewing

## Conditions
- Conditions card renders successfully
- Conditions include observing score
- Conditions explain why the score is Good, Fair, or Poor

## Targets
- Recommended targets render correctly
- Each target includes enough context to be useful
- Targets are ranked, not dumped unordered

## Passes
- Upcoming satellite pass list renders correctly
- Pass count is limited
- Each pass includes time and directional usefulness

## Alerts
- Alerts are relevant and limited
- Alerts do not overload the page
- Alerts are clearly distinct from targets and passes

## UX / UI
- UI supports a clear hierarchy
- UI works on mobile-sized layouts
- UI supports Day / Night / Red mode design intent
- No module becomes a scrolling clutter block
- Time context is clear

## Data / Backend
- Frontend works against mocked responses first
- Backend endpoints can return stable JSON contracts
- Canonical Phase 1 routes exist and respond: `/api/scene/above-me` and `/api/object/{id}`
- Backend test suite passes in project runtime (`.venv/bin/python -m pytest backend/tests -q`)
- Failures do not fully break the UI
- Cached/fallback behavior is planned

## Scope Discipline
- No globe view is introduced
- No heavy 3D Earth rendering is introduced
- No aircraft tracking is introduced
- Flight engine behavior is deferred to Phase 2
- No Phase 2+ features are mixed into Phase 1

## Final Product Test
A user should be able to answer:
- Is tonight worth observing?
- What should I look at?
- When should I look?
- Are there any important events or passes?
