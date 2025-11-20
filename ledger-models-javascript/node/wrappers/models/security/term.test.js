"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const assert = require("assert");
const term_1 = require("./term");
const tenor_type_pb_1 = require("../../../fintekkers/models/security/tenor_type_pb");
const tenor_pb_1 = require("../../../fintekkers/models/security/tenor_pb");
test('test Tenor.UNKNOWN_TENOR has correct type', () => {
    testUnknownTenor();
});
test('test Tenor constructor with type only', () => {
    testTenorConstructorTypeOnly();
});
test('test Tenor constructor with type and string term', () => {
    testTenorConstructorWithString();
});
test('test Tenor constructor with type and Period', () => {
    testTenorConstructorWithPeriod();
});
test('test Tenor constructor throws error for non-TERM type with Period', () => {
    testTenorConstructorError();
});
test('test Tenor.getType() returns correct type', () => {
    testGetType();
});
test('test Tenor.getTenor() returns correct period', () => {
    testGetTenor();
});
test('test Tenor.getTenorDescription() returns correct string', () => {
    testGetTenorDescription();
});
test('test Tenor toString', () => {
    let tenorProto = new tenor_pb_1.TenorProto().setTenorType(tenor_type_pb_1.TenorTypeProto.TERM).setTermValue("2Y3M");
    let tenor2 = new term_1.Tenor(tenorProto.getTenorType(), tenorProto.getTermValue());
    expect(tenor2.toString()).toBe("TERM: 2Y3M");
});
test('test Tenor.toString() returns correct representation', () => {
    testToString();
});
test('test Tenor.fromTenorDescription() parses various formats', () => {
    testFromTenorDescription();
});
test('test Tenor.periodToString() converts period to string', () => {
    testPeriodToString();
});
test('test Tenor.parsePeriod() parses period strings', () => {
    testParsePeriod();
});
test('test Tenor.parsePeriod() handles edge cases', () => {
    testParsePeriodEdgeCases();
});
test('test Tenor.parsePeriod() throws error for invalid input', () => {
    testParsePeriodErrors();
});
function testUnknownTenor() {
    const unknownTenor = term_1.Tenor.UNKNOWN_TENOR;
    assert(unknownTenor.getType() === tenor_type_pb_1.TenorTypeProto.UNKNOWN_TENOR_TYPE, 'UNKNOWN_TENOR should have UNKNOWN_TENOR_TYPE');
    assert(unknownTenor.getTenor() === null, 'UNKNOWN_TENOR should have null tenor');
}
function testTenorConstructorTypeOnly() {
    const perpetualTenor = new term_1.Tenor(tenor_type_pb_1.TenorTypeProto.PERPETUAL);
    assert(perpetualTenor.getType() === tenor_type_pb_1.TenorTypeProto.PERPETUAL, 'Should create PERPETUAL tenor');
    assert(perpetualTenor.getTenor() === null, 'Should have null tenor when only type is provided');
}
function testTenorConstructorWithString() {
    const termTenor = new term_1.Tenor(tenor_type_pb_1.TenorTypeProto.TERM, '2Y3M');
    assert(termTenor.getType() === tenor_type_pb_1.TenorTypeProto.TERM, 'Should create TERM tenor');
    const period = termTenor.getTenor();
    assert(period !== null, 'Should have a period');
    if (period) {
        assert(period.years === 2, 'Should parse 2 years');
        assert(period.months === 3, 'Should parse 3 months');
    }
}
function testTenorConstructorWithPeriod() {
    const period = { years: 5, months: 6, days: 14 };
    const termTenor = new term_1.Tenor(tenor_type_pb_1.TenorTypeProto.TERM, period);
    assert(termTenor.getType() === tenor_type_pb_1.TenorTypeProto.TERM, 'Should create TERM tenor');
    const returnedPeriod = termTenor.getTenor();
    assert(returnedPeriod !== null, 'Should have a period');
    if (returnedPeriod) {
        assert(returnedPeriod.years === 5, 'Should have 5 years');
        assert(returnedPeriod.months === 6, 'Should have 6 months');
        assert(returnedPeriod.days === 14, 'Should have 14 days');
    }
}
function testTenorConstructorError() {
    const period = { years: 1, months: 0, days: 0 };
    try {
        new term_1.Tenor(tenor_type_pb_1.TenorTypeProto.PERPETUAL, period);
        assert(false, 'Should have thrown an error');
    }
    catch (error) {
        assert(error instanceof Error, 'Should throw Error');
        assert(error.message.includes('TERM'), 'Error message should mention TERM');
    }
}
function testGetType() {
    const tenor1 = new term_1.Tenor(tenor_type_pb_1.TenorTypeProto.UNKNOWN_TENOR_TYPE);
    assert(tenor1.getType() === tenor_type_pb_1.TenorTypeProto.UNKNOWN_TENOR_TYPE, 'Should return UNKNOWN_TENOR_TYPE');
    const tenor2 = new term_1.Tenor(tenor_type_pb_1.TenorTypeProto.PERPETUAL);
    assert(tenor2.getType() === tenor_type_pb_1.TenorTypeProto.PERPETUAL, 'Should return PERPETUAL');
    const tenor3 = new term_1.Tenor(tenor_type_pb_1.TenorTypeProto.TERM, '1Y');
    assert(tenor3.getType() === tenor_type_pb_1.TenorTypeProto.TERM, 'Should return TERM');
}
function testGetTenor() {
    const tenor1 = new term_1.Tenor(tenor_type_pb_1.TenorTypeProto.PERPETUAL);
    assert(tenor1.getTenor() === null, 'PERPETUAL should have null tenor');
    const period = { years: 3, months: 4, days: 21 };
    const tenor2 = new term_1.Tenor(tenor_type_pb_1.TenorTypeProto.TERM, period);
    const returnedPeriod = tenor2.getTenor();
    assert(returnedPeriod !== null, 'TERM should have a period');
    if (returnedPeriod) {
        assert(returnedPeriod.years === 3, 'Should return correct years');
        assert(returnedPeriod.months === 4, 'Should return correct months');
        assert(returnedPeriod.days === 21, 'Should return correct days');
    }
}
function testGetTenorDescription() {
    const tenor1 = new term_1.Tenor(tenor_type_pb_1.TenorTypeProto.PERPETUAL);
    assert(tenor1.getTenorDescription() === '', 'PERPETUAL should return empty string');
    const tenor2 = new term_1.Tenor(tenor_type_pb_1.TenorTypeProto.TERM, '2Y3M');
    assert(tenor2.getTenorDescription() === '2Y3M', 'Should return "2Y3M"');
    const tenor3 = new term_1.Tenor(tenor_type_pb_1.TenorTypeProto.TERM, '1Y6M2W5D');
    assert(tenor3.getTenorDescription() === '1Y6M2W5D', 'Should return "1Y6M2W5D"');
}
function testToString() {
    const tenor1 = term_1.Tenor.UNKNOWN_TENOR;
    assert(tenor1.toString() === 'UNKNOWN_TENOR_TYPE', 'UNKNOWN should return "UNKNOWN_TENOR_TYPE"');
    const tenor2 = new term_1.Tenor(tenor_type_pb_1.TenorTypeProto.PERPETUAL);
    assert(tenor2.toString() === 'PERPETUAL', 'PERPETUAL should return "PERPETUAL"');
    const tenor3 = new term_1.Tenor(tenor_type_pb_1.TenorTypeProto.TERM, '2Y3M');
    assert(tenor3.toString() === 'TERM: 2Y3M', 'TERM should return "TERM: 2Y3M"');
}
function testFromTenorDescription() {
    // Test empty string
    const period1 = term_1.Tenor.fromTenorDescription('');
    assert(period1 === null, 'Empty string should return null');
    // Test whitespace
    const period2 = term_1.Tenor.fromTenorDescription('   ');
    assert(period2 === null, 'Whitespace should return null');
    // Test various formats
    const period3 = term_1.Tenor.fromTenorDescription('2Y');
    assert(period3 !== null, 'Should parse "2Y"');
    if (period3) {
        assert(period3.years === 2, 'Should have 2 years');
        assert(period3.months === 0, 'Should have 0 months');
        assert(period3.days === 0, 'Should have 0 days');
    }
    const period4 = term_1.Tenor.fromTenorDescription('3M');
    assert(period4 !== null, 'Should parse "3M"');
    if (period4) {
        assert(period4.years === 0, 'Should have 0 years');
        assert(period4.months === 3, 'Should have 3 months');
    }
    const period5 = term_1.Tenor.fromTenorDescription('2W');
    assert(period5 !== null, 'Should parse "2W"');
    if (period5) {
        assert(period5.days === 14, 'Should convert 2 weeks to 14 days');
    }
    const period6 = term_1.Tenor.fromTenorDescription('5D');
    assert(period6 !== null, 'Should parse "5D"');
    if (period6) {
        assert(period6.days === 5, 'Should have 5 days');
    }
}
function testPeriodToString() {
    // Test simple periods
    const period1 = { years: 2, months: 3, days: 0 };
    assert(term_1.Tenor.periodToString(period1) === '2Y3M', 'Should return "2Y3M"');
    const period2 = { years: 0, months: 6, days: 14 };
    assert(term_1.Tenor.periodToString(period2) === '6M2W', 'Should convert 14 days to 2W');
    const period3 = { years: 1, months: 0, days: 21 };
    assert(term_1.Tenor.periodToString(period3) === '1Y3W', 'Should convert 21 days to 3W');
    const period4 = { years: 0, months: 0, days: 10 };
    assert(term_1.Tenor.periodToString(period4) === '1W3D', 'Should convert 10 days to 1W3D');
    // Test negative period
    const period5 = { years: -1, months: 0, days: 0 };
    assert(term_1.Tenor.periodToString(period5) === '', 'Negative period should return empty string');
    // Test zero period
    const period6 = { years: 0, months: 0, days: 0 };
    assert(term_1.Tenor.periodToString(period6) === '', 'Zero period should return empty string');
}
function testParsePeriod() {
    // Test years only
    const period1 = term_1.Tenor.parsePeriod('2Y');
    assert(period1.years === 2, 'Should parse 2 years');
    assert(period1.months === 0, 'Should have 0 months');
    assert(period1.days === 0, 'Should have 0 days');
    // Test months only
    const period2 = term_1.Tenor.parsePeriod('3M');
    assert(period2.years === 0, 'Should have 0 years');
    assert(period2.months === 3, 'Should parse 3 months');
    assert(period2.days === 0, 'Should have 0 days');
    // Test weeks only
    const period3 = term_1.Tenor.parsePeriod('2W');
    assert(period3.years === 0, 'Should have 0 years');
    assert(period3.months === 0, 'Should have 0 months');
    assert(period3.days === 14, 'Should convert 2 weeks to 14 days');
    // Test days only
    const period4 = term_1.Tenor.parsePeriod('5D');
    assert(period4.years === 0, 'Should have 0 years');
    assert(period4.months === 0, 'Should have 0 months');
    assert(period4.days === 5, 'Should parse 5 days');
    // Test combined
    const period5 = term_1.Tenor.parsePeriod('1Y6M2W5D');
    assert(period5.years === 1, 'Should parse 1 year');
    assert(period5.months === 6, 'Should parse 6 months');
    assert(period5.days === 19, 'Should convert 2W + 5D to 19 days');
    // Test MW ambiguity (MW should be interpreted as months + weeks, not just months)
    const period6 = term_1.Tenor.parsePeriod('2MW');
    assert(period6.months === 0, 'MW should be interpreted as weeks, not months');
    assert(period6.days === 14, 'MW should convert 2 weeks to 14 days');
}
function testParsePeriodEdgeCases() {
    // Test large numbers
    const period1 = term_1.Tenor.parsePeriod('10Y12M');
    assert(period1.years === 10, 'Should parse 10 years');
    assert(period1.months === 12, 'Should parse 12 months');
    // Test single digit
    const period2 = term_1.Tenor.parsePeriod('1Y1M1W1D');
    assert(period2.years === 1, 'Should parse 1 year');
    assert(period2.months === 1, 'Should parse 1 month');
    assert(period2.days === 8, 'Should convert 1W + 1D to 8 days');
    // Test multiple weeks
    const period3 = term_1.Tenor.parsePeriod('4W');
    assert(period3.days === 28, 'Should convert 4 weeks to 28 days');
    // Test weeks and days
    const period4 = term_1.Tenor.parsePeriod('2W3D');
    assert(period4.days === 17, 'Should convert 2W + 3D to 17 days');
}
function testParsePeriodErrors() {
    // Test invalid character
    try {
        term_1.Tenor.parsePeriod('2X');
        assert(false, 'Should have thrown an error for invalid character');
    }
    catch (error) {
        assert(error instanceof Error, 'Should throw Error');
        assert(error.message.includes('Invalid character'), 'Error message should mention invalid character');
    }
    // Test missing number before unit
    try {
        term_1.Tenor.parsePeriod('Y');
        assert(false, 'Should have thrown an error for missing number');
    }
    catch (error) {
        assert(error instanceof Error, 'Should throw Error');
        assert(error.message.includes('expected number'), 'Error message should mention expected number');
    }
    // Test invalid format
    try {
        term_1.Tenor.parsePeriod('2YM');
        assert(false, 'Should have thrown an error for invalid format');
    }
    catch (error) {
        assert(error instanceof Error, 'Should throw Error');
    }
}
//# sourceMappingURL=term.test.js.map