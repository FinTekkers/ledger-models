import { LocalDateProto } from '../../../fintekkers/models/util/local_date_pb';
import { UUID } from '../utils/uuid';

import assert = require('assert');
import Security from './security';

import { DecimalValueProto } from '../../../fintekkers/models/util/decimal_value_pb';
import { SecurityProto } from '../../../fintekkers/models/security/security_pb';
import { CouponFrequencyProto } from '../../../fintekkers/models/security/coupon_frequency_pb';
import { CouponTypeProto } from '../../../fintekkers/models/security/coupon_type_pb';
import { SecurityQuantityTypeProto } from '../../../fintekkers/models/security/security_quantity_type_pb';


test('test the security wrapper', () => {
    testSerialization();
});

function testSerialization(): void {
    const security = dummySecurity();

    assert(security.getMaturityDate().getFullYear() == 2026);
}

function dummySecurity() {
    return new Security(new SecurityProto()
        .setObjectClass('Transaction').setVersion('0.0.1').setUuid(UUID.random().toUUIDProto())
        .setFaceValue(new DecimalValueProto().setArbitraryPrecisionValue('1000.00'))
        .setQuantityType(SecurityQuantityTypeProto.ORIGINAL_FACE_VALUE)
        .setAssetClass("Bond")
        .setIssuerName("Dummy issuer")

        .setCouponRate(new DecimalValueProto().setArbitraryPrecisionValue('0.05'))
        .setCouponFrequency(CouponFrequencyProto.SEMIANNUALLY)
        .setCouponType(CouponTypeProto.FIXED)

        .setMaturityDate(new LocalDateProto().setYear(2026).setMonth(1).setDay(1))
        .setIssueDate(new LocalDateProto().setYear(2021).setMonth(1).setDay(1))
        .setDescription("Dummy security")

    );
}

