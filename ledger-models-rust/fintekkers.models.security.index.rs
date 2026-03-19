#[derive(Clone, Copy, Debug, PartialEq, Eq, Hash, PartialOrd, Ord, ::prost::Enumeration)]
#[repr(i32)]
pub enum IndexTypeProto {
    UnknownIndexType = 0,
    /// Consumer Price Index - All Urban Consumers
    CpiU = 1,
    /// Consumer Price Index - Urban Wage Earners and Clerical Workers
    CpiW = 2,
    /// CPI less food and energy
    CoreCpi = 3,
    /// Personal Consumption Expenditures
    Pce = 4,
    /// Harmonised Index of Consumer Prices (EU)
    Hicp = 5,
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
            _ => None,
        }
    }
}
