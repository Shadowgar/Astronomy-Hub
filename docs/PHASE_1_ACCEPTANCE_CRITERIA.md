# Phase 1 Acceptance Criteria

Phase 1 is complete only when all of the following are true.

## Core Access
- Astronomy Hub can be opened from the intended local project environment
- Phase 1 docs exist and match implemented behavior
- The app runs locally without requiring Raspberry Pi deployment

## Location
## Location
- Default: the system uses the ORAS Observatory preset when no override is provided
- User may optionally enter manual latitude/longitude coordinates to override the Active Observing Location for the current session only
- Disallowed for Phase 1: browser geolocation, map pickers, reverse geocoding, saved locations, account-based preferences, or a location database
- Location state (default or manual override) updates the displayed dashboard data

## Dashboard Behavior
- Dashboard loads without overwhelming the user
- Dashboard clearly shows:
  - observing conditions
  - recommended targets
  - upcoming passes
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
- Upcoming pass list renders correctly
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
- Failures do not fully break the UI
- Cached/fallback behavior is planned

## Scope Discipline
- No globe view is introduced
- No heavy 3D Earth rendering is introduced
- No aircraft tracking is introduced
- No Phase 2+ features are mixed into Phase 1

## Final Product Test
A user should be able to answer:
- Is tonight worth observing?
- What should I look at?
- When should I look?
- Are there any important events or passes?