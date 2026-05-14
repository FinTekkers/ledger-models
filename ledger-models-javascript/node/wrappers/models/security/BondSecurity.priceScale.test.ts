import assert = require('assert');
import BondSecurity from './BondSecurity';
import { SecurityProto, BondDetailsProto } from '../../../fintekkers/models/security/security_pb';
import { ProductTypeProto } from "../../../fintekkers/models/security/product_type_pb";
import { DecimalValueProto } from '../../../fintekkers/models/util/decimal_value_pb';
import { LocalDateProto } from '../../../fintekkers/models/util/local_date_pb';
import { UUID } from '../utils/uuid';
import { ZonedDateTime } from '../utils/datetime';
import { Decimal } from 'decimal.js';

test('test BondSecurity getPriceScaleFactor', () => {
    testGetPriceScaleFactor();
});

function testGetPriceScaleFactor(): void {
    const bondSecurity = createDummyBondSecurity();
    const priceScaleFactor = bondSecurity.getPriceScaleFactor();
    
    // Price scale factor should be 0.01 for bonds
    assert(priceScaleFactor.equals(new Decimal('0.01')), 
        `Expected price scale factor 0.01, got ${priceScaleFactor.toString()}`);
}

function createDummyBondSecurity(): BondSecurity {
    const securityProto = new SecurityProto();
    securityProto.setObjectClass('Security');
    securityProto.setVersion('0.0.1');
    securityProto.setUuid(UUID.random().toUUIDProto());
    securityProto.setProductType(ProductTypeProto.TREASURY_NOTE);
    securityProto.setAsOf(ZonedDateTime.now().toProto());
    const bond = new BondDetailsProto();
    bond.setFaceValue(new DecimalValueProto().setArbitraryPrecisionValue('1000.00'));
    bond.setIssueDate(new LocalDateProto().setYear(2021).setMonth(1).setDay(1));
    bond.setMaturityDate(new LocalDateProto().setYear(2031).setMonth(1).setDay(1));
    securityProto.setBondDetails(bond);

    return new BondSecurity(securityProto);
}
