use std::{vec, net::{Ipv4Addr, IpAddr, SocketAddr}};

use rust_types::ledger_models::{valuation::valuation_client::ValuationClient, security::SecurityRequestProto, util::UuidProto};

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let mut client = ValuationClient::connect("http://127.0.0.1:8080").await?;

    let request = tonic::Request::new(SecurityRequestProto {
        object_class: "TEST".into(),
        version: "ONE".into(),
        operation_type: 4,
         create_security_input: None,
         uuids: vec![UuidProto{ raw_uuid: vec![1,2,3] }],
         search_security_input: None
    });

   let response = client.echo_security(request).await;
    println!("RESPONSE={:?}", response);

    Ok(())
}