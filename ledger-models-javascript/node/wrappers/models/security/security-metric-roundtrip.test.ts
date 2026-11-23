/**
 * LM-484: security metric series, GetLatest and Search messages round-trip
 * unchanged, with field-level checks after parse.
 *
 * An empty series (zero points: unknown) and a series with one point of
 * value 0 (a real zero) parse to different lengths and differ on the wire.
 */
import { Timestamp } from 'google-protobuf/google/protobuf/timestamp_pb';
import { SecurityMetricPointProto, SecurityMetricSeriesProto } from '../../../fintekkers/models/security/security_metric_pb';
import { SecurityMetricTypeProto } from '../../../fintekkers/models/security/security_metric_type_pb';
import type { DecimalValueProto } from '../../../fintekkers/models/util/decimal_value_pb';
import { LocalDateProto } from '../../../fintekkers/models/util/local_date_pb';
import { LocalTimestampProto } from '../../../fintekkers/models/util/local_timestamp_pb';
import { ObjectTypeProto } from '../../../fintekkers/models/util/object_type_pb';
import { UUIDProto } from '../../../fintekkers/models/util/uuid_pb';
import {
  GetLatestSecurityMetricRequestProto,
  GetLatestSecurityMetricResponseProto,
} from '../../../fintekkers/requests/security_metric/get_latest_security_metric_request_pb';
import {
  SearchSecurityMetricRequestProto,
  SearchSecurityMetricResponseProto,
} from '../../../fintekkers/requests/security_metric/search_security_metric_request_pb';
import { decodeDecimal, encodeDecimal, parseDecimalString, toCanonicalString } from '../utils/decimal';

const SPY = new UUIDProto().setRawUuid(new Uint8Array(16).fill(1));
const QQQ = new UUIDProto().setRawUuid(new Uint8Array(16).fill(2));

function asOf(): LocalTimestampProto {
  return new LocalTimestampProto().setTimestamp(new Timestamp().setSeconds(1795392000)).setTimeZone('UTC');
}

function date(year: number, month: number, day: number): LocalDateProto {
  return new LocalDateProto().setYear(year).setMonth(month).setDay(day);
}

function decimal(value: string): DecimalValueProto {
  return encodeDecimal(parseDecimalString(value));
}

function point(observationDate: LocalDateProto, value: string): SecurityMetricPointProto {
  return new SecurityMetricPointProto().setObservationDate(observationDate).setValue(decimal(value));
}

function series(security: UUIDProto, metric: SecurityMetricTypeProto, points: SecurityMetricPointProto[]): SecurityMetricSeriesProto {
  return new SecurityMetricSeriesProto()
    .setObjectType(ObjectTypeProto.OBJECT_TYPE_SECURITY_METRIC_SERIES)
    .setSecurityId(security)
    .setMetric(metric)
    .setAsOf(asOf())
    .setPointsList(points);
}

function pointsOf(s: SecurityMetricSeriesProto): string[] {
  return s.getPointsList().map((p) => {
    const d = p.getObservationDate()!;
    return `${d.getYear()}-${d.getMonth()}-${d.getDay()}=${toCanonicalString(decodeDecimal(p.getValue()!))}`;
  });
}

