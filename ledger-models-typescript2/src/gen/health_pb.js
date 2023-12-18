"use strict";
// Copyright 2015 The gRPC Authors
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
Object.defineProperty(exports, "__esModule", { value: true });
exports.HealthCheckResponse_ServingStatus = exports.HealthCheckResponse = exports.HealthCheckRequest = void 0;
const protobuf_1 = require("@bufbuild/protobuf");
/**
 * @generated from message grpc.health.v1.HealthCheckRequest
 */
class HealthCheckRequest extends protobuf_1.Message {
    constructor(data) {
        super();
        /**
         * @generated from field: string service = 1;
         */
        this.service = "";
        protobuf_1.proto3.util.initPartial(data, this);
    }
    static fromBinary(bytes, options) {
        return new HealthCheckRequest().fromBinary(bytes, options);
    }
    static fromJson(jsonValue, options) {
        return new HealthCheckRequest().fromJson(jsonValue, options);
    }
    static fromJsonString(jsonString, options) {
        return new HealthCheckRequest().fromJsonString(jsonString, options);
    }
    static equals(a, b) {
        return protobuf_1.proto3.util.equals(HealthCheckRequest, a, b);
    }
}
exports.HealthCheckRequest = HealthCheckRequest;
HealthCheckRequest.runtime = protobuf_1.proto3;
HealthCheckRequest.typeName = "grpc.health.v1.HealthCheckRequest";
HealthCheckRequest.fields = protobuf_1.proto3.util.newFieldList(() => [
    { no: 1, name: "service", kind: "scalar", T: 9 /* ScalarType.STRING */ },
]);
/**
 * @generated from message grpc.health.v1.HealthCheckResponse
 */
class HealthCheckResponse extends protobuf_1.Message {
    constructor(data) {
        super();
        /**
         * @generated from field: grpc.health.v1.HealthCheckResponse.ServingStatus status = 1;
         */
        this.status = HealthCheckResponse_ServingStatus.UNKNOWN;
        protobuf_1.proto3.util.initPartial(data, this);
    }
    static fromBinary(bytes, options) {
        return new HealthCheckResponse().fromBinary(bytes, options);
    }
    static fromJson(jsonValue, options) {
        return new HealthCheckResponse().fromJson(jsonValue, options);
    }
    static fromJsonString(jsonString, options) {
        return new HealthCheckResponse().fromJsonString(jsonString, options);
    }
    static equals(a, b) {
        return protobuf_1.proto3.util.equals(HealthCheckResponse, a, b);
    }
}
exports.HealthCheckResponse = HealthCheckResponse;
HealthCheckResponse.runtime = protobuf_1.proto3;
HealthCheckResponse.typeName = "grpc.health.v1.HealthCheckResponse";
HealthCheckResponse.fields = protobuf_1.proto3.util.newFieldList(() => [
    { no: 1, name: "status", kind: "enum", T: protobuf_1.proto3.getEnumType(HealthCheckResponse_ServingStatus) },
]);
/**
 * @generated from enum grpc.health.v1.HealthCheckResponse.ServingStatus
 */
var HealthCheckResponse_ServingStatus;
(function (HealthCheckResponse_ServingStatus) {
    /**
     * @generated from enum value: UNKNOWN = 0;
     */
    HealthCheckResponse_ServingStatus[HealthCheckResponse_ServingStatus["UNKNOWN"] = 0] = "UNKNOWN";
    /**
     * @generated from enum value: SERVING = 1;
     */
    HealthCheckResponse_ServingStatus[HealthCheckResponse_ServingStatus["SERVING"] = 1] = "SERVING";
    /**
     * @generated from enum value: NOT_SERVING = 2;
     */
    HealthCheckResponse_ServingStatus[HealthCheckResponse_ServingStatus["NOT_SERVING"] = 2] = "NOT_SERVING";
    /**
     * Used only by the Watch method.
     *
     * @generated from enum value: SERVICE_UNKNOWN = 3;
     */
    HealthCheckResponse_ServingStatus[HealthCheckResponse_ServingStatus["SERVICE_UNKNOWN"] = 3] = "SERVICE_UNKNOWN";
})(HealthCheckResponse_ServingStatus || (exports.HealthCheckResponse_ServingStatus = HealthCheckResponse_ServingStatus = {}));
// Retrieve enum metadata with: proto3.getEnumType(HealthCheckResponse_ServingStatus)
protobuf_1.proto3.util.setEnumType(HealthCheckResponse_ServingStatus, "grpc.health.v1.HealthCheckResponse.ServingStatus", [
    { no: 0, name: "UNKNOWN" },
    { no: 1, name: "SERVING" },
    { no: 2, name: "NOT_SERVING" },
    { no: 3, name: "SERVICE_UNKNOWN" },
]);
//# sourceMappingURL=health_pb.js.map