import Price from '../../models/price/Price';
import { PositionFilter } from '../../models/position/positionfilter';
import type { LocalTimestampProto } from '../../../fintekkers/models/util/local_timestamp_pb';
import type { PriceProto } from '../../../fintekkers/models/price/price_pb';
import type { SummaryProto } from '../../../fintekkers/requests/util/errors/summary_pb';
import type { CreatePriceResponseProto } from '../../../fintekkers/requests/price/create_price_response_pb';
import LinkResolver from '../../util/link-resolver';
/** The largest `limit` searchRange sends on one request. */
export declare const MAX_SEARCH_RESULTS = 10000;
export interface PriceSearchRangeOptions {
    /** First as_of in the range, inclusive. */
    start: LocalTimestampProto;
    /** Last as_of in the range, inclusive. */
    end: LocalTimestampProto;
    /** Rows per request, 1..MAX_SEARCH_RESULTS. Default MAX_SEARCH_RESULTS. */
    limit?: number;
    /** The request's as_of. Default: now, taken once for every window. */
    asOf?: LocalTimestampProto;
}
export type PriceSearchErrorCode = 'INVALID_ARGUMENT' | 'SERVER_REPORTED' | 'UNSPLITTABLE' | 'OUT_OF_RANGE';
export declare class PriceSearchError extends Error {
    readonly code: PriceSearchErrorCode;
    readonly messages: string[];
    constructor(code: PriceSearchErrorCode, messages: string[]);
}
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
     * Every price matching the filter with an as_of in [start, end], read in
     * chunks of at most `limit` rows (LM-494). search() sends no limit, so the
     * server applies its default cap and the caller silently gets the newest
     * rows only; this method never returns partial data.
     *
     * Each request sets `limit` and `date_range`. A window that comes back
     * full is discarded and split in half, until every window fits. Windows
     * never overlap and every split halves one, so the read always ends and
     * never asks for the same window twice.
     *
     * Rejects with PriceSearchError:
     * - INVALID_ARGUMENT: `limit` is not an integer in 1..MAX_SEARCH_RESULTS,
     *   or start is after end. No request is sent.
     * - SERVER_REPORTED: a response had an entry in errors_or_warnings.
     * - UNSPLITTABLE: more than `limit` prices share one timestamp.
     * - OUT_OF_RANGE: a window's rows include a price whose as_of is outside
     *   that window, so the server is not honouring date_range.
     * A gRPC stream error rejects unchanged, as in search().
     *
     * Server requirement: a server that returns fewer rows than asked must
     * say so with `truncated`, `row_cap` or `next_page_token`. A server that
     * cuts rows with none of those signals cannot be detected here.
     */
    searchRange(positionFilter: PositionFilter, options: PriceSearchRangeOptions): Promise<Price[]>;
    /** Streams one searchRange window, collecting rows and server signals. */
    private streamWindow;
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
