package common.util;

import com.google.protobuf.Descriptors.Descriptor;
import com.google.protobuf.Descriptors.EnumValueDescriptor;
import com.google.protobuf.Descriptors.FieldDescriptor;
import com.google.protobuf.Message;
import com.google.protobuf.MessageOrBuilder;
import fintekkers.models.util.ObjectTypeProto;
import fintekkers.models.util.VersionProto;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

/**
 * Object type and version (LM-297, LM-318).
 *
 * <p>Every message that names its type carries {@code ObjectTypeProto object_type = 1}
 * and {@code VersionProto version = 2}. Writers call {@link #stamp}, which sets the type
 * and {@link #SCHEMA_VERSION}; {@link #stampOwn} passes the message's own type (LM-320).
 * Readers call {@link #readType} / {@link #readVersion}. The
 * old {@code object_class} / {@code version} strings were replaced in place by LM-318:
 * bytes written before it are not readable.
 *
 * <p>Fields are reached through the descriptor by number, so this works on every such
 * message. See docs/adr/compact_object_type_and_version.md.
 */
public final class ObjectTypes {

    private static final int OBJECT_TYPE = 1;
    private static final int VERSION = 2;

    /** The schema version {@link #stamp} writes. Not the library release. */
    public static final VersionProto SCHEMA_VERSION = VersionProto.newBuilder().setMajor(0).setMinor(0).setPatch(1).build();

    /**
     * Each message with object_type, by proto full name, to its own ObjectTypeProto value
     * (LM-320). ObjectTypeCoverageTest fails when a message in the descriptor set is missing.
     */
    private static final Map<String, ObjectTypeProto> OWN_TYPES = new HashMap<>();

