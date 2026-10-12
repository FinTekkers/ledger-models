package common.util;

import com.google.protobuf.Descriptors.Descriptor;
import com.google.protobuf.Descriptors.EnumValueDescriptor;
import com.google.protobuf.Descriptors.FieldDescriptor;
import com.google.protobuf.Message;
import com.google.protobuf.MessageOrBuilder;
import fintekkers.models.util.ObjectTypeProto;
import fintekkers.models.util.ObjectTypeProtos;

import java.util.Collections;
import java.util.HashMap;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.logging.Logger;
import java.util.regex.Pattern;

/**
 * Compact object type and version (LM-297), stage 1: write both forms, read the new one.
 *
 * <p>Every message with {@code string object_class = 1} and {@code string version = 2}
 * also carries {@code ObjectTypeProto object_type = 1001} and {@code uint32
 * version_major / version_minor / version_patch = 1002-1004}. Writers call
 * {@link #stamp}, which sets the strings and the new fields. Readers call
 * {@link #readType} / {@link #readVersion} (or {@link #upgrade}), which use the
 * new fields and fall back to the deprecated strings, logging one warning per
 * distinct pair of strings. A fallback never throws: an unknown object_class
 * gives {@code OBJECT_TYPE_UNKNOWN} and a malformed version gives 0.0.0. Empty
 * strings are the proto3 default and fall back silently.
 *
 * <p>Fields are reached through the descriptor by number, so this works on
 * every such message and never touches the deprecated generated accessors.
 * See docs/adr/compact_object_type_and_version.md.
 */
public final class ObjectTypes {

    private static final Logger LOG = Logger.getLogger(ObjectTypes.class.getName());

    private static final int OBJECT_CLASS = 1;
    private static final int VERSION = 2;
    private static final int OBJECT_TYPE = 1001;
    private static final int VERSION_MAJOR = 1002;
    private static final int VERSION_MINOR = 1003;
    private static final int VERSION_PATCH = 1004;

    private static final Pattern VERSION_PATTERN = Pattern.compile("[0-9]+\\.[0-9]+\\.[0-9]+");
    private static final long UINT32_MAX = 0xFFFFFFFFL;

    private static final Map<String, ObjectTypeProto> LEGACY = legacyMap();
    private static final String PREFIX = ObjectTypeProto.OBJECT_TYPE_UNKNOWN.name()
            .substring(0, ObjectTypeProto.OBJECT_TYPE_UNKNOWN.name().length() - "UNKNOWN".length());
    private static final Pattern CAMEL_BOUNDARY = Pattern.compile("(?<=[a-z0-9])(?=[A-Z])|(?<=[A-Z])(?=[A-Z][a-z])");
    private static final Set<String> WARNED = ConcurrentHashMap.newKeySet();

    /** major.minor.patch, each a uint32 held in an int as protobuf does. */
    public static final class Version {
        public final int major;
        public final int minor;
        public final int patch;

        public Version(int major, int minor, int patch) {
            this.major = major;
            this.minor = minor;
            this.patch = patch;
        }

        boolean isZero() {
            return major == 0 && minor == 0 && patch == 0;
        }

        @Override
        public boolean equals(Object o) {
            if (!(o instanceof Version)) return false;
            Version v = (Version) o;
            return major == v.major && minor == v.minor && patch == v.patch;
        }

        @Override
        public int hashCode() {
            return (major * 31 + minor) * 31 + patch;
        }

        @Override
        public String toString() {
            return Integer.toUnsignedString(major) + "." + Integer.toUnsignedString(minor) + "."
                    + Integer.toUnsignedString(patch);
        }
    }

    public static final Version ZERO = new Version(0, 0, 0);

    private ObjectTypes() {
    }

    private static Map<String, ObjectTypeProto> legacyMap() {
        Map<String, ObjectTypeProto> map = new HashMap<>();
        for (EnumValueDescriptor value : ObjectTypeProto.getDescriptor().getValues()) {
            for (String legacy : value.getOptions().getExtension(ObjectTypeProtos.legacyObjectClass)) {
                map.put(legacy, ObjectTypeProto.valueOf(value));
            }
        }
        return Collections.unmodifiableMap(map);
    }

    /** The ObjectTypeProto value an object_class string stands for, or OBJECT_TYPE_UNKNOWN. */
    public static ObjectTypeProto fromLegacy(String objectClass) {
        return LEGACY.getOrDefault(objectClass, ObjectTypeProto.OBJECT_TYPE_UNKNOWN);
    }

    /**
     * The ObjectTypeProto value named for a message type, or OBJECT_TYPE_UNKNOWN. Uses the
     * enum's naming rule: {@code QuerySecurityRequestProto} to OBJECT_TYPE_QUERY_SECURITY_REQUEST.
     */
    public static ObjectTypeProto ownType(String messageName) {
        String base = messageName.endsWith("Proto")
                ? messageName.substring(0, messageName.length() - "Proto".length())
                : messageName;
        String snake = CAMEL_BOUNDARY.matcher(base).replaceAll("_").toUpperCase(Locale.ROOT);
        EnumValueDescriptor value = ObjectTypeProto.getDescriptor().findValueByName(PREFIX + snake);
        return value == null ? ObjectTypeProto.OBJECT_TYPE_UNKNOWN : ObjectTypeProto.valueOf(value);
    }

