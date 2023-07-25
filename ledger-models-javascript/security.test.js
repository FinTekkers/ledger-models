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
const { promisify } = require('util');

class SecurityService {
    constructor() {
        // this.client = new SecurityClient('api.fintekkers.org:8082', grpc.credentials.createSsl());
        this.client = new SecurityClient('localhost:8082', grpc.credentials.createInsecure());
    }

    async createSecurity(security) {
        var createRequest = new CreateSecurityRequestProto();
        createRequest.setObjectClass('SecurityRequest');
        createRequest.setVersion('0.0.1');
        createRequest.setSecurityInput(security);

        const createSecurityAsync = promisify(this.client.createOrUpdate.bind(this.client));
        const response = await createSecurityAsync(createRequest);
        return response;
    }

    async searchSecurity(
        asOf, //LocalTimestamp
        fieldProto, //FieldProto
        fieldValue //String
    ) {
        var searchRequest = new QuerySecurityRequestProto();
        searchRequest.setObjectClass('SecurityRequest');
        searchRequest.setVersion('0.0.1');
        searchRequest.setAsOf(asOf);

        // searchRequest.addUuids(security.getUuid());

        var positionFilter = new PositionFilterProto();
        positionFilter.setObjectClass('PositionFilter');
        positionFilter.setVersion('0.0.1');

        var fieldMapEntry = createFieldMapEntry(fieldProto, fieldValue);
        positionFilter.setFiltersList([fieldMapEntry]);
        
        searchRequest.setSearchSecurityInput(positionFilter);

        const tmpClient = this.client;

        var listSecurities = [];

        async function processStreamSynchronously() {
            const stream2 = tmpClient.search(searchRequest);

            return new Promise((resolve, reject) => {
                // Handle the stream of responses
                stream2.on('data', response => {
                    console.log('Result of the security search call');
                    console.log('Response:', response);
                    response.getSecurityResponseList().forEach(security => {
                        listSecurities.push(security);
                    })
                });
            
                stream2.on('end', () => {
                    // Stream is done, handle any cleanup or finalization here
                    console.log('Stream ended.');
                    resolve(listSecurities); // Resolve the promise when the stream ends
                });
            
                stream2.on('error', err => {
                    // Handle any errors that occur during the stream
                    console.error('Error in the stream:', err);
                    reject(err); // Reject the promise if there's an error
                });
            });
        }
        
        return await processStreamSynchronously();
    }
}
async function testSecurity() {
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
    
    
    let usd_security;
    await new SecurityService().searchSecurity(
        now.to_date_proto(),
        FieldProto.ASSET_CLASS,
        "Cash"
    ).then(response => {
        console.log('Result of the security search call');
        console.log('Response:', response);
        usd_security = response[0];
    });

    console.log(usd_security.getAssetClass());

    // //Search for "USD"
    // client.validateCreateOrUpdate(createRequest, function (error, response) {
    //     console.log('Result of the security validation request:');
    //     if (error) {
    //         console.error('Error:', error.message);
    //     } else {
    //         console.log('Response:', response);
    //     }
    // });

    // client.createOrUpdate(createRequest, function (error, response) {
    //     console.log('Result of the security create/update call');
    //     if (error) {
    //         console.error('Error:', error.message);
    //     } else {
    //         console.log('Response:', response);
    //     }
    // });

}

exports.testSecurity = testSecurity;