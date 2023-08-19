"use strict";
// Note: Some classes and functions have been omitted or simplified due to lack of context.
Object.defineProperty(exports, "__esModule", { value: true });
var Position = /** @class */ (function () {
    function Position(positionProto) {
        this.positionProto = positionProto;
        //For each field, put into a map
        this.positionProto.getFieldsList().forEach(function (field) {
            console.log(field);
        });
    }
    return Position;
}());
//     get_field_value(field: FieldProto): any {
//         this.positionProto.getFieldsList()
//       return this.get_field(new FieldMapEntry({ field }));
//     }
//     get_field(field_to_get: FieldMapEntry): any {
//       for (const tmp_field of this.positionProto.fields) {
//         if (tmp_field.field === field_to_get.field) {
//           if (FieldProto.PORTFOLIO === field_to_get.field) {
//             return new Portfolio(Position.unpack_field(tmp_field));
//           }
//           if (FieldProto.SECURITY === field_to_get.field) {
//             return new Security(Position.unpack_field(tmp_field));
//           }
//           const unpacked_value = Position.unpack_field(tmp_field);
//           if (unpacked_value instanceof ProtoEnum) {
//             const descriptor = FieldProto.DESCRIPTOR.valuesByNumber[field_to_get.field];
//             return new ProtoEnum(descriptor, unpacked_value.enumValue);
//           }
//           if (
//             typeof unpacked_value === 'string' ||
//             typeof unpacked_value === 'number' ||
//             typeof unpacked_value === 'boolean'
//           ) {
//             return unpacked_value;
//           }
//           return ProtoSerializationUtil.deserialize(unpacked_value);
//         }
//       }
//       throw new Error('Could not find field in position');
//     }
//     get_measure_value(measure: MeasureProto): Decimal {
//       return this.get_measure(new MeasureMapEntry({ measure }));
//     }
//     get_measure(measure_to_get: MeasureMapEntry): Decimal {
//       for (const tmp_measure of this.positionProto.measures) {
//         if (tmp_measure.measure === measure_to_get.measure) {
//           return ProtoSerializationUtil.deserialize(Position.unpack_measure(tmp_measure));
//         }
//       }
//       throw new Error('Could not find measure in position');
//     }
//     get_field_display(field_to_get: FieldMapEntry): string {
//       const field_value = this.get_field(new FieldMapEntry(field_to_get));
//       return field_value.toString();
//     }
//     get_measures(): MeasureMapEntry[] {
//       return this.positionProto.measures;
//     }
//     get_fields(): FieldMapEntry[] {
//       return this.positionProto.fields;
//     }
//     toString(): string {
//       const out: string[] = [];
//       for (const field of this.get_fields()) {
//         out.push(FieldProto.Name(field.field));
//         out.push(',');
//         out.push(this.get_field_display(field.field));
//         out.push(';');
//       }
//       for (const measure of this.get_measures()) {
//         out.push(MeasureProto.Name(measure.measure));
//         out.push(',');
//         const tmp: Decimal = this.get_measure(measure.measure);
//         out.push(tmp.toString());
//         out.push(';');
//       }
//       return out.join('');
//     }
//     static wrap_string_to_any(my_string: string): Any {
//       const my_any = new Any();
//       my_any.pack(new wrappers.StringValue({ value: my_string }));
//       return my_any;
//     }
//     static pack_field(field_to_pack: any): Any {
//       if (field_to_pack instanceof LocalDateProto) {
//         const my_any = new Any();
//         my_any.pack(field_to_pack);
//         return my_any;
//       }
//       // Handle other cases as needed
//       return null;
//     }
//     static unpack_field(field_to_unpack: FieldMapEntry): any {
//       // Implement the unpack_field function to convert field_to_unpack to TypeScript equivalent.
//       // This involves handling various field types and unwrapping values.
//       throw new Error('Not implemented yet');
//     }
//     // Define the class for ProtoEnum, and implement unpack_measure similarly to unpack_field.
//   }
//   // The following imports should be included in the TypeScript code as needed:
//   // - FieldProto, MeasureProto, PositionProto, FieldMapEntry, MeasureMapEntry, PortfolioProto
//   // - SecurityProto, IdentifierProto, LocalDateProto, LocalTimestampProto, UUIDProto
//   // - ProtoSerializationUtil, ProtoEnum, wrappers_pb2, Any, Decimal, StringIO
//   // - Implement missing classes and functions as needed.
//# sourceMappingURL=position.js.map