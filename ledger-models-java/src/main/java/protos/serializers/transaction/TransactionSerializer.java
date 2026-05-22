package protos.serializers.transaction;

import common.models.security.Security;
import common.models.transaction.Transaction;
import common.models.transaction.TransactionType;
import fintekkers.models.position.PositionStatusProto;
import fintekkers.models.transaction.TransactionProto;
import fintekkers.models.transaction.TransactionTypeProto;
import protos.serializers.IRawDataModelObjectSerializer;
import protos.serializers.portfolio.PortfolioSerializer;
import protos.serializers.price.PriceSerializer;
import protos.serializers.strategy.StrategySerializer;
import protos.serializers.util.proto.ProtoSerializationUtil;

public class TransactionSerializer implements IRawDataModelObjectSerializer<TransactionProto, Transaction> {
    private static final class InstanceHolder {
        private static final TransactionSerializer INSTANCE = new TransactionSerializer();
    }

    public static TransactionSerializer getInstance() {
        return TransactionSerializer.InstanceHolder.INSTANCE;
    }

    private TransactionSerializer() {
    }

    @Override
    public TransactionProto serialize(Transaction transaction) {
        TransactionProto.Builder builder = TransactionProto.newBuilder()
                //binary metadata
                .setObjectClass(Transaction.class.getSimpleName())
                .setVersion("0.0.1")
                //primary key
                .setUuid(ProtoSerializationUtil.serializeUUID(transaction.getID()))
                .setAsOf(ProtoSerializationUtil.serializeTimestamp(transaction.getAsOf()))
                //transaction details
                .setPortfolio(PortfolioSerializer.getInstance().serialize(transaction.getPortfolio()))
                .setSecurity(transaction.getSecurity().getProto())
                .setTransactionType(TransactionTypeProto.valueOf(transaction.getTransactionType().name()))
                .setQuantity(ProtoSerializationUtil.serializeBigDecimal(transaction.getQuantity()))
                .setPrice(PriceSerializer.getInstance().serialize(transaction.getPrice()))
                .setTradeDate(ProtoSerializationUtil.serializeLocalDate(transaction.getTradeDate()))
                .setSettlementDate(ProtoSerializationUtil.serializeLocalDate(transaction.getSettlementDate()));

        for(Transaction childTransaction: transaction.getChildTransactions())
            builder.addChildTransactions(this.serialize(childTransaction));

        //Biz metadata
        builder.setPositionStatus(PositionStatusProto.valueOf(transaction.getPositionStatus().name()));

        if(transaction.getStrategyAllocation() != null)
                builder.setStrategyAllocation(StrategySerializer.getInstance().serialize(transaction.getStrategyAllocation()));

        if(transaction.getTradeName() != null)
            builder.setTradeName(transaction.getTradeName());

        //System fields
        builder.setIsCancelled(transaction.isCancelled());

        return builder.build();
    }

    @Override
    public Transaction deserialize(TransactionProto proto) {
        Transaction transaction = new Transaction(
                ProtoSerializationUtil.deserializeUUID(proto.getUuid()),
                PortfolioSerializer.getInstance().deserialize(proto.getPortfolio()),
                PriceSerializer.getInstance().deserialize(proto.getPrice()),
                ProtoSerializationUtil.deserializeLocalDate(proto.getTradeDate()),
                ProtoSerializationUtil.deserializeLocalDate(proto.getSettlementDate()),
                ProtoSerializationUtil.deserializeBigDecimal(proto.getQuantity()),
                Security.fromProto(proto.getSecurity()),
                TransactionType.valueOf(proto.getTransactionType().name()),
                StrategySerializer.getInstance().deserialize(proto.getStrategyAllocation()),
                ProtoSerializationUtil.deserializeTimestamp(proto.getAsOf()),
                null,
                proto.getTradeName(),
                proto.getPositionStatus());

        for(TransactionProto childTransactionProto : proto.getChildTransactionsList()) {
            Transaction childTransaction = this.deserialize(childTransactionProto);
            childTransaction.setParentTransaction(transaction);
            transaction.getChildTransactions().add(childTransaction);
        }
        //NOTE: Here we are choosing to deserialize what was written down, rather than recreate it. If there
        //is a change in business logic this could create differences in cash impacts that were previously
        //written down, vs. later generated. This logic should be incredible stable, but we could also opt
        //to not serialize cash transactions.
        return transaction;
    }

    // JSON serialize/deserialize removed in FinTekkers/second-brain#338 — no
    // live callers across the platform.

}
