"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const security_1 = __importDefault(require("./security"));
const security_pb_1 = require("../../../fintekkers/models/security/security_pb");
const product_type_pb_1 = require("../../../fintekkers/models/security/product_type_pb");
const identifier_pb_1 = require("../../../fintekkers/models/security/identifier/identifier_pb");
const identifier_type_pb_1 = require("../../../fintekkers/models/security/identifier/identifier_type_pb");
const uuid_1 = require("../utils/uuid");
const identifier_1 = require("./identifier");
function buildSecurityWithIds(ids) {
    const proto = new security_pb_1.SecurityProto()
        .setObjectClass('Security')
        .setVersion('0.0.1')
        .setUuid(uuid_1.UUID.random().toUUIDProto())
        .setProductType(product_type_pb_1.ProductTypeProto.COMMON_STOCK)
        .setAssetClass('Equity')
        .setIssuerName('Acme');
    for (const id of ids) {
        proto.addIdentifiers(new identifier_pb_1.IdentifierProto().setIdentifierType(id.type).setIdentifierValue(id.value));
    }
    return security_1.default.create(proto);
}
test('getIdentifiers returns wrapped Identifier list preserving order', () => {
    const sec = buildSecurityWithIds([
        { type: identifier_type_pb_1.IdentifierTypeProto.ISIN, value: 'US0378331005' },
        { type: identifier_type_pb_1.IdentifierTypeProto.CUSIP, value: '037833100' },
        { type: identifier_type_pb_1.IdentifierTypeProto.EXCH_TICKER, value: 'AAPL' },
    ]);
    const ids = sec.getIdentifiers();
    expect(ids).toHaveLength(3);
    expect(ids[0]).toBeInstanceOf(identifier_1.Identifier);
    expect(ids[0].getIdentifierValue()).toBe('US0378331005');
    expect(ids[0].getIdentifierType()).toBe(identifier_type_pb_1.IdentifierTypeProto.ISIN);
    expect(ids[2].getIdentifierValue()).toBe('AAPL');
});
test('getIdentifiers returns empty list when none set', () => {
    const sec = buildSecurityWithIds([]);
    expect(sec.getIdentifiers()).toEqual([]);
});
test('getIdentifierByType finds the matching identifier', () => {
    const sec = buildSecurityWithIds([
        { type: identifier_type_pb_1.IdentifierTypeProto.ISIN, value: 'US0378331005' },
        { type: identifier_type_pb_1.IdentifierTypeProto.CUSIP, value: '037833100' },
    ]);
    const cusip = sec.getIdentifierByType(identifier_type_pb_1.IdentifierTypeProto.CUSIP);
    expect(cusip).toBeDefined();
    expect(cusip.getIdentifierValue()).toBe('037833100');
});
test('getIdentifierByType returns undefined when type is absent', () => {
    const sec = buildSecurityWithIds([
        { type: identifier_type_pb_1.IdentifierTypeProto.ISIN, value: 'US0378331005' },
    ]);
    expect(sec.getIdentifierByType(identifier_type_pb_1.IdentifierTypeProto.FIGI)).toBeUndefined();
});
test('identifier accessors throw on a link-mode Security', () => {
    // linkOf builds a link-mode SecurityProto. Reading the identifier list
    // off a link is meaningless, so we explicitly reject it.
    const linkProto = new security_pb_1.SecurityProto().setIsLink(true);
    linkProto.setUuid(uuid_1.UUID.random().toUUIDProto());
    const link = security_1.default.create(linkProto);
    expect(() => link.getIdentifiers()).toThrow(/link-mode/);
    expect(() => link.getIdentifierByType(identifier_type_pb_1.IdentifierTypeProto.ISIN)).toThrow(/link-mode/);
});
//# sourceMappingURL=security.identifiers.test.js.map