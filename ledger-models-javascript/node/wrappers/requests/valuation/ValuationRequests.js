"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ValuationRequests = void 0;
const valuation_request_pb_1 = require("../../../fintekkers/requests/valuation/valuation_request_pb");
const errors_1 = require("../../models/errors");
const product_inputs_1 = require("../../models/security/product_inputs");
const object_types_1 = require("../../util/object-types");
class ValuationRequests {
    /**
     * A ValuationRequestProto valued from `productInput` alone.
     *
     * Sets asof_datetime (23), measures (30), position_input (21) and
     * product_input (70).
     * `productInput` is checked with checkProductInput first, so a tips input
     * with no cpi throws MissingMarketDataError here too. The caller's protos
     * are set as they are, not stamped (LM-322).
     */
    static typed(asof, productInput, position, measures) {
        const missing = [['asof_datetime', asof], ['position_input', position]]
            .filter(([, value]) => value === undefined || value === null)
            .map(([field]) => (0, errors_1.violation)(field, undefined, `${field} is required`));
        if (missing.length > 0)
            throw new errors_1.ModelValidationError(missing);
        (0, product_inputs_1.checkProductInput)(productInput);
        return (0, object_types_1.stampOwn)(new valuation_request_pb_1.ValuationRequestProto())
            .setMeasuresList([...measures])
            .setAsofDatetime(asof)
            .setPositionInput(position)
            .setProductInput(productInput);
    }
}
exports.ValuationRequests = ValuationRequests;
//# sourceMappingURL=ValuationRequests.js.map