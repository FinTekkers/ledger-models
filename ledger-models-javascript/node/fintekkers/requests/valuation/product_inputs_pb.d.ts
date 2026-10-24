// package: fintekkers.requests.valuation
// file: fintekkers/requests/valuation/product_inputs.proto

/* tslint:disable */
/* eslint-disable */

import * as jspb from "google-protobuf";
import * as fintekkers_models_portfolio_amortisation_elections_pb from "../../../fintekkers/models/portfolio/amortisation_elections_pb";
import * as fintekkers_models_position_tax_lot_pb from "../../../fintekkers/models/position/tax_lot_pb";
import * as fintekkers_models_security_security_pb from "../../../fintekkers/models/security/security_pb";
import * as fintekkers_models_security_index_index_type_pb from "../../../fintekkers/models/security/index/index_type_pb";
import * as fintekkers_models_util_decimal_value_pb from "../../../fintekkers/models/util/decimal_value_pb";
import * as fintekkers_models_util_local_date_pb from "../../../fintekkers/models/util/local_date_pb";

export class ProductInput extends jspb.Message { 

    hasBond(): boolean;
    clearBond(): void;
    getBond(): BondInput | undefined;
    setBond(value?: BondInput): ProductInput;

    hasTips(): boolean;
    clearTips(): void;
    getTips(): TipsInput | undefined;
    setTips(value?: TipsInput): ProductInput;

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
        bond?: BondInput.AsObject,
        tips?: TipsInput.AsObject,
        frn?: FrnInput.AsObject,
    }

    export enum InputCase {
        INPUT_NOT_SET = 0,
        BOND = 1,
        TIPS = 2,
        FRN = 8,
    }

}

export class BondInput extends jspb.Message { 

    hasSecurity(): boolean;
    clearSecurity(): void;
    getSecurity(): fintekkers_models_security_security_pb.SecurityProto | undefined;
    setSecurity(value?: fintekkers_models_security_security_pb.SecurityProto): BondInput;

    hasCleanPrice(): boolean;
    clearCleanPrice(): void;
    getCleanPrice(): fintekkers_models_util_decimal_value_pb.DecimalValueProto | undefined;
    setCleanPrice(value?: fintekkers_models_util_decimal_value_pb.DecimalValueProto): BondInput;

    hasBenchmarkCurve(): boolean;
    clearBenchmarkCurve(): void;
    getBenchmarkCurve(): SecurityBasedCurveInput | undefined;
    setBenchmarkCurve(value?: SecurityBasedCurveInput): BondInput;

    hasCostBasis(): boolean;
    clearCostBasis(): void;
    getCostBasis(): CostBasisInput | undefined;
    setCostBasis(value?: CostBasisInput): BondInput;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): BondInput.AsObject;
    static toObject(includeInstance: boolean, msg: BondInput): BondInput.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: BondInput, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): BondInput;
    static deserializeBinaryFromReader(message: BondInput, reader: jspb.BinaryReader): BondInput;
}

export namespace BondInput {
    export type AsObject = {
        security?: fintekkers_models_security_security_pb.SecurityProto.AsObject,
        cleanPrice?: fintekkers_models_util_decimal_value_pb.DecimalValueProto.AsObject,
        benchmarkCurve?: SecurityBasedCurveInput.AsObject,
        costBasis?: CostBasisInput.AsObject,
    }
}

export class TipsInput extends jspb.Message { 

    hasSecurity(): boolean;
    clearSecurity(): void;
    getSecurity(): fintekkers_models_security_security_pb.SecurityProto | undefined;
    setSecurity(value?: fintekkers_models_security_security_pb.SecurityProto): TipsInput;

    hasCleanPrice(): boolean;
    clearCleanPrice(): void;
    getCleanPrice(): fintekkers_models_util_decimal_value_pb.DecimalValueProto | undefined;
    setCleanPrice(value?: fintekkers_models_util_decimal_value_pb.DecimalValueProto): TipsInput;

