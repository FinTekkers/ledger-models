// Generated by the protocol buffer compiler.  DO NOT EDIT!
// source: services/transaction-service/transaction_service.proto

package common.service;

public final class TransactionService {
  private TransactionService() {}
  public static void registerAllExtensions(
      com.google.protobuf.ExtensionRegistryLite registry) {
  }

  public static void registerAllExtensions(
      com.google.protobuf.ExtensionRegistry registry) {
    registerAllExtensions(
        (com.google.protobuf.ExtensionRegistryLite) registry);
  }
  /**
   * Protobuf service {@code security_service.Transaction}
   */
  public static abstract class Transaction
      implements com.google.protobuf.Service {
    protected Transaction() {}

    public interface Interface {
      /**
       * <code>rpc CreateOrUpdate(.transaction.CreateTransactionRequestProto) returns (.transaction.CreateTransactionResponseProto);</code>
       */
      public abstract void createOrUpdate(
          com.google.protobuf.RpcController controller,
          common.request.CreateTransactionRequestProto request,
          com.google.protobuf.RpcCallback<common.request.CreateTransactionResponseProto> done);

      /**
       * <code>rpc GetByIDs(.transaction.QueryTransactionRequestProto) returns (.transaction.QueryTransactionResponseProto);</code>
       */
      public abstract void getByIDs(
          com.google.protobuf.RpcController controller,
          common.request.QueryTransactionRequestProto request,
          com.google.protobuf.RpcCallback<common.request.QueryTransactionResponseProto> done);

      /**
       * <code>rpc Search(.transaction.QueryTransactionRequestProto) returns (.transaction.QueryTransactionResponseProto);</code>
       */
      public abstract void search(
          com.google.protobuf.RpcController controller,
          common.request.QueryTransactionRequestProto request,
          com.google.protobuf.RpcCallback<common.request.QueryTransactionResponseProto> done);

      /**
       * <code>rpc ListIDs(.transaction.QueryTransactionRequestProto) returns (.transaction.QueryTransactionResponseProto);</code>
       */
      public abstract void listIDs(
          com.google.protobuf.RpcController controller,
          common.request.QueryTransactionRequestProto request,
          com.google.protobuf.RpcCallback<common.request.QueryTransactionResponseProto> done);

      /**
       * <code>rpc ValidateCreateOrUpdate(.transaction.CreateTransactionRequestProto) returns (.util.errors.SummaryProto);</code>
       */
      public abstract void validateCreateOrUpdate(
          com.google.protobuf.RpcController controller,
          common.request.CreateTransactionRequestProto request,
          com.google.protobuf.RpcCallback<util.errors.Summary.SummaryProto> done);

      /**
       * <code>rpc ValidateQueryRequest(.transaction.QueryTransactionRequestProto) returns (.util.errors.SummaryProto);</code>
       */
      public abstract void validateQueryRequest(
          com.google.protobuf.RpcController controller,
          common.request.QueryTransactionRequestProto request,
          com.google.protobuf.RpcCallback<util.errors.Summary.SummaryProto> done);

    }

    public static com.google.protobuf.Service newReflectiveService(
        final Interface impl) {
      return new Transaction() {
        @java.lang.Override
        public  void createOrUpdate(
            com.google.protobuf.RpcController controller,
            common.request.CreateTransactionRequestProto request,
            com.google.protobuf.RpcCallback<common.request.CreateTransactionResponseProto> done) {
          impl.createOrUpdate(controller, request, done);
        }

        @java.lang.Override
        public  void getByIDs(
            com.google.protobuf.RpcController controller,
            common.request.QueryTransactionRequestProto request,
            com.google.protobuf.RpcCallback<common.request.QueryTransactionResponseProto> done) {
          impl.getByIDs(controller, request, done);
        }

        @java.lang.Override
        public  void search(
            com.google.protobuf.RpcController controller,
            common.request.QueryTransactionRequestProto request,
            com.google.protobuf.RpcCallback<common.request.QueryTransactionResponseProto> done) {
          impl.search(controller, request, done);
        }

        @java.lang.Override
        public  void listIDs(
            com.google.protobuf.RpcController controller,
            common.request.QueryTransactionRequestProto request,
            com.google.protobuf.RpcCallback<common.request.QueryTransactionResponseProto> done) {
          impl.listIDs(controller, request, done);
        }

        @java.lang.Override
        public  void validateCreateOrUpdate(
            com.google.protobuf.RpcController controller,
            common.request.CreateTransactionRequestProto request,
            com.google.protobuf.RpcCallback<util.errors.Summary.SummaryProto> done) {
          impl.validateCreateOrUpdate(controller, request, done);
        }

        @java.lang.Override
        public  void validateQueryRequest(
            com.google.protobuf.RpcController controller,
            common.request.QueryTransactionRequestProto request,
            com.google.protobuf.RpcCallback<util.errors.Summary.SummaryProto> done) {
          impl.validateQueryRequest(controller, request, done);
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
              return impl.createOrUpdate(controller, (common.request.CreateTransactionRequestProto)request);
            case 1:
              return impl.getByIDs(controller, (common.request.QueryTransactionRequestProto)request);
            case 2:
              return impl.search(controller, (common.request.QueryTransactionRequestProto)request);
            case 3:
              return impl.listIDs(controller, (common.request.QueryTransactionRequestProto)request);
            case 4:
              return impl.validateCreateOrUpdate(controller, (common.request.CreateTransactionRequestProto)request);
            case 5:
              return impl.validateQueryRequest(controller, (common.request.QueryTransactionRequestProto)request);
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
              return common.request.CreateTransactionRequestProto.getDefaultInstance();
            case 1:
              return common.request.QueryTransactionRequestProto.getDefaultInstance();
            case 2:
              return common.request.QueryTransactionRequestProto.getDefaultInstance();
            case 3:
              return common.request.QueryTransactionRequestProto.getDefaultInstance();
            case 4:
              return common.request.CreateTransactionRequestProto.getDefaultInstance();
            case 5:
              return common.request.QueryTransactionRequestProto.getDefaultInstance();
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
              return common.request.CreateTransactionResponseProto.getDefaultInstance();
            case 1:
              return common.request.QueryTransactionResponseProto.getDefaultInstance();
            case 2:
              return common.request.QueryTransactionResponseProto.getDefaultInstance();
            case 3:
              return common.request.QueryTransactionResponseProto.getDefaultInstance();
            case 4:
              return util.errors.Summary.SummaryProto.getDefaultInstance();
            case 5:
              return util.errors.Summary.SummaryProto.getDefaultInstance();
            default:
              throw new java.lang.AssertionError("Can't get here.");
          }
        }

      };
    }

