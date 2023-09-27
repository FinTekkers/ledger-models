import * as jspb from 'google-protobuf'

import * as fintekkers_models_security_bond_auction_type_pb from '../../../../fintekkers/models/security/bond/auction_type_pb';
import * as fintekkers_models_util_decimal_value_pb from '../../../../fintekkers/models/util/decimal_value_pb';
import * as fintekkers_models_util_local_date_pb from '../../../../fintekkers/models/util/local_date_pb';
import * as fintekkers_models_util_local_timestamp_pb from '../../../../fintekkers/models/util/local_timestamp_pb';


export class IssuanceProto extends jspb.Message {
  getObjectClass(): string;
  setObjectClass(value: string): IssuanceProto;

  getVersion(): string;
  setVersion(value: string): IssuanceProto;

  getAsOf(): fintekkers_models_util_local_timestamp_pb.LocalTimestampProto | undefined;
  setAsOf(value?: fintekkers_models_util_local_timestamp_pb.LocalTimestampProto): IssuanceProto;
  hasAsOf(): boolean;
  clearAsOf(): IssuanceProto;

  getValidFrom(): fintekkers_models_util_local_timestamp_pb.LocalTimestampProto | undefined;
  setValidFrom(value?: fintekkers_models_util_local_timestamp_pb.LocalTimestampProto): IssuanceProto;
  hasValidFrom(): boolean;
  clearValidFrom(): IssuanceProto;

  getValidTo(): fintekkers_models_util_local_timestamp_pb.LocalTimestampProto | undefined;
  setValidTo(value?: fintekkers_models_util_local_timestamp_pb.LocalTimestampProto): IssuanceProto;
  hasValidTo(): boolean;
  clearValidTo(): IssuanceProto;

  getAuctionAnnouncementDate(): fintekkers_models_util_local_date_pb.LocalDateProto | undefined;
  setAuctionAnnouncementDate(value?: fintekkers_models_util_local_date_pb.LocalDateProto): IssuanceProto;
  hasAuctionAnnouncementDate(): boolean;
  clearAuctionAnnouncementDate(): IssuanceProto;

  getAuctionIssueDate(): fintekkers_models_util_local_date_pb.LocalDateProto | undefined;
  setAuctionIssueDate(value?: fintekkers_models_util_local_date_pb.LocalDateProto): IssuanceProto;
  hasAuctionIssueDate(): boolean;
  clearAuctionIssueDate(): IssuanceProto;

  getPreauctionOutstandingQuantity(): fintekkers_models_util_decimal_value_pb.DecimalValueProto | undefined;
  setPreauctionOutstandingQuantity(value?: fintekkers_models_util_decimal_value_pb.DecimalValueProto): IssuanceProto;
  hasPreauctionOutstandingQuantity(): boolean;
  clearPreauctionOutstandingQuantity(): IssuanceProto;

  getAuctionOfferingAmount(): fintekkers_models_util_decimal_value_pb.DecimalValueProto | undefined;
  setAuctionOfferingAmount(value?: fintekkers_models_util_decimal_value_pb.DecimalValueProto): IssuanceProto;
  hasAuctionOfferingAmount(): boolean;
  clearAuctionOfferingAmount(): IssuanceProto;

  getAuctionType(): fintekkers_models_security_bond_auction_type_pb.AuctionTypeProto;
  setAuctionType(value: fintekkers_models_security_bond_auction_type_pb.AuctionTypeProto): IssuanceProto;

  getPriceForSinglePriceAuction(): fintekkers_models_util_decimal_value_pb.DecimalValueProto | undefined;
  setPriceForSinglePriceAuction(value?: fintekkers_models_util_decimal_value_pb.DecimalValueProto): IssuanceProto;
  hasPriceForSinglePriceAuction(): boolean;
  clearPriceForSinglePriceAuction(): IssuanceProto;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): IssuanceProto.AsObject;
  static toObject(includeInstance: boolean, msg: IssuanceProto): IssuanceProto.AsObject;
  static serializeBinaryToWriter(message: IssuanceProto, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): IssuanceProto;
  static deserializeBinaryFromReader(message: IssuanceProto, reader: jspb.BinaryReader): IssuanceProto;
}

export namespace IssuanceProto {
  export type AsObject = {
    objectClass: string,
    version: string,
    asOf?: fintekkers_models_util_local_timestamp_pb.LocalTimestampProto.AsObject,
    validFrom?: fintekkers_models_util_local_timestamp_pb.LocalTimestampProto.AsObject,
    validTo?: fintekkers_models_util_local_timestamp_pb.LocalTimestampProto.AsObject,
    auctionAnnouncementDate?: fintekkers_models_util_local_date_pb.LocalDateProto.AsObject,
    auctionIssueDate?: fintekkers_models_util_local_date_pb.LocalDateProto.AsObject,
    preauctionOutstandingQuantity?: fintekkers_models_util_decimal_value_pb.DecimalValueProto.AsObject,
    auctionOfferingAmount?: fintekkers_models_util_decimal_value_pb.DecimalValueProto.AsObject,
    auctionType: fintekkers_models_security_bond_auction_type_pb.AuctionTypeProto,
    priceForSinglePriceAuction?: fintekkers_models_util_decimal_value_pb.DecimalValueProto.AsObject,
  }
}

