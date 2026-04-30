// package: fintekkers.requests.valuation
// file: fintekkers/requests/valuation/product_inputs.proto

/* tslint:disable */
/* eslint-disable */

import * as jspb from "google-protobuf";
import * as fintekkers_models_security_security_pb from "../../../fintekkers/models/security/security_pb";
import * as fintekkers_models_security_index_index_type_pb from "../../../fintekkers/models/security/index/index_type_pb";
import * as fintekkers_models_util_decimal_value_pb from "../../../fintekkers/models/util/decimal_value_pb";
import * as fintekkers_models_util_local_date_pb from "../../../fintekkers/models/util/local_date_pb";

export class ProductInput extends jspb.Message { 

    hasFrn(): boolean;
    clearFrn(): void;
    getFrn(): FrnInput | undefined;
    setFrn(value?: FrnInput): ProductInput;

    getInputCase(): ProductInput.InputCase;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ProductInput.AsObject;
    static toObject(includeInstance: boolean, msg: ProductInput): ProductInput.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ProductInput, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ProductInput;
    static deserializeBinaryFromReader(message: ProductInput, reader: jspb.BinaryReader): ProductInput;
}

export namespace ProductInput {
    export type AsObject = {
        frn?: FrnInput.AsObject,
    }

    export enum InputCase {
        INPUT_NOT_SET = 0,
        FRN = 8,
    }

}

export class FrnInput extends jspb.Message { 

    hasSecurity(): boolean;
    clearSecurity(): void;
    getSecurity(): fintekkers_models_security_security_pb.SecurityProto | undefined;
    setSecurity(value?: fintekkers_models_security_security_pb.SecurityProto): FrnInput;

    hasCleanPrice(): boolean;
    clearCleanPrice(): void;
    getCleanPrice(): fintekkers_models_util_decimal_value_pb.DecimalValueProto | undefined;
    setCleanPrice(value?: fintekkers_models_util_decimal_value_pb.DecimalValueProto): FrnInput;

    hasCurve(): boolean;
    clearCurve(): void;
    getCurve(): YieldCurveInput | undefined;
    setCurve(value?: YieldCurveInput): FrnInput;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): FrnInput.AsObject;
    static toObject(includeInstance: boolean, msg: FrnInput): FrnInput.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: FrnInput, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): FrnInput;
    static deserializeBinaryFromReader(message: FrnInput, reader: jspb.BinaryReader): FrnInput;
}

export namespace FrnInput {
    export type AsObject = {
        security?: fintekkers_models_security_security_pb.SecurityProto.AsObject,
        cleanPrice?: fintekkers_models_util_decimal_value_pb.DecimalValueProto.AsObject,
        curve?: YieldCurveInput.AsObject,
    }
}

export class YieldCurveInput extends jspb.Message { 
    getIndex(): fintekkers_models_security_index_index_type_pb.IndexTypeProto;
    setIndex(value: fintekkers_models_security_index_index_type_pb.IndexTypeProto): YieldCurveInput;

    hasReferenceDate(): boolean;
    clearReferenceDate(): void;
    getReferenceDate(): fintekkers_models_util_local_date_pb.LocalDateProto | undefined;
    setReferenceDate(value?: fintekkers_models_util_local_date_pb.LocalDateProto): YieldCurveInput;
    clearPointsList(): void;
    getPointsList(): Array<CurvePoint>;
    setPointsList(value: Array<CurvePoint>): YieldCurveInput;
    addPoints(value?: CurvePoint, index?: number): CurvePoint;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): YieldCurveInput.AsObject;
    static toObject(includeInstance: boolean, msg: YieldCurveInput): YieldCurveInput.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: YieldCurveInput, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): YieldCurveInput;
    static deserializeBinaryFromReader(message: YieldCurveInput, reader: jspb.BinaryReader): YieldCurveInput;
}

export namespace YieldCurveInput {
    export type AsObject = {
        index: fintekkers_models_security_index_index_type_pb.IndexTypeProto,
        referenceDate?: fintekkers_models_util_local_date_pb.LocalDateProto.AsObject,
        pointsList: Array<CurvePoint.AsObject>,
    }
}

export class CurvePoint extends jspb.Message { 

    hasTenor(): boolean;
    clearTenor(): void;
    getTenor(): fintekkers_models_util_decimal_value_pb.DecimalValueProto | undefined;
    setTenor(value?: fintekkers_models_util_decimal_value_pb.DecimalValueProto): CurvePoint;

    hasRate(): boolean;
    clearRate(): void;
    getRate(): fintekkers_models_util_decimal_value_pb.DecimalValueProto | undefined;
    setRate(value?: fintekkers_models_util_decimal_value_pb.DecimalValueProto): CurvePoint;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): CurvePoint.AsObject;
    static toObject(includeInstance: boolean, msg: CurvePoint): CurvePoint.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: CurvePoint, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): CurvePoint;
    static deserializeBinaryFromReader(message: CurvePoint, reader: jspb.BinaryReader): CurvePoint;
}

export namespace CurvePoint {
    export type AsObject = {
        tenor?: fintekkers_models_util_decimal_value_pb.DecimalValueProto.AsObject,
        rate?: fintekkers_models_util_decimal_value_pb.DecimalValueProto.AsObject,
    }
}
