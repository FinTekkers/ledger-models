import type { SecurityProto } from '../../../fintekkers/models/security/security_pb';
import type { LocalTimestampProto } from '../../../fintekkers/models/util/local_timestamp_pb';
import type { SummaryProto } from '../../../fintekkers/requests/util/errors/summary_pb';
import Security from '../../models/security/security';
import type { PositionFilter } from '../../models/position/positionfilter';
import type { CreateSecurityResponseProto } from '../../../fintekkers/requests/security/create_security_response_pb';
declare class SecurityService {
    private client;
    constructor(apiKey?: string);
    validateCreateSecurity(security: SecurityProto): Promise<SummaryProto>;
    createSecurity(security: SecurityProto): Promise<CreateSecurityResponseProto>;
    searchSecurityAsOfNow(positionFilter: PositionFilter): Promise<Security[]>;
    searchSecurity(asOf: LocalTimestampProto, positionFilter: PositionFilter): Promise<Security[]>;
}
export { SecurityService };