    /** "1.2.3" to 1/2/3; null unless exactly three decimal uint32 parts. */
    public static Version parseVersion(String version) {
        if (version == null || !VERSION_PATTERN.matcher(version).matches()) {
            return null;
        }
        String[] parts = version.split("\\.");
        int[] values = new int[3];
        for (int i = 0; i < 3; i++) {
            // At most 10 digits fit a long; longer is out of range anyway.
            if (parts[i].length() > 10 || Long.parseLong(parts[i]) > UINT32_MAX) {
                return null;
            }
            values[i] = (int) Long.parseLong(parts[i]);
        }
        return new Version(values[0], values[1], values[2]);
    }

    /**
     * Sets object_class / version and their compact form on {@code builder}; returns it.
     * {@code type} is the message's own ObjectTypeProto value. {@code version} must be
     * empty or three uint32 parts.
     */
    public static <B extends Message.Builder> B stamp(B builder, ObjectTypeProto type, String objectClass, String version) {
        Version parts = version.isEmpty() ? ZERO : parseVersion(version);
        if (parts == null) {
            throw new IllegalArgumentException("version must be MAJOR.MINOR.PATCH, got '" + version + "'");
        }
        Descriptor d = builder.getDescriptorForType();
        builder.setField(field(d, OBJECT_CLASS), objectClass);
        builder.setField(field(d, VERSION), version);
        builder.setField(field(d, OBJECT_TYPE), type.getValueDescriptor());
        setVersion(builder, parts);
        return builder;
    }

    /** The message's ObjectTypeProto value: object_type, else the object_class string. */
    public static ObjectTypeProto readType(MessageOrBuilder message) {
        return decode(message).type;
    }

    /** The message's version: the compact fields, else the version string. */
    public static Version readVersion(MessageOrBuilder message) {
        return decode(message).version;
    }

    /**
     * Returns {@code message} with the compact fields filled from the strings where
     * they are unset. The strings are kept, so re-serialising writes both forms.
     */
    @SuppressWarnings("unchecked")
    public static <M extends Message> M upgrade(M message) {
        Decoded decoded = decode(message);
        Message.Builder builder = message.toBuilder();
        Descriptor d = builder.getDescriptorForType();
        // Only fill what is unset: a set value, even one this build doesn't know, is kept.
        if (((EnumValueDescriptor) message.getField(field(d, OBJECT_TYPE))).getNumber() == 0) {
            builder.setField(field(d, OBJECT_TYPE), decoded.type.getValueDescriptor());
        }
        if (compactVersion(message).isZero()) {
            setVersion(builder, decoded.version);
        }
        return (M) builder.build();
    }

    /** Forgets which strings have warned. Tests only. */
    static void resetWarningsForTests() {
        WARNED.clear();
    }

    private static final class Decoded {
        final ObjectTypeProto type;
        final Version version;

        Decoded(ObjectTypeProto type, Version version) {
            this.type = type;
            this.version = version;
        }
    }

    private static Decoded decode(MessageOrBuilder message) {
        Descriptor d = message.getDescriptorForType();
        String objectClass = (String) message.getField(field(d, OBJECT_CLASS));
        String versionString = (String) message.getField(field(d, VERSION));
        EnumValueDescriptor typeValue = (EnumValueDescriptor) message.getField(field(d, OBJECT_TYPE));
        ObjectTypeProto type = ObjectTypeProto.forNumber(typeValue.getNumber());
        if (type == null) {
            // A value added after this build: proto3 keeps the number.
            type = ObjectTypeProto.UNRECOGNIZED;
        }
        Version version = compactVersion(message);

        boolean usedStrings = false;
        StringBuilder problems = new StringBuilder();
        if (typeValue.getNumber() == 0 && !objectClass.isEmpty()) {
            usedStrings = true;
            type = fromLegacy(objectClass);
            if (type == ObjectTypeProto.OBJECT_TYPE_UNKNOWN) {
                problems.append(" (unknown object_class, using OBJECT_TYPE_UNKNOWN)");
            } else {
                // Some strings were written on more than one message type (e.g.
                // "SecurityRequest" on the create and query requests): the
                // message's own type wins over the value the string sits on.
                ObjectTypeProto own = ownType(d.getName());
                if (own != ObjectTypeProto.OBJECT_TYPE_UNKNOWN) {
                    type = own;
                }
            }
        }
        if (version.isZero() && !versionString.isEmpty()) {
            usedStrings = true;
            Version parsed = parseVersion(versionString);
            if (parsed == null) {
                problems.append(" (malformed version, using 0.0.0)");
            } else {
                version = parsed;
            }
        }
        if (usedStrings && WARNED.add(objectClass + '\0' + versionString)) {
            LOG.warning(String.format("%s read from deprecated strings object_class='%s' version='%s'%s; re-save it to "
                            + "write object_type and version_major/minor/patch (LM-297)",
                    d.getName(), objectClass, versionString, problems));
        }
        return new Decoded(type, version);
    }

    private static Version compactVersion(MessageOrBuilder message) {
        Descriptor d = message.getDescriptorForType();
        return new Version(
                (Integer) message.getField(field(d, VERSION_MAJOR)),
                (Integer) message.getField(field(d, VERSION_MINOR)),
                (Integer) message.getField(field(d, VERSION_PATCH)));
    }

    private static void setVersion(Message.Builder builder, Version version) {
        Descriptor d = builder.getDescriptorForType();
        builder.setField(field(d, VERSION_MAJOR), version.major);
        builder.setField(field(d, VERSION_MINOR), version.minor);
        builder.setField(field(d, VERSION_PATCH), version.patch);
    }

    private static FieldDescriptor field(Descriptor d, int number) {
        FieldDescriptor f = d.findFieldByNumber(number);
        if (f == null) {
            throw new IllegalArgumentException(d.getFullName() + " has no field " + number + "; it carries no object_class");
        }
        return f;
    }
}
