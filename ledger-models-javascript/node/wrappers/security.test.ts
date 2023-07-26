import * as grpc from '@grpc/grpc-js';

// Models
import { SecurityProto } from '../fintekkers/models/security/security_pb';
import { CouponFrequencyProto } from '../fintekkers/models/security/coupon_frequency_pb';
import { DecimalValueProto } from '../fintekkers/models/util/decimal_value_pb';
import { CouponTypeProto } from '../fintekkers/models/security/coupon_type_pb';
import { SecurityTypeProto } from '../fintekkers/models/security/security_type_pb';
import { LocalDateProto } from '../fintekkers/models/util/local_date_pb';

// Model Utils
import { PositionFilterProto } from '../fintekkers/models/position/position_filter_pb';
import { FieldProto } from '../fintekkers/models/position/field_pb';

// Requests & Services
import { CreateSecurityRequestProto } from '../fintekkers/requests/security/create_security_request_pb';
import { QuerySecurityRequestProto } from '../fintekkers/requests/security/query_security_request_pb';
import { SecurityClient } from '../fintekkers/services/security-service/security_service_grpc_pb';

import * as uuid from './proto_utils_uuid';
import * as dt from './proto_utils_datetime';
import { createFieldMapEntry } from './proto_utils_util';
import { promisify } from 'util';
import { LocalTimestampProto } from '../fintekkers/models/util/local_timestamp_pb';
import { CreateSecurityResponseProto } from '../fintekkers/requests/security/create_security_response_pb';
import { SummaryProto } from '../fintekkers/requests/util/errors/summary_pb';

class SecurityService {
  private client: SecurityClient;

  constructor() {
    this.client = new SecurityClient('api.fintekkers.org:8082', grpc.credentials.createSsl());
    // this.client = new SecurityClient('localhost:8082', grpc.credentials.createInsecure());
  }

  async validateCreateSecurity(security: SecurityProto): Promise<SummaryProto> {
    const createRequest = new CreateSecurityRequestProto();
    createRequest.setObjectClass('SecurityRequest');
    createRequest.setVersion('0.0.1');
    createRequest.setSecurityInput(security);

    const validateCreateOrUpdateAsync = promisify(this.client.validateCreateOrUpdate.bind(this.client));
    const response = await validateCreateOrUpdateAsync(createRequest);
    return response;
  }

  async createSecurity(security: SecurityProto): Promise<CreateSecurityResponseProto> {
    const createRequest = new CreateSecurityRequestProto();
    createRequest.setObjectClass('SecurityRequest');
    createRequest.setVersion('0.0.1');
    createRequest.setSecurityInput(security);

    const createSecurityAsync = promisify(this.client.createOrUpdate.bind(this.client));
    const response = await createSecurityAsync(createRequest);
    return response;
  }

  async searchSecurity(asOf: LocalTimestampProto, fieldProto: FieldProto, fieldValue: string): Promise<SecurityProto[]> {
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

    const listSecurities: SecurityProto[] = [];

    async function processStreamSynchronously(): Promise<SecurityProto[]> {
      const stream2 = tmpClient.search(searchRequest);

      return new Promise<SecurityProto[]>((resolve, reject) => {
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


async function testSecurity(): Promise<void> {
  const id_proto = uuid.UUID.random().to_uuid_proto();
//   const id_proto = UUID.random.to_uuid_proto();
  const now = dt.ZonedDateTime.now();

  const securityService = new SecurityService();

  let usd_security = await securityService
    .searchSecurity(now.to_date_proto(), FieldProto.ASSET_CLASS, 'Cash')
    .then((securities) => {
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
  security.setCouponRate(couponRate); // Fixed a typo here. It was security.setFaceValue(couponRate);

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

  var validationSummary = await securityService.validateCreateSecurity(security);
  console.log(validationSummary);

  var createSecurityResponse:CreateSecurityResponseProto = await securityService.createSecurity(security);
  console.log(createSecurityResponse);

  var searchResults = await securityService.searchSecurity(now.to_date_proto(), FieldProto.ASSET_CLASS, 'Fixed Income');
  console.log('There are %d securities in this response', searchResults.length);
}

export { testSecurity };
