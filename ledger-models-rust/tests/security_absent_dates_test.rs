//! LM-441: `SecurityWrapper::issue_date()` / `maturity_date()` (the Rust
//! equivalent of Java's `Security.getField(ISSUE_DATE | MATURITY_DATE)`)
//! report an unset date as `None`, never a placeholder such as 2999-12-31 or
//! 1900-01-01. Bonds keep their real dates.

use chrono::NaiveDate;
use ledger_models::fintekkers::models::position::{FieldMapEntry, FieldProto, PositionProto};
use ledger_models::fintekkers::models::security::{BondDetailsProto, ProductTypeProto, SecurityProto};
use ledger_models::fintekkers::models::util::LocalDateProto;
use ledger_models::fintekkers::wrappers::models::bond_security::BondSecurity;
use ledger_models::fintekkers::wrappers::models::position::Position;
use ledger_models::fintekkers::wrappers::models::security::SecurityWrapper;

fn issue() -> NaiveDate {
    NaiveDate::from_ymd_opt(2024, 5, 15).unwrap()
}

fn maturity() -> NaiveDate {
    NaiveDate::from_ymd_opt(2034, 5, 15).unwrap()
}

fn local_date(year: u32, month: u32, day: u32) -> LocalDateProto {
    LocalDateProto { year, month, day }
}

fn proto(product_type: ProductTypeProto, bond_details: Option<BondDetailsProto>) -> SecurityProto {
    SecurityProto {
        product_type: product_type as i32,
        bond_details,
        ..Default::default()
    }
}

fn dated_bond_details() -> BondDetailsProto {
    BondDetailsProto {
        issue_date: Some(local_date(2024, 5, 15)),
        maturity_date: Some(local_date(2034, 5, 15)),
        ..Default::default()
    }
}

fn assert_not_placeholder(value: Option<NaiveDate>) {
    for placeholder in [
        NaiveDate::from_ymd_opt(2999, 12, 31).unwrap(),
        NaiveDate::from_ymd_opt(1900, 1, 1).unwrap(),
    ] {
        assert_ne!(value, Some(placeholder));
    }
}

// Rust has no EquitySecurity / CashSecurity: SecurityWrapper wraps every type.
const NON_BONDS: [ProductTypeProto; 5] = [
    ProductTypeProto::CommonStock,
    ProductTypeProto::EquityIndex,
    ProductTypeProto::Currency,
    ProductTypeProto::FxSpot,
    ProductTypeProto::Cryptocurrency,
];

#[test]
fn non_bond_dates_are_absent() {
    for product_type in NON_BONDS {
        for bond_details in [None, Some(BondDetailsProto::default())] {
            let security = SecurityWrapper::new(proto(product_type, bond_details));
            assert_eq!(security.issue_date(), None, "{:?}", product_type);
            assert_eq!(security.maturity_date(), None, "{:?}", product_type);
            assert_not_placeholder(security.issue_date());
            assert_not_placeholder(security.maturity_date());
        }
    }
}

#[test]
fn plain_security_with_dates_returns_them() {
    for product_type in [ProductTypeProto::FxSpot, ProductTypeProto::Cryptocurrency] {
        let security = SecurityWrapper::new(proto(product_type, Some(dated_bond_details())));
        assert_eq!(security.issue_date(), Some(issue()));
        assert_eq!(security.maturity_date(), Some(maturity()));
    }
}

#[test]
fn bond_dates_unchanged() {
    for product_type in [
        ProductTypeProto::TreasuryNote,
        ProductTypeProto::Tips,
        ProductTypeProto::TreasuryFrn,
        ProductTypeProto::MortgageBacked,
    ] {
        let p = proto(product_type, Some(dated_bond_details()));
        let bond = BondSecurity::from_proto(p.clone()).expect("bond product type");
        assert_eq!(bond.issue_date(), Some(issue()), "{:?}", product_type);
        assert_eq!(bond.maturity_date(), Some(maturity()), "{:?}", product_type);

        let security = SecurityWrapper::new(p);
        assert_eq!(security.issue_date(), Some(issue()), "{:?}", product_type);
        assert_eq!(security.maturity_date(), Some(maturity()), "{:?}", product_type);
    }
}

#[test]
fn invalid_date_proto_returns_none_without_panicking() {
    let bond_details = BondDetailsProto {
        issue_date: Some(local_date(2024, 13, 1)),
        maturity_date: Some(local_date(2034, 13, 1)),
        ..Default::default()
    };
    let security = SecurityWrapper::new(proto(ProductTypeProto::FxSpot, Some(bond_details)));
    assert_eq!(security.issue_date(), None);
    assert_eq!(security.maturity_date(), None);
}

#[test]
fn position_with_unset_date_entry_does_not_panic() {
    let entry = FieldMapEntry {
        field: FieldProto::MaturityDate as i32,
        operator: 0,
        field_map_value_one_of: None,
    };
    let position = Position::new(PositionProto {
        fields: vec![entry.clone()],
        ..Default::default()
    });
    assert!(position.get_field(entry.clone()).is_err());
    assert!(position.get_field_value(FieldProto::MaturityDate).is_err());
    assert!(position.get_field_display(entry).is_err());
    assert_eq!(position.to_string(), "MATURITY_DATE,;");
}
