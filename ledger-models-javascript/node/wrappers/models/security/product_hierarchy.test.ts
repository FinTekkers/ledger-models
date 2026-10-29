/**
 * LM-412: T_BILL_13_WEEK_SERIES sits beside SOFR_SERIES in hierarchy.json,
 * with the same parent, asset class and instrument type.
 */
import { assetClassOf, instrumentTypeOf, parentOf } from './product_hierarchy';

test('T_BILL_13_WEEK_SERIES is classified like SOFR_SERIES', () => {
    expect(parentOf('T_BILL_13_WEEK_SERIES')).toBe('INDEX');
    expect(parentOf('T_BILL_13_WEEK_SERIES')).toBe(parentOf('SOFR_SERIES'));
    expect(assetClassOf('T_BILL_13_WEEK_SERIES')).toBe('RATES');
    expect(assetClassOf('T_BILL_13_WEEK_SERIES')).toBe(assetClassOf('SOFR_SERIES'));
    expect(instrumentTypeOf('T_BILL_13_WEEK_SERIES')).toBe('REFERENCE_INDEX');
    expect(instrumentTypeOf('T_BILL_13_WEEK_SERIES')).toBe(instrumentTypeOf('SOFR_SERIES'));
});
