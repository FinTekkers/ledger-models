#[derive(Clone, Copy, Debug, PartialEq, Eq, Hash, PartialOrd, Ord, ::prost::Enumeration)]
#[repr(i32)]
pub enum IndexTypeProto {
    UnknownIndexType = 0,
    /// Consumer Price Index - All Urban Consumers. <https://www.bls.gov/cpi/>
    CpiU = 1,
    /// Consumer Price Index - Urban Wage Earners and Clerical Workers. <https://www.bls.gov/cpi/>
    CpiW = 2,
    /// CPI less food and energy. <https://www.bls.gov/cpi/>
    CoreCpi = 3,
    /// Personal Consumption Expenditures. <https://www.bea.gov/data/personal-consumption-expenditures-price-index>
    Pce = 4,
    /// Harmonised Index of Consumer Prices (EU). <https://ec.europa.eu/eurostat/web/hicp>
    Hicp = 5,
    /// Floating rate benchmarks (Risk-Free Rates and related)
    ///
    /// Secured Overnight Financing Rate — primary USD benchmark post-LIBOR. <https://www.newyorkfed.org/markets/reference-rates/sofr>
    Sofr = 10,
    /// 13-week Treasury bill auction high rate. <https://home.treasury.gov/resource-center/data-chart-center/interest-rates/>
    TBill13Week = 11,
    /// Federal Funds effective rate. <https://www.newyorkfed.org/markets/reference-rates/effr>
    FedFunds = 12,
    /// Sterling Overnight Index Average — primary GBP benchmark post-LIBOR. <https://www.bankofengland.co.uk/markets/sonia-benchmark>
    Sonia = 13,
    /// Euro Short-Term Rate — primary EUR benchmark post-LIBOR. <https://www.ecb.europa.eu/stats/financial_markets_and_interest_rates/euro_short-term_rate/html/index.en.html>
    Estr = 14,
    /// Tokyo Overnight Average Rate — primary JPY benchmark post-LIBOR. <https://www.boj.or.jp/en/statistics/market/short/mutan/index.htm>
    Tona = 15,
}
impl IndexTypeProto {
    /// String value of the enum field names used in the ProtoBuf definition.
    ///
    /// The values are not transformed in any way and thus are considered stable
    /// (if the ProtoBuf definition does not change) and safe for programmatic use.
    pub fn as_str_name(&self) -> &'static str {
        match self {
            IndexTypeProto::UnknownIndexType => "UNKNOWN_INDEX_TYPE",
            IndexTypeProto::CpiU => "CPI_U",
            IndexTypeProto::CpiW => "CPI_W",
            IndexTypeProto::CoreCpi => "CORE_CPI",
            IndexTypeProto::Pce => "PCE",
            IndexTypeProto::Hicp => "HICP",
            IndexTypeProto::Sofr => "SOFR",
            IndexTypeProto::TBill13Week => "T_BILL_13_WEEK",
            IndexTypeProto::FedFunds => "FED_FUNDS",
            IndexTypeProto::Sonia => "SONIA",
            IndexTypeProto::Estr => "ESTR",
            IndexTypeProto::Tona => "TONA",
        }
    }
    /// Creates an enum from field names used in the ProtoBuf definition.
    pub fn from_str_name(value: &str) -> ::core::option::Option<Self> {
        match value {
            "UNKNOWN_INDEX_TYPE" => Some(Self::UnknownIndexType),
            "CPI_U" => Some(Self::CpiU),
            "CPI_W" => Some(Self::CpiW),
            "CORE_CPI" => Some(Self::CoreCpi),
            "PCE" => Some(Self::Pce),
            "HICP" => Some(Self::Hicp),
            "SOFR" => Some(Self::Sofr),
            "T_BILL_13_WEEK" => Some(Self::TBill13Week),
            "FED_FUNDS" => Some(Self::FedFunds),
            "SONIA" => Some(Self::Sonia),
            "ESTR" => Some(Self::Estr),
            "TONA" => Some(Self::Tona),
            _ => None,
        }
    }
}
