// Models

import { PositionFilter } from '../../models/position/positionfilter';
import { Position } from '../../models/position/hardcoded.position';
import { IdentifierProto } from '../../../fintekkers/models/security/identifier/identifier_pb';
import { PositionTypeProto, PositionViewProto } from '../../../fintekkers/models/position/position_pb';
import { SecurityProto } from '../../../fintekkers/models/security/security_pb';
import { MeasureProto } from '../../../fintekkers/models/position/measure_pb';
import { PortfolioProto } from '../../../fintekkers/models/portfolio/portfolio_pb';
import { PositionFilterProto } from '../../../fintekkers/models/position/position_filter_pb';

// Model Utils
import { FieldProto } from '../../../fintekkers/models/position/field_pb';
import { FieldMapEntry } from '../../../fintekkers/models/position/position_util_pb';
import { ZonedDateTime } from '../../models/utils/datetime';
import { pack } from '../../models/utils/serialization.util';
import { Any } from 'google-protobuf/google/protobuf/any_pb';

//Requests & Services
import { PositionService } from '../../services/position-service/PositionService';
import { QueryPositionRequestProto } from '../../../fintekkers/requests/position/query_position_request_pb';

test('test getting a position against the api.fintekkers.org position service', async () => {
  // const isTrue = await testPosition();
  // expect(isTrue).toBe(true);
}, 30000);

async function get_position(security: SecurityProto,
  portfolio: PortfolioProto,
  measures: MeasureProto[],
  position_type: PositionTypeProto,
  fields = [FieldProto.PORTFOLIO, FieldProto.SECURITY],
  additional_filters = [], as_of = ZonedDateTime.now()) {
  const filters = [];

  if (security !== null && security !== undefined) {
    const id_proto = new IdentifierProto();
    id_proto.setIdentifierValue(security.getIdentifier().getIdentifierValue());
    id_proto.setIdentifierType(security.getIdentifier().getIdentifierType());

    const security_id_packed = new Any();
    security_id_packed.pack(id_proto);

    const fieldMapEntry = new FieldMapEntry();
    fieldMapEntry.setField(FieldProto.IDENTIFIER);
    fieldMapEntry.setFieldValuePacked(security_id_packed);

    filters.push(fieldMapEntry);
  }

  if (portfolio !== null && portfolio !== undefined) {
    const fieldMapEntry = new FieldMapEntry();
    fieldMapEntry.setField(FieldProto.PORTFOLIO_NAME);
    fieldMapEntry.setFieldValuePacked(pack(portfolio.getPortfolioName()));

    filters.push(fieldMapEntry);
  }

  if (additional_filters !== null && additional_filters.length > 0) {
    filters.push(...additional_filters);
  }

  const filter_fields = new PositionFilterProto();
  filter_fields.setFiltersList(filters);

  const as_of_proto = as_of.toProto();

  const request = new QueryPositionRequestProto();
  request.setPositionType(position_type);
  request.setPositionView(PositionViewProto.DEFAULT_VIEW);
  request.setFieldsList(fields);
  request.setMeasuresList(measures);
  request.setFilterFields(filter_fields);
  request.setAsOf(as_of_proto);

  let position_service = new PositionService();

  const positions: Position[] = await position_service.search(request);

  return positions;
}

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

  if (positions) {
    console.log(positions.length + " positions returned")

    let position = positions[0];

    console.log(position.getFieldValue(FieldProto.SECURITY_ID));
    position.toString();
  } else {
    console.log("No positions found");
  }
  return true;
}

