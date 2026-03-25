import Price from '../../models/price/Price';
import { PositionFilter } from '../../models/position/positionfilter';
import { LocalTimestampProto } from '../../../fintekkers/models/util/local_timestamp_pb';
import { PriceProto } from '../../../fintekkers/models/price/price_pb';
import { SummaryProto } from '../../../fintekkers/requests/util/errors/summary_pb';
import { CreatePriceResponseProto } from '../../../fintekkers/requests/price/create_price_response_pb';
declare class PriceService {
    private client;
    constructor(apiKey?: string);
    close(): void;
    validateCreateOrUpdate(price: Price | PriceProto): Promise<SummaryProto>;
    createOrUpdate(price: Price | PriceProto): Promise<CreatePriceResponseProto>;
    searchPriceAsOfNow(positionFilter: PositionFilter): Promise<Price[]>;
    /**
     * Search for prices matching the given filter, returning Price wrapper objects.
     */
    search(asOf: LocalTimestampProto, positionFilter: PositionFilter): Promise<Price[]>;
    /**
     * Backward-compatible alias for search().
     */
    searchPrice(asOf: LocalTimestampProto, positionFilter: PositionFilter): Promise<PriceProto[]>;
    /**
     * Search prices by security UUID string.
     * Convenience method so callers can write:
     *   priceService.searchBySecurityId('18e8c4e6-3da0-47c9-...')
     */
    searchBySecurityId(securityId: string, asOf?: LocalTimestampProto): Promise<Price[]>;
}
export { PriceService };
