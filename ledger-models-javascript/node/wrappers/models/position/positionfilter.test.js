"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const assert = require("assert");
const positionfilter_1 = require("./positionfilter");
const field_pb_1 = require("../../../fintekkers/models/position/field_pb");
const position_util_pb_1 = require("../../../fintekkers/models/position/position_util_pb");
const identifier_1 = require("../security/identifier");
const identifier_pb_1 = require("../../../fintekkers/models/security/identifier/identifier_pb");
const identifier_type_pb_1 = require("../../../fintekkers/models/security/identifier/identifier_type_pb");
const serialization_util_1 = require("../utils/serialization.util");
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
function testAddEqualsStringFilter() {
    const filter = new positionfilter_1.PositionFilter();
    filter.addEqualsStringFilter(field_pb_1.FieldProto.ASSET_CLASS, 'FixedIncome');
    const filters = filter.getFilters();
    assert(filters.length === 1, 'Should have one filter');
    const fieldEntry = filters[0];
    assert(fieldEntry.getField() === field_pb_1.FieldProto.ASSET_CLASS, 'Field should be ASSET_CLASS');
    assert(fieldEntry.getOperator() === position_util_pb_1.PositionFilterOperator.EQUALS, 'Operator should be EQUALS');
    assert(fieldEntry.getStringValue() === 'FixedIncome', 'String value should be "FixedIncome"');
}
function testAddEqualsFilterWithString() {
    const filter = new positionfilter_1.PositionFilter();
    filter.addEqualsFilter(field_pb_1.FieldProto.PRODUCT_TYPE, 'Bond');
    const filters = filter.getFilters();
    assert(filters.length === 1, 'Should have one filter');
    const fieldEntry = filters[0];
    assert(fieldEntry.getField() === field_pb_1.FieldProto.PRODUCT_TYPE, 'Field should be PRODUCT_TYPE');
    assert(fieldEntry.getOperator() === position_util_pb_1.PositionFilterOperator.EQUALS, 'Operator should be EQUALS');
    assert(fieldEntry.getStringValue() === 'Bond', 'String value should be "Bond"');
}
function testAddFilterWithString() {
    const filter = new positionfilter_1.PositionFilter();
    filter.addFilter(field_pb_1.FieldProto.SECURITY_DESCRIPTION, position_util_pb_1.PositionFilterOperator.EQUALS, null, 'Test Security');
    const filters = filter.getFilters();
    assert(filters.length === 1, 'Should have one filter');
    const fieldEntry = filters[0];
    assert(fieldEntry.getField() === field_pb_1.FieldProto.SECURITY_DESCRIPTION, 'Field should be SECURITY_DESCRIPTION');
    assert(fieldEntry.getOperator() === position_util_pb_1.PositionFilterOperator.EQUALS, 'Operator should be EQUALS');
    assert(fieldEntry.getStringValue() === 'Test Security', 'String value should be "Test Security"');
}
function testAddObjectFilter() {
    const identifierProto = new identifier_pb_1.IdentifierProto();
    identifierProto.setIdentifierType(identifier_type_pb_1.IdentifierTypeProto.ISIN);
    identifierProto.setIdentifierValue('US0378331005');
    const identifier = new identifier_1.Identifier(identifierProto);
    const filter = new positionfilter_1.PositionFilter();
    // Test addObjectFilter method which specifically handles Identifier objects
    filter.addObjectFilter(field_pb_1.FieldProto.IDENTIFIER, identifier);
    const filters = filter.getFilters();
    assert(filters.length === 1, 'Should have one filter');
    const fieldEntry = filters[0];
    assert(fieldEntry.getField() === field_pb_1.FieldProto.IDENTIFIER, 'Field should be IDENTIFIER');
    assert(fieldEntry.getOperator() === position_util_pb_1.PositionFilterOperator.EQUALS, 'Operator should be EQUALS');
    let a = fieldEntry.getFieldValuePacked();
    let b = (0, serialization_util_1.unpack)(a);
    assert(b.toString() === identifier.toString(), 'Identifier should be the same');
    // const packedValue = fieldEntry.getFieldValuePacked();
    // assert(packedValue !== null && packedValue !== undefined, 'Should have packed value');
    // assert(packedValue.getTypeUrl().includes('IdentifierProto'), 'Type URL should include IdentifierProto');
}
function testMethodChaining() {
    const filter = new positionfilter_1.PositionFilter();
    const result = filter
        .addEqualsStringFilter(field_pb_1.FieldProto.ASSET_CLASS, 'Equity')
        .addEqualsStringFilter(field_pb_1.FieldProto.PRODUCT_TYPE, 'Stock')
        .addEqualsFilter(field_pb_1.FieldProto.SECURITY_DESCRIPTION, 'Apple Inc.');
    assert(result === filter, 'Should return the same instance for chaining');
    const filters = filter.getFilters();
    assert(filters.length === 3, 'Should have three filters');
    assert(filters[0].getField() === field_pb_1.FieldProto.ASSET_CLASS, 'First filter should be ASSET_CLASS');
    assert(filters[1].getField() === field_pb_1.FieldProto.PRODUCT_TYPE, 'Second filter should be PRODUCT_TYPE');
    assert(filters[2].getField() === field_pb_1.FieldProto.SECURITY_DESCRIPTION, 'Third filter should be SECURITY_DESCRIPTION');
}
function testGetFilters() {
    const filter = new positionfilter_1.PositionFilter();
    filter.addEqualsStringFilter(field_pb_1.FieldProto.ASSET_CLASS, 'FixedIncome');
    filter.addEqualsStringFilter(field_pb_1.FieldProto.PRODUCT_TYPE, 'Bond');
    const filters = filter.getFilters();
    assert(Array.isArray(filters), 'Should return an array');
    assert(filters.length === 2, 'Should return two filters');
    assert(filters[0].getField() === field_pb_1.FieldProto.ASSET_CLASS, 'First filter should be ASSET_CLASS');
    assert(filters[1].getField() === field_pb_1.FieldProto.PRODUCT_TYPE, 'Second filter should be PRODUCT_TYPE');
}
function testToProto() {
    const filter = new positionfilter_1.PositionFilter();
    filter.addEqualsStringFilter(field_pb_1.FieldProto.ASSET_CLASS, 'FixedIncome');
    filter.addEqualsStringFilter(field_pb_1.FieldProto.PRODUCT_TYPE, 'Bond');
    const proto = filter.toProto();
    assert(proto !== null && proto !== undefined, 'Should return a PositionFilterProto');
    assert(proto.getObjectClass() === 'PositionFilter', 'Object class should be "PositionFilter"');
    assert(proto.getVersion() === '0.0.1', 'Version should be "0.0.1"');
    const filtersList = proto.getFiltersList();
    assert(filtersList.length === 2, 'Should have two filters in proto');
    assert(filtersList[0].getField() === field_pb_1.FieldProto.ASSET_CLASS, 'First filter should be ASSET_CLASS');
    assert(filtersList[1].getField() === field_pb_1.FieldProto.PRODUCT_TYPE, 'Second filter should be PRODUCT_TYPE');
}
function testAddFilterThrowsError() {
    const filter = new positionfilter_1.PositionFilter();
    try {
        filter.addFilter(field_pb_1.FieldProto.ASSET_CLASS, position_util_pb_1.PositionFilterOperator.EQUALS);
        assert(false, 'Should have thrown an error');
    }
    catch (error) {
        assert(error instanceof Error, 'Should throw Error');
        assert(error.message.includes('Need to provide a string, or object'), 'Error message should mention providing a value');
    }
}
//# sourceMappingURL=positionfilter.test.js.map