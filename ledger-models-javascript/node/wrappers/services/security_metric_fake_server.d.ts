import { SecurityMetricTypeProto } from '../../fintekkers/models/security/security_metric_type_pb';
import { type CreateSecurityMetricRequestProto } from '../../fintekkers/requests/security_metric/create_security_metric_request_pb';
import { type GetLatestSecurityMetricRequestProto } from '../../fintekkers/requests/security_metric/get_latest_security_metric_request_pb';
import { type SearchSecurityMetricRequestProto } from '../../fintekkers/requests/security_metric/search_security_metric_request_pb';
/** The seeded SPY security: SHARES_OUTSTANDING 2026-11-19 → 15204137000, 2026-11-20 → 15210000000. */
export declare const SPY_UUID = "5f0c2a1e-7b3d-4c8e-9a10-2b3c4d5e6f70";
export declare class FakeSecurityMetricServer {
    readonly port: number;
    readonly calls: {
        getLatest: number;
        search: number;
        createOrUpdate: number;
    };
    readonly getLatestRequests: GetLatestSecurityMetricRequestProto[];
    readonly searchRequests: SearchSecurityMetricRequestProto[];
    readonly createRequests: CreateSecurityMetricRequestProto[];
    /** `${uuid}|${metric}` → ISO date → canonical decimal string. */
    private readonly store;
    private readonly server;
    private constructor();
    /** Starts a server on 127.0.0.1 with a free port, seeded with SPY. */
    static start(): Promise<FakeSecurityMetricServer>;
    /** `host:port` of the server. */
    get address(): string;
    /** Adds points for (uuid, metric). */
    seed(uuid: string, metric: SecurityMetricTypeProto, points: Array<[string, string]>): void;
    /** Stops the server and drops open calls. */
    stop(): Promise<void>;
    private knows;
    private sorted;
    private series;
    private getLatest;
    private search;
    private createOrUpdate;
}
