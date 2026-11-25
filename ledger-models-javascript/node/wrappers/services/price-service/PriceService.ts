import { promisify } from 'util';

import Price from '../../models/price/Price';
import { PositionFilter } from '../../models/position/positionfilter';
import { FieldProto } from '../../../fintekkers/models/position/field_pb';
import type { LocalTimestampProto } from '../../../fintekkers/models/util/local_timestamp_pb';
import { DateRangeProto } from '../../../fintekkers/models/util/date_range_pb';
import { Timestamp } from 'google-protobuf/google/protobuf/timestamp_pb';
import type { PriceProto } from '../../../fintekkers/models/price/price_pb';
import type { SummaryProto } from '../../../fintekkers/requests/util/errors/summary_pb';

import { PriceClient } from '../../../fintekkers/services/price-service/price_service_grpc_pb';
import { QueryPriceRequestProto } from '../../../fintekkers/requests/price/query_price_request_pb';
import type { QueryPriceResponseProto } from '../../../fintekkers/requests/price/query_price_response_pb';
import { CreatePriceRequestProto } from '../../../fintekkers/requests/price/create_price_request_pb';
import type { CreatePriceResponseProto } from '../../../fintekkers/requests/price/create_price_response_pb';

import { UUID } from '../../models/utils/uuid';
import * as dt from '../../models/utils/datetime';
import EnvConfig from '../../models/utils/requestcontext';
import { Service } from '../../util/serviceaddress';
import LinkResolver from '../../util/link-resolver';
import * as LinkCacheModule from '../../util/link-cache';
import { ObjectTypeProto } from '../../../fintekkers/models/util/object_type_pb';
import { stamp } from '../../util/object-types';

/** The largest `limit` searchRange sends on one request. */
export const MAX_SEARCH_RESULTS = 10_000;

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

export type PriceSearchErrorCode =
  | 'INVALID_ARGUMENT'  // bad limit, or start after end
  | 'SERVER_REPORTED'   // a response had an entry in errors_or_warnings
  | 'UNSPLITTABLE'      // more than `limit` prices at one timestamp
  | 'OUT_OF_RANGE';     // a price to keep lies outside its date_range

export class PriceSearchError extends Error {
  readonly code: PriceSearchErrorCode;
  readonly messages: string[];

  constructor(code: PriceSearchErrorCode, messages: string[]) {
    super(`${code}: ${messages.join('; ')}`);
    this.name = 'PriceSearchError';
    this.code = code;
    this.messages = messages;
    Object.setPrototypeOf(this, PriceSearchError.prototype);
  }
}

interface WindowResult {
  prices: PriceProto[];
  /** The server capped this window: truncated, row_cap or next_page_token. */
  capped: boolean;
  /** Text of every entry in errors_or_warnings. */
  reported: string[];
}

const NANOS_PER_SECOND = BigInt(1_000_000_000);

function toNanos(ts: LocalTimestampProto): bigint {
  const timestamp = ts.getTimestamp();
  if (!timestamp) {
    throw new PriceSearchError('INVALID_ARGUMENT', ['start and end need a timestamp']);
  }
  return BigInt(timestamp.getSeconds()) * NANOS_PER_SECOND + BigInt(timestamp.getNanos());
}

/** `like` with its timestamp set to `nanos`; the time zone is kept. */
function fromNanos(nanos: bigint, like: LocalTimestampProto): LocalTimestampProto {
  // Floor division: Timestamp nanos are never negative, even before 1970.
  let seconds = nanos / NANOS_PER_SECOND;
  let rest = nanos % NANOS_PER_SECOND;
  if (rest < BigInt(0)) {
    rest += NANOS_PER_SECOND;
    seconds -= BigInt(1);
  }
  const timestamp = new Timestamp();
  timestamp.setSeconds(Number(seconds));
  timestamp.setNanos(Number(rest));
  return like.cloneMessage().setTimestamp(timestamp);
}

function messageText(detail: { getMessageForDeveloper(): string; getMessageForUser(): string } | undefined): string {
  return detail?.getMessageForDeveloper() || detail?.getMessageForUser() || 'no message';
}

class PriceService {
  private client: PriceClient;

