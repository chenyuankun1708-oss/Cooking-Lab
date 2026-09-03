# Design

## Source of truth

- Status: Draft
- Last refreshed: 2026-09-04
- Primary product surfaces:
  - consumer homepage
  - recipe catalog
  - recipe detail
  - recommendation entry and result presentation
- Evidence reviewed:
  - `docs/PRODUCT.md`
  - `docs/BRAND_BRIEF.md`
  - `docs/CONTENT_STRATEGY.md`
  - `docs/ROADMAP.md`
  - `docs/STATUS.md`
  - `docs/BRAND_DIRECTIONS.md`
  - `app/page.tsx`
  - `app/layout.tsx`
  - `app/globals.css`
  - `app/recipes/page.tsx`
  - `app/recipes/[slug]/page.tsx`
  - `components/recipe-discovery.tsx`
  - `components/recipe-card.tsx`
  - Production URL: `https://cooking-lab-pied.vercel.app`

## Brand

- Personality:
  - warm
  - curious
  - fresh
  - grounded
  - knowledgeable
  - calm
  - human
- Trust signals:
  - recommendation logic remains explainable
  - nutrition, cost, and time stay clearly marked as estimates
  - real food photography and culturally careful content
  - restrained, readable interface instead of noisy consumer gimmicks
- Avoid:
  - SaaS dashboard feel
  - engineering demo feel
  - calorie-tracker / diet app feel
  - food delivery app tropes
  - luxury fine-dining stiffness
  - childish mascot-first branding
- Confirmed direction:
  - Fresh Editorial 70%
  - Modern Culinary Lab 30%
- Working brand:
  - `Cooking Lab` remains the external working brand through M5
- Naming status:
  - final renaming deferred until after the M5 visual prototype / redesign

## Product goals

- Goals:
  - Help users decide what to cook under real-life constraints.
  - Make cooking inspiration feel appetizing and approachable.
  - Grow from a recommendation tool into a cooking knowledge and household companion.
  - Create a visual system that can stretch across Web and future mobile surfaces.
- Non-goals:
  - Final brand naming in this phase
  - Full UI implementation in this issue
  - Paid design-service level brand identity execution
- Success signals:
  - Homepage feels food-first instead of filter-first.
  - Recipe cards invite browsing before exposing dense metrics.
  - Detail pages read like useful cooking content, not a dashboard.
  - Future UI work can cite stable visual, content, and accessibility rules.
  - recommendation explainability and cooking science remain visible, but below the food-first visual layer

## Personas and jobs

- Primary personas:
  - busy home cooks choosing dinner with limited time and ingredients
  - curious improvers who want to understand cooking, not just follow instructions
  - globally minded food explorers browsing cuisines, techniques, and ingredients
- User jobs:
  - decide what to cook tonight
  - understand why a recipe matches current constraints
  - discover dishes by ingredient, cuisine, and technique
  - learn one useful cooking idea without committing to a long reading session
- Key contexts of use:
  - evening weeknight planning
  - grocery-driven browsing
  - weekend exploration and learning
  - mobile-first casual scrolling with occasional deeper desktop reading

## Information architecture

- Primary navigation:
  - Home
  - Recipes
  - Recommendation entry points
  - Learning / story surfaces on the homepage first, dedicated routes later
- Core routes/screens:
  - `/`
  - `/recipes`
  - `/recipes/[slug]`
- Content hierarchy:
  - appetite first
  - decision prompt second
  - recommendation and inspiration third
  - metadata and calculations after the user is oriented

## Design principles

- Principle 1: Food first.
- Principle 2: Knowledge second.
- Principle 3: Data supports trust.
- Principle 4: Recommendation explains, but does not dominate.
- Principle 5: Warmth without childishness.
- Principle 6: Editorial without luxury pretension.
- Principle 7: Scientific without SaaS appearance.
- Tradeoffs:
  - Keep structured data visible enough for trust while moving it below image, title, and story cues.
  - Preserve the product's rational "lab" credibility without keeping the current dashboard styling.
  - keep future household warmth as a secondary layer, not the primary M5 visual identity

## Visual language

- Color:
  - warm neutral backgrounds
  - fresh produce-led accents
  - dark text with strong contrast
  - restrained success/warning states
