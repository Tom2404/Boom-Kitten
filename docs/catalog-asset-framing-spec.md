# Spec: Catalog Asset Framing

## Objective

Give Admins a non-destructive framing tool for Shop assets. When an image does
not naturally fit the target slot, the Catalog form warns the Admin and requires
them to confirm a crop before saving. The saved scale and focal position are
used everywhere the equipped asset is rendered.

Success means an Admin can drag or use keyboard-accessible controls to position
a Protector, Avatar Frame, or Field inside its real target aspect ratio without
editing the source file.

## Tech Stack

- React 18 and Tailwind CSS in `client/`.
- Express, Mongoose, and Node's built-in test runner in `server/`.
- No new runtime dependency and no destructive image processing.

## Commands

```powershell
Set-Location server
npm test

Set-Location ../client
npm test
npm run build
```

## Project Structure

- `server/models/ShopItem.js`: persisted transform defaults and bounds.
- `server/services/admin/catalogService.js`: mutation allowlist/normalization.
- `server/services/shopEquipmentService.js`: public cosmetic payload.
- `client/src/pages/admin/`: framing editor and Catalog form integration.
- `client/src/utils/shopEquipment.js`: shared transform normalization/style helpers.
- `server/test/` and `client/test/`: contract and regression checks.

## Code Style

Use the existing plain JavaScript/CommonJS conventions on the server and ESM
React conventions on the client. Keep the stored contract small:

```js
assetTransform: { scale: 1, x: 0, y: 0 }
```

`scale` is clamped to `0.5..3`; `x` and `y` are percentages clamped to `-50..50`.
Missing or malformed transforms normalize to the default.

## Testing Strategy

- Server unit tests prove create/update normalization and public payloads.
- Client unit tests prove clamping and generated CSS styles.
- Source regression tests prove the Admin form persists the transform and the
  three runtime asset types consume it.
- Manual browser smoke test covers pointer drag, zoom, reset, error messaging,
  confirmation, keyboard access, and responsive layout.

## Boundaries

- Always: preserve existing items with default transform; keep invalid assets
  inactive during QA; validate transform values at the API boundary.
- Ask first: adding an upload pipeline, modifying source image bytes, or adding
  an image-processing dependency.
- Never: trust transform values from the client without normalization; crop the
  original asset; expose private player inventory in public room payloads.

Server-side MIME/dimension probing and the durable Incident scanner remain the
next phase of the previously approved asset-validation plan. This slice adds
immediate Admin load/fit feedback and runtime-consistent framing.

## Success Criteria

- Existing items render unchanged with `{ scale: 1, x: 0, y: 0 }`.
- A mismatched image shows a warning and cannot be saved until framing is
  confirmed.
- A broken/non-image URL shows an error and cannot be saved from the Admin form.
- Pointer drag, zoom slider, X/Y range inputs, and reset update the preview.
- Saved transforms survive create/edit and are applied to Field, Protector, and
  Avatar Frame runtime renderers.
- Server/client tests and the client production build pass.

## Open Questions

None for this increment. Recommended target pixel dimensions and binary asset
limits will be finalized with server-side asset probing in the next phase.
