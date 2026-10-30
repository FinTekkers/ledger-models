/**
 * Typed valuation requests (LM-410). Same rule in Java / Rust / Python /
 * JS-TS. See docs/adr/product_input_builders.md.
 */
import { MeasureProto } from '../../../fintekkers/models/position/measure_pb';
import { PositionProto } from '../../../fintekkers/models/position/position_pb';
import { LocalTimestampProto } from '../../../fintekkers/models/util/local_timestamp_pb';
import { ProductInput } from '../../../fintekkers/requests/valuation/product_inputs_pb';
import { ValuationRequestProto } from '../../../fintekkers/requests/valuation/valuation_request_pb';
export declare class ValuationRequests {
    /**
     * A ValuationRequestProto valued from `productInput` alone.
     *
     * Sets asof_datetime (23), measures (30), position_input (21) and
     * product_input (70). Never sets security_input (20) or price_input (22).
     * `productInput` is checked with checkProductInput first, so a tips input
     * with no cpi throws MissingMarketDataError here too. The caller's protos
     * are set as they are, not stamped (LM-322).
     */
    static typed(asof: LocalTimestampProto | undefined, productInput: ProductInput, position: PositionProto | undefined, measures: MeasureProto[]): ValuationRequestProto;
}
