"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * LM-484: security metric series, GetLatest and Search messages round-trip
 * unchanged, with field-level checks after parse.
 *
 * An empty series (zero points: unknown) and a series with one point of
 * value 0 (a real zero) parse to different lengths and differ on the wire.
 */
const timestamp_pb_1 = require("google-protobuf/google/protobuf/timestamp_pb");
const security_metric_pb_1 = require("../../../fintekkers/models/security/security_metric_pb");
const security_metric_type_pb_1 = require("../../../fintekkers/models/security/security_metric_type_pb");
const local_date_pb_1 = require("../../../fintekkers/models/util/local_date_pb");
const local_timestamp_pb_1 = require("../../../fintekkers/models/util/local_timestamp_pb");
const object_type_pb_1 = require("../../../fintekkers/models/util/object_type_pb");
const uuid_pb_1 = require("../../../fintekkers/models/util/uuid_pb");
const get_latest_security_metric_request_pb_1 = require("../../../fintekkers/requests/security_metric/get_latest_security_metric_request_pb");
const search_security_metric_request_pb_1 = require("../../../fintekkers/requests/security_metric/search_security_metric_request_pb");
const decimal_1 = require("../utils/decimal");
const SPY = new uuid_pb_1.UUIDProto().setRawUuid(new Uint8Array(16).fill(1));
const QQQ = new uuid_pb_1.UUIDProto().setRawUuid(new Uint8Array(16).fill(2));
function asOf() {
    return new local_timestamp_pb_1.LocalTimestampProto().setTimestamp(new timestamp_pb_1.Timestamp().setSeconds(1795392000)).setTimeZone('UTC');
}
function date(year, month, day) {
    return new local_date_pb_1.LocalDateProto().setYear(year).setMonth(month).setDay(day);
}
function decimal(value) {
    return (0, decimal_1.encodeDecimal)((0, decimal_1.parseDecimalString)(value));
}
function point(observationDate, value) {
    return new security_metric_pb_1.SecurityMetricPointProto().setObservationDate(observationDate).setValue(decimal(value));
}
function series(security, metric, points) {
    return new security_metric_pb_1.SecurityMetricSeriesProto()
        .setObjectType(object_type_pb_1.ObjectTypeProto.OBJECT_TYPE_SECURITY_METRIC_SERIES)
        .setSecurityId(security)
        .setMetric(metric)
        .setAsOf(asOf())
        .setPointsList(points);
}
function pointsOf(s) {
    return s.getPointsList().map((p) => {
        const d = p.getObservationDate();
        return `${d.getYear()}-${d.getMonth()}-${d.getDay()}=${(0, decimal_1.toCanonicalString)((0, decimal_1.decodeDecimal)(p.getValue()))}`;
    });
}
describe('SecurityMetric round trips (LM-484)', () => {
    test('a 3-point series keeps its order and exact decimals', () => {
        const original = series(SPY, security_metric_type_pb_1.SecurityMetricTypeProto.SHARES_OUTSTANDING, [
            point(date(2026, 9, 28), '15204137000'),
            point(date(2026, 9, 29), '15210000000'),
            point(date(2026, 9, 30), '15198250000'),
        ]);
        const parsed = security_metric_pb_1.SecurityMetricSeriesProto.deserializeBinary(original.serializeBinary());
        expect(parsed.toObject()).toEqual(original.toObject());
        expect(parsed.getSecurityId().getRawUuid_asU8()).toEqual(SPY.getRawUuid_asU8());
        expect(parsed.getMetric()).toBe(security_metric_type_pb_1.SecurityMetricTypeProto.SHARES_OUTSTANDING);
        expect(parsed.getAsOf().toObject()).toEqual(asOf().toObject());
        expect(pointsOf(parsed)).toEqual(['2026-9-28=15204137000', '2026-9-29=15210000000', '2026-9-30=15198250000']);
    });
    test('a sparse EXPENSE_RATIO series, one point per change, keeps its exact decimals (LM-491)', () => {
        const original = series(SPY, security_metric_type_pb_1.SecurityMetricTypeProto.EXPENSE_RATIO, [
            point(date(2018, 1, 1), '0.0945'),
            point(date(2026, 1, 1), '0.0900'),
        ]);
        const parsed = security_metric_pb_1.SecurityMetricSeriesProto.deserializeBinary(original.serializeBinary());
        expect(parsed.toObject()).toEqual(original.toObject());
        expect(parsed.getMetric()).toBe(security_metric_type_pb_1.SecurityMetricTypeProto.EXPENSE_RATIO);
        expect(parsed.getMetric()).toBe(4);
        expect(pointsOf(parsed)).toEqual(['2018-1-1=0.0945', '2026-1-1=0.0900']);
    });
    test('an empty series is not a 0-valued point', () => {
        const empty = series(SPY, security_metric_type_pb_1.SecurityMetricTypeProto.NAV_PER_SHARE, []);
        const zero = series(SPY, security_metric_type_pb_1.SecurityMetricTypeProto.NAV_PER_SHARE, [point(date(2026, 11, 20), '0')]);
        const parsedEmpty = security_metric_pb_1.SecurityMetricSeriesProto.deserializeBinary(empty.serializeBinary());
        const parsedZero = security_metric_pb_1.SecurityMetricSeriesProto.deserializeBinary(zero.serializeBinary());
        expect(parsedEmpty.toObject()).toEqual(empty.toObject());
        expect(parsedZero.toObject()).toEqual(zero.toObject());
        expect(parsedEmpty.getPointsList()).toHaveLength(0);
        expect(parsedZero.getPointsList()).toHaveLength(1);
        expect(pointsOf(parsedZero)).toEqual(['2026-11-20=0']);
        expect(Array.from(empty.serializeBinary())).not.toEqual(Array.from(zero.serializeBinary()));
    });
    test('a GetLatest request and response, with a pair that has no point', () => {
        const request = new get_latest_security_metric_request_pb_1.GetLatestSecurityMetricRequestProto()
            .setObjectType(object_type_pb_1.ObjectTypeProto.OBJECT_TYPE_GET_LATEST_SECURITY_METRIC_REQUEST)
            .setSecurityIdsList([SPY, QQQ])
            .setMetricsList([security_metric_type_pb_1.SecurityMetricTypeProto.TOTAL_NET_ASSETS])
            .setDate(date(2026, 11, 20))
            .setAsOf(asOf());
        const response = new get_latest_security_metric_request_pb_1.GetLatestSecurityMetricResponseProto()
            .setObjectType(object_type_pb_1.ObjectTypeProto.OBJECT_TYPE_GET_LATEST_SECURITY_METRIC_RESPONSE)
            .setSeriesList([
            series(SPY, security_metric_type_pb_1.SecurityMetricTypeProto.TOTAL_NET_ASSETS, [point(date(2026, 11, 19), '5100000000')]),
            series(QQQ, security_metric_type_pb_1.SecurityMetricTypeProto.TOTAL_NET_ASSETS, []),
        ]);
        const parsedRequest = get_latest_security_metric_request_pb_1.GetLatestSecurityMetricRequestProto.deserializeBinary(request.serializeBinary());
        const parsedResponse = get_latest_security_metric_request_pb_1.GetLatestSecurityMetricResponseProto.deserializeBinary(response.serializeBinary());
        expect(parsedRequest.toObject()).toEqual(request.toObject());
        expect(parsedRequest.getSecurityIdsList().map((u) => Array.from(u.getRawUuid_asU8()))).toEqual([
            Array.from(SPY.getRawUuid_asU8()),
            Array.from(QQQ.getRawUuid_asU8()),
        ]);
        expect(parsedRequest.getMetricsList()).toEqual([security_metric_type_pb_1.SecurityMetricTypeProto.TOTAL_NET_ASSETS]);
        expect(parsedRequest.getDate().toObject()).toEqual(date(2026, 11, 20).toObject());
        expect(parsedRequest.getAsOf().toObject()).toEqual(asOf().toObject());
        expect(parsedResponse.toObject()).toEqual(response.toObject());
        const [spy, qqq] = parsedResponse.getSeriesList();
        expect(parsedResponse.getSeriesList()).toHaveLength(2);
        expect(spy.getSecurityId().getRawUuid_asU8()).toEqual(SPY.getRawUuid_asU8());
        expect(pointsOf(spy)).toEqual(['2026-11-19=5100000000']);
        expect(qqq.getSecurityId().getRawUuid_asU8()).toEqual(QQQ.getRawUuid_asU8());
        expect(qqq.getMetric()).toBe(security_metric_type_pb_1.SecurityMetricTypeProto.TOTAL_NET_ASSETS);
        expect(qqq.getPointsList()).toHaveLength(0);
    });
    test('a Search request and response', () => {
        const request = new search_security_metric_request_pb_1.SearchSecurityMetricRequestProto()
            .setObjectType(object_type_pb_1.ObjectTypeProto.OBJECT_TYPE_SEARCH_SECURITY_METRIC_REQUEST)
            .setSecurityId(SPY)
            .setMetricsList([security_metric_type_pb_1.SecurityMetricTypeProto.NAV_PER_SHARE, security_metric_type_pb_1.SecurityMetricTypeProto.SHARES_OUTSTANDING])
            .setStartDate(date(2026, 11, 1))
            .setEndDate(date(2026, 11, 20))
            .setAsOf(asOf());
        const response = new search_security_metric_request_pb_1.SearchSecurityMetricResponseProto()
            .setObjectType(object_type_pb_1.ObjectTypeProto.OBJECT_TYPE_SEARCH_SECURITY_METRIC_RESPONSE)
            .setSeries(series(SPY, security_metric_type_pb_1.SecurityMetricTypeProto.NAV_PER_SHARE, [
            point(date(2026, 11, 19), '100.98'),
            point(date(2026, 11, 20), '101.42'),
        ]));
        const parsedRequest = search_security_metric_request_pb_1.SearchSecurityMetricRequestProto.deserializeBinary(request.serializeBinary());
        const parsedResponse = search_security_metric_request_pb_1.SearchSecurityMetricResponseProto.deserializeBinary(response.serializeBinary());
        expect(parsedRequest.toObject()).toEqual(request.toObject());
        expect(parsedRequest.getSecurityId().getRawUuid_asU8()).toEqual(SPY.getRawUuid_asU8());
        expect(parsedRequest.getMetricsList()).toEqual([
            security_metric_type_pb_1.SecurityMetricTypeProto.NAV_PER_SHARE,
            security_metric_type_pb_1.SecurityMetricTypeProto.SHARES_OUTSTANDING,
        ]);
        expect(parsedRequest.getStartDate().toObject()).toEqual(date(2026, 11, 1).toObject());
        expect(parsedRequest.getEndDate().toObject()).toEqual(date(2026, 11, 20).toObject());
        expect(parsedRequest.getAsOf().toObject()).toEqual(asOf().toObject());
        expect(parsedResponse.toObject()).toEqual(response.toObject());
        const s = parsedResponse.getSeries();
        expect(s.getMetric()).toBe(security_metric_type_pb_1.SecurityMetricTypeProto.NAV_PER_SHARE);
        expect(pointsOf(s)).toEqual(['2026-11-19=100.98', '2026-11-20=101.42']);
    });
});
//# sourceMappingURL=security-metric-roundtrip.test.js.map