// Generated by the protocol buffer compiler.  DO NOT EDIT!
// source: protos/models/price/price.proto

package common.model.protos;

public final class PriceProtos {
  private PriceProtos() {}
  public static void registerAllExtensions(
      com.google.protobuf.ExtensionRegistryLite registry) {
  }

  public static void registerAllExtensions(
      com.google.protobuf.ExtensionRegistry registry) {
    registerAllExtensions(
        (com.google.protobuf.ExtensionRegistryLite) registry);
  }
  static final com.google.protobuf.Descriptors.Descriptor
    internal_static_price_PriceProto_descriptor;
  static final 
    com.google.protobuf.GeneratedMessageV3.FieldAccessorTable
      internal_static_price_PriceProto_fieldAccessorTable;

  public static com.google.protobuf.Descriptors.FileDescriptor
      getDescriptor() {
    return descriptor;
  }
  private static  com.google.protobuf.Descriptors.FileDescriptor
      descriptor;
  static {
    java.lang.String[] descriptorData = {
      "\n\037protos/models/price/price.proto\022\005price" +
      "\032&protos/models/util/decimal_value.proto" +
      "\032(protos/models/util/local_timestamp.pro" +
      "to\032\035protos/models/util/uuid.proto\032%proto" +
      "s/models/security/security.proto\"\340\001\n\nPri" +
      "ceProto\022\024\n\014object_class\030\001 \001(\t\022\017\n\007version" +
      "\030\002 \001(\t\022\035\n\004uuid\030\005 \001(\0132\017.util.UUIDProto\022(\n" +
      "\005as_of\030\006 \001(\0132\031.util.LocalTimestampProto\022" +
      "\017\n\007is_link\030\007 \001(\010\022&\n\005price\030\n \001(\0132\027.util.D" +
      "ecimalValueProto\022)\n\010security\030\013 \001(\0132\027.sec" +
      "urity.SecurityProtoB$\n\023common.model.prot" +
      "osB\013PriceProtosP\001b\006proto3"
    };
    descriptor = com.google.protobuf.Descriptors.FileDescriptor
      .internalBuildGeneratedFileFrom(descriptorData,
        new com.google.protobuf.Descriptors.FileDescriptor[] {
          common.model.protoUtils.DecimalValue.getDescriptor(),
          common.model.protoUtils.LocalTimestamp.getDescriptor(),
          common.model.protoUtils.Uuid.getDescriptor(),
          common.model.protos.SecurityProtos.getDescriptor(),
        });
    internal_static_price_PriceProto_descriptor =
      getDescriptor().getMessageTypes().get(0);
    internal_static_price_PriceProto_fieldAccessorTable = new
      com.google.protobuf.GeneratedMessageV3.FieldAccessorTable(
        internal_static_price_PriceProto_descriptor,
        new java.lang.String[] { "ObjectClass", "Version", "Uuid", "AsOf", "IsLink", "Price", "Security", });
    common.model.protoUtils.DecimalValue.getDescriptor();
    common.model.protoUtils.LocalTimestamp.getDescriptor();
    common.model.protoUtils.Uuid.getDescriptor();
    common.model.protos.SecurityProtos.getDescriptor();
  }

  // @@protoc_insertion_point(outer_class_scope)
}
