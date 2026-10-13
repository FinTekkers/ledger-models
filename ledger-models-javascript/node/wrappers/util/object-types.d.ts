/**
 * Object type and version (LM-297, LM-318).
 *
 * Every message that names its type carries `ObjectTypeProto object_type = 1`
 * and `VersionProto version = 2`. Writers call `stamp`, which sets the type and
 * `SCHEMA_VERSION`. Readers call `readType` / `readVersion`. The old
 * `object_class` / `version` strings were replaced in place by LM-318: bytes
 * written before it are not readable. See
 * docs/adr/compact_object_type_and_version.md.
 */
import { ObjectTypeProto } from '../../fintekkers/models/util/object_type_pb';
import { VersionProto } from '../../fintekkers/models/util/version_pb';
/** Any generated message that carries object_type and version. */
export interface ObjectTyped {
    getObjectType(): ObjectTypeProto;
    setObjectType(value: ObjectTypeProto): unknown;
    hasVersion(): boolean;
    getVersion(): VersionProto | undefined;
    setVersion(value?: VersionProto): unknown;
}
/** [major, minor, patch], each a uint32. */
export type Version = [number, number, number];
/** The schema version `stamp` writes. Not the library release. */
export declare const SCHEMA_VERSION: Version;
/**
 * Sets object_type and version (`SCHEMA_VERSION`) on `message`; returns it.
 * `objectType` is the message's own ObjectTypeProto value.
 */
export declare function stamp<T extends ObjectTyped>(message: T, objectType: ObjectTypeProto): T;
/**
 * The message's ObjectTypeProto value; OBJECT_TYPE_UNKNOWN when unset. A value
 * added after this build is returned as its number.
 */
export declare function readType(message: ObjectTyped): ObjectTypeProto;
/** The message's [major, minor, patch], or undefined when version is absent. */
export declare function readVersion(message: ObjectTyped): Version | undefined;
