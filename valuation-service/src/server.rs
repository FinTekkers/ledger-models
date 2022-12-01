use std::net::{SocketAddr, IpAddr, Ipv6Addr};

use rust_types::ledger_models::{
    security::{SecurityRequestProto, SecurityResponseProto},
    valuation::valuation_server::{Valuation, ValuationServer},
};
use tonic::{transport::Server, Request, Response, Status};
use tracing_subscriber;
use tracing::{info};

#[derive(Default, Debug)]
pub struct ValuationServiceServer {}
#[tonic::async_trait]
impl Valuation for ValuationServiceServer {
    #[tracing::instrument]
    async fn echo_security(
        &self,
        request: Request<SecurityRequestProto>,
    ) -> Result<Response<SecurityResponseProto>, Status> {
        let security_request = request.into_inner();
        info!("Handling Request");

        let reply = SecurityResponseProto {
            object_class: security_request.object_class,
            version: security_request.version,
            create_security_request: None,
            security_response: Vec::new(),
        };

        info!("Returning {:?}", reply);

        return Ok(Response::new(reply));
    }
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    tracing_subscriber::fmt::init();

    let port = std::env::var("PORT").unwrap_or("50051".into()).parse()?;
    let addr =SocketAddr::new(IpAddr::V6(Ipv6Addr::new(0, 0, 0, 0, 0, 0, 0, 1)), port);

    let valuation_service = ValuationServiceServer::default();

    info!("Starging server on {:?}", addr);

    Server::builder()
        .add_service(ValuationServer::new(valuation_service))
        .serve(addr)
        .await?;

    Ok(())
}
