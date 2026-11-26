"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.icmaYearFraction = exports.icmaPeriodFraction = exports.yearFraction = exports.dayCount = exports.resolveDayCount = exports.defaultDayCountFor = exports.shippedDefaultDayCounts = exports.parseDefaultDayCount = exports.DefaultDayCounts = void 0;
const hierarchy_json_1 = __importDefault(require("../../../../hierarchy.json"));
const day_count_convention_pb_1 = require("../../../fintekkers/models/security/day_count_convention_pb");
const product_type_pb_1 = require("../../../fintekkers/models/security/product_type_pb");
const errors_1 = require("../errors");
const product_hierarchy_1 = require("./product_hierarchy");
const SECTION = 'default_day_count';
const UNKNOWN = 'UNKNOWN_DAY_COUNT';
const CONVENTIONS = day_count_convention_pb_1.DayCountConventionProto;
function hasOwn(o, key) {
    return Object.prototype.hasOwnProperty.call(o, key);
}
// ---------- resolver: hierarchy.json default_day_count ----------
function bad(detail) {
    return new Error(`hierarchy.json ${SECTION}: ${detail}`);
}
/** A parsed, checked default_day_count section: node -> DayCountConventionProto value. */
class DefaultDayCounts {
    constructor(entries) {
        const frozen = new Map(entries);
        const readOnly = () => { throw new TypeError('DefaultDayCounts entries are read-only'); };
        frozen.set = readOnly;
        frozen.delete = readOnly;
        frozen.clear = readOnly;
        this.entries = frozen;
    }
    /** The deepest entry on productType's parent chain, or UNKNOWN_DAY_COUNT. */
    defaultFor(productType) {
        for (let node = productType; node !== null; node = (0, product_hierarchy_1.parentOf)(node)) {
            const conv = this.entries.get(node);
            if (conv !== undefined)
                return conv;
        }
        return day_count_convention_pb_1.DayCountConventionProto.UNKNOWN_DAY_COUNT;
    }
}
exports.DefaultDayCounts = DefaultDayCounts;
/**
 * Parses and checks a default_day_count section against the shipped
 * product_types tree and the DayCountConventionProto names. Throws when the
 * section is missing (undefined) or not an object, a key is not a
 * product_types node, or a value is not a DayCountConventionProto name or is
 * UNKNOWN_DAY_COUNT. Exported for tests.
 */
function parseDefaultDayCount(section) {
    if (section === undefined)
        throw bad('section missing from hierarchy.json');
    if (typeof section !== 'object' || section === null || Array.isArray(section)) {
        throw bad('section must be an object');
    }
    const productTypes = new Set((0, product_hierarchy_1.allProductTypes)());
    const entries = new Map();
    for (const [node, name] of Object.entries(section)) {
        if (!productTypes.has(node))
            throw bad(`node '${node}' is not in product_types`);
        if (typeof name !== 'string' || !hasOwn(day_count_convention_pb_1.DayCountConventionProto, name)) {
            throw bad(`value ${JSON.stringify(name)} for node ${node} is not a DayCountConventionProto name`);
        }
        if (name === UNKNOWN)
            throw bad(`node ${node} must not default to ${UNKNOWN}`);
        entries.set(node, CONVENTIONS[name]);
    }
    return new DefaultDayCounts(entries);
}
exports.parseDefaultDayCount = parseDefaultDayCount;
let shipped;
/** The shipped default_day_count section, parsed and checked on first use. */
function shippedDefaultDayCounts() {
    if (!shipped) {
        const root = hierarchy_json_1.default;
        shipped = parseDefaultDayCount(hasOwn(root, SECTION) ? root[SECTION] : undefined);
    }
    return shipped;
}
exports.shippedDefaultDayCounts = shippedDefaultDayCounts;
/**
 * The product default for the security's raw product_type, or
 * UNKNOWN_DAY_COUNT when it has none. A missing security reads as
 * PRODUCT_TYPE_UNKNOWN.
 */
function defaultDayCountFor(security) {
    return shippedDefaultDayCounts().defaultFor(productTypeOf(security));
}
exports.defaultDayCountFor = defaultDayCountFor;
/**
 * The bond's convention: bond_details.day_count when set to anything but
 * UNKNOWN_DAY_COUNT, else the product default, else UNKNOWN_DAY_COUNT. Never
 * guesses: a number this build does not know (a newer writer's value) is
 * UNKNOWN_DAY_COUNT, not the product default.
 */
