// Generated by the protocol buffer compiler.  DO NOT EDIT!
// source: requests/portfolio/query_portfolio_request.proto

package common.request;

public final class QueryPortfolioRequestProtos {
  private QueryPortfolioRequestProtos() {}
  public static void registerAllExtensions(
      com.google.protobuf.ExtensionRegistryLite registry) {
  }

  public static void registerAllExtensions(
      com.google.protobuf.ExtensionRegistry registry) {
    registerAllExtensions(
        (com.google.protobuf.ExtensionRegistryLite) registry);
  }
  static final com.google.protobuf.Descriptors.Descriptor
    internal_static_portfolio_QueryPortfolioRequestProto_descriptor;
  static final 
    com.google.protobuf.GeneratedMessageV3.FieldAccessorTable
      internal_static_portfolio_QueryPortfolioRequestProto_fieldAccessorTable;

  public static com.google.protobuf.Descriptors.FileDescriptor
      getDescriptor() {
    return descriptor;
  }
  private static  com.google.protobuf.Descriptors.FileDescriptor
      descriptor;
  static {
    java.lang.String[] descriptorData = {
      "\n0requests/portfolio/query_portfolio_req" +
      "uest.proto\022\tportfolio\032\026models/util/uuid." +
      "proto\032%models/position/position_filter.p" +
      "roto\"\242\001\n\032QueryPortfolioRequestProto\022\024\n\014o" +
      "bject_class\030\001 \001(\t\022\017\n\007version\030\002 \001(\t\022\036\n\005uu" +
      "ids\030\025 \003(\0132\017.util.UUIDProto\022=\n\026search_por" +
      "tfolio_input\030\026 \001(\0132\035.position.PositionFi" +
      "lterProtoB/\n\016common.requestB\033QueryPortfo" +
      "lioRequestProtosP\001b\006proto3"
    };
    descriptor = com.google.protobuf.Descriptors.FileDescriptor
      .internalBuildGeneratedFileFrom(descriptorData,
        new com.google.protobuf.Descriptors.FileDescriptor[] {
          common.models.protoUtils.Uuid.getDescriptor(),
          common.models.position.PositionFilterProtos.getDescriptor(),
        });
    internal_static_portfolio_QueryPortfolioRequestProto_descriptor =
      getDescriptor().getMessageTypes().get(0);
    internal_static_portfolio_QueryPortfolioRequestProto_fieldAccessorTable = new
      com.google.protobuf.GeneratedMessageV3.FieldAccessorTable(
        internal_static_portfolio_QueryPortfolioRequestProto_descriptor,
        new java.lang.String[] { "ObjectClass", "Version", "Uuids", "SearchPortfolioInput", });
    common.models.protoUtils.Uuid.getDescriptor();
    common.models.position.PositionFilterProtos.getDescriptor();
  }

  // @@protoc_insertion_point(outer_class_scope)
}