- Typography:
  - modern humanist or neo-grotesk body text
  - display typography with editorial personality
  - numeric metrics use a quieter, compact style
- Spacing/layout rhythm:
  - generous section spacing
  - tighter spacing inside cards
  - strong vertical rhythm for mobile scrolling
- Shape/radius/elevation:
  - medium radii, not pill-heavy
  - low to medium elevation
  - image containers should feel tactile, not glassy
- Motion:
  - subtle fade and rise
  - small hover states on cards
  - reduced motion support by default
- Imagery/iconography:
  - editorial food-first photography as the primary visual language
  - modern culinary studio details as a secondary layer on recipe detail and knowledge surfaces
  - minimal icon usage
  - line icons only as supporting UI, not brand personality

## Components

- Existing components to reuse:
  - `RecipeCard` information model
  - `RecipeDiscovery` recommendation logic and filter semantics
  - existing footer, disclaimers, and metadata patterns
- New/changed components:
  - hero prompt module
  - visual-first recipe card variants
  - homepage section blocks for inspiration, cuisine exploration, technique exploration, and stories
  - detail page hero media and content rails
- Variants and states:
  - catalog card
  - recommendation card
  - featured card
  - friendly empty states
- Token/component ownership:
  - shared visual decisions live in `DESIGN.md` and `docs/BRAND_DIRECTIONS.md`
  - implementation tokens should remain simple and repo-native when added later

## Accessibility

- Target standard:
  - WCAG 2.2 AA for contrast, focus, sizing, and navigation
- Keyboard/focus behavior:
  - homepage quick filters and cards must remain keyboard reachable
  - focus rings need visible contrast on image-heavy layouts
- Contrast/readability:
  - avoid low-contrast beige-on-beige combinations
  - captions and metadata must stay legible at small sizes
- Screen-reader semantics:
  - recipe cards should announce title, cuisine, and key metadata in a useful order
  - hero images require meaningful alt text when they carry content
- Reduced motion and sensory considerations:
  - no essential meaning in animation
  - gentle transitions only

## Responsive behavior

- Supported breakpoints/devices:
  - 375 px, 390 px, 768 px, 1024 px, and wide desktop layouts
- Layout adaptations:
  - homepage becomes a single-column story flow on mobile
  - recommendation entry condenses to chips, segmented controls, or drawers instead of a persistent left rail
  - detail page collapses right-rail metadata into inline summary blocks
- Touch/hover differences:
  - touch targets stay at least 44 px
  - hover reveals cannot be the only place secondary information appears

## Interaction states

- Loading:
  - skeletons should prioritize image and title shapes, not empty metric grids
- Empty:
  - explain how to broaden conditions and suggest nearby exploration paths
- Error:
  - calm tone, direct recovery action
- Success:
  - recommendation confirmation should feel encouraging, not transactional
- Disabled:
  - distinct but still legible
- Offline/slow network, if applicable:
  - static content sections should remain useful even if recommendation interactions are delayed

## Content voice

- Tone:
  - warm
  - capable
  - lightly editorial
- Terminology:
  - prefer "料理", "灵感", "做法", "技巧", "为什么这样做"
  - use "实验室" language sparingly and only where it clarifies structured reasoning
- Microcopy rules:
  - ask natural cooking questions
  - avoid admin-panel nouns
  - keep nutrition/cost disclaimers factual and compact
  - build brand warmth through narrator tone and microcopy, not through a mascot-first interface

## Implementation constraints

- Framework/styling system:
  - Next.js App Router
  - TypeScript
  - Tailwind-driven styling
- Design-token constraints:
  - keep tokens modest and practical
  - prefer a small semantic role system over large theme matrices
- Performance constraints:
  - future layouts must account for responsive image loading
- Compatibility constraints:
  - current production is already live and stable; design changes must remain progressive
- Test/screenshot expectations:
  - future UI work should validate core routes on mobile and desktop screenshots
  - browser smoke coverage should remain part of release readiness

## Open questions

- [ ] Which specific typography pair best expresses the confirmed A 70% + C 30% direction across Chinese and Latin text?
- [ ] How much of the "lab" identity should appear in homepage copy versus staying mostly in detail and knowledge surfaces?
- [ ] At what later milestone should a future character be evaluated: household MVP, assistant layer, or retention-focused release?
