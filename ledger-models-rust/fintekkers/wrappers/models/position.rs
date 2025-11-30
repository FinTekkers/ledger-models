use crate::fintekkers::models::portfolio::PortfolioProto;
use crate::fintekkers::models::position::{
    field_map_entry, FieldMapEntry, FieldProto, MeasureMapEntry, MeasureProto, PositionFilterProto,
    PositionProto,
};
use crate::fintekkers::models::price::PriceProto;
use crate::fintekkers::models::security::{IdentifierProto, SecurityProto, TenorProto};
use crate::fintekkers::models::strategy::StrategyProto;
use crate::fintekkers::models::util::{LocalDateProto, LocalTimestampProto, UuidProto};
use crate::fintekkers::wrappers::models::portfolio::PortfolioWrapper;
use crate::fintekkers::wrappers::models::security::SecurityWrapper;
use crate::fintekkers::wrappers::models::utils::errors::Error;
use crate::fintekkers::wrappers::models::utils::serialization::ProtoSerializationUtil;
use crate::fintekkers::wrappers::models::utils::uuid_wrapper::UUIDWrapper;
use chrono::naive::NaiveDate;
use chrono::{DateTime, NaiveDateTime};
use chrono_tz::Tz;
use prost::Message;
use prost_types::Any;
use rust_decimal::Decimal;
use uuid::Uuid;

#[derive(Debug)]
pub struct Position {
    position_proto: PositionProto,
}

impl Position {
    pub fn new(position_proto: PositionProto) -> Position {
        Position { position_proto }
    }

