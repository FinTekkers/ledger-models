use ledger_models::fintekkers::models::position::{MeasureMapEntry, MeasureProto};
use ledger_models::fintekkers::models::price::PriceProto;
use ledger_models::fintekkers::models::security::security_proto::ProductDetails;
use ledger_models::fintekkers::models::security::{
    CouponFrequencyProto, CouponTypeProto, SecurityProto, SecurityTypeProto,
};
use ledger_models::fintekkers::models::util::{DecimalValueProto, LocalDateProto};
use ledger_models::fintekkers::models::valuation::CashflowProto;
use ledger_models::fintekkers::requests::util::errors::SummaryProto;
use ledger_models::fintekkers::requests::valuation::{
    CurveInputType, PricingModeProto, ValuationRequestProto, ValuationResponseProto,
    YieldCurveInputProto,
};

use crate::bond::CouponType;
use crate::calculator::{
    CashflowResult, Measure, PricingMode, SecurityInput, ValuationRequest, ValuationResponse,
};
use crate::callable::{CallDate, PutDate};
use crate::curve::YieldCurve;
use crate::date::Date;

// ── ValuationRequestProto → ValuationRequest ─────────────────────────

pub fn request_from_proto(proto: &ValuationRequestProto) -> Result<ValuationRequest, String> {
    let security = proto
        .security_input
        .as_ref()
        .ok_or("missing security_input")?;

    let price_proto = proto
        .price_input
        .as_ref()
        .ok_or("missing price_input")?;

    let market_price = parse_decimal_value(
        price_proto.price.as_ref().ok_or("missing price value")?,
    )?;

    let security_input = security_input_from_proto(security)?;

    let settlement = timestamp_to_date(
        proto.asof_datetime.as_ref().ok_or("missing asof_datetime")?,
    )?;

    let (quantity, cost_basis) = extract_position_data(proto);

    let measures = proto
        .measures
        .iter()
        .filter_map(|&m| measure_from_proto(m))
        .collect();

    let benchmark_curve = extract_benchmark_curve(proto)?;

    let pricing_mode = extract_pricing_mode(proto, &benchmark_curve)?;

    Ok(ValuationRequest {
        security: security_input,
        market_price,
        quantity,
        cost_basis,
        settlement,
        measures,
        benchmark_curve,
        pricing_mode,
    })
}

fn security_input_from_proto(security: &SecurityProto) -> Result<SecurityInput, String> {
    let (coupon_rate, coupon_type_i32, coupon_freq_i32, face_value, dated_date, maturity_date) =
        if let Some(ref details) = security.product_details {
            match details {
                ProductDetails::BondDetails(bond) => (
                    bond.coupon_rate.as_ref(),
                    bond.coupon_type,
                    bond.coupon_frequency,
                    bond.face_value.as_ref(),
                    bond.dated_date.as_ref(),
                    bond.maturity_date.as_ref(),
                ),
                ProductDetails::TipsDetails(tips) => (
                    tips.coupon_rate.as_ref(),
                    tips.coupon_type,
                    tips.coupon_frequency,
                    tips.face_value.as_ref(),
                    tips.dated_date.as_ref(),
                    tips.maturity_date.as_ref(),
                ),
                _ => return Err(format!("unsupported product_details variant")),
            }
        } else {
            (
                security.coupon_rate.as_ref(),
                security.coupon_type,
                security.coupon_frequency,
                security.face_value.as_ref(),
                security.dated_date.as_ref(),
                security.maturity_date.as_ref(),
            )
        };

    let coupon_rate_val = coupon_rate
        .map(|d| parse_decimal_value(d))
        .transpose()?
        .unwrap_or(0.0);

    let face_value_val = face_value
        .map(|d| parse_decimal_value(d))
        .transpose()?
        .unwrap_or(100.0);

    let maturity = date_from_proto(maturity_date.ok_or("missing maturity_date")?);
    let dated = date_from_proto(dated_date.unwrap_or(maturity_date.unwrap()));

    let coupon_type = match CouponTypeProto::try_from(coupon_type_i32) {
        Ok(CouponTypeProto::Zero) => CouponType::Zero,
        _ => {
            if coupon_rate_val == 0.0 {
                CouponType::Zero
            } else {
                CouponType::Fixed
            }
        }
    };

    let coupon_freq = match CouponFrequencyProto::try_from(coupon_freq_i32) {
        Ok(CouponFrequencyProto::Annually) => 1,
        Ok(CouponFrequencyProto::Semiannually) => 2,
        Ok(CouponFrequencyProto::Quarterly) => 4,
        Ok(CouponFrequencyProto::Monthly) => 12,
        Ok(CouponFrequencyProto::NoCoupon) => 2,
        _ => 2,
    };

    Ok(SecurityInput {
        coupon_rate: coupon_rate_val,
        coupon_freq,
        coupon_type,
        face_value: face_value_val,
        dated_date: dated,
        maturity_date: maturity,
        day_count: None,
    })
}

