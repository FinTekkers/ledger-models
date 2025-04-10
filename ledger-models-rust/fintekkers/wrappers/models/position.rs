use std::collections::HashMap;
use std::fmt;
use std::io::Write;
use std::str::FromStr;

use prost::Message;
use prost_types::{Any, EnumDescriptorProto, FieldDescriptorProto, Timestamp};
use uuid::Uuid;
use crate::fintekkers::models::position::{FieldMapEntry, FieldProto, MeasureMapEntry, MeasureProto, PositionProto};
use crate::fintekkers::models::util::DecimalValueProto;


#[derive(Debug)]
pub struct Position {
    position_proto: PositionProto,
}

impl Position {
    pub fn new(position_proto: PositionProto) -> Position {
        Position { position_proto }
    }

    pub fn get_field_value(&self, field: FieldProto) -> Result<Box<dyn std::any::Any>, &'static str> {
        for field_entry in &self.position_proto.fields {
            if field_entry.field == field {
                match field {
                    FieldProto::Id => {
                        if let Some(id) = &field_entry.field_map_value_one_of {
                            Ok(Box::new(id.clone()))
                        } else {
                            Err("Identifier not found in field_map_value_one_of")
                        }
                    }
                    // Add more cases for other FieldProto variants
                    _ => Err("Unsupported FieldProto"),
                }
            }
        }
        Err("Field not found in position_proto.fields")
    }

    pub fn get_field(&self, field_to_get: FieldMapEntry) -> Result<Box<dyn std::any::Any>, &'static str> {
        // ...
    }

    pub fn get_measure_value(&self, measure: MeasureProto) -> Result<DecimalValueProto, &'static str> {
        // ...
    }

    pub fn get_measure(&self, measure_to_get: MeasureMapEntry) -> Result<DecimalValueProto, &'static str> {
        // ...
    }

    pub fn get_field_display(&self, field_to_get: FieldMapEntry) -> Result<String, &'static str> {
        // ...
    }

    pub fn get_measures(&self) -> Vec<MeasureMapEntry> {
        // ...
    }

    pub fn get_fields(&self) -> Vec<FieldMapEntry> {
        // ...
    }

    pub fn to_string(&self) -> String {
        // ...
    }

    fn wrap_string_to_any(my_string: &str) -> Any {
        // ...
    }

    fn pack_field(&self, field_to_pack: &dyn Any) -> Result<Any, &'static str> {
        // ...
    }

    fn unpack_field(&self, field_to_unpack: &FieldMapEntry) -> Result<Box<dyn std::any::Any>, &'static str> {
        // ...
    }

    fn unpack_measure(&self, measure_to_unpack: &MeasureProto) -> Result<DecimalValueProto, &'static str> {
        // ...
    }
}

// ...