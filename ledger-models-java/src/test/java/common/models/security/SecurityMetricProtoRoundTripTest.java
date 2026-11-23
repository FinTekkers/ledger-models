package common.models.security;

import fintekkers.models.security.SecurityMetricProto;
import fintekkers.models.security.SecurityMetricTypeProto;
import fintekkers.models.util.ObjectTypeProto;
import fintekkers.models.util.VersionProto;
import fintekkers.requests.security_metric.GetLatestSecurityMetricRequestProto;
import fintekkers.requests.security_metric.GetLatestSecurityMetricResponseProto;
import fintekkers.requests.security_metric.SearchSecurityMetricRequestProto;
import fintekkers.requests.security_metric.SearchSecurityMetricResponseProto;
import org.junit.jupiter.api.Test;
import protos.serializers.util.proto.ProtoSerializationUtil;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;

/**
 * LM-482: SecurityMetricProto and the GetLatest and Search request and
 * response messages, with every field set, parse back equal. An unset value
 * parses back unset, not 0.
 */
class SecurityMetricProtoRoundTripTest {

    private static final UUID SECURITY_ID = UUID.fromString("00000000-0000-0000-0000-0000000000a9");
    private static final ZoneId NEW_YORK = ZoneId.of("America/New_York");
    private static final VersionProto VERSION = VersionProto.newBuilder().setMajor(0).setMinor(0).setPatch(1).build();

    private static ZonedDateTime at(int day, int hour) {
        return ZonedDateTime.of(2024, 6, day, hour, 0, 0, 0, NEW_YORK);
    }

    private static SecurityMetricProto metric(SecurityMetricTypeProto kind, String value) {
        return SecurityMetricProto.newBuilder()
                .setObjectType(ObjectTypeProto.OBJECT_TYPE_SECURITY_METRIC)
                .setVersion(VERSION)
                .setUuid(ProtoSerializationUtil.serializeUUID(UUID.randomUUID()))
                .setAsOf(ProtoSerializationUtil.serializeTimestamp(at(3, 18)))
                .setValidFrom(ProtoSerializationUtil.serializeTimestamp(at(3, 17)))
                .setValidTo(ProtoSerializationUtil.serializeTimestamp(at(4, 9)))
                .setSecurityId(ProtoSerializationUtil.serializeUUID(SECURITY_ID))
                .setMetric(kind)
                .setObservationDate(ProtoSerializationUtil.serializeLocalDate(LocalDate.of(2024, 5, 31)))
                .setValue(ProtoSerializationUtil.serializeBigDecimal(new BigDecimal(value)))
                .setSource("STATE_STREET_NAV_HISTORY")
                .build();
    }

    @Test
    void securityMetricWithEveryFieldSetRoundTrips() throws Exception {
        SecurityMetricProto m = metric(SecurityMetricTypeProto.NAV_PER_SHARE, "512.3456");
        SecurityMetricProto parsed = SecurityMetricProto.parseFrom(m.toByteArray());
        assertEquals(m, parsed);
        assertEquals(new BigDecimal("512.3456"), ProtoSerializationUtil.deserializeBigDecimal(parsed.getValue()));
    }

    @Test
    void anUnsetValueParsesBackUnset() throws Exception {
        SecurityMetricProto m = metric(SecurityMetricTypeProto.SHARES_OUTSTANDING, "1").toBuilder().clearValue().build();
        SecurityMetricProto parsed = SecurityMetricProto.parseFrom(m.toByteArray());
        assertEquals(m, parsed);
        assertFalse(parsed.hasValue());
    }

    @Test
    void getLatestRequestAndResponseRoundTrip() throws Exception {
        GetLatestSecurityMetricRequestProto request = GetLatestSecurityMetricRequestProto.newBuilder()
                .setObjectType(ObjectTypeProto.OBJECT_TYPE_GET_LATEST_SECURITY_METRIC_REQUEST)
                .setVersion(VERSION)
                .addSecurityId(ProtoSerializationUtil.serializeUUID(SECURITY_ID))
                .addSecurityId(ProtoSerializationUtil.serializeUUID(UUID.randomUUID()))
                .addMetric(SecurityMetricTypeProto.NAV_PER_SHARE)
                .addMetric(SecurityMetricTypeProto.SHARES_OUTSTANDING)
                .setDate(ProtoSerializationUtil.serializeLocalDate(LocalDate.of(2024, 6, 3)))
                .build();
        assertEquals(request, GetLatestSecurityMetricRequestProto.parseFrom(request.toByteArray()));

        GetLatestSecurityMetricResponseProto response = GetLatestSecurityMetricResponseProto.newBuilder()
                .setObjectType(ObjectTypeProto.OBJECT_TYPE_GET_LATEST_SECURITY_METRIC_RESPONSE)
                .setVersion(VERSION)
                .addSecurityMetricResponse(metric(SecurityMetricTypeProto.NAV_PER_SHARE, "512.3456"))
                .addSecurityMetricResponse(metric(SecurityMetricTypeProto.SHARES_OUTSTANDING, "1003282116"))
                .build();
        assertEquals(response, GetLatestSecurityMetricResponseProto.parseFrom(response.toByteArray()));
    }

    @Test
    void searchRequestAndResponseRoundTrip() throws Exception {
        SearchSecurityMetricRequestProto request = SearchSecurityMetricRequestProto.newBuilder()
                .setObjectType(ObjectTypeProto.OBJECT_TYPE_SEARCH_SECURITY_METRIC_REQUEST)
                .setVersion(VERSION)
                .setSecurityId(ProtoSerializationUtil.serializeUUID(SECURITY_ID))
                .addMetric(SecurityMetricTypeProto.NAV_PER_SHARE)
                .addMetric(SecurityMetricTypeProto.TOTAL_NET_ASSETS)
                .setFromDate(ProtoSerializationUtil.serializeLocalDate(LocalDate.of(2024, 1, 2)))
                .setToDate(ProtoSerializationUtil.serializeLocalDate(LocalDate.of(2024, 6, 3)))
                .build();
        assertEquals(request, SearchSecurityMetricRequestProto.parseFrom(request.toByteArray()));

        SearchSecurityMetricResponseProto response = SearchSecurityMetricResponseProto.newBuilder()
                .setObjectType(ObjectTypeProto.OBJECT_TYPE_SEARCH_SECURITY_METRIC_RESPONSE)
                .setVersion(VERSION)
                .addSecurityMetricResponse(metric(SecurityMetricTypeProto.NAV_PER_SHARE, "512.3456"))
                .addSecurityMetricResponse(metric(SecurityMetricTypeProto.TOTAL_NET_ASSETS, "512345678901.25"))
                .build();
        assertEquals(response, SearchSecurityMetricResponseProto.parseFrom(response.toByteArray()));
    }
}