    pub fn get_field_value(
        &self,
        field: FieldProto,
    ) -> Result<Box<dyn std::any::Any>, &'static str> {
        let field_entry = FieldMapEntry {
            field: field as i32,
            operator: 0,
            field_map_value_one_of: None,
        };
        self.get_field(field_entry)
    }

    pub fn get_field(
        &self,
        field_to_get: FieldMapEntry,
    ) -> Result<Box<dyn std::any::Any>, &'static str> {
        for tmp_field in &self.position_proto.fields {
            if tmp_field.field == field_to_get.field {
                // Check for string value first
                if let Some(field_map_entry::FieldMapValueOneOf::StringValue(ref s)) =
                    tmp_field.field_map_value_one_of
                {
                    if !s.is_empty() {
                        return Ok(Box::new(s.clone()));
                    }
                }

                // Check for enum value
                if let Some(field_map_entry::FieldMapValueOneOf::EnumValue(enum_val)) =
                    tmp_field.field_map_value_one_of
                {
                    return Ok(Box::new(enum_val));
                }

                // Handle packed values
                if let Some(field_map_entry::FieldMapValueOneOf::FieldValuePacked(_)) =
                    tmp_field.field_map_value_one_of
                {
                    let field_enum = FieldProto::from_i32(field_to_get.field)
                        .ok_or("Invalid field enum value")?;

                    // Special handling for Portfolio and Security - return wrappers
                    if field_enum == FieldProto::Portfolio {
                        if let Ok(proto) =
                            Self::unpack_field(tmp_field)?.downcast::<PortfolioProto>()
                        {
                            return Ok(Box::new(PortfolioWrapper::new(*proto)));
                        }
                    }

                    if field_enum == FieldProto::Security
                        || field_enum == FieldProto::CashImpactSecurity
                    {
                        if let Ok(proto) =
                            Self::unpack_field(tmp_field)?.downcast::<SecurityProto>()
                        {
                            return Ok(Box::new(SecurityWrapper::new(*proto)));
                        }
                    }

                    // For other fields, return the unpacked value
                    return Self::unpack_field(tmp_field);
                }
            }
        }
        Err("Could not find field in position")
    }

    pub fn get_measure_value(&self, measure: MeasureProto) -> Result<Decimal, &'static str> {
        let measure_entry = MeasureMapEntry {
            measure: measure as i32,
            measure_decimal_value: None,
        };
        self.get_measure(measure_entry)
    }

    pub fn get_measure(&self, measure_to_get: MeasureMapEntry) -> Result<Decimal, &'static str> {
        for tmp_measure in &self.position_proto.measures {
            if tmp_measure.measure == measure_to_get.measure {
                return Self::unpack_measure(tmp_measure);
            }
        }
        Err("Could not find measure in position")
    }

    pub fn get_field_display(&self, field_to_get: FieldMapEntry) -> Result<String, &'static str> {
        let value = self.get_field(field_to_get)?;

        // Try to downcast_ref to different types and format them
        if let Some(s) = value.downcast_ref::<String>() {
            return Ok(s.clone());
        }

        if let Some(i) = value.downcast_ref::<i32>() {
            return Ok(i.to_string());
        }

        // For wrapper types, use their Display implementation
        if let Some(portfolio) = value.downcast_ref::<PortfolioWrapper>() {
            return Ok(portfolio.portfolio_name().to_string());
        }

        if let Some(_security) = value.downcast_ref::<SecurityWrapper>() {
            // SecurityWrapper doesn't implement Debug, so use a simple representation
            return Ok("Security".to_string());
        }

        if let Some(uuid) = value.downcast_ref::<Uuid>() {
            return Ok(uuid.to_string());
        }

        if let Some(date) = value.downcast_ref::<NaiveDate>() {
            return Ok(date.to_string());
        }

        if let Some(timestamp) = value.downcast_ref::<DateTime<Tz>>() {
            return Ok(timestamp.to_string());
        }

        if let Some(price_proto) = value.downcast_ref::<PriceProto>() {
            if let Some(ref uuid_proto) = price_proto.uuid {
                let uuid = ProtoSerializationUtil::deserialize_uuid(uuid_proto)
                    .map_err(|_| "Failed to convert UuidProto to Uuid")?;
                return Ok(uuid.to_string());
            }
        }

        // Default: try to format as debug string
        Ok("Unknown field type".to_string())
    }

    pub fn get_measures(&self) -> Vec<MeasureMapEntry> {
        self.position_proto.measures.clone()
    }

    pub fn get_fields(&self) -> Vec<FieldMapEntry> {
        self.position_proto.fields.clone()
    }

    pub fn to_string(&self) -> String {
        let mut output = String::new();

        for field in self.get_fields() {
            let field_name = FieldProto::from_i32(field.field)
                .map(|f| f.as_str_name())
                .unwrap_or("UNKNOWN");
            output.push_str(field_name);
            output.push(',');

            if let Ok(display) = self.get_field_display(field) {
                output.push_str(&display);
            }
            output.push(';');
        }

        for measure in self.get_measures() {
            // MeasureProto doesn't have from_i32, so we'll use the numeric value
            // or try to match it manually
            let measure_name = match measure.measure {
                0 => "UNKNOWN_MEASURE",
                1 => "DIRECTED_QUANTITY",
                2 => "MARKET_VALUE",
                3 => "UNADJUSTED_COST_BASIS",
                4 => "ADJUSTED_COST_BASIS",
                5 => "CURRENT_YIELD",
                6 => "YIELD_TO_MATURITY",
                _ => "UNKNOWN",
            };
            output.push_str(measure_name);
            output.push(',');

            if let Ok(decimal) = self.get_measure(measure) {
                output.push_str(&decimal.to_string());
            }
            output.push(';');
        }

        output
    }

    fn wrap_string_to_any(my_string: &str) -> prost_types::Any {
        // StringValue wrapper encoding - for now return a placeholder
        // This would need proper StringValue proto support
        Any {
            type_url: "type.googleapis.com/google.protobuf.StringValue".to_string(),
            value: my_string.as_bytes().to_vec(),
        }
    }

    fn pack_field(field_to_pack: &dyn std::any::Any) -> Result<prost_types::Any, &'static str> {
        // Try to downcast to LocalDateProto
        if let Some(date_proto) = field_to_pack.downcast_ref::<LocalDateProto>() {
            let mut bytes = Vec::new();
            date_proto
                .encode(&mut bytes)
                .map_err(|_| "Failed to encode LocalDateProto")?;
            return Ok(Any {
                type_url: "type.googleapis.com/fintekkers.models.util.LocalDateProto".to_string(),
                value: bytes,
            });
        }

        Err("Unsupported field type for packing")
    }

    fn unpack_field(
        field_to_unpack: &FieldMapEntry,
    ) -> Result<Box<dyn std::any::Any>, &'static str> {
        let packed_value = match &field_to_unpack.field_map_value_one_of {
            Some(field_map_entry::FieldMapValueOneOf::FieldValuePacked(any)) => any,
            _ => return Err("Field value is required"),
        };

        let binary_value = &packed_value.value;
        let field_enum =
            FieldProto::from_i32(field_to_unpack.field).ok_or("Invalid field enum value")?;

        match field_enum {
            FieldProto::PortfolioId
            | FieldProto::SecurityId
            | FieldProto::PriceId
            | FieldProto::Id => {
                let uuid_proto = UuidProto::decode(binary_value.as_slice())
                    .map_err(|_| "Failed to decode UUIDProto")?;
                let uuid = ProtoSerializationUtil::deserialize_uuid(&uuid_proto)
                    .map_err(|_| "Failed to convert UuidProto to Uuid")?;
                Ok(Box::new(uuid))
            }
            FieldProto::AsOf => {
                let timestamp_proto = LocalTimestampProto::decode(binary_value.as_slice())
                    .map_err(|_| "Failed to decode LocalTimestampProto")?;
                let timestamp = ProtoSerializationUtil::deserialize_timestamp(&timestamp_proto)
                    .map_err(|_| "Failed to convert LocalTimestampProto to DateTime")?;
                Ok(Box::new(timestamp))
            }
            FieldProto::TradeDate
            | FieldProto::MaturityDate
            | FieldProto::IssueDate
            | FieldProto::SettlementDate
            | FieldProto::TaxLotOpenDate
            | FieldProto::TaxLotCloseDate
            | FieldProto::EffectiveDate => {
                let date_proto = LocalDateProto::decode(binary_value.as_slice())
                    .map_err(|_| "Failed to decode LocalDateProto")?;
                let date = ProtoSerializationUtil::deserialize_date(&date_proto)
                    .map_err(|_| "Failed to convert LocalDateProto to NaiveDate")?;
                Ok(Box::new(date))
            }
            FieldProto::Identifier => {
                let identifier_proto = IdentifierProto::decode(binary_value.as_slice())
                    .map_err(|_| "Failed to decode IdentifierProto")?;
                Ok(Box::new(identifier_proto))
            }
            FieldProto::Strategy => {
                let strategy_proto = StrategyProto::decode(binary_value.as_slice())
                    .map_err(|_| "Failed to decode StrategyProto")?;
                Ok(Box::new(strategy_proto))
            }
            FieldProto::Tenor | FieldProto::AdjustedTenor => {
                let tenor_proto = TenorProto::decode(binary_value.as_slice())
                    .map_err(|_| "Failed to decode TenorProto")?;
                Ok(Box::new(tenor_proto))
            }
            FieldProto::Price => {
                let price_proto = PriceProto::decode(binary_value.as_slice())
                    .map_err(|_| "Failed to decode PriceProto")?;
                Ok(Box::new(price_proto))
            }
            FieldProto::PortfolioName
            | FieldProto::SecurityDescription
            | FieldProto::SecurityIssuerName
            | FieldProto::ProductType
            | FieldProto::ProductClass
            | FieldProto::AssetClass => {
                // StringValue is a wrapper, but we can decode it manually
                // For now, try to decode as a simple string representation
                // In practice, these might be stored as StringValue in the Any
                // We'll need to handle the StringValue wrapper properly
                // For now, return an error and note this needs proper StringValue handling
                Err("StringValue decoding not yet implemented - needs prost_types StringValue support")
            }
            FieldProto::Portfolio => {
                let portfolio_proto = PortfolioProto::decode(binary_value.as_slice())
                    .map_err(|_| "Failed to decode PortfolioProto")?;
                Ok(Box::new(portfolio_proto))
            }
            FieldProto::Security | FieldProto::CashImpactSecurity => {
                let security_proto = SecurityProto::decode(binary_value.as_slice())
                    .map_err(|_| "Failed to decode SecurityProto")?;
                Ok(Box::new(security_proto))
            }
            FieldProto::TransactionType | FieldProto::PositionStatus => {
                // These are enum values, return the enum value directly
                if let Some(field_map_entry::FieldMapValueOneOf::EnumValue(val)) =
                    &field_to_unpack.field_map_value_one_of
                {
                    Ok(Box::new(*val))
                } else {
                    Err("Enum value expected for TransactionType or PositionStatus")
                }
            }
            _ => Err("Field not found. Could not unpack field. Mapping missing"),
        }
    }

    fn unpack_measure(measure_to_unpack: &MeasureMapEntry) -> Result<Decimal, &'static str> {
        let decimal_proto = measure_to_unpack
            .measure_decimal_value
            .as_ref()
            .ok_or("Measure decimal value is required")?;
        ProtoSerializationUtil::deserialize_decimal(decimal_proto)
            .map_err(|_| "Failed to convert DecimalValueProto to Decimal")
    }
}

