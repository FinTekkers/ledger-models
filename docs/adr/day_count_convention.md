# ADR: day_count_convention — how a bond counts days, by bond and by product

## Status

Accepted (LM-498). Additive: a new `DayCountConventionProto` enum, an optional `BondDetailsProto.day_count = 11`, a new top-level `default_day_count` key in `hierarchy.json` (`schema_version` 1.6), a resolver and date helpers in every binding, and a `day_count` getter on each security wrapper. No existing field, number, enum value or section changes. The `LM-498` rule in `scripts/checks/wire-diff.py` allows exactly the new enum and field.

## Context

Bonds carried no day-count convention, so valuation-service computed accrued interest and coupon-period fractions the same way, ACT/ACT, for every bond. That is right for Treasuries and wrong for US corporates and agencies (30/360 US, bond basis) and for bills (ACT/360).

Found with the CoreWeave 9.25% 2030 note (`CORP_BOND`, semiannual, coupon dates 1 Jun / 1 Dec) on 25 Nov. At a mid-period settlement on 2027-03-01, price 85, in the coupon period 2026-12-01 → 2027-06-01:

| Convention | Days | Fraction | Accrued | Yield |
| --- | --- | --- | --- | --- |
| ACT/ACT ICMA (what valuation used) | 90 of 182 | period 90/182, year 90/364 | 9.25/2 × 90/182 = 2.2871 | 15.2529% |
| 30/360 US (correct) | 90 | year 90/360 | 9.25 × 90/360 = 2.3125 | 15.2573% |

Which convention a bond uses is a fact about the bond and its product. It belongs in the shared model, in one place every binding reads, so no service guesses.

## Decision

### The conventions (the proto comments are the spec)

From `ledger-models-protos/fintekkers/models/security/day_count_convention.proto`. D1/M1/Y1 is the start date, D2/M2/Y2 the end date; the start is excluded and the end included. A year fraction is always in years.

| Value | Number | Days | Year fraction |
| --- | --- | --- | --- |
| `UNKNOWN_DAY_COUNT` | 0 | — | — (no convention is known; readers must not guess one) |
| `ACT_ACT_ICMA` | 1 | actual | days / (F × period days), F coupons a year, inside one regular coupon period. Period fraction = days / period days. |
| `THIRTY_360_US` | 2 | 360·(Y2−Y1) + 30·(M2−M1) + (D2−D1), after: 1. if D1 = 31, D1 = 30; 2. if D2 = 31 and D1 ≥ 30, D2 = 30. **No February end-of-month adjustment.** | days / 360 |
| `ACT_360` | 3 | actual | days / 360 |
| `ACT_365_FIXED` | 4 | actual | days / 365, leap years too |

30/360 US here is bond basis (ISDA 2006 §4.16(f)), not the SIA/"30/360 US with EOM" variant: 2027-02-28 → 2027-03-31 is 33 days, and 2027-01-31 → 2027-02-28 is 28.

ICMA covers regular periods only. Stub (short or long first/last) periods belong to valuation-service's stub-aware bond item.

### The field

```proto
optional DayCountConventionProto day_count = 11;   // on BondDetailsProto
```

Proto3 `optional`, so every binding can tell unset from an explicit value (`hasDayCount()`, `HasField("day_count")`, `day_count.is_none()`). Unset means the product default. An explicit `UNKNOWN_DAY_COUNT` resolves like unset; it still round-trips as present on the wire.

### The product defaults live in hierarchy.json only

```json
"default_day_count": {
  "TREASURY_NOTE": "ACT_ACT_ICMA",
  "TREASURY_BOND": "ACT_ACT_ICMA",
  "TIPS":          "ACT_ACT_ICMA",
  "STRIPS":        "ACT_ACT_ICMA",
  "TBILL":         "ACT_360",
  "CORP_BOND":     "THIRTY_360_US"
}
```

- **Leaf keys only.** There is no entry on `GOV_BOND` or `BOND`. Otherwise `TREASURY_FRN`, `SOVEREIGN_BOND`, `MUNI_BOND` and `MORTGAGE_BACKED` would inherit a convention nobody chose for them. They resolve to `UNKNOWN_DAY_COUNT` until an item classifies them.
- **No `AGENCY` key.** `AGENCY` is not a `product_types` node or a `ProductTypeProto` value, so the load check would reject it. Agency debentures booked as `CORP_BOND` get `THIRTY_360_US`. Agency MBS (`MORTGAGE_BACKED`) has no entry. An agency product type is a separate item.
- There is no mapping table in any binding. `ledger-models-protos/fixtures/default_day_count_cases.json` lists every `ProductTypeProto` value with its expected convention (or `UNKNOWN_DAY_COUNT`); every binding's tests check against it and check its keys equal the enum's names, so a new product fails all four suites until someone classifies it.

