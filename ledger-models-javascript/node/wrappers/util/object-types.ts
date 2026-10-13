/**
 * Object type and version (LM-297, LM-318).
 *
 * Every message that names its type carries `ObjectTypeProto object_type = 1`
 * and `VersionProto version = 2`. Writers call `stamp`, which sets the type and
 * `SCHEMA_VERSION`; `stampOwn` passes the message's own type (LM-320). Readers
 * call `readType` / `readVersion`. The old `object_class` / `version` strings
 * were replaced in place by LM-318: bytes written before it are not readable.
 * See docs/adr/compact_object_type_and_version.md.
 */
import { ObjectTypeProto } from '../../fintekkers/models/util/object_type_pb';
import { VersionProto } from '../../fintekkers/models/util/version_pb';
import { PortfolioProto } from '../../fintekkers/models/portfolio/portfolio_pb';
import { PositionProto } from '../../fintekkers/models/position/position_pb';
import { PositionFilterProto } from '../../fintekkers/models/position/position_filter_pb';
import { PriceProto } from '../../fintekkers/models/price/price_pb';
import { IssuanceProto } from '../../fintekkers/models/security/bond/issuance_pb';
import { IdentifierProto } from '../../fintekkers/models/security/identifier/identifier_pb';
import { IndexCompositionProto } from '../../fintekkers/models/security/index_composition_pb';
import { SecurityProto } from '../../fintekkers/models/security/security_pb';
import { TenorProto } from '../../fintekkers/models/security/tenor_pb';
import { StrategyProto } from '../../fintekkers/models/strategy/strategy_pb';
import { StrategyAllocationProto } from '../../fintekkers/models/strategy/strategy_allocation_pb';
import { TransactionProto } from '../../fintekkers/models/transaction/transaction_pb';
import { API_Key } from '../../fintekkers/models/util/api/api_key_pb';
import { DateRangeProto } from '../../fintekkers/models/util/date_range_pb';
import { NodePartition } from '../../fintekkers/models/util/lock/node_partition_pb';
import { NodeState } from '../../fintekkers/models/util/lock/node_state_pb';
import { CreateIndexCompositionRequestProto, CreateIndexCompositionResponseProto } from '../../fintekkers/requests/index_composition/create_index_composition_request_pb';
import { GetIndexCompositionRequestProto, GetIndexCompositionResponseProto } from '../../fintekkers/requests/index_composition/get_index_composition_request_pb';
import { CreatePortfolioRequestProto } from '../../fintekkers/requests/portfolio/create_portfolio_request_pb';
import { CreatePortfolioResponseProto } from '../../fintekkers/requests/portfolio/create_portfolio_response_pb';
import { QueryPortfolioRequestProto } from '../../fintekkers/requests/portfolio/query_portfolio_request_pb';
import { QueryPortfolioResponseProto } from '../../fintekkers/requests/portfolio/query_portfolio_response_pb';
import { QueryPositionRequestProto } from '../../fintekkers/requests/position/query_position_request_pb';
import { QueryPositionResponseProto } from '../../fintekkers/requests/position/query_position_response_pb';
import { CreatePriceRequestProto } from '../../fintekkers/requests/price/create_price_request_pb';
import { CreatePriceResponseProto } from '../../fintekkers/requests/price/create_price_response_pb';
import { QueryPriceRequestProto } from '../../fintekkers/requests/price/query_price_request_pb';
import { QueryPriceResponseProto } from '../../fintekkers/requests/price/query_price_response_pb';
import { CreateSecurityRequestProto } from '../../fintekkers/requests/security/create_security_request_pb';
import { CreateSecurityResponseProto } from '../../fintekkers/requests/security/create_security_response_pb';
import { GetFieldValuesRequestProto } from '../../fintekkers/requests/security/get_field_values_request_pb';
import { GetFieldValuesResponseProto } from '../../fintekkers/requests/security/get_field_values_response_pb';
import { GetFieldsResponseProto } from '../../fintekkers/requests/security/get_fields_response_pb';
import { QuerySecurityRequestProto } from '../../fintekkers/requests/security/query_security_request_pb';
import { QuerySecurityResponseProto } from '../../fintekkers/requests/security/query_security_response_pb';
import { CreateTransactionRequestProto } from '../../fintekkers/requests/transaction/create_transaction_request_pb';
import { CreateTransactionResponseProto } from '../../fintekkers/requests/transaction/create_transaction_response_pb';
import { QueryTransactionRequestProto } from '../../fintekkers/requests/transaction/query_transaction_request_pb';
import { QueryTransactionResponseProto } from '../../fintekkers/requests/transaction/query_transaction_response_pb';
import { DeleteRequestProto, DeleteResponseProto } from '../../fintekkers/requests/util/delete_request_pb';
import { LockRequestProto } from '../../fintekkers/requests/util/lock/lock_request_pb';
import { LockResponseProto } from '../../fintekkers/requests/util/lock/lock_response_pb';
import { CurveRequestProto } from '../../fintekkers/requests/valuation/curve_request_pb';
import { CurveResponseProto } from '../../fintekkers/requests/valuation/curve_response_pb';
import { ValuationRequestProto } from '../../fintekkers/requests/valuation/valuation_request_pb';
import { ValuationResponseProto } from '../../fintekkers/requests/valuation/valuation_response_pb';

