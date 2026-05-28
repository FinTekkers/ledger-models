"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const field_pb_1 = require("../../../fintekkers/models/position/field_pb");
const security_pb_1 = require("../../../fintekkers/models/security/security_pb");
const datetime_1 = require("../utils/datetime");
const uuid_1 = require("../utils/uuid");
const date_1 = require("../utils/date");
const product_type_pb_1 = require("../../../fintekkers/models/security/product_type_pb");
const identifier_1 = require("./identifier");
const product_hierarchy_1 = require("./product_hierarchy");
const LinkCacheModule = __importStar(require("../../util/link-cache"));
const link_resolver_1 = __importDefault(require("../../util/link-resolver"));
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
     * Async hydration — fetches the full proto via the default
     * `LinkResolver` (or one you pass in) and swaps it onto this wrapper.
     * Returns `this` so it can be chained.
     *
     *   const sec = await new Security(linkProto).hydrate();
     *   console.log(sec.getIssuerName());
     *
     * Mirrors the Java / Python / Rust auto-resolve story — except in TS
     * the fetch is necessarily async (no sync-from-async bridge in
     * idiomatic Node.js), so the user pays one extra `await`. The default
     * resolver is the process-wide singleton from
     * `LinkResolver.getDefault()`; override per call by passing your own.
     *
     * On a non-link wrapper, this is a no-op and returns immediately.
     */
    hydrate(resolver) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.proto.getIsLink())
                return this;
            const uuidProto = this.proto.getUuid();
            if (!uuidProto) {
                throw new Error("Cannot hydrate a link-mode Security with no UUID set.");
            }
            const uuid = uuid_1.UUID.fromU8Array(uuidProto.getRawUuid_asU8());
            const asOfProto = (_a = this.proto.getAsOf()) !== null && _a !== void 0 ? _a : undefined;
            const r = resolver !== null && resolver !== void 0 ? resolver : link_resolver_1.default.getDefault();
            const resolved = yield r.getSecurity(uuid, asOfProto);
            this.proto = resolved.proto;
            return this;
        });
    }
    /**
     * Lazy hydration. If this Security is in link mode, swap in the resolved
     * proto from LinkCache. On cache miss, throws — caller must pre-warm via
     * LinkResolver or call `hydrate()` first. See docs/adr/lazy-link-hydration.md.
     *
     * TS variant is cache-only (no sync fetcher hook) because the gRPC stubs
     * are async and chaining the resolver into every getter would force every
     * accessor to become async. Pre-warming through LinkResolver / `hydrate()`
     * keeps the sync getter API.
     */
    ensureHydrated() {
        if (!this.proto.getIsLink())
            return;
        const uuidProto = this.proto.getUuid();
        if (!uuidProto) {
            throw new Error("Cannot read fields on link-mode Security with no UUID set.");
        }
        const uuidKey = uuid_1.UUID.fromU8Array(uuidProto.getRawUuid_asU8()).toString();
        const asOfProto = this.proto.getAsOf();
        const asOf = asOfProto ? new datetime_1.ZonedDateTime(asOfProto) : null;
        const cached = LinkCacheModule.SECURITY.get(uuidKey, asOf);
        if (cached) {
            this.proto = cached;
            return;
        }
        throw new Error(`Cannot read fields on link-mode Security uuid=${uuidKey} `
            + `— LinkCache miss. Call \`await security.hydrate()\` first, `
            + `or pre-warm via LinkResolver. `
            + `See docs/adr/lazy-link-hydration.md.`);
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
        this.ensureHydrated();
        return this.proto.getAssetClass();
    }
    getProductClass() {
        this.ensureHydrated();
        throw new Error('Not implemented yet. See Java implementation for reference');
    }
    getProductType() {
        this.ensureHydrated();
        const securityType = this.proto.getProductType();
        const securityTypeString = Object.keys(product_type_pb_1.ProductTypeProto).find(key => product_type_pb_1.ProductTypeProto[key] === securityType);
        return securityTypeString || 'UNKNOWN_SECURITY_TYPE';
    }
    /**
     * Returns every Identifier attached to this security as typed wrappers.
     * Empty list if none are set. Throws on a link-mode Security.
     */
    getIdentifiers() {
        this.ensureHydrated();
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
        this.ensureHydrated();
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
        this.ensureHydrated();
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
        this.ensureHydrated();
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
        this.ensureHydrated();
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