#[derive(Debug)]
pub struct PositionFilter {
    filter_proto: PositionFilterProto,
}

impl PositionFilter {
    pub fn new(filter_proto: PositionFilterProto) -> PositionFilter {
        PositionFilter { filter_proto }
    }

    pub fn get_filters(&self) -> &[FieldMapEntry] {
        &self.filter_proto.filters
    }

    pub fn to_proto(&self) -> PositionFilterProto {
        self.filter_proto.clone()
    }
}

impl TryFrom<&[u8]> for PositionFilterProto {
    type Error = Error;

    fn try_from(bytes: &[u8]) -> Result<Self, Self::Error> {
        PositionFilterProto::decode(bytes).map_err(|_| Error::DeserializationError)
    }
}

impl TryFrom<Vec<u8>> for PositionFilterProto {
    type Error = Error;

    fn try_from(bytes: Vec<u8>) -> Result<Self, Self::Error> {
        PositionFilterProto::decode(bytes.as_slice()).map_err(|_| Error::DeserializationError)
    }
}

#[cfg(test)]
mod test {
    use super::*;
    use crate::fintekkers::models::position::{field_map_entry, PositionFilterOperator};
    use crate::fintekkers::models::util::DecimalValueProto;
    use crate::fintekkers::models::util::UuidProto;
    use crate::fintekkers::wrappers::models::utils::uuid_wrapper::UUIDWrapper;
    use chrono::naive::NaiveDate;
    use chrono::{DateTime, Datelike};
    use chrono_tz::Tz;
    use prost_types::Any;
    use uuid::Uuid;