/** Any generated message that carries object_type and version. */
export interface ObjectTyped {
  getObjectType(): ObjectTypeProto;
  setObjectType(value: ObjectTypeProto): unknown;
  hasVersion(): boolean;
  getVersion(): VersionProto | undefined;
  setVersion(value?: VersionProto): unknown;
}

/** [major, minor, patch], each a uint32. */
export type Version = [number, number, number];

/** The schema version `stamp` writes. Not the library release. */
export const SCHEMA_VERSION: Version = [0, 0, 1];

/**
 * Sets object_type and version (`SCHEMA_VERSION`) on `message`; returns it.
 * `objectType` is the message's own ObjectTypeProto value.
 */
export function stamp<T extends ObjectTyped>(message: T, objectType: ObjectTypeProto): T {
  const [major, minor, patch] = SCHEMA_VERSION;
  message.setObjectType(objectType);
  message.setVersion(new VersionProto().setMajor(major).setMinor(minor).setPatch(patch));
  return message;
}

// Each message with object_type: proto full name, generated class, its own
// ObjectTypeProto value (LM-320). object-type-coverage.test.ts fails when a
// message in the descriptor set is missing.
const OWN_TYPE_ROWS: ReadonlyArray<[string, Function, ObjectTypeProto]> = [
  ['fintekkers.models.portfolio.PortfolioProto', PortfolioProto, ObjectTypeProto.OBJECT_TYPE_PORTFOLIO],
  ['fintekkers.models.position.PositionProto', PositionProto, ObjectTypeProto.OBJECT_TYPE_POSITION],
  ['fintekkers.models.position.PositionFilterProto', PositionFilterProto, ObjectTypeProto.OBJECT_TYPE_POSITION_FILTER],
  ['fintekkers.models.price.PriceProto', PriceProto, ObjectTypeProto.OBJECT_TYPE_PRICE],
  ['fintekkers.models.security.IdentifierProto', IdentifierProto, ObjectTypeProto.OBJECT_TYPE_IDENTIFIER],
  ['fintekkers.models.security.SecurityProto', SecurityProto, ObjectTypeProto.OBJECT_TYPE_SECURITY],
  ['fintekkers.models.security.TenorProto', TenorProto, ObjectTypeProto.OBJECT_TYPE_TENOR],
  ['fintekkers.models.strategy.StrategyProto', StrategyProto, ObjectTypeProto.OBJECT_TYPE_STRATEGY],
  ['fintekkers.models.strategy.StrategyAllocationProto', StrategyAllocationProto, ObjectTypeProto.OBJECT_TYPE_STRATEGY_ALLOCATION],
  ['fintekkers.models.transaction.TransactionProto', TransactionProto, ObjectTypeProto.OBJECT_TYPE_TRANSACTION],
  ['fintekkers.requests.portfolio.CreatePortfolioRequestProto', CreatePortfolioRequestProto, ObjectTypeProto.OBJECT_TYPE_CREATE_PORTFOLIO_REQUEST],
  ['fintekkers.requests.portfolio.QueryPortfolioRequestProto', QueryPortfolioRequestProto, ObjectTypeProto.OBJECT_TYPE_QUERY_PORTFOLIO_REQUEST],
  ['fintekkers.requests.price.CreatePriceRequestProto', CreatePriceRequestProto, ObjectTypeProto.OBJECT_TYPE_CREATE_PRICE_REQUEST],
  ['fintekkers.requests.price.QueryPriceRequestProto', QueryPriceRequestProto, ObjectTypeProto.OBJECT_TYPE_QUERY_PRICE_REQUEST],
  ['fintekkers.requests.security.CreateSecurityRequestProto', CreateSecurityRequestProto, ObjectTypeProto.OBJECT_TYPE_CREATE_SECURITY_REQUEST],
  ['fintekkers.requests.security.QuerySecurityRequestProto', QuerySecurityRequestProto, ObjectTypeProto.OBJECT_TYPE_QUERY_SECURITY_REQUEST],
  ['fintekkers.requests.transaction.CreateTransactionRequestProto', CreateTransactionRequestProto, ObjectTypeProto.OBJECT_TYPE_CREATE_TRANSACTION_REQUEST],
  ['fintekkers.requests.transaction.QueryTransactionRequestProto', QueryTransactionRequestProto, ObjectTypeProto.OBJECT_TYPE_QUERY_TRANSACTION_REQUEST],
  // LM-320: the rest of the messages with object_type.
  ['fintekkers.models.security.bond.IssuanceProto', IssuanceProto, ObjectTypeProto.OBJECT_TYPE_ISSUANCE],
  ['fintekkers.models.security.IndexCompositionProto', IndexCompositionProto, ObjectTypeProto.OBJECT_TYPE_INDEX_COMPOSITION],
  ['fintekkers.models.util.DateRangeProto', DateRangeProto, ObjectTypeProto.OBJECT_TYPE_DATE_RANGE],
  ['fintekkers.models.util.api.API_Key', API_Key, ObjectTypeProto.OBJECT_TYPE_API_KEY],
  ['fintekkers.models.util.lock.NodeState', NodeState, ObjectTypeProto.OBJECT_TYPE_NODE_STATE],
  ['fintekkers.models.util.lock.NodePartition', NodePartition, ObjectTypeProto.OBJECT_TYPE_NODE_PARTITION],
  ['fintekkers.requests.index_composition.CreateIndexCompositionRequestProto', CreateIndexCompositionRequestProto, ObjectTypeProto.OBJECT_TYPE_CREATE_INDEX_COMPOSITION_REQUEST],
  ['fintekkers.requests.index_composition.CreateIndexCompositionResponseProto', CreateIndexCompositionResponseProto, ObjectTypeProto.OBJECT_TYPE_CREATE_INDEX_COMPOSITION_RESPONSE],
  ['fintekkers.requests.index_composition.GetIndexCompositionRequestProto', GetIndexCompositionRequestProto, ObjectTypeProto.OBJECT_TYPE_GET_INDEX_COMPOSITION_REQUEST],
  ['fintekkers.requests.index_composition.GetIndexCompositionResponseProto', GetIndexCompositionResponseProto, ObjectTypeProto.OBJECT_TYPE_GET_INDEX_COMPOSITION_RESPONSE],
  ['fintekkers.requests.portfolio.CreatePortfolioResponseProto', CreatePortfolioResponseProto, ObjectTypeProto.OBJECT_TYPE_CREATE_PORTFOLIO_RESPONSE],
  ['fintekkers.requests.portfolio.QueryPortfolioResponseProto', QueryPortfolioResponseProto, ObjectTypeProto.OBJECT_TYPE_QUERY_PORTFOLIO_RESPONSE],
  ['fintekkers.requests.position.QueryPositionRequestProto', QueryPositionRequestProto, ObjectTypeProto.OBJECT_TYPE_QUERY_POSITION_REQUEST],
  ['fintekkers.requests.position.QueryPositionResponseProto', QueryPositionResponseProto, ObjectTypeProto.OBJECT_TYPE_QUERY_POSITION_RESPONSE],
  ['fintekkers.requests.price.CreatePriceResponseProto', CreatePriceResponseProto, ObjectTypeProto.OBJECT_TYPE_CREATE_PRICE_RESPONSE],
  ['fintekkers.requests.price.QueryPriceResponseProto', QueryPriceResponseProto, ObjectTypeProto.OBJECT_TYPE_QUERY_PRICE_RESPONSE],
  ['fintekkers.requests.security.CreateSecurityResponseProto', CreateSecurityResponseProto, ObjectTypeProto.OBJECT_TYPE_CREATE_SECURITY_RESPONSE],
  ['fintekkers.requests.security.QuerySecurityResponseProto', QuerySecurityResponseProto, ObjectTypeProto.OBJECT_TYPE_QUERY_SECURITY_RESPONSE],
  ['fintekkers.requests.security.GetFieldsResponseProto', GetFieldsResponseProto, ObjectTypeProto.OBJECT_TYPE_GET_FIELDS_RESPONSE],
  ['fintekkers.requests.security.GetFieldValuesRequestProto', GetFieldValuesRequestProto, ObjectTypeProto.OBJECT_TYPE_GET_FIELD_VALUES_REQUEST],
  ['fintekkers.requests.security.GetFieldValuesResponseProto', GetFieldValuesResponseProto, ObjectTypeProto.OBJECT_TYPE_GET_FIELD_VALUES_RESPONSE],
  ['fintekkers.requests.transaction.CreateTransactionResponseProto', CreateTransactionResponseProto, ObjectTypeProto.OBJECT_TYPE_CREATE_TRANSACTION_RESPONSE],
  ['fintekkers.requests.transaction.QueryTransactionResponseProto', QueryTransactionResponseProto, ObjectTypeProto.OBJECT_TYPE_QUERY_TRANSACTION_RESPONSE],
  ['fintekkers.requests.util.DeleteRequestProto', DeleteRequestProto, ObjectTypeProto.OBJECT_TYPE_DELETE_REQUEST],
  ['fintekkers.requests.util.DeleteResponseProto', DeleteResponseProto, ObjectTypeProto.OBJECT_TYPE_DELETE_RESPONSE],
  ['fintekkers.requests.util.lock.LockRequestProto', LockRequestProto, ObjectTypeProto.OBJECT_TYPE_LOCK_REQUEST],
  ['fintekkers.requests.util.lock.LockResponseProto', LockResponseProto, ObjectTypeProto.OBJECT_TYPE_LOCK_RESPONSE],
  ['fintekkers.requests.valuation.ValuationRequestProto', ValuationRequestProto, ObjectTypeProto.OBJECT_TYPE_VALUATION_REQUEST],
  ['fintekkers.requests.valuation.ValuationResponseProto', ValuationResponseProto, ObjectTypeProto.OBJECT_TYPE_VALUATION_RESPONSE],
  ['fintekkers.requests.valuation.CurveRequestProto', CurveRequestProto, ObjectTypeProto.OBJECT_TYPE_CURVE_REQUEST],
  ['fintekkers.requests.valuation.CurveResponseProto', CurveResponseProto, ObjectTypeProto.OBJECT_TYPE_CURVE_RESPONSE],
];