fn extract_position_data(proto: &ValuationRequestProto) -> (f64, Option<f64>) {
    let mut quantity = 0.0;
    let mut cost_basis = None;

    if let Some(ref pos) = proto.position_input {
        for entry in &pos.measures {
            if let Ok(measure) = MeasureProto::try_from(entry.measure) {
                let val = entry
                    .measure_decimal_value
                    .as_ref()
                    .and_then(|d| d.arbitrary_precision_value.parse::<f64>().ok())
                    .unwrap_or(0.0);
                match measure {
                    MeasureProto::DirectedQuantity => quantity = val,
                    MeasureProto::UnadjustedCostBasis => cost_basis = Some(val),
                    _ => {}
                }
            }
        }
    }

    (quantity, cost_basis)
}

// ── Benchmark curve extraction ────────────────────────────────────

/// Extract a `YieldCurve` from the `benchmark_curve` field of a
/// `ValuationRequestProto`, if present. Supports ZERO_RATES (direct)
/// and PAR_RATES (bootstrapped). Returns `Ok(None)` when the field is
/// absent, or `Err` on malformed data.
fn extract_benchmark_curve(proto: &ValuationRequestProto) -> Result<Option<YieldCurve>, String> {
    let curve_proto = match proto.benchmark_curve.as_ref() {
        Some(c) => c,
        None => return Ok(None),
    };

    yield_curve_from_proto(curve_proto).map(Some)
}

fn yield_curve_from_proto(proto: &YieldCurveInputProto) -> Result<YieldCurve, String> {
    if proto.points.is_empty() {
        return Err("benchmark_curve has no points".to_string());
    }

    let ref_date = proto
        .reference_date
        .as_ref()
        .map(date_from_proto)
        .ok_or("benchmark_curve missing reference_date")?;

    let mut tenors = Vec::with_capacity(proto.points.len());
    let mut rates = Vec::with_capacity(proto.points.len());

    for pt in &proto.points {
        let tenor = pt
            .tenor
            .as_ref()
            .ok_or("curve point missing tenor")?;
        let rate = pt
            .rate
            .as_ref()
            .ok_or("curve point missing rate")?;
        tenors.push(parse_decimal_value(tenor)?);
        rates.push(parse_decimal_value(rate)?);
    }

    let curve_type = CurveInputType::try_from(proto.curve_type).unwrap_or(CurveInputType::ZeroRates);

    match curve_type {
        CurveInputType::ZeroRates => YieldCurve::new(ref_date, tenors, rates)
            .map_err(|e| format!("benchmark_curve: {}", e)),
        CurveInputType::ParRates => {
            // Bootstrap with semiannual frequency (standard for US Treasuries)
            YieldCurve::from_par_rates(ref_date, tenors, rates, 2)
                .map_err(|e| format!("benchmark_curve bootstrap: {}", e))
        }
        CurveInputType::DiscountFactors => {
            // Convert discount factors to zero rates: r = -ln(DF) / t
            let zero_rates: Vec<f64> = tenors
                .iter()
                .zip(rates.iter())
                .map(|(t, df)| {
                    if *t <= 0.0 || *df <= 0.0 {
                        0.0
                    } else {
                        -df.ln() / t
                    }
                })
                .collect();
            YieldCurve::new(ref_date, tenors, zero_rates)
                .map_err(|e| format!("benchmark_curve (from DFs): {}", e))
        }
    }
}

// ── Call schedule extraction ──────────────────────────────────────

