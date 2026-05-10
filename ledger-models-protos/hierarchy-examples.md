# Hierarchy worked examples

Concrete real-world instruments mapped across the three classification dimensions shipping in M1: **productType**, **asset_class**, **instrument_type**.

This file ships alongside [`hierarchy.json`](./hierarchy.json) as the canonical reference for "what does each leaf productType actually represent". Reproduced from [second-brain#256](https://github.com/FinTekkers/second-brain/issues/256).

> **M1 scope note.** The umbrella spec describes a 4-dimensional registry. M1 ships 3 of those dimensions (productType, asset_class, instrument_type). The fourth dimension — **index_type** (`single_name` vs `index`) — is intentionally deferred and will be added in a future milestone. The worked-examples tables below have been narrowed accordingly.

Both productType and asset_class are trees and are written in `PARENT › CHILD` notation throughout. Abstract parent nodes (BOND, GOV_BOND, OPTION, EQUITY_OPTION, …) appear in `hierarchy.json` for tree walking but never get assigned to a Security — leaves are what holdings carry.

> **Status legend.** Examples marked **(planned)** correspond to leaf productTypes whose `status: "planned"` in `hierarchy.json` — they live in the registry for forward-looking design and consumer planning, but the proto enum value isn't shipped yet. Examples without a marker correspond to `status: "active"` leaves and are usable today.

---

## Fixed Income

| Specific instrument | productType | asset class | instrument_type |
| --- | --- | --- | --- |
| 13-week T-Bill (CUSIP 912797…) | BOND › GOV_BOND › TBILL | FIXED_INCOME › RATES | CASH |
| 2Y Treasury Note 4.0% (CUSIP 91282C…) | BOND › GOV_BOND › TREASURY_NOTE | FIXED_INCOME › RATES | CASH |
| 30Y Treasury Bond 4.25% 2055 | BOND › GOV_BOND › TREASURY_BOND | FIXED_INCOME › RATES | CASH |
| 10Y TIPS 1.625% real coupon | BOND › GOV_BOND › TIPS | FIXED_INCOME › RATES | CASH |
| 2Y Treasury FRN tied to 13W bill rate | BOND › GOV_BOND › TREASURY_FRN | FIXED_INCOME › RATES | CASH |
| Treasury STRIPS PO 2055-08-15 (CUSIP 912834ZG6) | BOND › GOV_BOND › STRIPS | FIXED_INCOME › RATES | CASH |
| German Bund 2% 2034 | BOND › GOV_BOND › SOVEREIGN_BOND | FIXED_INCOME › RATES | CASH |
| AAPL 4.5% 2030 (CUSIP 037833…) | BOND › CORP_BOND | FIXED_INCOME › CREDIT | CASH |
| California GO 5% 2035 | BOND › MUNI_BOND | FIXED_INCOME › CREDIT | CASH |
| ZN Jun 2026 (10Y Treasury future) *(planned)* | FUTURE › BOND_FUTURE | FIXED_INCOME › RATES | DERIVATIVE |
| SR3 Mar 2027 (3M SOFR future) *(planned)* | FUTURE › INTEREST_RATE_FUTURE | FIXED_INCOME › RATES | DERIVATIVE |
| 5Y USD IRS (fixed 4% vs 3M SOFR) *(planned)* | SWAP › IRS | FIXED_INCOME › RATES | DERIVATIVE |
| 5Y × 10Y receiver swaption (single) *(planned)* | OPTION › RATES_OPTION › SWAPTION › SWAPTION_VANILLA | FIXED_INCOME › RATES | DERIVATIVE |
| 5Y SOFR cap @ 4.0% *(planned)* | OPTION › RATES_OPTION › INTEREST_RATE_CAP | FIXED_INCOME › RATES | DERIVATIVE |
| 5Y SOFR floor @ 3.0% *(planned)* | OPTION › RATES_OPTION › INTEREST_RATE_FLOOR | FIXED_INCOME › RATES | DERIVATIVE |
| 5Y × 10Y receiver swaption butterfly *(planned)* | OPTION › RATES_OPTION › SWAPTION › SWAPTION_BUTTERFLY | FIXED_INCOME › RATES | DERIVATIVE |
| 5Y × 10Y / 5Y × 5Y swaption calendar spread *(planned)* | OPTION › RATES_OPTION › SWAPTION › SWAPTION_CALENDAR_SPREAD | FIXED_INCOME › RATES | DERIVATIVE |
| 5Y AAPL CDS *(planned)* | SWAP › CDS_SINGLE_NAME | FIXED_INCOME › CREDIT | DERIVATIVE |
| 5Y CDX.NA.IG (Markit IG index, 125 names) *(planned)* | SWAP › CDX_INDEX | FIXED_INCOME › CREDIT | DERIVATIVE |
| TRS on AAPL 4.5% 2030 *(planned)* | SWAP › TRS_BOND | FIXED_INCOME › CREDIT | DERIVATIVE |
| Bloomberg US Treasury Index | INDEX › BOND_INDEX | FIXED_INCOME › RATES | REFERENCE_INDEX |
| .SOFR (Secured Overnight Financing Rate) | INDEX › SOFR_SERIES | FIXED_INCOME › RATES | REFERENCE_INDEX |
| .CPI (CPI level series) | INDEX › CPI_SERIES | FIXED_INCOME › RATES | REFERENCE_INDEX |

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
| SPX 2026-03-21 5500 Put *(planned)* | OPTION › INDEX_OPTION › INDEX_VANILLA | EQUITY | DERIVATIVE |
| AAPL Mar 2026 $195/200 vertical call spread *(planned)* | OPTION › EQUITY_OPTION › EQUITY_VERTICAL_SPREAD | EQUITY | DERIVATIVE |
| AAPL Mar/Apr 2026 $200 calendar call spread *(planned)* | OPTION › EQUITY_OPTION › EQUITY_CALENDAR_SPREAD | EQUITY | DERIVATIVE |
| AAPL Mar 2026 $190/200/210 call butterfly *(planned)* | OPTION › EQUITY_OPTION › EQUITY_BUTTERFLY | EQUITY | DERIVATIVE |
| TSLA Apr 2026 ATM straddle *(planned)* | OPTION › EQUITY_OPTION › EQUITY_STRADDLE | EQUITY | DERIVATIVE |
| AAPL collar (long stock + put + short call) *(planned)* | OPTION › EQUITY_OPTION › EQUITY_COLLAR | EQUITY | DERIVATIVE |
| SPX Mar 2026 5400/5500/5600 call butterfly *(planned)* | OPTION › INDEX_OPTION › INDEX_BUTTERFLY | EQUITY | DERIVATIVE |
| SPX Mar 2026 iron condor (5300/5400/5600/5700) *(planned)* | OPTION › INDEX_OPTION › INDEX_IRON_CONDOR | EQUITY | DERIVATIVE |
| TRS on AAPL stock *(planned)* | SWAP › TRS_EQUITY | EQUITY | DERIVATIVE |

## Volatility

| Specific instrument | productType | asset class | instrument_type |
| --- | --- | --- | --- |
| .VIX (CBOE Volatility Index value) | INDEX › VIX_SPOT | VOLATILITY | REFERENCE_INDEX |
| VIX Apr 2026 Future *(planned)* | FUTURE › VIX_FUTURE | VOLATILITY | DERIVATIVE |
| 1Y SPX variance swap *(planned)* | SWAP › VARIANCE_SWAP | VOLATILITY | DERIVATIVE |

## Cash / FX

| Specific instrument | productType | asset class | instrument_type |
| --- | --- | --- | --- |
| USD currency holding | CASH_INSTRUMENT › CURRENCY | CASH | CASH |
| EUR/USD spot | CASH_INSTRUMENT › FX_SPOT | CASH | CASH |
| Vanguard Federal Money Market Fund | CASH_INSTRUMENT › MONEY_MARKET_FUND | CASH | CASH |
| EUR/USD 3M forward *(planned)* | FORWARD › FX_FORWARD | CASH | DERIVATIVE |
| EUR/USD 3M FX swap (spot + forward) *(planned)* | SWAP › FX_SWAP | CASH | DERIVATIVE |
| 5Y USD/JPY cross-currency basis swap *(planned)* | SWAP › XCCY_SWAP | FIXED_INCOME › RATES | DERIVATIVE |
| EUR/USD 1M ATM Call *(planned)* | OPTION › FX_OPTION › FX_VANILLA | CASH | DERIVATIVE |
| EUR/USD 1M 25Δ risk reversal *(planned)* | OPTION › FX_OPTION › FX_RISK_REVERSAL | CASH | DERIVATIVE |
| EUR/USD 1M ATM straddle *(planned)* | OPTION › FX_OPTION › FX_STRADDLE | CASH | DERIVATIVE |

## Crypto

`BITCOIN` and `ETHEREUM` are **not** productTypes — same way `AAPL` is not a productType. The leaf productTypes are the **kind** of crypto; specific coins are Security identities under those leaves.

| Specific instrument | productType | asset class | instrument_type |
| --- | --- | --- | --- |
| Bitcoin (BTC-USD) | CRYPTO › CRYPTOCURRENCY | CRYPTO | CASH |
| Ethereum (ETH-USD) | CRYPTO › CRYPTOCURRENCY | CRYPTO | CASH |
| Solana (SOL-USD) | CRYPTO › CRYPTOCURRENCY | CRYPTO | CASH |
| USDC stablecoin | CRYPTO › STABLECOIN | CRYPTO | CASH |
| USDT stablecoin | CRYPTO › STABLECOIN | CRYPTO | CASH |
| DAI stablecoin | CRYPTO › STABLECOIN | CRYPTO | CASH |

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

---

## How to read a row

For any row, the three columns answer three orthogonal questions about the instrument:

| Column | Question it answers |
| --- | --- |
| **productType** | What kind of contract is this? (Walked as `PARENT › CHILD`; the leaf is what the proto carries.) |
| **asset_class** | What exposure family does it belong to? (Walked similarly; consumers can ask "all FIXED_INCOME" via `descendantsOf`.) |
| **instrument_type** | Does it settle to a position (`CASH`), derive value from an underlying (`DERIVATIVE`), or is it observational only (`REFERENCE_INDEX`)? |

The key insight: these dimensions are independent. A single-leg AAPL call (`EQUITY_VANILLA`) is `EQUITY + DERIVATIVE`; an SPX butterfly (`INDEX_BUTTERFLY`) is `EQUITY + DERIVATIVE`; SPY (an ETF) is `EQUITY + CASH`; .SPX (the index level itself) is `EQUITY + REFERENCE_INDEX`. All four sit in the same `EQUITY` asset class but answer the productType and instrument_type questions differently.

## Common queries against this registry

```
"All fixed income"
  → isDescendantOf(AssetClass, assetClassOf(productType), 'FIXED_INCOME')

"All derivatives"
  → instrumentTypeOf(productType) == 'DERIVATIVE'

"All bond-shaped"
  → isDescendantOf(productType, 'BOND')

"All equity options (vanilla + every strategy)"
  → isDescendantOf(productType, 'EQUITY_OPTION')

"All rates options (swaptions + caps/floors)"
  → isDescendantOf(productType, 'RATES_OPTION')

"All on-the-run treasuries"
  → productType IN (TBILL, TREASURY_NOTE, TREASURY_BOND, TIPS, TREASURY_FRN)
    AND auction_status == 'on_the_run'   (auction_status not in this registry — lives elsewhere)

"All cash positions" (positionable, not derivatives, not observational)
  → instrumentTypeOf(productType) == 'CASH'
```

These queries are powered by the registry helpers shipped in M1.5: `parentOf`, `descendantsOf`, `isDescendantOf`, `assetClassOf`, `instrumentTypeOf`, `labelOf`. Identical signatures across Java / Rust / Python / JS-TS. (`indexTypeOf` is deferred along with the index_type dimension itself.)
