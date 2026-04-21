# Figma Version Docs

This folder covers two related artifacts:

- `https://www.figma.com/make/WW8u7GDCpdRakHFmW9YspS/Travel-Recommendations-Organizer?t=v06R4X1Imu84T4s2-1&preview-route=%2Fitineraries`
- `https://grain-trout-22213050.figma.site`

## Important Context

This is a Figma Make file, not a standard Figma Design file.

That distinction matters because the standard Figma MCP inspection tools used for:

- metadata tree reads
- node screenshots
- design context extraction

do not currently support Make files in this environment.

## What Was Verified

Verified through Figma MCP and web-access inspection:

- authenticated Figma account is available in MCP
- file type is `figmake`
- file name is `Travel Recommendations Organizer`
- file key is `WW8u7GDCpdRakHFmW9YspS`
- preview route is `/itineraries`
- anonymous web fetch of the provided URL resolves to a permission/request gate rather than a public preview
- the public `figma.site` is accessible and currently presents a `Zylo`-branded dark app shell
- the public `figma.site` metadata describes organizing saved Instagram and TikTok content into travel recommendations by city, cuisine, and scenic spots

## What Is In This Folder

- `project-details.md`
  - verified metadata
  - what can be confidently said about both the linked Make file and the public figma.site
  - inferred relationship to the original Wandr brief and the current Zylo codebase
- `access-and-limitations.md`
  - exact tool limitations hit during documentation
  - what an engineer should do next if they need deeper Figma parity

## How To Use These Docs

If you are trying to keep code and Figma aligned:

1. read `project-details.md`
2. treat all inferred statements as hypotheses until someone with direct Make-file access confirms them
3. use the Zylo codebase as the primary implementation truth
4. if deeper Make-file inspection becomes available later, update these docs immediately