/// Extract call and put schedules from the `call_schedule` field of a
/// `ValuationRequestProto`. Returns `(call_dates, put_dates, volatility, tree_steps)`.
/// Returns `None` when the field is absent.
pub fn extract_call_schedule(
    proto: &ValuationRequestProto,
) -> Option<(Vec<CallDate>, Vec<PutDate>, f64, usize)> {
    let sched = proto.call_schedule.as_ref()?;

    let calls: Vec<CallDate> = sched
        .call_dates
        .iter()
        .filter_map(|cd| {
            let date = cd.date.as_ref().map(date_from_proto)?;
            let price = cd
                .call_price
                .as_ref()
                .and_then(|d| parse_decimal_value(d).ok())
                .unwrap_or(100.0);
            Some(CallDate {
                date,
                call_price: price,
            })
        })
        .collect();

    let puts: Vec<PutDate> = sched
        .put_dates
        .iter()
        .filter_map(|pd| {
            let date = pd.date.as_ref().map(date_from_proto)?;
            let price = pd
                .put_price
                .as_ref()
                .and_then(|d| parse_decimal_value(d).ok())
                .unwrap_or(100.0);
            Some(PutDate {
                date,
                put_price: price,
            })
        })
        .collect();

    let vol = sched
        .volatility
        .as_ref()
        .and_then(|d| parse_decimal_value(d).ok())
        .unwrap_or(0.0);

    let steps = if sched.tree_steps == 0 {
        100
    } else {
        sched.tree_steps as usize
    };

    Some((calls, puts, vol, steps))
}

// ── Pricing mode extraction ──────────────────────────────────────

fn extract_pricing_mode(
    proto: &ValuationRequestProto,
    benchmark_curve: &Option<YieldCurve>,
) -> Result<Option<PricingMode>, String> {
    let mode = PricingModeProto::try_from(proto.pricing_mode)
        .unwrap_or(PricingModeProto::PriceModeUnspecified);

    match mode {
        PricingModeProto::PriceModeUnspecified | PricingModeProto::OutrightPrice => Ok(None),
        PricingModeProto::SpreadToBenchmark => {
            let curve = benchmark_curve
                .as_ref()
                .ok_or("SPREAD_TO_BENCHMARK requires benchmark_curve")?;
            let price_proto = proto
                .price_input
                .as_ref()
                .ok_or("SPREAD_TO_BENCHMARK requires price_input as spread")?;
            let spread = parse_decimal_value(
                price_proto.price.as_ref().ok_or("missing price value for spread")?,
            )?;
            Ok(Some(PricingMode::SpreadToBenchmark {
                spread,
                curve: curve.clone(),
            }))
        }
        _ => Ok(None),
    }
}

// ── ValuationResponse → ValuationResponseProto ──────────────────────

pub fn response_to_proto(
    response: &ValuationResponse,
    request: &ValuationRequestProto,
) -> ValuationResponseProto {
    let measure_results: Vec<MeasureMapEntry> = response
        .results
        .iter()
        .map(|(measure, value)| MeasureMapEntry {
            measure: measure_to_proto(*measure) as i32,
            measure_decimal_value: Some(DecimalValueProto {
                arbitrary_precision_value: format!("{}", value),
            }),
        })
        .collect();

    let cashflows: Vec<CashflowProto> = response
        .cashflows
        .iter()
        .map(|cf| cashflow_to_proto(cf))
        .collect();

    let summary = if response.errors.is_empty() {
        None
    } else {
        Some(SummaryProto {
            overall_status: 1, // ERROR
            errors: response
                .errors
                .iter()
                .map(|e| ledger_models::fintekkers::requests::util::errors::ErrorProto {
                    error_message: e.clone(),
                    ..Default::default()
                })
                .collect(),
        })
    };

    ValuationResponseProto {
        object_class: "ValuationResponse".to_string(),
        version: "0.0.1".to_string(),
        valuation_request: Some(request.clone()),
        measure_results,
        summary,
        cashflows,
    }
}

fn cashflow_to_proto(cf: &CashflowResult) -> CashflowProto {
    CashflowProto {
        cashflow_date: Some(LocalDateProto {
            year: cf.date.year as u32,
            month: cf.date.month,
            day: cf.date.day,
        }),
        pv_amount: Some(DecimalValueProto {
            arbitrary_precision_value: format!("{}", cf.pv_amount),
        }),
        fv_amount: Some(DecimalValueProto {
            arbitrary_precision_value: format!("{}", cf.fv_amount),
        }),
        coupon_rate: Some(DecimalValueProto {
            arbitrary_precision_value: format!("{}", cf.coupon_rate),
        }),
        currency: None,
    }
}

