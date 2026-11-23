// LM-482: SecurityMetricProto and the GetLatest and Search request and
// response messages, with every field set, parse back equal. An unset value
// parses back unset, not 0.
import { Timestamp } from 'google-protobuf/google/protobuf/timestamp_pb';

import { SecurityMetricProto } from '../../../fintekkers/models/security/security_metric_pb';
import { SecurityMetricTypeProto } from '../../../fintekkers/models/security/security_metric_type_pb';
import { LocalDateProto } from '../../../fintekkers/models/util/local_date_pb';
import { LocalTimestampProto } from '../../../fintekkers/models/util/local_timestamp_pb';
import { ObjectTypeProto } from '../../../fintekkers/models/util/object_type_pb';
import { VersionProto } from '../../../fintekkers/models/util/version_pb';
import {
  GetLatestSecurityMetricRequestProto,
  GetLatestSecurityMetricResponseProto,
} from '../../../fintekkers/requests/security_metric/get_latest_security_metric_request_pb';
import {
  SearchSecurityMetricRequestProto,
  SearchSecurityMetricResponseProto,
} from '../../../fintekkers/requests/security_metric/search_security_metric_request_pb';
import { decodeDecimal, encodeDecimal, parseDecimalString, toCanonicalString } from '../utils/decimal';
import { UUID } from '../utils/uuid';

const SECURITY_ID = UUID.random().toUUIDProto();
const version = () => new VersionProto().setMajor(0).setMinor(0).setPatch(1);
const date = (y: number, m: number, d: number) => new LocalDateProto().setYear(y).setMonth(m).setDay(d);
const ts = (seconds: number) =>
  new LocalTimestampProto().setTimestamp(new Timestamp().setSeconds(seconds)).setTimeZone('America/New_York');

function metric(kind: SecurityMetricTypeProto, value: string): SecurityMetricProto {
  return new SecurityMetricProto()
    .setObjectType(ObjectTypeProto.OBJECT_TYPE_SECURITY_METRIC)
    .setVersion(version())
    .setUuid(UUID.random().toUUIDProto())
    .setAsOf(ts(1_717_400_000))
    .setValidFrom(ts(1_717_300_000))
    .setValidTo(ts(1_717_500_000))
    .setSecurityId(SECURITY_ID)
    .setMetric(kind)
    .setObservationDate(date(2024, 5, 31))
    .setValue(encodeDecimal(parseDecimalString(value)))
    .setSource('STATE_STREET_NAV_HISTORY');
}

describe('SecurityMetric messages round-trip (LM-482)', () => {
  test('SecurityMetricProto with every field set', () => {
    const m = metric(SecurityMetricTypeProto.NAV_PER_SHARE, '512.3456');
    const parsed = SecurityMetricProto.deserializeBinary(m.serializeBinary());
    expect(parsed.toObject()).toEqual(m.toObject());
    expect(parsed.getMetric()).toBe(SecurityMetricTypeProto.NAV_PER_SHARE);
    expect(parsed.getSource()).toBe('STATE_STREET_NAV_HISTORY');
    expect(toCanonicalString(decodeDecimal(parsed.getValue()!))).toBe('512.3456');
  });

  test('an unset value parses back unset, not 0', () => {
    const m = metric(SecurityMetricTypeProto.SHARES_OUTSTANDING, '1');
    m.clearValue();
    const parsed = SecurityMetricProto.deserializeBinary(m.serializeBinary());
    expect(parsed.toObject()).toEqual(m.toObject());
    expect(parsed.hasValue()).toBe(false);
  });

  test('GetLatest request and response', () => {
    const request = new GetLatestSecurityMetricRequestProto()
      .setObjectType(ObjectTypeProto.OBJECT_TYPE_GET_LATEST_SECURITY_METRIC_REQUEST)
      .setVersion(version())
      .setSecurityIdList([SECURITY_ID, UUID.random().toUUIDProto()])
      .setMetricList([SecurityMetricTypeProto.NAV_PER_SHARE, SecurityMetricTypeProto.SHARES_OUTSTANDING])
      .setDate(date(2024, 6, 3));
    const parsedRequest = GetLatestSecurityMetricRequestProto.deserializeBinary(request.serializeBinary());
    expect(parsedRequest.toObject()).toEqual(request.toObject());
    expect(parsedRequest.getSecurityIdList()).toHaveLength(2);

    const response = new GetLatestSecurityMetricResponseProto()
      .setObjectType(ObjectTypeProto.OBJECT_TYPE_GET_LATEST_SECURITY_METRIC_RESPONSE)
      .setVersion(version())
      .setSecurityMetricResponseList([
        metric(SecurityMetricTypeProto.NAV_PER_SHARE, '512.3456'),
        metric(SecurityMetricTypeProto.SHARES_OUTSTANDING, '1003282116'),
      ]);
    const parsedResponse = GetLatestSecurityMetricResponseProto.deserializeBinary(response.serializeBinary());
    expect(parsedResponse.toObject()).toEqual(response.toObject());
    expect(parsedResponse.getSecurityMetricResponseList()).toHaveLength(2);
  });

  test('Search request and response', () => {
    const request = new SearchSecurityMetricRequestProto()
      .setObjectType(ObjectTypeProto.OBJECT_TYPE_SEARCH_SECURITY_METRIC_REQUEST)
      .setVersion(version())
      .setSecurityId(SECURITY_ID)
      .setMetricList([SecurityMetricTypeProto.NAV_PER_SHARE, SecurityMetricTypeProto.TOTAL_NET_ASSETS])
      .setFromDate(date(2024, 1, 2))
      .setToDate(date(2024, 6, 3));
    const parsedRequest = SearchSecurityMetricRequestProto.deserializeBinary(request.serializeBinary());
    expect(parsedRequest.toObject()).toEqual(request.toObject());
    expect(parsedRequest.getMetricList()).toHaveLength(2);

    const response = new SearchSecurityMetricResponseProto()
      .setObjectType(ObjectTypeProto.OBJECT_TYPE_SEARCH_SECURITY_METRIC_RESPONSE)
      .setVersion(version())
      .setSecurityMetricResponseList([
        metric(SecurityMetricTypeProto.NAV_PER_SHARE, '512.3456'),
        metric(SecurityMetricTypeProto.TOTAL_NET_ASSETS, '512345678901.25'),
      ]);
    const parsedResponse = SearchSecurityMetricResponseProto.deserializeBinary(response.serializeBinary());
    expect(parsedResponse.toObject()).toEqual(response.toObject());
    expect(parsedResponse.getSecurityMetricResponseList()).toHaveLength(2);
  });
});
