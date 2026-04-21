# Figma Access And Limitations

## What Was Attempted

The linked Figma URL was investigated with:

- Figma MCP authenticated user check
- Figma metadata inspection tools
- Figma screenshot tool
- direct web fetch of the shared Make URL
- direct fetch and screenshot of the public `figma.site`

## What Worked

### Authenticated Figma identity check

Figma MCP confirmed an authenticated user is connected.

That means the issue was not "no Figma account connected."

### Shared URL metadata from the permissions page

The shared page exposed enough metadata to verify:

- file name
- file key
- page type `figmake`

### Public `figma.site` access

The public site is accessible.

Verified findings:

- HTTP 200 response
- public HTML metadata is readable
- a desktop screenshot shows a Zylo-branded dark app shell with sidebar navigation

## What Failed

### Standard Figma MCP design inspection

These tools returned an error stating they are not supported for Make files:

- metadata inspection
- node screenshot inspection

Implication:

- standard Design-file workflows cannot be used here

### Anonymous web access to the shared URL

Fetching the provided URL from the web returned a permissions/request gate, not the live itinerary preview.

Implication:

- the shared link is not publicly inspectable in this environment without the right access path

## What This Means

At the time of writing, the Make file can only be documented accurately at the metadata level, not at the node tree or visual screenshot level, using the tools available in this workspace.

The public `figma.site`, however, is inspectable at a limited level and should be treated as a separate but useful artifact.

## What To Do Next If You Need Deeper Figma Parity

### Option 1. Open the Make file manually in a browser session that has access

Then capture:

- main screens
- key flows
- exact route behavior
- visual hierarchy
- critical copy

### Option 2. Convert or mirror the relevant Make surfaces into a standard Figma Design file

Why this helps:

- the existing MCP tools work much better on normal design files
- code-to-design mapping becomes inspectable

### Option 3. Provide direct screenshots or exported frames

This is the fastest way to give an AI agent something concrete to implement against if Make-file inspection remains blocked.

## Safe Documentation Rule

When discussing the Figma Make project:

- mark file metadata as verified
- mark public figma.site branding and navigation as verified
- mark visual or interaction claims as inferred unless confirmed manually

## Suggested Future Update

Once someone with proper access can inspect the Make project, update this folder with:

1. screen inventory
2. route inventory inside the Make preview
3. visual design notes
4. component/state notes
5. mismatch list between Make and code
