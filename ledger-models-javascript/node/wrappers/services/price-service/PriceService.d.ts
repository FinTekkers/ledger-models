import Price from '../../models/price/Price';
import { PositionFilter } from '../../models/position/positionfilter';
import { LocalTimestampProto } from '../../../fintekkers/models/util/local_timestamp_pb';
import { PriceProto } from '../../../fintekkers/models/price/price_pb';
import { SummaryProto } from '../../../fintekkers/requests/util/errors/summary_pb';
import { CreatePriceResponseProto } from '../../../fintekkers/requests/price/create_price_response_pb';
import LinkResolver from '../../util/link-resolver';
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
    /**
     * Search prices and hydrate each Price's embedded Security from link
     * to full entity in a single batched lookup. Equivalent to:
     *
     *   const prices = await priceService.search(asOf, filter);
     *   await new LinkResolver().resolveSecurities(prices);
     *
     * but with the LinkResolver instance reusable across calls (cache hits
     * benefit subsequent lookups).
     *
     * Pass a shared `linkResolver` to share caching across multiple
     * service-wrapper calls in the same request scope. If omitted, a new
     * resolver is constructed per call (no cross-call cache reuse).
     *
     * Mutates each returned Price.proto's embedded SecurityProto in place
     * (link → full). See LinkResolver for cache + dedupe semantics.
     */
    searchWithSecurities(asOf: LocalTimestampProto, positionFilter: PositionFilter, linkResolver?: LinkResolver): Promise<Price[]>;
}
export { PriceService };
