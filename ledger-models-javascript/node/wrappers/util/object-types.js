"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.readVersion = exports.readType = exports.stamp = exports.SCHEMA_VERSION = void 0;
const version_pb_1 = require("../../fintekkers/models/util/version_pb");
/** The schema version `stamp` writes. Not the library release. */
exports.SCHEMA_VERSION = [0, 0, 1];
/**
 * Sets object_type and version (`SCHEMA_VERSION`) on `message`; returns it.
 * `objectType` is the message's own ObjectTypeProto value.
 */
function stamp(message, objectType) {
    const [major, minor, patch] = exports.SCHEMA_VERSION;
    message.setObjectType(objectType);
    message.setVersion(new version_pb_1.VersionProto().setMajor(major).setMinor(minor).setPatch(patch));
    return message;
}
exports.stamp = stamp;
/**
 * The message's ObjectTypeProto value; OBJECT_TYPE_UNKNOWN when unset. A value
 * added after this build is returned as its number.
 */
function readType(message) {
    return message.getObjectType();
}
exports.readType = readType;
/** The message's [major, minor, patch], or undefined when version is absent. */
function readVersion(message) {
    const version = message.getVersion();
    if (!message.hasVersion() || version === undefined)
        return undefined;
    return [version.getMajor(), version.getMinor(), version.getPatch()];
}
exports.readVersion = readVersion;
//# sourceMappingURL=object-types.js.map