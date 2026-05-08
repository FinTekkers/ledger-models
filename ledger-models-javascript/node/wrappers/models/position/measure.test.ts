import { Measure } from './measure';
import { MeasureProto } from '../../../fintekkers/models/position/measure_pb';

describe('Measure.fromName', () => {
    test.each(Measure.getAllTypeNames())(
        'fromName("%s") returns the matching numeric enum value',
        (name: string) => {
            const value = Measure.fromName(name);
            const expected = (MeasureProto as unknown as Record<string, number>)[name];
            expect(value).toBe(expected);
        }
    );

    test('throws on unknown name and lists valid names in the error', () => {
        let err: Error | undefined;
        try {
            Measure.fromName('NOT_A_REAL_MEASURE');
        } catch (e) {
            err = e as Error;
        }
        expect(err).toBeDefined();
        expect(err!.message).toContain('NOT_A_REAL_MEASURE');
        // Hint with known valid entries.
        expect(err!.message).toContain('PRESENT_VALUE');
        expect(err!.message).toContain('DIRTY_PRICE');
    });

    test('throws on lowercase / friendly-label input (proto-name strict)', () => {
        // ledger-models is the source-of-truth vocabulary; consumers
        // (UI dropdown labels, URL params) standardize on proto names.
        // Pin the strict behavior so this contract is loudly tested.
        expect(() => Measure.fromName('present_value')).toThrow();
        expect(() => Measure.fromName('Dirty Price')).toThrow();
    });

    test('accepts UNKNOWN_MEASURE — sentinel is a valid enum key', () => {
        // Excluded from getAllTypeNames (no dropdown surface) but still a
        // valid proto enum value. Mirrors Identifier / SecurityType /
        // AssetClass / PositionFilterOperator behavior.
        expect(Measure.fromName('UNKNOWN_MEASURE')).toBe(
            MeasureProto.UNKNOWN_MEASURE
        );
    });
});

describe('Measure.getAllTypeNames', () => {
    test('returns the expected set in proto-declaration order, excluding UNKNOWN_MEASURE', () => {
        // Proto-declared order in measure.proto (post-PR #192 additions):
        //   UNKNOWN_MEASURE = 0;             (excluded)
        //   DIRECTED_QUANTITY = 1;
        //   MARKET_VALUE = 2;
        //   UNADJUSTED_COST_BASIS = 3;
        //   ADJUSTED_COST_BASIS = 4;
        //   CURRENT_YIELD = 5;
        //   YIELD_TO_MATURITY = 7;           (note: no tag 6)
        //   MACAULAY_DURATION = 8;
        //   PRESENT_VALUE = 9;
        //   REAL_YIELD = 10;
        //   INFLATION_ADJUSTED_PRINCIPAL = 11;
        //   PRESENT_VALUE_CASHFLOWS = 12;
        //   DISCOUNT_MARGIN = 13;
        //   SPREAD_DURATION = 14;
        //   PAR_YIELD = 15;
        //   SPOT_YIELD = 16;
        //   FORWARD_YIELD = 17;
        //   PROFIT_LOSS = 18;
        //   PROFIT_LOSS_PERCENT = 19;
        //   ACCRUED_INTEREST = 20;
        //   CONVEXITY = 21;
        //   DIRTY_PRICE = 22;
        //   CLEAN_PRICE = 23;
        //   MODIFIED_DURATION = 24;
        //   DV01 = 25;
        expect(Measure.getAllTypeNames()).toEqual([
            'DIRECTED_QUANTITY',
            'MARKET_VALUE',
            'UNADJUSTED_COST_BASIS',
            'ADJUSTED_COST_BASIS',
            'CURRENT_YIELD',
            'YIELD_TO_MATURITY',
            'MACAULAY_DURATION',
            'PRESENT_VALUE',
            'REAL_YIELD',
            'INFLATION_ADJUSTED_PRINCIPAL',
            'PRESENT_VALUE_CASHFLOWS',
            'DISCOUNT_MARGIN',
            'SPREAD_DURATION',
            'PAR_YIELD',
            'SPOT_YIELD',
            'FORWARD_YIELD',
            'PROFIT_LOSS',
            'PROFIT_LOSS_PERCENT',
            'ACCRUED_INTEREST',
            'CONVEXITY',
            'DIRTY_PRICE',
            'CLEAN_PRICE',
            'MODIFIED_DURATION',
            'DV01',
        ]);
    });

    test('excludes the UNKNOWN_MEASURE sentinel', () => {
        expect(Measure.getAllTypeNames()).not.toContain('UNKNOWN_MEASURE');
    });
});