    hasCpi(): boolean;
    clearCpi(): void;
    getCpi(): InflationIndexInput | undefined;
    setCpi(value?: InflationIndexInput): TipsInput;

    hasCostBasis(): boolean;
    clearCostBasis(): void;
    getCostBasis(): CostBasisInput | undefined;
    setCostBasis(value?: CostBasisInput): TipsInput;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): TipsInput.AsObject;
    static toObject(includeInstance: boolean, msg: TipsInput): TipsInput.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: TipsInput, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): TipsInput;
    static deserializeBinaryFromReader(message: TipsInput, reader: jspb.BinaryReader): TipsInput;
}

export namespace TipsInput {
    export type AsObject = {
        security?: fintekkers_models_security_security_pb.SecurityProto.AsObject,
        cleanPrice?: fintekkers_models_util_decimal_value_pb.DecimalValueProto.AsObject,
        cpi?: InflationIndexInput.AsObject,
        costBasis?: CostBasisInput.AsObject,
    }
}

export class CostBasisInput extends jspb.Message { 

    hasElections(): boolean;
    clearElections(): void;
    getElections(): fintekkers_models_portfolio_amortisation_elections_pb.AmortisationElectionsProto | undefined;
    setElections(value?: fintekkers_models_portfolio_amortisation_elections_pb.AmortisationElectionsProto): CostBasisInput;
    clearLotsList(): void;
    getLotsList(): Array<fintekkers_models_position_tax_lot_pb.TaxLotProto>;
    setLotsList(value: Array<fintekkers_models_position_tax_lot_pb.TaxLotProto>): CostBasisInput;
    addLots(value?: fintekkers_models_position_tax_lot_pb.TaxLotProto, index?: number): fintekkers_models_position_tax_lot_pb.TaxLotProto;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): CostBasisInput.AsObject;
    static toObject(includeInstance: boolean, msg: CostBasisInput): CostBasisInput.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: CostBasisInput, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): CostBasisInput;
    static deserializeBinaryFromReader(message: CostBasisInput, reader: jspb.BinaryReader): CostBasisInput;
}

export namespace CostBasisInput {
    export type AsObject = {
        elections?: fintekkers_models_portfolio_amortisation_elections_pb.AmortisationElectionsProto.AsObject,
        lotsList: Array<fintekkers_models_position_tax_lot_pb.TaxLotProto.AsObject>,
    }
}

export class InflationIndexInput extends jspb.Message { 

    hasIndex(): boolean;
    clearIndex(): void;
    getIndex(): fintekkers_models_security_security_pb.SecurityProto | undefined;
    setIndex(value?: fintekkers_models_security_security_pb.SecurityProto): InflationIndexInput;

    hasReadings(): boolean;
    clearReadings(): void;
    getReadings(): MonthlyIndexReadings | undefined;
    setReadings(value?: MonthlyIndexReadings): InflationIndexInput;

    hasReferenceCpi(): boolean;
    clearReferenceCpi(): void;
    getReferenceCpi(): fintekkers_models_util_decimal_value_pb.DecimalValueProto | undefined;
    setReferenceCpi(value?: fintekkers_models_util_decimal_value_pb.DecimalValueProto): InflationIndexInput;

    getCpiCase(): InflationIndexInput.CpiCase;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): InflationIndexInput.AsObject;
    static toObject(includeInstance: boolean, msg: InflationIndexInput): InflationIndexInput.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: InflationIndexInput, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): InflationIndexInput;
    static deserializeBinaryFromReader(message: InflationIndexInput, reader: jspb.BinaryReader): InflationIndexInput;
}

export namespace InflationIndexInput {
    export type AsObject = {
        index?: fintekkers_models_security_security_pb.SecurityProto.AsObject,
        readings?: MonthlyIndexReadings.AsObject,
        referenceCpi?: fintekkers_models_util_decimal_value_pb.DecimalValueProto.AsObject,
    }

