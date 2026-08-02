# Spec: Player Wardrobe — Preview + Inventory

## Objective

Turn the authenticated Wardrobe into a pixel-retro fitting room. Players must see their Field, Avatar Frame, avatar, and Protector together before committing an equipment change, while the inventory remains fast to scan on desktop and mobile.

## Tech Stack and Commands

- React 18, Vite 5, Tailwind CSS 3, GSAP, and the existing pop-art tokens.
- Test: `npm test --prefix client`
- Build: `npm run build --prefix client`
- Server regression: `npm test --prefix server`

## Existing Contracts

- `GET /api/shop/owned` is authoritative for ownership and equipped cosmetics.
- `GET /api/shop/items` supplies the currently public catalog and locked-item metadata.
- `GET /api/users/me` supplies username and avatar; failure degrades to the JWT identity/default avatar.
- `PUT /api/shop/equipment/:slot` equips an owned item or restores the default with `{ "itemId": null }`.
- Equipment slot and asset rendering rules remain defined by `docs/shop-equipment-v1.md` and `client/src/utils/shopEquipment.js`.

## UI Behaviour

- Desktop uses a wide `38% / 62%` Preview + Inventory layout. The preview stays visible while browsing; tablet and mobile stack it above the inventory.
- Merge public catalog items with owned items by stable ID. Keep owned expired/inactive items visible and mark currently public unowned items as locked.
- Tabs expose pure-locale labels, category counts, arrow-key navigation, and stable tab/panel relationships.
- Search, rarity, ownership/equipped filtering, default/rarity/name sorting, and ten-item pagination run locally. Any filter change returns to page one.
- Hover/focus previews temporarily; an explicit preview selection pins the item. Only Apply mutates server state.
- Equipment success updates the canonical loadout and creates a fixed toast with a five-second undo window. Errors remain actionable and preserve the preview.
- Use the actual Field as the stage, compose the current avatar and frame, and show a representative Protector stack. Broken/missing assets keep a type-specific fallback.
- Provide skeleton, required-error, degraded-catalog, empty-catalog, no-results, pending, reduced-motion, and responsive states in Vietnamese and English.

## Component and Test Structure

- `Wardrobe.jsx` owns requests, canonical equipment, preview state, and mutations.
- Wardrobe preview and inventory components remain presentational.
- Pure merge/filter/sort/pagination helpers live in a small utility and are covered by Node unit tests.

## Boundaries

- No server API, schema, migration, dependency, favorite, random loadout, sound, legacy skin/emote, or new art changes.
- Collection progress covers the union of the public catalog and owned items; hide the denominator if catalog loading fails.
- Shop purchases cosmetics but never equips them. Profile continues to own username and base-avatar editing.
- Keep existing Live Ops gates and uncommitted asset-framing work intact. Admin users remain restricted to Admin.

## Success Criteria

- A player can browse owned and locked cosmetics, preview one slot without changing the others, apply or remove it, and undo a successful mutation.
- The page has no unused desktop half, no layout-shifting notification, and no page overflow at 320, 768, 1024, or 1440 pixels.
- Keyboard and reduced-motion users receive equivalent state and feedback; state is never conveyed by color alone.
- Client tests, server tests, and the production client build succeed.

## Visual Refinement Criteria

- The player portrait and Avatar Frame form the preview focal point; the Protector stack is supporting content and every preview status sits next to the player identity it describes.
- The Inventory sizes to its content with a useful low-density discovery treatment instead of a large unexplained blank area.
- Collection progress belongs to the Inventory header and explicitly describes owned items versus the current catalog union.
- Protector artwork keeps the shared `5 / 7` contract. Inventory cards stay within an approximately `180–210px` desktop width while preserving the native Frame and Field aspect ratios.
- Equipped, pinned-preview, locked, and default items expose mutually consistent actions: equipped items offer Remove, pinned items offer Apply/Cancel, locked items offer their acquisition source, and ordinary owned items offer Preview.
- Tabs, badges, loadout slots, filters, and secondary controls use a lighter visual tier than panels and primary actions; card and loadout copy remains readable at normal desktop scale.
