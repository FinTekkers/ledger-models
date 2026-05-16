"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const field_pb_1 = require("../../../fintekkers/models/position/field_pb");
const security_pb_1 = require("../../../fintekkers/models/security/security_pb");
const datetime_1 = require("../utils/datetime");
const uuid_1 = require("../utils/uuid");
const date_1 = require("../utils/date");
const product_type_pb_1 = require("../../../fintekkers/models/security/product_type_pb");
const identifier_1 = require("./identifier");
const product_hierarchy_1 = require("./product_hierarchy");
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
     * Factory method to create the appropriate Security subclass based on
     * the proto's product_type. Dispatch rules:
     *   - TIPS                       -> TIPSBond
     *   - TREASURY_FRN               -> FloatingRateNote
     *   - MORTGAGE_BACKED            -> MortgageBackedSecurity
     *   - any other descendant of BOND in hierarchy.json -> BondSecurity
     *   - any descendant of INDEX in hierarchy.json     -> IndexSecurity
     *   - everything else (equity, cash, fx, etc.)       -> base Security
     */
    static create(proto) {
        const productType = proto.getProductType();
        const ptName = Object.keys(product_type_pb_1.ProductTypeProto)
            .find(k => product_type_pb_1.ProductTypeProto[k] === productType);
        // TIPS / FRN / MBS have dedicated wrappers with extension-specific accessors.
        if (productType === product_type_pb_1.ProductTypeProto.TIPS) {
            const TIPSBond = require('./TIPSBond').default;
            return new TIPSBond(proto);
        }
        if (productType === product_type_pb_1.ProductTypeProto.TREASURY_FRN) {
            const FloatingRateNote = require('./FloatingRateNote').default;
            return new FloatingRateNote(proto);
        }
        if (productType === product_type_pb_1.ProductTypeProto.MORTGAGE_BACKED) {
            const MortgageBackedSecurity = require('./MortgageBackedSecurity').default;
            return new MortgageBackedSecurity(proto);
        }
        // Any other BOND descendant -> generic BondSecurity wrapper.
        if (ptName && (0, product_hierarchy_1.isDescendantOf)(ptName, 'BOND')) {
            const BondSecurity = require('./BondSecurity').default;
            return new BondSecurity(proto);
        }
        // INDEX descendants get the IndexSecurity wrapper.
        if (ptName && (0, product_hierarchy_1.isDescendantOf)(ptName, 'INDEX')) {
            const IndexSecurity = require('./IndexSecurity').default;
            return new IndexSecurity(proto);
        }
        return new Security(proto);
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
        const ptName = Object.keys(product_type_pb_1.ProductTypeProto)
            .find(k => product_type_pb_1.ProductTypeProto[k] === t);
        if (!ptName)
            return false;
        return (0, product_hierarchy_1.isDescendantOf)(ptName, 'BOND');
    }
    /**
     * Type guard: true iff this Security is a MortgageBackedSecurity (a
     * descendant of STRUCTURED_BOND in hierarchy.json — MBS_PASSTHROUGH today,
     * CMBS/ABS/CLO when those leaves become active).
     */
    isMbs() {
        return this.proto.getProductType() === product_type_pb_1.ProductTypeProto.MORTGAGE_BACKED;
    }
    /**
     * Type guard: true iff this Security is an IndexSecurity (any descendant
     * of INDEX in hierarchy.json — CPI_SERIES, SOFR_SERIES, EQUITY_INDEX, ...).
     */
    isIndex() {
        const t = this.proto.getProductType();
        const ptName = Object.keys(product_type_pb_1.ProductTypeProto)
            .find(k => product_type_pb_1.ProductTypeProto[k] === t);
        if (!ptName)
            return false;
        return (0, product_hierarchy_1.isDescendantOf)(ptName, 'INDEX');
    }
    /**
     * Runtime predicate: true iff this Security wraps a cash currency
     * (product_type == CURRENCY). No dedicated CashSecurity wrapper exists
     * yet so this isn't a TS type-guard — the return is base Security.
     */
    isCash() {
        return this.proto.getProductType() === product_type_pb_1.ProductTypeProto.CURRENCY;
    }
    /**
     * Runtime predicate: true iff this Security wraps a stock-shape product
     * type (any descendant of STOCK in hierarchy.json — COMMON_STOCK,
     * PREFERRED_STOCK, ADR, ETF). No dedicated EquitySecurity wrapper exists
     * yet so this isn't a TS type-guard — the return is base Security.
     */
    isEquity() {
        const t = this.proto.getProductType();
        const ptName = Object.keys(product_type_pb_1.ProductTypeProto)
            .find(k => product_type_pb_1.ProductTypeProto[k] === t);
        if (!ptName)
            return false;
        return (0, product_hierarchy_1.isDescendantOf)(ptName, 'STOCK');
    }
    /**
     * Runtime predicate: true iff this Security wraps an FX spot
     * (product_type == FX_SPOT). No dedicated FxSpotSecurity wrapper exists
     * yet so this isn't a TS type-guard — the return is base Security.
     */
    isFxSpot() {
        return this.proto.getProductType() === product_type_pb_1.ProductTypeProto.FX_SPOT;
    }
    toString() {
        const ids = this.proto.getIsLink() ? [] : this.proto.getIdentifiersList();
        const idStr = ids && ids.length > 0
            ? new identifier_1.Identifier(ids[0]).toString()
            : '<no-identifier>';
        const issuer = this.proto.getIsLink() ? '<link>' : this.getIssuerName();
        return `ID[${this.getID().toString()}], ${idStr}[${issuer}]`;
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
            case field_pb_1.FieldProto.IDENTIFIER: {
                const list = this.proto.getIdentifiersList();
                return list && list.length > 0 ? new identifier_1.Identifier(list[0]) : null;
            }
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
    /**
     * Returns every Identifier attached to this security as typed wrappers.
     * Empty list if none are set. Throws on a link-mode Security.
     */
    getIdentifiers() {
        this.assertNotLink('identifiers');
        const list = this.proto.getIdentifiersList();
        if (!list)
            return [];
        return list.map(p => new identifier_1.Identifier(p));
    }
    /**
     * Returns the first Identifier matching the given IdentifierTypeProto,
     * or undefined if none is present. Throws on a link-mode Security.
     */
    getIdentifierByType(type) {
        this.assertNotLink('identifierByType');
        const list = this.proto.getIdentifiersList();
        if (!list)
            return undefined;
        const found = list.find(p => p.getIdentifierType() === type);
        return found ? new identifier_1.Identifier(found) : undefined;
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
     * calling BondSecurity.getIssueDate() (which is non-nullable on a
     * properly-formed bond).
     */
    getIssueDate() {
        this.assertNotLink('issueDate');
        const bond = this.getBondLikeDetails();
        const date = bond ? bond.getIssueDate() : undefined;
        return (0, date_1.localDateProtoToDate)(date);
    }
    /**
     * Returns the maturity date if set, else null. Maturity date is a
     * bond-only concept; on non-bond securities this returns null rather
     * than throwing. Prefer narrowing first via isBond() for bond-specific
     * code paths.
     */
    getMaturityDate() {
        this.assertNotLink('maturityDate');
        const bond = this.getBondLikeDetails();
        const date = bond ? bond.getMaturityDate() : undefined;
        return (0, date_1.localDateProtoToDate)(date);
    }
    /**
     * Returns the canonical bond_details sub-message if set, else undefined.
     * TIPS and FRN extras live in their own tips_extension / frn_extension
     * fields and co-exist with bond_details.
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
    /**
     * Time-based soft-delete check. A Security is considered deleted iff it
     * carries a `valid_to` that has already elapsed at `asOf`. A future-dated
     * `valid_to` means the row is still live today and becomes deleted
     * automatically when `asOf` catches up. An unset `valid_to` is always
     * active.
     *
     * Canonical soft-delete check across the platform — the predecessor
     * `SecurityProto.deleted_at` field has been removed (tag 15 reserved).
     * See /specs/soft-delete-validto-collapse.md
     * (FinTekkers/second-brain#316).
     */
    isDeleted(asOf = new Date()) {
        if (!this.proto.hasValidTo())
            return false;
        const validToProto = this.proto.getValidTo();
        if (!validToProto)
            return false;
        const ts = validToProto.getTimestamp();
        if (!ts)
            return false;
        const validToMs = ts.getSeconds() * 1000 + Math.floor(ts.getNanos() / 1e6);
        return validToMs < asOf.getTime();
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