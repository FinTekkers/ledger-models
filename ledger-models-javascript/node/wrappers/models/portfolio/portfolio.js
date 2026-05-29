"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const field_pb_1 = require("../../../fintekkers/models/position/field_pb");
const datetime_1 = require("../utils/datetime");
const uuid_1 = require("../utils/uuid");
const LinkCacheModule = __importStar(require("../../util/link-cache"));
const link_resolver_1 = __importDefault(require("../../util/link-resolver"));
class Portfolio {
    constructor(proto) {
        this.proto = proto;
    }
    toString() {
        return this.isLink() ? `<link ${this.getID().toString()}>` : this.getPortfolioName();
    }
    isLink() {
        return this.proto.getIsLink();
    }
    /**
     * Async hydration via `LinkResolver`. Mirrors `Security.hydrate()`.
     * Returns `this` so it can be chained:
     *
     *   const p = await new Portfolio(linkProto).hydrate();
     *   console.log(p.getPortfolioName());
     */
    hydrate(resolver) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.proto.getIsLink())
                return this;
            const uuidProto = this.proto.getUuid();
            if (!uuidProto) {
                throw new Error("Cannot hydrate a link-mode Portfolio with no UUID set.");
            }
            const uuid = uuid_1.UUID.fromU8Array(uuidProto.getRawUuid_asU8());
            const asOfProto = (_a = this.proto.getAsOf()) !== null && _a !== void 0 ? _a : undefined;
            const r = resolver !== null && resolver !== void 0 ? resolver : link_resolver_1.default.getDefault();
            const resolved = yield r.getPortfolio(uuid, asOfProto);
            this.proto = resolved.proto;
            return this;
        });
    }
    /**
     * Lazy hydration. On a link-mode proto, swap in the resolved proto from
     * LinkCache. On cache miss, throws — caller must pre-warm via
     * `await portfolio.hydrate()` or LinkResolver. Cache-only by design (same
     * rationale as Security wrapper: keeps the sync getter API).
     * See docs/adr/lazy-link-hydration.md.
     */
    ensureHydrated() {
        if (!this.proto.getIsLink())
            return;
        const uuidProto = this.proto.getUuid();
        if (!uuidProto) {
            throw new Error("Cannot read fields on link-mode Portfolio with no UUID set.");
        }
        const uuidKey = uuid_1.UUID.fromU8Array(uuidProto.getRawUuid_asU8()).toString();
        const asOfProto = this.proto.getAsOf();
        const asOf = asOfProto ? new datetime_1.ZonedDateTime(asOfProto) : null;
        const cached = LinkCacheModule.PORTFOLIO.get(uuidKey, asOf);
        if (cached) {
            this.proto = cached;
            return;
        }
        throw new Error(`Cannot read fields on link-mode Portfolio uuid=${uuidKey} `
            + `— LinkCache miss. Call \`await portfolio.hydrate()\` first, `
            + `or pre-warm via LinkResolver. `
            + `See docs/adr/lazy-link-hydration.md.`);
    }
    getID() {
        const uuid = this.proto.getUuid();
        if (!uuid)
            throw new Error('Portfolio UUID is undefined');
        return uuid_1.UUID.fromU8Array(this.proto.getUuid().getRawUuid_asU8());
    }
    getAsOf() {
        const asOf = this.proto.getAsOf();
        if (!asOf)
            throw new Error('Portfolio AsOf is undefined');
        return new datetime_1.ZonedDateTime(asOf);
    }
    getPortfolioName() {
        this.ensureHydrated();
        return this.proto.getPortfolioName();
    }
    getFields() {
        return [field_pb_1.FieldProto.ID, field_pb_1.FieldProto.PORTFOLIO, field_pb_1.FieldProto.PORTFOLIO_ID, field_pb_1.FieldProto.PORTFOLIO_NAME];
    }
    getField(field) {
        switch (field) {
            case field_pb_1.FieldProto.ID:
            case field_pb_1.FieldProto.PORTFOLIO_ID:
                return this.getID();
            case field_pb_1.FieldProto.AS_OF:
                return this.getAsOf();
            case field_pb_1.FieldProto.PORTFOLIO_NAME:
                return this.getPortfolioName();
            default:
                throw new Error(`Field not mapped in Portfolio wrapper: ${field}`);
        }
    }
}
exports.default = Portfolio;
//# sourceMappingURL=portfolio.js.map