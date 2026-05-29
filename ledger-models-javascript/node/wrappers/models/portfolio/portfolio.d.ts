import { PortfolioProto } from "../../../fintekkers/models/portfolio/portfolio_pb";
import { FieldProto } from "../../../fintekkers/models/position/field_pb";
import { ZonedDateTime } from "../utils/datetime";
import { UUID } from "../utils/uuid";
import LinkResolver from "../../util/link-resolver";
declare class Portfolio {
    proto: PortfolioProto;
    constructor(proto: PortfolioProto);
    toString(): string;
    isLink(): boolean;
    /**
     * Async hydration via `LinkResolver`. Mirrors `Security.hydrate()`.
     * Returns `this` so it can be chained:
     *
     *   const p = await new Portfolio(linkProto).hydrate();
     *   console.log(p.getPortfolioName());
     */
    hydrate(resolver?: LinkResolver): Promise<this>;
    /**
     * Lazy hydration. On a link-mode proto, swap in the resolved proto from
     * LinkCache. On cache miss, throws — caller must pre-warm via
     * `await portfolio.hydrate()` or LinkResolver. Cache-only by design (same
     * rationale as Security wrapper: keeps the sync getter API).
     * See docs/adr/lazy-link-hydration.md.
     */
    private ensureHydrated;
    getID(): UUID;
    getAsOf(): ZonedDateTime;
    getPortfolioName(): string;
    getFields(): FieldProto[];
    getField(field: FieldProto): any;
}
export default Portfolio;