function resolveDayCount(security) {
    const bond = security === null || security === void 0 ? void 0 : security.getBondDetails();
    if (bond && bond.hasDayCount()) {
        const explicit = bond.getDayCount();
        if (explicit !== undefined && explicit !== day_count_convention_pb_1.DayCountConventionProto.UNKNOWN_DAY_COUNT) {
            return isConvention(explicit) ? explicit : day_count_convention_pb_1.DayCountConventionProto.UNKNOWN_DAY_COUNT;
        }
    }
    return defaultDayCountFor(security);
}
exports.resolveDayCount = resolveDayCount;
function isConvention(value) {
    return Object.values(CONVENTIONS).includes(value);
}
function productTypeOf(security) {
    const value = security ? security.getProductType() : product_type_pb_1.ProductTypeProto.PRODUCT_TYPE_UNKNOWN;
    for (const [k, v] of Object.entries(product_type_pb_1.ProductTypeProto)) {
        if (v === value)
            return k;
    }
    return String(value);
}
// ---------- date helpers: no registry access ----------
const MS_PER_DAY = 86400000;
/**
 * Days from start (excluded) to end (included) under the convention.
 * THIRTY_360_US applies the bond-basis rules; every other convention counts
 * actual calendar days. Throws ModelValidationError for UNKNOWN_DAY_COUNT (or
 * an unknown value), an invalid date or start > end.
 */
function dayCount(convention, start, end) {
    checkConvention(convention);
    checkOrder(start, end);
    if (convention === day_count_convention_pb_1.DayCountConventionProto.THIRTY_360_US)
        return thirty360Us(start, end);
    return actualDays(start, end);
}
exports.dayCount = dayCount;
/**
 * Years from start to end: days / 360 for THIRTY_360_US and ACT_360, days /
 * 365 for ACT_365_FIXED. ACT_ACT_ICMA needs the coupon period: use
 * icmaYearFraction (this throws ModelValidationError for it).
 */
function yearFraction(convention, start, end) {
    if (convention === day_count_convention_pb_1.DayCountConventionProto.ACT_ACT_ICMA) {
        throw invalid('convention', 'ACT_ACT_ICMA needs the coupon period: use icmaYearFraction');
    }
    const days = dayCount(convention, start, end);
    return convention === day_count_convention_pb_1.DayCountConventionProto.ACT_365_FIXED ? days / 365 : days / 360;
}
exports.yearFraction = yearFraction;
/**
 * ACT/ACT ICMA: actual days start -> end over actual days in the regular
 * coupon period that contains them. Throws ModelValidationError unless
 * periodStart <= start <= end <= periodEnd and periodStart < periodEnd.
 */
function icmaPeriodFraction(start, end, periodStart, periodEnd) {
    checkPeriod(start, end, periodStart, periodEnd);
    return actualDays(start, end) / actualDays(periodStart, periodEnd);
}
exports.icmaPeriodFraction = icmaPeriodFraction;
/**
 * ACT/ACT ICMA in years: days / (frequency x period days), frequency being
 * coupons a year (2 for semiannual). Throws ModelValidationError as
 * icmaPeriodFraction does, or when frequency is not a positive integer.
 */
function icmaYearFraction(start, end, periodStart, periodEnd, frequency) {
    if (!Number.isInteger(frequency) || frequency <= 0) {
        throw invalid('frequency', `frequency must be a positive number of coupons a year, got ${frequency}`);
    }
    return icmaPeriodFraction(start, end, periodStart, periodEnd) / frequency;
}
exports.icmaYearFraction = icmaYearFraction;
/** Calendar-date serial: the DateTime's own year, month and day, ignoring time and zone. */
function serial(d) {
    return Date.UTC(d.year, d.month - 1, d.day) / MS_PER_DAY;
}
function actualDays(start, end) {
    return serial(end) - serial(start);
}
function thirty360Us(start, end) {
    let d1 = start.day;
    let d2 = end.day;
    if (d1 === 31)
        d1 = 30;
    if (d2 === 31 && d1 >= 30)
        d2 = 30;
    return 360 * (end.year - start.year) + 30 * (end.month - start.month) + (d2 - d1);
}
function checkConvention(convention) {
    if (convention === day_count_convention_pb_1.DayCountConventionProto.UNKNOWN_DAY_COUNT || !isConvention(convention)) {
        throw invalid('convention', `no day-count convention to apply (got ${convention})`);
    }
}
function checkDate(field, d) {
    if (!d || !d.isValid)
        throw invalid(field, `${field} must be a valid date`);
}
function checkOrder(start, end) {
    checkDate('start', start);
    checkDate('end', end);
    if (serial(start) > serial(end)) {
        throw invalid('end', `start ${start.toISODate()} is after end ${end.toISODate()}`);
    }
}
function checkPeriod(start, end, periodStart, periodEnd) {
    checkOrder(start, end);
    checkDate('period_start', periodStart);
    checkDate('period_end', periodEnd);
    if (serial(periodStart) >= serial(periodEnd)) {
        throw invalid('period_end', `period_start ${periodStart.toISODate()} must be before period_end ${periodEnd.toISODate()}`);
    }
    if (serial(start) < serial(periodStart) || serial(end) > serial(periodEnd)) {
        throw invalid('period_start', `${start.toISODate()} -> ${end.toISODate()} is outside the coupon period `
            + `${periodStart.toISODate()} -> ${periodEnd.toISODate()}`);
    }
}
function invalid(field, message) {
    return new errors_1.ModelValidationError([(0, errors_1.violation)(field, undefined, message)]);
}
//# sourceMappingURL=day_count.js.map