"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.readVersion = exports.readType = exports.stampOwn = exports.ownType = exports.OWN_TYPE_NAMES = exports.stamp = exports.SCHEMA_VERSION = void 0;
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
const object_type_pb_1 = require("../../fintekkers/models/util/object_type_pb");
const version_pb_1 = require("../../fintekkers/models/util/version_pb");
const portfolio_pb_1 = require("../../fintekkers/models/portfolio/portfolio_pb");
const position_pb_1 = require("../../fintekkers/models/position/position_pb");
const position_filter_pb_1 = require("../../fintekkers/models/position/position_filter_pb");
const price_pb_1 = require("../../fintekkers/models/price/price_pb");
const issuance_pb_1 = require("../../fintekkers/models/security/bond/issuance_pb");
const identifier_pb_1 = require("../../fintekkers/models/security/identifier/identifier_pb");
const index_composition_pb_1 = require("../../fintekkers/models/security/index_composition_pb");
const security_pb_1 = require("../../fintekkers/models/security/security_pb");
const tenor_pb_1 = require("../../fintekkers/models/security/tenor_pb");
const strategy_pb_1 = require("../../fintekkers/models/strategy/strategy_pb");
const strategy_allocation_pb_1 = require("../../fintekkers/models/strategy/strategy_allocation_pb");
const transaction_pb_1 = require("../../fintekkers/models/transaction/transaction_pb");
const api_key_pb_1 = require("../../fintekkers/models/util/api/api_key_pb");
const date_range_pb_1 = require("../../fintekkers/models/util/date_range_pb");
const node_partition_pb_1 = require("../../fintekkers/models/util/lock/node_partition_pb");
const node_state_pb_1 = require("../../fintekkers/models/util/lock/node_state_pb");
const create_index_composition_request_pb_1 = require("../../fintekkers/requests/index_composition/create_index_composition_request_pb");
const get_index_composition_request_pb_1 = require("../../fintekkers/requests/index_composition/get_index_composition_request_pb");
const create_portfolio_request_pb_1 = require("../../fintekkers/requests/portfolio/create_portfolio_request_pb");
const create_portfolio_response_pb_1 = require("../../fintekkers/requests/portfolio/create_portfolio_response_pb");
const query_portfolio_request_pb_1 = require("../../fintekkers/requests/portfolio/query_portfolio_request_pb");
const query_portfolio_response_pb_1 = require("../../fintekkers/requests/portfolio/query_portfolio_response_pb");
const query_position_request_pb_1 = require("../../fintekkers/requests/position/query_position_request_pb");
const query_position_response_pb_1 = require("../../fintekkers/requests/position/query_position_response_pb");
const create_price_request_pb_1 = require("../../fintekkers/requests/price/create_price_request_pb");
const create_price_response_pb_1 = require("../../fintekkers/requests/price/create_price_response_pb");
const query_price_request_pb_1 = require("../../fintekkers/requests/price/query_price_request_pb");
const query_price_response_pb_1 = require("../../fintekkers/requests/price/query_price_response_pb");
const create_security_request_pb_1 = require("../../fintekkers/requests/security/create_security_request_pb");
const create_security_response_pb_1 = require("../../fintekkers/requests/security/create_security_response_pb");
const get_field_values_request_pb_1 = require("../../fintekkers/requests/security/get_field_values_request_pb");
const get_field_values_response_pb_1 = require("../../fintekkers/requests/security/get_field_values_response_pb");
const get_fields_response_pb_1 = require("../../fintekkers/requests/security/get_fields_response_pb");
const query_security_request_pb_1 = require("../../fintekkers/requests/security/query_security_request_pb");
const query_security_response_pb_1 = require("../../fintekkers/requests/security/query_security_response_pb");
const create_transaction_request_pb_1 = require("../../fintekkers/requests/transaction/create_transaction_request_pb");
const create_transaction_response_pb_1 = require("../../fintekkers/requests/transaction/create_transaction_response_pb");
const query_transaction_request_pb_1 = require("../../fintekkers/requests/transaction/query_transaction_request_pb");
const query_transaction_response_pb_1 = require("../../fintekkers/requests/transaction/query_transaction_response_pb");
const delete_request_pb_1 = require("../../fintekkers/requests/util/delete_request_pb");
const lock_request_pb_1 = require("../../fintekkers/requests/util/lock/lock_request_pb");
const lock_response_pb_1 = require("../../fintekkers/requests/util/lock/lock_response_pb");
const curve_request_pb_1 = require("../../fintekkers/requests/valuation/curve_request_pb");
const curve_response_pb_1 = require("../../fintekkers/requests/valuation/curve_response_pb");
const valuation_request_pb_1 = require("../../fintekkers/requests/valuation/valuation_request_pb");
const valuation_response_pb_1 = require("../../fintekkers/requests/valuation/valuation_response_pb");
/** The schema version `stamp` writes. Not the library release. */
exports.SCHEMA_VERSION = [0, 0, 1];
/**
 * Sets object_type and version (`SCHEMA_VERSION`) on `message`; returns it.
 * `objectType` is the message's own ObjectTypeProto value.
 */
