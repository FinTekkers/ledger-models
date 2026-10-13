package common.util;

import com.google.protobuf.Descriptors.Descriptor;
import com.google.protobuf.Descriptors.EnumValueDescriptor;
import com.google.protobuf.Descriptors.FieldDescriptor;
import com.google.protobuf.Message;
import com.google.protobuf.MessageOrBuilder;
import fintekkers.models.util.ObjectTypeProto;
import fintekkers.models.util.VersionProto;

import java.util.Optional;

/**
 * Object type and version (LM-297, LM-318).
 *
 * <p>Every message that names its type carries {@code ObjectTypeProto object_type = 1}
 * and {@code VersionProto version = 2}. Writers call {@link #stamp}, which sets the type
 * and {@link #SCHEMA_VERSION}. Readers call {@link #readType} / {@link #readVersion}. The
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
