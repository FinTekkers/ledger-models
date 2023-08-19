import * as grpc from '@grpc/grpc-js';
import { promisify } from 'util';

// Models
import Transaction from '../../models/transaction/transaction';
import { createFieldMapEntry } from '../../models/utils/serialization.util';
import { LocalTimestampProto } from '../../../fintekkers/models/util/local_timestamp_pb';
import { SummaryProto } from '../../../fintekkers/requests/util/errors/summary_pb';

// Model Utils
import { PositionFilterProto } from '../../../fintekkers/models/position/position_filter_pb';
import { FieldProto } from '../../../fintekkers/models/position/field_pb';

// Requests & Services
import { TransactionClient } from '../../../fintekkers/services/transaction-service/transaction_service_grpc_pb';
import { CreateTransactionRequestProto } from '../../../fintekkers/requests/transaction/create_transaction_request_pb';
import { CreateTransactionResponseProto } from '../../../fintekkers/requests/transaction/create_transaction_response_pb';
import { QueryTransactionRequestProto } from '../../../fintekkers/requests/transaction/query_transaction_request_pb';
import { QueryTransactionResponseProto } from '../../../fintekkers/requests/transaction/query_transaction_response_pb';
import EnvConfig from '../../models/utils/requestcontext';


class TransactionService {
  private client: TransactionClient;

  constructor() {
    this.client = new TransactionClient(EnvConfig.apiURL, EnvConfig.apiCredentials);
  }

  async validateCreateTransaction(transaction: Transaction): Promise<SummaryProto> {
    const createRequest = new CreateTransactionRequestProto();
    createRequest.setObjectClass('TransactionRequest');
    createRequest.setVersion('0.0.1');
    createRequest.setCreateTransactionInput(transaction.proto);

    const validateCreateOrUpdateAsync = promisify(this.client.validateCreateOrUpdate.bind(this.client));
    const response = await validateCreateOrUpdateAsync(createRequest);
    return response;
  }

  async createTransaction(transaction: Transaction): Promise<CreateTransactionResponseProto> {
    const createRequest = new CreateTransactionRequestProto();
    createRequest.setObjectClass('TransactionRequest');
    createRequest.setVersion('0.0.1');
    createRequest.setCreateTransactionInput(transaction.proto);

    const createSecurityAsync = promisify(this.client.createOrUpdate.bind(this.client));
    const response = await createSecurityAsync(createRequest);
    return response;
  }

   searchTransaction(asOf: LocalTimestampProto, fieldProto: FieldProto, fieldValue: string, maxResults: number=100): 
      Promise<Transaction[]> {
    const searchRequest = new QueryTransactionRequestProto();
    searchRequest.setObjectClass('SecurityRequest');
    searchRequest.setVersion('0.0.1');
    searchRequest.setAsOf(asOf);

    const positionFilter = new PositionFilterProto();
    positionFilter.setObjectClass('PositionFilter');
    positionFilter.setVersion('0.0.1');

    const fieldMapEntry = createFieldMapEntry(fieldProto, fieldValue);
    positionFilter.setFiltersList([fieldMapEntry]);

    searchRequest.setSearchTransactionInput(positionFilter);
    searchRequest.setLimit(maxResults);

    const tmpClient = this.client;

    async function processStreamSynchronously(): Promise<Transaction[]> {
      const stream2 = tmpClient.search(searchRequest);
      var results:Transaction[] = [];

      return new Promise<Transaction[]>((resolve, reject) => {
        stream2.on('data', (response:QueryTransactionResponseProto) => {
          response.getTransactionResponseList().forEach((transaction) => {
            const txn:Transaction = new Transaction(transaction);
            results.push(txn);
          })
        });

        stream2.on('end', () => {
          console.log("Stream ended with ", results.length);
          resolve(results);
        });

        stream2.on('error', (err) => {
          console.error('Error in the stream:', err);
          reject(err); 
        });
      });
    }

    return processStreamSynchronously();
  }
}

export { TransactionService };