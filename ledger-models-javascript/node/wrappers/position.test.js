// Models
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
// Model Utils
import { FieldProto } from '../fintekkers/models/position/field_pb';
//Requests & Services
import { PortfolioService } from './services/portfolio-service/PortfolioService';
import { packStringIntoAny } from '../wrappers/models/utils/util';
import { PositionService } from './services/position-service/PositionService';
import { PositionTypeProto, PositionViewProto } from '../fintekkers/models/position/position_pb';
import { QueryPositionRequestProto } from '../fintekkers/requests/position/query_position_request_pb';
import { IdentifierProto } from '../fintekkers/models/security/identifier/identifier_pb';
import { Any } from 'google-protobuf/google/protobuf/any_pb';
import { FieldMapEntry } from '../fintekkers/models/position/position_util_pb';
import { PositionFilterProto } from '../fintekkers/models/position/position_filter_pb';
import { ZonedDateTime } from './models/utils/datetime';
import { MeasureProto } from '../fintekkers/models/position/measure_pb';
// const { Any } = require("google-protobuf/google/protobuf/any_pb");
// const { ProtoSerializationUtil } = require("your_protobuf_util_package"); // Replace "your_protobuf_util_package" with the actual package name for your Protobuf utility functions
function get_position(security, portfolio, measures, position_type, fields, additional_filters, as_of) {
    if (fields === void 0) { fields = [FieldProto.PORTFOLIO, FieldProto.SECURITY]; }
    if (additional_filters === void 0) { additional_filters = []; }
    if (as_of === void 0) { as_of = ZonedDateTime.now(); }
    return __awaiter(this, void 0, void 0, function () {
        var filters, id_proto, security_id_packed, fieldMapEntry, fieldMapEntry, filter_fields, as_of_proto, request, position_service, positions;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    filters = [];
                    if (security !== null && security !== undefined) {
                        id_proto = new IdentifierProto();
                        id_proto.setIdentifierValue(security.getIdentifier().getIdentifierValue());
                        id_proto.setIdentifierType(security.getIdentifier().getIdentifierType());
                        security_id_packed = new Any();
                        security_id_packed.pack(id_proto);
                        fieldMapEntry = new FieldMapEntry();
                        fieldMapEntry.setField(FieldProto.IDENTIFIER);
                        fieldMapEntry.setFieldValuePacked(security_id_packed);
                        filters.push(fieldMapEntry);
                    }
                    if (portfolio !== null && portfolio !== undefined) {
                        fieldMapEntry = new FieldMapEntry();
                        fieldMapEntry.setField(FieldProto.PORTFOLIO_NAME);
                        fieldMapEntry.setFieldValuePacked(packStringIntoAny(portfolio.getPortfolioName()));
                        filters.push(fieldMapEntry);
                    }
                    if (additional_filters !== null && additional_filters.length > 0) {
                        filters.push.apply(filters, additional_filters);
                    }
                    filter_fields = new PositionFilterProto();
                    filter_fields.setFiltersList(filters);
                    as_of_proto = as_of.to_date_proto();
                    request = new QueryPositionRequestProto();
                    request.setPositionType(position_type);
                    request.setPositionView(PositionViewProto.DEFAULT_VIEW);
                    request.setFieldsList(fields);
                    request.setMeasuresList(measures);
                    request.setFilterFields(filter_fields);
                    request.setAsOf(as_of_proto);
                    position_service = new PositionService();
                    return [4 /*yield*/, position_service.search(request)];
                case 1:
                    positions = _a.sent();
                    return [2 /*return*/, positions];
            }
        });
    });
}
function testPosition() {
    return __awaiter(this, void 0, void 0, function () {
        var now, portfolioService, portfolios, fedReservePortfolio, positions;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    now = ZonedDateTime.now();
                    portfolioService = new PortfolioService();
                    return [4 /*yield*/, portfolioService.searchPortfolio(now.to_date_proto(), FieldProto.PORTFOLIO_NAME, "Federal Reserve SOMA Holdings")];
                case 1:
                    portfolios = _a.sent();
                    fedReservePortfolio = portfolios[0];
                    return [4 /*yield*/, get_position(null, fedReservePortfolio, [MeasureProto.DIRECTED_QUANTITY], PositionTypeProto.TRANSACTION, [FieldProto.PORTFOLIO_NAME, FieldProto.SECURITY_ID], [], now)];
                case 2:
                    positions = _a.sent();
                    positions[0].getFieldsList().forEach(function (field) { console.log(field); });
                    positions[0].getMeasuresList().forEach(function (measure) { console.log(measure); });
                    console.log(positions);
                    return [2 /*return*/];
            }
        });
    });
}
export { testPosition };
//# sourceMappingURL=position.test.js.map