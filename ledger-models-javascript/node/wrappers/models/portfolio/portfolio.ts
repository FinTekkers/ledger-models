import { PortfolioProto } from "../../../fintekkers/models/portfolio/portfolio_pb";
import { FieldProto } from "../../../fintekkers/models/position/field_pb";
import { ZonedDateTime } from "../utils/datetime";
import { UUID } from "../utils/uuid";
import * as LinkCacheModule from "../../util/link-cache";
import LinkResolver from "../../util/link-resolver";

class Portfolio {
    proto: PortfolioProto;

    constructor(proto: PortfolioProto) {
        this.proto = proto;
    }

    toString(): string {
        return this.isLink() ? `<link ${this.getID().toString()}>` : this.getPortfolioName();
    }

    isLink(): boolean {
        return this.proto.getIsLink();
    }

    /**
     * Async hydration via `LinkResolver`. Mirrors `Security.hydrate()`.
     * Returns `this` so it can be chained:
     *
     *   const p = await new Portfolio(linkProto).hydrate();
     *   console.log(p.getPortfolioName());
     */
    async hydrate(resolver?: LinkResolver): Promise<this> {
        if (!this.proto.getIsLink()) return this;
        const uuidProto = this.proto.getUuid();
        if (!uuidProto) {
            throw new Error("Cannot hydrate a link-mode Portfolio with no UUID set.");
        }
        const uuid = UUID.fromU8Array(uuidProto.getRawUuid_asU8());
        const asOfProto = this.proto.getAsOf() ?? undefined;
        const r = resolver ?? LinkResolver.getDefault();
        const resolved = await r.getPortfolio(uuid, asOfProto);
        this.proto = resolved.proto;
        return this;
    }

    /**
     * Lazy hydration. On a link-mode proto, swap in the resolved proto from
     * LinkCache. On cache miss, throws — caller must pre-warm via
     * `await portfolio.hydrate()` or LinkResolver. Cache-only by design (same
     * rationale as Security wrapper: keeps the sync getter API).
     * See docs/adr/lazy-link-hydration.md.
     */
    private ensureHydrated(): void {
        if (!this.proto.getIsLink()) return;
        const uuidProto = this.proto.getUuid();
        if (!uuidProto) {
            throw new Error("Cannot read fields on link-mode Portfolio with no UUID set.");
        }
        const uuidKey = UUID.fromU8Array(uuidProto.getRawUuid_asU8()).toString();
        const asOfProto = this.proto.getAsOf();
        const asOf = asOfProto ? new ZonedDateTime(asOfProto) : null;
        const cached = LinkCacheModule.PORTFOLIO.get(uuidKey, asOf);
        if (cached) {
            this.proto = cached;
            return;
        }
        throw new Error(
            `Cannot read fields on link-mode Portfolio uuid=${uuidKey} `
            + `— LinkCache miss. Call \`await portfolio.hydrate()\` first, `
            + `or pre-warm via LinkResolver. `
            + `See docs/adr/lazy-link-hydration.md.`
        );
    }

    getID(): UUID {
        const uuid = this.proto.getUuid();
        if (!uuid) throw new Error('Portfolio UUID is undefined');
        return UUID.fromU8Array(this.proto.getUuid()!.getRawUuid_asU8());
    }

    getAsOf(): ZonedDateTime {
        const asOf = this.proto.getAsOf();
        if (!asOf) throw new Error('Portfolio AsOf is undefined');
        return new ZonedDateTime(asOf);
    }

    getPortfolioName(): string {
        this.ensureHydrated();
        return this.proto.getPortfolioName();
    }

    getFields(): FieldProto[] {
        return [FieldProto.ID, FieldProto.PORTFOLIO, FieldProto.PORTFOLIO_ID, FieldProto.PORTFOLIO_NAME];
    }

    getField(field: FieldProto): any {
        switch (field) {
            case FieldProto.ID:
            case FieldProto.PORTFOLIO_ID:
                return this.getID();
            case FieldProto.AS_OF:
                return this.getAsOf();
            case FieldProto.PORTFOLIO_NAME:
                return this.getPortfolioName();
            default:
                throw new Error(`Field not mapped in Portfolio wrapper: ${field}`);
        }
    }
}


export default Portfolio;