    // Helper function to create a UUID field entry
    fn create_uuid_field_entry(field: FieldProto, uuid_str: &str) -> FieldMapEntry {
        let uuid = Uuid::parse_str(uuid_str).unwrap();
        let uuid_proto = UuidProto {
            raw_uuid: uuid.as_bytes().to_vec(),
        };
        let mut uuid_bytes = Vec::new();
        uuid_proto.encode(&mut uuid_bytes).unwrap();

        let packed_uuid = Any {
            type_url: "type.googleapis.com/fintekkers.models.util.UUIDProto".to_string(),
            value: uuid_bytes,
        };

        FieldMapEntry {
            field: field as i32,
            operator: 0,
            field_map_value_one_of: Some(field_map_entry::FieldMapValueOneOf::FieldValuePacked(
                packed_uuid,
            )),
        }
    }

    // Helper function to create a date field entry
    fn create_date_field_entry(
        field: FieldProto,
        year: u32,
        month: u32,
        day: u32,
    ) -> FieldMapEntry {
        let date_proto = LocalDateProto { year, month, day };
        let mut date_bytes = Vec::new();
        date_proto.encode(&mut date_bytes).unwrap();

        let packed_date = Any {
            type_url: "type.googleapis.com/fintekkers.models.util.LocalDateProto".to_string(),
            value: date_bytes,
        };

        FieldMapEntry {
            field: field as i32,
            operator: 0,
            field_map_value_one_of: Some(field_map_entry::FieldMapValueOneOf::FieldValuePacked(
                packed_date,
            )),
        }
    }

