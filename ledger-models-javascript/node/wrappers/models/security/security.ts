import { FieldProto } from "../../../fintekkers/models/position/field_pb";
import { IdentifierProto } from "../../../fintekkers/models/security/identifier/identifier_pb";
import { SecurityProto } from "../../../fintekkers/models/security/security_pb";
import { UUIDProto } from "../../../fintekkers/models/util/uuid_pb";
import { LocalTimestampProto } from "../../../fintekkers/models/util/local_timestamp_pb";
import { ZonedDateTime } from "../utils/datetime";
import { UUID } from "../utils/uuid";
import { LocalDate } from "../utils/date";
import { ProductTypeProto } from "../../../fintekkers/models/security/product_type_pb";

class Security {
  proto: SecurityProto;

  constructor(proto: SecurityProto) {
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
  static linkOf(uuid: UUID, asOf: ZonedDateTime): SecurityProto {
    if (!uuid) throw new Error("uuid is required for linkOf");
    if (!asOf) throw new Error("asOf is required for linkOf; use linkOfLatest(uuid) for latest-version semantics");
    const proto = new SecurityProto();
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
  static linkOfLatest(uuid: UUID): SecurityProto {
    if (!uuid) throw new Error("uuid is required for linkOfLatest");
    const proto = new SecurityProto();
    proto.setIsLink(true);
    proto.setUuid(Security._uuidToProto(uuid));
    return proto;
  }

  private static _uuidToProto(uuid: UUID): UUIDProto {
    return uuid.toUUIDProto();
  }

  private static _zonedDateTimeToProto(asOf: ZonedDateTime): LocalTimestampProto {
    return asOf.toProto();
  }

  /**
   * Throws if this Security is in link mode. Use to guard accessors that
   * would otherwise return proto3 default values on a link reference.
   */
  private assertNotLink(accessor: string): void {
    if (this.proto.getIsLink()) {
      throw new Error(
        `Cannot read ${accessor} on a link-mode Security (is_link=true). `
        + `Resolve via SecurityService.GetByIds first. `
        + `See docs/adr/is_link_pattern.md.`
      );
    }
  }

  /**
   * Factory method to create the appropriate Security subclass based on security type
   */
  static create(proto: SecurityProto): Security {
    switch (proto.getProductType()) {
      case ProductTypeProto.TREASURY_NOTE:
      case ProductTypeProto.TIPS:
      case ProductTypeProto.TREASURY_FRN:
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
  isBond(): this is import('./BondSecurity').default {
    const t = this.proto.getProductType();
    return t === ProductTypeProto.TREASURY_NOTE
        || t === ProductTypeProto.TIPS
        || t === ProductTypeProto.TREASURY_FRN;
  }


  toString(): string {
    return `ID[${this.getID().toString()}], ${this.getSecurityID()}[${this.getIssuerName()}]`;
  }

  getFields(): FieldProto[] {
    return [FieldProto.ID, FieldProto.SECURITY_ID, FieldProto.AS_OF, FieldProto.ASSET_CLASS, FieldProto.IDENTIFIER];
  }

  getField(field: FieldProto): any {
    switch (field) {
      case FieldProto.ID:
      case FieldProto.SECURITY_ID:
        return this.getID();
      case FieldProto.AS_OF:
        return this.getAsOf();
      case FieldProto.ASSET_CLASS:
        return this.getAssetClass();
      case FieldProto.PRODUCT_CLASS:
        return this.getProductClass();
      case FieldProto.PRODUCT_TYPE:
        return this.getProductType();
      case FieldProto.IDENTIFIER:
        return this.getSecurityID();
      case FieldProto.TENOR:
      case FieldProto.ADJUSTED_TENOR:
        throw new Error('Not implemented yet');
      case FieldProto.MATURITY_DATE:
        // Maturity date is bond-only. Mirror Java's Security.getField:
        // delegate to BondSecurity, return null for non-bonds.
        return this.isBond() ? this.getMaturityDate() : null;
      case FieldProto.ISSUE_DATE:
        // getIssueDate already returns null on non-bonds; just forward.
        return this.getIssueDate();
      default:
        throw new Error(`Field not mapped in Security wrapper: ${field}`);
    }
  }

  getID(): UUID {
    const uuid = this.proto.getUuid();
    if (!uuid) throw new Error("UUID is required");
    return UUID.fromU8Array(uuid.getRawUuid_asU8());
  }

  /**
   * True iff this Security is a link reference (only the uuid is populated;
   * other fields should not be relied on). See docs/adr/is_link_pattern.md.
   * Pair with LinkResolver to hydrate to a full entity.
   */
  isLink(): boolean {
    return this.proto.getIsLink();
  }

  getAsOf(): ZonedDateTime {
    const asOf = this.proto.getAsOf();
    if (!asOf) throw new Error("AsOf is required");
    return new ZonedDateTime(asOf);
  }

  getAssetClass(): string {
    this.assertNotLink('assetClass');
    return this.proto.getAssetClass();
  }

  getProductClass(): string {
    this.assertNotLink('productClass');
    throw new Error('Not implemented yet. See Java implementation for reference');
  }

  getProductType(): string {
    this.assertNotLink('productType');
    const securityType = this.proto.getProductType();
    const securityTypeString = (Object.keys(ProductTypeProto) as Array<keyof typeof ProductTypeProto>).find(
      key => ProductTypeProto[key] === securityType
    );

    return securityTypeString || 'UNKNOWN_SECURITY_TYPE';
  }

  getSecurityID(): IdentifierProto {
    this.assertNotLink('securityId');
    const identifier = this.proto.getIdentifier();
    if (!identifier) throw new Error("Identifier is required");
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
  getIssueDate(): LocalDate | null {
    this.assertNotLink('issueDate');
    // Prefer oneof bond sub-message if available, fall back to flat fields
    const bond = this.getBondLikeDetails();
    const date = bond ? bond.getIssueDate() : this.proto.getIssueDate();
    if (!date) return null;
    return new LocalDate(date);
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
  getMaturityDate(): LocalDate {
    this.assertNotLink('maturityDate');
    // Prefer oneof bond sub-message if available, fall back to flat fields
    const bond = this.getBondLikeDetails();
    const date = bond ? bond.getMaturityDate() : this.proto.getMaturityDate();
    if (!date) throw new Error("Maturity date is required");
    return new LocalDate(date);
  }

  /**
   * Returns the canonical bond_details sub-message if set, else undefined.
   * v0.3.0 collapsed the prior 3-arm bond/tips/frn oneof into a single
   * top-level bond_details — TIPS and FRN extras now live in their own
   * tips_extension / frn_extension fields.
   */
  protected getBondLikeDetails(): any | undefined {
    if (typeof this.proto.getBondDetails !== 'function') return undefined;
    return this.proto.getBondDetails() ?? undefined;
  }

  getIssuerName(): string {
    this.assertNotLink('issuerName');
    return this.proto.getIssuerName();
  }

  equals(other: Security): boolean {
    if (other instanceof Security) {
      return this.getID().equals(other.getID());
    } else {
      return false;
    }
  }
}

export default Security;
