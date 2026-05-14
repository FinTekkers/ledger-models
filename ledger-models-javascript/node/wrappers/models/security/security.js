"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const field_pb_1 = require("../../../fintekkers/models/position/field_pb");
const security_pb_1 = require("../../../fintekkers/models/security/security_pb");
const datetime_1 = require("../utils/datetime");
const uuid_1 = require("../utils/uuid");
const date_1 = require("../utils/date");
const product_type_pb_1 = require("../../../fintekkers/models/security/product_type_pb");
class Security {
    constructor(proto) {
        this.proto = proto;
    }
    /**
     * Build a SecurityProto link reference (is_link=true) with uuid and as_of
     * populated. Use this whenever you embed a Security inside another message
     * that itself carries an as_of (Position, Transaction, Price, etc.) — the
     * link MUST carry the same as_of as the parent so the resolver hydrates
     * the correct point-in-time vintage. See docs/adr/is_link_pattern.md.
     *
     * @param uuid The Security UUID to reference.
     * @param asOf The as-of timestamp; required. For "always latest" semantics
     *             use linkOfLatest(uuid) instead.
     */
    static linkOf(uuid, asOf) {
        if (!uuid)
            throw new Error("uuid is required for linkOf");
        if (!asOf)
            throw new Error("asOf is required for linkOf; use linkOfLatest(uuid) for latest-version semantics");
        const proto = new security_pb_1.SecurityProto();
        proto.setIsLink(true);
        proto.setUuid(Security._uuidToProto(uuid));
        proto.setAsOf(Security._zonedDateTimeToProto(asOf));
        return proto;
    }
    /**
     * Build a SecurityProto link reference (is_link=true) with only uuid set.
     * Resolution returns the latest version. Explicit escape hatch — most
     * callers should prefer linkOf(uuid, asOf).
     */
    static linkOfLatest(uuid) {
        if (!uuid)
            throw new Error("uuid is required for linkOfLatest");
        const proto = new security_pb_1.SecurityProto();
        proto.setIsLink(true);
        proto.setUuid(Security._uuidToProto(uuid));
        return proto;
    }
    static _uuidToProto(uuid) {
        return uuid.toUUIDProto();
    }
    static _zonedDateTimeToProto(asOf) {
        return asOf.toProto();
    }
    /**
     * Throws if this Security is in link mode. Use to guard accessors that
     * would otherwise return proto3 default values on a link reference.
     */
    assertNotLink(accessor) {
        if (this.proto.getIsLink()) {
            throw new Error(`Cannot read ${accessor} on a link-mode Security (is_link=true). `
                + `Resolve via SecurityService.GetByIds first. `
                + `See docs/adr/is_link_pattern.md.`);
        }
    }
    /**
     * Factory method to create the appropriate Security subclass based on security type
     */
    static create(proto) {
        switch (proto.getProductType()) {
            case product_type_pb_1.ProductTypeProto.TREASURY_NOTE:
            case product_type_pb_1.ProductTypeProto.TIPS:
            case product_type_pb_1.ProductTypeProto.TREASURY_FRN:
                // Lazy import to avoid circular dependency
                const BondSecurity = require('./BondSecurity').default;
                return new BondSecurity(proto);
            default:
                return new Security(proto);
        }
    }
    /**
     * Type guard: true iff this Security is a BondSecurity (BOND_SECURITY,
     * TIPS, or FRN). Use to narrow before calling bond-specific getters:
     *
     *   if (sec.isBond()) {
     *     // sec: BondSecurity here — TS knows about getCouponRate(), etc.
     *     console.log(sec.getMaturityDate());
     *   }
     *
     * Implemented as a runtime check on the proto's securityType so it
     * works regardless of how the wrapper was constructed.
     */
    isBond() {
        const t = this.proto.getProductType();
        return t === product_type_pb_1.ProductTypeProto.TREASURY_NOTE
            || t === product_type_pb_1.ProductTypeProto.TIPS
            || t === product_type_pb_1.ProductTypeProto.TREASURY_FRN;
    }
    toString() {
        return `ID[${this.getID().toString()}], ${this.getSecurityID()}[${this.getIssuerName()}]`;
    }
    getFields() {
        return [field_pb_1.FieldProto.ID, field_pb_1.FieldProto.SECURITY_ID, field_pb_1.FieldProto.AS_OF, field_pb_1.FieldProto.ASSET_CLASS, field_pb_1.FieldProto.IDENTIFIER];
    }
    getField(field) {
        switch (field) {
            case field_pb_1.FieldProto.ID:
            case field_pb_1.FieldProto.SECURITY_ID:
                return this.getID();
            case field_pb_1.FieldProto.AS_OF:
                return this.getAsOf();
            case field_pb_1.FieldProto.ASSET_CLASS:
                return this.getAssetClass();
            case field_pb_1.FieldProto.PRODUCT_CLASS:
                return this.getProductClass();
            case field_pb_1.FieldProto.PRODUCT_TYPE:
                return this.getProductType();
            case field_pb_1.FieldProto.IDENTIFIER:
                return this.getSecurityID();
            case field_pb_1.FieldProto.TENOR:
            case field_pb_1.FieldProto.ADJUSTED_TENOR:
                throw new Error('Not implemented yet');
            case field_pb_1.FieldProto.MATURITY_DATE:
                // Maturity date is bond-only. Mirror Java's Security.getField:
                // delegate to BondSecurity, return null for non-bonds.
                return this.isBond() ? this.getMaturityDate() : null;
            case field_pb_1.FieldProto.ISSUE_DATE:
                // getIssueDate already returns null on non-bonds; just forward.
                return this.getIssueDate();
            default:
                throw new Error(`Field not mapped in Security wrapper: ${field}`);
        }
    }
    getID() {
        const uuid = this.proto.getUuid();
        if (!uuid)
            throw new Error("UUID is required");
        return uuid_1.UUID.fromU8Array(uuid.getRawUuid_asU8());
    }
    /**
     * True iff this Security is a link reference (only the uuid is populated;
     * other fields should not be relied on). See docs/adr/is_link_pattern.md.
     * Pair with LinkResolver to hydrate to a full entity.
     */
    isLink() {
        return this.proto.getIsLink();
    }
    getAsOf() {
        const asOf = this.proto.getAsOf();
        if (!asOf)
            throw new Error("AsOf is required");
        return new datetime_1.ZonedDateTime(asOf);
    }
    getAssetClass() {
        this.assertNotLink('assetClass');
        return this.proto.getAssetClass();
    }
    getProductClass() {
        this.assertNotLink('productClass');
        throw new Error('Not implemented yet. See Java implementation for reference');
    }
    getProductType() {
        this.assertNotLink('productType');
        const securityType = this.proto.getProductType();
        const securityTypeString = Object.keys(product_type_pb_1.ProductTypeProto).find(key => product_type_pb_1.ProductTypeProto[key] === securityType);
        return securityTypeString || 'UNKNOWN_SECURITY_TYPE';
    }
    getSecurityID() {
        this.assertNotLink('securityId');
        const identifier = this.proto.getIdentifier();
        if (!identifier)
            throw new Error("Identifier is required");
        return identifier;
    }
    /**
     * Returns the issue date if set, else null. Per-type semantic:
     *   - Bond / TIPS / FRN: auction date.
     *   - Equity: IPO listing date (when present in source data).
     *   - CPI series: first observation date.
     *   - Cash / FX: typically null.
     *
     * Returns null on equities/cash/etc. that don't have an issue date set,
     * rather than throwing — issue date is optional on the base Security.
     * For bond-specific code paths, prefer narrowing first via isBond() and
     * calling BondSecurity.getIssueDate() (which returns LocalDate, not null).
     */
    getIssueDate() {
        this.assertNotLink('issueDate');
        // Prefer oneof bond sub-message if available, fall back to flat fields
        const bond = this.getBondLikeDetails();
        const date = bond ? bond.getIssueDate() : this.proto.getIssueDate();
        if (!date)
            return null;
        return new date_1.LocalDate(date);
    }
    /**
     * @deprecated Maturity date is a bond-only concept. On the base Security
     * this still throws when unset for backwards compatibility. Prefer
     * narrowing first:
     *
     *   if (sec.isBond()) sec.getMaturityDate();   // BondSecurity, returns LocalDate
     *
     * In a future major version this method will move to BondSecurity only
     * and TS will catch the misuse at compile time.
     */
    getMaturityDate() {
        this.assertNotLink('maturityDate');
        // Prefer oneof bond sub-message if available, fall back to flat fields
        const bond = this.getBondLikeDetails();
        const date = bond ? bond.getMaturityDate() : this.proto.getMaturityDate();
        if (!date)
            throw new Error("Maturity date is required");
        return new date_1.LocalDate(date);
    }
    /**
     * Returns the canonical bond_details sub-message if set, else undefined.
     * v0.3.0 collapsed the prior 3-arm bond/tips/frn oneof into a single
     * top-level bond_details — TIPS and FRN extras now live in their own
     * tips_extension / frn_extension fields.
     */
    getBondLikeDetails() {
        var _a;
        if (typeof this.proto.getBondDetails !== 'function')
            return undefined;
        return (_a = this.proto.getBondDetails()) !== null && _a !== void 0 ? _a : undefined;
    }
    getIssuerName() {
        this.assertNotLink('issuerName');
        return this.proto.getIssuerName();
    }
    equals(other) {
        if (other instanceof Security) {
            return this.getID().equals(other.getID());
        }
        else {
            return false;
        }
    }
}
exports.default = Security;
//# sourceMappingURL=security.js.map