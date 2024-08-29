// Models
import { MeasureProto } from '../../../fintekkers/models/position/measure_pb';

// Model Utils
import { FieldProto } from '../../../fintekkers/models/position/field_pb';

//Requests & Services
import { PositionService } from '../../services/position-service/PositionService';
import { QueryPositionRequest } from '../../requests/position/QueryPositionRequest';

test('test getting a position against the api.fintekkers.org position service', async () => {
  let fields = [FieldProto.PRODUCT_TYPE, FieldProto.PORTFOLIO, FieldProto.PRODUCT_TYPE];
  let measures = [MeasureProto.DIRECTED_QUANTITY];
  const isTrue = await testPosition(fields, measures);
  expect(isTrue).toBe(true);
}, 30000);

test('test invalid request against the api.fintekkers.org position service', async () => {
  let fields = [FieldProto.SECURITY_ID, FieldProto.TAX_LOT_CLOSE_DATE, FieldProto.TRADE_DATE];
  let measures = [MeasureProto.DIRECTED_QUANTITY];
  try {
    await testPosition(fields, measures);
  } catch (error) {
    let request: QueryPositionRequest = QueryPositionRequest.from(fields, measures);
    let summary = await new PositionService().validateRequest(request);
    expect(summary.getErrorsList().length).toBeGreaterThan(0);
  }
}, 30000);

test('test getting a complex type from position', async () => {
  let fields = [FieldProto.SECURITY, FieldProto.PORTFOLIO];
  let measures = [MeasureProto.DIRECTED_QUANTITY];

  let request: QueryPositionRequest = QueryPositionRequest.from(fields, measures);
  let positions = await new PositionService().search(request);

  let position = positions[0];

  for (let field of position.getFields()) {
    let displayValue = position.getFieldDisplay(field);

    expect(displayValue.indexOf("[object") != 0).toBeTruthy();
  }

  const isTrue = await testPosition(fields, measures);
  expect(isTrue).toBe(true);
}, 30000);


async function testPosition(fields: FieldProto[], measures: MeasureProto[]): Promise<boolean> {
  let request: QueryPositionRequest = QueryPositionRequest.from(fields, measures);
  let positions = await new PositionService().search(request);

  if (positions && positions.length > 0) {
    console.log(positions.length + " positions returned")

    let position = positions[0];

    fields.forEach(field => {
      position.getFieldValue(field);
    })
    return true
  } else {
    return false;
  }
}