// ── Public entry point ──────────────────────────────────────────────

pub fn valuate_proto(request: &ValuationRequestProto) -> ValuationResponseProto {
    match request_from_proto(request) {
        Ok(req) => {
            let response = crate::calculator::valuate(&req);
            response_to_proto(&response, request)
        }
        Err(err) => ValuationResponseProto {
            object_class: "ValuationResponse".to_string(),
            version: "0.0.1".to_string(),
            valuation_request: Some(request.clone()),
            measure_results: vec![],
            summary: Some(SummaryProto {
                overall_status: 1,
                errors: vec![
                    ledger_models::fintekkers::requests::util::errors::ErrorProto {
                        error_message: err,
                        ..Default::default()
                    },
                ],
            }),
            cashflows: vec![],
        },
    }
}

// ── Helpers ─────────────────────────────────────────────────────────

fn parse_decimal_value(proto: &DecimalValueProto) -> Result<f64, String> {
    proto
        .arbitrary_precision_value
        .parse::<f64>()
        .map_err(|e| format!("invalid decimal '{}': {}", proto.arbitrary_precision_value, e))
}

fn date_from_proto(proto: &LocalDateProto) -> Date {
    Date::new(proto.year as i32, proto.month, proto.day)
}

fn timestamp_to_date(
    proto: &ledger_models::fintekkers::models::util::LocalTimestampProto,
) -> Result<Date, String> {
    let ts = proto
        .timestamp
        .as_ref()
        .ok_or("missing timestamp in asof_datetime")?;
    let secs = ts.seconds;
    // Convert unix seconds to date (simple: days since epoch)
    let days_since_epoch = (secs / 86400) as i32;
    let epoch = Date::new(1970, 1, 1);
    Ok(add_days(&epoch, days_since_epoch))
}

fn add_days(date: &Date, days: i32) -> Date {
    // Julian Day Number arithmetic for correctness
    let jdn = to_jdn(date) + days;
    from_jdn(jdn)
}

fn to_jdn(d: &Date) -> i32 {
    let a = (14 - d.month as i32) / 12;
    let y = d.year + 4800 - a;
    let m = d.month as i32 + 12 * a - 3;
    d.day as i32 + (153 * m + 2) / 5 + 365 * y + y / 4 - y / 100 + y / 400 - 32045
}

fn from_jdn(jdn: i32) -> Date {
    let a = jdn + 32044;
    let b = (4 * a + 3) / 146097;
    let c = a - (146097 * b) / 4;
    let d = (4 * c + 3) / 1461;
    let e = c - (1461 * d) / 4;
    let m = (5 * e + 2) / 153;
    let day = (e - (153 * m + 2) / 5 + 1) as u32;
    let month = (m + 3 - 12 * (m / 10)) as u32;
    let year = 100 * b + d - 4800 + m / 10;
    Date::new(year, month, day)
}

fn measure_from_proto(proto_val: i32) -> Option<Measure> {
    match MeasureProto::try_from(proto_val) {
        Ok(MeasureProto::DirectedQuantity) => Some(Measure::DirectedQuantity),
        Ok(MeasureProto::MarketValue) => Some(Measure::MarketValue),
        Ok(MeasureProto::UnadjustedCostBasis) => Some(Measure::UnadjustedCostBasis),
        Ok(MeasureProto::CurrentYield) => Some(Measure::CurrentYield),
        Ok(MeasureProto::YieldToMaturity) => Some(Measure::YieldToMaturity),
        Ok(MeasureProto::MacaulayDuration) => Some(Measure::MacaulayDuration),
        Ok(MeasureProto::PresentValue) => Some(Measure::PresentValue),
        Ok(MeasureProto::PresentValueCashflows) => Some(Measure::PresentValueCashflows),
        Ok(MeasureProto::AccruedInterest) => Some(Measure::AccruedInterest),
        Ok(MeasureProto::Convexity) => Some(Measure::Convexity),
        Ok(MeasureProto::DirtyPrice) => Some(Measure::DirtyPrice),
        Ok(MeasureProto::CleanPrice) => Some(Measure::CleanPrice),
        Ok(MeasureProto::ModifiedDuration) => Some(Measure::ModifiedDuration),
        Ok(MeasureProto::Dv01) => Some(Measure::Dv01),
        Ok(MeasureProto::ProfitLoss) => Some(Measure::ProfitLoss),
        Ok(MeasureProto::ProfitLossPercent) => Some(Measure::ProfitLossPercent),
        _ => None,
    }
}

