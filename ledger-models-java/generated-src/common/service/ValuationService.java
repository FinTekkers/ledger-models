// Generated by the protocol buffer compiler.  DO NOT EDIT!
// source: services/valuation-service/valuation_service.proto

package common.service;

public final class ValuationService {
  private ValuationService() {}
  public static void registerAllExtensions(
      com.google.protobuf.ExtensionRegistryLite registry) {
  }

  public static void registerAllExtensions(
      com.google.protobuf.ExtensionRegistry registry) {
    registerAllExtensions(
        (com.google.protobuf.ExtensionRegistryLite) registry);
  }
  /**
   * Protobuf service {@code valuation_service.Valuation}
   */
  public static abstract class Valuation
      implements com.google.protobuf.Service {
    protected Valuation() {}

    public interface Interface {
      /**
       * <code>rpc RunValuation(.valuation.ValuationRequestProto) returns (.valuation.ValuationResponseProto);</code>
       */
      public abstract void runValuation(
          com.google.protobuf.RpcController controller,
          common.request.ValuationRequestProto request,
          com.google.protobuf.RpcCallback<common.request.ValuationResponseProto> done);

    }

    public static com.google.protobuf.Service newReflectiveService(
        final Interface impl) {
      return new Valuation() {
        @java.lang.Override
        public  void runValuation(
            com.google.protobuf.RpcController controller,
            common.request.ValuationRequestProto request,
            com.google.protobuf.RpcCallback<common.request.ValuationResponseProto> done) {
          impl.runValuation(controller, request, done);
        }

      };
    }

    public static com.google.protobuf.BlockingService
        newReflectiveBlockingService(final BlockingInterface impl) {
      return new com.google.protobuf.BlockingService() {
        public final com.google.protobuf.Descriptors.ServiceDescriptor
            getDescriptorForType() {
          return getDescriptor();
        }

        public final com.google.protobuf.Message callBlockingMethod(
            com.google.protobuf.Descriptors.MethodDescriptor method,
            com.google.protobuf.RpcController controller,
            com.google.protobuf.Message request)
            throws com.google.protobuf.ServiceException {
          if (method.getService() != getDescriptor()) {
            throw new java.lang.IllegalArgumentException(
              "Service.callBlockingMethod() given method descriptor for " +
              "wrong service type.");
          }
          switch(method.getIndex()) {
            case 0:
              return impl.runValuation(controller, (common.request.ValuationRequestProto)request);
            default:
              throw new java.lang.AssertionError("Can't get here.");
          }
        }

        public final com.google.protobuf.Message
            getRequestPrototype(
            com.google.protobuf.Descriptors.MethodDescriptor method) {
          if (method.getService() != getDescriptor()) {
            throw new java.lang.IllegalArgumentException(
              "Service.getRequestPrototype() given method " +
              "descriptor for wrong service type.");
          }
          switch(method.getIndex()) {
            case 0:
              return common.request.ValuationRequestProto.getDefaultInstance();
            default:
              throw new java.lang.AssertionError("Can't get here.");
          }
        }

        public final com.google.protobuf.Message
            getResponsePrototype(
            com.google.protobuf.Descriptors.MethodDescriptor method) {
          if (method.getService() != getDescriptor()) {
            throw new java.lang.IllegalArgumentException(
              "Service.getResponsePrototype() given method " +
              "descriptor for wrong service type.");
          }
          switch(method.getIndex()) {
            case 0:
              return common.request.ValuationResponseProto.getDefaultInstance();
            default:
              throw new java.lang.AssertionError("Can't get here.");
          }
        }

      };
    }

    /**
     * <code>rpc RunValuation(.valuation.ValuationRequestProto) returns (.valuation.ValuationResponseProto);</code>
     */
    public abstract void runValuation(
        com.google.protobuf.RpcController controller,
        common.request.ValuationRequestProto request,
        com.google.protobuf.RpcCallback<common.request.ValuationResponseProto> done);

    public static final
        com.google.protobuf.Descriptors.ServiceDescriptor
        getDescriptor() {
      return common.service.ValuationService.getDescriptor().getServices().get(0);
    }
    public final com.google.protobuf.Descriptors.ServiceDescriptor
        getDescriptorForType() {
      return getDescriptor();
    }

    public final void callMethod(
        com.google.protobuf.Descriptors.MethodDescriptor method,
        com.google.protobuf.RpcController controller,
        com.google.protobuf.Message request,
        com.google.protobuf.RpcCallback<
          com.google.protobuf.Message> done) {
      if (method.getService() != getDescriptor()) {
        throw new java.lang.IllegalArgumentException(
          "Service.callMethod() given method descriptor for wrong " +
          "service type.");
      }
      switch(method.getIndex()) {
        case 0:
          this.runValuation(controller, (common.request.ValuationRequestProto)request,
            com.google.protobuf.RpcUtil.<common.request.ValuationResponseProto>specializeCallback(
              done));
          return;
        default:
          throw new java.lang.AssertionError("Can't get here.");
      }
    }

    public final com.google.protobuf.Message
        getRequestPrototype(
        com.google.protobuf.Descriptors.MethodDescriptor method) {
      if (method.getService() != getDescriptor()) {
        throw new java.lang.IllegalArgumentException(
          "Service.getRequestPrototype() given method " +
          "descriptor for wrong service type.");
      }
      switch(method.getIndex()) {
        case 0:
          return common.request.ValuationRequestProto.getDefaultInstance();
        default:
          throw new java.lang.AssertionError("Can't get here.");
      }
    }

    public final com.google.protobuf.Message
        getResponsePrototype(
        com.google.protobuf.Descriptors.MethodDescriptor method) {
      if (method.getService() != getDescriptor()) {
        throw new java.lang.IllegalArgumentException(
          "Service.getResponsePrototype() given method " +
          "descriptor for wrong service type.");
      }
      switch(method.getIndex()) {
        case 0:
          return common.request.ValuationResponseProto.getDefaultInstance();
        default:
          throw new java.lang.AssertionError("Can't get here.");
      }
    }

    public static Stub newStub(
        com.google.protobuf.RpcChannel channel) {
      return new Stub(channel);
    }

    public static final class Stub extends common.service.ValuationService.Valuation implements Interface {
      private Stub(com.google.protobuf.RpcChannel channel) {
        this.channel = channel;
      }

      private final com.google.protobuf.RpcChannel channel;

      public com.google.protobuf.RpcChannel getChannel() {
        return channel;
      }

      public  void runValuation(
          com.google.protobuf.RpcController controller,
          common.request.ValuationRequestProto request,
          com.google.protobuf.RpcCallback<common.request.ValuationResponseProto> done) {
        channel.callMethod(
          getDescriptor().getMethods().get(0),
          controller,
          request,
          common.request.ValuationResponseProto.getDefaultInstance(),
          com.google.protobuf.RpcUtil.generalizeCallback(
            done,
            common.request.ValuationResponseProto.class,
            common.request.ValuationResponseProto.getDefaultInstance()));
      }
    }

    public static BlockingInterface newBlockingStub(
        com.google.protobuf.BlockingRpcChannel channel) {
      return new BlockingStub(channel);
    }

    public interface BlockingInterface {
      public common.request.ValuationResponseProto runValuation(
          com.google.protobuf.RpcController controller,
          common.request.ValuationRequestProto request)
          throws com.google.protobuf.ServiceException;
    }

    private static final class BlockingStub implements BlockingInterface {
      private BlockingStub(com.google.protobuf.BlockingRpcChannel channel) {
        this.channel = channel;
      }

      private final com.google.protobuf.BlockingRpcChannel channel;

      public common.request.ValuationResponseProto runValuation(
          com.google.protobuf.RpcController controller,
          common.request.ValuationRequestProto request)
          throws com.google.protobuf.ServiceException {
        return (common.request.ValuationResponseProto) channel.callBlockingMethod(
          getDescriptor().getMethods().get(0),
          controller,
          request,
          common.request.ValuationResponseProto.getDefaultInstance());
      }

    }

    // @@protoc_insertion_point(class_scope:valuation_service.Valuation)
  }


  public static com.google.protobuf.Descriptors.FileDescriptor
      getDescriptor() {
    return descriptor;
  }
  private static  com.google.protobuf.Descriptors.FileDescriptor
      descriptor;
  static {
    java.lang.String[] descriptorData = {
      "\n2services/valuation-service/valuation_s" +
      "ervice.proto\022\021valuation_service\032*request" +
      "s/valuation/valuation_request.proto\032+req" +
      "uests/valuation/valuation_response.proto" +
      "2`\n\tValuation\022S\n\014RunValuation\022 .valuatio" +
      "n.ValuationRequestProto\032!.valuation.Valu" +
      "ationResponseProtoB\023\n\016common.service\210\001\001b" +
      "\006proto3"
    };
    descriptor = com.google.protobuf.Descriptors.FileDescriptor
      .internalBuildGeneratedFileFrom(descriptorData,
        new com.google.protobuf.Descriptors.FileDescriptor[] {
          common.request.ValuationRequestProtos.getDescriptor(),
          common.request.ValuationResponseProtos.getDescriptor(),
        });
    common.request.ValuationRequestProtos.getDescriptor();
    common.request.ValuationResponseProtos.getDescriptor();
  }

  // @@protoc_insertion_point(outer_class_scope)
}
