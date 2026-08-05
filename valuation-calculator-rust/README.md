# Valuation Calculator — Rust

A zero-dependency bond valuation library implementing fixed-income pricing, yield, risk, and cashflow analytics.

## Quick Start

```rust
use valuation_calculator::calculator::*;
use valuation_calculator::bond::CouponType;
use valuation_calculator::date::Date;

let req = ValuationRequest {
    security: SecurityInput {
        coupon_rate: 0.05,          // 5% annual coupon
        coupon_freq: 2,             // semiannual
        coupon_type: CouponType::Fixed,
        face_value: 100.0,
        dated_date: Date::new(2025, 5, 15),
        maturity_date: Date::new(2035, 5, 15),
    },
    market_price: 97.50,            // clean price, % of par
    quantity: 1_000_000.0,          // face value held
    cost_basis: Some(99.0),         // purchase price, % of par
    settlement: Date::new(2025, 8, 20),
    measures: vec![
        Measure::YieldToMaturity,
        Measure::MacaulayDuration,
        Measure::ModifiedDuration,
        Measure::Convexity,
        Measure::Dv01,
        Measure::AccruedInterest,
        Measure::CleanPrice,
        Measure::DirtyPrice,
        Measure::PresentValue,
        Measure::CurrentYield,
        Measure::MarketValue,
        Measure::ProfitLoss,
        Measure::ProfitLossPercent,
        Measure::PresentValueCashflows,
    ],
};

let resp = valuation_calculator::calculator::valuate(&req);

// Scalar results
let ytm = resp.get(Measure::YieldToMaturity).unwrap();
let duration = resp.get(Measure::MacaulayDuration).unwrap();
let dv01 = resp.get(Measure::Dv01).unwrap();

// Cashflow schedule (when PresentValueCashflows is requested)
for cf in &resp.cashflows {
    println!("{}: FV={:.2}, PV={:.2}", cf.date, cf.fv_amount, cf.pv_amount);
}
```

## Supported Measures

| Measure | Description | Units |
|---------|-------------|-------|
| `YieldToMaturity` | Internal rate of return solving P = Σ CF/(1+y/n)^t | Decimal (0.05 = 5%) |
| `MacaulayDuration` | Weighted-average time to cashflows | Years |
| `ModifiedDuration` | Macaulay / (1 + y/n) — price sensitivity per 100bp | Years |
| `Convexity` | Second derivative of price/yield, normalised | Years² |
| `Dv01` | Dollar value of a basis point: ModDur × Price × 0.0001 | $/bp per $100 face |
| `CurrentYield` | Annual coupon / clean price | Decimal |
| `PresentValue` | Sum of discounted cashflows (= dirty price) | % of par |
| `AccruedInterest` | Pro-rated coupon since last payment | $ per $100 face |
| `CleanPrice` | Quoted price (dirty − accrued interest) | % of par |
| `DirtyPrice` | Invoice price (clean + accrued interest) | % of par |
| `MarketValue` | clean_price / 100 × quantity | $ |
| `ProfitLoss` | Market value − cost basis value | $ |
| `ProfitLossPercent` | P&L / cost basis value | Decimal |
| `PresentValueCashflows` | Full schedule with PV and FV per period | Populates `resp.cashflows` |
| `DirectedQuantity` | Pass-through of position quantity | Units |
| `UnadjustedCostBasis` | Pass-through of cost basis price | % of par |

## Architecture

