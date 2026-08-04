# Boom Kitten Frontend Design Guide

This document describes the frontend that exists in the repository today. It is the visual and interaction contract for AI agents and contributors. Preserve it unless a task explicitly requests a redesign.

## 1. Source-of-truth order

When sources disagree, use this order:

1. Rendered behavior and scoped styles in `client/src/styles.css`.
2. Existing components adjacent to the feature being changed.
3. Tokens in `client/tailwind.config.js` and the scoped CSS variables below.
4. This document.

Important implementation details:

- React 18 and Vite render the client.
- Tailwind CSS 3 utilities and one global `client/src/styles.css` file are used together.
- `App.jsx` uses a page-state map and lazy imports; this project does not use React Router.
- Framer Motion handles React overlays and layout transitions. GSAP/Pixi own gameplay presentation and VFX.
- Do not add a UI framework, icon library, animation library, or state library without an explicit requirement.

## 2. The visual model: four intentional territories

Boom Kitten is not one flat theme. The product has four scoped visual territories. Never mix their tokens or component language accidentally.

| Territory | Scope/root | Character | Primary source |
| --- | --- | --- | --- |
| Player application | `.pop-art-theme` | Warm pop-art / neo-brutalist, energetic and tactile | `styles.css` global pop tokens and player pages |
| Active match | `.game-room`, especially the later `Battle table v2` block | Dark battle room with green felt, wood rail and gold signals | `styles.css` final `.game-room` overrides and `pages/Game/` |
| Wardrobe | `.wardrobe-shell` | Pixel-retro fitting room layered on the player palette | opening Wardrobe block in `styles.css` |
| Admin console | `.admin-console` | Quiet, dense operations UI with restrained color | admin token block and `pages/admin/ui.jsx` |

Dialogs inside a match use the separate `.pixel-dialog` token family. They should feel related to the match HUD, not to Admin.

### Territory rule

- A player-facing page such as Lobby, Shop, Profile, Friends, Leaderboard or Tournaments uses the player pop-art language.
- An in-progress match uses the active-match language even though `.pop-art-theme` may still exist above it in the tree.
- Wardrobe may reuse `--pop-*` primitives but keeps its own component classes and pixel details.
- Admin always stays visually quiet. Do not give Admin heavy black brutalist borders, halftone decoration, card rotations or game VFX.

## 3. Color systems

### 3.1 Player pop-art primitives

Defined on `:root` in `client/src/styles.css`:

| Token | Value | Use |
| --- | --- | --- |
| `--pop-red` | `#E24B4A` | Primary action, active state, destructive emphasis |
| `--pop-orange` | `#D85A30` | Secondary warm accent and offset decoration |
| `--pop-amber` | `#FAC775` | Highlight, notice, selected/turn-adjacent state |
| `--pop-black` | `#111111` | Ink, strong borders, offset shadows |
| `--pop-cream` | `#FFF5E8` | Warm canvas and secondary surface |
| `--pop-offwhite` | `#FAFAFA` | Neutral light surface |
| `--pop-green` | `#10B981` | Success and positive state |

Use these variables through Tailwind arbitrary values such as `bg-[var(--pop-red)]`. White cards and cream canvases are normal. Red and amber are accents, not full-page default fills.

The older semantic colors in `client/tailwind.config.js` (`primary`, `surface`, `error`, and related `on-*` colors) remain valid for legacy components. Do not silently migrate an unrelated screen between the two systems.

### 3.2 Active-match semantic colors

The base game HUD defines paper/ink semantics under `.pop-art-theme`, while the final `Battle table v2` block overrides the active room. Because source order matters, edit the final block when changing the current battle-table composition.

Core HUD tokens:

| Token | Value | Meaning |
| --- | --- | --- |
| `--game-paper` | `#F8EDCF` | Warm HUD/card surface |
| `--game-paper-deep` | `#DFC99E` | Recessed warm surface |
| `--game-ink` | `#241914` | Warm dark outline/text |
| `--game-muted` | `#755F4E` | Secondary HUD copy |
| `--game-brand` | `#A52F29` | Primary battle action |
| `--game-turn` | `#EFAA32` | Turn/attention signal |
| `--game-danger` | `#B4232C` | Danger/elimination |
| `--game-success` | `#3F8B46` | Defuse/success |

Battle table v2 adds:

| Token | Value | Meaning |
| --- | --- | --- |
| `--game-table` | `#08704F` | Main felt |
| `--game-table-deep` | `#034C39` | Deep felt/shading |
| `--game-rail` | `#552724` | Dark wood rail |
| `--game-rail-light` | `#8B4534` | Light wood rail |
| `--game-night` | `#0D0E16` | Room canvas |
| `--game-night-raised` | `#171923` | Raised dark surface |
| `--game-gold` | `#FFD66B` | High-value signal and focus accent |

