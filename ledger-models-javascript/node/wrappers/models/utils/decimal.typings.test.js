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
Object.defineProperty(exports, "__esModule", { value: true });
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
/**
 * Metric 4 (LM-306): the published typings mark the deprecated string
 * accessors. compile.sh adds the tags after protoc-gen-ts runs.
 */
const TYPINGS = path.join(__dirname, '../../../fintekkers/models/util/decimal_value_pb.d.ts');
test.each(['getArbitraryPrecisionValue', 'setArbitraryPrecisionValue'])('%s is @deprecated', (accessor) => {
    const lines = fs.readFileSync(TYPINGS, 'utf8').split('\n');
    const at = lines.findIndex(l => l.trim().startsWith(`${accessor}(`));
    expect(at).toBeGreaterThan(0);
    expect(lines[at - 1].trim()).toMatch(/^\/\*\* @deprecated .*\*\/$/);
});
//# sourceMappingURL=decimal.typings.test.js.map