    /**
     * <code>rpc CreateOrUpdate(.transaction.CreateTransactionRequestProto) returns (.transaction.CreateTransactionResponseProto);</code>
     */
    public abstract void createOrUpdate(
        com.google.protobuf.RpcController controller,
        common.request.CreateTransactionRequestProto request,
        com.google.protobuf.RpcCallback<common.request.CreateTransactionResponseProto> done);

    /**
     * <code>rpc GetByIDs(.transaction.QueryTransactionRequestProto) returns (.transaction.QueryTransactionResponseProto);</code>
     */
    public abstract void getByIDs(
        com.google.protobuf.RpcController controller,
        common.request.QueryTransactionRequestProto request,
        com.google.protobuf.RpcCallback<common.request.QueryTransactionResponseProto> done);

    /**
     * <code>rpc Search(.transaction.QueryTransactionRequestProto) returns (.transaction.QueryTransactionResponseProto);</code>
     */
    public abstract void search(
        com.google.protobuf.RpcController controller,
        common.request.QueryTransactionRequestProto request,
        com.google.protobuf.RpcCallback<common.request.QueryTransactionResponseProto> done);

    /**
     * <code>rpc ListIDs(.transaction.QueryTransactionRequestProto) returns (.transaction.QueryTransactionResponseProto);</code>
     */
    public abstract void listIDs(
        com.google.protobuf.RpcController controller,
        common.request.QueryTransactionRequestProto request,
        com.google.protobuf.RpcCallback<common.request.QueryTransactionResponseProto> done);

    /**
     * <code>rpc ValidateCreateOrUpdate(.transaction.CreateTransactionRequestProto) returns (.util.errors.SummaryProto);</code>
     */
    public abstract void validateCreateOrUpdate(
        com.google.protobuf.RpcController controller,
        common.request.CreateTransactionRequestProto request,
        com.google.protobuf.RpcCallback<util.errors.Summary.SummaryProto> done);

    /**
     * <code>rpc ValidateQueryRequest(.transaction.QueryTransactionRequestProto) returns (.util.errors.SummaryProto);</code>
     */
    public abstract void validateQueryRequest(
        com.google.protobuf.RpcController controller,
        common.request.QueryTransactionRequestProto request,
        com.google.protobuf.RpcCallback<util.errors.Summary.SummaryProto> done);