Game state must never be communicated by color alone. Pair color with copy, icons, borders, patterns or motion.

### 3.3 Admin semantic colors

Admin tokens are scoped to `.admin-console` and must stay there:

| Role | Tokens |
| --- | --- |
| Canvas/surfaces | `--admin-canvas`, `--admin-surface`, `--admin-surface-muted`, `--admin-surface-raised` |
| Text | `--admin-text`, `--admin-text-muted` |
| Structure | `--admin-border`, `--admin-border-strong` |
| Brand/action | `--admin-accent`, `--admin-accent-hover`, `--admin-accent-soft` |
| Accessibility | `--admin-focus` |
| Status | `--admin-success-*`, `--admin-warning-*`, `--admin-danger-*`, `--admin-info-*` |

Admin uses off-white canvas, white panels, hairline neutral borders, dark olive-black text and a restrained brick-red accent. Status colors are muted backgrounds with explicit labels.

### 3.4 Adding tokens

Prefer the existing scoped semantic token. If a genuinely shared token is required, use this hierarchy:

`primitive value -> territory semantic token -> component usage`

Do not add a new global hex value for a one-off component when an existing territory token expresses the same role.

## 4. Typography

| Typeface | Use |
| --- | --- |
| `DM Sans` | Default body copy, forms and general UI |
| `Montserrat` | Player pop-art display and accent text through `.font-pop-display` / `.font-pop-accent` |
| `Anybody` | Expressive game headings and Tailwind `font-headline` |
| `Chakra Petch` | Pixel-retro labels, game identity and compact tactical UI |
| `Space Mono` | Room codes, timers, metadata, counters and technical labels |

Rules:

- Page title: one semantic `h1`; player titles are bold, compact and usually uppercase.
- Section hierarchy must use `h2` then `h3`; do not style a `div` as a heading.
- Body copy uses `DM Sans` with readable sentence case.
- Uppercase and wide tracking belong to labels, badges and short headings, not paragraphs.
- Vietnamese is first-class. Keep real Vietnamese copy, verify diacritics, and save source files as UTF-8.
- Numeric Admin data should retain tabular alignment; IDs and room codes may use monospace.

## 5. Geometry, spacing and elevation

### Player pop-art

- Structure uses 2px or 3px black borders.
- Cards are usually square-cornered or minimally rounded.
- Elevation is a hard offset shadow: commonly 2px, 4px, 5px, 6px or 8px using `--pop-black`.
- Hover may move up/left by 1-2px and increase the hard shadow. Active moves down/right and reduces it.
- Small rotations are reserved for decorative labels/ribbons, not forms or dense content.
- Halftone, dashed borders and text strokes are accents. Do not apply all of them to one component.

### Active match

- The table is a large oval/rounded felt composition with inset rail layers.
- HUD panels combine dark room surfaces with warm paper panels and strong tactical borders.
- Card and avatar geometry may use clipped/pixel corners.
- Keep the center readable; controls, toasts and copy must not cover the hand or discard destination.

### Admin

- Use `rounded-md`, `rounded-lg` or `rounded-xl` consistently.
- Use 1px neutral borders and subtle shadows such as `0 1px 2px rgba(...)`.
- Use dense but breathable spacing: common control height is at least 44px (`min-h-11`), panel padding is 12-20px.
- Avoid decorative transforms, heavy strokes, glow and large offset shadows.

### Spacing

Tailwind's 4px scale is the default. Prefer existing values (`gap-2` through `gap-6`, `p-3` through `p-6`) and avoid arbitrary 13px/19px spacing unless required by measured game geometry.

## 6. Component contracts

### Buttons

Player buttons:

- Real `<button>` elements.
- 2-3px `--pop-black` border, bold short label, tactile offset shadow.
- Primary: `--pop-red` with white text.
- Secondary/notice: `--pop-amber` with dark text.
- Neutral: white or cream with dark text.
- Disabled: actual `disabled`, reduced opacity, no hover transform.

Game buttons should reuse `.game-pixel-button`, `.game-pixel-icon` and their existing variants. Admin buttons must use `Button` from `client/src/pages/admin/ui.jsx`.

### Panels and cards

- Player: white/cream surface, heavy border, hard shadow and clear header hierarchy.
- Game: use established `game-*` classes; do not build a second generic card system inside the table.
- Admin: use `AdminCard`, `SectionHeader`, `Toolbar`, `StatusBadge`, `Alert`, `EmptyState` and `SkeletonBlock` from `pages/admin/ui.jsx`.

### Forms

- Every input has a visible `<label>` or an intentional `sr-only` label.
- Player inputs use strong black borders and high-contrast focus changes.
- Admin inputs use the exported `inputClass` and `Field` components.
- Errors appear next to the relevant field or in a `role="alert"` region.
- Loading controls expose disabled/busy state and preserve their label context.

