// TODO - Migrate to portfolio wrapper & tests

const { testPortfolio } = require('./portfolio.test');
testPortfolio();

const { testSecurity } = require('./security.test');
testSecurity();


// const { PortfolioProto } = require('./node/fintekkers/models/portfolio/portfolio_pb');
// const { CreatePortfolioRequestProto } = require('./node/fintekkers/requests/portfolio/create_portfolio_request_pb');
// const { QueryPortfolioRequestProto } = require('./node/fintekkers/requests/portfolio/query_portfolio_request_pb');

// const { PortfolioClient  } = require('./node/fintekkers/services/portfolio-service/portfolio_service_grpc_pb');
// const { Timestamp } =  require('google-protobuf/google/protobuf/timestamp_pb');

// function createTimestampWithCurrentTime() {
//     // Get the current time in milliseconds since January 1, 1970 (Unix timestamp)
//     const currentTimeMillis = Date.now();
  
//     // Convert milliseconds to seconds and nanoseconds
//     const seconds = Math.floor(currentTimeMillis / 1000);
//     const nanos = (currentTimeMillis % 1000) * 1e6; // 1 millisecond = 1e6 nanoseconds
  
//     // Create a new Timestamp object with the current time
//     const timestamp = new Timestamp();
//     timestamp.setSeconds(seconds);
//     timestamp.setNanos(nanos);
  
//     return timestamp;
//   }
  
// UUID = require('./proto_utils_uuid').UUID;

// const receivedBytes = [-39, 98, -3, -16, 51, -31, 77, -99, -103, -101, 126, -61, 80, -16, -53, 119];
// const id_proto = new UUID(receivedBytes).to_uuid_proto();

// const { ZonedDateTime } =  require('./proto_utils_datetime');

// const now = ZonedDateTime.now();

// // const now = new LocalTimestampProto();
// // now.setTimeZone('America/New_York');
// // now.setTimestamp(createTimestampWithCurrentTime());

// const portfolio = new PortfolioProto();
// portfolio.setObjectClass('Portfolio');
// portfolio.setVersion('0.0.1');
// portfolio.setUuid(id_proto);
// portfolio.setPortfolioName('TEST PORTFOLIO');
// portfolio.setAsOf(now.to_date_proto());

// var createRequest = new CreatePortfolioRequestProto();
// createRequest.setObjectClass('PortfolioRequest');
// createRequest.setVersion('0.0.1');
// createRequest.setCreatePortfolioInput(portfolio);

// var searchRequest = new QueryPortfolioRequestProto();
// searchRequest.setObjectClass('PortfolioRequest');
// searchRequest.setVersion('0.0.1');
// searchRequest.setAsOf(now.to_date_proto());
// searchRequest.addUuids(id_proto);

// // Portfolio Response Service
// const grpc = require('@grpc/grpc-js');

// var client = new PortfolioClient('api.fintekkers.org:8082', grpc.credentials.createSsl());
// // var client = new PortfolioClient('localhost:8082', grpc.credentials.createInsecure());

// client.validateCreateOrUpdate(createRequest, function (error, response) {
//     console.log('Result of the validation request:');
//     if (error) {
//         console.error('Error:', error.message);
//     } else {
//         console.log('Response:', response);
//     }
// });

// client.createOrUpdate(createRequest, function (error, response) {
//     console.log('Result of the create/update call');
//     if (error) {
//         console.error('Error:', error.message);
//     } else {
//         console.log('Response:', response);
//     }
// });

// const stream = client.search(searchRequest);

// // Handle the stream of responses
// stream.on('data', response => {    
//     console.log('Result of the search call');
//     console.log('Response:', response);
// });

// stream.on('end', () => {
//   // Stream is done, handle any cleanup or finalization here
//   console.log('Stream ended.');
// });

// stream.on('error', err => {
//   // Handle any errors that occur during the stream
//   console.error('Error in the stream:', err);
// });

// TODO - Security version of portfolio


// TODO - Transactions


// TODO - Positions