    static {
        own(fintekkers.models.portfolio.PortfolioProto.getDescriptor(), ObjectTypeProto.OBJECT_TYPE_PORTFOLIO);
        own(fintekkers.models.position.PositionProto.getDescriptor(), ObjectTypeProto.OBJECT_TYPE_POSITION);
        own(fintekkers.models.position.PositionFilterProto.getDescriptor(), ObjectTypeProto.OBJECT_TYPE_POSITION_FILTER);
        own(fintekkers.models.price.PriceProto.getDescriptor(), ObjectTypeProto.OBJECT_TYPE_PRICE);
        own(fintekkers.models.security.IdentifierProto.getDescriptor(), ObjectTypeProto.OBJECT_TYPE_IDENTIFIER);
        own(fintekkers.models.security.SecurityProto.getDescriptor(), ObjectTypeProto.OBJECT_TYPE_SECURITY);
        own(fintekkers.models.security.TenorProto.getDescriptor(), ObjectTypeProto.OBJECT_TYPE_TENOR);
        own(fintekkers.models.strategy.StrategyProto.getDescriptor(), ObjectTypeProto.OBJECT_TYPE_STRATEGY);
        own(fintekkers.models.strategy.StrategyAllocationProto.getDescriptor(), ObjectTypeProto.OBJECT_TYPE_STRATEGY_ALLOCATION);
        own(fintekkers.models.transaction.TransactionProto.getDescriptor(), ObjectTypeProto.OBJECT_TYPE_TRANSACTION);
        own(fintekkers.requests.portfolio.CreatePortfolioRequestProto.getDescriptor(), ObjectTypeProto.OBJECT_TYPE_CREATE_PORTFOLIO_REQUEST);
        own(fintekkers.requests.portfolio.QueryPortfolioRequestProto.getDescriptor(), ObjectTypeProto.OBJECT_TYPE_QUERY_PORTFOLIO_REQUEST);
        own(fintekkers.requests.price.CreatePriceRequestProto.getDescriptor(), ObjectTypeProto.OBJECT_TYPE_CREATE_PRICE_REQUEST);
        own(fintekkers.requests.price.QueryPriceRequestProto.getDescriptor(), ObjectTypeProto.OBJECT_TYPE_QUERY_PRICE_REQUEST);
        own(fintekkers.requests.security.CreateSecurityRequestProto.getDescriptor(), ObjectTypeProto.OBJECT_TYPE_CREATE_SECURITY_REQUEST);
        own(fintekkers.requests.security.QuerySecurityRequestProto.getDescriptor(), ObjectTypeProto.OBJECT_TYPE_QUERY_SECURITY_REQUEST);
        own(fintekkers.requests.transaction.CreateTransactionRequestProto.getDescriptor(), ObjectTypeProto.OBJECT_TYPE_CREATE_TRANSACTION_REQUEST);
        own(fintekkers.requests.transaction.QueryTransactionRequestProto.getDescriptor(), ObjectTypeProto.OBJECT_TYPE_QUERY_TRANSACTION_REQUEST);
        // LM-320: the rest of the messages with object_type.
        own(fintekkers.models.security.bond.IssuanceProto.getDescriptor(), ObjectTypeProto.OBJECT_TYPE_ISSUANCE);
        own(fintekkers.models.security.IndexCompositionProto.getDescriptor(), ObjectTypeProto.OBJECT_TYPE_INDEX_COMPOSITION);
        own(fintekkers.models.util.DateRange.DateRangeProto.getDescriptor(), ObjectTypeProto.OBJECT_TYPE_DATE_RANGE);
        own(fintekkers.models.util.api.ApiKey.API_Key.getDescriptor(), ObjectTypeProto.OBJECT_TYPE_API_KEY);
        own(fintekkers.models.util.lock.NodeStateOuterClass.NodeState.getDescriptor(), ObjectTypeProto.OBJECT_TYPE_NODE_STATE);
        own(fintekkers.models.util.lock.NodePartitionOuterClass.NodePartition.getDescriptor(), ObjectTypeProto.OBJECT_TYPE_NODE_PARTITION);
        own(fintekkers.requests.index_composition.CreateIndexCompositionRequestProto.getDescriptor(), ObjectTypeProto.OBJECT_TYPE_CREATE_INDEX_COMPOSITION_REQUEST);
        own(fintekkers.requests.index_composition.CreateIndexCompositionResponseProto.getDescriptor(), ObjectTypeProto.OBJECT_TYPE_CREATE_INDEX_COMPOSITION_RESPONSE);
        own(fintekkers.requests.index_composition.GetIndexCompositionRequestProto.getDescriptor(), ObjectTypeProto.OBJECT_TYPE_GET_INDEX_COMPOSITION_REQUEST);
        own(fintekkers.requests.index_composition.GetIndexCompositionResponseProto.getDescriptor(), ObjectTypeProto.OBJECT_TYPE_GET_INDEX_COMPOSITION_RESPONSE);
        own(fintekkers.requests.portfolio.CreatePortfolioResponseProto.getDescriptor(), ObjectTypeProto.OBJECT_TYPE_CREATE_PORTFOLIO_RESPONSE);
        own(fintekkers.requests.portfolio.QueryPortfolioResponseProto.getDescriptor(), ObjectTypeProto.OBJECT_TYPE_QUERY_PORTFOLIO_RESPONSE);
        own(fintekkers.requests.position.QueryPositionRequestProto.getDescriptor(), ObjectTypeProto.OBJECT_TYPE_QUERY_POSITION_REQUEST);
        own(fintekkers.requests.position.QueryPositionResponseProto.getDescriptor(), ObjectTypeProto.OBJECT_TYPE_QUERY_POSITION_RESPONSE);
        own(fintekkers.requests.price.CreatePriceResponseProto.getDescriptor(), ObjectTypeProto.OBJECT_TYPE_CREATE_PRICE_RESPONSE);
        own(fintekkers.requests.price.QueryPriceResponseProto.getDescriptor(), ObjectTypeProto.OBJECT_TYPE_QUERY_PRICE_RESPONSE);
        own(fintekkers.requests.security.CreateSecurityResponseProto.getDescriptor(), ObjectTypeProto.OBJECT_TYPE_CREATE_SECURITY_RESPONSE);
        own(fintekkers.requests.security.QuerySecurityResponseProto.getDescriptor(), ObjectTypeProto.OBJECT_TYPE_QUERY_SECURITY_RESPONSE);
        own(fintekkers.requests.security.GetFieldsResponseProto.getDescriptor(), ObjectTypeProto.OBJECT_TYPE_GET_FIELDS_RESPONSE);
        own(fintekkers.requests.security.GetFieldValuesRequestProto.getDescriptor(), ObjectTypeProto.OBJECT_TYPE_GET_FIELD_VALUES_REQUEST);
        own(fintekkers.requests.security.GetFieldValuesResponseProto.getDescriptor(), ObjectTypeProto.OBJECT_TYPE_GET_FIELD_VALUES_RESPONSE);
        own(fintekkers.requests.transaction.CreateTransactionResponseProto.getDescriptor(), ObjectTypeProto.OBJECT_TYPE_CREATE_TRANSACTION_RESPONSE);
        own(fintekkers.requests.transaction.QueryTransactionResponseProto.getDescriptor(), ObjectTypeProto.OBJECT_TYPE_QUERY_TRANSACTION_RESPONSE);
        own(fintekkers.requests.util.DeleteRequestProto.getDescriptor(), ObjectTypeProto.OBJECT_TYPE_DELETE_REQUEST);
        own(fintekkers.requests.util.DeleteResponseProto.getDescriptor(), ObjectTypeProto.OBJECT_TYPE_DELETE_RESPONSE);
        own(fintekkers.requests.util.lock.LockRequestProto.getDescriptor(), ObjectTypeProto.OBJECT_TYPE_LOCK_REQUEST);
        own(fintekkers.requests.util.lock.LockResponseProto.getDescriptor(), ObjectTypeProto.OBJECT_TYPE_LOCK_RESPONSE);
        own(fintekkers.requests.valuation.ValuationRequestProto.getDescriptor(), ObjectTypeProto.OBJECT_TYPE_VALUATION_REQUEST);
        own(fintekkers.requests.valuation.ValuationResponseProto.getDescriptor(), ObjectTypeProto.OBJECT_TYPE_VALUATION_RESPONSE);
        own(fintekkers.requests.valuation.CurveRequestProto.getDescriptor(), ObjectTypeProto.OBJECT_TYPE_CURVE_REQUEST);
        own(fintekkers.requests.valuation.CurveResponseProto.getDescriptor(), ObjectTypeProto.OBJECT_TYPE_CURVE_RESPONSE);
    }