### Resolution rule (identical in every binding)

1. `bond_details.day_count` set to anything but `UNKNOWN_DAY_COUNT` wins. A number the reader's build does not know (a newer writer's value) resolves to `UNKNOWN_DAY_COUNT`, not the product default.
2. Otherwise walk the security's **raw** proto `product_type` up its `parent` chain; the first node with an entry decides.
3. No entry anywhere returns `UNKNOWN_DAY_COUNT`. It never raises and never falls back to ACT/ACT or any other convention. A security with no bond details, a non-bond product and `PRODUCT_TYPE_UNKNOWN` all land here.

The resolver reads the raw proto, never Java `BondSecurity.getProductType()` or `getProto()`, which turn an untyped bond into `TREASURY_NOTE`; that would be a silent ACT/ACT guess.

| Binding | Getter | Resolver / helpers |
| --- | --- | --- |
| Java | `Security.getDayCount()` | `common.models.security.DayCounts` |
| Python | `Security.get_day_count()` | `fintekkers.wrappers.models.security.day_count` |
| JS/TS | `Security.getDayCount()` | `node/wrappers/models/security/day_count.ts` (also exported from the package index) |
| Rust | `SecurityWrapper::day_count()` | `fintekkers::wrappers::models::day_count` |

### Date helpers

Each binding has `day_count(conv, start, end)`, `year_fraction(conv, start, end)`, `icma_period_fraction(start, end, period_start, period_end)` and `icma_year_fraction(..., frequency)`. They are plain date arithmetic: no accrual, price or yield code. They never read `hierarchy.json`, so a broken registry cannot break them. They return doubles (`f64` / `double` / `number` / `float`), exact to well inside 1e-12 for these fractions, and are **not** for decimal cash amounts.

Bad input is a typed input error, distinct from a registry error (docs/adr/typed-input-errors.md): `start > end`, an `UNKNOWN_DAY_COUNT` convention, `year_fraction` called with `ACT_ACT_ICMA` (use the ICMA form, which needs the period), ICMA dates outside the period, or a frequency that is not positive. Java `ModelValidationException`, Python and JS `ModelValidationError`, Rust `DayCountError`.

`test-fixtures/day-count/cases.json` holds the shared cases: month ends, Feb 28 and Feb 29 in leap and non-leap years, 31st→31st, 30th→31st, 31st→1st, February month-end end dates, an ICMA period spanning 2028-02-29, and the CoreWeave rows above. Every binding matches each day count exactly and each fraction within 1e-12.

### Load-time checks

The `default_day_count` section is parsed once, on first use, separately from every other section. A missing section, a non-object, a key that is not a `product_types` node, or a value that is not a `DayCountConventionProto` name or is `UNKNOWN_DAY_COUNT` fails with the binding's registry error (Java `IllegalStateException`, Python `InvalidRegistryError`, JS `Error`, Rust `ProductInputError::InvalidRegistry`). A broken day-count section does not stop price-type or product-input loads.

## Rulings recorded at approval

- Metric 2 drops `AGENCY` (not a product type, above).
- Every fixture `year_fraction` is in years. For CoreWeave under ICMA that is 90/364; ICMA rows also carry `period_fraction` 90/182.
- The CoreWeave ICMA coupon period is 2026-12-01 → 2027-06-01 (182 days). 2027-03-01 is the accrual end (settlement), not the period end.

## Alternatives considered

- **One shared product-defaults resolver** for `default_price_types` and `default_day_count`. Rejected: it rewrites the shipped LM-461 price-type path (`create_from`, `forTrade`) for speculative reuse, and a regression there brings back stuck trade prices.
- **Generate constant tables at build time** from `hierarchy.json`. Rejected: adds a codegen step and a staleness check, and splits the pattern from `default_price_types`, which rejected the same idea.
- **Default on `BOND` / `GOV_BOND`.** Rejected: FRNs, sovereigns, munis and MBS would silently inherit a convention.

## Consequences

- Treasury results do not change: an unset Treasury resolves to `ACT_ACT_ICMA`, what valuation-service already does.
- valuation-service applies the getter and helpers in its own stub-aware bond item; loaders may set `day_count` explicitly later. Nothing here computes accrued interest.
- Adding a `default_day_count` entry is additive; changing one changes accrued interest and yields for every unset bond of that product (`registry-versioning.md`).
- Rust struct literals that list every `BondDetailsProto` field (no `..Default::default()`) must add `day_count: None`, as with `callable` / `call_date` in LM-465. The library's own literals do; literals with `..Default::default()` are unaffected.
- Never reuse field 11 or the enum numbers. If the field is ever removed, mark it `reserved 11;`.
