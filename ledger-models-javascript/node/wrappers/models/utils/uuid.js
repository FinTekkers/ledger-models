"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UUID = void 0;
var console_1 = require("console");
var uuid_pb_1 = require("../../../fintekkers/models/util/uuid_pb");
var uuid = require("uuid");
var UUID = /** @class */ (function () {
    function UUID(bytes) {
        this.bytes = bytes;
    }
    UUID.prototype.toString = function () {
        var byteArray = new Uint8Array(this.bytes);
        return uuid.stringify(byteArray);
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
var test_uuid_bytes = [217, 98, 253, 240, 51, 225, 77, 157, 153, 155, 126, 195, 80, 240, 203, 119];
var test_uuid = new UUID(test_uuid_bytes);
(0, console_1.assert)(test_uuid.toString() == 'd962fdf0-33e1-4d9d-999b-7ec350f0cb77');
var test_uuid_bytes_copy = UUID.fromString(test_uuid.toString());
(0, console_1.assert)(test_uuid_bytes.length === test_uuid_bytes_copy.length &&
    test_uuid_bytes.every(function (value, index) { return value === test_uuid_bytes_copy[index]; }));
(0, console_1.assert)(UUID.random().toString().length == 36);
//# sourceMappingURL=uuid.js.map