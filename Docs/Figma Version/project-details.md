# Figma Make Project Details

## Verified Metadata

The following was verified during this documentation pass:

- Product/file name: `Travel Recommendations Organizer`
- File key: `WW8u7GDCpdRakHFmW9YspS`
- File type/page type: `figmake`
- Shared URL preview route: `/itineraries`
- The MCP-authenticated Figma user is available, but standard design-node tools reject this file type.
- Public companion site: `https://grain-trout-22213050.figma.site`
- Public site title: `Zylo - You Stash & Save, We Take Care of Everything Else!`
- Public site meta description: `Effortlessly organize your saved Instagram and TikTok content into curated travel recommendations by city, cuisine, and scenic spots, perfect for Gen Z explorers.`

## Verified Public figma.site Observations

The public site is not blank marketing copy. It currently exposes a dark app shell with:

- `zylo.` branding in the sidebar
- navigation items:
  - Home
  - Places
  - Map
  - Trips
  - Search
  - Settings
- a visual language that is much closer to the current repository's Zylo dashboard than to the lighter Base44/Wandr design brief

This matters because it shows the Figma artifacts are split across at least two states:

- the original Make file tied to itinerary/travel recommendation generation
- a public Zylo-branded site that reflects the current product direction more closely

## What The URL Suggests

The linked asset is a Figma Make experience centered on travel recommendations and itinerary organization.

The strongest clues are:

- file name: `Travel Recommendations Organizer`
- preview route: `/itineraries`

That implies the Figma version is not just a marketing mock. It is likely modeling the actual product workflow around itinerary construction.

## Relationship To This Repository

This repository and the Figma artifacts appear conceptually aligned around the same product space:

- travel recommendations
- saved-place organization
- itinerary construction
- destination-aware planning

The codebase expresses the same major product objects:

- destinations
- places
- trips
- trip days
- trip stops
- AI concierge

## Relationship To The Original Wandr/Base44 Brief

The original brief and the Figma artifacts overlap strongly on product problem:

- saved travel content becomes organized places
- destinations are a first-class concept
- itinerary planning is central
- Instagram and TikTok are part of the intake story

But there are also meaningful mismatches:

- original brief brand: `Wandr`
- current public figma.site brand: `Zylo`
- original brief UI direction: lighter, flatter Base44 app
- current public figma.site direction: dark sidebar app shell with Zylo branding

## Best Current Mapping Between Figma Intent And Code

Because deep Make-node inspection is blocked, the safest current mapping is this:

### Figma likely represents

- higher-level travel recommendation and itinerary workflows
- user-facing planning experience
- possibly previewable itinerary routes and recommendation organization

### Code currently represents

- the real engineering baseline for:
  - auth
  - persistence
  - imports
  - trip scaffolding
  - AI concierge
  - public marketing

## Likely Areas Of Alignment

Based on the codebase, a matching Figma version would reasonably include:

- a travel-first dashboard
- itinerary and destination organization
- place cards and map-aware grouping
- import or intake workflows
- AI-assisted planning
- mobile-friendly app navigation

## Current Confidence Levels

### High confidence

- The Figma file is about travel itinerary/recommendation organization.
- It is a Make file, not a standard design file.
- The public figma.site is currently Zylo branded.
- The codebase is implementing the same broad product problem.

### Medium confidence

- The `/itineraries` preview route likely corresponds to the trip-planning side of Zylo.
- The Make file may be exploring a more generated or dynamic version of the product than the current codebase.
- The public figma.site may represent an older or alternate branch of the same product vision rather than the exact Base44/Wandr brief.

### Low confidence

- exact screens
- exact copy
- exact interaction model
- exact visual fidelity relative to this repo

Those details could not be verified directly because of tool constraints on Make files.

## Practical Guidance For Engineers

Until deeper Make-file inspection is possible, use this priority order:

1. use the original brief docs for product requirements if the goal is to implement `Wandr` on `Base44`
2. use the current codebase as the engineering truth for the repo that exists today
3. use Figma metadata and the public figma.site as product-direction evidence
4. avoid claiming pixel-perfect parity with the Make file unless someone manually confirms it

## Practical Guidance For AI Agents

If asked to continue building toward the Figma version:

1. keep the product centered on itineraries and recommendations
2. prioritize trip, day, stop, and place organization
3. treat direct sync as future-facing unless explicit code is added
4. preserve the travel-first narrative and premium tone
5. mark any statement about the Make file's exact UI as an inference unless separately confirmed
