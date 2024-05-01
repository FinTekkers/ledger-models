"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UUID = void 0;
var uuid_pb_1 = require("../../../fintekkers/models/util/uuid_pb");
var uuid = require("uuid");
var UUID = /** @class */ (function () {
    function UUID(bytes) {
        this.bytes = bytes;
    }
    UUID.prototype.toString = function () {
        var byteArray = new Uint8Array(this.bytes);
        return uuid.unsafeStringify(byteArray); //Using unsafe as safe doesn't like some special values we use
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