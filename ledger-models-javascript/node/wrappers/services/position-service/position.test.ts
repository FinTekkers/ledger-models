// Models
import { MeasureProto } from '../../../fintekkers/models/position/measure_pb';

// Model Utils
import { FieldProto } from '../../../fintekkers/models/position/field_pb';

//Requests & Services
import { PositionService } from '../../services/position-service/PositionService';
import { QueryPositionRequest } from '../../requests/position/QueryPositionRequest';

test('test getting a position against the api.fintekkers.org position service', async () => {
  const isTrue = await testPosition();
  expect(isTrue).toBe(true);
}, 30000);

async function testPosition(): Promise<boolean> {
  //Get the Federal Reserve portfolio
  let fields = [FieldProto.SECURITY_ID, FieldProto.TRADE_DATE, FieldProto.PRODUCT_TYPE, FieldProto.PORTFOLIO, FieldProto.PRODUCT_TYPE];
  let measures = [MeasureProto.DIRECTED_QUANTITY];

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

