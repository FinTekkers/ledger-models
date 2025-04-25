import { SecurityProto } from '../../../fintekkers/models/security/security_pb';
import { LocalTimestampProto } from '../../../fintekkers/models/util/local_timestamp_pb';
import { SummaryProto } from '../../../fintekkers/requests/util/errors/summary_pb';
import Security from '../../models/security/security';
import { PositionFilter } from '../../models/position/positionfilter';
import { CreateSecurityResponseProto } from '../../../fintekkers/requests/security/create_security_response_pb';
declare class SecurityService {
    private client;
    constructor();
    validateCreateSecurity(security: SecurityProto): Promise<SummaryProto>;
    createSecurity(security: SecurityProto): Promise<CreateSecurityResponseProto>;
    searchSecurityAsOfNow(positionFilter: PositionFilter): Promise<Security[]>;
    searchSecurity(asOf: LocalTimestampProto, positionFilter: PositionFilter): Promise<Security[]>;
}
export { SecurityService };