    // Helper function to create a timestamp field entry
    fn create_timestamp_field_entry() -> FieldMapEntry {
        let timestamp = prost_types::Timestamp {
            seconds: 1609459200, // 2021-01-01 00:00:00 UTC
            nanos: 0,
        };
        let timestamp_proto = LocalTimestampProto {
            timestamp: Some(timestamp),
            time_zone: "America/New_York".to_string(), // Use a specific timezone to test
        };
        let mut timestamp_bytes = Vec::new();
        timestamp_proto.encode(&mut timestamp_bytes).unwrap();

        let packed_timestamp = Any {
            type_url: "type.googleapis.com/fintekkers.models.util.LocalTimestampProto".to_string(),
            value: timestamp_bytes,
        };

        FieldMapEntry {
            field: FieldProto::AsOf as i32,
            operator: 0,
            field_map_value_one_of: Some(field_map_entry::FieldMapValueOneOf::FieldValuePacked(
                packed_timestamp,
            )),
        }
    }

    // Helper function to create a string field entry
    fn create_string_field_entry(field: FieldProto, value: &str) -> FieldMapEntry {
        FieldMapEntry {
            field: field as i32,
            operator: 0,
            field_map_value_one_of: Some(field_map_entry::FieldMapValueOneOf::StringValue(
                value.to_string(),
            )),
        }
    }

    // Helper function to create an enum field entry
    fn create_enum_field_entry(field: FieldProto, enum_value: i32) -> FieldMapEntry {
        FieldMapEntry {
            field: field as i32,
            operator: 0,
            field_map_value_one_of: Some(field_map_entry::FieldMapValueOneOf::EnumValue(
                enum_value,
            )),
        }
    }

    // Helper function to create a measure entry
    fn create_measure_entry(measure: MeasureProto, value: &str) -> MeasureMapEntry {
        MeasureMapEntry {
            measure: measure as i32,
            measure_decimal_value: Some(DecimalValueProto {
                arbitrary_precision_value: value.to_string(),
            }),
        }
    }

    #[test]
    fn test_position_filter_with_security_id_uuid() {
        // Create a UUID
        let uuid = Uuid::parse_str("550e8400-e29b-41d4-a716-446655440000").unwrap();
        let uuid_wrapper = UUIDWrapper::new(UuidProto {
            raw_uuid: uuid.as_bytes().to_vec(),
        });

        // Convert UUID to UuidProto and encode it
        let uuid_proto: UuidProto = uuid_wrapper.into();
        let mut uuid_bytes = Vec::new();
        uuid_proto.encode(&mut uuid_bytes).unwrap();

        // Create an Any with the packed UUID
        let packed_uuid = Any {
            type_url: "type.googleapis.com/fintekkers.models.util.UUIDProto".to_string(),
            value: uuid_bytes,
        };

        // Create a FieldMapEntry with SECURITY_ID field and the packed UUID
        let field_entry = FieldMapEntry {
            field: FieldProto::SecurityId as i32,
            operator: PositionFilterOperator::Equals as i32,
            field_map_value_one_of: Some(field_map_entry::FieldMapValueOneOf::FieldValuePacked(
                packed_uuid,
            )),
        };

        // Create PositionFilterProto with the filter
        let filter_proto = PositionFilterProto {
            object_class: "PositionFilter".to_string(),
            version: "0.0.1".to_string(),
            filters: vec![field_entry],
        };

        // Create PositionFilter
        let position_filter = PositionFilter::new(filter_proto.clone());

        // Verify the filter was created correctly
        let filters = position_filter.get_filters();
        assert_eq!(filters.len(), 1);
        assert_eq!(filters[0].field, FieldProto::SecurityId as i32);
        assert_eq!(filters[0].operator, PositionFilterOperator::Equals as i32);

        // Verify we can get the proto back
        let retrieved_proto = position_filter.to_proto();
        assert_eq!(retrieved_proto.object_class, "PositionFilter");
        assert_eq!(retrieved_proto.version, "0.0.1");
        assert_eq!(retrieved_proto.filters.len(), 1);
    }