function stamp(message, objectType) {
    const [major, minor, patch] = exports.SCHEMA_VERSION;
    message.setObjectType(objectType);
    message.setVersion(new version_pb_1.VersionProto().setMajor(major).setMinor(minor).setPatch(patch));
    return message;
}
exports.stamp = stamp;
// Each message with object_type: proto full name, generated class, its own
// ObjectTypeProto value (LM-320). object-type-coverage.test.ts fails when a
// message in the descriptor set is missing.
const OWN_TYPE_ROWS = [
    ['fintekkers.models.portfolio.PortfolioProto', portfolio_pb_1.PortfolioProto, object_type_pb_1.ObjectTypeProto.OBJECT_TYPE_PORTFOLIO],
    ['fintekkers.models.position.PositionProto', position_pb_1.PositionProto, object_type_pb_1.ObjectTypeProto.OBJECT_TYPE_POSITION],
    ['fintekkers.models.position.PositionFilterProto', position_filter_pb_1.PositionFilterProto, object_type_pb_1.ObjectTypeProto.OBJECT_TYPE_POSITION_FILTER],
    ['fintekkers.models.price.PriceProto', price_pb_1.PriceProto, object_type_pb_1.ObjectTypeProto.OBJECT_TYPE_PRICE],
    ['fintekkers.models.security.IdentifierProto', identifier_pb_1.IdentifierProto, object_type_pb_1.ObjectTypeProto.OBJECT_TYPE_IDENTIFIER],
    ['fintekkers.models.security.SecurityProto', security_pb_1.SecurityProto, object_type_pb_1.ObjectTypeProto.OBJECT_TYPE_SECURITY],
    ['fintekkers.models.security.TenorProto', tenor_pb_1.TenorProto, object_type_pb_1.ObjectTypeProto.OBJECT_TYPE_TENOR],
    ['fintekkers.models.strategy.StrategyProto', strategy_pb_1.StrategyProto, object_type_pb_1.ObjectTypeProto.OBJECT_TYPE_STRATEGY],
    ['fintekkers.models.strategy.StrategyAllocationProto', strategy_allocation_pb_1.StrategyAllocationProto, object_type_pb_1.ObjectTypeProto.OBJECT_TYPE_STRATEGY_ALLOCATION],
    ['fintekkers.models.transaction.TransactionProto', transaction_pb_1.TransactionProto, object_type_pb_1.ObjectTypeProto.OBJECT_TYPE_TRANSACTION],
    ['fintekkers.requests.portfolio.CreatePortfolioRequestProto', create_portfolio_request_pb_1.CreatePortfolioRequestProto, object_type_pb_1.ObjectTypeProto.OBJECT_TYPE_CREATE_PORTFOLIO_REQUEST],
    ['fintekkers.requests.portfolio.QueryPortfolioRequestProto', query_portfolio_request_pb_1.QueryPortfolioRequestProto, object_type_pb_1.ObjectTypeProto.OBJECT_TYPE_QUERY_PORTFOLIO_REQUEST],
    ['fintekkers.requests.price.CreatePriceRequestProto', create_price_request_pb_1.CreatePriceRequestProto, object_type_pb_1.ObjectTypeProto.OBJECT_TYPE_CREATE_PRICE_REQUEST],
    ['fintekkers.requests.price.QueryPriceRequestProto', query_price_request_pb_1.QueryPriceRequestProto, object_type_pb_1.ObjectTypeProto.OBJECT_TYPE_QUERY_PRICE_REQUEST],
    ['fintekkers.requests.security.CreateSecurityRequestProto', create_security_request_pb_1.CreateSecurityRequestProto, object_type_pb_1.ObjectTypeProto.OBJECT_TYPE_CREATE_SECURITY_REQUEST],
    ['fintekkers.requests.security.QuerySecurityRequestProto', query_security_request_pb_1.QuerySecurityRequestProto, object_type_pb_1.ObjectTypeProto.OBJECT_TYPE_QUERY_SECURITY_REQUEST],
    ['fintekkers.requests.transaction.CreateTransactionRequestProto', create_transaction_request_pb_1.CreateTransactionRequestProto, object_type_pb_1.ObjectTypeProto.OBJECT_TYPE_CREATE_TRANSACTION_REQUEST],
    ['fintekkers.requests.transaction.QueryTransactionRequestProto', query_transaction_request_pb_1.QueryTransactionRequestProto, object_type_pb_1.ObjectTypeProto.OBJECT_TYPE_QUERY_TRANSACTION_REQUEST],
    // LM-320: the rest of the messages with object_type.
    ['fintekkers.models.security.bond.IssuanceProto', issuance_pb_1.IssuanceProto, object_type_pb_1.ObjectTypeProto.OBJECT_TYPE_ISSUANCE],
    ['fintekkers.models.security.IndexCompositionProto', index_composition_pb_1.IndexCompositionProto, object_type_pb_1.ObjectTypeProto.OBJECT_TYPE_INDEX_COMPOSITION],
    ['fintekkers.models.util.DateRangeProto', date_range_pb_1.DateRangeProto, object_type_pb_1.ObjectTypeProto.OBJECT_TYPE_DATE_RANGE],
    ['fintekkers.models.util.api.API_Key', api_key_pb_1.API_Key, object_type_pb_1.ObjectTypeProto.OBJECT_TYPE_API_KEY],
    ['fintekkers.models.util.lock.NodeState', node_state_pb_1.NodeState, object_type_pb_1.ObjectTypeProto.OBJECT_TYPE_NODE_STATE],
    ['fintekkers.models.util.lock.NodePartition', node_partition_pb_1.NodePartition, object_type_pb_1.ObjectTypeProto.OBJECT_TYPE_NODE_PARTITION],
    ['fintekkers.requests.index_composition.CreateIndexCompositionRequestProto', create_index_composition_request_pb_1.CreateIndexCompositionRequestProto, object_type_pb_1.ObjectTypeProto.OBJECT_TYPE_CREATE_INDEX_COMPOSITION_REQUEST],
    ['fintekkers.requests.index_composition.CreateIndexCompositionResponseProto', create_index_composition_request_pb_1.CreateIndexCompositionResponseProto, object_type_pb_1.ObjectTypeProto.OBJECT_TYPE_CREATE_INDEX_COMPOSITION_RESPONSE],
    ['fintekkers.requests.index_composition.GetIndexCompositionRequestProto', get_index_composition_request_pb_1.GetIndexCompositionRequestProto, object_type_pb_1.ObjectTypeProto.OBJECT_TYPE_GET_INDEX_COMPOSITION_REQUEST],
    ['fintekkers.requests.index_composition.GetIndexCompositionResponseProto', get_index_composition_request_pb_1.GetIndexCompositionResponseProto, object_type_pb_1.ObjectTypeProto.OBJECT_TYPE_GET_INDEX_COMPOSITION_RESPONSE],
    ['fintekkers.requests.portfolio.CreatePortfolioResponseProto', create_portfolio_response_pb_1.CreatePortfolioResponseProto, object_type_pb_1.ObjectTypeProto.OBJECT_TYPE_CREATE_PORTFOLIO_RESPONSE],
    ['fintekkers.requests.portfolio.QueryPortfolioResponseProto', query_portfolio_response_pb_1.QueryPortfolioResponseProto, object_type_pb_1.ObjectTypeProto.OBJECT_TYPE_QUERY_PORTFOLIO_RESPONSE],
    ['fintekkers.requests.position.QueryPositionRequestProto', query_position_request_pb_1.QueryPositionRequestProto, object_type_pb_1.ObjectTypeProto.OBJECT_TYPE_QUERY_POSITION_REQUEST],
    ['fintekkers.requests.position.QueryPositionResponseProto', query_position_response_pb_1.QueryPositionResponseProto, object_type_pb_1.ObjectTypeProto.OBJECT_TYPE_QUERY_POSITION_RESPONSE],
    ['fintekkers.requests.price.CreatePriceResponseProto', create_price_response_pb_1.CreatePriceResponseProto, object_type_pb_1.ObjectTypeProto.OBJECT_TYPE_CREATE_PRICE_RESPONSE],
    ['fintekkers.requests.price.QueryPriceResponseProto', query_price_response_pb_1.QueryPriceResponseProto, object_type_pb_1.ObjectTypeProto.OBJECT_TYPE_QUERY_PRICE_RESPONSE],
    ['fintekkers.requests.security.CreateSecurityResponseProto', create_security_response_pb_1.CreateSecurityResponseProto, object_type_pb_1.ObjectTypeProto.OBJECT_TYPE_CREATE_SECURITY_RESPONSE],
    ['fintekkers.requests.security.QuerySecurityResponseProto', query_security_response_pb_1.QuerySecurityResponseProto, object_type_pb_1.ObjectTypeProto.OBJECT_TYPE_QUERY_SECURITY_RESPONSE],
    ['fintekkers.requests.security.GetFieldsResponseProto', get_fields_response_pb_1.GetFieldsResponseProto, object_type_pb_1.ObjectTypeProto.OBJECT_TYPE_GET_FIELDS_RESPONSE],
    ['fintekkers.requests.security.GetFieldValuesRequestProto', get_field_values_request_pb_1.GetFieldValuesRequestProto, object_type_pb_1.ObjectTypeProto.OBJECT_TYPE_GET_FIELD_VALUES_REQUEST],
    ['fintekkers.requests.security.GetFieldValuesResponseProto', get_field_values_response_pb_1.GetFieldValuesResponseProto, object_type_pb_1.ObjectTypeProto.OBJECT_TYPE_GET_FIELD_VALUES_RESPONSE],
    ['fintekkers.requests.transaction.CreateTransactionResponseProto', create_transaction_response_pb_1.CreateTransactionResponseProto, object_type_pb_1.ObjectTypeProto.OBJECT_TYPE_CREATE_TRANSACTION_RESPONSE],
    ['fintekkers.requests.transaction.QueryTransactionResponseProto', query_transaction_response_pb_1.QueryTransactionResponseProto, object_type_pb_1.ObjectTypeProto.OBJECT_TYPE_QUERY_TRANSACTION_RESPONSE],
    ['fintekkers.requests.util.DeleteRequestProto', delete_request_pb_1.DeleteRequestProto, object_type_pb_1.ObjectTypeProto.OBJECT_TYPE_DELETE_REQUEST],
    ['fintekkers.requests.util.DeleteResponseProto', delete_request_pb_1.DeleteResponseProto, object_type_pb_1.ObjectTypeProto.OBJECT_TYPE_DELETE_RESPONSE],
    ['fintekkers.requests.util.lock.LockRequestProto', lock_request_pb_1.LockRequestProto, object_type_pb_1.ObjectTypeProto.OBJECT_TYPE_LOCK_REQUEST],
    ['fintekkers.requests.util.lock.LockResponseProto', lock_response_pb_1.LockResponseProto, object_type_pb_1.ObjectTypeProto.OBJECT_TYPE_LOCK_RESPONSE],
    ['fintekkers.requests.valuation.ValuationRequestProto', valuation_request_pb_1.ValuationRequestProto, object_type_pb_1.ObjectTypeProto.OBJECT_TYPE_VALUATION_REQUEST],
    ['fintekkers.requests.valuation.ValuationResponseProto', valuation_response_pb_1.ValuationResponseProto, object_type_pb_1.ObjectTypeProto.OBJECT_TYPE_VALUATION_RESPONSE],
    ['fintekkers.requests.valuation.CurveRequestProto', curve_request_pb_1.CurveRequestProto, object_type_pb_1.ObjectTypeProto.OBJECT_TYPE_CURVE_REQUEST],
    ['fintekkers.requests.valuation.CurveResponseProto', curve_response_pb_1.CurveResponseProto, object_type_pb_1.ObjectTypeProto.OBJECT_TYPE_CURVE_RESPONSE],
];
const OWN_TYPES = new Map(OWN_TYPE_ROWS.map(([, messageClass, objectType]) => [messageClass, objectType]));
/** Each message with object_type, by proto full name, to its own ObjectTypeProto value. */
exports.OWN_TYPE_NAMES = new Map(OWN_TYPE_ROWS.map(([fullName, , objectType]) => [fullName, objectType]));
/** The message's own ObjectTypeProto value, or undefined when its class has none. */
function ownType(message) {
    return OWN_TYPES.get(message.constructor);
}
exports.ownType = ownType;
/**
 * `stamp` with the message's own ObjectTypeProto value (LM-320); returns it.
 * Throws an Error when its class has no own value. Generated classes are
 * anonymous at runtime, so the error names the class only when it has a name.
 */
function stampOwn(message) {
    var _a;
    const objectType = ownType(message);
    if (objectType === undefined) {
        throw new Error(`${((_a = message.constructor) === null || _a === void 0 ? void 0 : _a.name) || 'this message type'} has no own ObjectTypeProto`);
    }
    return stamp(message, objectType);
}
exports.stampOwn = stampOwn;
/**
 * The message's ObjectTypeProto value; OBJECT_TYPE_UNKNOWN when unset. A value
 * added after this build is returned as its number.
 */
function readType(message) {
    return message.getObjectType();
}
exports.readType = readType;
/** The message's [major, minor, patch], or undefined when version is absent. */
function readVersion(message) {
    const version = message.getVersion();
    if (!message.hasVersion() || version === undefined)
        return undefined;
    return [version.getMajor(), version.getMinor(), version.getPatch()];
}
exports.readVersion = readVersion;
//# sourceMappingURL=object-types.js.map