"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const decimal_js_1 = __importDefault(require("decimal.js"));
const cost_basis_1 = require("./cost_basis");
const fill = (directedQuantity, price) => ({ directedQuantity: new decimal_js_1.default(directedQuantity), price: new decimal_js_1.default(price) });
test('sells do not change the buys-only average', () => {
    const result = (0, cost_basis_1.weightedAveragePurchasePrice)([fill('100', '10'), fill('100', '20'), fill('-50', '25')]);
    expect(result).not.toBeNull();
    expect(result.equals(15)).toBe(true);
    expect(result.toFixed()).toBe('15');
});
test('no buys returns null', () => {
    expect((0, cost_basis_1.weightedAveragePurchasePrice)([fill('-50', '25')])).toBeNull();
});
test('repeating result rounds to 12 places half-even', () => {
    const result = (0, cost_basis_1.weightedAveragePurchasePrice)([fill('1', '1'), fill('2', '2')]);
    expect(result.toFixed()).toBe('1.666666666667');
});
//# sourceMappingURL=cost_basis.test.js.map