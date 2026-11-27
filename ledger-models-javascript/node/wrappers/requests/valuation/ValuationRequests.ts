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
import { ModelValidationError, violation } from '../../models/errors';
import { checkProductInput } from '../../models/security/product_inputs';
import { stampOwn } from '../../util/object-types';

export class ValuationRequests {
  /**
   * A ValuationRequestProto valued from `productInput` alone.
   *
   * Sets asof_datetime (23), measures (30), position_input (21) and
   * product_input (70).
   * `productInput` is checked with checkProductInput first, so a tips input
   * with no cpi throws MissingMarketDataError here too. The caller's protos
   * are set as they are, not stamped (LM-322).
   */
  static typed(asof: LocalTimestampProto | undefined, productInput: ProductInput,
    position: PositionProto | undefined, measures: MeasureProto[]): ValuationRequestProto {
    const missing = ([['asof_datetime', asof], ['position_input', position]] as const)
      .filter(([, value]) => value === undefined || value === null)
      .map(([field]) => violation(field, undefined, `${field} is required`));
    if (missing.length > 0) throw new ModelValidationError(missing);
    checkProductInput(productInput);
    return stampOwn(new ValuationRequestProto())
      .setMeasuresList([...measures])
      .setAsofDatetime(asof)
      .setPositionInput(position)
      .setProductInput(productInput);
  }

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
  static settlementConvention(tradeDate: LocalDateProto | undefined, lagBusinessDays: number,
    calendarId: string): SettlementConventionProto {
    const violations: ReturnType<typeof violation>[] = [];
    if (tradeDate === undefined || tradeDate === null) {
      violations.push(violation('settlement_convention.trade_date', undefined, 'trade_date is required'));
    }
    if (!Number.isInteger(lagBusinessDays) || lagBusinessDays < 0) {
      violations.push(violation('settlement_convention.settlement_lag_business_days', undefined,
        `settlement_lag_business_days must be a whole number, 0 or more, got ${lagBusinessDays}`));
    }
    if (typeof calendarId !== 'string' || calendarId.trim() === '') {
      violations.push(violation('settlement_convention.calendar_id', undefined, 'calendar_id is required'));
    }
    if (violations.length > 0) throw new ModelValidationError(violations);
    return new SettlementConventionProto()
      .setTradeDate(tradeDate)
      .setSettlementLagBusinessDays(lagBusinessDays)
      .setCalendarId(calendarId);
  }
}
