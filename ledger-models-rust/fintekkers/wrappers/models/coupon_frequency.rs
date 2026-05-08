//! Wrapper enum around `CouponFrequencyProto`.
//!
//! valuation-service defines an internal `CouponFrequency` plus a
//! `coupon_frequency_from_proto(...) -> Option<CouponFrequency>` mapping
//! function. Canonicalizing it here so every Rust consumer doesn't
//! reinvent it. Mirror of the SecurityType wrapper alongside this file.
//!
//! Rust shape: hand-written enum + total-but-fallible `from_proto`
//! returning `Option<Self>` (the proto's `UnknownCouponFrequency`
//! sentinel becomes `None` so callers can distinguish "missing /
//! malformed" from a real frequency).

use crate::fintekkers::models::security::CouponFrequencyProto;

#[derive(Clone, Copy, Debug, PartialEq, Eq, Hash, PartialOrd, Ord)]
pub enum CouponFrequency {
    Annually,
    Semiannually,
    Quarterly,
    Monthly,
    NoCoupon,
}

impl CouponFrequency {
    /// Returns `None` for the proto's `UnknownCouponFrequency` sentinel —
    /// matches what valuation-service does today (its mapping is also
    /// `Option<CouponFrequency>`). Callers reason about "I don't know
    /// what frequency this is" as a distinct state from any concrete
    /// frequency.
    pub fn from_proto(p: CouponFrequencyProto) -> Option<CouponFrequency> {
        match p {
            CouponFrequencyProto::UnknownCouponFrequency => None,
            CouponFrequencyProto::Annually => Some(CouponFrequency::Annually),
            CouponFrequencyProto::Semiannually => Some(CouponFrequency::Semiannually),
            CouponFrequencyProto::Quarterly => Some(CouponFrequency::Quarterly),
            CouponFrequencyProto::Monthly => Some(CouponFrequency::Monthly),
            CouponFrequencyProto::NoCoupon => Some(CouponFrequency::NoCoupon),
        }
    }

    /// Round-trips cleanly for every wrapper variant — the wrapper omits
    /// the `Unknown` sentinel by construction (None on input, no variant
    /// on output).
    pub fn to_proto(self) -> CouponFrequencyProto {
        match self {
            CouponFrequency::Annually => CouponFrequencyProto::Annually,
            CouponFrequency::Semiannually => CouponFrequencyProto::Semiannually,
            CouponFrequency::Quarterly => CouponFrequencyProto::Quarterly,
            CouponFrequency::Monthly => CouponFrequencyProto::Monthly,
            CouponFrequency::NoCoupon => CouponFrequencyProto::NoCoupon,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    /// Every wrapper variant round-trips: wrapper → proto → wrapper.
    #[test]
    fn wrapper_round_trip_total() {
        for variant in [
            CouponFrequency::Annually,
            CouponFrequency::Semiannually,
            CouponFrequency::Quarterly,
            CouponFrequency::Monthly,
            CouponFrequency::NoCoupon,
        ] {
            let back = CouponFrequency::from_proto(variant.to_proto());
            assert_eq!(
                back,
                Some(variant),
                "round-trip failed for {:?}",
                variant
            );
        }
    }

    /// Pin the per-proto-variant table. A future proto enum addition
    /// will require a deliberate arm in from_proto (the match is
    /// exhaustive on `CouponFrequencyProto`).
    #[test]
    fn from_proto_pins_table() {
        assert_eq!(
            CouponFrequency::from_proto(CouponFrequencyProto::UnknownCouponFrequency),
            None,
            "Unknown sentinel maps to None — distinct from any concrete frequency"
        );
        assert_eq!(
            CouponFrequency::from_proto(CouponFrequencyProto::Annually),
            Some(CouponFrequency::Annually)
        );
        assert_eq!(
            CouponFrequency::from_proto(CouponFrequencyProto::Semiannually),
            Some(CouponFrequency::Semiannually)
        );
        assert_eq!(
            CouponFrequency::from_proto(CouponFrequencyProto::Quarterly),
            Some(CouponFrequency::Quarterly)
        );
        assert_eq!(
            CouponFrequency::from_proto(CouponFrequencyProto::Monthly),
            Some(CouponFrequency::Monthly)
        );
        assert_eq!(
            CouponFrequency::from_proto(CouponFrequencyProto::NoCoupon),
            Some(CouponFrequency::NoCoupon)
        );
    }

    #[test]
    fn unknown_proto_returns_none() {
        assert!(
            CouponFrequency::from_proto(CouponFrequencyProto::UnknownCouponFrequency).is_none()
        );
    }
}
