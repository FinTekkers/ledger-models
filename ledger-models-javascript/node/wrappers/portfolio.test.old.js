const { PortfolioProto } = require('../fintekkers/models/portfolio/portfolio_pb');
const { CreatePortfolioRequestProto } = require('../fintekkers/requests/portfolio/create_portfolio_request_pb');
const { QueryPortfolioRequestProto } = require('../fintekkers/requests/portfolio/query_portfolio_request_pb');

const { PortfolioClient  } = require('../fintekkers/services/portfolio-service/portfolio_service_grpc_pb');
  
const { UUID } = require('./models/utils/uuid');
const { ZonedDateTime } =  require('./models/utils/datetime');

function testPortfolio() {
    const receivedBytes = [-39, 98, -3, -16, 51, -31, 77, -99, -103, -101, 126, -61, 80, -16, -53, 119];
    const id_proto = new UUID(receivedBytes).to_uuid_proto();

    const now = ZonedDateTime.now();

    const portfolio = new PortfolioProto();
    portfolio.setObjectClass('Portfolio');
    portfolio.setVersion('0.0.1');
    portfolio.setUuid(id_proto);
    portfolio.setPortfolioName('TEST PORTFOLIO');
    portfolio.setAsOf(now.to_date_proto());

    var createRequest = new CreatePortfolioRequestProto();
    createRequest.setObjectClass('PortfolioRequest');
    createRequest.setVersion('0.0.1');
    createRequest.setCreatePortfolioInput(portfolio);

    var searchRequest = new QueryPortfolioRequestProto();
    searchRequest.setObjectClass('PortfolioRequest');
    searchRequest.setVersion('0.0.1');
    searchRequest.setAsOf(now.to_date_proto());
    searchRequest.addUuids(id_proto);

    // Portfolio Response Service
    const grpc = require('@grpc/grpc-js');

    var client = new PortfolioClient('api.fintekkers.org:8082', grpc.credentials.createSsl());
    // var client = new PortfolioClient('localhost:8082', grpc.credentials.createInsecure());

    client.validateCreateOrUpdate(createRequest, function (error, response) {
        console.log('Result of the portfolio validation request:');
        if (error) {
            console.error('Error:', error.message);
        } else {
            console.log('Response:', response);
        }
    });

    client.createOrUpdate(createRequest, function (error, response) {
        console.log('Result of the portfolio create/update call');
        if (error) {
            console.error('Error:', error.message);
        } else {
            console.log('Response:', response);
        }
    });

    const stream = client.search(searchRequest);

    // Handle the stream of responses
    stream.on('data', response => {    
        console.log('Result of the portfolio search call');
        console.log('Response:', response);
    });

    stream.on('end', () => {
    // Stream is done, handle any cleanup or finalization here
    console.log('Stream ended.');
    });

    stream.on('error', err => {
    // Handle any errors that occur during the stream
    console.error('Error in the stream:', err);
    });
}

exports.testPortfolio = testPortfolio;