// Generated by the protocol buffer compiler.  DO NOT EDIT!
// source: fintekkers/models/security/bond/issuance.proto

package fintekkers.models.security.bond;

public final class IssuanceProtos {
  private IssuanceProtos() {}
  public static void registerAllExtensions(
      com.google.protobuf.ExtensionRegistryLite registry) {
  }

  public static void registerAllExtensions(
      com.google.protobuf.ExtensionRegistry registry) {
    registerAllExtensions(
        (com.google.protobuf.ExtensionRegistryLite) registry);
  }
  static final com.google.protobuf.Descriptors.Descriptor
    internal_static_fintekkers_models_security_bond_IssuanceProto_descriptor;
  static final 
    com.google.protobuf.GeneratedMessageV3.FieldAccessorTable
      internal_static_fintekkers_models_security_bond_IssuanceProto_fieldAccessorTable;

  public static com.google.protobuf.Descriptors.FileDescriptor
      getDescriptor() {
    return descriptor;
  }
  private static  com.google.protobuf.Descriptors.FileDescriptor
      descriptor;
  static {
    java.lang.String[] descriptorData = {
      "\n.fintekkers/models/security/bond/issuan" +
      "ce.proto\022\037fintekkers.models.security.bon" +
      "d\0322fintekkers/models/security/bond/aucti" +
      "on_type.proto\032*fintekkers/models/util/de" +
      "cimal_value.proto\032\'fintekkers/models/uti" +
      "l/local_date.proto\032,fintekkers/models/ut" +
      "il/local_timestamp.proto\"\315\006\n\rIssuancePro" +
      "to\022\024\n\014object_class\030\001 \001(\t\022\017\n\007version\030\002 \001(" +
      "\t\022:\n\005as_of\030\006 \001(\0132+.fintekkers.models.uti" +
      "l.LocalTimestampProto\022?\n\nvalid_from\030\010 \001(" +
      "\0132+.fintekkers.models.util.LocalTimestam" +
      "pProto\022=\n\010valid_to\030\t \001(\0132+.fintekkers.mo" +
      "dels.util.LocalTimestampProto\022I\n\031auction" +
      "_announcement_date\030\024 \001(\0132&.fintekkers.mo" +
      "dels.util.LocalDateProto\022B\n\022auction_issu" +
      "e_date\030\025 \001(\0132&.fintekkers.models.util.Lo" +
      "calDateProto\022T\n!post_auction_outstanding" +
      "_quantity\030\026 \001(\0132).fintekkers.models.util" +
      ".DecimalValueProto\022J\n\027auction_offering_a" +
      "mount\030\027 \001(\0132).fintekkers.models.util.Dec" +
      "imalValueProto\022G\n\014auction_type\030\030 \001(\01621.f" +
      "intekkers.models.security.bond.AuctionTy" +
      "peProto\022Q\n\036price_for_single_price_auctio" +
      "n\030\031 \001(\0132).fintekkers.models.util.Decimal" +
      "ValueProto\022A\n\016total_accepted\030\032 \001(\0132).fin" +
      "tekkers.models.util.DecimalValueProto\022I\n" +
      "\026mature_security_amount\030\033 \001(\0132).fintekke" +
      "rs.models.util.DecimalValueProtoB\022B\016Issu" +
      "anceProtosP\001b\006proto3"
    };
    descriptor = com.google.protobuf.Descriptors.FileDescriptor
      .internalBuildGeneratedFileFrom(descriptorData,
        new com.google.protobuf.Descriptors.FileDescriptor[] {
          fintekkers.models.security.bond.AuctionTypeProtos.getDescriptor(),
          fintekkers.models.util.DecimalValue.getDescriptor(),
          fintekkers.models.util.LocalDate.getDescriptor(),
          fintekkers.models.util.LocalTimestamp.getDescriptor(),
        });
    internal_static_fintekkers_models_security_bond_IssuanceProto_descriptor =
      getDescriptor().getMessageTypes().get(0);
    internal_static_fintekkers_models_security_bond_IssuanceProto_fieldAccessorTable = new
      com.google.protobuf.GeneratedMessageV3.FieldAccessorTable(
        internal_static_fintekkers_models_security_bond_IssuanceProto_descriptor,
        new java.lang.String[] { "ObjectClass", "Version", "AsOf", "ValidFrom", "ValidTo", "AuctionAnnouncementDate", "AuctionIssueDate", "PostAuctionOutstandingQuantity", "AuctionOfferingAmount", "AuctionType", "PriceForSinglePriceAuction", "TotalAccepted", "MatureSecurityAmount", });
    fintekkers.models.security.bond.AuctionTypeProtos.getDescriptor();
    fintekkers.models.util.DecimalValue.getDescriptor();
    fintekkers.models.util.LocalDate.getDescriptor();
    fintekkers.models.util.LocalTimestamp.getDescriptor();
  }

  // @@protoc_insertion_point(outer_class_scope)
}