    public static final
        com.google.protobuf.Descriptors.ServiceDescriptor
        getDescriptor() {
      return common.service.TransactionService.getDescriptor().getServices().get(0);
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
          this.createOrUpdate(controller, (common.request.CreateTransactionRequestProto)request,
            com.google.protobuf.RpcUtil.<common.request.CreateTransactionResponseProto>specializeCallback(
              done));
          return;
        case 1:
          this.getByIDs(controller, (common.request.QueryTransactionRequestProto)request,
            com.google.protobuf.RpcUtil.<common.request.QueryTransactionResponseProto>specializeCallback(
              done));
          return;
        case 2:
          this.search(controller, (common.request.QueryTransactionRequestProto)request,
            com.google.protobuf.RpcUtil.<common.request.QueryTransactionResponseProto>specializeCallback(
              done));
          return;
        case 3:
          this.listIDs(controller, (common.request.QueryTransactionRequestProto)request,
            com.google.protobuf.RpcUtil.<common.request.QueryTransactionResponseProto>specializeCallback(
              done));
          return;
        case 4:
          this.validateCreateOrUpdate(controller, (common.request.CreateTransactionRequestProto)request,
            com.google.protobuf.RpcUtil.<util.errors.Summary.SummaryProto>specializeCallback(
              done));
          return;
        case 5:
          this.validateQueryRequest(controller, (common.request.QueryTransactionRequestProto)request,
            com.google.protobuf.RpcUtil.<util.errors.Summary.SummaryProto>specializeCallback(
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
          return common.request.CreateTransactionRequestProto.getDefaultInstance();
        case 1:
          return common.request.QueryTransactionRequestProto.getDefaultInstance();
        case 2:
          return common.request.QueryTransactionRequestProto.getDefaultInstance();
        case 3:
          return common.request.QueryTransactionRequestProto.getDefaultInstance();
        case 4:
          return common.request.CreateTransactionRequestProto.getDefaultInstance();
        case 5:
          return common.request.QueryTransactionRequestProto.getDefaultInstance();
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
          return common.request.CreateTransactionResponseProto.getDefaultInstance();
        case 1:
          return common.request.QueryTransactionResponseProto.getDefaultInstance();
        case 2:
          return common.request.QueryTransactionResponseProto.getDefaultInstance();
        case 3:
          return common.request.QueryTransactionResponseProto.getDefaultInstance();
        case 4:
          return util.errors.Summary.SummaryProto.getDefaultInstance();
        case 5:
          return util.errors.Summary.SummaryProto.getDefaultInstance();
        default:
          throw new java.lang.AssertionError("Can't get here.");
      }
    }

    public static Stub newStub(
        com.google.protobuf.RpcChannel channel) {
      return new Stub(channel);
    }

    public static final class Stub extends common.service.TransactionService.Transaction implements Interface {
      private Stub(com.google.protobuf.RpcChannel channel) {
        this.channel = channel;
      }

      private final com.google.protobuf.RpcChannel channel;

      public com.google.protobuf.RpcChannel getChannel() {
        return channel;
      }

      public  void createOrUpdate(
          com.google.protobuf.RpcController controller,
          common.request.CreateTransactionRequestProto request,
          com.google.protobuf.RpcCallback<common.request.CreateTransactionResponseProto> done) {
        channel.callMethod(
          getDescriptor().getMethods().get(0),
          controller,
          request,
          common.request.CreateTransactionResponseProto.getDefaultInstance(),
          com.google.protobuf.RpcUtil.generalizeCallback(
            done,
            common.request.CreateTransactionResponseProto.class,
            common.request.CreateTransactionResponseProto.getDefaultInstance()));
      }

      public  void getByIDs(
          com.google.protobuf.RpcController controller,
          common.request.QueryTransactionRequestProto request,
          com.google.protobuf.RpcCallback<common.request.QueryTransactionResponseProto> done) {
        channel.callMethod(
          getDescriptor().getMethods().get(1),
          controller,
          request,
          common.request.QueryTransactionResponseProto.getDefaultInstance(),
          com.google.protobuf.RpcUtil.generalizeCallback(
            done,
            common.request.QueryTransactionResponseProto.class,
            common.request.QueryTransactionResponseProto.getDefaultInstance()));
      }

      public  void search(
          com.google.protobuf.RpcController controller,
          common.request.QueryTransactionRequestProto request,
          com.google.protobuf.RpcCallback<common.request.QueryTransactionResponseProto> done) {
        channel.callMethod(
          getDescriptor().getMethods().get(2),
          controller,
          request,
          common.request.QueryTransactionResponseProto.getDefaultInstance(),
          com.google.protobuf.RpcUtil.generalizeCallback(
            done,
            common.request.QueryTransactionResponseProto.class,
            common.request.QueryTransactionResponseProto.getDefaultInstance()));
      }

      public  void listIDs(
          com.google.protobuf.RpcController controller,
          common.request.QueryTransactionRequestProto request,
          com.google.protobuf.RpcCallback<common.request.QueryTransactionResponseProto> done) {
        channel.callMethod(
          getDescriptor().getMethods().get(3),
          controller,
          request,
          common.request.QueryTransactionResponseProto.getDefaultInstance(),
          com.google.protobuf.RpcUtil.generalizeCallback(
            done,
            common.request.QueryTransactionResponseProto.class,
            common.request.QueryTransactionResponseProto.getDefaultInstance()));
      }

      public  void validateCreateOrUpdate(
          com.google.protobuf.RpcController controller,
          common.request.CreateTransactionRequestProto request,
          com.google.protobuf.RpcCallback<util.errors.Summary.SummaryProto> done) {
        channel.callMethod(
          getDescriptor().getMethods().get(4),
          controller,
          request,
          util.errors.Summary.SummaryProto.getDefaultInstance(),
          com.google.protobuf.RpcUtil.generalizeCallback(
            done,
            util.errors.Summary.SummaryProto.class,
            util.errors.Summary.SummaryProto.getDefaultInstance()));
      }

      public  void validateQueryRequest(
          com.google.protobuf.RpcController controller,
          common.request.QueryTransactionRequestProto request,
          com.google.protobuf.RpcCallback<util.errors.Summary.SummaryProto> done) {
        channel.callMethod(
          getDescriptor().getMethods().get(5),
          controller,
          request,
          util.errors.Summary.SummaryProto.getDefaultInstance(),
          com.google.protobuf.RpcUtil.generalizeCallback(
            done,
            util.errors.Summary.SummaryProto.class,
            util.errors.Summary.SummaryProto.getDefaultInstance()));
      }
    }

    public static BlockingInterface newBlockingStub(
        com.google.protobuf.BlockingRpcChannel channel) {
      return new BlockingStub(channel);
    }

    public interface BlockingInterface {
      public common.request.CreateTransactionResponseProto createOrUpdate(
          com.google.protobuf.RpcController controller,
          common.request.CreateTransactionRequestProto request)
          throws com.google.protobuf.ServiceException;

      public common.request.QueryTransactionResponseProto getByIDs(
          com.google.protobuf.RpcController controller,
          common.request.QueryTransactionRequestProto request)
          throws com.google.protobuf.ServiceException;

      public common.request.QueryTransactionResponseProto search(
          com.google.protobuf.RpcController controller,
          common.request.QueryTransactionRequestProto request)
          throws com.google.protobuf.ServiceException;

      public common.request.QueryTransactionResponseProto listIDs(
          com.google.protobuf.RpcController controller,
          common.request.QueryTransactionRequestProto request)
          throws com.google.protobuf.ServiceException;

      public util.errors.Summary.SummaryProto validateCreateOrUpdate(
          com.google.protobuf.RpcController controller,
          common.request.CreateTransactionRequestProto request)
          throws com.google.protobuf.ServiceException;

      public util.errors.Summary.SummaryProto validateQueryRequest(
          com.google.protobuf.RpcController controller,
          common.request.QueryTransactionRequestProto request)
          throws com.google.protobuf.ServiceException;
    }

    private static final class BlockingStub implements BlockingInterface {
      private BlockingStub(com.google.protobuf.BlockingRpcChannel channel) {
        this.channel = channel;
      }

      private final com.google.protobuf.BlockingRpcChannel channel;

      public common.request.CreateTransactionResponseProto createOrUpdate(
          com.google.protobuf.RpcController controller,
          common.request.CreateTransactionRequestProto request)
          throws com.google.protobuf.ServiceException {
        return (common.request.CreateTransactionResponseProto) channel.callBlockingMethod(
          getDescriptor().getMethods().get(0),
          controller,
          request,
          common.request.CreateTransactionResponseProto.getDefaultInstance());
      }


      public common.request.QueryTransactionResponseProto getByIDs(
          com.google.protobuf.RpcController controller,
          common.request.QueryTransactionRequestProto request)
          throws com.google.protobuf.ServiceException {
        return (common.request.QueryTransactionResponseProto) channel.callBlockingMethod(
          getDescriptor().getMethods().get(1),
          controller,
          request,
          common.request.QueryTransactionResponseProto.getDefaultInstance());
      }


      public common.request.QueryTransactionResponseProto search(
          com.google.protobuf.RpcController controller,
          common.request.QueryTransactionRequestProto request)
          throws com.google.protobuf.ServiceException {
        return (common.request.QueryTransactionResponseProto) channel.callBlockingMethod(
          getDescriptor().getMethods().get(2),
          controller,
          request,
          common.request.QueryTransactionResponseProto.getDefaultInstance());
      }


      public common.request.QueryTransactionResponseProto listIDs(
          com.google.protobuf.RpcController controller,
          common.request.QueryTransactionRequestProto request)
          throws com.google.protobuf.ServiceException {
        return (common.request.QueryTransactionResponseProto) channel.callBlockingMethod(
          getDescriptor().getMethods().get(3),
          controller,
          request,
          common.request.QueryTransactionResponseProto.getDefaultInstance());
      }


      public util.errors.Summary.SummaryProto validateCreateOrUpdate(
          com.google.protobuf.RpcController controller,
          common.request.CreateTransactionRequestProto request)
          throws com.google.protobuf.ServiceException {
        return (util.errors.Summary.SummaryProto) channel.callBlockingMethod(
          getDescriptor().getMethods().get(4),
          controller,
          request,
          util.errors.Summary.SummaryProto.getDefaultInstance());
      }


      public util.errors.Summary.SummaryProto validateQueryRequest(
          com.google.protobuf.RpcController controller,
          common.request.QueryTransactionRequestProto request)
          throws com.google.protobuf.ServiceException {
        return (util.errors.Summary.SummaryProto) channel.callBlockingMethod(
          getDescriptor().getMethods().get(5),
          controller,
          request,
          util.errors.Summary.SummaryProto.getDefaultInstance());
      }

    }

    // @@protoc_insertion_point(class_scope:security_service.Transaction)
  }


