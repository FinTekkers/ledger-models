// Generated by the protocol buffer compiler.  DO NOT EDIT!
// source: fintekkers/requests/util/lock/lock_request.proto

package fintekkers.requests.util.lock;

public final class LockRequestProtos {
  private LockRequestProtos() {}
  public static void registerAllExtensions(
      com.google.protobuf.ExtensionRegistryLite registry) {
  }

  public static void registerAllExtensions(
      com.google.protobuf.ExtensionRegistry registry) {
    registerAllExtensions(
        (com.google.protobuf.ExtensionRegistryLite) registry);
  }
  static final com.google.protobuf.Descriptors.Descriptor
    internal_static_fintekkers_requests_util_lock_LockRequestProto_descriptor;
  static final 
    com.google.protobuf.GeneratedMessageV3.FieldAccessorTable
      internal_static_fintekkers_requests_util_lock_LockRequestProto_fieldAccessorTable;

  public static com.google.protobuf.Descriptors.FileDescriptor
      getDescriptor() {
    return descriptor;
  }
  private static  com.google.protobuf.Descriptors.FileDescriptor
      descriptor;
  static {
    java.lang.String[] descriptorData = {
      "\n0fintekkers/requests/util/lock/lock_req" +
      "uest.proto\022\035fintekkers.requests.util.loc" +
      "k\0320fintekkers/models/util/lock/node_part" +
      "ition.proto\032%fintekkers/models/util/endp" +
      "oint.proto\"\261\001\n\020LockRequestProto\022\024\n\014objec" +
      "t_class\030\001 \001(\t\022\017\n\007version\030\002 \001(\t\022B\n\016node_p" +
      "artition\030\013 \001(\0132*.fintekkers.models.util." +
      "lock.NodePartition\0222\n\010endpoint\030\014 \001(\0132 .f" +
      "intekkers.models.util.EndpointB\025B\021LockRe" +
      "questProtosP\001b\006proto3"
    };
    descriptor = com.google.protobuf.Descriptors.FileDescriptor
      .internalBuildGeneratedFileFrom(descriptorData,
        new com.google.protobuf.Descriptors.FileDescriptor[] {
          fintekkers.models.util.lock.NodePartitionOuterClass.getDescriptor(),
          fintekkers.models.util.EndpointOuterClass.getDescriptor(),
        });
    internal_static_fintekkers_requests_util_lock_LockRequestProto_descriptor =
      getDescriptor().getMessageTypes().get(0);
    internal_static_fintekkers_requests_util_lock_LockRequestProto_fieldAccessorTable = new
      com.google.protobuf.GeneratedMessageV3.FieldAccessorTable(
        internal_static_fintekkers_requests_util_lock_LockRequestProto_descriptor,
        new java.lang.String[] { "ObjectClass", "Version", "NodePartition", "Endpoint", });
    fintekkers.models.util.lock.NodePartitionOuterClass.getDescriptor();
    fintekkers.models.util.EndpointOuterClass.getDescriptor();
  }

  // @@protoc_insertion_point(outer_class_scope)
}
