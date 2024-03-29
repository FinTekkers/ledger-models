// Generated by the protocol buffer compiler.  DO NOT EDIT!
// source: fintekkers/models/position/field.proto

package fintekkers.models.position;

/**
 * Protobuf enum {@code fintekkers.models.position.FieldProto}
 */
public enum FieldProto
    implements com.google.protobuf.ProtocolMessageEnum {
  /**
   * <code>UNKNOWN_FIELD = 0;</code>
   */
  UNKNOWN_FIELD(0),
  /**
   * <pre>
   *(UUID.class)
   * </pre>
   *
   * <code>ID = 1;</code>
   */
  ID(1),
  /**
   * <pre>
   *ZonedDateTime
   * </pre>
   *
   * <code>AS_OF = 2;</code>
   */
  AS_OF(2),
  /**
   * <pre>
   * Attribute fields. Likely to be fields that one would pivot on.
   * </pre>
   *
   * <code>EFFECTIVE_DATE = 10;</code>
   */
  EFFECTIVE_DATE(10),
  /**
   * <pre>
   *common.model.strategy.Strategy.class
   * </pre>
   *
   * <code>STRATEGY = 11;</code>
   */
  STRATEGY(11),
  /**
   * <pre>
   *common.model.security.Security.class
   * </pre>
   *
   * <code>SECURITY = 12;</code>
   */
  SECURITY(12),
  /**
   * <code>SECURITY_DESCRIPTION = 61;</code>
   */
  SECURITY_DESCRIPTION(61),
  /**
   * <code>SECURITY_ISSUER_NAME = 62;</code>
   */
  SECURITY_ISSUER_NAME(62),
  /**
   * <pre>
   *common.model.security.Security.class
   * </pre>
   *
   * <code>CASH_IMPACT_SECURITY = 13;</code>
   */
  CASH_IMPACT_SECURITY(13),
  /**
   * <pre>
   *Security Fields
   * </pre>
   *
   * <code>ASSET_CLASS = 50;</code>
   */
  ASSET_CLASS(50),
  /**
   * <pre>
   * ProductClass(String.class), //Bond, CashEquity, etc
   * </pre>
   *
   * <code>PRODUCT_CLASS = 51;</code>
   */
  PRODUCT_CLASS(51),
  /**
   * <pre>
   * ProductType (String.class), //TBILL, BOND, etc
   * </pre>
   *
   * <code>PRODUCT_TYPE = 52;</code>
   */
  PRODUCT_TYPE(52),
  /**
   * <code>SECURITY_ID = 53;</code>
   */
  SECURITY_ID(53),
  /**
   * <code>IDENTIFIER = 54;</code>
   */
  IDENTIFIER(54),
  /**
   * <pre>
   * 1M
   * </pre>
   *
   * <code>TENOR = 55;</code>
   */
  TENOR(55),
  /**
   * <code>ISSUE_DATE = 58;</code>
   */
  ISSUE_DATE(58),
  /**
   * <code>MATURITY_DATE = 56;</code>
   */
  MATURITY_DATE(56),
  /**
   * <code>ADJUSTED_TENOR = 57;</code>
   */
  ADJUSTED_TENOR(57),
  /**
   * <pre>
   *Portfolio fields
   * </pre>
   *
   * <code>PORTFOLIO = 14;</code>
   */
  PORTFOLIO(14),
  /**
   * <pre>
   *UUID
   * </pre>
   *
   * <code>PORTFOLIO_ID = 15;</code>
   */
  PORTFOLIO_ID(15),
  /**
   * <code>PORTFOLIO_NAME = 60;</code>
   */
  PORTFOLIO_NAME(60),
  /**
   * <pre>
   *Miscellaneous
   * </pre>
   *
   * <code>PRICE = 16;</code>
   */
  PRICE(16),
  /**
   * <pre>
   *UUID
   * </pre>
   *
   * <code>PRICE_ID = 17;</code>
   */
  PRICE_ID(17),
  /**
   * <pre>
   *Boolean.class
   * </pre>
   *
   * <code>IS_CANCELLED = 18;</code>
   */
  IS_CANCELLED(18),
  /**
   * <pre>
   *PositionStatus.class
   * </pre>
   *
   * <code>POSITION_STATUS = 19;</code>
   */
  POSITION_STATUS(19),
  /**
   * <pre>
   *Transaction only
   * </pre>
   *
   * <code>TRADE_DATE = 30;</code>
   */
  TRADE_DATE(30),
  /**
   * <pre>
   *  SettlementDate(LocalDate.class),
   * </pre>
   *
   * <code>SETTLEMENT_DATE = 31;</code>
   */
  SETTLEMENT_DATE(31),
  /**
   * <pre>
   * BUY, SELL, MATURATION, etc (TransactionType.class)
   * </pre>
   *
   * <code>TRANSACTION_TYPE = 32;</code>
   */
  TRANSACTION_TYPE(32),
  /**
   * <pre>
   *Tax Lot only
   * </pre>
   *
   * <code>TAX_LOT_OPEN_DATE = 40;</code>
   */
  TAX_LOT_OPEN_DATE(40),
  /**
   * <pre>
   *  TaxLotCloseDate(LocalDate.class),
   * </pre>
   *
   * <code>TAX_LOT_CLOSE_DATE = 41;</code>
   */
  TAX_LOT_CLOSE_DATE(41),
  UNRECOGNIZED(-1),
  ;

  /**
   * <code>UNKNOWN_FIELD = 0;</code>
   */
  public static final int UNKNOWN_FIELD_VALUE = 0;
  /**
   * <pre>
   *(UUID.class)
   * </pre>
   *
   * <code>ID = 1;</code>
   */
  public static final int ID_VALUE = 1;
  /**
   * <pre>
   *ZonedDateTime
   * </pre>
   *
   * <code>AS_OF = 2;</code>
   */
  public static final int AS_OF_VALUE = 2;
  /**
   * <pre>
   * Attribute fields. Likely to be fields that one would pivot on.
   * </pre>
   *
   * <code>EFFECTIVE_DATE = 10;</code>
   */
  public static final int EFFECTIVE_DATE_VALUE = 10;
  /**
   * <pre>
   *common.model.strategy.Strategy.class
   * </pre>
   *
   * <code>STRATEGY = 11;</code>
   */
  public static final int STRATEGY_VALUE = 11;
  /**
   * <pre>
   *common.model.security.Security.class
   * </pre>
   *
   * <code>SECURITY = 12;</code>
   */
  public static final int SECURITY_VALUE = 12;
  /**
   * <code>SECURITY_DESCRIPTION = 61;</code>
   */
  public static final int SECURITY_DESCRIPTION_VALUE = 61;
  /**
   * <code>SECURITY_ISSUER_NAME = 62;</code>
   */
  public static final int SECURITY_ISSUER_NAME_VALUE = 62;
  /**
   * <pre>
   *common.model.security.Security.class
   * </pre>
   *
   * <code>CASH_IMPACT_SECURITY = 13;</code>
   */
  public static final int CASH_IMPACT_SECURITY_VALUE = 13;
  /**
   * <pre>
   *Security Fields
   * </pre>
   *
   * <code>ASSET_CLASS = 50;</code>
   */
  public static final int ASSET_CLASS_VALUE = 50;
  /**
   * <pre>
   * ProductClass(String.class), //Bond, CashEquity, etc
   * </pre>
   *
   * <code>PRODUCT_CLASS = 51;</code>
   */
  public static final int PRODUCT_CLASS_VALUE = 51;
  /**
   * <pre>
   * ProductType (String.class), //TBILL, BOND, etc
   * </pre>
   *
   * <code>PRODUCT_TYPE = 52;</code>
   */
  public static final int PRODUCT_TYPE_VALUE = 52;
  /**
   * <code>SECURITY_ID = 53;</code>
   */
  public static final int SECURITY_ID_VALUE = 53;
  /**
   * <code>IDENTIFIER = 54;</code>
   */
  public static final int IDENTIFIER_VALUE = 54;
  /**
   * <pre>
   * 1M
   * </pre>
   *
   * <code>TENOR = 55;</code>
   */
  public static final int TENOR_VALUE = 55;
  /**
   * <code>ISSUE_DATE = 58;</code>
   */
  public static final int ISSUE_DATE_VALUE = 58;
  /**
   * <code>MATURITY_DATE = 56;</code>
   */
  public static final int MATURITY_DATE_VALUE = 56;
  /**
   * <code>ADJUSTED_TENOR = 57;</code>
   */
  public static final int ADJUSTED_TENOR_VALUE = 57;
  /**
   * <pre>
   *Portfolio fields
   * </pre>
   *
   * <code>PORTFOLIO = 14;</code>
   */
  public static final int PORTFOLIO_VALUE = 14;
  /**
   * <pre>
   *UUID
   * </pre>
   *
   * <code>PORTFOLIO_ID = 15;</code>
   */
  public static final int PORTFOLIO_ID_VALUE = 15;
  /**
   * <code>PORTFOLIO_NAME = 60;</code>
   */
  public static final int PORTFOLIO_NAME_VALUE = 60;
  /**
   * <pre>
   *Miscellaneous
   * </pre>
   *
   * <code>PRICE = 16;</code>
   */
  public static final int PRICE_VALUE = 16;
  /**
   * <pre>
   *UUID
   * </pre>
   *
   * <code>PRICE_ID = 17;</code>
   */
  public static final int PRICE_ID_VALUE = 17;
  /**
   * <pre>
   *Boolean.class
   * </pre>
   *
   * <code>IS_CANCELLED = 18;</code>
   */
  public static final int IS_CANCELLED_VALUE = 18;
  /**
   * <pre>
   *PositionStatus.class
   * </pre>
   *
   * <code>POSITION_STATUS = 19;</code>
   */
  public static final int POSITION_STATUS_VALUE = 19;
  /**
   * <pre>
   *Transaction only
   * </pre>
   *
   * <code>TRADE_DATE = 30;</code>
   */
  public static final int TRADE_DATE_VALUE = 30;
  /**
   * <pre>
   *  SettlementDate(LocalDate.class),
   * </pre>
   *
   * <code>SETTLEMENT_DATE = 31;</code>
   */
  public static final int SETTLEMENT_DATE_VALUE = 31;
  /**
   * <pre>
   * BUY, SELL, MATURATION, etc (TransactionType.class)
   * </pre>
   *
   * <code>TRANSACTION_TYPE = 32;</code>
   */
  public static final int TRANSACTION_TYPE_VALUE = 32;
  /**
   * <pre>
   *Tax Lot only
   * </pre>
   *
   * <code>TAX_LOT_OPEN_DATE = 40;</code>
   */
  public static final int TAX_LOT_OPEN_DATE_VALUE = 40;
  /**
   * <pre>
   *  TaxLotCloseDate(LocalDate.class),
   * </pre>
   *
   * <code>TAX_LOT_CLOSE_DATE = 41;</code>
   */
  public static final int TAX_LOT_CLOSE_DATE_VALUE = 41;


  public final int getNumber() {
    if (this == UNRECOGNIZED) {
      throw new java.lang.IllegalArgumentException(
          "Can't get the number of an unknown enum value.");
    }
    return value;
  }

  /**
   * @param value The numeric wire value of the corresponding enum entry.
   * @return The enum associated with the given numeric wire value.
   * @deprecated Use {@link #forNumber(int)} instead.
   */
  @java.lang.Deprecated
  public static FieldProto valueOf(int value) {
    return forNumber(value);
  }

  /**
   * @param value The numeric wire value of the corresponding enum entry.
   * @return The enum associated with the given numeric wire value.
   */
  public static FieldProto forNumber(int value) {
    switch (value) {
      case 0: return UNKNOWN_FIELD;
      case 1: return ID;
      case 2: return AS_OF;
      case 10: return EFFECTIVE_DATE;
      case 11: return STRATEGY;
      case 12: return SECURITY;
      case 61: return SECURITY_DESCRIPTION;
      case 62: return SECURITY_ISSUER_NAME;
      case 13: return CASH_IMPACT_SECURITY;
      case 50: return ASSET_CLASS;
      case 51: return PRODUCT_CLASS;
      case 52: return PRODUCT_TYPE;
      case 53: return SECURITY_ID;
      case 54: return IDENTIFIER;
      case 55: return TENOR;
      case 58: return ISSUE_DATE;
      case 56: return MATURITY_DATE;
      case 57: return ADJUSTED_TENOR;
      case 14: return PORTFOLIO;
      case 15: return PORTFOLIO_ID;
      case 60: return PORTFOLIO_NAME;
      case 16: return PRICE;
      case 17: return PRICE_ID;
      case 18: return IS_CANCELLED;
      case 19: return POSITION_STATUS;
      case 30: return TRADE_DATE;
      case 31: return SETTLEMENT_DATE;
      case 32: return TRANSACTION_TYPE;
      case 40: return TAX_LOT_OPEN_DATE;
      case 41: return TAX_LOT_CLOSE_DATE;
      default: return null;
    }
  }

  public static com.google.protobuf.Internal.EnumLiteMap<FieldProto>
      internalGetValueMap() {
    return internalValueMap;
  }
  private static final com.google.protobuf.Internal.EnumLiteMap<
      FieldProto> internalValueMap =
        new com.google.protobuf.Internal.EnumLiteMap<FieldProto>() {
          public FieldProto findValueByNumber(int number) {
            return FieldProto.forNumber(number);
          }
        };

  public final com.google.protobuf.Descriptors.EnumValueDescriptor
      getValueDescriptor() {
    if (this == UNRECOGNIZED) {
      throw new java.lang.IllegalStateException(
          "Can't get the descriptor of an unrecognized enum value.");
    }
    return getDescriptor().getValues().get(ordinal());
  }
  public final com.google.protobuf.Descriptors.EnumDescriptor
      getDescriptorForType() {
    return getDescriptor();
  }
  public static final com.google.protobuf.Descriptors.EnumDescriptor
      getDescriptor() {
    return fintekkers.models.position.FieldProtos.getDescriptor().getEnumTypes().get(0);
  }

  private static final FieldProto[] VALUES = values();

  public static FieldProto valueOf(
      com.google.protobuf.Descriptors.EnumValueDescriptor desc) {
    if (desc.getType() != getDescriptor()) {
      throw new java.lang.IllegalArgumentException(
        "EnumValueDescriptor is not for this type.");
    }
    if (desc.getIndex() == -1) {
      return UNRECOGNIZED;
    }
    return VALUES[desc.getIndex()];
  }

  private final int value;

  private FieldProto(int value) {
    this.value = value;
  }

  // @@protoc_insertion_point(enum_scope:fintekkers.models.position.FieldProto)
}

