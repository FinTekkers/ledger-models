package common.models.transaction;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.UUID;

public class TransactionSet extends HashMap<UUID, List<Transaction>> {
    public void addTransaction(Transaction transaction){
        if(!containsKey(transaction.getID())) {
            put(transaction.getID(), new ArrayList<>());
        }

        get(transaction.getID()).add(transaction);
    }

    public List<Transaction> allLatestTransactions() {
        List<Transaction> transactions = new ArrayList<>();

        for (List<Transaction> versions : values()) {
            if (versions.isEmpty()) continue;

            Transaction latest = versions.get(0);
            for (int i = 1; i < versions.size(); i++) {
                Transaction candidate = versions.get(i);
                if (candidate.getAsOf().isAfter(latest.getAsOf())) {
                    latest = candidate;
                }
            }
            transactions.add(latest);
        }

        return transactions;
    }
    
    public List<Transaction> allTransactionsAllVersions() {
        List<Transaction> transactions = new ArrayList<>();

        for(UUID key : keySet()) {
            List<Transaction> tmpTxns = get(key);
            for(Transaction tmpTxn : tmpTxns) {
                transactions.add(tmpTxn);
            }
        }
        return transactions;
    }
}