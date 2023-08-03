// Models

// Model Utils
import { FieldProto } from '../fintekkers/models/position/field_pb';
import * as uuid from './models/utils/uuid';
import * as dt from './models/utils/datetime';

//Requests & Services
import { PortfolioService } from './services/portfolio-service/PortfolioService';
import { PortfolioProto } from '../fintekkers/models/portfolio/portfolio_pb';
import { QueryPortfolioRequestProto } from '../fintekkers/requests/portfolio/query_portfolio_request_pb';

import { packStringIntoAny } from '../wrappers/models/utils/util';
import { PositionService } from './services/position-service/PositionService';
import { PositionProto, PositionTypeProto, PositionViewProto } from '../fintekkers/models/position/position_pb';
import { QueryPositionRequestProto } from '../fintekkers/requests/position/query_position_request_pb';
import { CreatePortfolioResponseProto } from '../fintekkers/requests/portfolio/create_portfolio_response_pb';
import { IdentifierProto } from '../fintekkers/models/security/identifier/identifier_pb';
import { Any } from 'google-protobuf/google/protobuf/any_pb';
import { FieldMapEntry } from '../fintekkers/models/position/position_util_pb';
import { PositionFilterProto } from '../fintekkers/models/position/position_filter_pb';
import { ZonedDateTime } from './models/utils/datetime';
import { SecurityProto } from '../fintekkers/models/security/security_pb';
import { MeasureProto } from '../fintekkers/models/position/measure_pb';
import { SecurityService } from './services/security-service/SecurityService';

// const { Any } = require("google-protobuf/google/protobuf/any_pb");

// const { ProtoSerializationUtil } = require("your_protobuf_util_package"); // Replace "your_protobuf_util_package" with the actual package name for your Protobuf utility functions

async function get_position(security:SecurityProto, 
            portfolio:PortfolioProto, 
            measures:MeasureProto[], 
            position_type:PositionTypeProto, 
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
        fieldMapEntry.setFieldValuePacked(packStringIntoAny(portfolio.getPortfolioName()));

        filters.push(fieldMapEntry);
    }

    if (additional_filters !== null && additional_filters.length > 0) {
        filters.push(...additional_filters);
    }

    const filter_fields = new PositionFilterProto();
    filter_fields.setFiltersList(filters);

    const as_of_proto = as_of.to_date_proto();

    const request = new QueryPositionRequestProto();
    request.setPositionType(position_type);
    request.setPositionView(PositionViewProto.DEFAULT_VIEW);
    request.setFieldsList(fields);
    request.setMeasuresList(measures);
    request.setFilterFields(filter_fields);
    request.setAsOf(as_of_proto);

    let position_service = new PositionService();

    const positions = await position_service.search(request);
    
    return positions;
}

async function testPosition(): Promise<void> {
  //Get the Federal Reserve portfolio
  const now = ZonedDateTime.now();

  const portfolioService = new PortfolioService();
  
  let portfolios = await portfolioService.searchPortfolio(
        now.to_date_proto(), 
        FieldProto.PORTFOLIO_NAME, 
        "Federal Reserve SOMA Holdings");
  const fedReservePortfolio = portfolios[0];

  let positions = await get_position(null, fedReservePortfolio, 
    [MeasureProto.DIRECTED_QUANTITY], 
    PositionTypeProto.TRANSACTION,
    [FieldProto.PORTFOLIO_NAME, FieldProto.SECURITY_ID], [], now);


    positions[0].getFieldsList().forEach((field) => { console.log(field); });
    positions[0].getMeasuresList().forEach((measure) => { console.log(measure); });
  console.log(positions);
}

export { testPosition };
