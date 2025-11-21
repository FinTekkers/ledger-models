import assert = require('assert');
import { PositionFilter } from './positionfilter';
import { FieldProto } from '../../../fintekkers/models/position/field_pb';
import { PositionFilterOperator } from '../../../fintekkers/models/position/position_util_pb';
import { Identifier } from '../security/identifier';
import { IdentifierProto } from '../../../fintekkers/models/security/identifier/identifier_pb';
import { IdentifierTypeProto } from '../../../fintekkers/models/security/identifier/identifier_type_pb';
import { unpack } from '../utils/serialization.util';
import { Any } from 'google-protobuf/google/protobuf/any_pb';
import { TransactionTypeProto } from '../../../fintekkers/models/transaction/transaction_type_pb';

test('test PositionFilter.addEqualsStringFilter adds string filter', () => {
    testAddEqualsStringFilter();
});

test('test PositionFilter.addEqualsFilter with string', () => {
    testAddEqualsFilterWithString();
});

test('test PositionFilter.addFilter with string value', () => {
    testAddFilterWithString();
});

test('test PositionFilter.addObjectFilter adds Identifier filter', () => {
    testAddObjectFilter();
});

test('test PositionFilter method chaining', () => {
    testMethodChaining();
});

test('test PositionFilter.getFilters returns all filters', () => {
    testGetFilters();
});

test('test PositionFilter.toProto creates PositionFilterProto', () => {
    testToProto();
});

test('test PositionFilter.addFilter throws error when no value provided', () => {
    testAddFilterThrowsError();
});


test('test PositionFilter.addFilter handles TransactionType enum', () => {
    testAddFilterHandlesTransactionTypeEnum();
});


function testAddEqualsStringFilter(): void {
    const filter = new PositionFilter();
    filter.addEqualsStringFilter(FieldProto.ASSET_CLASS, 'FixedIncome');

    const filters = filter.getFilters();
    assert(filters.length === 1, 'Should have one filter');

    const fieldEntry = filters[0];
    assert(fieldEntry.getField() === FieldProto.ASSET_CLASS, 'Field should be ASSET_CLASS');
    assert(fieldEntry.getOperator() === PositionFilterOperator.EQUALS, 'Operator should be EQUALS');
    assert(fieldEntry.getStringValue() === 'FixedIncome', 'String value should be "FixedIncome"');
}

function testAddEqualsFilterWithString(): void {
    const filter = new PositionFilter();
    filter.addEqualsFilter(FieldProto.PRODUCT_TYPE, 'Bond');

    const filters = filter.getFilters();
    assert(filters.length === 1, 'Should have one filter');

    const fieldEntry = filters[0];
    assert(fieldEntry.getField() === FieldProto.PRODUCT_TYPE, 'Field should be PRODUCT_TYPE');
    assert(fieldEntry.getOperator() === PositionFilterOperator.EQUALS, 'Operator should be EQUALS');
    assert(fieldEntry.getStringValue() === 'Bond', 'String value should be "Bond"');
}

function testAddFilterWithString(): void {
    const filter = new PositionFilter();
    filter.addFilter(FieldProto.SECURITY_DESCRIPTION, PositionFilterOperator.EQUALS, null, 'Test Security');

    const filters = filter.getFilters();
    assert(filters.length === 1, 'Should have one filter');

    const fieldEntry = filters[0];
    assert(fieldEntry.getField() === FieldProto.SECURITY_DESCRIPTION, 'Field should be SECURITY_DESCRIPTION');
    assert(fieldEntry.getOperator() === PositionFilterOperator.EQUALS, 'Operator should be EQUALS');
    assert(fieldEntry.getStringValue() === 'Test Security', 'String value should be "Test Security"');
}

function testAddObjectFilter(): void {
    const identifierProto = new IdentifierProto();
    identifierProto.setIdentifierType(IdentifierTypeProto.ISIN);
    identifierProto.setIdentifierValue('US0378331005');
    const identifier = new Identifier(identifierProto);

    const filter = new PositionFilter();
    // Test addObjectFilter method which specifically handles Identifier objects
    filter.addObjectFilter(FieldProto.IDENTIFIER, identifier);

    const filters = filter.getFilters();
    assert(filters.length === 1, 'Should have one filter');

    const fieldEntry = filters[0];
    assert(fieldEntry.getField() === FieldProto.IDENTIFIER, 'Field should be IDENTIFIER');
    assert(fieldEntry.getOperator() === PositionFilterOperator.EQUALS, 'Operator should be EQUALS');

    let a = fieldEntry.getFieldValuePacked();
    let b = unpack(a as Any) as Identifier;

    assert(b.getIdentifierValue() === 'US0378331005', 'Identifier value should be "US0378331005"');
    assert(b.getIdentifierTypeName() === 'ISIN', 'Identifier type name should be "ISIN"');
}

