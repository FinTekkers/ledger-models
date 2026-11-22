import Security from './security';
import type { SecurityProto } from '../../../fintekkers/models/security/security_pb';
import type { Decimal } from 'decimal.js';
import { decodeDecimal, isUnsetDecimal, toDecimalJs, withField } from '../utils/decimal';

/**
 * Wrapper for Security messages whose product_type is a descendant of
 * STOCK in hierarchy.json (COMMON_STOCK, PREFERRED_STOCK, ADR, ETF, etc.).
 * The equity-specific fields live in the equity_details sub-message (one of
 * the non_bond_details oneof variants). See docs/adr/equity_shares_outstanding.md.
 */
class EquitySecurity extends Security {
  constructor(proto: SecurityProto) {
    super(proto);
  }

  /** Whole-number count of shares outstanding at this version's as_of.
   * Undefined when unknown (no equity_details, field absent or an empty
   * decimal), never 0. */
  getSharesOutstanding(): Decimal | undefined {
    const details = this.proto.getEquityDetails();
    if (!details || !details.hasSharesOutstanding()) return undefined;
    const p = details.getSharesOutstanding()!;
    if (isUnsetDecimal(p)) return undefined;
    return toDecimalJs(withField('equity_details.shares_outstanding', () => decodeDecimal(p)));
  }
}

export default EquitySecurity;