    export enum CpiCase {
        CPI_NOT_SET = 0,
        READINGS = 2,
        REFERENCE_CPI = 3,
    }

}

export class MonthlyIndexReadings extends jspb.Message { 
    clearReadingsList(): void;
    getReadingsList(): Array<MonthlyIndexReading>;
    setReadingsList(value: Array<MonthlyIndexReading>): MonthlyIndexReadings;
    addReadings(value?: MonthlyIndexReading, index?: number): MonthlyIndexReading;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): MonthlyIndexReadings.AsObject;
    static toObject(includeInstance: boolean, msg: MonthlyIndexReadings): MonthlyIndexReadings.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: MonthlyIndexReadings, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): MonthlyIndexReadings;
    static deserializeBinaryFromReader(message: MonthlyIndexReadings, reader: jspb.BinaryReader): MonthlyIndexReadings;
}

export namespace MonthlyIndexReadings {
    export type AsObject = {
        readingsList: Array<MonthlyIndexReading.AsObject>,
    }
}

export class MonthlyIndexReading extends jspb.Message { 
    getYear(): number;
    setYear(value: number): MonthlyIndexReading;
    getMonth(): number;
    setMonth(value: number): MonthlyIndexReading;

    hasValue(): boolean;
    clearValue(): void;
    getValue(): fintekkers_models_util_decimal_value_pb.DecimalValueProto | undefined;
    setValue(value?: fintekkers_models_util_decimal_value_pb.DecimalValueProto): MonthlyIndexReading;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): MonthlyIndexReading.AsObject;
    static toObject(includeInstance: boolean, msg: MonthlyIndexReading): MonthlyIndexReading.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: MonthlyIndexReading, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): MonthlyIndexReading;
    static deserializeBinaryFromReader(message: MonthlyIndexReading, reader: jspb.BinaryReader): MonthlyIndexReading;
}

export namespace MonthlyIndexReading {
    export type AsObject = {
        year: number,
        month: number,
        value?: fintekkers_models_util_decimal_value_pb.DecimalValueProto.AsObject,
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
    clearFixingsList(): void;
    getFixingsList(): Array<ReferenceRateFixingProto>;
    setFixingsList(value: Array<ReferenceRateFixingProto>): FrnInput;
    addFixings(value?: ReferenceRateFixingProto, index?: number): ReferenceRateFixingProto;

    hasCostBasis(): boolean;
    clearCostBasis(): void;
    getCostBasis(): CostBasisInput | undefined;
    setCostBasis(value?: CostBasisInput): FrnInput;

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
        fixingsList: Array<ReferenceRateFixingProto.AsObject>,
        costBasis?: CostBasisInput.AsObject,
    }
}

export class ReferenceRateFixingProto extends jspb.Message { 
    getIndex(): fintekkers_models_security_index_index_type_pb.IndexTypeProto;
    setIndex(value: fintekkers_models_security_index_index_type_pb.IndexTypeProto): ReferenceRateFixingProto;

    hasFixingDate(): boolean;
    clearFixingDate(): void;
    getFixingDate(): fintekkers_models_util_local_date_pb.LocalDateProto | undefined;
    setFixingDate(value?: fintekkers_models_util_local_date_pb.LocalDateProto): ReferenceRateFixingProto;

    hasRate(): boolean;
    clearRate(): void;
    getRate(): fintekkers_models_util_decimal_value_pb.DecimalValueProto | undefined;
    setRate(value?: fintekkers_models_util_decimal_value_pb.DecimalValueProto): ReferenceRateFixingProto;

    hasBillMaturityDate(): boolean;
    clearBillMaturityDate(): void;
    getBillMaturityDate(): fintekkers_models_util_local_date_pb.LocalDateProto | undefined;
    setBillMaturityDate(value?: fintekkers_models_util_local_date_pb.LocalDateProto): ReferenceRateFixingProto;

