#[derive(Clone, Copy, Debug, PartialEq, Eq, Hash, PartialOrd, Ord, ::prost::Enumeration)]
#[repr(i32)]
pub enum AuctionTypeProto {
    UnknownAuctionType = 0,
    SinglePrice = 1,
}
impl AuctionTypeProto {
    /// String value of the enum field names used in the ProtoBuf definition.
    ///
    /// The values are not transformed in any way and thus are considered stable
    /// (if the ProtoBuf definition does not change) and safe for programmatic use.
    pub fn as_str_name(&self) -> &'static str {
        match self {
            AuctionTypeProto::UnknownAuctionType => "UNKNOWN_AUCTION_TYPE",
            AuctionTypeProto::SinglePrice => "SINGLE_PRICE",
        }
    }
    /// Creates an enum from field names used in the ProtoBuf definition.
    pub fn from_str_name(value: &str) -> ::core::option::Option<Self> {
        match value {
            "UNKNOWN_AUCTION_TYPE" => Some(Self::UnknownAuctionType),
            "SINGLE_PRICE" => Some(Self::SinglePrice),
            _ => None,
        }
    }
}
///
/// Issuance proto contains the following:
/// - changes in outstanding quantities.
/// - auction
/// - auction date
/// - issue date (note: original issue date is found on the base security)
/// - announcement date
/// - pre-auction outstanding quantity
/// - offering amount
/// - auction type (e.g. single price)
/// - price (if single price auction)
/// - award details, i.e. below. The above should apply to corproate issuance also
/// <PrimaryDealerTendered>136650000000</PrimaryDealerTendered>
/// <PrimaryDealerAccepted>32879650000</PrimaryDealerAccepted>
/// <DirectBidderTendered>9525000000</DirectBidderTendered>
/// <DirectBidderAccepted>3548785000</DirectBidderAccepted>
/// <IndirectBidderTendered>9055736500</IndirectBidderTendered>
/// <IndirectBidderAccepted>8145454000</IndirectBidderAccepted>
/// <CompetitiveTendered>155230736500</CompetitiveTendered>
/// <CompetitiveAccepted>44573889000</CompetitiveAccepted>
/// <NonCompetitiveAccepted>326458500</NonCompetitiveAccepted>
/// <SOMATendered>0</SOMATendered>
/// <SOMAAccepted>0</SOMAAccepted>
/// <FIMATendered>100000000</FIMATendered>
/// <FIMAAccepted>100000000</FIMAAccepted>
/// <TotalTendered>155657195000</TotalTendered>
/// <TotalAccepted>45000347500</TotalAccepted>
/// - tender offer
/// - ?
///
///
#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct IssuanceProto {
    #[prost(string, tag = "1")]
    pub object_class: ::prost::alloc::string::String,
    #[prost(string, tag = "2")]
    pub version: ::prost::alloc::string::String,
    /// Primary Key not needed currently as these will be stored on the security object
    ///    fintekkers.models.util.UUIDProto uuid = 5;
    ///
    ///    bool is_link = 7;
    #[prost(message, optional, tag = "6")]
    pub as_of: ::core::option::Option<super::super::util::LocalTimestampProto>,
    #[prost(message, optional, tag = "8")]
    pub valid_from: ::core::option::Option<super::super::util::LocalTimestampProto>,
    #[prost(message, optional, tag = "9")]
    pub valid_to: ::core::option::Option<super::super::util::LocalTimestampProto>,
    #[prost(message, optional, tag = "20")]
    pub auction_announcement_date: ::core::option::Option<
        super::super::util::LocalDateProto,
    >,
    #[prost(message, optional, tag = "21")]
    pub auction_issue_date: ::core::option::Option<super::super::util::LocalDateProto>,
    #[prost(message, optional, tag = "22")]
    pub preauction_outstanding_quantity: ::core::option::Option<
        super::super::util::DecimalValueProto,
    >,
    #[prost(message, optional, tag = "23")]
    pub auction_offering_amount: ::core::option::Option<
        super::super::util::DecimalValueProto,
    >,
    #[prost(enumeration = "AuctionTypeProto", tag = "24")]
    pub auction_type: i32,
    #[prost(message, optional, tag = "25")]
    pub price_for_single_price_auction: ::core::option::Option<
        super::super::util::DecimalValueProto,
    >,
}