  public static com.google.protobuf.Descriptors.FileDescriptor
      getDescriptor() {
    return descriptor;
  }
  private static  com.google.protobuf.Descriptors.FileDescriptor
      descriptor;
  static {
    java.lang.String[] descriptorData = {
      "\n6services/transaction-service/transacti" +
      "on_service.proto\022\020security_service\0325requ" +
      "ests/transaction/create_transaction_requ" +
      "est.proto\0326requests/transaction/create_t" +
      "ransaction_response.proto\0324requests/tran" +
      "saction/query_transaction_request.proto\032" +
      "5requests/transaction/query_transaction_" +
      "response.proto\032\"requests/util/errors/sum" +
      "mary.proto2\335\004\n\013Transaction\022i\n\016CreateOrUp" +
      "date\022*.transaction.CreateTransactionRequ" +
      "estProto\032+.transaction.CreateTransaction" +
      "ResponseProto\022a\n\010GetByIDs\022).transaction." +
      "QueryTransactionRequestProto\032*.transacti" +
      "on.QueryTransactionResponseProto\022_\n\006Sear" +
      "ch\022).transaction.QueryTransactionRequest" +
      "Proto\032*.transaction.QueryTransactionResp" +
      "onseProto\022`\n\007ListIDs\022).transaction.Query" +
      "TransactionRequestProto\032*.transaction.Qu" +
      "eryTransactionResponseProto\022_\n\026ValidateC" +
      "reateOrUpdate\022*.transaction.CreateTransa" +
      "ctionRequestProto\032\031.util.errors.SummaryP" +
      "roto\022\\\n\024ValidateQueryRequest\022).transacti" +
      "on.QueryTransactionRequestProto\032\031.util.e" +
      "rrors.SummaryProtoB\023\n\016common.service\210\001\001b" +
      "\006proto3"
    };
    descriptor = com.google.protobuf.Descriptors.FileDescriptor
      .internalBuildGeneratedFileFrom(descriptorData,
        new com.google.protobuf.Descriptors.FileDescriptor[] {
          common.request.CreateTransactionRequestProtos.getDescriptor(),
          common.request.CreateTransactionResponseProtos.getDescriptor(),
          common.request.QueryTransactionRequestProtos.getDescriptor(),
          common.request.QueryTransactionResponseProtos.getDescriptor(),
          util.errors.Summary.getDescriptor(),
        });
    common.request.CreateTransactionRequestProtos.getDescriptor();
    common.request.CreateTransactionResponseProtos.getDescriptor();
    common.request.QueryTransactionRequestProtos.getDescriptor();
    common.request.QueryTransactionResponseProtos.getDescriptor();
    util.errors.Summary.getDescriptor();
  }

  // @@protoc_insertion_point(outer_class_scope)
}
