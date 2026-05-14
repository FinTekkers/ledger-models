import Security from './security';
import { SecurityProto } from '../../../fintekkers/models/security/security_pb';
import { IndexTypeProto } from '../../../fintekkers/models/security/index/index_type_pb';

/**
 * Wrapper for Security messages whose product_type is a descendant of
 * INDEX in hierarchy.json (CPI_SERIES, SOFR_SERIES, EQUITY_INDEX, etc.).
 * The index-specific fields live in the index_details sub-message (one of
 * the non_bond_details oneof variants).
 */
class IndexSecurity extends Security {
  constructor(proto: SecurityProto) {
    super(proto);
  }

  /** Which index family this security represents. Defaults to
   * UNKNOWN_INDEX_TYPE when index_details is not populated. */
  getIndexType(): IndexTypeProto {
    const details = this.proto.getIndexDetails();
    return details ? details.getIndexType() : IndexTypeProto.UNKNOWN_INDEX_TYPE;
  }
}

export default IndexSecurity;
