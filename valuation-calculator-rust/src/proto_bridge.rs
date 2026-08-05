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
    ValuationRequestProto, ValuationResponseProto,
};

use crate::bond::CouponType;
use crate::calculator::{
    CashflowResult, Measure, SecurityInput, ValuationRequest, ValuationResponse,
};
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

    Ok(ValuationRequest {
        security: security_input,
        market_price,
        quantity,
        cost_basis,
        settlement,
        measures,
        benchmark_curve: None,
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
    }
}