fn measure_to_proto(measure: Measure) -> MeasureProto {
    match measure {
        Measure::DirectedQuantity => MeasureProto::DirectedQuantity,
        Measure::MarketValue => MeasureProto::MarketValue,
        Measure::UnadjustedCostBasis => MeasureProto::UnadjustedCostBasis,
        Measure::CurrentYield => MeasureProto::CurrentYield,
        Measure::YieldToMaturity => MeasureProto::YieldToMaturity,
        Measure::MacaulayDuration => MeasureProto::MacaulayDuration,
        Measure::ModifiedDuration => MeasureProto::ModifiedDuration,
        Measure::PresentValue => MeasureProto::PresentValue,
        Measure::PresentValueCashflows => MeasureProto::PresentValueCashflows,
        Measure::AccruedInterest => MeasureProto::AccruedInterest,
        Measure::Convexity => MeasureProto::Convexity,
        Measure::DirtyPrice => MeasureProto::DirtyPrice,
        Measure::CleanPrice => MeasureProto::CleanPrice,
        Measure::Dv01 => MeasureProto::Dv01,
        Measure::ProfitLoss => MeasureProto::ProfitLoss,
        Measure::ProfitLossPercent => MeasureProto::ProfitLossPercent,
        // These measures don't have proto equivalents yet; map to MarketValue as placeholder
        Measure::ZSpread | Measure::SpreadDuration | Measure::SpreadDv01 => MeasureProto::MarketValue,
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use ledger_models::fintekkers::requests::valuation::{
        CallDateProto as ProtoCallDate, CallScheduleInputProto, CurvePointInputProto,
        PutDateProto as ProtoPutDate, YieldCurveInputProto,
    };

    fn dec(val: &str) -> Option<DecimalValueProto> {
        Some(DecimalValueProto {
            arbitrary_precision_value: val.to_string(),
        })
    }

    fn local_date(y: u32, m: u32, d: u32) -> Option<LocalDateProto> {
        Some(LocalDateProto {
            year: y,
            month: m,
            day: d,
        })
    }

    fn make_curve_proto() -> YieldCurveInputProto {
        YieldCurveInputProto {
            reference_date: local_date(2025, 4, 15),
            curve_type: CurveInputType::ZeroRates as i32,
            points: vec![
                CurvePointInputProto {
                    tenor: dec("0.5"),
                    rate: dec("0.035"),
                },
                CurvePointInputProto {
                    tenor: dec("1.0"),
                    rate: dec("0.038"),
                },
                CurvePointInputProto {
                    tenor: dec("2.0"),
                    rate: dec("0.040"),
                },
                CurvePointInputProto {
                    tenor: dec("5.0"),
                    rate: dec("0.042"),
                },
                CurvePointInputProto {
                    tenor: dec("10.0"),
                    rate: dec("0.043"),
                },
                CurvePointInputProto {
                    tenor: dec("30.0"),
                    rate: dec("0.044"),
                },
            ],
        }
    }

    fn make_call_schedule_proto() -> CallScheduleInputProto {
        CallScheduleInputProto {
            call_dates: vec![
                ProtoCallDate {
                    date: local_date(2028, 6, 1),
                    call_price: dec("103.0"),
                },
                ProtoCallDate {
                    date: local_date(2029, 6, 1),
                    call_price: dec("102.0"),
                },
                ProtoCallDate {
                    date: local_date(2030, 6, 1),
                    call_price: dec("100.0"),
                },
            ],
            put_dates: vec![ProtoPutDate {
                date: local_date(2029, 6, 1),
                put_price: dec("99.0"),
            }],
            volatility: dec("0.20"),
            tree_steps: 200,
        }
    }

    fn make_valuation_request_proto(
        with_curve: bool,
        with_call_schedule: bool,
    ) -> ValuationRequestProto {
        use ledger_models::fintekkers::models::security::BondDetailsProto;

        let bond_details = BondDetailsProto {
            coupon_rate: dec("0.05"),
            coupon_type: CouponTypeProto::Fixed as i32,
            coupon_frequency: CouponFrequencyProto::Semiannually as i32,
            face_value: dec("100"),
            dated_date: local_date(2025, 6, 1),
            maturity_date: local_date(2035, 6, 1),
            ..Default::default()
        };

        let security = SecurityProto {
            object_class: "Security".to_string(),
            version: "0.0.1".to_string(),
            security_type: SecurityTypeProto::BondSecurity as i32,
            product_details: Some(ProductDetails::BondDetails(bond_details)),
            ..Default::default()
        };

        let price = PriceProto {
            price: dec("100.0"),
            ..Default::default()
        };

        let asof = ledger_models::fintekkers::models::util::LocalTimestampProto {
            time_zone: "UTC".to_string(),
            timestamp: Some(prost_types::Timestamp {
                // 2025-06-01 = day 20240 from epoch => 20240 * 86400
                seconds: 20240 * 86400,
                nanos: 0,
            }),
        };

        ValuationRequestProto {
            object_class: "ValuationRequest".to_string(),
            version: "0.0.1".to_string(),
            security_input: Some(security),
            price_input: Some(price),
            asof_datetime: Some(asof),
            measures: vec![
                MeasureProto::CleanPrice as i32,
                MeasureProto::YieldToMaturity as i32,
            ],
            benchmark_curve: if with_curve {
                Some(make_curve_proto())
            } else {
                None
            },
            call_schedule: if with_call_schedule {
                Some(make_call_schedule_proto())
            } else {
                None
            },
            ..Default::default()
        }
    }

    #[test]
    fn extract_benchmark_curve_populates_yield_curve() {
        let proto = make_valuation_request_proto(true, false);
        let req = request_from_proto(&proto).expect("should parse");

        let curve = req
            .benchmark_curve
            .as_ref()
            .expect("benchmark_curve should be populated");

        // Verify the curve has the expected number of tenors
        assert_eq!(curve.tenors().len(), 6, "expected 6 tenor points");

        // Verify the 10Y zero rate matches input
        let r_10y = curve.zero_rate(10.0);
        assert!(
            (r_10y - 0.043).abs() < 1e-10,
            "10Y zero rate should be 0.043, got {}",
            r_10y
        );

        // Discount factor at t=0 should be 1.0
        let df0 = curve.discount_factor(0.0);
        assert!((df0 - 1.0).abs() < 1e-12, "DF(0) should be 1.0, got {}", df0);
    }

    #[test]
    fn extract_call_schedule_populates_dates() {
        let proto = make_valuation_request_proto(false, true);

        let (calls, puts, vol, steps) =
            extract_call_schedule(&proto).expect("call_schedule should be present");

        assert_eq!(calls.len(), 3, "expected 3 call dates");
        assert_eq!(puts.len(), 1, "expected 1 put date");
        assert!((vol - 0.20).abs() < 1e-10, "volatility should be 0.20, got {}", vol);
        assert_eq!(steps, 200, "tree_steps should be 200");

        // Verify first call date
        assert_eq!(calls[0].date, Date::new(2028, 6, 1));
        assert!((calls[0].call_price - 103.0).abs() < 1e-10);

        // Verify put date
        assert_eq!(puts[0].date, Date::new(2029, 6, 1));
        assert!((puts[0].put_price - 99.0).abs() < 1e-10);
    }

    #[test]
    fn request_without_curve_has_none_benchmark() {
        let proto = make_valuation_request_proto(false, false);
        let req = request_from_proto(&proto).expect("should parse");

        assert!(
            req.benchmark_curve.is_none(),
            "benchmark_curve should be None when not set in proto"
        );
    }

    #[test]
    fn request_without_call_schedule_returns_none() {
        let proto = make_valuation_request_proto(false, false);
        assert!(
            extract_call_schedule(&proto).is_none(),
            "call_schedule should be None when not set in proto"
        );
    }

    #[test]
    fn full_round_trip_with_benchmark_curve() {
        let proto = make_valuation_request_proto(true, true);
        let req = request_from_proto(&proto).expect("should parse");

        // Verify the request has all the expected fields
        assert!(req.benchmark_curve.is_some());
        assert!(req.pricing_mode.is_none()); // no pricing_mode set
        assert_eq!(req.measures.len(), 2);

        // Run the full valuation through valuate_proto
        let response = valuate_proto(&proto);
        assert_eq!(response.object_class, "ValuationResponse");

        // Should have results for the requested measures
        assert!(
            !response.measure_results.is_empty(),
            "should have measure results"
        );
    }
}