const OWN_TYPES: ReadonlyMap<Function, ObjectTypeProto> = new Map(
  OWN_TYPE_ROWS.map(([, messageClass, objectType]) => [messageClass, objectType]),
);

/** Each message with object_type, by proto full name, to its own ObjectTypeProto value. */
export const OWN_TYPE_NAMES: ReadonlyMap<string, ObjectTypeProto> = new Map(
  OWN_TYPE_ROWS.map(([fullName, , objectType]) => [fullName, objectType]),
);

/** The message's own ObjectTypeProto value, or undefined when its class has none. */
export function ownType(message: object): ObjectTypeProto | undefined {
  return OWN_TYPES.get(message.constructor);
}

/**
 * `stamp` with the message's own ObjectTypeProto value (LM-320); returns it.
 * Throws an Error when its class has no own value. Generated classes are
 * anonymous at runtime, so the error names the class only when it has a name.
 */
export function stampOwn<T extends ObjectTyped>(message: T): T {
  const objectType = ownType(message);
  if (objectType === undefined) {
    throw new Error(`${message.constructor?.name || 'this message type'} has no own ObjectTypeProto`);
  }
  return stamp(message, objectType);
}

/**
 * The message's ObjectTypeProto value; OBJECT_TYPE_UNKNOWN when unset. A value
 * added after this build is returned as its number.
 */
export function readType(message: ObjectTyped): ObjectTypeProto {
  return message.getObjectType();
}

/** The message's [major, minor, patch], or undefined when version is absent. */
export function readVersion(message: ObjectTyped): Version | undefined {
  const version = message.getVersion();
  if (!message.hasVersion() || version === undefined) return undefined;
  return [version.getMajor(), version.getMinor(), version.getPatch()];
}