```
src/
├── calculator.rs             # Public API: valuate(request) → response
├── bond/
│   ├── cashflows.rs          # Coupon schedule generation (backward from maturity)
│   ├── accrued_interest.rs   # AI = (C/n) × days_accrued / days_in_period
│   ├── pricing.rs            # P = Σ CF_i / (1 + y/n)^f_i
│   ├── ytm_solver.rs         # Newton-Raphson, 1e-12 price tolerance
│   ├── current_yield.rs      # CY = annual_coupon / clean_price
│   ├── duration.rs           # Macaulay + Modified duration
│   ├── convexity.rs          # d²P/dy² / P
│   ├── dv01.rs               # Analytical + numerical DV01
│   └── market_value.rs       # MV, P&L
├── daycount/
│   ├── actual_actual_icma.rs # US Treasury, Euro Govt, UK Gilt day count
│   ├── actual_365.rs         # JGB day count convention
│   └── thirty_360.rs         # 30/360 US + 30E/360 European
├── date.rs                   # Internal date type (Julian Day Number arithmetic)
├── error.rs                  # BondError enum
└── proto_bridge.rs           # [feature = "proto"] ValuationRequestProto ↔ calculator
```

## Day Count Conventions

| Convention | Market | Status |
|------------|--------|--------|
| Actual/Actual (ICMA) | US Treasuries, Euro Govt, UK Gilts | ✓ Implemented |
| Actual/365 Fixed | JGBs | ✓ Implemented |
| 30/360 (US Bond Basis) | US Corporate, Muni, Agency bonds | ✓ Implemented |
| 30E/360 (Eurobond Basis) | Eurobonds | ✓ Implemented |
| Actual/Actual (ISDA) | Euro Govt (accrual) | Planned |

## Numeric Approach

- **Solver internals** (YTM, discount factors, duration, convexity): `f64` — fractional exponents require IEEE 754.
- **Cashflow amounts, prices, accrued interest**: `f64` for Phase 1. The `proto_bridge` will convert to/from `DecimalValueProto` (arbitrary precision string) at the boundary.
- **YTM solver**: Newton-Raphson with linear-approximation initial guess. Convergence: |price_error| < 1e-12 or |Δy| < 1e-14, max 100 iterations.

## Invariants

These hold for every valuation and are verified in the test suite:

1. **Three-way PV**: `dirty_price == present_value == Σ(cashflow PVs)`
2. **Clean/dirty**: `dirty_price == clean_price + accrued_interest`
3. **Duration ordering**: `modified_duration < macaulay_duration` (positive yields)
4. **Zero-coupon duration**: `macaulay_duration == time_to_maturity`
5. **Par bond YTM**: on a coupon date, `YTM(par) == coupon_rate` (to 1e-10)
6. **YTM round-trip**: `solve_ytm(price_from_yield(y)) == y` (to 1e-10)
7. **Duration+convexity approximation**: price change estimate < 0.1% error for 100bp shift

## Proto Integration

Enable the `proto` feature to use `ValuationRequestProto` / `ValuationResponseProto`:

```toml
[dependencies]
valuation-calculator = { path = "../valuation-calculator-rust", features = ["proto"] }
```

```rust
use valuation_calculator::proto_bridge::valuate_proto;

let response: ValuationResponseProto = valuate_proto(&request);
```

**Input mapping:**

| Proto Field | Extracts |
|-------------|----------|
| `security_input` (oneof `bond_details` or flat fields) | coupon_rate, freq, face_value, dates |
| `price_input.price` | Market clean price (% of par) |
| `position_input.measures[DIRECTED_QUANTITY]` | Quantity |
| `position_input.measures[UNADJUSTED_COST_BASIS]` | Cost basis |
| `asof_datetime` | Settlement date |
| `measures` | Which analytics to compute |

## Tests

```bash
cargo test                    # 87 tests, all modules
cargo test --features proto   # includes proto bridge (requires build scripts)
```

## Roadmap

| Phase | Scope | Status |
|-------|-------|--------|
| 1. US Treasuries | Semiannual, Act/Act ICMA, T+1 | ✓ Complete |
| 2. Euro Govt | Annual coupon (n=1), Act/Act ICMA | ✓ Complete |
| 3. UK Gilts | Ex-dividend period (7 calendar days) | ✓ Complete |
| 4. JGBs | Act/365 Fixed day count | ✓ Complete |
| 5. IG Corporate | 30/360, Z-spread over Treasury curve | Planned |
