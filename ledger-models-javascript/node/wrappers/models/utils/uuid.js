"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UUID = void 0;
var uuid_pb_1 = require("../../../fintekkers/models/util/uuid_pb");
var uuid = require("uuid");
/**
 * Convert array of 16 byte values to UUID string format of the form:
 * XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX
 */
var byteToHex = [];
for (var i = 0; i < 256; ++i) {
    byteToHex.push((i + 0x100).toString(16).slice(1));
}
var UUID = /** @class */ (function () {
    function UUID(bytes) {
        this.bytes = bytes;
    }
    UUID.prototype.toString = function () {
        var arr = new Uint8Array(this.bytes);
        var offset = 0;
        var str = byteToHex[arr[offset + 0]] + byteToHex[arr[offset + 1]] + byteToHex[arr[offset + 2]] + byteToHex[arr[offset + 3]] + '-' + byteToHex[arr[offset + 4]] + byteToHex[arr[offset + 5]] + '-' + byteToHex[arr[offset + 6]] + byteToHex[arr[offset + 7]] + '-' + byteToHex[arr[offset + 8]] + byteToHex[arr[offset + 9]] + '-' + byteToHex[arr[offset + 10]] + byteToHex[arr[offset + 11]] + byteToHex[arr[offset + 12]] + byteToHex[arr[offset + 13]] + byteToHex[arr[offset + 14]] + byteToHex[arr[offset + 15]];
        return str; //uuid.stringify(byteArray);
    };
    UUID.prototype.toBytes = function () {
        return this.bytes;
    };
    UUID.prototype.toUUIDProto = function () {
        var id_proto = new uuid_pb_1.UUIDProto();
        id_proto.setRawUuid(new Uint8Array(this.toBytes()));
        return id_proto;
    };
    UUID.prototype.equals = function (other) {
        return this.toBytes() === other.toBytes();
    };
    UUID.random = function () {
        var random = uuid.v4();
        return new UUID(UUID.fromString(random));
    };
    UUID.fromU8Array = function (uint8Array) {
        var array = Array.from(uint8Array, function (byte) { return byte; });
        return new UUID(array);
    };
    UUID.fromString = function (uuidString) {
        // Remove hyphens and convert to a continuous hexadecimal string
        var hexString = uuidString.replace(/-/g, '');
        // Split the continuous hexadecimal string into two-character chunks
        var hexChunks = hexString.match(/.{1,2}/g);
        // Convert each two-character chunk to a byte (number)
        var bytes = hexChunks.map(function (chunk) { return parseInt(chunk, 16); });
        return bytes;
    };
    return UUID;
}());
exports.UUID = UUID;
//# sourceMappingURL=uuid.js.map