  constructor(apiKey?: string) {
    if (apiKey) {
      const { credentials, interceptors } = EnvConfig.getAuthenticatedClientOptions(apiKey, Service.PRICE);
      this.client = new PriceClient(EnvConfig.urlFor(Service.PRICE), credentials, { interceptors });
    } else {
      this.client = new PriceClient(EnvConfig.urlFor(Service.PRICE), EnvConfig.credentialsFor(Service.PRICE));
    }
  }

  close(): void {
    this.client.close();
  }

  async validateCreateOrUpdate(price: Price | PriceProto): Promise<SummaryProto> {
    const priceProto = price instanceof Price ? price.proto : price;

    const createRequest = new CreatePriceRequestProto();
    stamp(createRequest, ObjectTypeProto.OBJECT_TYPE_CREATE_PRICE_REQUEST);
    createRequest.setCreatePriceInput(priceProto);

    const validateAsync = promisify(this.client.validateCreateOrUpdate.bind(this.client));
    const response = await validateAsync(createRequest);
    return response as SummaryProto;
  }

  async createOrUpdate(price: Price | PriceProto): Promise<CreatePriceResponseProto> {
    const priceProto = price instanceof Price ? price.proto : price;

    const createRequest = new CreatePriceRequestProto();
    stamp(createRequest, ObjectTypeProto.OBJECT_TYPE_CREATE_PRICE_REQUEST);
    createRequest.setCreatePriceInput(priceProto);

    const createAsync = promisify(this.client.createOrUpdate.bind(this.client));
    const response = await createAsync(createRequest) as CreatePriceResponseProto;
    // Write-through to LinkCache. price_response is a repeated field.
    for (const persisted of response.getPriceResponseList()) {
      const uuidProto = persisted.getUuid();
      const asOfProto = persisted.getAsOf();
      if (uuidProto && asOfProto) {
        const uuidKey = UUID.fromU8Array(uuidProto.getRawUuid_asU8()).toString();
        LinkCacheModule.PRICE.put(uuidKey, persisted, new dt.ZonedDateTime(asOfProto));
      }
    }
    return response;
  }

  async searchPriceAsOfNow(positionFilter: PositionFilter): Promise<Price[]> {
    const now = dt.ZonedDateTime.now().toProto();
    return this.search(now, positionFilter);
  }

  /**
   * Search for prices matching the given filter, returning Price wrapper objects.
   */
  async search(asOf: LocalTimestampProto, positionFilter: PositionFilter): Promise<Price[]> {
    const searchRequest = new QueryPriceRequestProto();
    stamp(searchRequest, ObjectTypeProto.OBJECT_TYPE_QUERY_PRICE_REQUEST);
    searchRequest.setAsOf(asOf);
    searchRequest.setSearchPriceInput(positionFilter.toProto());

    const tmpClient = this.client;
    const results: Price[] = [];

    async function processStreamSynchronously(): Promise<Price[]> {
      const stream = tmpClient.search(searchRequest);

      return new Promise<Price[]>((resolve, reject) => {
        stream.on('data', (response: QueryPriceResponseProto) => {
          response.getPriceResponseList().forEach((priceProto) => {
            results.push(new Price(priceProto));
          });
        });

        stream.on('end', () => {
          resolve(results);
        });

        stream.on('error', (err) => {
          console.error('Error in the price stream:', err);
          reject(err);
        });
      });
    }

    return await processStreamSynchronously();
  }

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
  async searchRange(positionFilter: PositionFilter, options: PriceSearchRangeOptions): Promise<Price[]> {
    const limit = options.limit ?? MAX_SEARCH_RESULTS;
    if (!Number.isInteger(limit) || limit < 1 || limit > MAX_SEARCH_RESULTS) {
      throw new PriceSearchError('INVALID_ARGUMENT', [`limit must be an integer in 1..${MAX_SEARCH_RESULTS}, got ${limit}`]);
    }
    const startNanos = toNanos(options.start);
    const endNanos = toNanos(options.end);
    if (startNanos > endNanos) {
      throw new PriceSearchError('INVALID_ARGUMENT', ['start is after end']);
    }
    const asOf = options.asOf ?? dt.ZonedDateTime.now().toProto();
    const filterProto = positionFilter.toProto();

    const kept: PriceProto[] = [];
    // LIFO: the left half is pushed last, so windows finish oldest first.
    const windows: Array<[bigint, bigint]> = [[startNanos, endNanos]];
    while (windows.length > 0) {
      const [s, e] = windows.pop()!;

      const request = new QueryPriceRequestProto();
      stamp(request, ObjectTypeProto.OBJECT_TYPE_QUERY_PRICE_REQUEST);
      request.setAsOf(asOf);
      request.setSearchPriceInput(filterProto);
      request.setLimit(limit);
      const dateRange = new DateRangeProto();
      stamp(dateRange, ObjectTypeProto.OBJECT_TYPE_DATE_RANGE);
      dateRange.setStart(fromNanos(s, options.start));
      dateRange.setEnd(fromNanos(e, options.start));
      request.setDateRange(dateRange);

      const result = await this.streamWindow(request);
      if (result.reported.length > 0) {
        throw new PriceSearchError('SERVER_REPORTED', result.reported);
      }
      // A window holding exactly `limit` rows may have more, so it splits;
      // one timestamp cannot split, and without a cap signal it is complete.
      if (!result.capped && (result.prices.length < limit || s === e)) {
        const outside = result.prices.find((p) => {
          const at = p.getAsOf();
          return at?.getTimestamp() !== undefined && (toNanos(at) < s || toNanos(at) > e);
        });
        if (outside) {
          throw new PriceSearchError('OUT_OF_RANGE', ['the server returned a price outside the requested date_range']);
        }
        kept.push(...result.prices);
        continue;
      }
      if (s === e) {
        throw new PriceSearchError('UNSPLITTABLE', [`more than ${limit} prices at one timestamp`]);
      }
      const m = s + (e - s) / BigInt(2);
      windows.push([m + BigInt(1), e]);
      windows.push([s, m]);
    }

    // Windows are disjoint, so this de-dupe is only a safety net.
    const seen = new Set<string>();
    const prices: Price[] = [];
    for (const priceProto of kept) {
      const uuid = priceProto.getUuid();
      if (uuid) {
        const key = UUID.fromU8Array(uuid.getRawUuid_asU8()).toString();
        if (seen.has(key)) continue;
        seen.add(key);
      }
      prices.push(new Price(priceProto));
    }
    return prices;
  }

