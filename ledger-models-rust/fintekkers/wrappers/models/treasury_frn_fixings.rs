//! Picks a Treasury FRN's 13-week bill fixing from Treasury bill auctions.
//!
//! The same helpers as Java's `common.models.security.bonds.TreasuryFrnFixings`,
//! Python's `treasury_frn_fixings` and JS's `TreasuryFrnFixings`; all are
//! tested against `test-fixtures/treasury-frn-fixings.json`.
//! See `docs/adr/frn_reference_rate_fixings.md` (LM-382, LM-385, LM-386).
//!
//! Deprecated (LM-410): FRN fixings now come from price-service (MDI-100) and
//! reach `for_security` ready to use through `MarketData`; nothing here picks
//! them any more. To be deleted in LM-411, once ledger-service no longer calls
//! the Java copy (LS-202). See docs/adr/product_input_builders.md.

use chrono::{Datelike, NaiveDate};

use crate::fintekkers::models::security::index::IndexTypeProto;
use crate::fintekkers::models::util::LocalDateProto;
use crate::fintekkers::requests::valuation::ReferenceRateFixingProto;
use crate::fintekkers::wrappers::models::bond_security::BondSecurity;
use crate::fintekkers::wrappers::models::issuance::Issuance;
use crate::fintekkers::wrappers::models::tenor::Tenor;

/// Treasury's standard bill terms, in weeks.
const STANDARD_BILL_WEEKS: [u32; 7] = [4, 6, 8, 13, 17, 26, 52];

/// A tenor snaps to a standard term when its day count is within this many days of it.
const TOLERANCE_DAYS: i64 = 3;

const THIRTEEN_WEEKS: u32 = 13;

/// The standard bill term, in weeks, that `tenor` is within 3 days of: 4, 6,
/// 8, 13, 17, 26 or 52. Days are counted from `anchor` to `anchor + tenor`.
/// None when no term is that close.
pub fn standard_bill_term(tenor: &Tenor, anchor: NaiveDate) -> Option<u32> {
    let days = (tenor.add_to(anchor)? - anchor).num_days();
    STANDARD_BILL_WEEKS
        .iter()
        .copied()
        .find(|weeks| (days - 7 * i64::from(*weeks)).abs() <= TOLERANCE_DAYS)
}

/// The 13-week bill fixing on `date`: of every issuance of every bill that
/// has an auction date, an issue date and a high discount rate, was
/// auctioned on or before `date` and snaps to 13 weeks, the one with the
/// latest auction date. On a tie the first in input order wins.
///
/// The fixing's `rate` is the issuance's `high_discount_rate` proto
/// unchanged, `fixing_date` its `auction_date`, `bill_maturity_date` the
/// bill's maturity and `bill_issue_date` its `auction_issue_date`, copied as
/// is (LM-389). None when nothing qualifies.
pub fn select(bills: &[BondSecurity], date: NaiveDate) -> Option<ReferenceRateFixingProto> {
    let mut best: Option<(NaiveDate, Issuance, NaiveDate)> = None;
    for bill in bills {
        let Some(maturity) = bill.maturity_date() else { continue };
        for issuance in bill.issuances() {
            let (Some(auction_date), Some(issue_date), Some(_)) =
                (issuance.auction_date(), issuance.issue_date(), issuance.high_discount_rate())
            else {
                continue;
            };
            if auction_date > date {
                continue;
            }
            let weeks = bill.issuance_tenor(&issuance).and_then(|t| standard_bill_term(&t, issue_date));
            if weeks != Some(THIRTEEN_WEEKS) {
                continue;
            }
            if !matches!(&best, Some((best_date, ..)) if auction_date <= *best_date) {
                best = Some((auction_date, issuance, maturity));
            }
        }
    }
    let (_, issuance, maturity) = best?;
    let proto = issuance.proto;
    Some(ReferenceRateFixingProto {
        index: IndexTypeProto::TBill13Week as i32,
        fixing_date: proto.auction_date,
        rate: proto.high_discount_rate,
        bill_maturity_date: Some(date_proto(maturity)),
        bill_issue_date: proto.auction_issue_date,
    })
}

fn date_proto(d: NaiveDate) -> LocalDateProto {
    LocalDateProto {
        year: d.year() as u32,
        month: d.month(),
        day: d.day(),
    }
}
