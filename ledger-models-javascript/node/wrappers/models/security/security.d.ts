import { FieldProto } from "../../../fintekkers/models/position/field_pb";
import { SecurityProto } from "../../../fintekkers/models/security/security_pb";
import { ZonedDateTime } from "../utils/datetime";
import { UUID } from "../utils/uuid";
import { IdentifierTypeProto } from "../../../fintekkers/models/security/identifier/identifier_type_pb";
import { Identifier } from "./identifier";
declare class Security {
    proto: SecurityProto;
    constructor(proto: SecurityProto);
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
    static linkOf(uuid: UUID, asOf: ZonedDateTime): SecurityProto;
    /**
     * Build a SecurityProto link reference (is_link=true) with only uuid set.
     * Resolution returns the latest version. Explicit escape hatch — most
     * callers should prefer linkOf(uuid, asOf).
     */
    static linkOfLatest(uuid: UUID): SecurityProto;
    private static _uuidToProto;
    private static _zonedDateTimeToProto;
    /**
     * Lazy hydration. If this Security is in link mode, swap in the resolved
     * proto from LinkCache. On cache miss, throws — caller must pre-warm via
     * LinkResolver. See docs/adr/lazy-link-hydration.md.
     *
     * TS variant is cache-only (no fetcher hook) because the gRPC stubs are
     * async and chaining the resolver into every getter would force every
     * accessor to become async. Pre-warming through LinkResolver keeps the
     * sync getter API.
     */
    private ensureHydrated;
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
    static create(proto: SecurityProto): Security;
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
    isBond(): this is import('./BondSecurity').default;
    /**
     * Type guard: true iff this Security is a MortgageBackedSecurity (a
     * descendant of STRUCTURED_BOND in hierarchy.json — MBS_PASSTHROUGH today,
     * CMBS/ABS/CLO when those leaves become active).
     */
    isMbs(): this is import('./MortgageBackedSecurity').default;
    /**
     * Type guard: true iff this Security is an IndexSecurity (any descendant
     * of INDEX in hierarchy.json — CPI_SERIES, SOFR_SERIES, EQUITY_INDEX, ...).
     */
    isIndex(): this is import('./IndexSecurity').default;
    /**
     * Runtime predicate: true iff this Security wraps a cash currency
     * (product_type == CURRENCY). No dedicated CashSecurity wrapper exists
     * yet so this isn't a TS type-guard — the return is base Security.
     */
    isCash(): boolean;
    /**
     * Runtime predicate: true iff this Security wraps a stock-shape product
     * type (any descendant of STOCK in hierarchy.json — COMMON_STOCK,
     * PREFERRED_STOCK, ADR, ETF). No dedicated EquitySecurity wrapper exists
     * yet so this isn't a TS type-guard — the return is base Security.
     */
    isEquity(): boolean;
    /**
     * Runtime predicate: true iff this Security wraps an FX spot
     * (product_type == FX_SPOT). No dedicated FxSpotSecurity wrapper exists
     * yet so this isn't a TS type-guard — the return is base Security.
     */
    isFxSpot(): boolean;
    toString(): string;
    getFields(): FieldProto[];
    getField(field: FieldProto): any;
    getID(): UUID;
    /**
     * True iff this Security is a link reference (only the uuid is populated;
     * other fields should not be relied on). See docs/adr/is_link_pattern.md.
     * Pair with LinkResolver to hydrate to a full entity.
     */
    isLink(): boolean;
    getAsOf(): ZonedDateTime;
    getAssetClass(): string;
    getProductClass(): string;
    getProductType(): string;
    /**
     * Returns every Identifier attached to this security as typed wrappers.
     * Empty list if none are set. Throws on a link-mode Security.
     */
    getIdentifiers(): Identifier[];
    /**
     * Returns the first Identifier matching the given IdentifierTypeProto,
     * or undefined if none is present. Throws on a link-mode Security.
     */
    getIdentifierByType(type: IdentifierTypeProto): Identifier | undefined;
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
    getIssueDate(): Date | null;
    /**
     * Returns the maturity date if set, else null. Maturity date is a
     * bond-only concept; on non-bond securities this returns null rather
     * than throwing. Prefer narrowing first via isBond() for bond-specific
     * code paths.
     */
    getMaturityDate(): Date | null;
    /**
     * Returns the canonical bond_details sub-message if set, else undefined.
     * TIPS and FRN extras live in their own tips_extension / frn_extension
     * fields and co-exist with bond_details.
     */
    protected getBondLikeDetails(): any | undefined;
    getIssuerName(): string;
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
    isDeleted(asOf?: Date): boolean;
    equals(other: Security): boolean;
}
export default Security;
