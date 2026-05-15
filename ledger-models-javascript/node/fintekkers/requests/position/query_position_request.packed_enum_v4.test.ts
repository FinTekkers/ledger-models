// Regression guard for the v4-runtime decode path on packed-enum fields.
//
// google-protobuf v4 removed `BinaryReader.prototype.readPackedEnum`. The
// bundled protoc 3.19.1 generator emits decode code that calls it on every
// `repeated <enum>` field. compile.sh substitutes the call with the v4
// `readPackableEnumInto(arr)` equivalent. This test exercises that path
// end-to-end so a regen-without-patch (or a sed-rule drift) trips CI before
// shipping.
//
// Repro: positions UI hit "reader.readPackedEnum is not a function" on every
// `/data/positions` request because the QueryPositionRequestProto encode/decode
// round-trip needed the packed-enum decoder. (second-brain#292)

import { BinaryReader } from "google-protobuf";
import { QueryPositionRequestProto } from "../../../fintekkers/requests/position/query_position_request_pb";
import { FieldProto } from "../../../fintekkers/models/position/field_pb";
import { MeasureProto } from "../../../fintekkers/models/position/measure_pb";

describe("packed-enum decode under google-protobuf v4 (second-brain#292)", () => {
    test("v4 BinaryReader does NOT expose readPackedEnum (sentinel for the bug)", () => {
        // If a future google-protobuf release re-adds readPackedEnum, this
        // assertion flips and the regen can drop the post-process patch.
        expect(typeof (BinaryReader.prototype as any).readPackedEnum).toBe("undefined");
    });

    test("v4 BinaryReader exposes readPackableEnumInto (the replacement target)", () => {
        expect(typeof (BinaryReader.prototype as any).readPackableEnumInto).toBe("function");
    });

    test("QueryPositionRequestProto round-trips packed repeated FieldProto + MeasureProto", () => {
        const req = new QueryPositionRequestProto();
        req.setFieldsList([
            FieldProto.SECURITY,
            FieldProto.PORTFOLIO,
            FieldProto.AS_OF,
        ]);
        req.setMeasuresList([
            MeasureProto.MARKET_VALUE,
            MeasureProto.DIRECTED_QUANTITY,
        ]);

        // Encode → bytes → decode. Without the v4-compat substitution this
        // throws `reader.readPackedEnum is not a function`.
        const bytes = req.serializeBinary();
        const decoded = QueryPositionRequestProto.deserializeBinary(bytes);

        expect(decoded.getFieldsList()).toEqual([
            FieldProto.SECURITY,
            FieldProto.PORTFOLIO,
            FieldProto.AS_OF,
        ]);
        expect(decoded.getMeasuresList()).toEqual([
            MeasureProto.MARKET_VALUE,
            MeasureProto.DIRECTED_QUANTITY,
        ]);
    });

    test("empty repeated enum lists round-trip cleanly", () => {
        const req = new QueryPositionRequestProto();
        const bytes = req.serializeBinary();
        const decoded = QueryPositionRequestProto.deserializeBinary(bytes);
        expect(decoded.getFieldsList()).toEqual([]);
        expect(decoded.getMeasuresList()).toEqual([]);
    });
});
