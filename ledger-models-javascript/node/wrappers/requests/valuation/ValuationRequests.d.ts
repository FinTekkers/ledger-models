/**
 * Typed valuation requests (LM-410). Same rule in Java / Rust / Python /
 * JS-TS. See docs/adr/product_input_builders.md.
 */
import type { MeasureProto } from '../../../fintekkers/models/position/measure_pb';
import type { PositionProto } from '../../../fintekkers/models/position/position_pb';
import type { LocalDateProto } from '../../../fintekkers/models/util/local_date_pb';
import type { LocalTimestampProto } from '../../../fintekkers/models/util/local_timestamp_pb';
import type { ProductInput } from '../../../fintekkers/requests/valuation/product_inputs_pb';
import { SettlementConventionProto, ValuationRequestProto } from '../../../fintekkers/requests/valuation/valuation_request_pb';
export declare class ValuationRequests {
    /**
     * A ValuationRequestProto valued from `productInput` alone.
     *
     * Sets asof_datetime (23), measures (30), position_input (21) and
     * product_input (70).
     * `productInput` is checked with checkProductInput first, so a tips input
     * with no cpi throws MissingMarketDataError here too. The caller's protos
     * are set as they are, not stamped (LM-322).
     */
    static typed(asof: LocalTimestampProto | undefined, productInput: ProductInput, position: PositionProto | undefined, measures: MeasureProto[]): ValuationRequestProto;
    /**
     * A SettlementConventionProto for ValuationRequestProto.settlement_convention
     * (80), LM-509.
     *
     * Checks only the rules in the proto comment that need no calendar:
     * trade_date is set, the lag is a whole number not below 0 and calendar_id
     * is not blank. It never computes a settlement date, and an unknown
     * calendar_id passes: valuation-service owns the calendars. A lag of 0 is
     * valid (same-day settlement). Attach it with
     * `request.setSettlementConvention(convention)`.
     */
    static settlementConvention(tradeDate: LocalDateProto | undefined, lagBusinessDays: number, calendarId: string): SettlementConventionProto;
}
