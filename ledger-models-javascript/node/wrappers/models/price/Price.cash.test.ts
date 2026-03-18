import assert = require('assert');
import Price from './Price';
import Security from '../security/security';
import { SecurityProto } from '../../../fintekkers/models/security/security_pb';
import { SecurityTypeProto } from '../../../fintekkers/models/security/security_type_pb';
import { UUID } from '../utils/uuid';
import { ZonedDateTime } from '../utils/datetime';
import { Decimal } from 'decimal.js';

test('test Price getCashPrice', () => {
    testGetCashPrice();
});

function testGetCashPrice(): void {
    const cashSecurity = createDummyCashSecurity();
    const asOf = ZonedDateTime.now();

    const cashPrice = Price.getCashPrice(cashSecurity, asOf);

    // Cash price should be 1.0 (Decimal normalizes to '1')
    const priceValue = cashPrice.proto.getPrice()?.getArbitraryPrecisionValue();
    const priceDecimal = new Decimal(priceValue || '0');
    assert(priceDecimal.equals(new Decimal('1.0')), `Expected cash price 1.0, got ${priceValue}`);

    // Security should match
    assert(cashPrice.proto.getSecurity() === cashSecurity.proto, 'Security should match');

    // AsOf should match
    assert(cashPrice.proto.getAsOf()?.getTimeZone() === asOf.toProto().getTimeZone(), 'AsOf timezone should match');
}

function createDummyCashSecurity(): Security {
    const securityProto = new SecurityProto();
    securityProto.setObjectClass('Security');
    securityProto.setVersion('0.0.1');
    securityProto.setUuid(UUID.random().toUUIDProto());
    securityProto.setSecurityType(SecurityTypeProto.CASH_SECURITY);
    securityProto.setAsOf(ZonedDateTime.now().toProto());
    securityProto.setAssetClass('Cash');
    securityProto.setCashId('USD');

    return Security.create(securityProto);
}
