import { FieldProto } from "../../../fintekkers/models/position/field_pb";
import { SecurityProto } from "../../../fintekkers/models/security/security_pb";
import { UUIDProto } from "../../../fintekkers/models/util/uuid_pb";
import { LocalTimestampProto } from "../../../fintekkers/models/util/local_timestamp_pb";
import { ZonedDateTime } from "../utils/datetime";
import { UUID } from "../utils/uuid";
import { localDateProtoToDate } from "../utils/date";
import { ProductTypeProto } from "../../../fintekkers/models/security/product_type_pb";
import { IdentifierTypeProto } from "../../../fintekkers/models/security/identifier/identifier_type_pb";
import { Identifier } from "./identifier";
import { isDescendantOf } from "./product_hierarchy";
import * as LinkCacheModule from "../../util/link-cache";

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
   * Lazy hydration. If this Security is in link mode, swap in the resolved
   * proto from LinkCache. On cache miss, throws — caller must pre-warm via
   * LinkResolver. See docs/adr/lazy-link-hydration.md.
   *
   * TS variant is cache-only (no fetcher hook) because the gRPC stubs are
   * async and chaining the resolver into every getter would force every
   * accessor to become async. Pre-warming through LinkResolver keeps the
   * sync getter API.
   */
  private ensureHydrated(): void {
    if (!this.proto.getIsLink()) return;
    const uuidProto = this.proto.getUuid();
    if (!uuidProto) {
      throw new Error("Cannot read fields on link-mode Security with no UUID set.");
    }
    const uuidKey = UUID.fromU8Array(uuidProto.getRawUuid_asU8()).toString();
    const asOfProto = this.proto.getAsOf();
    const asOf = asOfProto ? new ZonedDateTime(asOfProto) : null;
    const cached = LinkCacheModule.SECURITY.get(uuidKey, asOf);
    if (cached) {
      this.proto = cached;
      return;
    }
    throw new Error(
      `Cannot read fields on link-mode Security uuid=${uuidKey} `
      + `— LinkCache miss. Pre-warm via LinkResolver. `
      + `See docs/adr/lazy-link-hydration.md.`
    );
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
  static create(proto: SecurityProto): Security {
    const productType = proto.getProductType();
    const ptName = (Object.keys(ProductTypeProto) as Array<keyof typeof ProductTypeProto>)
      .find(k => ProductTypeProto[k] === productType);

    // TIPS / FRN / MBS have dedicated wrappers with extension-specific accessors.
    if (productType === ProductTypeProto.TIPS) {
      const TIPSBond = require('./TIPSBond').default;
      return new TIPSBond(proto);
    }
    if (productType === ProductTypeProto.TREASURY_FRN) {
      const FloatingRateNote = require('./FloatingRateNote').default;
      return new FloatingRateNote(proto);
    }
    if (productType === ProductTypeProto.MORTGAGE_BACKED) {
      const MortgageBackedSecurity = require('./MortgageBackedSecurity').default;
      return new MortgageBackedSecurity(proto);
    }

    // Any other BOND descendant -> generic BondSecurity wrapper.
    if (ptName && isDescendantOf(ptName as string, 'BOND')) {
      const BondSecurity = require('./BondSecurity').default;
      return new BondSecurity(proto);
    }

    // INDEX descendants get the IndexSecurity wrapper.
    if (ptName && isDescendantOf(ptName as string, 'INDEX')) {
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
  isBond(): this is import('./BondSecurity').default {
    const t = this.proto.getProductType();
    const ptName = (Object.keys(ProductTypeProto) as Array<keyof typeof ProductTypeProto>)
      .find(k => ProductTypeProto[k] === t);
    if (!ptName) return false;
    return isDescendantOf(ptName as string, 'BOND');
  }

  /**
   * Type guard: true iff this Security is a MortgageBackedSecurity (a
   * descendant of STRUCTURED_BOND in hierarchy.json — MBS_PASSTHROUGH today,
   * CMBS/ABS/CLO when those leaves become active).
   */
  isMbs(): this is import('./MortgageBackedSecurity').default {
    return this.proto.getProductType() === ProductTypeProto.MORTGAGE_BACKED;
  }

  /**
   * Type guard: true iff this Security is an IndexSecurity (any descendant
   * of INDEX in hierarchy.json — CPI_SERIES, SOFR_SERIES, EQUITY_INDEX, ...).
   */
  isIndex(): this is import('./IndexSecurity').default {
    const t = this.proto.getProductType();
    const ptName = (Object.keys(ProductTypeProto) as Array<keyof typeof ProductTypeProto>)
      .find(k => ProductTypeProto[k] === t);
    if (!ptName) return false;
    return isDescendantOf(ptName as string, 'INDEX');
  }

  /**
   * Runtime predicate: true iff this Security wraps a cash currency
   * (product_type == CURRENCY). No dedicated CashSecurity wrapper exists
   * yet so this isn't a TS type-guard — the return is base Security.
   */
  isCash(): boolean {
    return this.proto.getProductType() === ProductTypeProto.CURRENCY;
  }

  /**
   * Runtime predicate: true iff this Security wraps a stock-shape product
   * type (any descendant of STOCK in hierarchy.json — COMMON_STOCK,
   * PREFERRED_STOCK, ADR, ETF). No dedicated EquitySecurity wrapper exists
   * yet so this isn't a TS type-guard — the return is base Security.
   */
  isEquity(): boolean {
    const t = this.proto.getProductType();
    const ptName = (Object.keys(ProductTypeProto) as Array<keyof typeof ProductTypeProto>)
      .find(k => ProductTypeProto[k] === t);
    if (!ptName) return false;
    return isDescendantOf(ptName as string, 'STOCK');
  }

  /**
   * Runtime predicate: true iff this Security wraps an FX spot
   * (product_type == FX_SPOT). No dedicated FxSpotSecurity wrapper exists
   * yet so this isn't a TS type-guard — the return is base Security.
   */
  isFxSpot(): boolean {
    return this.proto.getProductType() === ProductTypeProto.FX_SPOT;
  }


  toString(): string {
    const ids = this.proto.getIsLink() ? [] : this.proto.getIdentifiersList();
    const idStr = ids && ids.length > 0
      ? new Identifier(ids[0]).toString()
      : '<no-identifier>';
    const issuer = this.proto.getIsLink() ? '<link>' : this.getIssuerName();
    return `ID[${this.getID().toString()}], ${idStr}[${issuer}]`;
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
      case FieldProto.IDENTIFIER: {
        const list = this.proto.getIdentifiersList();
        return list && list.length > 0 ? new Identifier(list[0]) : null;
      }
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
    this.ensureHydrated();
    return this.proto.getAssetClass();
  }

  getProductClass(): string {
    this.ensureHydrated();
    throw new Error('Not implemented yet. See Java implementation for reference');
  }

  getProductType(): string {
    this.ensureHydrated();
    const securityType = this.proto.getProductType();
    const securityTypeString = (Object.keys(ProductTypeProto) as Array<keyof typeof ProductTypeProto>).find(
      key => ProductTypeProto[key] === securityType
    );

    return securityTypeString || 'UNKNOWN_SECURITY_TYPE';
  }

  /**
   * Returns every Identifier attached to this security as typed wrappers.
   * Empty list if none are set. Throws on a link-mode Security.
   */
  getIdentifiers(): Identifier[] {
    this.ensureHydrated();
    const list = this.proto.getIdentifiersList();
    if (!list) return [];
    return list.map(p => new Identifier(p));
  }

  /**
   * Returns the first Identifier matching the given IdentifierTypeProto,
   * or undefined if none is present. Throws on a link-mode Security.
   */
  getIdentifierByType(type: IdentifierTypeProto): Identifier | undefined {
    this.ensureHydrated();
    const list = this.proto.getIdentifiersList();
    if (!list) return undefined;
    const found = list.find(p => p.getIdentifierType() === type);
    return found ? new Identifier(found) : undefined;
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
  getIssueDate(): Date | null {
    this.ensureHydrated();
    const bond = this.getBondLikeDetails();
    const date = bond ? bond.getIssueDate() : undefined;
    return localDateProtoToDate(date);
  }

  /**
   * Returns the maturity date if set, else null. Maturity date is a
   * bond-only concept; on non-bond securities this returns null rather
   * than throwing. Prefer narrowing first via isBond() for bond-specific
   * code paths.
   */
  getMaturityDate(): Date | null {
    this.ensureHydrated();
    const bond = this.getBondLikeDetails();
    const date = bond ? bond.getMaturityDate() : undefined;
    return localDateProtoToDate(date);
  }

  /**
   * Returns the canonical bond_details sub-message if set, else undefined.
   * TIPS and FRN extras live in their own tips_extension / frn_extension
   * fields and co-exist with bond_details.
   */
  protected getBondLikeDetails(): any | undefined {
    if (typeof this.proto.getBondDetails !== 'function') return undefined;
    return this.proto.getBondDetails() ?? undefined;
  }

  getIssuerName(): string {
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
  isDeleted(asOf: Date = new Date()): boolean {
    if (!this.proto.hasValidTo()) return false;
    const validToProto = this.proto.getValidTo();
    if (!validToProto) return false;
    const ts = validToProto.getTimestamp();
    if (!ts) return false;
    const validToMs = ts.getSeconds() * 1000 + Math.floor(ts.getNanos() / 1e6);
    return validToMs < asOf.getTime();
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
