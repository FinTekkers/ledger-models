"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const security_1 = __importDefault(require("./security"));
const IndexSecurity_1 = __importDefault(require("./IndexSecurity"));
const security_pb_1 = require("../../../fintekkers/models/security/security_pb");
const product_type_pb_1 = require("../../../fintekkers/models/security/product_type_pb");
const index_type_pb_1 = require("../../../fintekkers/models/security/index/index_type_pb");
const uuid_1 = require("../utils/uuid");
test('Security.create routes CPI_SERIES to IndexSecurity', () => {
    const proto = new security_pb_1.SecurityProto()
        .setObjectClass('Security')
        .setVersion('0.0.1')
        .setUuid(uuid_1.UUID.random().toUUIDProto())
        .setProductType(product_type_pb_1.ProductTypeProto.CPI_SERIES)
        .setAssetClass('Index');
    proto.setIndexDetails(new security_pb_1.IndexDetailsProto().setIndexType(index_type_pb_1.IndexTypeProto.CPI_U));
    const sec = security_1.default.create(proto);
    expect(sec).toBeInstanceOf(IndexSecurity_1.default);
    expect(sec.getIndexType()).toBe(index_type_pb_1.IndexTypeProto.CPI_U);
});
test('Security.create routes SOFR_SERIES to IndexSecurity', () => {
    const proto = new security_pb_1.SecurityProto()
        .setObjectClass('Security')
        .setVersion('0.0.1')
        .setUuid(uuid_1.UUID.random().toUUIDProto())
        .setProductType(product_type_pb_1.ProductTypeProto.SOFR_SERIES)
        .setAssetClass('Index');
    proto.setIndexDetails(new security_pb_1.IndexDetailsProto().setIndexType(index_type_pb_1.IndexTypeProto.SOFR));
    const sec = security_1.default.create(proto);
    expect(sec).toBeInstanceOf(IndexSecurity_1.default);
    expect(sec.getIndexType()).toBe(index_type_pb_1.IndexTypeProto.SOFR);
});
test('IndexSecurity.getIndexType returns UNKNOWN when index_details is unset', () => {
    // Force-construct without populating index_details so we exercise the
    // null-safe branch in the getter.
    const proto = new security_pb_1.SecurityProto()
        .setObjectClass('Security')
        .setVersion('0.0.1')
        .setUuid(uuid_1.UUID.random().toUUIDProto())
        .setProductType(product_type_pb_1.ProductTypeProto.CPI_SERIES)
        .setAssetClass('Index');
    const sec = security_1.default.create(proto);
    expect(sec.getIndexType()).toBe(index_type_pb_1.IndexTypeProto.UNKNOWN_INDEX_TYPE);
});
test('IndexSecurity extends Security (not BondSecurity)', () => {
    const proto = new security_pb_1.SecurityProto()
        .setObjectClass('Security')
        .setVersion('0.0.1')
        .setUuid(uuid_1.UUID.random().toUUIDProto())
        .setProductType(product_type_pb_1.ProductTypeProto.EQUITY_INDEX);
    proto.setIndexDetails(new security_pb_1.IndexDetailsProto().setIndexType(index_type_pb_1.IndexTypeProto.US_TREASURY));
    const sec = security_1.default.create(proto);
    expect(sec).toBeInstanceOf(IndexSecurity_1.default);
    expect(sec).toBeInstanceOf(security_1.default);
    expect(sec.isBond()).toBe(false);
});
//# sourceMappingURL=IndexSecurity.test.js.map