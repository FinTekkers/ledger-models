// Generated by the protocol buffer compiler.  DO NOT EDIT!
// source: fintekkers/requests/valuation/valuation_request.proto

package fintekkers.requests.valuation;

public interface ValuationRequestProtoOrBuilder extends
    // @@protoc_insertion_point(interface_extends:fintekkers.requests.valuation.ValuationRequestProto)
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
   *Only supports GET, since there is no backing store, so CREATE isn't relevant. SEARCH isn't relevant either.
   *VALIDATE could be implemented later, e.g. if the caller wants to check their inputs are correct.
   * </pre>
   *
   * <code>.fintekkers.requests.util.RequestOperationTypeProto operation_type = 10;</code>
   * @return The enum numeric value on the wire for operationType.
   */
  int getOperationTypeValue();
  /**
   * <pre>
   *Only supports GET, since there is no backing store, so CREATE isn't relevant. SEARCH isn't relevant either.
   *VALIDATE could be implemented later, e.g. if the caller wants to check their inputs are correct.
   * </pre>
   *
   * <code>.fintekkers.requests.util.RequestOperationTypeProto operation_type = 10;</code>
   * @return The operationType.
   */
  fintekkers.requests.util.RequestOperationTypeProto getOperationType();

  /**
   * <pre>
   *The list of measures to be generated by this request, e.g. MARKET_VALUE, CURRENT_YIELD, etc.
   * </pre>
   *
   * <code>repeated .fintekkers.models.position.MeasureProto measures = 30;</code>
   * @return A list containing the measures.
   */
  java.util.List<fintekkers.models.position.MeasureProto> getMeasuresList();
  /**
   * <pre>
   *The list of measures to be generated by this request, e.g. MARKET_VALUE, CURRENT_YIELD, etc.
   * </pre>
   *
   * <code>repeated .fintekkers.models.position.MeasureProto measures = 30;</code>
   * @return The count of measures.
   */
  int getMeasuresCount();
  /**
   * <pre>
   *The list of measures to be generated by this request, e.g. MARKET_VALUE, CURRENT_YIELD, etc.
   * </pre>
   *
   * <code>repeated .fintekkers.models.position.MeasureProto measures = 30;</code>
   * @param index The index of the element to return.
   * @return The measures at the given index.
   */
  fintekkers.models.position.MeasureProto getMeasures(int index);
  /**
   * <pre>
   *The list of measures to be generated by this request, e.g. MARKET_VALUE, CURRENT_YIELD, etc.
   * </pre>
   *
   * <code>repeated .fintekkers.models.position.MeasureProto measures = 30;</code>
   * @return A list containing the enum numeric values on the wire for measures.
   */
  java.util.List<java.lang.Integer>
  getMeasuresValueList();
  /**
   * <pre>
   *The list of measures to be generated by this request, e.g. MARKET_VALUE, CURRENT_YIELD, etc.
   * </pre>
   *
   * <code>repeated .fintekkers.models.position.MeasureProto measures = 30;</code>
   * @param index The index of the value to return.
   * @return The enum numeric value on the wire of measures at the given index.
   */
  int getMeasuresValue(int index);

  /**
   * <pre>
   *The full security object for which we are going to run the valuation
   * </pre>
   *
   * <code>.fintekkers.models.security.SecurityProto security_input = 20;</code>
   * @return Whether the securityInput field is set.
   */
  boolean hasSecurityInput();
  /**
   * <pre>
   *The full security object for which we are going to run the valuation
   * </pre>
   *
   * <code>.fintekkers.models.security.SecurityProto security_input = 20;</code>
   * @return The securityInput.
   */
  fintekkers.models.security.SecurityProto getSecurityInput();
  /**
   * <pre>
   *The full security object for which we are going to run the valuation
   * </pre>
   *
   * <code>.fintekkers.models.security.SecurityProto security_input = 20;</code>
   */
  fintekkers.models.security.SecurityProtoOrBuilder getSecurityInputOrBuilder();

  /**
   * <pre>
   *The positions we are going to value.
   * </pre>
   *
   * <code>.fintekkers.models.position.PositionProto position_input = 21;</code>
   * @return Whether the positionInput field is set.
   */
  boolean hasPositionInput();
  /**
   * <pre>
   *The positions we are going to value.
   * </pre>
   *
   * <code>.fintekkers.models.position.PositionProto position_input = 21;</code>
   * @return The positionInput.
   */
  fintekkers.models.position.PositionProto getPositionInput();
  /**
   * <pre>
   *The positions we are going to value.
   * </pre>
   *
   * <code>.fintekkers.models.position.PositionProto position_input = 21;</code>
   */
  fintekkers.models.position.PositionProtoOrBuilder getPositionInputOrBuilder();

  /**
   * <code>.fintekkers.models.price.PriceProto price_input = 22;</code>
   * @return Whether the priceInput field is set.
   */
  boolean hasPriceInput();
  /**
   * <code>.fintekkers.models.price.PriceProto price_input = 22;</code>
   * @return The priceInput.
   */
  fintekkers.models.price.PriceProto getPriceInput();
  /**
   * <code>.fintekkers.models.price.PriceProto price_input = 22;</code>
   */
  fintekkers.models.price.PriceProtoOrBuilder getPriceInputOrBuilder();
}