# ADR: PRINCIPAL_PAYDOWN transaction type

## Status

Proposed (draft PR — enum addition only; consumer wiring follow-on).

## Context

Several distinct instruments share an identical economic event: the issuer returns part of the holder's principal without a market trade. Today, the platform has no transaction type that captures this — loaders work around the gap by emitting `SELL` (which conflates market sales with non-market principal returns) or `MATURATION` (which implies the security has fully extinguished).

Instruments affected:

| Instrument | Event |
|---|---|
| **MBS pass-through** | Monthly principal pass-through from mortgage paydowns; security continues, face decreases |
| **Amortizing bonds** | Scheduled sinking-fund principal payments through the bond's life |
| **PE / closed-end funds** | LPs receive "return of capital" distributions as the fund harvests investments |
| **Perpetual / partial-call bonds** | Issuer partially calls the bond, returning principal but leaving the security live |

In all four cases the holder's position notional decreases by the returned amount, no counterparty trades on a market, and no P&L is realized at the principal-return event (the cost basis per unit of remaining face is unchanged).

The current platform shortcut — emitting `SELL` for these events — has two concrete failure modes:

1. **Tie-out drift**: a SOMA MBS book recorded as SELL transactions reads as ~3× over the NYFed published face value, because every paydown gets a SELL while only the original purchases get BUYs. The history aggregates as "we sold more than we hold" even though SOMA never sold an MBS. (Observed in `status/soma_mbs_tieout_summary_20260527.md`.)
2. **False P&L realization**: tax-lot and realized-P&L code paths treat SELL as a market exit and try to compute gain/loss against the security's then-market price. For principal returns at par, this manufactures phantom P&L.

`MATURATION` is also wrong: it signals the security has terminated, which is true at the *final* paydown but not the dozens of partial ones along the way.

Issue [#321](https://github.com/FinTekkers/second-brain/issues/321) tracks the loader-side correction; this ADR formalizes the type itself.

## Decision

Introduce two new values on `TransactionTypeProto`:

```proto
PRINCIPAL_PAYDOWN=7;
PRINCIPAL_PAYDOWN_OFFSET=8;
```

The pair mirrors the existing `MATURATION` / `MATURATION_OFFSET` shape:
- `PRINCIPAL_PAYDOWN` is the security leg — face decreases by `quantity`.
- `PRINCIPAL_PAYDOWN_OFFSET` is the cash leg — the offsetting cash credit, attached as a child transaction.

### Semantic distinctions

| Type | Security leg | P&L event | Cost basis effect | Terminal? |
|---|---|---|---|---|
| `SELL` | Face reduces | Yes — realize gain/loss vs. market price | Releases proportional cost basis as realized | No |
| `MATURATION` | Face → 0 | Usually no (par return) | Releases all remaining cost basis | **Yes** |
| `PRINCIPAL_PAYDOWN` | Face reduces | **No** | **Unchanged unit cost**; total cost basis decreases proportionally | No |

The cost-basis behavior is the load-bearing distinction:
- After a `SELL` of half a position, average unit cost may shift (FIFO/LIFO/average dictate which lots were closed).
- After a `PRINCIPAL_PAYDOWN` of half the face, the average unit cost is unchanged — every remaining unit cost the same as before, since principal was returned at par.

### Consumer obligations

Implementations across services must, at minimum:

1. **P&L paths** must treat `PRINCIPAL_PAYDOWN` as a zero-P&L event and reduce the position's face by the transaction's `quantity` without triggering tax-lot realization.
2. **Position aggregators** must subtract `PRINCIPAL_PAYDOWN.quantity` from the security's net face, mirroring how they subtract `SELL.quantity`.
3. **Cost-basis calculators** must reduce total cost basis proportionally (`new_cost = old_cost * (1 - paydown_face / pre_paydown_face)`), preserving per-unit cost.
4. **Cash accounting** must treat the paired `PRINCIPAL_PAYDOWN_OFFSET` as the cash inflow, same way they treat `MATURATION_OFFSET`.

These behaviors are not enforced by this ADR's enum change alone — consumer wiring is the follow-on. Until consumers implement the type, loaders should not emit it: a `PRINCIPAL_PAYDOWN` written today would be ignored or mishandled by downstream code paths.

## Consequences

**Positive**
- Loaders can stop conflating market sales with non-market principal returns ([#321](https://github.com/FinTekkers/second-brain/issues/321)).
- Tie-outs against issuer-published face values (NYFed SOMA, bond trustee reports, GP capital-account statements) become possible.
- P&L for amortizing instruments matches reality — no phantom gains/losses from par-priced paydowns.

**Negative**
- Existing loaders that emit `SELL` for paydowns must be migrated. The MBS loader is the immediate user; amortizing-bond loaders and PE-capital-call/return loaders are downstream consumers.
- Historical data already loaded as `SELL` for paydowns must be reclassified — a separate migration script, not in scope for this ADR.

**Neutral**
- The enum addition is wire-compatible with existing consumers — old code that switches on `TransactionTypeProto` will simply not match `PRINCIPAL_PAYDOWN` until they're updated, which is a feature not a bug (forces explicit handling).

## Out of scope

- Consumer wiring (ledger-service P&L, position aggregators, cash accounting). Separate PRs per service.
- Migration of historical `SELL`-tagged paydowns to `PRINCIPAL_PAYDOWN`. Separate one-shot.
- Loader changes (MBS, amortizing bonds, PE distributions). [#321](https://github.com/FinTekkers/second-brain/issues/321) covers the MBS case.
- Catalog hierarchy.json updates if any product type's tagging changes — not believed to be required.

## References

- Issue [#321](https://github.com/FinTekkers/second-brain/issues/321): MBS distinguish principal paydown from active sale
- `status/soma_mbs_tieout_summary_20260527.md`: empirical evidence that SELL-as-paydown produces ~3× over-count vs source-of-truth NYFed face values
- `docs/adr/is_link_pattern.md`: precedent ADR shape
