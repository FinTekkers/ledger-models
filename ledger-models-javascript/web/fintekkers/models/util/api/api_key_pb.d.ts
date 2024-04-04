import * as jspb from 'google-protobuf'



export class API_Key extends jspb.Message {
  getObjectClass(): string;
  setObjectClass(value: string): API_Key;

  getVersion(): string;
  setVersion(value: string): API_Key;

  getIdentity(): string;
  setIdentity(value: string): API_Key;

  getKey(): string;
  setKey(value: string): API_Key;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): API_Key.AsObject;
  static toObject(includeInstance: boolean, msg: API_Key): API_Key.AsObject;
  static serializeBinaryToWriter(message: API_Key, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): API_Key;
  static deserializeBinaryFromReader(message: API_Key, reader: jspb.BinaryReader): API_Key;
}

export namespace API_Key {
  export type AsObject = {
    objectClass: string,
    version: string,
    identity: string,
    key: string,
  }
}

