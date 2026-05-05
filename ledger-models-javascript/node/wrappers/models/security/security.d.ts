import { FieldProto } from "../../../fintekkers/models/position/field_pb";
import { IdentifierProto } from "../../../fintekkers/models/security/identifier/identifier_pb";
import { SecurityProto } from "../../../fintekkers/models/security/security_pb";
import { ZonedDateTime } from "../utils/datetime";
import { UUID } from "../utils/uuid";
import { LocalDate } from "../utils/date";
declare class Security {
    proto: SecurityProto;
    constructor(proto: SecurityProto);
    /**
     * Factory method to create the appropriate Security subclass based on security type
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
    getSecurityID(): IdentifierProto;
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
    getIssueDate(): LocalDate | null;
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
    getMaturityDate(): LocalDate;
    /**
     * Returns the bond-like details sub-message from the oneof, if set.
     * Works for BondDetails, TipsDetails, and FrnDetails (all share the same
     * base bond fields: coupon_rate, maturity_date, etc.).
     * Returns undefined if the oneof is not set or the proto doesn't support it
     * (e.g. when JS codegen hasn't been updated).
     */
    protected getBondLikeDetails(): any | undefined;
    getIssuerName(): string;
    equals(other: Security): boolean;
}
export default Security;
