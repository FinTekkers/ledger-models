import Decimal from 'decimal.js';
import { weightedAveragePurchasePrice } from './cost_basis';

const fill = (directedQuantity: string, price: string) =>
    ({ directedQuantity: new Decimal(directedQuantity), price: new Decimal(price) });

test('sells do not change the buys-only average', () => {
    const result = weightedAveragePurchasePrice([fill('100', '10'), fill('100', '20'), fill('-50', '25')]);

    expect(result).not.toBeNull();
    expect(result!.equals(15)).toBe(true);
    expect(result!.toFixed()).toBe('15');
});

test('no buys returns null', () => {
    expect(weightedAveragePurchasePrice([fill('-50', '25')])).toBeNull();
});

test('repeating result rounds to 12 places half-even', () => {
    const result = weightedAveragePurchasePrice([fill('1', '1'), fill('2', '2')]);

    expect(result!.toFixed()).toBe('1.666666666667');
});
