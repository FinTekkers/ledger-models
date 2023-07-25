const grpc = require('@grpc/grpc-js');

//Models
const { SecurityProto } = require('./node/fintekkers/models/security/security_pb');
//Model Utils
const { PositionFilterProto } = require('./node/fintekkers/models/position/position_filter_pb');
const { FieldProto } = require('./node/fintekkers/models/position/field_pb');

//Requests & Services
const { CreateSecurityRequestProto } = require('./node/fintekkers/requests/security/create_security_request_pb');
const { QuerySecurityRequestProto } = require('./node/fintekkers/requests/security/query_security_request_pb');
const { SecurityClient } = require('./node/fintekkers/services/security-service/security_service_grpc_pb');

const { UUID } = require('./proto_utils_uuid');
const { ZonedDateTime } =  require('./proto_utils_datetime');
const { createFieldMapEntry } = require('./proto_utils_util');

function testSecurity() {
    const receivedBytes = [-39, 98, -3, -16, 51, -31, 77, -99, -103, -101, 126, -61, 80, -16, -53, 119];
    const id_proto = new UUID(receivedBytes).to_uuid_proto();
    const now = ZonedDateTime.now();

    const security = new SecurityProto();
    security.setObjectClass('Security');
    security.setVersion('0.0.1');
    security.setUuid(id_proto);
    security.setCashId('USD');
    security.setSettlementCurrency()
    security.setAsOf(now.to_date_proto());

    var createRequest = new CreateSecurityRequestProto();
    createRequest.setObjectClass('SecurityRequest');
    createRequest.setVersion('0.0.1');
    createRequest.setSecurityInput(security);
    
    var positionFilter = new PositionFilterProto();
    positionFilter.setObjectClass('PositionFilter');
    positionFilter.setVersion('0.0.1');
    positionFilter.set
    positionFilter.setObjectClass('PositionFilter');


    var searchRequest = new QuerySecurityRequestProto();
    searchRequest.setObjectClass('SecurityRequest');
    searchRequest.setVersion('0.0.1');
    searchRequest.setAsOf(now.to_date_proto());

    //TODO: If we uncomment this, we need to add better error handling when
    //record not found on server; currently throws a runtime error
    // searchRequest.addUuids(id_proto);

    var positionFilter = new PositionFilterProto();
    positionFilter.setObjectClass('PositionFilter');
    positionFilter.setVersion('0.0.1');
    var fieldMapEntry = createFieldMapEntry(FieldProto.ASSET_CLASS, "Cash");
    positionFilter.setFiltersList([fieldMapEntry]);
    
    searchRequest.setSearchSecurityInput(positionFilter);
    
    // var client = new SecurityClient('api.fintekkers.org:8082', grpc.credentials.createSsl());
    var client = new SecurityClient('localhost:8082', grpc.credentials.createInsecure());

    //Search for "USD"
    client.validateCreateOrUpdate(createRequest, function (error, response) {
        console.log('Result of the security validation request:');
        if (error) {
            console.error('Error:', error.message);
        } else {
            console.log('Response:', response);
        }
    });

    client.createOrUpdate(createRequest, function (error, response) {
        console.log('Result of the security create/update call');
        if (error) {
            console.error('Error:', error.message);
        } else {
            console.log('Response:', response);
        }
    });

    const stream = client.search(searchRequest);

    // Handle the stream of responses
    stream.on('data', response => {    
        console.log('Result of the security search call');
        console.log('Response:', response);
    });

    stream.on('end', () => {
        // Stream is done, handle any cleanup or finalization here
        console.log('Stream ended.');
    });

    stream.on('error', err => {
        // Handle any errors that occur during the stream
        console.error('Error in the stream:', err);
    });
}

exports.testSecurity = testSecurity;