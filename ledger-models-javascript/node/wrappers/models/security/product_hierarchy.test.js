"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * LM-412: T_BILL_13_WEEK_SERIES sits beside SOFR_SERIES in hierarchy.json,
 * with the same parent, asset class and instrument type.
 */
const product_hierarchy_1 = require("./product_hierarchy");
test('T_BILL_13_WEEK_SERIES is classified like SOFR_SERIES', () => {
    expect((0, product_hierarchy_1.parentOf)('T_BILL_13_WEEK_SERIES')).toBe('INDEX');
    expect((0, product_hierarchy_1.parentOf)('T_BILL_13_WEEK_SERIES')).toBe((0, product_hierarchy_1.parentOf)('SOFR_SERIES'));
    expect((0, product_hierarchy_1.assetClassOf)('T_BILL_13_WEEK_SERIES')).toBe('RATES');
    expect((0, product_hierarchy_1.assetClassOf)('T_BILL_13_WEEK_SERIES')).toBe((0, product_hierarchy_1.assetClassOf)('SOFR_SERIES'));
    expect((0, product_hierarchy_1.instrumentTypeOf)('T_BILL_13_WEEK_SERIES')).toBe('REFERENCE_INDEX');
    expect((0, product_hierarchy_1.instrumentTypeOf)('T_BILL_13_WEEK_SERIES')).toBe((0, product_hierarchy_1.instrumentTypeOf)('SOFR_SERIES'));
});
//# sourceMappingURL=product_hierarchy.test.js.map