describe('SecurityMetric round trips (LM-484)', () => {
  test('a 3-point series keeps its order and exact decimals', () => {
    const original = series(SPY, SecurityMetricTypeProto.SHARES_OUTSTANDING, [
      point(date(2026, 9, 28), '15204137000'),
      point(date(2026, 9, 29), '15210000000'),
      point(date(2026, 9, 30), '15198250000'),
    ]);

    const parsed = SecurityMetricSeriesProto.deserializeBinary(original.serializeBinary());

    expect(parsed.toObject()).toEqual(original.toObject());
    expect(parsed.getSecurityId()!.getRawUuid_asU8()).toEqual(SPY.getRawUuid_asU8());
    expect(parsed.getMetric()).toBe(SecurityMetricTypeProto.SHARES_OUTSTANDING);
    expect(parsed.getAsOf()!.toObject()).toEqual(asOf().toObject());
    expect(pointsOf(parsed)).toEqual(['2026-9-28=15204137000', '2026-9-29=15210000000', '2026-9-30=15198250000']);
  });

  test('an empty series is not a 0-valued point', () => {
    const empty = series(SPY, SecurityMetricTypeProto.NAV_PER_SHARE, []);
    const zero = series(SPY, SecurityMetricTypeProto.NAV_PER_SHARE, [point(date(2026, 11, 20), '0')]);

    const parsedEmpty = SecurityMetricSeriesProto.deserializeBinary(empty.serializeBinary());
    const parsedZero = SecurityMetricSeriesProto.deserializeBinary(zero.serializeBinary());

    expect(parsedEmpty.toObject()).toEqual(empty.toObject());
    expect(parsedZero.toObject()).toEqual(zero.toObject());
    expect(parsedEmpty.getPointsList()).toHaveLength(0);
    expect(parsedZero.getPointsList()).toHaveLength(1);
    expect(pointsOf(parsedZero)).toEqual(['2026-11-20=0']);
    expect(Array.from(empty.serializeBinary())).not.toEqual(Array.from(zero.serializeBinary()));
  });

  test('a GetLatest request and response, with a pair that has no point', () => {
    const request = new GetLatestSecurityMetricRequestProto()
      .setObjectType(ObjectTypeProto.OBJECT_TYPE_GET_LATEST_SECURITY_METRIC_REQUEST)
      .setSecurityIdsList([SPY, QQQ])
      .setMetricsList([SecurityMetricTypeProto.TOTAL_NET_ASSETS])
      .setDate(date(2026, 11, 20))
      .setAsOf(asOf());
    const response = new GetLatestSecurityMetricResponseProto()
      .setObjectType(ObjectTypeProto.OBJECT_TYPE_GET_LATEST_SECURITY_METRIC_RESPONSE)
      .setSeriesList([
        series(SPY, SecurityMetricTypeProto.TOTAL_NET_ASSETS, [point(date(2026, 11, 19), '5100000000')]),
        series(QQQ, SecurityMetricTypeProto.TOTAL_NET_ASSETS, []),
      ]);

    const parsedRequest = GetLatestSecurityMetricRequestProto.deserializeBinary(request.serializeBinary());
    const parsedResponse = GetLatestSecurityMetricResponseProto.deserializeBinary(response.serializeBinary());

    expect(parsedRequest.toObject()).toEqual(request.toObject());
    expect(parsedRequest.getSecurityIdsList().map((u) => Array.from(u.getRawUuid_asU8()))).toEqual([
      Array.from(SPY.getRawUuid_asU8()),
      Array.from(QQQ.getRawUuid_asU8()),
    ]);
    expect(parsedRequest.getMetricsList()).toEqual([SecurityMetricTypeProto.TOTAL_NET_ASSETS]);
    expect(parsedRequest.getDate()!.toObject()).toEqual(date(2026, 11, 20).toObject());
    expect(parsedRequest.getAsOf()!.toObject()).toEqual(asOf().toObject());

    expect(parsedResponse.toObject()).toEqual(response.toObject());
    const [spy, qqq] = parsedResponse.getSeriesList();
    expect(parsedResponse.getSeriesList()).toHaveLength(2);
    expect(spy.getSecurityId()!.getRawUuid_asU8()).toEqual(SPY.getRawUuid_asU8());
    expect(pointsOf(spy)).toEqual(['2026-11-19=5100000000']);
    expect(qqq.getSecurityId()!.getRawUuid_asU8()).toEqual(QQQ.getRawUuid_asU8());
    expect(qqq.getMetric()).toBe(SecurityMetricTypeProto.TOTAL_NET_ASSETS);
    expect(qqq.getPointsList()).toHaveLength(0);
  });

  test('a Search request and response', () => {
    const request = new SearchSecurityMetricRequestProto()
      .setObjectType(ObjectTypeProto.OBJECT_TYPE_SEARCH_SECURITY_METRIC_REQUEST)
      .setSecurityId(SPY)
      .setMetricsList([SecurityMetricTypeProto.NAV_PER_SHARE, SecurityMetricTypeProto.SHARES_OUTSTANDING])
      .setStartDate(date(2026, 11, 1))
      .setEndDate(date(2026, 11, 20))
      .setAsOf(asOf());
    const response = new SearchSecurityMetricResponseProto()
      .setObjectType(ObjectTypeProto.OBJECT_TYPE_SEARCH_SECURITY_METRIC_RESPONSE)
      .setSeries(series(SPY, SecurityMetricTypeProto.NAV_PER_SHARE, [
        point(date(2026, 11, 19), '100.98'),
        point(date(2026, 11, 20), '101.42'),
      ]));

    const parsedRequest = SearchSecurityMetricRequestProto.deserializeBinary(request.serializeBinary());
    const parsedResponse = SearchSecurityMetricResponseProto.deserializeBinary(response.serializeBinary());

    expect(parsedRequest.toObject()).toEqual(request.toObject());
    expect(parsedRequest.getSecurityId()!.getRawUuid_asU8()).toEqual(SPY.getRawUuid_asU8());
    expect(parsedRequest.getMetricsList()).toEqual([
      SecurityMetricTypeProto.NAV_PER_SHARE,
      SecurityMetricTypeProto.SHARES_OUTSTANDING,
    ]);
    expect(parsedRequest.getStartDate()!.toObject()).toEqual(date(2026, 11, 1).toObject());
    expect(parsedRequest.getEndDate()!.toObject()).toEqual(date(2026, 11, 20).toObject());
    expect(parsedRequest.getAsOf()!.toObject()).toEqual(asOf().toObject());

    expect(parsedResponse.toObject()).toEqual(response.toObject());
    const s = parsedResponse.getSeries()!;
    expect(s.getMetric()).toBe(SecurityMetricTypeProto.NAV_PER_SHARE);
    expect(pointsOf(s)).toEqual(['2026-11-19=100.98', '2026-11-20=101.42']);
  });
});
