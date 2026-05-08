//! Wrapper enum around `SecurityTypeProto`.
//!
//! valuation-service (and other Rust consumers) define a domain-side
//! `SecurityType` enum + `from_proto` / `to_proto` mappings to translate
//! the protobuf-generated `SecurityTypeProto` (PascalCase, includes the
//! `UnknownSecurityType` sentinel and gRPC-namespacey variants like
//! `EquityIndexSecurity`) into a cleaner internal vocabulary. The user
//! flagged that this mapping should be canonicalized in ledger-models so
//! every Rust consumer doesn't reinvent it.
//!
//! Mirrors the JS / Python / Java wrappers around proto enums shipped in
//! v0.1.133–v0.1.136, but uses the idiomatic Rust shape: a hand-written
//! enum + total `from_proto` / round-trip `to_proto`. Don't try to mirror
//! the JS string-based `fromName` / `getAllTypeNames` API — Rust's strong
//! typing makes it irrelevant.

use crate::fintekkers::models::security::SecurityTypeProto;

/// Internal SecurityType vocabulary used by Rust consumers.
///
/// Variants are 1:1 with `SecurityTypeProto` except for two collapsed
/// pairs:
///   - `IndexSecurity` AND `EquityIndexSecurity` both map to `Index`
///     (treating "this is an index, not a holdable instrument" as the
///     user-facing distinction; the equity-vs-fixed-income flavor of
///     the index isn't carried in this enum).
///   - `FxSpot` maps to `Currency` (FX-spot quote is the on-the-wire
///     name for a currency-pair quote in the proto; consumers reason
///     about "this is a currency pair" not "this is a spot trade").
///
/// `Strips` and `TBill` are first-class variants (added in #246) so
/// pickers / classifiers can filter on type rather than the
/// coupon_rate==0 heuristic the codebase had been using when
/// everything Treasury-shaped lived under `BondSecurity`.
#[derive(Clone, Copy, Debug, PartialEq, Eq, Hash, PartialOrd, Ord)]
pub enum SecurityType {
    Bond,
    Tips,
    Frn,
    Strips,
    TBill,
    Equity,
    Cash,
    Index,
    Currency,
    Unknown,
}

impl SecurityType {
    /// Total — never panics. Unmapped proto variants become `Unknown`,
    /// which mirrors the proto's own `UnknownSecurityType` sentinel.
    pub fn from_proto(p: SecurityTypeProto) -> SecurityType {
        match p {
            SecurityTypeProto::UnknownSecurityType => SecurityType::Unknown,
            SecurityTypeProto::CashSecurity => SecurityType::Cash,
            SecurityTypeProto::EquitySecurity => SecurityType::Equity,
            SecurityTypeProto::BondSecurity => SecurityType::Bond,
            SecurityTypeProto::Tips => SecurityType::Tips,
            SecurityTypeProto::Frn => SecurityType::Frn,
            SecurityTypeProto::IndexSecurity => SecurityType::Index,
            SecurityTypeProto::FxSpot => SecurityType::Currency,
            SecurityTypeProto::EquityIndexSecurity => SecurityType::Index,
            SecurityTypeProto::StripsSecurity => SecurityType::Strips,
            SecurityTypeProto::TBill => SecurityType::TBill,
        }
    }