function testMethodChaining(): void {
    const filter = new PositionFilter();
    const result = filter
        .addEqualsStringFilter(FieldProto.ASSET_CLASS, 'Equity')
        .addEqualsStringFilter(FieldProto.PRODUCT_TYPE, 'Stock')
        .addEqualsFilter(FieldProto.SECURITY_DESCRIPTION, 'Apple Inc.');

    assert(result === filter, 'Should return the same instance for chaining');

    const filters = filter.getFilters();
    assert(filters.length === 3, 'Should have three filters');
    assert(filters[0].getField() === FieldProto.ASSET_CLASS, 'First filter should be ASSET_CLASS');
    assert(filters[1].getField() === FieldProto.PRODUCT_TYPE, 'Second filter should be PRODUCT_TYPE');
    assert(filters[2].getField() === FieldProto.SECURITY_DESCRIPTION, 'Third filter should be SECURITY_DESCRIPTION');
}

function testGetFilters(): void {
    const filter = new PositionFilter();
    filter.addEqualsStringFilter(FieldProto.ASSET_CLASS, 'FixedIncome');
    filter.addEqualsStringFilter(FieldProto.PRODUCT_TYPE, 'Bond');

    const filters = filter.getFilters();
    assert(Array.isArray(filters), 'Should return an array');
    assert(filters.length === 2, 'Should return two filters');
    assert(filters[0].getField() === FieldProto.ASSET_CLASS, 'First filter should be ASSET_CLASS');
    assert(filters[1].getField() === FieldProto.PRODUCT_TYPE, 'Second filter should be PRODUCT_TYPE');
}

function testToProto(): void {
    const filter = new PositionFilter();
    filter.addEqualsStringFilter(FieldProto.ASSET_CLASS, 'FixedIncome');
    filter.addEqualsStringFilter(FieldProto.PRODUCT_TYPE, 'Bond');

    const proto = filter.toProto();
    assert(proto !== null && proto !== undefined, 'Should return a PositionFilterProto');
    assert(proto.getObjectClass() === 'PositionFilter', 'Object class should be "PositionFilter"');
    assert(proto.getVersion() === '0.0.1', 'Version should be "0.0.1"');

    const filtersList = proto.getFiltersList();
    assert(filtersList.length === 2, 'Should have two filters in proto');
    assert(filtersList[0].getField() === FieldProto.ASSET_CLASS, 'First filter should be ASSET_CLASS');
    assert(filtersList[1].getField() === FieldProto.PRODUCT_TYPE, 'Second filter should be PRODUCT_TYPE');
}

function testAddFilterThrowsError(): void {
    const filter = new PositionFilter();

    try {
        filter.addFilter(FieldProto.ASSET_CLASS, PositionFilterOperator.EQUALS);
        assert(false, 'Should have thrown an error');
    } catch (error) {
        assert(error instanceof Error, 'Should throw Error');
        assert(error.message.includes('Need to provide a string, enum value (number), or object'), 'Error message should mention providing a value');
    }
}

function testAddFilterHandlesTransactionTypeEnum(): void {
    const filter = new PositionFilter();
    filter.addFilter(FieldProto.TRANSACTION_TYPE, PositionFilterOperator.EQUALS, TransactionTypeProto.BUY);

    const filters = filter.getFilters();
    assert(filters.length === 1, 'Should have one filter');

    const fieldEntry = filters[0];
    assert(fieldEntry.getField() === FieldProto.TRANSACTION_TYPE, 'Field should be TRANSACTION_TYPE');
    assert(fieldEntry.getOperator() === PositionFilterOperator.EQUALS, 'Operator should be EQUALS');
    assert(fieldEntry.getEnumValue() === TransactionTypeProto.BUY, 'Enum value should be BUY');
    assert(fieldEntry.getStringValue() === '', 'String value should be empty for enum');
    assert(fieldEntry.getFieldValuePacked() === undefined, 'Packed value should be undefined for enum');
}

