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
                super::super::security::CreateSecurityRequestProto,
            >,
        ) -> Result<
            tonic::Response<super::super::security::CreateSecurityResponseProto>,
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
                "/security_service.Security/CreateOrUpdate",
            );
            self.inner.unary(request.into_request(), path, codec).await
        }
        pub async fn get_by_i_ds(
            &mut self,
            request: impl tonic::IntoRequest<
                super::super::security::QuerySecurityRequestProto,
            >,
        ) -> Result<
            tonic::Response<super::super::security::QuerySecurityResponseProto>,
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
                "/security_service.Security/GetByIDs",
            );
            self.inner.unary(request.into_request(), path, codec).await
        }
        pub async fn search(
            &mut self,
            request: impl tonic::IntoRequest<
                super::super::security::QuerySecurityRequestProto,
            >,
        ) -> Result<
            tonic::Response<super::super::security::QuerySecurityResponseProto>,
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
                "/security_service.Security/Search",
            );
            self.inner.unary(request.into_request(), path, codec).await
        }
        pub async fn list_i_ds(
            &mut self,
            request: impl tonic::IntoRequest<
                super::super::security::QuerySecurityRequestProto,
            >,
        ) -> Result<
            tonic::Response<super::super::security::QuerySecurityResponseProto>,
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
                "/security_service.Security/ListIDs",
            );
            self.inner.unary(request.into_request(), path, codec).await
        }
        pub async fn validate_create_or_update(
            &mut self,
            request: impl tonic::IntoRequest<
                super::super::security::QuerySecurityRequestProto,
            >,
        ) -> Result<
            tonic::Response<super::super::util::errors::Summary>,
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
                "/security_service.Security/ValidateCreateOrUpdate",
            );
            self.inner.unary(request.into_request(), path, codec).await
        }
        pub async fn validate_query_request(
            &mut self,
            request: impl tonic::IntoRequest<
                super::super::security::QuerySecurityRequestProto,
            >,
        ) -> Result<
            tonic::Response<super::super::util::errors::Summary>,
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
                "/security_service.Security/ValidateQueryRequest",
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
            request: tonic::Request<super::super::security::CreateSecurityRequestProto>,
        ) -> Result<
            tonic::Response<super::super::security::CreateSecurityResponseProto>,
            tonic::Status,
        >;
        async fn get_by_i_ds(
            &self,
            request: tonic::Request<super::super::security::QuerySecurityRequestProto>,
        ) -> Result<
            tonic::Response<super::super::security::QuerySecurityResponseProto>,
            tonic::Status,
        >;
        async fn search(
            &self,
            request: tonic::Request<super::super::security::QuerySecurityRequestProto>,
        ) -> Result<
            tonic::Response<super::super::security::QuerySecurityResponseProto>,
            tonic::Status,
        >;
        async fn list_i_ds(
            &self,
            request: tonic::Request<super::super::security::QuerySecurityRequestProto>,
        ) -> Result<
            tonic::Response<super::super::security::QuerySecurityResponseProto>,
            tonic::Status,
        >;
        async fn validate_create_or_update(
            &self,
            request: tonic::Request<super::super::security::QuerySecurityRequestProto>,
        ) -> Result<tonic::Response<super::super::util::errors::Summary>, tonic::Status>;
        async fn validate_query_request(
            &self,
            request: tonic::Request<super::super::security::QuerySecurityRequestProto>,
        ) -> Result<tonic::Response<super::super::util::errors::Summary>, tonic::Status>;
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
                "/security_service.Security/CreateOrUpdate" => {
                    #[allow(non_camel_case_types)]
                    struct CreateOrUpdateSvc<T: Security>(pub Arc<T>);
                    impl<
                        T: Security,
                    > tonic::server::UnaryService<
                        super::super::security::CreateSecurityRequestProto,
                    > for CreateOrUpdateSvc<T> {
                        type Response = super::super::security::CreateSecurityResponseProto;
                        type Future = BoxFuture<
                            tonic::Response<Self::Response>,
                            tonic::Status,
                        >;
                        fn call(
                            &mut self,
                            request: tonic::Request<
                                super::super::security::CreateSecurityRequestProto,
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
                "/security_service.Security/GetByIDs" => {
                    #[allow(non_camel_case_types)]
                    struct GetByIDsSvc<T: Security>(pub Arc<T>);
                    impl<
                        T: Security,
                    > tonic::server::UnaryService<
                        super::super::security::QuerySecurityRequestProto,
                    > for GetByIDsSvc<T> {
                        type Response = super::super::security::QuerySecurityResponseProto;
                        type Future = BoxFuture<
                            tonic::Response<Self::Response>,
                            tonic::Status,
                        >;
                        fn call(
                            &mut self,
                            request: tonic::Request<
                                super::super::security::QuerySecurityRequestProto,
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
                "/security_service.Security/Search" => {
                    #[allow(non_camel_case_types)]
                    struct SearchSvc<T: Security>(pub Arc<T>);
                    impl<
                        T: Security,
                    > tonic::server::UnaryService<
                        super::super::security::QuerySecurityRequestProto,
                    > for SearchSvc<T> {
                        type Response = super::super::security::QuerySecurityResponseProto;
                        type Future = BoxFuture<
                            tonic::Response<Self::Response>,
                            tonic::Status,
                        >;
                        fn call(
                            &mut self,
                            request: tonic::Request<
                                super::super::security::QuerySecurityRequestProto,
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
                        let res = grpc.unary(method, req).await;
                        Ok(res)
                    };
                    Box::pin(fut)
                }
                "/security_service.Security/ListIDs" => {
                    #[allow(non_camel_case_types)]
                    struct ListIDsSvc<T: Security>(pub Arc<T>);
                    impl<
                        T: Security,
                    > tonic::server::UnaryService<
                        super::super::security::QuerySecurityRequestProto,
                    > for ListIDsSvc<T> {
                        type Response = super::super::security::QuerySecurityResponseProto;
                        type Future = BoxFuture<
                            tonic::Response<Self::Response>,
                            tonic::Status,
                        >;
                        fn call(
                            &mut self,
                            request: tonic::Request<
                                super::super::security::QuerySecurityRequestProto,
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
                "/security_service.Security/ValidateCreateOrUpdate" => {
                    #[allow(non_camel_case_types)]
                    struct ValidateCreateOrUpdateSvc<T: Security>(pub Arc<T>);
                    impl<
                        T: Security,
                    > tonic::server::UnaryService<
                        super::super::security::QuerySecurityRequestProto,
                    > for ValidateCreateOrUpdateSvc<T> {
                        type Response = super::super::util::errors::Summary;
                        type Future = BoxFuture<
                            tonic::Response<Self::Response>,
                            tonic::Status,
                        >;
                        fn call(
                            &mut self,
                            request: tonic::Request<
                                super::super::security::QuerySecurityRequestProto,
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
                "/security_service.Security/ValidateQueryRequest" => {
                    #[allow(non_camel_case_types)]
                    struct ValidateQueryRequestSvc<T: Security>(pub Arc<T>);
                    impl<
                        T: Security,
                    > tonic::server::UnaryService<
                        super::super::security::QuerySecurityRequestProto,
                    > for ValidateQueryRequestSvc<T> {
                        type Response = super::super::util::errors::Summary;
                        type Future = BoxFuture<
                            tonic::Response<Self::Response>,
                            tonic::Status,
                        >;
                        fn call(
                            &mut self,
                            request: tonic::Request<
                                super::super::security::QuerySecurityRequestProto,
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
        const NAME: &'static str = "security_service.Security";
    }
}