    private static void own(Descriptor d, ObjectTypeProto type) {
        OWN_TYPES.put(d.getFullName(), type);
    }

    private ObjectTypes() {
    }

    /**
     * Sets object_type and version ({@link #SCHEMA_VERSION}) on {@code builder}; returns it.
     * {@code type} is the message's own ObjectTypeProto value.
     */
    public static <B extends Message.Builder> B stamp(B builder, ObjectTypeProto type) {
        Descriptor d = builder.getDescriptorForType();
        builder.setField(field(d, OBJECT_TYPE), type.getValueDescriptor());
        builder.setField(field(d, VERSION), SCHEMA_VERSION);
        return builder;
    }

    /** The own ObjectTypeProto value of the message type {@code d}, or empty when it has none. */
    public static Optional<ObjectTypeProto> ownType(Descriptor d) {
        return Optional.ofNullable(OWN_TYPES.get(d.getFullName()));
    }

    /**
     * {@link #stamp} with the message's own ObjectTypeProto value (LM-320).
     *
     * @throws IllegalArgumentException when the message type has no own ObjectTypeProto value
     */
    public static <B extends Message.Builder> B stampOwn(B builder) {
        Descriptor d = builder.getDescriptorForType();
        ObjectTypeProto type = ownType(d)
                .orElseThrow(() -> new IllegalArgumentException(d.getFullName() + " has no own ObjectTypeProto"));
        return stamp(builder, type);
    }

    /**
     * The message's ObjectTypeProto value: OBJECT_TYPE_UNKNOWN when unset, UNRECOGNIZED
     * for a value added after this build.
     */
    public static ObjectTypeProto readType(MessageOrBuilder message) {
        EnumValueDescriptor value = (EnumValueDescriptor) message.getField(field(message.getDescriptorForType(), OBJECT_TYPE));
        ObjectTypeProto type = ObjectTypeProto.forNumber(value.getNumber());
        return type == null ? ObjectTypeProto.UNRECOGNIZED : type;
    }

    /** The message's version, or empty when the version field is absent. */
    public static Optional<VersionProto> readVersion(MessageOrBuilder message) {
        FieldDescriptor f = field(message.getDescriptorForType(), VERSION);
        return message.hasField(f) ? Optional.of((VersionProto) message.getField(f)) : Optional.empty();
    }

    private static FieldDescriptor field(Descriptor d, int number) {
        FieldDescriptor f = d.findFieldByNumber(number);
        boolean expected = number == OBJECT_TYPE
                ? f != null && f.getType() == FieldDescriptor.Type.ENUM
                        && f.getEnumType() == ObjectTypeProto.getDescriptor()
                : f != null && f.getType() == FieldDescriptor.Type.MESSAGE
                        && f.getMessageType() == VersionProto.getDescriptor();
        if (!expected) {
            throw new IllegalArgumentException(d.getFullName() + " has no object_type / version at field " + number);
        }
        return f;
    }
}