  /** Streams one searchRange window, collecting rows and server signals. */
  private streamWindow(request: QueryPriceRequestProto): Promise<WindowResult> {
    const stream = this.client.search(request);
    const result: WindowResult = { prices: [], capped: false, reported: [] };

    return new Promise<WindowResult>((resolve, reject) => {
      stream.on('data', (response: QueryPriceResponseProto) => {
        result.prices.push(...response.getPriceResponseList());
        if (response.getTruncated() || response.getRowCap() > 0 || response.getNextPageToken() !== '') {
          result.capped = true;
        }
        const summary = response.getErrorsOrWarnings();
        if (summary) {
          summary.getErrorsList().forEach((error) => result.reported.push(messageText(error.getDetail())));
          summary.getWarningsList().forEach((warning) => result.reported.push(messageText(warning.getDetail())));
        }
      });

      stream.on('end', () => {
        resolve(result);
      });

      stream.on('error', (err) => {
        reject(err);
      });
    });
  }

  /**
   * Backward-compatible alias for search().
   */
  async searchPrice(asOf: LocalTimestampProto, positionFilter: PositionFilter): Promise<PriceProto[]> {
    const prices = await this.search(asOf, positionFilter);
    return prices.map(p => p.proto);
  }

  /**
   * Search prices by security UUID string.
   * Convenience method so callers can write:
   *   priceService.searchBySecurityId('18e8c4e6-3da0-47c9-...')
   */
  async searchBySecurityId(securityId: string, asOf?: LocalTimestampProto): Promise<Price[]> {
    const effectiveAsOf = asOf ?? dt.ZonedDateTime.now().toProto();
    const securityUuid = new UUID(UUID.fromString(securityId));
    const filter = new PositionFilter()
      .addEqualsFilter(FieldProto.SECURITY_ID, securityUuid);

    return this.search(effectiveAsOf, filter);
  }

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
  async searchWithSecurities(
    asOf: LocalTimestampProto,
    positionFilter: PositionFilter,
    linkResolver?: LinkResolver,
  ): Promise<Price[]> {
    const prices = await this.search(asOf, positionFilter);
    const resolver = linkResolver ?? new LinkResolver();
    await resolver.resolveSecurities(prices);
    return prices;
  }
}

export { PriceService };