### Navigation and icons

- Player navigation uses the existing inline pixel SVGs in `components/PixelIcons.jsx`.
- Admin uses Material Symbols where already established.
- Emoji are acceptable for player avatars/emotes, not as the only label for an action.
- Navigation state needs text plus a visual state; icon color alone is insufficient.

### Feedback and overlays

- Success/info messages use `role="status"`; errors use `role="alert"`.
- Match events also update the polite live region in `GameBoardView`.
- Modals need an accessible name, focus containment/restoration and keyboard-operable close/confirm actions.
- Visual animation clones are always `aria-hidden` and never receive focus.

## 7. Responsive behavior

Build mobile-first and preserve the current breakpoints:

- Tailwind defaults are used across player/Admin pages (`sm`, `md`, `lg`).
- Test widths: 320px, 768px, 1024px and 1440px.
- Active match has custom transitions around 959px and 639px, plus short-height handling near 499px.
- On mobile, dense tables become scroll containers or card lists; do not squeeze six columns into the viewport.
- The match hand remains the primary bottom interaction zone. Side activity becomes a drawer.
- Use `100dvh` for full-height game surfaces where the existing code does so.

## 8. Motion, VFX and sound

Motion must clarify cause and result, never determine game state.

Ownership:

- `CardPlayPresentationController`: shared card play, combo and Nope presentation.
- `AnimationManager` plus Pixi/GSAP: special VFX and micro-effects.
- React/Framer Motion: draw reveal, dialogs, turn/elimination/endgame UI state.

Rules:

- Animate `transform`, `scale`, `rotation` and `opacity`; avoid animating layout properties during flights.
- Normal UI transitions are approximately 100-200ms. Gameplay choreography may be longer when the card must remain readable.
- Respect `prefers-reduced-motion` and the existing `getVFXQuality()` levels.
- Reduced motion removes travel, shake and rotation but keeps readable state changes with short fade/scale treatment.
- VFX must have cleanup, interruption and timeout behavior. Never leave a clone, backdrop or timer after unmount/reconnect/game end.
- Only use registered sound assets. Mute and volume preferences persist locally.

## 9. Accessibility baseline

All new UI must meet WCAG 2.1 AA behavior:

- Keyboard reachability for every action.
- Visible `:focus-visible` treatment with at least a 2px high-contrast ring/outline.
- Minimum practical touch target: 44px for primary controls.
- Normal text contrast at least 4.5:1; large text and UI boundaries at least 3:1.
- No color-only state.
- Correct heading order, labels, list/table semantics and dialog relationships.
- Loading, empty, error and success states are all explicit.
- Focus is moved/restored when dialogs and drawers open/close.
- Decorative elements and VFX use `aria-hidden="true"`.

## 10. Implementation rules for AI agents

Do:

- Inspect the nearest existing screen/component before editing.
- Reuse territory tokens and shared components.
- Keep CSS scoped under the relevant root class.
- Keep server-authoritative state separate from presentation state.
- Preserve loading/error/empty/disabled/reduced-motion variants.
- Use real content in both Vietnamese and English where that surface is localized.
- Run the full verification commands below before handing off.

Do not:

- Blend Admin minimalism with player neo-brutalism.
- Create a fifth visual territory for one screen.
- Introduce generic purple gradients, glass cards or rounded-everything AI styling.
- add new dependencies for a component already covered by React, CSS, Tailwind, Framer Motion, GSAP or Pixi.
- Put remote or unsafe cosmetic URLs into the UI; cosmetics use same-origin paths beginning with `/`.
- Add per-card cinematic PNG systems for ordinary action cards.
- Animate gameplay state optimistically as if it were authoritative.
- edit the earlier game HUD block expecting to override the later `Battle table v2` block.

## 11. Preferred examples

Player panel:

```jsx
<section className="border-3 border-[var(--pop-black)] bg-white p-5 shadow-[5px_5px_0_var(--pop-black)]">
  <h2 className="font-pop-display text-xl font-black uppercase">Section title</h2>
  <p className="mt-2 font-pop-body text-sm font-bold text-[var(--pop-black)]/65">Useful supporting copy.</p>
</section>
```

Admin panel:

```jsx
<AdminCard className="p-4">
  <SectionHeader title="Operational title" description="Decision context, not decoration." />
  <Button variant="primary">Confirm action</Button>
</AdminCard>
```

Status feedback:

```jsx
{error ? <p role="alert">{error}</p> : <p role="status">{message}</p>}
```

## 12. Verification before commit

```powershell
npm test --prefix client
npm run validate:vfx --prefix client
npm run validate:vfx-registry --prefix client
npm run build --prefix client
npm test --prefix server
git diff --check
```

For visual changes, also keyboard-test the affected flow and inspect it at 320px, 768px, 1024px and 1440px. For match changes, test reduced motion and at least two connected clients.
