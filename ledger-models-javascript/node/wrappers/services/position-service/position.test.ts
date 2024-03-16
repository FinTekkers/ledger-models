// Models
import { PositionTypeProto, PositionViewProto } from '../../../fintekkers/models/position/position_pb';
import { MeasureProto } from '../../../fintekkers/models/position/measure_pb';

// Model Utils
import { FieldProto } from '../../../fintekkers/models/position/field_pb';
import { ZonedDateTime } from '../../models/utils/datetime';

//Requests & Services
import { PositionService } from '../../services/position-service/PositionService';
import { QueryPositionRequestProto } from '../../../fintekkers/requests/position/query_position_request_pb';

test('test getting a position against the api.fintekkers.org position service', async () => {
  const isTrue = await testPosition();
  expect(isTrue).toBe(true);
}, 30000);

async function testPosition(): Promise<boolean> {
  //Get the Federal Reserve portfolio
  let fields = [FieldProto.SECURITY_ID, FieldProto.TRADE_DATE, FieldProto.PRODUCT_TYPE, FieldProto.PORTFOLIO, FieldProto.PRODUCT_TYPE];
  let measures = [MeasureProto.DIRECTED_QUANTITY];

  let request = new QueryPositionRequestProto()
    .setAsOf(ZonedDateTime.now().toProto())
    .setFieldsList(fields)
    .setMeasuresList(measures)
    .setPositionType(PositionTypeProto.TRANSACTION)
    .setPositionView(PositionViewProto.DEFAULT_VIEW);

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

