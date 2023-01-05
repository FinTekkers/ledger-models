// Generated by the protocol buffer compiler.  DO NOT EDIT!
// source: requests/position/query_position_response.proto

package common.request;

public interface QueryPositionResponseProtoOrBuilder extends
    // @@protoc_insertion_point(interface_extends:position.QueryPositionResponseProto)
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
   * <code>.position.QueryPositionRequestProto position_request = 11;</code>
   * @return Whether the positionRequest field is set.
   */
  boolean hasPositionRequest();
  /**
   * <code>.position.QueryPositionRequestProto position_request = 11;</code>
   * @return The positionRequest.
   */
  common.request.QueryPositionRequestProto getPositionRequest();
  /**
   * <code>.position.QueryPositionRequestProto position_request = 11;</code>
   */
  common.request.QueryPositionRequestProtoOrBuilder getPositionRequestOrBuilder();

  /**
   * <pre>
   *TODO - Think about how to model this long term; ISO code vs. UUID vs. full security object
   * </pre>
   *
   * <code>string reporting_currency = 12;</code>
   * @return The reportingCurrency.
   */
  java.lang.String getReportingCurrency();
  /**
   * <pre>
   *TODO - Think about how to model this long term; ISO code vs. UUID vs. full security object
   * </pre>
   *
   * <code>string reporting_currency = 12;</code>
   * @return The bytes for reportingCurrency.
   */
  com.google.protobuf.ByteString
      getReportingCurrencyBytes();

  /**
   * <code>repeated .position.PositionProto positions = 30;</code>
   */
  java.util.List<common.models.position.PositionProto> 
      getPositionsList();
  /**
   * <code>repeated .position.PositionProto positions = 30;</code>
   */
  common.models.position.PositionProto getPositions(int index);
  /**
   * <code>repeated .position.PositionProto positions = 30;</code>
   */
  int getPositionsCount();
  /**
   * <code>repeated .position.PositionProto positions = 30;</code>
   */
  java.util.List<? extends common.models.position.PositionProtoOrBuilder> 
      getPositionsOrBuilderList();
  /**
   * <code>repeated .position.PositionProto positions = 30;</code>
   */
  common.models.position.PositionProtoOrBuilder getPositionsOrBuilder(
      int index);
}
