# Shop Equipment V1 contract

## Slots and catalog types

| Equipment slot | `ShopItem.type` | Visibility |
| --- | --- | --- |
| `protector` | `protector` | Public player snapshot |
| `avatarFrame` | `avatar_frame` | Public player snapshot |
| `field` | `field` | Local player only |

`skin` and `emote` remain valid legacy catalog values but are excluded from the
player storefront. Equipment and ownership always reference the catalog
`ObjectId`; `null` means the default appearance.

## Assets

- `imageUrl` is the shop thumbnail.
- `previewUrl` is the runtime asset and falls back to `imageUrl`.
- Assets must use HTTPS or a same-origin path beginning with `/`.
- `http:`, `data:`, `javascript:` and protocol-relative URLs are rejected.
- Protector uses a static image near 2:3, Avatar Frame a transparent static
  image near 1:1, and Field a static image near 16:9.
- A missing or failed image restores the existing default presentation.

## Player APIs

### `GET /api/shop/items`

Returns only active, currently available `protector`, `avatar_frame`, and
`field` items. It remains subject to the Live Ops shop and maintenance gates.

### `GET /api/shop/owned`

Returns:

- `items`: owned public cosmetic descriptors.
- `ownedItemIds`: stable owned catalog IDs.
- `equipped`: resolved `protector`, `avatarFrame`, and `field` descriptors.
- `ownedSkins`, `ownedEmotes`, and `ownedAvatarFrames`: temporary compatibility
  fields.

### `PUT /api/shop/equipment/:slot`

Accepts `{ "itemId": "<id>" }`, or `{ "itemId": null }` to restore the
default. The server validates the slot, item type, item existence, and
ownership. An owned inactive or expired item remains equipable. Repeating the
same request is safe.

### `POST /api/shop/buy`

Purchases only an active and currently available V1 cosmetic, atomically
deducts Coin, records stable ownership, and writes the transaction ledger. It
does not equip the item automatically.

Expected domain error codes are `ITEM_ALREADY_OWNED`, `INSUFFICIENT_FUNDS`,
`ITEM_NOT_AVAILABLE`, `ITEM_NOT_OWNED`, and `SLOT_TYPE_MISMATCH`.

## Realtime presentation

Room and game player snapshots may contain only:

```json
{
  "userId": "player-id",
  "username": "Player",
  "avatar": "/avatars/player.webp",
  "avatarFrame": {
    "id": "catalog-id",
    "name": "Gold Frame",
    "rarity": "epic",
    "assetUrl": "/cosmetics/gold-frame.webp"
  },
  "protector": {
    "id": "protector-id",
    "name": "Inferno Protector",
    "rarity": "rare",
    "assetUrl": "/cosmetics/inferno-protector.webp"
  }
}
```

Inventory, Coin, and Field are never included in another player's socket
payload. Avatar Frame and Protector are captured on room entry and remain
unchanged for that room, including reconnects.

Each living opponent seat renders the Protector as a decorative miniature
hand: at most three overlapping card backs plus the exact numeric hand count.
Compact/rail layouts may reduce this to one card back plus the count. The UI
must never create one DOM card per card in hand, block target selection, or
expose card identities. Missing/broken assets fall back to the default card
back.