    hasBillIssueDate(): boolean;
    clearBillIssueDate(): void;
    getBillIssueDate(): fintekkers_models_util_local_date_pb.LocalDateProto | undefined;
    setBillIssueDate(value?: fintekkers_models_util_local_date_pb.LocalDateProto): ReferenceRateFixingProto;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ReferenceRateFixingProto.AsObject;
    static toObject(includeInstance: boolean, msg: ReferenceRateFixingProto): ReferenceRateFixingProto.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ReferenceRateFixingProto, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ReferenceRateFixingProto;
    static deserializeBinaryFromReader(message: ReferenceRateFixingProto, reader: jspb.BinaryReader): ReferenceRateFixingProto;
}

export namespace ReferenceRateFixingProto {
    export type AsObject = {
        index: fintekkers_models_security_index_index_type_pb.IndexTypeProto,
        fixingDate?: fintekkers_models_util_local_date_pb.LocalDateProto.AsObject,
        rate?: fintekkers_models_util_decimal_value_pb.DecimalValueProto.AsObject,
        billMaturityDate?: fintekkers_models_util_local_date_pb.LocalDateProto.AsObject,
        billIssueDate?: fintekkers_models_util_local_date_pb.LocalDateProto.AsObject,
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

export class SecurityBasedCurveInput extends jspb.Message { 
    getIndex(): fintekkers_models_security_index_index_type_pb.IndexTypeProto;
    setIndex(value: fintekkers_models_security_index_index_type_pb.IndexTypeProto): SecurityBasedCurveInput;

    hasReferenceDate(): boolean;
    clearReferenceDate(): void;
    getReferenceDate(): fintekkers_models_util_local_date_pb.LocalDateProto | undefined;
    setReferenceDate(value?: fintekkers_models_util_local_date_pb.LocalDateProto): SecurityBasedCurveInput;
    clearPointsList(): void;
    getPointsList(): Array<SecurityCurvePoint>;
    setPointsList(value: Array<SecurityCurvePoint>): SecurityBasedCurveInput;
    addPoints(value?: SecurityCurvePoint, index?: number): SecurityCurvePoint;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): SecurityBasedCurveInput.AsObject;
    static toObject(includeInstance: boolean, msg: SecurityBasedCurveInput): SecurityBasedCurveInput.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: SecurityBasedCurveInput, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): SecurityBasedCurveInput;
    static deserializeBinaryFromReader(message: SecurityBasedCurveInput, reader: jspb.BinaryReader): SecurityBasedCurveInput;
}

export namespace SecurityBasedCurveInput {
    export type AsObject = {
        index: fintekkers_models_security_index_index_type_pb.IndexTypeProto,
        referenceDate?: fintekkers_models_util_local_date_pb.LocalDateProto.AsObject,
        pointsList: Array<SecurityCurvePoint.AsObject>,
    }
}

export class SecurityCurvePoint extends jspb.Message { 

    hasSecurity(): boolean;
    clearSecurity(): void;
    getSecurity(): fintekkers_models_security_security_pb.SecurityProto | undefined;
    setSecurity(value?: fintekkers_models_security_security_pb.SecurityProto): SecurityCurvePoint;

    hasCleanPrice(): boolean;
    clearCleanPrice(): void;
    getCleanPrice(): fintekkers_models_util_decimal_value_pb.DecimalValueProto | undefined;
    setCleanPrice(value?: fintekkers_models_util_decimal_value_pb.DecimalValueProto): SecurityCurvePoint;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): SecurityCurvePoint.AsObject;
    static toObject(includeInstance: boolean, msg: SecurityCurvePoint): SecurityCurvePoint.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: SecurityCurvePoint, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): SecurityCurvePoint;
    static deserializeBinaryFromReader(message: SecurityCurvePoint, reader: jspb.BinaryReader): SecurityCurvePoint;
}

export namespace SecurityCurvePoint {
    export type AsObject = {
        security?: fintekkers_models_security_security_pb.SecurityProto.AsObject,
        cleanPrice?: fintekkers_models_util_decimal_value_pb.DecimalValueProto.AsObject,
    }
}
