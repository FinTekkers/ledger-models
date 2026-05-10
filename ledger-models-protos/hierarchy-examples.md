# Hierarchy worked examples

Concrete real-world instruments mapped across the three classification dimensions shipping in M1: **productType**, **asset_class**, **instrument_type**.

This file ships alongside [`hierarchy.json`](./hierarchy.json) as the canonical reference for "what does each leaf productType actually represent". Reproduced from [second-brain#256](https://github.com/FinTekkers/second-brain/issues/256), narrowed and revised per the M1 design feedback round.

> **M1 scope notes.**
>
> 1. The umbrella spec describes a 4-dimensional registry. M1 ships 3 of those dimensions (productType, asset_class, instrument_type). The fourth dimension — **index_type** (`single_name` vs `index`) — is intentionally deferred and will be added in a future milestone.
> 2. **Option strategy productTypes are intentionally absent.** A butterfly, calendar spread, iron condor, etc. is a *shape* derived from leg composition, not a productType in its own right. Multi-leg packages are represented by a Security with `repeated SecurityIdProto legs` populated; each leg points at a vanilla option Security. The strategy's productType is just the underlying vanilla productType.
> 3. **`single_name` and `index` flavours collapse onto one leaf for now.** While the index_type dimension is deferred, leaves like `CDS` (which would split into single-name and index variants once index_type lands) cover both via the legs / underlying reference, and `EQUITY_VANILLA` covers both AAPL options and SPX index options.

---

## Fixed Income

> **The Treasury sub-tree mixes orthogonal axes for pragmatic reasons.** TBILL/TREASURY_NOTE/TREASURY_BOND are tenor distinctions of the same coupon-or-discount instrument. TIPS/TREASURY_FRN are coupon-mechanism distinctions. STRIPS is a processing of an underlying note/bond. They sit at the same depth because that matches market-conventional naming and serializer-dispatch needs, not because they form a clean orthogonal taxonomy.

| Specific instrument | productType | asset class | instrument_type |
| --- | --- | --- | --- |
| 13-week T-Bill (CUSIP 912797…) | BOND › GOV_BOND › TBILL | FIXED_INCOME › RATES | CASH |
| 2Y Treasury Note 4.0% (CUSIP 91282C…) | BOND › GOV_BOND › TREASURY_NOTE | FIXED_INCOME › RATES | CASH |
| 30Y Treasury Bond 4.25% 2055 | BOND › GOV_BOND › TREASURY_BOND | FIXED_INCOME › RATES | CASH |
| 10Y TIPS 1.625% real coupon | BOND › GOV_BOND › TIPS | FIXED_INCOME › RATES | CASH |
| 2Y Treasury FRN tied to 13W bill rate | BOND › GOV_BOND › TREASURY_FRN | FIXED_INCOME › RATES | CASH |
| Treasury STRIPS PO 2055-08-15 (CUSIP 912834ZG6) | BOND › GOV_BOND › STRIPS | FIXED_INCOME › RATES | CASH |
| German Bund 2% 2034 | BOND › GOV_BOND › SOVEREIGN_BOND | FIXED_INCOME › RATES | CASH |
| AAPL 4.5% 2030 (CUSIP 037833…) | BOND › CREDIT_BOND › CORP_BOND | FIXED_INCOME › CREDIT | CASH |
| California GO 5% 2035 | BOND › CREDIT_BOND › MUNI_BOND | FIXED_INCOME › CREDIT | CASH |
| AAPL 1.25% 2027 convertible *(planned)* | BOND › CREDIT_BOND › CONVERTIBLE_BOND | FIXED_INCOME › CREDIT | CASH |
| FNMA 30Y 5.5% pool *(planned)* | BOND › STRUCTURED_BOND › MBS_PASSTHROUGH | FIXED_INCOME › CREDIT | CASH |
| ZN Jun 2026 (10Y Treasury future) *(planned)* | FUTURE › BOND_FUTURE | FIXED_INCOME › RATES | DERIVATIVE |
| SR3 Mar 2027 (3M SOFR future) *(planned)* | FUTURE › INTEREST_RATE_FUTURE | FIXED_INCOME › RATES | DERIVATIVE |
| 5Y USD IRS (fixed 4% vs 3M SOFR) *(planned)* | SWAP › RATES_SWAP › IRS | FIXED_INCOME › RATES | DERIVATIVE |
| 5Y × 10Y receiver swaption (single) *(planned)* | OPTION › RATES_OPTION › SWAPTION › SWAPTION_VANILLA | FIXED_INCOME › RATES | DERIVATIVE |
| 5Y SOFR cap @ 4.0% *(planned)* | OPTION › RATES_OPTION › INTEREST_RATE_CAP | FIXED_INCOME › RATES | DERIVATIVE |
| 5Y SOFR floor @ 3.0% *(planned)* | OPTION › RATES_OPTION › INTEREST_RATE_FLOOR | FIXED_INCOME › RATES | DERIVATIVE |
| 5Y AAPL CDS (single-name) *(planned)* | SWAP › CREDIT_SWAP › CDS | FIXED_INCOME › CREDIT | DERIVATIVE |
| 5Y CDX.NA.IG (Markit IG index, 125 names) *(planned)* | SWAP › CREDIT_SWAP › CDS | FIXED_INCOME › CREDIT | DERIVATIVE |
| TRS on AAPL 4.5% 2030 *(planned)* | SWAP › CREDIT_SWAP › TRS_BOND | FIXED_INCOME › CREDIT | DERIVATIVE |
| Overnight Treasury Repo *(planned)* | FINANCING › REPO | FIXED_INCOME › RATES | CASH |
| Bloomberg US Treasury Index | INDEX › BOND_INDEX | FIXED_INCOME › RATES | REFERENCE_INDEX |
| .SOFR (Secured Overnight Financing Rate) | INDEX › SOFR_SERIES | FIXED_INCOME › RATES | REFERENCE_INDEX |
| .CPI (CPI level series) | INDEX › CPI_SERIES | FIXED_INCOME › RATES | REFERENCE_INDEX |

Single-name CDS and CDX index swaps share the `CDS` leaf today — the distinction will be carried by the index_type dimension when it lands. Until then, the reference name(s) live on the Security identity.

## Equity

| Specific instrument | productType | asset class | instrument_type |
| --- | --- | --- | --- |
| AAPL common stock | STOCK › COMMON_STOCK | EQUITY | CASH |
| Bank of America Series E preferred | STOCK › PREFERRED_STOCK | EQUITY | CASH |
| TSM (Taiwan Semiconductor ADR) | STOCK › ADR | EQUITY | CASH |
| SPY (SPDR S&P 500 ETF) | STOCK › ETF | EQUITY | CASH |
| .SPX (S&P 500 cash index value) | INDEX › EQUITY_INDEX | EQUITY | REFERENCE_INDEX |
| .NDX (Nasdaq 100 cash index value) | INDEX › EQUITY_INDEX | EQUITY | REFERENCE_INDEX |
| .RUT (Russell 2000 cash index value) | INDEX › EQUITY_INDEX | EQUITY | REFERENCE_INDEX |
| ES Mar 2026 (E-mini S&P 500 future) *(planned)* | FUTURE › EQUITY_INDEX_FUTURE | EQUITY | DERIVATIVE |
| AAPL 2026-03-21 $200 Call *(planned)* | OPTION › EQUITY_OPTION › EQUITY_VANILLA | EQUITY | DERIVATIVE |
| TSLA 2026-04-18 $300 Put *(planned)* | OPTION › EQUITY_OPTION › EQUITY_VANILLA | EQUITY | DERIVATIVE |
| SPX 2026-03-21 5500 Put *(planned)* | OPTION › EQUITY_OPTION › EQUITY_VANILLA | EQUITY | DERIVATIVE |
| TRS on AAPL stock *(planned)* | SWAP › EQUITY_SWAP › TRS_EQUITY | EQUITY | DERIVATIVE |

Multi-leg equity strategies (verticals, calendars, butterflies, condors, straddles, strangles, iron flies, iron condors, risk reversals, collars) are not standalone productTypes. They are represented by a Security whose `legs` field references the per-leg vanilla Security IDs. Querying "all equity option strategies" walks `legs` populated alongside `productType=EQUITY_VANILLA` (or future packaged-strategy types as exchanges list them).

## Volatility

| Specific instrument | productType | asset class | instrument_type |
| --- | --- | --- | --- |
| .VIX (CBOE Volatility Index value) | INDEX › VIX_SPOT | VOLATILITY | REFERENCE_INDEX |
| VIX Apr 2026 Future *(planned)* | FUTURE › VIX_FUTURE | VOLATILITY | DERIVATIVE |
| 1Y SPX variance swap *(planned)* | SWAP › VOLATILITY_SWAP › VARIANCE_SWAP | VOLATILITY | DERIVATIVE |

## Cash / FX

`CASH` and `FX` are now distinct asset classes. A USD currency holding is `CASH` (cash position), but a EUR/USD spot trade is `FX` (foreign exchange exposure) — same instrument_type=CASH, different economic exposure.

| Specific instrument | productType | asset class | instrument_type |
| --- | --- | --- | --- |
| USD currency holding | CASH_INSTRUMENT › CURRENCY | CASH | CASH |
| EUR/USD spot | CASH_INSTRUMENT › FX_SPOT | FX | CASH |
| Vanguard Federal Money Market Fund | CASH_INSTRUMENT › MONEY_MARKET_FUND | CASH | CASH |
| EUR/USD 3M forward *(planned)* | FORWARD › FX_FORWARD | FX | DERIVATIVE |
| EUR/USD 3M FX swap (spot + forward) *(planned)* | SWAP › FX_SWAP_GROUP › FX_SWAP | FX | DERIVATIVE |
| 5Y USD/JPY cross-currency basis swap *(planned)* | SWAP › FX_SWAP_GROUP › XCCY_SWAP | FX | DERIVATIVE |
| EUR/USD 1M ATM Call *(planned)* | OPTION › FX_OPTION › FX_VANILLA | FX | DERIVATIVE |

## Crypto

`BITCOIN`, `ETHEREUM`, `USDC` are **not** productTypes — same way `AAPL` is not a productType. The leaf productTypes are the **kind** of crypto; specific coins are Security identities under those leaves.

Note the asset class split: `CRYPTOCURRENCY` carries asset_class=`CRYPTO` (volatile reserve-asset exposure), but `STABLECOIN` carries asset_class=`CASH` (peg, redeem, counterparty — economic exposure to a pegged unit, not to the crypto market).

| Specific instrument | productType | asset class | instrument_type |
| --- | --- | --- | --- |
| Bitcoin (BTC-USD) | CRYPTO › CRYPTOCURRENCY | CRYPTO | CASH |
| Ethereum (ETH-USD) | CRYPTO › CRYPTOCURRENCY | CRYPTO | CASH |
| Solana (SOL-USD) | CRYPTO › CRYPTOCURRENCY | CRYPTO | CASH |
| USDC stablecoin | CRYPTO › STABLECOIN | CASH | CASH |
| USDT stablecoin | CRYPTO › STABLECOIN | CASH | CASH |
| DAI stablecoin | CRYPTO › STABLECOIN | CASH | CASH |

## Commodity

| Specific instrument | productType | asset class | instrument_type |
| --- | --- | --- | --- |
| Spot gold (XAU/USD) | COMMODITY_SPOT › PRECIOUS_METAL › GOLD | COMMODITY › METALS | CASH |
| Spot silver (XAG/USD) | COMMODITY_SPOT › PRECIOUS_METAL › SILVER | COMMODITY › METALS | CASH |
| GC Apr 2026 (CME gold future) *(planned)* | FUTURE › COMMODITY_FUTURE › GOLD_FUTURE | COMMODITY › METALS | DERIVATIVE |
| HG Mar 2026 (CME copper future) *(planned)* | FUTURE › COMMODITY_FUTURE › BASE_METAL_FUTURE | COMMODITY › METALS | DERIVATIVE |
| CL Apr 2026 (NYMEX WTI crude future) *(planned)* | FUTURE › COMMODITY_FUTURE › ENERGY_FUTURE | COMMODITY › ENERGY | DERIVATIVE |
| ZW Mar 2026 (CBOT wheat future) *(planned)* | FUTURE › COMMODITY_FUTURE › AGRICULTURAL_FUTURE | COMMODITY › AGRICULTURAL | DERIVATIVE |
| GC Mar 2026 $2200 Call (gold future option) *(planned)* | OPTION › COMMODITY_OPTION › COMMODITY_VANILLA | COMMODITY › METALS | DERIVATIVE |
| Bloomberg Commodity Index | INDEX › COMMODITY_INDEX | COMMODITY | REFERENCE_INDEX |

## Alternative

| Specific instrument | productType | asset class | instrument_type |
| --- | --- | --- | --- |
| LP interest in private-equity fund *(planned)* | FUND_LP | ALTERNATIVE | CASH |

---

## How to read a row

For any row, the three columns answer three orthogonal questions about the instrument:

| Column | Question it answers |
| --- | --- |
| **productType** | What kind of contract is this? (Walked as `PARENT › CHILD`; the leaf is what the proto carries.) |
| **asset_class** | What exposure family does it belong to? (Walked similarly; consumers can ask "all FIXED_INCOME" via `descendantsOf`.) |
| **instrument_type** | Does it settle to a position (`CASH`), derive value from an underlying (`DERIVATIVE`), or is it observational only (`REFERENCE_INDEX`)? |

The key insight: these dimensions are independent. A vanilla AAPL call (`EQUITY_VANILLA`) is `EQUITY + DERIVATIVE`; SPY (an ETF) is `EQUITY + CASH`; .SPX (the index level itself) is `EQUITY + REFERENCE_INDEX`. All three sit in the same `EQUITY` asset class but answer the productType and instrument_type questions differently.

## Common queries against this registry

```
"All fixed income"
  → isDescendantOf(AssetClass, assetClassOf(productType), 'FIXED_INCOME')

"All derivatives"
  → instrumentTypeOf(productType) == 'DERIVATIVE'

"All bond-shaped"
  → isDescendantOf(productType, 'BOND')

"All government bonds (treasuries + sovereigns)"
  → isDescendantOf(productType, 'GOV_BOND')

"All credit bonds (corp + muni + future converts/CoCos/structured)"
  → isDescendantOf(productType, 'CREDIT_BOND')

"All credit swaps (CDS + CDX + bond TRS, regardless of single vs index)"
  → isDescendantOf(productType, 'CREDIT_SWAP')

"All FX exposures (spot, forward, swap, xccy, FX vanilla, eventually FX options)"
  → assetClassOf(productType) == 'FX'

"All on-the-run treasuries"
  → productType IN (TBILL, TREASURY_NOTE, TREASURY_BOND, TIPS, TREASURY_FRN)
    AND auction_status == 'on_the_run'   (auction_status not in this registry — lives elsewhere)

"All cash positions" (positionable, not derivatives, not observational)
  → instrumentTypeOf(productType) == 'CASH'
```

These queries are powered by the registry helpers shipped in M1.5: `parentOf`, `descendantsOf`, `isDescendantOf`, `assetClassOf`, `instrumentTypeOf`, `labelOf`. Identical signatures across Java / Rust / Python / JS-TS. (`indexTypeOf` is deferred along with the index_type dimension itself.)

---

## Look-through: legal form vs economic substance

The registry classifies legal form, not economic substance. A bond ETF lives at `STOCK › ETF` with asset_class `EQUITY` because that is its instrument structure, even though its economic exposure is fixed income. Risk look-through (bond ETF → underlying bond exposure) is a separate concern, typically resolved at the position-service layer or in dedicated risk reporting.

The same principle applies elsewhere:

- A money-market fund (`MONEY_MARKET_FUND`) is `CASH` even though its underlying holdings are short-tenor treasuries and commercial paper.
- A stablecoin (`STABLECOIN`) is `CASH` (economic exposure to a pegged unit) even though its productType lives under the `CRYPTO` parent (transport/structural relationship).
- A leveraged ETF on the S&P 500 is still `STOCK › ETF` with asset_class `EQUITY` — the leverage is a substance question, not a form question.

If you need to see-through, that's a downstream concern. The registry tells you what the wrapper is; the wrapper's contents are someone else's job.
