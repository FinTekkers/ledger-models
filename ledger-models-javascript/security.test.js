const grpc = require('@grpc/grpc-js');

//Models
const { SecurityProto } = require('./node/fintekkers/models/security/security_pb');
const { CouponFrequencyProto } = require('./node/fintekkers/models/security/coupon_frequency_pb');
const { DecimalValueProto } = require('./node/fintekkers/models/util/decimal_value_pb');
const { CouponTypeProto } = require('./node/fintekkers/models/security/coupon_type_pb');
const { SecurityTypeProto } = require('./node/fintekkers/models/security/security_type_pb');
const { LocalDateProto } = require('./node/fintekkers/models/util/local_date_pb');

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
    this.client = new SecurityClient('api.fintekkers.org:8082', grpc.credentials.createSsl());
    // this.client = new SecurityClient('localhost:8082', grpc.credentials.createInsecure());
  }

  async validateCreateSecurity(security) {
    const createRequest = new CreateSecurityRequestProto();
    createRequest.setObjectClass('SecurityRequest');
    createRequest.setVersion('0.0.1');
    createRequest.setSecurityInput(security);

    const validateCreateOrUpdateAsync = promisify(this.client.validateCreateOrUpdate.bind(this.client));
    const response = await validateCreateOrUpdateAsync(createRequest);
    return response;
  }

  async createSecurity(security) {
    const createRequest = new CreateSecurityRequestProto();
    createRequest.setObjectClass('SecurityRequest');
    createRequest.setVersion('0.0.1');
    createRequest.setSecurityInput(security);

    const createSecurityAsync = promisify(this.client.createOrUpdate.bind(this.client));
    const response = await createSecurityAsync(createRequest);
    return response;
  }

  async searchSecurity(asOf, fieldProto, fieldValue) {
    const searchRequest = new QuerySecurityRequestProto();
    searchRequest.setObjectClass('SecurityRequest');
    searchRequest.setVersion('0.0.1');
    searchRequest.setAsOf(asOf);

    const positionFilter = new PositionFilterProto();
    positionFilter.setObjectClass('PositionFilter');
    positionFilter.setVersion('0.0.1');

    const fieldMapEntry = createFieldMapEntry(fieldProto, fieldValue);
    positionFilter.setFiltersList([fieldMapEntry]);

    searchRequest.setSearchSecurityInput(positionFilter);

    const tmpClient = this.client;

    const listSecurities = [];

    async function processStreamSynchronously() {
      const stream2 = tmpClient.search(searchRequest);

      return new Promise((resolve, reject) => {
        // Handle the stream of responses
        stream2.on('data', (response) => {
          console.log('Result of the security search call');
          console.log('Response:', response);
          response.getSecurityResponseList().forEach((security) => {
            listSecurities.push(security);
          });
        });

        stream2.on('end', () => {
          // Stream is done, handle any cleanup or finalization here
          console.log('Stream ended.');
          resolve(listSecurities); // Resolve the promise when the stream ends
        });

        stream2.on('error', (err) => {
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
  const id_proto = new UUID.random().to_uuid_proto();
  const now = ZonedDateTime.now();

  const securityService = new SecurityService();

  let usd_security = await securityService
    .searchSecurity(now.to_date_proto(), FieldProto.ASSET_CLASS, 'Cash').then((securities) => {
        return securities[0];
    });

    const security = new SecurityProto();
    security.setObjectClass('Security');
    security.setVersion('0.0.1');
    security.setUuid(id_proto);
    security.setSettlementCurrency(usd_security);
    security.setAsOf(now.to_date_proto());
    security.setAssetClass('FixedIncome');
    security.setCouponFrequency(CouponFrequencyProto.SEMIANNUALLY);
    security.setCouponType(CouponTypeProto.FIXED);
    security.setSecurityType(SecurityTypeProto.BOND_SECURITY);
  
    const faceValue = new DecimalValueProto();
    faceValue.setArbitraryPrecisionValue('1000.00');
    security.setFaceValue(faceValue);
  
    const couponRate = new DecimalValueProto();
    couponRate.setArbitraryPrecisionValue('0.05');
    security.setFaceValue(couponRate);
  
    const issueDate = new LocalDateProto();
    issueDate.setYear(2023);
    issueDate.setMonth(1);
    issueDate.setDay(1);
    security.setIssueDate(issueDate);
    security.setDatedDate(issueDate);
  
    const maturityDate = new LocalDateProto();
    maturityDate.setYear(2033); //10Y
    maturityDate.setMonth(1);
    maturityDate.setDay(1);
    security.setMaturityDate(maturityDate);
  
    security.setIssuerName('US Treasury');
    security.setDescription('Dummy US Treasury 10Y Bond');

  var response = await securityService.validateCreateSecurity(security);
  console.log(response);

  response = await securityService.createSecurity(security);

  response = await securityService.searchSecurity(now.to_date_proto(), FieldProto.ASSET_CLASS, 'Fixed Income');
  console.log('There are %d securities in this response', response.length);
}

exports.testSecurity = testSecurity;