    /// Round-trips for every variant except `Index`, which is asymmetric
    /// (proto distinguishes `IndexSecurity` from `EquityIndexSecurity` but
    /// the wrapper collapses both). `to_proto(Index)` returns
    /// `IndexSecurity` — the older, more canonical of the two. Callers
    /// who specifically need to encode an equity-style index should use
    /// `SecurityTypeProto::EquityIndexSecurity` directly.
    pub fn to_proto(self) -> SecurityTypeProto {
        match self {
            SecurityType::Bond => SecurityTypeProto::BondSecurity,
            SecurityType::Tips => SecurityTypeProto::Tips,
            SecurityType::Frn => SecurityTypeProto::Frn,
            SecurityType::Strips => SecurityTypeProto::StripsSecurity,
            SecurityType::TBill => SecurityTypeProto::TBill,
            SecurityType::Equity => SecurityTypeProto::EquitySecurity,
            SecurityType::Cash => SecurityTypeProto::CashSecurity,
            SecurityType::Index => SecurityTypeProto::IndexSecurity,
            SecurityType::Currency => SecurityTypeProto::FxSpot,
            SecurityType::Unknown => SecurityTypeProto::UnknownSecurityType,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    /// Every wrapper variant round-trips through to_proto → from_proto.
    /// Note: this is the "round-trip from the wrapper side", which IS
    /// total. The proto-side round-trip (proto → wrapper → proto) is
    /// not total because of the Index/EquityIndex collapse — covered
    /// in the EquityIndex test below.
    #[test]
    fn wrapper_round_trip_total() {
        for variant in [
            SecurityType::Bond,
            SecurityType::Tips,
            SecurityType::Frn,
            SecurityType::Strips,
            SecurityType::TBill,
            SecurityType::Equity,
            SecurityType::Cash,
            SecurityType::Index,
            SecurityType::Currency,
            SecurityType::Unknown,
        ] {
            let back = SecurityType::from_proto(variant.to_proto());
            assert_eq!(back, variant, "round-trip failed for {:?}", variant);
        }
    }

    /// Every proto variant maps to SOME wrapper variant — no panic, no
    /// silent miss. Pinning this means a future proto enum addition
    /// has to update from_proto deliberately (compile error on the
    /// non-exhaustive match would require a new arm).
    #[test]
    fn from_proto_total() {
        // Pin the full mapping table per proto variant.
        assert_eq!(
            SecurityType::from_proto(SecurityTypeProto::UnknownSecurityType),
            SecurityType::Unknown
        );
        assert_eq!(
            SecurityType::from_proto(SecurityTypeProto::CashSecurity),
            SecurityType::Cash
        );
        assert_eq!(
            SecurityType::from_proto(SecurityTypeProto::EquitySecurity),
            SecurityType::Equity
        );
        assert_eq!(
            SecurityType::from_proto(SecurityTypeProto::BondSecurity),
            SecurityType::Bond
        );
        assert_eq!(
            SecurityType::from_proto(SecurityTypeProto::Tips),
            SecurityType::Tips
        );
        assert_eq!(
            SecurityType::from_proto(SecurityTypeProto::Frn),
            SecurityType::Frn
        );
        assert_eq!(
            SecurityType::from_proto(SecurityTypeProto::IndexSecurity),
            SecurityType::Index
        );
        assert_eq!(
            SecurityType::from_proto(SecurityTypeProto::FxSpot),
            SecurityType::Currency
        );
        assert_eq!(
            SecurityType::from_proto(SecurityTypeProto::EquityIndexSecurity),
            SecurityType::Index,
            "EquityIndexSecurity collapses to Index alongside IndexSecurity"
        );
        assert_eq!(
            SecurityType::from_proto(SecurityTypeProto::StripsSecurity),
            SecurityType::Strips
        );
        assert_eq!(
            SecurityType::from_proto(SecurityTypeProto::TBill),
            SecurityType::TBill
        );
    }

    /// Pin the asymmetric arm: `Index → IndexSecurity` (not the
    /// equity-flavored one). This is documented in to_proto's docstring;
    /// the test exists so a future flip is a deliberate choice.
    #[test]
    fn to_proto_index_picks_index_security_not_equity_index() {
        assert_eq!(
            SecurityType::Index.to_proto(),
            SecurityTypeProto::IndexSecurity
        );
        // EquityIndexSecurity, however, DOES round-trip into Index via
        // from_proto — it just doesn't survive the wrapper-side
        // round-trip back to proto.
        assert_eq!(
            SecurityType::from_proto(SecurityTypeProto::EquityIndexSecurity),
            SecurityType::Index
        );
        assert_eq!(
            SecurityType::Index.to_proto(),
            SecurityTypeProto::IndexSecurity
        );
    }
}