    #[test]
    fn test_position_with_string_field() {
        let field_entry = create_string_field_entry(FieldProto::PortfolioName, "Test Portfolio");
        let position_proto = PositionProto {
            object_class: "Position".to_string(),
            version: "0.0.1".to_string(),
            position_view: 0,
            position_type: 0,
            measures: vec![],
            fields: vec![field_entry.clone()],
        };

        let position = Position::new(position_proto);

        // Test get_field_value
        let value = position.get_field_value(FieldProto::PortfolioName).unwrap();
        let string_value = value.downcast_ref::<String>().unwrap();
        assert_eq!(string_value, "Test Portfolio");

        // Test get_field
        let field_value = position.get_field(field_entry.clone()).unwrap();
        let string_value = field_value.downcast_ref::<String>().unwrap();
        assert_eq!(string_value, "Test Portfolio");

        // Test get_field_display
        let display = position.get_field_display(field_entry).unwrap();
        assert_eq!(display, "Test Portfolio");
    }

    #[test]
    fn test_position_with_uuid_fields() {
        let id_entry =
            create_uuid_field_entry(FieldProto::Id, "550e8400-e29b-41d4-a716-446655440000");
        let security_id_entry = create_uuid_field_entry(
            FieldProto::SecurityId,
            "660e8400-e29b-41d4-a716-446655440001",
        );
        let portfolio_id_entry = create_uuid_field_entry(
            FieldProto::PortfolioId,
            "770e8400-e29b-41d4-a716-446655440002",
        );

        let position_proto = PositionProto {
            object_class: "Position".to_string(),
            version: "0.0.1".to_string(),
            position_view: 0,
            position_type: 0,
            measures: vec![],
            fields: vec![
                id_entry.clone(),
                security_id_entry.clone(),
                portfolio_id_entry.clone(),
            ],
        };

        let position = Position::new(position_proto);

        // Test Id field - should return native Rust Uuid
        let value = position.get_field_value(FieldProto::Id).unwrap();
        let uuid = value.downcast_ref::<Uuid>().unwrap();
        assert_eq!(uuid.to_string(), "550e8400-e29b-41d4-a716-446655440000");

        // Test SecurityId field
        let value = position.get_field_value(FieldProto::SecurityId).unwrap();
        let uuid = value.downcast_ref::<Uuid>().unwrap();
        assert_eq!(uuid.to_string(), "660e8400-e29b-41d4-a716-446655440001");

        // Test PortfolioId field
        let value = position.get_field_value(FieldProto::PortfolioId).unwrap();
        let uuid = value.downcast_ref::<Uuid>().unwrap();
        assert_eq!(uuid.to_string(), "770e8400-e29b-41d4-a716-446655440002");
    }

    #[test]
    fn test_position_with_date_fields() {
        let trade_date_entry = create_date_field_entry(FieldProto::TradeDate, 2023, 10, 15);
        let maturity_date_entry = create_date_field_entry(FieldProto::MaturityDate, 2025, 12, 31);
        let settlement_date_entry =
            create_date_field_entry(FieldProto::SettlementDate, 2023, 10, 17);

        let position_proto = PositionProto {
            object_class: "Position".to_string(),
            version: "0.0.1".to_string(),
            position_view: 0,
            position_type: 0,
            measures: vec![],
            fields: vec![
                trade_date_entry.clone(),
                maturity_date_entry.clone(),
                settlement_date_entry.clone(),
            ],
        };

        let position = Position::new(position_proto);

        // Test TradeDate - should return native Rust NaiveDate
        let value = position.get_field_value(FieldProto::TradeDate).unwrap();
        let date = value.downcast_ref::<NaiveDate>().unwrap();
        assert_eq!(date.year(), 2023);
        assert_eq!(date.month(), 10);
        assert_eq!(date.day(), 15);

        // Test get_field_display for date
        let display = position.get_field_display(trade_date_entry).unwrap();
        assert_eq!(display, "2023-10-15");

        // Test MaturityDate
        let value = position.get_field_value(FieldProto::MaturityDate).unwrap();
        let date = value.downcast_ref::<NaiveDate>().unwrap();
        assert_eq!(date.year(), 2025);
        assert_eq!(date.month(), 12);
        assert_eq!(date.day(), 31);
    }

