package protos.serializers;

import com.google.protobuf.GeneratedMessageV3;
import common.models.IRawDataModelObject;

/**
 * The interface that defines proto serialization methods. JSON
 * serialize/deserialize were removed in FinTekkers/second-brain#338 — there
 * were no live callers across the platform (every reference was commented-out
 * dead code in ledger-service/subledger/api/*.java and broker BrokerAPI).
 */
public interface IRawDataModelObjectSerializer
        <ProtoClass extends GeneratedMessageV3,
                RawDataModelClass extends IRawDataModelObject> {
    ProtoClass serialize(RawDataModelClass dataModelObject);

    RawDataModelClass deserialize(ProtoClass proto);
}
