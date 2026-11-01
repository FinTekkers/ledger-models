/**
 * Typed valuation requests (LM-410). Same rule in Java / Rust / Python /
 * JS-TS. See docs/adr/product_input_builders.md.
 */
import { MeasureProto } from '../../../fintekkers/models/position/measure_pb';
import { PositionProto } from '../../../fintekkers/models/position/position_pb';
import { LocalTimestampProto } from '../../../fintekkers/models/util/local_timestamp_pb';
import { ProductInput } from '../../../fintekkers/requests/valuation/product_inputs_pb';
import { ValuationRequestProto } from '../../../fintekkers/requests/valuation/valuation_request_pb';
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
}
