/// Generated client implementations.
pub mod portfolio_client {
    #![allow(unused_variables, dead_code, missing_docs, clippy::let_unit_value)]
    use tonic::codegen::*;
    use tonic::codegen::http::Uri;
    #[derive(Debug, Clone)]
    pub struct PortfolioClient<T> {
        inner: tonic::client::Grpc<T>,
    }
    impl PortfolioClient<tonic::transport::Channel> {
        /// Attempt to create a new client by connecting to a given endpoint.
        pub async fn connect<D>(dst: D) -> Result<Self, tonic::transport::Error>
        where
            D: std::convert::TryInto<tonic::transport::Endpoint>,
            D::Error: Into<StdError>,
        {
            let conn = tonic::transport::Endpoint::new(dst)?.connect().await?;
            Ok(Self::new(conn))
        }
    }
    impl<T> PortfolioClient<T>
    where
        T: tonic::client::GrpcService<tonic::body::BoxBody>,
        T::Error: Into<StdError>,
        T::ResponseBody: Body<Data = Bytes> + Send + 'static,
        <T::ResponseBody as Body>::Error: Into<StdError> + Send,
    {
        pub fn new(inner: T) -> Self {
            let inner = tonic::client::Grpc::new(inner);
            Self { inner }
        }
        pub fn with_origin(inner: T, origin: Uri) -> Self {
            let inner = tonic::client::Grpc::with_origin(inner, origin);
            Self { inner }
        }
        pub fn with_interceptor<F>(
            inner: T,
            interceptor: F,
        ) -> PortfolioClient<InterceptedService<T, F>>
        where
            F: tonic::service::Interceptor,
            T::ResponseBody: Default,
            T: tonic::codegen::Service<
                http::Request<tonic::body::BoxBody>,
                Response = http::Response<
                    <T as tonic::client::GrpcService<tonic::body::BoxBody>>::ResponseBody,
                >,
            >,
            <T as tonic::codegen::Service<
                http::Request<tonic::body::BoxBody>,
            >>::Error: Into<StdError> + Send + Sync,
        {
            PortfolioClient::new(InterceptedService::new(inner, interceptor))
        }
        /// Compress requests with the given encoding.
        ///
        /// This requires the server to support it otherwise it might respond with an
        /// error.
        #[must_use]
        pub fn send_compressed(mut self, encoding: CompressionEncoding) -> Self {
            self.inner = self.inner.send_compressed(encoding);
            self
        }
        /// Enable decompressing responses.
        #[must_use]
        pub fn accept_compressed(mut self, encoding: CompressionEncoding) -> Self {
            self.inner = self.inner.accept_compressed(encoding);
            self
        }
        pub async fn create_or_update(
            &mut self,
            request: impl tonic::IntoRequest<
                super::super::super::requests::portfolio::CreatePortfolioRequestProto,
            >,
        ) -> Result<
            tonic::Response<
                super::super::super::requests::portfolio::CreatePortfolioResponseProto,
            >,
            tonic::Status,
        > {
            self.inner
                .ready()
                .await
                .map_err(|e| {
                    tonic::Status::new(
                        tonic::Code::Unknown,
                        format!("Service was not ready: {}", e.into()),
                    )
                })?;
            let codec = tonic::codec::ProstCodec::default();
            let path = http::uri::PathAndQuery::from_static(
                "/fintekkers.services.security_service.Portfolio/CreateOrUpdate",
            );
            self.inner.unary(request.into_request(), path, codec).await
        }
        pub async fn get_by_i_ds(
            &mut self,
            request: impl tonic::IntoRequest<
                super::super::super::requests::portfolio::QueryPortfolioRequestProto,
            >,
        ) -> Result<
            tonic::Response<
                super::super::super::requests::portfolio::QueryPortfolioResponseProto,
            >,
            tonic::Status,
        > {
            self.inner
                .ready()
                .await
                .map_err(|e| {
                    tonic::Status::new(
                        tonic::Code::Unknown,
                        format!("Service was not ready: {}", e.into()),
                    )
                })?;
            let codec = tonic::codec::ProstCodec::default();
            let path = http::uri::PathAndQuery::from_static(
                "/fintekkers.services.security_service.Portfolio/GetByIDs",
            );
            self.inner.unary(request.into_request(), path, codec).await
        }
        pub async fn search(
            &mut self,
            request: impl tonic::IntoRequest<
                super::super::super::requests::portfolio::QueryPortfolioRequestProto,
            >,
        ) -> Result<
            tonic::Response<
                tonic::codec::Streaming<
                    super::super::super::requests::portfolio::QueryPortfolioResponseProto,
                >,
            >,
            tonic::Status,
        > {
            self.inner
                .ready()
                .await
                .map_err(|e| {
                    tonic::Status::new(
                        tonic::Code::Unknown,
                        format!("Service was not ready: {}", e.into()),
                    )
                })?;
            let codec = tonic::codec::ProstCodec::default();
            let path = http::uri::PathAndQuery::from_static(
                "/fintekkers.services.security_service.Portfolio/Search",
            );
            self.inner.server_streaming(request.into_request(), path, codec).await
        }
        pub async fn list_i_ds(
            &mut self,
            request: impl tonic::IntoRequest<
                super::super::super::requests::portfolio::QueryPortfolioRequestProto,
            >,
        ) -> Result<
            tonic::Response<
                super::super::super::requests::portfolio::QueryPortfolioResponseProto,
            >,
            tonic::Status,
        > {
            self.inner
                .ready()
                .await
                .map_err(|e| {
                    tonic::Status::new(
                        tonic::Code::Unknown,
                        format!("Service was not ready: {}", e.into()),
                    )
                })?;
            let codec = tonic::codec::ProstCodec::default();
            let path = http::uri::PathAndQuery::from_static(
                "/fintekkers.services.security_service.Portfolio/ListIDs",
            );
            self.inner.unary(request.into_request(), path, codec).await
        }
        pub async fn validate_create_or_update(
            &mut self,
            request: impl tonic::IntoRequest<
                super::super::super::requests::portfolio::CreatePortfolioRequestProto,
            >,
        ) -> Result<
            tonic::Response<super::super::super::requests::util::errors::SummaryProto>,
            tonic::Status,
        > {
            self.inner
                .ready()
                .await
                .map_err(|e| {
                    tonic::Status::new(
                        tonic::Code::Unknown,
                        format!("Service was not ready: {}", e.into()),
                    )
                })?;
            let codec = tonic::codec::ProstCodec::default();
            let path = http::uri::PathAndQuery::from_static(
                "/fintekkers.services.security_service.Portfolio/ValidateCreateOrUpdate",
            );
            self.inner.unary(request.into_request(), path, codec).await
        }
        pub async fn validate_query_request(
            &mut self,
            request: impl tonic::IntoRequest<
                super::super::super::requests::portfolio::QueryPortfolioRequestProto,
            >,
        ) -> Result<
            tonic::Response<super::super::super::requests::util::errors::SummaryProto>,
            tonic::Status,
        > {
            self.inner
                .ready()
                .await
                .map_err(|e| {
                    tonic::Status::new(
                        tonic::Code::Unknown,
                        format!("Service was not ready: {}", e.into()),
                    )
                })?;
            let codec = tonic::codec::ProstCodec::default();
            let path = http::uri::PathAndQuery::from_static(
                "/fintekkers.services.security_service.Portfolio/ValidateQueryRequest",
            );
            self.inner.unary(request.into_request(), path, codec).await
        }
    }
}
/// Generated server implementations.
pub mod portfolio_server {
    #![allow(unused_variables, dead_code, missing_docs, clippy::let_unit_value)]
    use tonic::codegen::*;
    /// Generated trait containing gRPC methods that should be implemented for use with PortfolioServer.
    #[async_trait]
    pub trait Portfolio: Send + Sync + 'static {
        async fn create_or_update(
            &self,
            request: tonic::Request<
                super::super::super::requests::portfolio::CreatePortfolioRequestProto,
            >,
        ) -> Result<
            tonic::Response<
                super::super::super::requests::portfolio::CreatePortfolioResponseProto,
            >,
            tonic::Status,
        >;
        async fn get_by_i_ds(
            &self,
            request: tonic::Request<
                super::super::super::requests::portfolio::QueryPortfolioRequestProto,
            >,
        ) -> Result<
            tonic::Response<
                super::super::super::requests::portfolio::QueryPortfolioResponseProto,
            >,
            tonic::Status,
        >;
        /// Server streaming response type for the Search method.
        type SearchStream: futures_core::Stream<
                Item = Result<
                    super::super::super::requests::portfolio::QueryPortfolioResponseProto,
                    tonic::Status,
                >,
            >
            + Send
            + 'static;
        async fn search(
            &self,
            request: tonic::Request<
                super::super::super::requests::portfolio::QueryPortfolioRequestProto,
            >,
        ) -> Result<tonic::Response<Self::SearchStream>, tonic::Status>;
        async fn list_i_ds(
            &self,
            request: tonic::Request<
                super::super::super::requests::portfolio::QueryPortfolioRequestProto,
            >,
        ) -> Result<
            tonic::Response<
                super::super::super::requests::portfolio::QueryPortfolioResponseProto,
            >,
            tonic::Status,
        >;
        async fn validate_create_or_update(
            &self,
            request: tonic::Request<
                super::super::super::requests::portfolio::CreatePortfolioRequestProto,
            >,
        ) -> Result<
            tonic::Response<super::super::super::requests::util::errors::SummaryProto>,
            tonic::Status,
        >;
        async fn validate_query_request(
            &self,
            request: tonic::Request<
                super::super::super::requests::portfolio::QueryPortfolioRequestProto,
            >,
        ) -> Result<
            tonic::Response<super::super::super::requests::util::errors::SummaryProto>,
            tonic::Status,
        >;
    }
    #[derive(Debug)]
    pub struct PortfolioServer<T: Portfolio> {
        inner: _Inner<T>,
        accept_compression_encodings: EnabledCompressionEncodings,
        send_compression_encodings: EnabledCompressionEncodings,
    }
    struct _Inner<T>(Arc<T>);
    impl<T: Portfolio> PortfolioServer<T> {
        pub fn new(inner: T) -> Self {
            Self::from_arc(Arc::new(inner))
        }
        pub fn from_arc(inner: Arc<T>) -> Self {
            let inner = _Inner(inner);
            Self {
                inner,
                accept_compression_encodings: Default::default(),
                send_compression_encodings: Default::default(),
            }
        }
        pub fn with_interceptor<F>(
            inner: T,
            interceptor: F,
        ) -> InterceptedService<Self, F>
        where
            F: tonic::service::Interceptor,
        {
            InterceptedService::new(Self::new(inner), interceptor)
        }
        /// Enable decompressing requests with the given encoding.
        #[must_use]
        pub fn accept_compressed(mut self, encoding: CompressionEncoding) -> Self {
            self.accept_compression_encodings.enable(encoding);
            self
        }
        /// Compress responses with the given encoding, if the client supports it.
        #[must_use]
        pub fn send_compressed(mut self, encoding: CompressionEncoding) -> Self {
            self.send_compression_encodings.enable(encoding);
            self
        }
    }
    impl<T, B> tonic::codegen::Service<http::Request<B>> for PortfolioServer<T>
    where
        T: Portfolio,
        B: Body + Send + 'static,
        B::Error: Into<StdError> + Send + 'static,
    {
        type Response = http::Response<tonic::body::BoxBody>;
        type Error = std::convert::Infallible;
        type Future = BoxFuture<Self::Response, Self::Error>;
        fn poll_ready(
            &mut self,
            _cx: &mut Context<'_>,
        ) -> Poll<Result<(), Self::Error>> {
            Poll::Ready(Ok(()))
        }
        fn call(&mut self, req: http::Request<B>) -> Self::Future {
            let inner = self.inner.clone();
            match req.uri().path() {
                "/fintekkers.services.security_service.Portfolio/CreateOrUpdate" => {
                    #[allow(non_camel_case_types)]
                    struct CreateOrUpdateSvc<T: Portfolio>(pub Arc<T>);
                    impl<
                        T: Portfolio,
                    > tonic::server::UnaryService<
                        super::super::super::requests::portfolio::CreatePortfolioRequestProto,
                    > for CreateOrUpdateSvc<T> {
                        type Response = super::super::super::requests::portfolio::CreatePortfolioResponseProto;
                        type Future = BoxFuture<
                            tonic::Response<Self::Response>,
                            tonic::Status,
                        >;
                        fn call(
                            &mut self,
                            request: tonic::Request<
                                super::super::super::requests::portfolio::CreatePortfolioRequestProto,
                            >,
                        ) -> Self::Future {
                            let inner = self.0.clone();
                            let fut = async move {
                                (*inner).create_or_update(request).await
                            };
                            Box::pin(fut)
                        }
                    }
                    let accept_compression_encodings = self.accept_compression_encodings;
                    let send_compression_encodings = self.send_compression_encodings;
                    let inner = self.inner.clone();
                    let fut = async move {
                        let inner = inner.0;
                        let method = CreateOrUpdateSvc(inner);
                        let codec = tonic::codec::ProstCodec::default();
                        let mut grpc = tonic::server::Grpc::new(codec)
                            .apply_compression_config(
                                accept_compression_encodings,
                                send_compression_encodings,
                            );
                        let res = grpc.unary(method, req).await;
                        Ok(res)
                    };
                    Box::pin(fut)
                }
                "/fintekkers.services.security_service.Portfolio/GetByIDs" => {
                    #[allow(non_camel_case_types)]
                    struct GetByIDsSvc<T: Portfolio>(pub Arc<T>);
                    impl<
                        T: Portfolio,
                    > tonic::server::UnaryService<
                        super::super::super::requests::portfolio::QueryPortfolioRequestProto,
                    > for GetByIDsSvc<T> {
                        type Response = super::super::super::requests::portfolio::QueryPortfolioResponseProto;
                        type Future = BoxFuture<
                            tonic::Response<Self::Response>,
                            tonic::Status,
                        >;
                        fn call(
                            &mut self,
                            request: tonic::Request<
                                super::super::super::requests::portfolio::QueryPortfolioRequestProto,
                            >,
                        ) -> Self::Future {
                            let inner = self.0.clone();
                            let fut = async move { (*inner).get_by_i_ds(request).await };
                            Box::pin(fut)
                        }
                    }
                    let accept_compression_encodings = self.accept_compression_encodings;
                    let send_compression_encodings = self.send_compression_encodings;
                    let inner = self.inner.clone();
                    let fut = async move {
                        let inner = inner.0;
                        let method = GetByIDsSvc(inner);
                        let codec = tonic::codec::ProstCodec::default();
                        let mut grpc = tonic::server::Grpc::new(codec)
                            .apply_compression_config(
                                accept_compression_encodings,
                                send_compression_encodings,
                            );
                        let res = grpc.unary(method, req).await;
                        Ok(res)
                    };
                    Box::pin(fut)
                }
                "/fintekkers.services.security_service.Portfolio/Search" => {
                    #[allow(non_camel_case_types)]
                    struct SearchSvc<T: Portfolio>(pub Arc<T>);
                    impl<
                        T: Portfolio,
                    > tonic::server::ServerStreamingService<
                        super::super::super::requests::portfolio::QueryPortfolioRequestProto,
                    > for SearchSvc<T> {
                        type Response = super::super::super::requests::portfolio::QueryPortfolioResponseProto;
                        type ResponseStream = T::SearchStream;
                        type Future = BoxFuture<
                            tonic::Response<Self::ResponseStream>,
                            tonic::Status,
                        >;
                        fn call(
                            &mut self,
                            request: tonic::Request<
                                super::super::super::requests::portfolio::QueryPortfolioRequestProto,
                            >,
                        ) -> Self::Future {
                            let inner = self.0.clone();
                            let fut = async move { (*inner).search(request).await };
                            Box::pin(fut)
                        }
                    }
                    let accept_compression_encodings = self.accept_compression_encodings;
                    let send_compression_encodings = self.send_compression_encodings;
                    let inner = self.inner.clone();
                    let fut = async move {
                        let inner = inner.0;
                        let method = SearchSvc(inner);
                        let codec = tonic::codec::ProstCodec::default();
                        let mut grpc = tonic::server::Grpc::new(codec)
                            .apply_compression_config(
                                accept_compression_encodings,
                                send_compression_encodings,
                            );
                        let res = grpc.server_streaming(method, req).await;
                        Ok(res)
                    };
                    Box::pin(fut)
                }
                "/fintekkers.services.security_service.Portfolio/ListIDs" => {
                    #[allow(non_camel_case_types)]
                    struct ListIDsSvc<T: Portfolio>(pub Arc<T>);
                    impl<
                        T: Portfolio,
                    > tonic::server::UnaryService<
                        super::super::super::requests::portfolio::QueryPortfolioRequestProto,
                    > for ListIDsSvc<T> {
                        type Response = super::super::super::requests::portfolio::QueryPortfolioResponseProto;
                        type Future = BoxFuture<
                            tonic::Response<Self::Response>,
                            tonic::Status,
                        >;
                        fn call(
                            &mut self,
                            request: tonic::Request<
                                super::super::super::requests::portfolio::QueryPortfolioRequestProto,
                            >,
                        ) -> Self::Future {
                            let inner = self.0.clone();
                            let fut = async move { (*inner).list_i_ds(request).await };
                            Box::pin(fut)
                        }
                    }
                    let accept_compression_encodings = self.accept_compression_encodings;
                    let send_compression_encodings = self.send_compression_encodings;
                    let inner = self.inner.clone();
                    let fut = async move {
                        let inner = inner.0;
                        let method = ListIDsSvc(inner);
                        let codec = tonic::codec::ProstCodec::default();
                        let mut grpc = tonic::server::Grpc::new(codec)
                            .apply_compression_config(
                                accept_compression_encodings,
                                send_compression_encodings,
                            );
                        let res = grpc.unary(method, req).await;
                        Ok(res)
                    };
                    Box::pin(fut)
                }
                "/fintekkers.services.security_service.Portfolio/ValidateCreateOrUpdate" => {
                    #[allow(non_camel_case_types)]
                    struct ValidateCreateOrUpdateSvc<T: Portfolio>(pub Arc<T>);
                    impl<
                        T: Portfolio,
                    > tonic::server::UnaryService<
                        super::super::super::requests::portfolio::CreatePortfolioRequestProto,
                    > for ValidateCreateOrUpdateSvc<T> {
                        type Response = super::super::super::requests::util::errors::SummaryProto;
                        type Future = BoxFuture<
                            tonic::Response<Self::Response>,
                            tonic::Status,
                        >;
                        fn call(
                            &mut self,
                            request: tonic::Request<
                                super::super::super::requests::portfolio::CreatePortfolioRequestProto,
                            >,
                        ) -> Self::Future {
                            let inner = self.0.clone();
                            let fut = async move {
                                (*inner).validate_create_or_update(request).await
                            };
                            Box::pin(fut)
                        }
                    }
                    let accept_compression_encodings = self.accept_compression_encodings;
                    let send_compression_encodings = self.send_compression_encodings;
                    let inner = self.inner.clone();
                    let fut = async move {
                        let inner = inner.0;
                        let method = ValidateCreateOrUpdateSvc(inner);
                        let codec = tonic::codec::ProstCodec::default();
                        let mut grpc = tonic::server::Grpc::new(codec)
                            .apply_compression_config(
                                accept_compression_encodings,
                                send_compression_encodings,
                            );
                        let res = grpc.unary(method, req).await;
                        Ok(res)
                    };
                    Box::pin(fut)
                }
                "/fintekkers.services.security_service.Portfolio/ValidateQueryRequest" => {
                    #[allow(non_camel_case_types)]
                    struct ValidateQueryRequestSvc<T: Portfolio>(pub Arc<T>);
                    impl<
                        T: Portfolio,
                    > tonic::server::UnaryService<
                        super::super::super::requests::portfolio::QueryPortfolioRequestProto,
                    > for ValidateQueryRequestSvc<T> {
                        type Response = super::super::super::requests::util::errors::SummaryProto;
                        type Future = BoxFuture<
                            tonic::Response<Self::Response>,
                            tonic::Status,
                        >;
                        fn call(
                            &mut self,
                            request: tonic::Request<
                                super::super::super::requests::portfolio::QueryPortfolioRequestProto,
                            >,
                        ) -> Self::Future {
                            let inner = self.0.clone();
                            let fut = async move {
                                (*inner).validate_query_request(request).await
                            };
                            Box::pin(fut)
                        }
                    }
                    let accept_compression_encodings = self.accept_compression_encodings;
                    let send_compression_encodings = self.send_compression_encodings;
                    let inner = self.inner.clone();
                    let fut = async move {
                        let inner = inner.0;
                        let method = ValidateQueryRequestSvc(inner);
                        let codec = tonic::codec::ProstCodec::default();
                        let mut grpc = tonic::server::Grpc::new(codec)
                            .apply_compression_config(
                                accept_compression_encodings,
                                send_compression_encodings,
                            );
                        let res = grpc.unary(method, req).await;
                        Ok(res)
                    };
                    Box::pin(fut)
                }
                _ => {
                    Box::pin(async move {
                        Ok(
                            http::Response::builder()
                                .status(200)
                                .header("grpc-status", "12")
                                .header("content-type", "application/grpc")
                                .body(empty_body())
                                .unwrap(),
                        )
                    })
                }
            }
        }
    }
    impl<T: Portfolio> Clone for PortfolioServer<T> {
        fn clone(&self) -> Self {
            let inner = self.inner.clone();
            Self {
                inner,
                accept_compression_encodings: self.accept_compression_encodings,
                send_compression_encodings: self.send_compression_encodings,
            }
        }
    }
    impl<T: Portfolio> Clone for _Inner<T> {
        fn clone(&self) -> Self {
            Self(self.0.clone())
        }
    }
    impl<T: std::fmt::Debug> std::fmt::Debug for _Inner<T> {
        fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
            write!(f, "{:?}", self.0)
        }
    }
    impl<T: Portfolio> tonic::server::NamedService for PortfolioServer<T> {
        const NAME: &'static str = "fintekkers.services.security_service.Portfolio";
    }
}
/// Generated client implementations.
pub mod transaction_client {
    #![allow(unused_variables, dead_code, missing_docs, clippy::let_unit_value)]
    use tonic::codegen::*;
    use tonic::codegen::http::Uri;
    #[derive(Debug, Clone)]
    pub struct TransactionClient<T> {
        inner: tonic::client::Grpc<T>,
    }
    impl TransactionClient<tonic::transport::Channel> {
        /// Attempt to create a new client by connecting to a given endpoint.
        pub async fn connect<D>(dst: D) -> Result<Self, tonic::transport::Error>
        where
            D: std::convert::TryInto<tonic::transport::Endpoint>,
            D::Error: Into<StdError>,
        {
            let conn = tonic::transport::Endpoint::new(dst)?.connect().await?;
            Ok(Self::new(conn))
        }
    }
    impl<T> TransactionClient<T>
    where
        T: tonic::client::GrpcService<tonic::body::BoxBody>,
        T::Error: Into<StdError>,
        T::ResponseBody: Body<Data = Bytes> + Send + 'static,
        <T::ResponseBody as Body>::Error: Into<StdError> + Send,
    {
        pub fn new(inner: T) -> Self {
            let inner = tonic::client::Grpc::new(inner);
            Self { inner }
        }
        pub fn with_origin(inner: T, origin: Uri) -> Self {
            let inner = tonic::client::Grpc::with_origin(inner, origin);
            Self { inner }
        }
        pub fn with_interceptor<F>(
            inner: T,
            interceptor: F,
        ) -> TransactionClient<InterceptedService<T, F>>
        where
            F: tonic::service::Interceptor,
            T::ResponseBody: Default,
            T: tonic::codegen::Service<
                http::Request<tonic::body::BoxBody>,
                Response = http::Response<
                    <T as tonic::client::GrpcService<tonic::body::BoxBody>>::ResponseBody,
                >,
            >,
            <T as tonic::codegen::Service<
                http::Request<tonic::body::BoxBody>,
            >>::Error: Into<StdError> + Send + Sync,
        {
            TransactionClient::new(InterceptedService::new(inner, interceptor))
        }
        /// Compress requests with the given encoding.
        ///
        /// This requires the server to support it otherwise it might respond with an
        /// error.
        #[must_use]
        pub fn send_compressed(mut self, encoding: CompressionEncoding) -> Self {
            self.inner = self.inner.send_compressed(encoding);
            self
        }
        /// Enable decompressing responses.
        #[must_use]
        pub fn accept_compressed(mut self, encoding: CompressionEncoding) -> Self {
            self.inner = self.inner.accept_compressed(encoding);
            self
        }
        pub async fn create_or_update(
            &mut self,
            request: impl tonic::IntoRequest<
                super::super::super::requests::transaction::CreateTransactionRequestProto,
            >,
        ) -> Result<
            tonic::Response<
                super::super::super::requests::transaction::CreateTransactionResponseProto,
            >,
            tonic::Status,
        > {
            self.inner
                .ready()
                .await
                .map_err(|e| {
                    tonic::Status::new(
                        tonic::Code::Unknown,
                        format!("Service was not ready: {}", e.into()),
                    )
                })?;
            let codec = tonic::codec::ProstCodec::default();
            let path = http::uri::PathAndQuery::from_static(
                "/fintekkers.services.security_service.Transaction/CreateOrUpdate",
            );
            self.inner.unary(request.into_request(), path, codec).await
        }
        pub async fn get_by_i_ds(
            &mut self,
            request: impl tonic::IntoRequest<
                super::super::super::requests::transaction::QueryTransactionRequestProto,
            >,
        ) -> Result<
            tonic::Response<
                super::super::super::requests::transaction::QueryTransactionResponseProto,
            >,
            tonic::Status,
        > {
            self.inner
                .ready()
                .await
                .map_err(|e| {
                    tonic::Status::new(
                        tonic::Code::Unknown,
                        format!("Service was not ready: {}", e.into()),
                    )
                })?;
            let codec = tonic::codec::ProstCodec::default();
            let path = http::uri::PathAndQuery::from_static(
                "/fintekkers.services.security_service.Transaction/GetByIDs",
            );
            self.inner.unary(request.into_request(), path, codec).await
        }
        pub async fn search(
            &mut self,
            request: impl tonic::IntoRequest<
                super::super::super::requests::transaction::QueryTransactionRequestProto,
            >,
        ) -> Result<
            tonic::Response<
                tonic::codec::Streaming<
                    super::super::super::requests::transaction::QueryTransactionResponseProto,
                >,
            >,
            tonic::Status,
        > {
            self.inner
                .ready()
                .await
                .map_err(|e| {
                    tonic::Status::new(
                        tonic::Code::Unknown,
                        format!("Service was not ready: {}", e.into()),
                    )
                })?;
            let codec = tonic::codec::ProstCodec::default();
            let path = http::uri::PathAndQuery::from_static(
                "/fintekkers.services.security_service.Transaction/Search",
            );
            self.inner.server_streaming(request.into_request(), path, codec).await
        }
        pub async fn list_i_ds(
            &mut self,
            request: impl tonic::IntoRequest<
                super::super::super::requests::transaction::QueryTransactionRequestProto,
            >,
        ) -> Result<
            tonic::Response<
                super::super::super::requests::transaction::QueryTransactionResponseProto,
            >,
            tonic::Status,
        > {
            self.inner
                .ready()
                .await
                .map_err(|e| {
                    tonic::Status::new(
                        tonic::Code::Unknown,
                        format!("Service was not ready: {}", e.into()),
                    )
                })?;
            let codec = tonic::codec::ProstCodec::default();
            let path = http::uri::PathAndQuery::from_static(
                "/fintekkers.services.security_service.Transaction/ListIDs",
            );
            self.inner.unary(request.into_request(), path, codec).await
        }
        pub async fn validate_create_or_update(
            &mut self,
            request: impl tonic::IntoRequest<
                super::super::super::requests::transaction::CreateTransactionRequestProto,
            >,
        ) -> Result<
            tonic::Response<super::super::super::requests::util::errors::SummaryProto>,
            tonic::Status,
        > {
            self.inner
                .ready()
                .await
                .map_err(|e| {
                    tonic::Status::new(
                        tonic::Code::Unknown,
                        format!("Service was not ready: {}", e.into()),
                    )
                })?;
            let codec = tonic::codec::ProstCodec::default();
            let path = http::uri::PathAndQuery::from_static(
                "/fintekkers.services.security_service.Transaction/ValidateCreateOrUpdate",
            );
            self.inner.unary(request.into_request(), path, codec).await
        }
        pub async fn validate_query_request(
            &mut self,
            request: impl tonic::IntoRequest<
                super::super::super::requests::transaction::QueryTransactionRequestProto,
            >,
        ) -> Result<
            tonic::Response<super::super::super::requests::util::errors::SummaryProto>,
            tonic::Status,
        > {
            self.inner
                .ready()
                .await
                .map_err(|e| {
                    tonic::Status::new(
                        tonic::Code::Unknown,
                        format!("Service was not ready: {}", e.into()),
                    )
                })?;
            let codec = tonic::codec::ProstCodec::default();
            let path = http::uri::PathAndQuery::from_static(
                "/fintekkers.services.security_service.Transaction/ValidateQueryRequest",
            );
            self.inner.unary(request.into_request(), path, codec).await
        }
    }
}
/// Generated server implementations.
pub mod transaction_server {
    #![allow(unused_variables, dead_code, missing_docs, clippy::let_unit_value)]
    use tonic::codegen::*;
    /// Generated trait containing gRPC methods that should be implemented for use with TransactionServer.
    #[async_trait]
    pub trait Transaction: Send + Sync + 'static {
        async fn create_or_update(
            &self,
            request: tonic::Request<
                super::super::super::requests::transaction::CreateTransactionRequestProto,
            >,
        ) -> Result<
            tonic::Response<
                super::super::super::requests::transaction::CreateTransactionResponseProto,
            >,
            tonic::Status,
        >;
        async fn get_by_i_ds(
            &self,
            request: tonic::Request<
                super::super::super::requests::transaction::QueryTransactionRequestProto,
            >,
        ) -> Result<
            tonic::Response<
                super::super::super::requests::transaction::QueryTransactionResponseProto,
            >,
            tonic::Status,
        >;
        /// Server streaming response type for the Search method.
        type SearchStream: futures_core::Stream<
                Item = Result<
                    super::super::super::requests::transaction::QueryTransactionResponseProto,
                    tonic::Status,
                >,
            >
            + Send
            + 'static;
        async fn search(
            &self,
            request: tonic::Request<
                super::super::super::requests::transaction::QueryTransactionRequestProto,
            >,
        ) -> Result<tonic::Response<Self::SearchStream>, tonic::Status>;
        async fn list_i_ds(
            &self,
            request: tonic::Request<
                super::super::super::requests::transaction::QueryTransactionRequestProto,
            >,
        ) -> Result<
            tonic::Response<
                super::super::super::requests::transaction::QueryTransactionResponseProto,
            >,
            tonic::Status,
        >;
        async fn validate_create_or_update(
            &self,
            request: tonic::Request<
                super::super::super::requests::transaction::CreateTransactionRequestProto,
            >,
        ) -> Result<
            tonic::Response<super::super::super::requests::util::errors::SummaryProto>,
            tonic::Status,
        >;
        async fn validate_query_request(
            &self,
            request: tonic::Request<
                super::super::super::requests::transaction::QueryTransactionRequestProto,
            >,
        ) -> Result<
            tonic::Response<super::super::super::requests::util::errors::SummaryProto>,
            tonic::Status,
        >;
    }
    #[derive(Debug)]
    pub struct TransactionServer<T: Transaction> {
        inner: _Inner<T>,
        accept_compression_encodings: EnabledCompressionEncodings,
        send_compression_encodings: EnabledCompressionEncodings,
    }
    struct _Inner<T>(Arc<T>);
    impl<T: Transaction> TransactionServer<T> {
        pub fn new(inner: T) -> Self {
            Self::from_arc(Arc::new(inner))
        }
        pub fn from_arc(inner: Arc<T>) -> Self {
            let inner = _Inner(inner);
            Self {
                inner,
                accept_compression_encodings: Default::default(),
                send_compression_encodings: Default::default(),
            }
        }
        pub fn with_interceptor<F>(
            inner: T,
            interceptor: F,
        ) -> InterceptedService<Self, F>
        where
            F: tonic::service::Interceptor,
        {
            InterceptedService::new(Self::new(inner), interceptor)
        }
        /// Enable decompressing requests with the given encoding.
        #[must_use]
        pub fn accept_compressed(mut self, encoding: CompressionEncoding) -> Self {
            self.accept_compression_encodings.enable(encoding);
            self
        }
        /// Compress responses with the given encoding, if the client supports it.
        #[must_use]
        pub fn send_compressed(mut self, encoding: CompressionEncoding) -> Self {
            self.send_compression_encodings.enable(encoding);
            self
        }
    }
    impl<T, B> tonic::codegen::Service<http::Request<B>> for TransactionServer<T>
    where
        T: Transaction,
        B: Body + Send + 'static,
        B::Error: Into<StdError> + Send + 'static,
    {
        type Response = http::Response<tonic::body::BoxBody>;
        type Error = std::convert::Infallible;
        type Future = BoxFuture<Self::Response, Self::Error>;
        fn poll_ready(
            &mut self,
            _cx: &mut Context<'_>,
        ) -> Poll<Result<(), Self::Error>> {
            Poll::Ready(Ok(()))
        }
        fn call(&mut self, req: http::Request<B>) -> Self::Future {
            let inner = self.inner.clone();
            match req.uri().path() {
                "/fintekkers.services.security_service.Transaction/CreateOrUpdate" => {
                    #[allow(non_camel_case_types)]
                    struct CreateOrUpdateSvc<T: Transaction>(pub Arc<T>);
                    impl<
                        T: Transaction,
                    > tonic::server::UnaryService<
                        super::super::super::requests::transaction::CreateTransactionRequestProto,
                    > for CreateOrUpdateSvc<T> {
                        type Response = super::super::super::requests::transaction::CreateTransactionResponseProto;
                        type Future = BoxFuture<
                            tonic::Response<Self::Response>,
                            tonic::Status,
                        >;
                        fn call(
                            &mut self,
                            request: tonic::Request<
                                super::super::super::requests::transaction::CreateTransactionRequestProto,
                            >,
                        ) -> Self::Future {
                            let inner = self.0.clone();
                            let fut = async move {
                                (*inner).create_or_update(request).await
                            };
                            Box::pin(fut)
                        }
                    }
                    let accept_compression_encodings = self.accept_compression_encodings;
                    let send_compression_encodings = self.send_compression_encodings;
                    let inner = self.inner.clone();
                    let fut = async move {
                        let inner = inner.0;
                        let method = CreateOrUpdateSvc(inner);
                        let codec = tonic::codec::ProstCodec::default();
                        let mut grpc = tonic::server::Grpc::new(codec)
                            .apply_compression_config(
                                accept_compression_encodings,
                                send_compression_encodings,
                            );
                        let res = grpc.unary(method, req).await;
                        Ok(res)
                    };
                    Box::pin(fut)
                }
                "/fintekkers.services.security_service.Transaction/GetByIDs" => {
                    #[allow(non_camel_case_types)]
                    struct GetByIDsSvc<T: Transaction>(pub Arc<T>);
                    impl<
                        T: Transaction,
                    > tonic::server::UnaryService<
                        super::super::super::requests::transaction::QueryTransactionRequestProto,
                    > for GetByIDsSvc<T> {
                        type Response = super::super::super::requests::transaction::QueryTransactionResponseProto;
                        type Future = BoxFuture<
                            tonic::Response<Self::Response>,
                            tonic::Status,
                        >;
                        fn call(
                            &mut self,
                            request: tonic::Request<
                                super::super::super::requests::transaction::QueryTransactionRequestProto,
                            >,
                        ) -> Self::Future {
                            let inner = self.0.clone();
                            let fut = async move { (*inner).get_by_i_ds(request).await };
                            Box::pin(fut)
                        }
                    }
                    let accept_compression_encodings = self.accept_compression_encodings;
                    let send_compression_encodings = self.send_compression_encodings;
                    let inner = self.inner.clone();
                    let fut = async move {
                        let inner = inner.0;
                        let method = GetByIDsSvc(inner);
                        let codec = tonic::codec::ProstCodec::default();
                        let mut grpc = tonic::server::Grpc::new(codec)
                            .apply_compression_config(
                                accept_compression_encodings,
                                send_compression_encodings,
                            );
                        let res = grpc.unary(method, req).await;
                        Ok(res)
                    };
                    Box::pin(fut)
                }
                "/fintekkers.services.security_service.Transaction/Search" => {
                    #[allow(non_camel_case_types)]
                    struct SearchSvc<T: Transaction>(pub Arc<T>);
                    impl<
                        T: Transaction,
                    > tonic::server::ServerStreamingService<
                        super::super::super::requests::transaction::QueryTransactionRequestProto,
                    > for SearchSvc<T> {
                        type Response = super::super::super::requests::transaction::QueryTransactionResponseProto;
                        type ResponseStream = T::SearchStream;
                        type Future = BoxFuture<
                            tonic::Response<Self::ResponseStream>,
                            tonic::Status,
                        >;
                        fn call(
                            &mut self,
                            request: tonic::Request<
                                super::super::super::requests::transaction::QueryTransactionRequestProto,
                            >,
                        ) -> Self::Future {
                            let inner = self.0.clone();
                            let fut = async move { (*inner).search(request).await };
                            Box::pin(fut)
                        }
                    }
                    let accept_compression_encodings = self.accept_compression_encodings;
                    let send_compression_encodings = self.send_compression_encodings;
                    let inner = self.inner.clone();
                    let fut = async move {
                        let inner = inner.0;
                        let method = SearchSvc(inner);
                        let codec = tonic::codec::ProstCodec::default();
                        let mut grpc = tonic::server::Grpc::new(codec)
                            .apply_compression_config(
                                accept_compression_encodings,
                                send_compression_encodings,
                            );
                        let res = grpc.server_streaming(method, req).await;
                        Ok(res)
                    };
                    Box::pin(fut)
                }
                "/fintekkers.services.security_service.Transaction/ListIDs" => {
                    #[allow(non_camel_case_types)]
                    struct ListIDsSvc<T: Transaction>(pub Arc<T>);
                    impl<
                        T: Transaction,
                    > tonic::server::UnaryService<
                        super::super::super::requests::transaction::QueryTransactionRequestProto,
                    > for ListIDsSvc<T> {
                        type Response = super::super::super::requests::transaction::QueryTransactionResponseProto;
                        type Future = BoxFuture<
                            tonic::Response<Self::Response>,
                            tonic::Status,
                        >;
                        fn call(
                            &mut self,
                            request: tonic::Request<
                                super::super::super::requests::transaction::QueryTransactionRequestProto,
                            >,
                        ) -> Self::Future {
                            let inner = self.0.clone();
                            let fut = async move { (*inner).list_i_ds(request).await };
                            Box::pin(fut)
                        }
                    }
                    let accept_compression_encodings = self.accept_compression_encodings;
                    let send_compression_encodings = self.send_compression_encodings;
                    let inner = self.inner.clone();
                    let fut = async move {
                        let inner = inner.0;
                        let method = ListIDsSvc(inner);
                        let codec = tonic::codec::ProstCodec::default();
                        let mut grpc = tonic::server::Grpc::new(codec)
                            .apply_compression_config(
                                accept_compression_encodings,
                                send_compression_encodings,
                            );
                        let res = grpc.unary(method, req).await;
                        Ok(res)
                    };
                    Box::pin(fut)
                }
                "/fintekkers.services.security_service.Transaction/ValidateCreateOrUpdate" => {
                    #[allow(non_camel_case_types)]
                    struct ValidateCreateOrUpdateSvc<T: Transaction>(pub Arc<T>);
                    impl<
                        T: Transaction,
                    > tonic::server::UnaryService<
                        super::super::super::requests::transaction::CreateTransactionRequestProto,
                    > for ValidateCreateOrUpdateSvc<T> {
                        type Response = super::super::super::requests::util::errors::SummaryProto;
                        type Future = BoxFuture<
                            tonic::Response<Self::Response>,
                            tonic::Status,
                        >;
                        fn call(
                            &mut self,
                            request: tonic::Request<
                                super::super::super::requests::transaction::CreateTransactionRequestProto,
                            >,
                        ) -> Self::Future {
                            let inner = self.0.clone();
                            let fut = async move {
                                (*inner).validate_create_or_update(request).await
                            };
                            Box::pin(fut)
                        }
                    }
                    let accept_compression_encodings = self.accept_compression_encodings;
                    let send_compression_encodings = self.send_compression_encodings;
                    let inner = self.inner.clone();
                    let fut = async move {
                        let inner = inner.0;
                        let method = ValidateCreateOrUpdateSvc(inner);
                        let codec = tonic::codec::ProstCodec::default();
                        let mut grpc = tonic::server::Grpc::new(codec)
                            .apply_compression_config(
                                accept_compression_encodings,
                                send_compression_encodings,
                            );
                        let res = grpc.unary(method, req).await;
                        Ok(res)
                    };
                    Box::pin(fut)
                }
                "/fintekkers.services.security_service.Transaction/ValidateQueryRequest" => {
                    #[allow(non_camel_case_types)]
                    struct ValidateQueryRequestSvc<T: Transaction>(pub Arc<T>);
                    impl<
                        T: Transaction,
                    > tonic::server::UnaryService<
                        super::super::super::requests::transaction::QueryTransactionRequestProto,
                    > for ValidateQueryRequestSvc<T> {
                        type Response = super::super::super::requests::util::errors::SummaryProto;
                        type Future = BoxFuture<
                            tonic::Response<Self::Response>,
                            tonic::Status,
                        >;
                        fn call(
                            &mut self,
                            request: tonic::Request<
                                super::super::super::requests::transaction::QueryTransactionRequestProto,
                            >,
                        ) -> Self::Future {
                            let inner = self.0.clone();
                            let fut = async move {
                                (*inner).validate_query_request(request).await
                            };
                            Box::pin(fut)
                        }
                    }
                    let accept_compression_encodings = self.accept_compression_encodings;
                    let send_compression_encodings = self.send_compression_encodings;
                    let inner = self.inner.clone();
                    let fut = async move {
                        let inner = inner.0;
                        let method = ValidateQueryRequestSvc(inner);
                        let codec = tonic::codec::ProstCodec::default();
                        let mut grpc = tonic::server::Grpc::new(codec)
                            .apply_compression_config(
                                accept_compression_encodings,
                                send_compression_encodings,
                            );
                        let res = grpc.unary(method, req).await;
                        Ok(res)
                    };
                    Box::pin(fut)
                }
                _ => {
                    Box::pin(async move {
                        Ok(
                            http::Response::builder()
                                .status(200)
                                .header("grpc-status", "12")
                                .header("content-type", "application/grpc")
                                .body(empty_body())
                                .unwrap(),
                        )
                    })
                }
            }
        }
    }
    impl<T: Transaction> Clone for TransactionServer<T> {
        fn clone(&self) -> Self {
            let inner = self.inner.clone();
            Self {
                inner,
                accept_compression_encodings: self.accept_compression_encodings,
                send_compression_encodings: self.send_compression_encodings,
            }
        }
    }
    impl<T: Transaction> Clone for _Inner<T> {
        fn clone(&self) -> Self {
            Self(self.0.clone())
        }
    }
    impl<T: std::fmt::Debug> std::fmt::Debug for _Inner<T> {
        fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
            write!(f, "{:?}", self.0)
        }
    }
    impl<T: Transaction> tonic::server::NamedService for TransactionServer<T> {
        const NAME: &'static str = "fintekkers.services.security_service.Transaction";
    }
}
/// Generated client implementations.
pub mod security_client {
    #![allow(unused_variables, dead_code, missing_docs, clippy::let_unit_value)]
    use tonic::codegen::*;
    use tonic::codegen::http::Uri;
    #[derive(Debug, Clone)]
    pub struct SecurityClient<T> {
        inner: tonic::client::Grpc<T>,
    }
    impl SecurityClient<tonic::transport::Channel> {
        /// Attempt to create a new client by connecting to a given endpoint.
        pub async fn connect<D>(dst: D) -> Result<Self, tonic::transport::Error>
        where
            D: std::convert::TryInto<tonic::transport::Endpoint>,
            D::Error: Into<StdError>,
        {
            let conn = tonic::transport::Endpoint::new(dst)?.connect().await?;
            Ok(Self::new(conn))
        }
    }
    impl<T> SecurityClient<T>
    where
        T: tonic::client::GrpcService<tonic::body::BoxBody>,
        T::Error: Into<StdError>,
        T::ResponseBody: Body<Data = Bytes> + Send + 'static,
        <T::ResponseBody as Body>::Error: Into<StdError> + Send,
    {
        pub fn new(inner: T) -> Self {
            let inner = tonic::client::Grpc::new(inner);
            Self { inner }
        }
        pub fn with_origin(inner: T, origin: Uri) -> Self {
            let inner = tonic::client::Grpc::with_origin(inner, origin);
            Self { inner }
        }
        pub fn with_interceptor<F>(
            inner: T,
            interceptor: F,
        ) -> SecurityClient<InterceptedService<T, F>>
        where
            F: tonic::service::Interceptor,
            T::ResponseBody: Default,
            T: tonic::codegen::Service<
                http::Request<tonic::body::BoxBody>,
                Response = http::Response<
                    <T as tonic::client::GrpcService<tonic::body::BoxBody>>::ResponseBody,
                >,
            >,
            <T as tonic::codegen::Service<
                http::Request<tonic::body::BoxBody>,
            >>::Error: Into<StdError> + Send + Sync,
        {
            SecurityClient::new(InterceptedService::new(inner, interceptor))
        }
        /// Compress requests with the given encoding.
        ///
        /// This requires the server to support it otherwise it might respond with an
        /// error.
        #[must_use]
        pub fn send_compressed(mut self, encoding: CompressionEncoding) -> Self {
            self.inner = self.inner.send_compressed(encoding);
            self
        }
        /// Enable decompressing responses.
        #[must_use]
        pub fn accept_compressed(mut self, encoding: CompressionEncoding) -> Self {
            self.inner = self.inner.accept_compressed(encoding);
            self
        }
        pub async fn create_or_update(
            &mut self,
            request: impl tonic::IntoRequest<
                super::super::super::requests::security::CreateSecurityRequestProto,
            >,
        ) -> Result<
            tonic::Response<
                super::super::super::requests::security::CreateSecurityResponseProto,
            >,
            tonic::Status,
        > {
            self.inner
                .ready()
                .await
                .map_err(|e| {
                    tonic::Status::new(
                        tonic::Code::Unknown,
                        format!("Service was not ready: {}", e.into()),
                    )
                })?;
            let codec = tonic::codec::ProstCodec::default();
            let path = http::uri::PathAndQuery::from_static(
                "/fintekkers.services.security_service.Security/CreateOrUpdate",
            );
            self.inner.unary(request.into_request(), path, codec).await
        }
        pub async fn get_by_i_ds(
            &mut self,
            request: impl tonic::IntoRequest<
                super::super::super::requests::security::QuerySecurityRequestProto,
            >,
        ) -> Result<
            tonic::Response<
                super::super::super::requests::security::QuerySecurityResponseProto,
            >,
            tonic::Status,
        > {
            self.inner
                .ready()
                .await
                .map_err(|e| {
                    tonic::Status::new(
                        tonic::Code::Unknown,
                        format!("Service was not ready: {}", e.into()),
                    )
                })?;
            let codec = tonic::codec::ProstCodec::default();
            let path = http::uri::PathAndQuery::from_static(
                "/fintekkers.services.security_service.Security/GetByIDs",
            );
            self.inner.unary(request.into_request(), path, codec).await
        }
        pub async fn search(
            &mut self,
            request: impl tonic::IntoRequest<
                super::super::super::requests::security::QuerySecurityRequestProto,
            >,
        ) -> Result<
            tonic::Response<
                tonic::codec::Streaming<
                    super::super::super::requests::security::QuerySecurityResponseProto,
                >,
            >,
            tonic::Status,
        > {
            self.inner
                .ready()
                .await
                .map_err(|e| {
                    tonic::Status::new(
                        tonic::Code::Unknown,
                        format!("Service was not ready: {}", e.into()),
                    )
                })?;
            let codec = tonic::codec::ProstCodec::default();
            let path = http::uri::PathAndQuery::from_static(
                "/fintekkers.services.security_service.Security/Search",
            );
            self.inner.server_streaming(request.into_request(), path, codec).await
        }
        pub async fn list_i_ds(
            &mut self,
            request: impl tonic::IntoRequest<
                super::super::super::requests::security::QuerySecurityRequestProto,
            >,
        ) -> Result<
            tonic::Response<
                super::super::super::requests::security::QuerySecurityResponseProto,
            >,
            tonic::Status,
        > {
            self.inner
                .ready()
                .await
                .map_err(|e| {
                    tonic::Status::new(
                        tonic::Code::Unknown,
                        format!("Service was not ready: {}", e.into()),
                    )
                })?;
            let codec = tonic::codec::ProstCodec::default();
            let path = http::uri::PathAndQuery::from_static(
                "/fintekkers.services.security_service.Security/ListIDs",
            );
            self.inner.unary(request.into_request(), path, codec).await
        }
        pub async fn validate_create_or_update(
            &mut self,
            request: impl tonic::IntoRequest<
                super::super::super::requests::security::CreateSecurityRequestProto,
            >,
        ) -> Result<
            tonic::Response<super::super::super::requests::util::errors::SummaryProto>,
            tonic::Status,
        > {
            self.inner
                .ready()
                .await
                .map_err(|e| {
                    tonic::Status::new(
                        tonic::Code::Unknown,
                        format!("Service was not ready: {}", e.into()),
                    )
                })?;
            let codec = tonic::codec::ProstCodec::default();
            let path = http::uri::PathAndQuery::from_static(
                "/fintekkers.services.security_service.Security/ValidateCreateOrUpdate",
            );
            self.inner.unary(request.into_request(), path, codec).await
        }
        pub async fn validate_query_request(
            &mut self,
            request: impl tonic::IntoRequest<
                super::super::super::requests::security::QuerySecurityRequestProto,
            >,
        ) -> Result<
            tonic::Response<super::super::super::requests::util::errors::SummaryProto>,
            tonic::Status,
        > {
            self.inner
                .ready()
                .await
                .map_err(|e| {
                    tonic::Status::new(
                        tonic::Code::Unknown,
                        format!("Service was not ready: {}", e.into()),
                    )
                })?;
            let codec = tonic::codec::ProstCodec::default();
            let path = http::uri::PathAndQuery::from_static(
                "/fintekkers.services.security_service.Security/ValidateQueryRequest",
            );
            self.inner.unary(request.into_request(), path, codec).await
        }
    }
}
/// Generated server implementations.
pub mod security_server {
    #![allow(unused_variables, dead_code, missing_docs, clippy::let_unit_value)]
    use tonic::codegen::*;
    /// Generated trait containing gRPC methods that should be implemented for use with SecurityServer.
    #[async_trait]
    pub trait Security: Send + Sync + 'static {
        async fn create_or_update(
            &self,
            request: tonic::Request<
                super::super::super::requests::security::CreateSecurityRequestProto,
            >,
        ) -> Result<
            tonic::Response<
                super::super::super::requests::security::CreateSecurityResponseProto,
            >,
            tonic::Status,
        >;
        async fn get_by_i_ds(
            &self,
            request: tonic::Request<
                super::super::super::requests::security::QuerySecurityRequestProto,
            >,
        ) -> Result<
            tonic::Response<
                super::super::super::requests::security::QuerySecurityResponseProto,
            >,
            tonic::Status,
        >;
        /// Server streaming response type for the Search method.
        type SearchStream: futures_core::Stream<
                Item = Result<
                    super::super::super::requests::security::QuerySecurityResponseProto,
                    tonic::Status,
                >,
            >
            + Send
            + 'static;
        async fn search(
            &self,
            request: tonic::Request<
                super::super::super::requests::security::QuerySecurityRequestProto,
            >,
        ) -> Result<tonic::Response<Self::SearchStream>, tonic::Status>;
        async fn list_i_ds(
            &self,
            request: tonic::Request<
                super::super::super::requests::security::QuerySecurityRequestProto,
            >,
        ) -> Result<
            tonic::Response<
                super::super::super::requests::security::QuerySecurityResponseProto,
            >,
            tonic::Status,
        >;
        async fn validate_create_or_update(
            &self,
            request: tonic::Request<
                super::super::super::requests::security::CreateSecurityRequestProto,
            >,
        ) -> Result<
            tonic::Response<super::super::super::requests::util::errors::SummaryProto>,
            tonic::Status,
        >;
        async fn validate_query_request(
            &self,
            request: tonic::Request<
                super::super::super::requests::security::QuerySecurityRequestProto,
            >,
        ) -> Result<
            tonic::Response<super::super::super::requests::util::errors::SummaryProto>,
            tonic::Status,
        >;
    }
    #[derive(Debug)]
    pub struct SecurityServer<T: Security> {
        inner: _Inner<T>,
        accept_compression_encodings: EnabledCompressionEncodings,
        send_compression_encodings: EnabledCompressionEncodings,
    }
    struct _Inner<T>(Arc<T>);
    impl<T: Security> SecurityServer<T> {
        pub fn new(inner: T) -> Self {
            Self::from_arc(Arc::new(inner))
        }
        pub fn from_arc(inner: Arc<T>) -> Self {
            let inner = _Inner(inner);
            Self {
                inner,
                accept_compression_encodings: Default::default(),
                send_compression_encodings: Default::default(),
            }
        }
        pub fn with_interceptor<F>(
            inner: T,
            interceptor: F,
        ) -> InterceptedService<Self, F>
        where
            F: tonic::service::Interceptor,
        {
            InterceptedService::new(Self::new(inner), interceptor)
        }
        /// Enable decompressing requests with the given encoding.
        #[must_use]
        pub fn accept_compressed(mut self, encoding: CompressionEncoding) -> Self {
            self.accept_compression_encodings.enable(encoding);
            self
        }
        /// Compress responses with the given encoding, if the client supports it.
        #[must_use]
        pub fn send_compressed(mut self, encoding: CompressionEncoding) -> Self {
            self.send_compression_encodings.enable(encoding);
            self
        }
    }
    impl<T, B> tonic::codegen::Service<http::Request<B>> for SecurityServer<T>
    where
        T: Security,
        B: Body + Send + 'static,
        B::Error: Into<StdError> + Send + 'static,
    {
        type Response = http::Response<tonic::body::BoxBody>;
        type Error = std::convert::Infallible;
        type Future = BoxFuture<Self::Response, Self::Error>;
        fn poll_ready(
            &mut self,
            _cx: &mut Context<'_>,
        ) -> Poll<Result<(), Self::Error>> {
            Poll::Ready(Ok(()))
        }
        fn call(&mut self, req: http::Request<B>) -> Self::Future {
            let inner = self.inner.clone();
            match req.uri().path() {
                "/fintekkers.services.security_service.Security/CreateOrUpdate" => {
                    #[allow(non_camel_case_types)]
                    struct CreateOrUpdateSvc<T: Security>(pub Arc<T>);
                    impl<
                        T: Security,
                    > tonic::server::UnaryService<
                        super::super::super::requests::security::CreateSecurityRequestProto,
                    > for CreateOrUpdateSvc<T> {
                        type Response = super::super::super::requests::security::CreateSecurityResponseProto;
                        type Future = BoxFuture<
                            tonic::Response<Self::Response>,
                            tonic::Status,
                        >;
                        fn call(
                            &mut self,
                            request: tonic::Request<
                                super::super::super::requests::security::CreateSecurityRequestProto,
                            >,
                        ) -> Self::Future {
                            let inner = self.0.clone();
                            let fut = async move {
                                (*inner).create_or_update(request).await
                            };
                            Box::pin(fut)
                        }
                    }
                    let accept_compression_encodings = self.accept_compression_encodings;
                    let send_compression_encodings = self.send_compression_encodings;
                    let inner = self.inner.clone();
                    let fut = async move {
                        let inner = inner.0;
                        let method = CreateOrUpdateSvc(inner);
                        let codec = tonic::codec::ProstCodec::default();
                        let mut grpc = tonic::server::Grpc::new(codec)
                            .apply_compression_config(
                                accept_compression_encodings,
                                send_compression_encodings,
                            );
                        let res = grpc.unary(method, req).await;
                        Ok(res)
                    };
                    Box::pin(fut)
                }
                "/fintekkers.services.security_service.Security/GetByIDs" => {
                    #[allow(non_camel_case_types)]
                    struct GetByIDsSvc<T: Security>(pub Arc<T>);
                    impl<
                        T: Security,
                    > tonic::server::UnaryService<
                        super::super::super::requests::security::QuerySecurityRequestProto,
                    > for GetByIDsSvc<T> {
                        type Response = super::super::super::requests::security::QuerySecurityResponseProto;
                        type Future = BoxFuture<
                            tonic::Response<Self::Response>,
                            tonic::Status,
                        >;
                        fn call(
                            &mut self,
                            request: tonic::Request<
                                super::super::super::requests::security::QuerySecurityRequestProto,
                            >,
                        ) -> Self::Future {
                            let inner = self.0.clone();
                            let fut = async move { (*inner).get_by_i_ds(request).await };
                            Box::pin(fut)
                        }
                    }
                    let accept_compression_encodings = self.accept_compression_encodings;
                    let send_compression_encodings = self.send_compression_encodings;
                    let inner = self.inner.clone();
                    let fut = async move {
                        let inner = inner.0;
                        let method = GetByIDsSvc(inner);
                        let codec = tonic::codec::ProstCodec::default();
                        let mut grpc = tonic::server::Grpc::new(codec)
                            .apply_compression_config(
                                accept_compression_encodings,
                                send_compression_encodings,
                            );
                        let res = grpc.unary(method, req).await;
                        Ok(res)
                    };
                    Box::pin(fut)
                }
                "/fintekkers.services.security_service.Security/Search" => {
                    #[allow(non_camel_case_types)]
                    struct SearchSvc<T: Security>(pub Arc<T>);
                    impl<
                        T: Security,
                    > tonic::server::ServerStreamingService<
                        super::super::super::requests::security::QuerySecurityRequestProto,
                    > for SearchSvc<T> {
                        type Response = super::super::super::requests::security::QuerySecurityResponseProto;
                        type ResponseStream = T::SearchStream;
                        type Future = BoxFuture<
                            tonic::Response<Self::ResponseStream>,
                            tonic::Status,
                        >;
                        fn call(
                            &mut self,
                            request: tonic::Request<
                                super::super::super::requests::security::QuerySecurityRequestProto,
                            >,
                        ) -> Self::Future {
                            let inner = self.0.clone();
                            let fut = async move { (*inner).search(request).await };
                            Box::pin(fut)
                        }
                    }
                    let accept_compression_encodings = self.accept_compression_encodings;
                    let send_compression_encodings = self.send_compression_encodings;
                    let inner = self.inner.clone();
                    let fut = async move {
                        let inner = inner.0;
                        let method = SearchSvc(inner);
                        let codec = tonic::codec::ProstCodec::default();
                        let mut grpc = tonic::server::Grpc::new(codec)
                            .apply_compression_config(
                                accept_compression_encodings,
                                send_compression_encodings,
                            );
                        let res = grpc.server_streaming(method, req).await;
                        Ok(res)
                    };
                    Box::pin(fut)
                }
                "/fintekkers.services.security_service.Security/ListIDs" => {
                    #[allow(non_camel_case_types)]
                    struct ListIDsSvc<T: Security>(pub Arc<T>);
                    impl<
                        T: Security,
                    > tonic::server::UnaryService<
                        super::super::super::requests::security::QuerySecurityRequestProto,
                    > for ListIDsSvc<T> {
                        type Response = super::super::super::requests::security::QuerySecurityResponseProto;
                        type Future = BoxFuture<
                            tonic::Response<Self::Response>,
                            tonic::Status,
                        >;
                        fn call(
                            &mut self,
                            request: tonic::Request<
                                super::super::super::requests::security::QuerySecurityRequestProto,
                            >,
                        ) -> Self::Future {
                            let inner = self.0.clone();
                            let fut = async move { (*inner).list_i_ds(request).await };
                            Box::pin(fut)
                        }
                    }
                    let accept_compression_encodings = self.accept_compression_encodings;
                    let send_compression_encodings = self.send_compression_encodings;
                    let inner = self.inner.clone();
                    let fut = async move {
                        let inner = inner.0;
                        let method = ListIDsSvc(inner);
                        let codec = tonic::codec::ProstCodec::default();
                        let mut grpc = tonic::server::Grpc::new(codec)
                            .apply_compression_config(
                                accept_compression_encodings,
                                send_compression_encodings,
                            );
                        let res = grpc.unary(method, req).await;
                        Ok(res)
                    };
                    Box::pin(fut)
                }
                "/fintekkers.services.security_service.Security/ValidateCreateOrUpdate" => {
                    #[allow(non_camel_case_types)]
                    struct ValidateCreateOrUpdateSvc<T: Security>(pub Arc<T>);
                    impl<
                        T: Security,
                    > tonic::server::UnaryService<
                        super::super::super::requests::security::CreateSecurityRequestProto,
                    > for ValidateCreateOrUpdateSvc<T> {
                        type Response = super::super::super::requests::util::errors::SummaryProto;
                        type Future = BoxFuture<
                            tonic::Response<Self::Response>,
                            tonic::Status,
                        >;
                        fn call(
                            &mut self,
                            request: tonic::Request<
                                super::super::super::requests::security::CreateSecurityRequestProto,
                            >,
                        ) -> Self::Future {
                            let inner = self.0.clone();
                            let fut = async move {
                                (*inner).validate_create_or_update(request).await
                            };
                            Box::pin(fut)
                        }
                    }
                    let accept_compression_encodings = self.accept_compression_encodings;
                    let send_compression_encodings = self.send_compression_encodings;
                    let inner = self.inner.clone();
                    let fut = async move {
                        let inner = inner.0;
                        let method = ValidateCreateOrUpdateSvc(inner);
                        let codec = tonic::codec::ProstCodec::default();
                        let mut grpc = tonic::server::Grpc::new(codec)
                            .apply_compression_config(
                                accept_compression_encodings,
                                send_compression_encodings,
                            );
                        let res = grpc.unary(method, req).await;
                        Ok(res)
                    };
                    Box::pin(fut)
                }
                "/fintekkers.services.security_service.Security/ValidateQueryRequest" => {
                    #[allow(non_camel_case_types)]
                    struct ValidateQueryRequestSvc<T: Security>(pub Arc<T>);
                    impl<
                        T: Security,
                    > tonic::server::UnaryService<
                        super::super::super::requests::security::QuerySecurityRequestProto,
                    > for ValidateQueryRequestSvc<T> {
                        type Response = super::super::super::requests::util::errors::SummaryProto;
                        type Future = BoxFuture<
                            tonic::Response<Self::Response>,
                            tonic::Status,
                        >;
                        fn call(
                            &mut self,
                            request: tonic::Request<
                                super::super::super::requests::security::QuerySecurityRequestProto,
                            >,
                        ) -> Self::Future {
                            let inner = self.0.clone();
                            let fut = async move {
                                (*inner).validate_query_request(request).await
                            };
                            Box::pin(fut)
                        }
                    }
                    let accept_compression_encodings = self.accept_compression_encodings;
                    let send_compression_encodings = self.send_compression_encodings;
                    let inner = self.inner.clone();
                    let fut = async move {
                        let inner = inner.0;
                        let method = ValidateQueryRequestSvc(inner);
                        let codec = tonic::codec::ProstCodec::default();
                        let mut grpc = tonic::server::Grpc::new(codec)
                            .apply_compression_config(
                                accept_compression_encodings,
                                send_compression_encodings,
                            );
                        let res = grpc.unary(method, req).await;
                        Ok(res)
                    };
                    Box::pin(fut)
                }
                _ => {
                    Box::pin(async move {
                        Ok(
                            http::Response::builder()
                                .status(200)
                                .header("grpc-status", "12")
                                .header("content-type", "application/grpc")
                                .body(empty_body())
                                .unwrap(),
                        )
                    })
                }
            }
        }
    }
    impl<T: Security> Clone for SecurityServer<T> {
        fn clone(&self) -> Self {
            let inner = self.inner.clone();
            Self {
                inner,
                accept_compression_encodings: self.accept_compression_encodings,
                send_compression_encodings: self.send_compression_encodings,
            }
        }
    }
    impl<T: Security> Clone for _Inner<T> {
        fn clone(&self) -> Self {
            Self(self.0.clone())
        }
    }
    impl<T: std::fmt::Debug> std::fmt::Debug for _Inner<T> {
        fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
            write!(f, "{:?}", self.0)
        }
    }
    impl<T: Security> tonic::server::NamedService for SecurityServer<T> {
        const NAME: &'static str = "fintekkers.services.security_service.Security";
    }
}
