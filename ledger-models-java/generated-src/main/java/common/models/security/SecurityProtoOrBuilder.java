// Generated by the protocol buffer compiler.  DO NOT EDIT!
// source: models/security/security.proto

package common.models.security;

public interface SecurityProtoOrBuilder extends
    // @@protoc_insertion_point(interface_extends:security.SecurityProto)
    com.google.protobuf.MessageOrBuilder {

  /**
   * <code>string object_class = 1;</code>
   * @return The objectClass.
   */
  java.lang.String getObjectClass();
  /**
   * <code>string object_class = 1;</code>
   * @return The bytes for objectClass.
   */
  com.google.protobuf.ByteString
      getObjectClassBytes();

  /**
   * <code>string version = 2;</code>
   * @return The version.
   */
  java.lang.String getVersion();
  /**
   * <code>string version = 2;</code>
   * @return The bytes for version.
   */
  com.google.protobuf.ByteString
      getVersionBytes();

  /**
   * <pre>
   *Primary Key
   * </pre>
   *
   * <code>.util.UUIDProto uuid = 5;</code>
   * @return Whether the uuid field is set.
   */
  boolean hasUuid();
  /**
   * <pre>
   *Primary Key
   * </pre>
   *
   * <code>.util.UUIDProto uuid = 5;</code>
   * @return The uuid.
   */
  common.models.protoUtils.Uuid.UUIDProto getUuid();
  /**
   * <pre>
   *Primary Key
   * </pre>
   *
   * <code>.util.UUIDProto uuid = 5;</code>
   */
  common.models.protoUtils.Uuid.UUIDProtoOrBuilder getUuidOrBuilder();

  /**
   * <code>.util.LocalTimestampProto as_of = 6;</code>
   * @return Whether the asOf field is set.
   */
  boolean hasAsOf();
  /**
   * <code>.util.LocalTimestampProto as_of = 6;</code>
   * @return The asOf.
   */
  common.models.protoUtils.LocalTimestamp.LocalTimestampProto getAsOf();
  /**
   * <code>.util.LocalTimestampProto as_of = 6;</code>
   */
  common.models.protoUtils.LocalTimestamp.LocalTimestampProtoOrBuilder getAsOfOrBuilder();

  /**
   * <code>bool is_link = 7;</code>
   * @return The isLink.
   */
  boolean getIsLink();

  /**
   * <code>.security.SecurityTypeProto security_type = 10;</code>
   * @return The enum numeric value on the wire for securityType.
   */
  int getSecurityTypeValue();
  /**
   * <code>.security.SecurityTypeProto security_type = 10;</code>
   * @return The securityType.
   */
  common.models.security.SecurityTypeProto getSecurityType();

  /**
   * <pre>
   *Biz fields
   * </pre>
   *
   * <code>string asset_class = 11;</code>
   * @return The assetClass.
   */
  java.lang.String getAssetClass();
  /**
   * <pre>
   *Biz fields
   * </pre>
   *
   * <code>string asset_class = 11;</code>
   * @return The bytes for assetClass.
   */
  com.google.protobuf.ByteString
      getAssetClassBytes();

  /**
   * <code>string issuer_name = 12;</code>
   * @return The issuerName.
   */
  java.lang.String getIssuerName();
  /**
   * <code>string issuer_name = 12;</code>
   * @return The bytes for issuerName.
   */
  com.google.protobuf.ByteString
      getIssuerNameBytes();

  /**
   * <code>.security.SecurityProto settlement_currency = 13;</code>
   * @return Whether the settlementCurrency field is set.
   */
  boolean hasSettlementCurrency();
  /**
   * <code>.security.SecurityProto settlement_currency = 13;</code>
   * @return The settlementCurrency.
   */
  common.models.security.SecurityProto getSettlementCurrency();
  /**
   * <code>.security.SecurityProto settlement_currency = 13;</code>
   */
  common.models.security.SecurityProtoOrBuilder getSettlementCurrencyOrBuilder();

  /**
   * <code>.security.SecurityQuantityTypeProto quantity_type = 14;</code>
   * @return The enum numeric value on the wire for quantityType.
   */
  int getQuantityTypeValue();
  /**
   * <code>.security.SecurityQuantityTypeProto quantity_type = 14;</code>
   * @return The quantityType.
   */
  common.models.security.SecurityQuantityTypeProto getQuantityType();

  /**
   * <code>.security.IdentifierProto identifier = 40;</code>
   * @return Whether the identifier field is set.
   */
  boolean hasIdentifier();
  /**
   * <code>.security.IdentifierProto identifier = 40;</code>
   * @return The identifier.
   */
  common.models.security.identifier.IdentifierProto getIdentifier();
  /**
   * <code>.security.IdentifierProto identifier = 40;</code>
   */
  common.models.security.identifier.IdentifierProtoOrBuilder getIdentifierOrBuilder();

  /**
   * <code>string description = 41;</code>
   * @return The description.
   */
  java.lang.String getDescription();
  /**
   * <code>string description = 41;</code>
   * @return The bytes for description.
   */
  com.google.protobuf.ByteString
      getDescriptionBytes();

  /**
   * <pre>
   *Cash Security fields
   * </pre>
   *
   * <code>string cash_id = 50;</code>
   * @return The cashId.
   */
  java.lang.String getCashId();
  /**
   * <pre>
   *Cash Security fields
   * </pre>
   *
   * <code>string cash_id = 50;</code>
   * @return The bytes for cashId.
   */
  com.google.protobuf.ByteString
      getCashIdBytes();

  /**
   * <pre>
   *Bond Security fields
   * </pre>
   *
   * <code>.util.DecimalValueProto coupon_rate = 60;</code>
   * @return Whether the couponRate field is set.
   */
  boolean hasCouponRate();
  /**
   * <pre>
   *Bond Security fields
   * </pre>
   *
   * <code>.util.DecimalValueProto coupon_rate = 60;</code>
   * @return The couponRate.
   */
  common.models.protoUtils.DecimalValue.DecimalValueProto getCouponRate();
  /**
   * <pre>
   *Bond Security fields
   * </pre>
   *
   * <code>.util.DecimalValueProto coupon_rate = 60;</code>
   */
  common.models.protoUtils.DecimalValue.DecimalValueProtoOrBuilder getCouponRateOrBuilder();

  /**
   * <code>.security.CouponTypeProto coupon_type = 61;</code>
   * @return The enum numeric value on the wire for couponType.
   */
  int getCouponTypeValue();
  /**
   * <code>.security.CouponTypeProto coupon_type = 61;</code>
   * @return The couponType.
   */
  common.models.security.CouponTypeProto getCouponType();

  /**
   * <code>.security.CouponFrequencyProto coupon_frequency = 62;</code>
   * @return The enum numeric value on the wire for couponFrequency.
   */
  int getCouponFrequencyValue();
  /**
   * <code>.security.CouponFrequencyProto coupon_frequency = 62;</code>
   * @return The couponFrequency.
   */
  common.models.security.CouponFrequencyProto getCouponFrequency();

  /**
   * <code>.util.LocalDateProto dated_date = 63;</code>
   * @return Whether the datedDate field is set.
   */
  boolean hasDatedDate();
  /**
   * <code>.util.LocalDateProto dated_date = 63;</code>
   * @return The datedDate.
   */
  common.models.protoUtils.LocalDate.LocalDateProto getDatedDate();
  /**
   * <code>.util.LocalDateProto dated_date = 63;</code>
   */
  common.models.protoUtils.LocalDate.LocalDateProtoOrBuilder getDatedDateOrBuilder();

  /**
   * <code>.util.DecimalValueProto face_value = 64;</code>
   * @return Whether the faceValue field is set.
   */
  boolean hasFaceValue();
  /**
   * <code>.util.DecimalValueProto face_value = 64;</code>
   * @return The faceValue.
   */
  common.models.protoUtils.DecimalValue.DecimalValueProto getFaceValue();
  /**
   * <code>.util.DecimalValueProto face_value = 64;</code>
   */
  common.models.protoUtils.DecimalValue.DecimalValueProtoOrBuilder getFaceValueOrBuilder();

  /**
   * <code>.util.LocalDateProto issue_date = 65;</code>
   * @return Whether the issueDate field is set.
   */
  boolean hasIssueDate();
  /**
   * <code>.util.LocalDateProto issue_date = 65;</code>
   * @return The issueDate.
   */
  common.models.protoUtils.LocalDate.LocalDateProto getIssueDate();
  /**
   * <code>.util.LocalDateProto issue_date = 65;</code>
   */
  common.models.protoUtils.LocalDate.LocalDateProtoOrBuilder getIssueDateOrBuilder();

  /**
   * <code>.util.LocalDateProto maturity_date = 66;</code>
   * @return Whether the maturityDate field is set.
   */
  boolean hasMaturityDate();
  /**
   * <code>.util.LocalDateProto maturity_date = 66;</code>
   * @return The maturityDate.
   */
  common.models.protoUtils.LocalDate.LocalDateProto getMaturityDate();
  /**
   * <code>.util.LocalDateProto maturity_date = 66;</code>
   */
  common.models.protoUtils.LocalDate.LocalDateProtoOrBuilder getMaturityDateOrBuilder();
}
