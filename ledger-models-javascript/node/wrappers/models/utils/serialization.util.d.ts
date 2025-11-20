import { Any } from 'google-protobuf/google/protobuf/any_pb';
import { ZonedDateTime } from './datetime';
import { UUID } from './uuid';
import { Identifier } from '../security/identifier';
declare function pack(value: Date | ZonedDateTime | UUID | Identifier | string | number): Any;
declare function unpack(value: Any): Date | ZonedDateTime | UUID | Identifier | string | number;
export { pack, unpack };
