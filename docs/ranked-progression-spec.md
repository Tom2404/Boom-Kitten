# Spec: Ranked Progression Rebalance

## Objective

Shorten the path to high ranks without making rank progression purely playtime-based. Preserve multiplayer placement-based ELO while adding faster provisional gains, modest win-streak momentum, early placement protection, and temporary tier floors after promotion.

## Rank Structure

- Bronze: 1000, two subdivisions (II, I)
- Silver: 1200, three subdivisions (III, II, I)
- Gold: 1500, three subdivisions (III, II, I)
- Platinum: 1800, four subdivisions (IV, III, II, I)
- Diamond: 2200, four subdivisions (IV, III, II, I)
- Legend: 2600+
- Subdivision boundaries are evenly distributed within each tier.

## ELO Pacing

- Games 0–9: K 60 and maximum change 80.
- Games 10–29: K 45 and maximum change 65.
- Games 30+: K 36 below Platinum, 32 in Platinum, 28 in Diamond, and 20 in Legend.
- Consecutive wins add +3 at two wins, +6 at three wins, and +10 from four wins onward.
- During the first 10 ranked games, a player finishing in the top half cannot lose ELO.
- Promotion into a new tier grants a three-ranked-game floor at that tier's entry ELO.

## Compatibility

- Existing tier-only ranks and removed subdivisions normalize to valid ranks.
- Existing API and socket payload shapes remain unchanged.
- Rank rewards continue to use ordered subdivisions and tier transitions.

## Verification

- Unit tests cover every rank boundary, K-factor band, streak bonus, provisional protection, and tier-floor behavior.
- All server tests pass.
- Client production build succeeds after fallback labels are updated.