    #[test]
    fn test_position_with_timestamp_field() {
        let as_of_entry = create_timestamp_field_entry();

        let position_proto = PositionProto {
            object_class: "Position".to_string(),
            version: "0.0.1".to_string(),
            position_view: 0,
            position_type: 0,
            measures: vec![],
            fields: vec![as_of_entry.clone()],
        };

        let position = Position::new(position_proto);

        // Test AsOf field - should return native Rust DateTime<Tz> with correct timezone
        let value = position.get_field_value(FieldProto::AsOf).unwrap();
        let timestamp = value.downcast_ref::<DateTime<Tz>>().unwrap();

        // The timestamp is 2021-01-01 00:00:00 UTC, which is 2020-12-31 19:00:00 EST
        // So in EST timezone (America/New_York), it should be Dec 31, 2020
        assert_eq!(timestamp.year(), 2020);
        assert_eq!(timestamp.month(), 12);
        assert_eq!(timestamp.day(), 31);

        // Verify the timezone is America/New_York (EST/EDT)
        let timezone_str = timestamp.timezone().to_string();
        assert!(
            timezone_str.contains("EST")
                || timezone_str.contains("EDT")
                || timezone_str.contains("America/New_York")
        );

        // Test get_field_display for timestamp
        let display = position.get_field_display(as_of_entry).unwrap();
        assert!(display.contains("2020")); // Should contain the year (EST is 5 hours behind UTC)
    }

    #[test]
    fn test_position_with_enum_field() {
        // TransactionType enum value (assuming 1 = BUY, 2 = SELL, etc.)
        let transaction_type_entry = create_enum_field_entry(FieldProto::TransactionType, 1);

        let position_proto = PositionProto {
            object_class: "Position".to_string(),
            version: "0.0.1".to_string(),
            position_view: 0,
            position_type: 0,
            measures: vec![],
            fields: vec![transaction_type_entry.clone()],
        };

        let position = Position::new(position_proto);

        // Test enum field
        let value = position
            .get_field_value(FieldProto::TransactionType)
            .unwrap();
        let enum_value = value.downcast_ref::<i32>().unwrap();
        assert_eq!(*enum_value, 1);

        // Test get_field_display for enum
        let display = position.get_field_display(transaction_type_entry).unwrap();
        assert_eq!(display, "1");
    }

    #[test]
    fn test_position_with_decimal_measures() {
        let directed_quantity = create_measure_entry(MeasureProto::DirectedQuantity, "100.50");
        let market_value = create_measure_entry(MeasureProto::MarketValue, "50000.75");

        let position_proto = PositionProto {
            object_class: "Position".to_string(),
            version: "0.0.1".to_string(),
            position_view: 0,
            position_type: 0,
            measures: vec![directed_quantity.clone(), market_value.clone()],
            fields: vec![],
        };

        let position = Position::new(position_proto);

        // Test get_measure_value - should return native Rust Decimal
        let measure = position
            .get_measure_value(MeasureProto::DirectedQuantity)
            .unwrap();
        assert_eq!(measure.to_string(), "100.50");

        // Test get_measure
        let measure = position.get_measure(directed_quantity).unwrap();
        assert_eq!(measure.to_string(), "100.50");

        // Test MarketValue
        let measure = position
            .get_measure_value(MeasureProto::MarketValue)
            .unwrap();
        assert_eq!(measure.to_string(), "50000.75");
    }

    #[test]
    fn test_position_get_fields_and_measures() {
        let field1 = create_string_field_entry(FieldProto::PortfolioName, "Portfolio 1");
        let field2 =
            create_uuid_field_entry(FieldProto::Id, "550e8400-e29b-41d4-a716-446655440000");
        let measure1 = create_measure_entry(MeasureProto::DirectedQuantity, "100.0");

        let position_proto = PositionProto {
            object_class: "Position".to_string(),
            version: "0.0.1".to_string(),
            position_view: 0,
            position_type: 0,
            measures: vec![measure1],
            fields: vec![field1, field2],
        };

        let position = Position::new(position_proto);

        // Test get_fields
        let fields = position.get_fields();
        assert_eq!(fields.len(), 2);

        // Test get_measures
        let measures = position.get_measures();
        assert_eq!(measures.len(), 1);
    }

