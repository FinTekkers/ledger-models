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
exports.UUID = void 0;
const uuid_pb_1 = require("../../../fintekkers/models/util/uuid_pb");
const uuid = __importStar(require("uuid"));
/**
 * Convert array of 16 byte values to UUID string format of the form:
 * XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX
 */
const byteToHex = [];
for (let i = 0; i < 256; ++i) {
    byteToHex.push((i + 0x100).toString(16).slice(1));
}
class UUID {
    constructor(bytes) {
        this.bytes = bytes;
    }
    toString() {
        const arr = new Uint8Array(this.bytes);
        const offset = 0;
        const str = byteToHex[arr[offset + 0]] + byteToHex[arr[offset + 1]] + byteToHex[arr[offset + 2]] + byteToHex[arr[offset + 3]] + '-' + byteToHex[arr[offset + 4]] + byteToHex[arr[offset + 5]] + '-' + byteToHex[arr[offset + 6]] + byteToHex[arr[offset + 7]] + '-' + byteToHex[arr[offset + 8]] + byteToHex[arr[offset + 9]] + '-' + byteToHex[arr[offset + 10]] + byteToHex[arr[offset + 11]] + byteToHex[arr[offset + 12]] + byteToHex[arr[offset + 13]] + byteToHex[arr[offset + 14]] + byteToHex[arr[offset + 15]];
        return str; //uuid.stringify(byteArray);
    }
    toBytes() {
        return this.bytes;
    }
    toUUIDProto() {
        const id_proto = new uuid_pb_1.UUIDProto();
        id_proto.setRawUuid(new Uint8Array(this.toBytes()));
        return id_proto;
    }
    equals(other) {
        return this.toBytes() === other.toBytes();
    }
    static random() {
        const random = uuid.v4();
        return new UUID(UUID.fromString(random));
    }
    static fromU8Array(uint8Array) {
        const array = Array.from(uint8Array, byte => byte);
        return new UUID(array);
    }
    static fromString(uuidString) {
        // Remove hyphens and convert to a continuous hexadecimal string
        const hexString = uuidString.replace(/-/g, '');
        // Split the continuous hexadecimal string into two-character chunks
        const hexChunks = hexString.match(/.{1,2}/g);
        // Convert each two-character chunk to a byte (number)
        const bytes = hexChunks.map((chunk) => parseInt(chunk, 16));
        return bytes;
    }
}
exports.UUID = UUID;
//# sourceMappingURL=uuid.js.map