from datetime import date, timedelta
import datetime
import time
from fintekkers.models.security.bond.issuance_pb2 import IssuanceProto
from fintekkers.models.util.local_timestamp_pb2 import LocalTimestampProto
from fintekkers.wrappers.models.security.issuance import Issuance
from fintekkers.wrappers.models.util.serialization import ProtoSerializationUtil


from google.protobuf.timestamp_pb2 import Timestamp

import unittest

class Testing(unittest.TestCase):
    def test_issuance(self):
        timstamp_seconds = int(time.mktime(date.today().timetuple()))

        offsets = [1,-2,3]
        issuance_protos = []
        today = datetime.datetime.now()

        for offset in offsets:
            tmp_date:datetime = today - timedelta(days=offset)
            tmp_date = tmp_date.date()

            issuance_proto = IssuanceProto(
                as_of=LocalTimestampProto(
                    time_zone="America/New_York", timestamp=Timestamp(seconds=timstamp_seconds, nanos=0)
                ),
                version="0.0.1",
                auction_announcement_date=ProtoSerializationUtil.serialize(tmp_date),
                total_accepted=ProtoSerializationUtil.serialize(100000000.00),
                preauction_outstanding_quantity=ProtoSerializationUtil.serialize(900000000.00),
                mature_security_amount=ProtoSerializationUtil.serialize(1000000000.00),
            )
            issuance_protos.append(issuance_proto)

        issuance = Issuance(proto=issuance_protos)

        issuance.print_auction_history()

        issuance.sort_by_auction_announcement_date()
        issuance.print_auction_history()




if __name__ == "__main__":
    Testing().test_issuance()