    #[test]
    fn test_position_to_string() {
        let field1 = create_string_field_entry(FieldProto::PortfolioName, "Test Portfolio");
        let field2 = create_date_field_entry(FieldProto::TradeDate, 2023, 10, 15);
        let measure1 = create_measure_entry(MeasureProto::DirectedQuantity, "100.50");

        let position_proto = PositionProto {
            object_class: "Position".to_string(),
            version: "0.0.1".to_string(),
            position_view: 0,
            position_type: 0,
            measures: vec![measure1],
            fields: vec![field1, field2],
        };

        let position = Position::new(position_proto);

        let result = position.to_string();
        assert!(result.contains("PORTFOLIO_NAME"));
        assert!(result.contains("Test Portfolio"));
        assert!(result.contains("TRADE_DATE"));
        assert!(result.contains("2023-10-15"));
        assert!(result.contains("DIRECTED_QUANTITY"));
        assert!(result.contains("100.50"));
    }

    #[test]
    fn test_position_field_not_found() {
        let position_proto = PositionProto {
            object_class: "Position".to_string(),
            version: "0.0.1".to_string(),
            position_view: 0,
            position_type: 0,
            measures: vec![],
            fields: vec![],
        };

        let position = Position::new(position_proto);

        // Test get_field_value for non-existent field
        let result = position.get_field_value(FieldProto::PortfolioName);
        assert!(result.is_err());
        assert_eq!(result.unwrap_err(), "Could not find field in position");

        // Test get_measure_value for non-existent measure
        let result = position.get_measure_value(MeasureProto::DirectedQuantity);
        assert!(result.is_err());
        assert_eq!(result.unwrap_err(), "Could not find measure in position");
    }

    #[test]
    fn test_position_with_multiple_field_types() {
        // Test a position with various field types
        let string_field = create_string_field_entry(FieldProto::AssetClass, "Equity");
        let uuid_field = create_uuid_field_entry(
            FieldProto::SecurityId,
            "880e8400-e29b-41d4-a716-446655440003",
        );
        let date_field = create_date_field_entry(FieldProto::MaturityDate, 2024, 6, 30);
        let enum_field = create_enum_field_entry(FieldProto::PositionStatus, 1);
        let timestamp_field = create_timestamp_field_entry();

        let position_proto = PositionProto {
            object_class: "Position".to_string(),
            version: "0.0.1".to_string(),
            position_view: 0,
            position_type: 0,
            measures: vec![
                create_measure_entry(MeasureProto::DirectedQuantity, "50.25"),
                create_measure_entry(MeasureProto::MarketValue, "25000.00"),
            ],
            fields: vec![
                string_field.clone(),
                uuid_field.clone(),
                date_field.clone(),
                enum_field.clone(),
                timestamp_field.clone(),
            ],
        };

        let position = Position::new(position_proto);

        // Verify all fields can be retrieved
        assert!(position.get_field_value(FieldProto::AssetClass).is_ok());
        assert!(position.get_field_value(FieldProto::SecurityId).is_ok());
        assert!(position.get_field_value(FieldProto::MaturityDate).is_ok());
        assert!(position.get_field_value(FieldProto::PositionStatus).is_ok());
        assert!(position.get_field_value(FieldProto::AsOf).is_ok());

        // Verify measures can be retrieved
        assert!(position
            .get_measure_value(MeasureProto::DirectedQuantity)
            .is_ok());
        assert!(position
            .get_measure_value(MeasureProto::MarketValue)
            .is_ok());

        // Verify get_field_display works for all types
        assert!(position.get_field_display(string_field).is_ok());
        assert!(position.get_field_display(uuid_field).is_ok());
        assert!(position.get_field_display(date_field).is_ok());
        assert!(position.get_field_display(enum_field).is_ok());
        assert!(position.get_field_display(timestamp_field).is_ok());
    }
}

// ...
