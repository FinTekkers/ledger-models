"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// LM-482: SecurityMetricProto and the GetLatest and Search request and
// response messages, with every field set, parse back equal. An unset value
// parses back unset, not 0.
const timestamp_pb_1 = require("google-protobuf/google/protobuf/timestamp_pb");
const security_metric_pb_1 = require("../../../fintekkers/models/security/security_metric_pb");
const security_metric_type_pb_1 = require("../../../fintekkers/models/security/security_metric_type_pb");
const local_date_pb_1 = require("../../../fintekkers/models/util/local_date_pb");
const local_timestamp_pb_1 = require("../../../fintekkers/models/util/local_timestamp_pb");
const object_type_pb_1 = require("../../../fintekkers/models/util/object_type_pb");
const version_pb_1 = require("../../../fintekkers/models/util/version_pb");
const get_latest_security_metric_request_pb_1 = require("../../../fintekkers/requests/security_metric/get_latest_security_metric_request_pb");
const search_security_metric_request_pb_1 = require("../../../fintekkers/requests/security_metric/search_security_metric_request_pb");
const decimal_1 = require("../utils/decimal");
const uuid_1 = require("../utils/uuid");
const SECURITY_ID = uuid_1.UUID.random().toUUIDProto();
const version = () => new version_pb_1.VersionProto().setMajor(0).setMinor(0).setPatch(1);
const date = (y, m, d) => new local_date_pb_1.LocalDateProto().setYear(y).setMonth(m).setDay(d);
const ts = (seconds) => new local_timestamp_pb_1.LocalTimestampProto().setTimestamp(new timestamp_pb_1.Timestamp().setSeconds(seconds)).setTimeZone('America/New_York');
function metric(kind, value) {
    return new security_metric_pb_1.SecurityMetricProto()
        .setObjectType(object_type_pb_1.ObjectTypeProto.OBJECT_TYPE_SECURITY_METRIC)
        .setVersion(version())
        .setUuid(uuid_1.UUID.random().toUUIDProto())
        .setAsOf(ts(1717400000))
        .setValidFrom(ts(1717300000))
        .setValidTo(ts(1717500000))
        .setSecurityId(SECURITY_ID)
        .setMetric(kind)
        .setObservationDate(date(2024, 5, 31))
        .setValue((0, decimal_1.encodeDecimal)((0, decimal_1.parseDecimalString)(value)))
        .setSource('STATE_STREET_NAV_HISTORY');
}
describe('SecurityMetric messages round-trip (LM-482)', () => {
    test('SecurityMetricProto with every field set', () => {
        const m = metric(security_metric_type_pb_1.SecurityMetricTypeProto.NAV_PER_SHARE, '512.3456');
        const parsed = security_metric_pb_1.SecurityMetricProto.deserializeBinary(m.serializeBinary());
        expect(parsed.toObject()).toEqual(m.toObject());
        expect(parsed.getMetric()).toBe(security_metric_type_pb_1.SecurityMetricTypeProto.NAV_PER_SHARE);
        expect(parsed.getSource()).toBe('STATE_STREET_NAV_HISTORY');
        expect((0, decimal_1.toCanonicalString)((0, decimal_1.decodeDecimal)(parsed.getValue()))).toBe('512.3456');
    });
    test('an unset value parses back unset, not 0', () => {
        const m = metric(security_metric_type_pb_1.SecurityMetricTypeProto.SHARES_OUTSTANDING, '1');
        m.clearValue();
        const parsed = security_metric_pb_1.SecurityMetricProto.deserializeBinary(m.serializeBinary());
        expect(parsed.toObject()).toEqual(m.toObject());
        expect(parsed.hasValue()).toBe(false);
    });
    test('GetLatest request and response', () => {
        const request = new get_latest_security_metric_request_pb_1.GetLatestSecurityMetricRequestProto()
            .setObjectType(object_type_pb_1.ObjectTypeProto.OBJECT_TYPE_GET_LATEST_SECURITY_METRIC_REQUEST)
            .setVersion(version())
            .setSecurityIdList([SECURITY_ID, uuid_1.UUID.random().toUUIDProto()])
            .setMetricList([security_metric_type_pb_1.SecurityMetricTypeProto.NAV_PER_SHARE, security_metric_type_pb_1.SecurityMetricTypeProto.SHARES_OUTSTANDING])
            .setDate(date(2024, 6, 3));
        const parsedRequest = get_latest_security_metric_request_pb_1.GetLatestSecurityMetricRequestProto.deserializeBinary(request.serializeBinary());
        expect(parsedRequest.toObject()).toEqual(request.toObject());
        expect(parsedRequest.getSecurityIdList()).toHaveLength(2);
        const response = new get_latest_security_metric_request_pb_1.GetLatestSecurityMetricResponseProto()
            .setObjectType(object_type_pb_1.ObjectTypeProto.OBJECT_TYPE_GET_LATEST_SECURITY_METRIC_RESPONSE)
            .setVersion(version())
            .setSecurityMetricResponseList([
            metric(security_metric_type_pb_1.SecurityMetricTypeProto.NAV_PER_SHARE, '512.3456'),
            metric(security_metric_type_pb_1.SecurityMetricTypeProto.SHARES_OUTSTANDING, '1003282116'),
        ]);
        const parsedResponse = get_latest_security_metric_request_pb_1.GetLatestSecurityMetricResponseProto.deserializeBinary(response.serializeBinary());
        expect(parsedResponse.toObject()).toEqual(response.toObject());
        expect(parsedResponse.getSecurityMetricResponseList()).toHaveLength(2);
    });
    test('Search request and response', () => {
        const request = new search_security_metric_request_pb_1.SearchSecurityMetricRequestProto()
            .setObjectType(object_type_pb_1.ObjectTypeProto.OBJECT_TYPE_SEARCH_SECURITY_METRIC_REQUEST)
            .setVersion(version())
            .setSecurityId(SECURITY_ID)
            .setMetricList([security_metric_type_pb_1.SecurityMetricTypeProto.NAV_PER_SHARE, security_metric_type_pb_1.SecurityMetricTypeProto.TOTAL_NET_ASSETS])
            .setFromDate(date(2024, 1, 2))
            .setToDate(date(2024, 6, 3));
        const parsedRequest = search_security_metric_request_pb_1.SearchSecurityMetricRequestProto.deserializeBinary(request.serializeBinary());
        expect(parsedRequest.toObject()).toEqual(request.toObject());
        expect(parsedRequest.getMetricList()).toHaveLength(2);
        const response = new search_security_metric_request_pb_1.SearchSecurityMetricResponseProto()
            .setObjectType(object_type_pb_1.ObjectTypeProto.OBJECT_TYPE_SEARCH_SECURITY_METRIC_RESPONSE)
            .setVersion(version())
            .setSecurityMetricResponseList([
            metric(security_metric_type_pb_1.SecurityMetricTypeProto.NAV_PER_SHARE, '512.3456'),
            metric(security_metric_type_pb_1.SecurityMetricTypeProto.TOTAL_NET_ASSETS, '512345678901.25'),
        ]);
        const parsedResponse = search_security_metric_request_pb_1.SearchSecurityMetricResponseProto.deserializeBinary(response.serializeBinary());
        expect(parsedResponse.toObject()).toEqual(response.toObject());
        expect(parsedResponse.getSecurityMetricResponseList()).toHaveLength(2);
    });
});
//# sourceMappingURL=security_metric.roundtrip.test.js.map