# Design

## Source of truth

- Status: Active through M11 Epic #87
- Last refreshed: 2026-09-06
- Primary product surfaces:
  - consumer homepage
  - unified culinary library
  - unified culinary detail
  - embedded story and recognition chapters
  - recommendation entry and result presentation
  - deterministic pairing
  - local-first tonight plan, shopping list, timeline, and cooking mode
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

### M11 design read

Reading this as a bilingual culinary decision and knowledge product for everyday home cooks and curious food explorers, with a food-first editorial language and a restrained laboratory sense of order.

- Taste skill: `design-taste-frontend` v2, pinned from `Leonxlnx/taste-skill@ccbc15639c97057cbfcf32ecebc38ef716e4bb37`
- `DESIGN_VARIANCE: 7`
- `MOTION_INTENSITY: 3`
- `VISUAL_DENSITY: 5`
- Taste is a critique rubric, not the product source of truth. Accessibility, performance, factual integrity and this document override generic skill defaults.
- M11 uses Redesign - Overhaul for browsing and editorial surfaces while preserving the established brand, routes, canonical metadata, navigation, legal copy, and stable anchors.
- The Plan surface is task-oriented and uses the same tokens without marketing-page choreography.
- Multi-value metadata uses commas or Chinese enumeration punctuation. A visible line may use at most one middle-dot separator.

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
  - Carry a decision through shopping, preparation, and serving on the same device.
  - Create a visual system that can stretch across Web and future mobile surfaces.
- Non-goals:
  - Final brand naming in this phase
  - Accounts, household profiles, cloud persistence, notifications, AI cooking, or mobile features
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
  - Culinary library
  - Tonight's choice
  - Language
- Footer utility:
  - Beta feedback
- Core routes/screens:
  - `/{locale}`
  - `/{locale}/recipes`
  - `/{locale}/recipes/[slug]`
  - `/{locale}/pairing/[slug]`
  - `/{locale}/plan` (`noindex`)
  - `/{locale}/stories` redirects to `/{locale}/recipes?story=available`
  - `/{locale}/stories/[slug]` redirects to the corresponding story anchor within the culinary detail
  - `/{locale}/culinary/[slug]` redirects permanently to the canonical recipe route
- Content hierarchy:
  - appetite first
  - decision prompt second
  - recommendation and inspiration third
  - metadata and calculations after the user is oriented

### Implemented route decisions

- `/{locale}` follows: food hero -> progressive cooking decision -> representative culinary items -> cuisine and technique exploration -> estimate note.
- `/{locale}/recipes` is a server-rendered exploration page. Search and filters are URL-based and derive their options from canonical taxonomy.
- `/{locale}/recipes/[slug]` follows: identity and tags -> type-correct preparation or serving guidance -> principles and state cues -> embedded story or recognition -> nutrition and cost -> sources -> pairing.
- Stories are not a parallel content type in navigation. They remain structured domain objects and appear as chapters of the culinary item they explain.
- Every public culinary item uses `/{locale}/recipes/[slug]` as its canonical consumer URL. Legacy culinary and story routes only preserve inbound links through permanent redirects.
- Recommendation results, culinary details, and Pairing can create a versioned local plan. The plan share URL contains only public slugs, servings, and a template ID.
- Navigation remains limited to Home, Culinary library, Tonight's choice, and Language. Beta feedback stays in the Footer.

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
  - neutral rice-white canvas and paper surfaces
  - true ink text and cool neutral rules
  - one chili-red interaction and editorial accent per page
  - food photography supplies the wider color range; UI chrome does not compete with it
- Typography:
  - Noto Sans SC for body and interface text
  - Noto Serif SC for display headings where editorial hierarchy matters
  - headline wrapping is explicitly controlled; desktop hero and catalog titles stay within two lines
  - numeric metrics use a quieter, compact style
- Spacing/layout rhythm:
  - generous section spacing
  - tighter spacing inside cards
  - strong vertical rhythm for mobile scrolling
- Shape/radius/elevation:
  - editorial images and content groups are primarily square or 4 px
  - pills are reserved for filters and status tags
  - cards use rules and whitespace rather than repeated floating white boxes
  - shadows are exceptional and never the primary hierarchy device
- Motion:
  - CSS-only tactile hover and active states
  - no autoplay hero in M9
  - reduced motion support by default
- Themes:
  - light and dark share the same semantic hierarchy
  - system preference is the default; an explicit selection is stored locally
  - no section-level theme inversion
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
  - static editorial Hero with one high-priority LCP image and no automatic carousel
  - `CulinaryCard` and `NativeCulinaryDetailPage` as cross-type consumer surfaces
  - `EmbeddedStories` for evidence-backed cultural and recognition chapters
  - visual-first catalog and recommendation card variants
  - lightweight similar-recipe cards with image, flavor, natural reason, and human cooking time
  - homepage inspiration, cuisine, and technique sections
  - progressive recommendation disclosure for secondary and advanced criteria
  - detail page editorial reading flow without a sticky metric sidebar
  - responsive sticky chapter navigation with stable anchors
  - `PlanWorkspace`, `ResumePlanBanner`, and `ThemeToggle`
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
  - all interactive targets, including source and attribution links, provide at least 44 px touch height
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
  - reduced motion removes non-essential transitions; the static Hero requires no motion-specific control

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
  - invalid share URLs and corrupt local plans fail closed with an inline explanation
- Success:
  - recommendation confirmation should feel encouraging, not transactional
- Disabled:
  - distinct but still legible
- Offline/slow network, if applicable:
  - static content sections should remain useful even if recommendation interactions are delayed
  - an existing plan remains usable from local browser state after the page bundle loads

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
  - only the current page's LCP Hero image receives high fetch priority
  - the homepage Hero mounts and eagerly loads one LCP image only
  - recipe cards lazy-load images with responsive `sizes`
  - catalog filtering remains server-rendered; no second 100-recipe client payload is introduced
  - locale dictionaries and editorial content resolve server-side; do not ship both public languages to client components
- Compatibility constraints:
  - current production is already live and stable; design changes must remain progressive
- Test/screenshot expectations:
  - future UI work should validate core routes on mobile and desktop screenshots
  - browser smoke coverage should remain part of release readiness

## Resolved and deferred decisions

- Typography uses Noto Sans SC for body/UI and Noto Serif SC for editorial display through `next/font`; no external runtime font request or UI dependency was added.
- The "lab" identity appears through explainability, structured facts, and cooking principles rather than interface jargon.
- Character or mascot exploration remains deferred beyond M5 and is not represented in the current product UI.
