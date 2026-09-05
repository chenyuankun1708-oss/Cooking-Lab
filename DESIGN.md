# Design

## Source of truth

- Status: Active through Issue #42
- Last refreshed: 2026-09-05
- Primary product surfaces:
  - consumer homepage
  - recipe catalog
  - recipe detail
  - story catalog and reading pages
  - native CulinaryItem detail
  - recommendation entry and result presentation
- Evidence reviewed:
  - `docs/PRODUCT.md`
  - `docs/BRAND_BRIEF.md`
  - `docs/CONTENT_STRATEGY.md`
  - `docs/ROADMAP.md`
  - `docs/STATUS.md`
  - `docs/BRAND_DIRECTIONS.md`
  - `app/[locale]/page.tsx`
  - `app/[locale]/layout.tsx`
  - `app/globals.css`
  - `app/[locale]/recipes/page.tsx`
  - `app/[locale]/recipes/[slug]/page.tsx`
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
  - New account, household, planning, persistence, AI, or mobile features
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
  - Stories
  - Beta feedback
- Core routes/screens:
  - `/{locale}`
  - `/{locale}/recipes`
  - `/{locale}/recipes/[slug]`
  - `/{locale}/stories`
  - `/{locale}/stories/[slug]`
  - `/{locale}/culinary/[slug]` for native CulinaryItems only
- Content hierarchy:
  - appetite first
  - decision prompt second
  - recommendation and inspiration third
  - metadata and calculations after the user is oriented

### Implemented route decisions

- `/{locale}` follows: food hero -> tonight inspiration -> progressive cooking decision -> cuisine exploration -> stories -> technique exploration -> estimate note.
- `/{locale}/recipes` is a server-rendered exploration page. Search and filters are URL-based and derive their options from canonical taxonomy.
- `/{locale}/recipes/[slug]` follows: hero -> identity and key facts -> ingredients -> steps and reasons -> principles -> secondary estimates -> optional cultural context -> nearby recipe discovery.
- `/{locale}/stories` is a compact editorial discovery surface; `/{locale}/stories/[slug]` prioritizes reading, related exploration and restrained sources.
- `/{locale}/culinary/[slug]` is the destination for native items linked from Stories. Adapted Recipes keep `/{locale}/recipes/[slug]` as their only canonical URL.
- Navigation remains limited to Home, Recipes, Stories, and Beta feedback. Technique discovery remains a homepage section rather than a competing primary route.

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
  - semantic surfaces: warm canvas, paper content, herb knowledge, amber story, restrained cocoa for alcoholic-drink introductions
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
  - cards and framed content use a maximum 8 px radius
  - pills are reserved for filter choices and segmented controls
  - low elevation appears only on interactive recipe cards
  - image containers should feel tactile, not glassy
- Motion:
  - subtle fade and rise
  - small hover states on cards
  - reduced motion support by default
  - homepage Hero rotates every 7 seconds with a 700 ms image crossfade; hover, focus, hidden documents, and reduced-motion preferences pause or disable automatic movement
- Imagery/iconography:
  - editorial food-first photography as the primary visual language
  - modern culinary studio details as a secondary layer on recipe detail and knowledge surfaces
  - minimal icon usage
  - line icons only as supporting UI, not brand personality

## Components

- Existing components to reuse:
  - `RecipeCard` recipe and recommendation result contract
  - `RecipeDiscovery` criteria semantics and deterministic recommendation adapter
  - existing footer, disclaimers, and metadata patterns
- New/changed components:
  - `SiteHeader` and `HomeHero`
  - `HomeHeroCarousel` as the small client-only rotation boundary inside the server-rendered homepage
  - visual-first catalog and recommendation card variants
  - lightweight similar-recipe cards with image, flavor, natural reason, and human cooking time
  - homepage inspiration, cuisine, and technique sections
  - progressive recommendation disclosure for secondary and advanced criteria
  - detail page editorial reading flow without a sticky metric sidebar
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
  - Hero previous, next, and position controls are 44 px buttons with recipe-specific accessible labels
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
  - reduced motion keeps manual Hero controls but disables automatic rotation and image transitions

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
  - prefer "料理", "灵感", "做法", "技巧"；步骤原因直接接在动作之后，不重复加流程标签
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
  - only the homepage LCP image and current detail hero preload
  - the homepage Hero initially mounts the LCP image and its next editorial image, then prepares later images as the sequence advances
  - recipe cards lazy-load images with responsive `sizes`
  - catalog filtering remains server-rendered; no second 100-recipe client payload is introduced
  - locale dictionaries and editorial content resolve server-side; do not ship both public languages to client components
- Compatibility constraints:
  - current production is already live and stable; design changes must remain progressive
- Test/screenshot expectations:
  - future UI work should validate core routes on mobile and desktop screenshots
  - browser smoke coverage should remain part of release readiness

## Resolved and deferred decisions

- Typography uses the system UI stack for Chinese and Latin text in M5; no font dependency was added.
- The "lab" identity appears through explainability, structured facts, and cooking principles rather than interface jargon.
- Character or mascot exploration remains deferred beyond M5 and is not represented in the current product UI.
