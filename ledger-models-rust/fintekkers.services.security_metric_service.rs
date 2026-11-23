/// Generated client implementations.
pub mod security_metric_client {
    #![allow(unused_variables, dead_code, missing_docs, clippy::let_unit_value)]
    use tonic::codegen::*;
    use tonic::codegen::http::Uri;
    /// Dated security metrics (LM-482): figures about a security that are not
    /// prices, such as shares outstanding, NAV per share and total net assets.
    /// Hosted in price-service-rust (PSR-53). See docs/adr/security_metric.md.
    ///
    /// The rules every RPC follows:
    ///   - Units are per metric, on SecurityMetricTypeProto: a whole share count,
    ///     or an amount in the security's currency.
    ///   - Absent is unknown: an observation that does not exist is left out of a
    ///     response, never sent as 0.
    ///   - A correction for the same (security_id, metric, observation_date) is a
    ///     new version with a later as_of. Reads return only the latest as_of
    ///     version of each.
    ///   - INVALID_ARGUMENT for an unset security_id (Search, CreateOrUpdate), an
    ///     unset date (GetLatest), a metric of UNKNOWN_SECURITY_METRIC, an unset
    ///     value or observation_date on write, or a from_date after to_date.
    #[derive(Debug, Clone)]
    pub struct SecurityMetricClient<T> {
        inner: tonic::client::Grpc<T>,
    }
    impl SecurityMetricClient<tonic::transport::Channel> {
        /// Attempt to create a new client by connecting to a given endpoint.
        pub async fn connect<D>(dst: D) -> Result<Self, tonic::transport::Error>
        where
            D: TryInto<tonic::transport::Endpoint>,
            D::Error: Into<StdError>,
        {
            let conn = tonic::transport::Endpoint::new(dst)?.connect().await?;
            Ok(Self::new(conn))
        }
    }
    impl<T> SecurityMetricClient<T>
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
        ) -> SecurityMetricClient<InterceptedService<T, F>>
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
            SecurityMetricClient::new(InterceptedService::new(inner, interceptor))
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
        /// Limits the maximum size of a decoded message.
        ///
        /// Default: `4MB`
        #[must_use]
        pub fn max_decoding_message_size(mut self, limit: usize) -> Self {
            self.inner = self.inner.max_decoding_message_size(limit);
            self
        }
        /// Limits the maximum size of an encoded message.
        ///
        /// Default: `usize::MAX`
        #[must_use]
        pub fn max_encoding_message_size(mut self, limit: usize) -> Self {
            self.inner = self.inner.max_encoding_message_size(limit);
            self
        }
        /// Store one observation. A write for an existing (security_id, metric,
        /// observation_date) is a correction, stored as a new version with a later
        /// as_of.
        pub async fn create_or_update(
            &mut self,
            request: impl tonic::IntoRequest<
                super::super::super::requests::security_metric::CreateSecurityMetricRequestProto,
            >,
        ) -> std::result::Result<
            tonic::Response<
                super::super::super::requests::security_metric::CreateSecurityMetricResponseProto,
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
                "/fintekkers.services.security_metric_service.SecurityMetric/CreateOrUpdate",
            );
            let mut req = request.into_request();
            req.extensions_mut()
                .insert(
                    GrpcMethod::new(
                        "fintekkers.services.security_metric_service.SecurityMetric",
                        "CreateOrUpdate",
                    ),
                );
            self.inner.unary(req, path, codec).await
        }
        /// Stream one security's observations with observation_date in
        /// [from_date, to_date] (inclusive; an unset bound is unbounded), for the
        /// requested metrics (empty means all), ordered by observation_date, then
        /// metric.
        pub async fn search(
            &mut self,
            request: impl tonic::IntoRequest<
                super::super::super::requests::security_metric::SearchSecurityMetricRequestProto,
            >,
        ) -> std::result::Result<
            tonic::Response<
                tonic::codec::Streaming<
                    super::super::super::requests::security_metric::SearchSecurityMetricResponseProto,
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
                "/fintekkers.services.security_metric_service.SecurityMetric/Search",
            );
            let mut req = request.into_request();
            req.extensions_mut()
                .insert(
                    GrpcMethod::new(
                        "fintekkers.services.security_metric_service.SecurityMetric",
                        "Search",
                    ),
                );
            self.inner.server_streaming(req, path, codec).await
        }
        /// Latest on or before: for each (security_id, metric), the observation
        /// with the latest observation_date on or before date. At most one per
        /// pair; a pair with none is absent. An empty security_id list gives an
        /// empty response, not an error.
        pub async fn get_latest(
            &mut self,
            request: impl tonic::IntoRequest<
                super::super::super::requests::security_metric::GetLatestSecurityMetricRequestProto,
            >,
        ) -> std::result::Result<
            tonic::Response<
                super::super::super::requests::security_metric::GetLatestSecurityMetricResponseProto,
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
                "/fintekkers.services.security_metric_service.SecurityMetric/GetLatest",
            );
            let mut req = request.into_request();
            req.extensions_mut()
                .insert(
                    GrpcMethod::new(
                        "fintekkers.services.security_metric_service.SecurityMetric",
                        "GetLatest",
                    ),
                );
            self.inner.unary(req, path, codec).await
        }
    }
}
/// Generated server implementations.
pub mod security_metric_server {
    #![allow(unused_variables, dead_code, missing_docs, clippy::let_unit_value)]
    use tonic::codegen::*;
    /// Generated trait containing gRPC methods that should be implemented for use with SecurityMetricServer.
    #[async_trait]
    pub trait SecurityMetric: Send + Sync + 'static {
        /// Store one observation. A write for an existing (security_id, metric,
        /// observation_date) is a correction, stored as a new version with a later
        /// as_of.
        async fn create_or_update(
            &self,
            request: tonic::Request<
                super::super::super::requests::security_metric::CreateSecurityMetricRequestProto,
            >,
        ) -> std::result::Result<
            tonic::Response<
                super::super::super::requests::security_metric::CreateSecurityMetricResponseProto,
            >,
            tonic::Status,
        >;
        /// Server streaming response type for the Search method.
        type SearchStream: futures_core::Stream<
                Item = std::result::Result<
                    super::super::super::requests::security_metric::SearchSecurityMetricResponseProto,
                    tonic::Status,
                >,
            >
            + Send
            + 'static;
        /// Stream one security's observations with observation_date in
        /// [from_date, to_date] (inclusive; an unset bound is unbounded), for the
        /// requested metrics (empty means all), ordered by observation_date, then
        /// metric.
        async fn search(
            &self,
            request: tonic::Request<
                super::super::super::requests::security_metric::SearchSecurityMetricRequestProto,
            >,
        ) -> std::result::Result<tonic::Response<Self::SearchStream>, tonic::Status>;
        /// Latest on or before: for each (security_id, metric), the observation
        /// with the latest observation_date on or before date. At most one per
        /// pair; a pair with none is absent. An empty security_id list gives an
        /// empty response, not an error.
        async fn get_latest(
            &self,
            request: tonic::Request<
                super::super::super::requests::security_metric::GetLatestSecurityMetricRequestProto,
            >,
        ) -> std::result::Result<
            tonic::Response<
                super::super::super::requests::security_metric::GetLatestSecurityMetricResponseProto,
            >,
            tonic::Status,
        >;
    }
    /// Dated security metrics (LM-482): figures about a security that are not
    /// prices, such as shares outstanding, NAV per share and total net assets.
    /// Hosted in price-service-rust (PSR-53). See docs/adr/security_metric.md.
    ///
    /// The rules every RPC follows:
    ///   - Units are per metric, on SecurityMetricTypeProto: a whole share count,
    ///     or an amount in the security's currency.
    ///   - Absent is unknown: an observation that does not exist is left out of a
    ///     response, never sent as 0.
    ///   - A correction for the same (security_id, metric, observation_date) is a
    ///     new version with a later as_of. Reads return only the latest as_of
    ///     version of each.
    ///   - INVALID_ARGUMENT for an unset security_id (Search, CreateOrUpdate), an
    ///     unset date (GetLatest), a metric of UNKNOWN_SECURITY_METRIC, an unset
    ///     value or observation_date on write, or a from_date after to_date.
    #[derive(Debug)]
    pub struct SecurityMetricServer<T: SecurityMetric> {
        inner: _Inner<T>,
        accept_compression_encodings: EnabledCompressionEncodings,
        send_compression_encodings: EnabledCompressionEncodings,
        max_decoding_message_size: Option<usize>,
        max_encoding_message_size: Option<usize>,
    }
    struct _Inner<T>(Arc<T>);
    impl<T: SecurityMetric> SecurityMetricServer<T> {
        pub fn new(inner: T) -> Self {
            Self::from_arc(Arc::new(inner))
        }
        pub fn from_arc(inner: Arc<T>) -> Self {
            let inner = _Inner(inner);
            Self {
                inner,
                accept_compression_encodings: Default::default(),
                send_compression_encodings: Default::default(),
                max_decoding_message_size: None,
                max_encoding_message_size: None,
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
        /// Limits the maximum size of a decoded message.
        ///
        /// Default: `4MB`
        #[must_use]
        pub fn max_decoding_message_size(mut self, limit: usize) -> Self {
            self.max_decoding_message_size = Some(limit);
            self
        }
        /// Limits the maximum size of an encoded message.
        ///
        /// Default: `usize::MAX`
        #[must_use]
        pub fn max_encoding_message_size(mut self, limit: usize) -> Self {
            self.max_encoding_message_size = Some(limit);
            self
        }
    }
    impl<T, B> tonic::codegen::Service<http::Request<B>> for SecurityMetricServer<T>
    where
        T: SecurityMetric,
        B: Body + Send + 'static,
        B::Error: Into<StdError> + Send + 'static,
    {
        type Response = http::Response<tonic::body::BoxBody>;
        type Error = std::convert::Infallible;
        type Future = BoxFuture<Self::Response, Self::Error>;
        fn poll_ready(
            &mut self,
            _cx: &mut Context<'_>,
        ) -> Poll<std::result::Result<(), Self::Error>> {
            Poll::Ready(Ok(()))
        }
        fn call(&mut self, req: http::Request<B>) -> Self::Future {
            let inner = self.inner.clone();
            match req.uri().path() {
                "/fintekkers.services.security_metric_service.SecurityMetric/CreateOrUpdate" => {
                    #[allow(non_camel_case_types)]
                    struct CreateOrUpdateSvc<T: SecurityMetric>(pub Arc<T>);
                    impl<
                        T: SecurityMetric,
                    > tonic::server::UnaryService<
                        super::super::super::requests::security_metric::CreateSecurityMetricRequestProto,
                    > for CreateOrUpdateSvc<T> {
                        type Response = super::super::super::requests::security_metric::CreateSecurityMetricResponseProto;
                        type Future = BoxFuture<
                            tonic::Response<Self::Response>,
                            tonic::Status,
                        >;
                        fn call(
                            &mut self,
                            request: tonic::Request<
                                super::super::super::requests::security_metric::CreateSecurityMetricRequestProto,
                            >,
                        ) -> Self::Future {
                            let inner = Arc::clone(&self.0);
                            let fut = async move {
                                (*inner).create_or_update(request).await
                            };
                            Box::pin(fut)
                        }
                    }
                    let accept_compression_encodings = self.accept_compression_encodings;
                    let send_compression_encodings = self.send_compression_encodings;
                    let max_decoding_message_size = self.max_decoding_message_size;
                    let max_encoding_message_size = self.max_encoding_message_size;
                    let inner = self.inner.clone();
                    let fut = async move {
                        let inner = inner.0;
                        let method = CreateOrUpdateSvc(inner);
                        let codec = tonic::codec::ProstCodec::default();
                        let mut grpc = tonic::server::Grpc::new(codec)
                            .apply_compression_config(
                                accept_compression_encodings,
                                send_compression_encodings,
                            )
                            .apply_max_message_size_config(
                                max_decoding_message_size,
                                max_encoding_message_size,
                            );
                        let res = grpc.unary(method, req).await;
                        Ok(res)
                    };
                    Box::pin(fut)
                }
                "/fintekkers.services.security_metric_service.SecurityMetric/Search" => {
                    #[allow(non_camel_case_types)]
                    struct SearchSvc<T: SecurityMetric>(pub Arc<T>);
                    impl<
                        T: SecurityMetric,
                    > tonic::server::ServerStreamingService<
                        super::super::super::requests::security_metric::SearchSecurityMetricRequestProto,
                    > for SearchSvc<T> {
                        type Response = super::super::super::requests::security_metric::SearchSecurityMetricResponseProto;
                        type ResponseStream = T::SearchStream;
                        type Future = BoxFuture<
                            tonic::Response<Self::ResponseStream>,
                            tonic::Status,
                        >;
                        fn call(
                            &mut self,
                            request: tonic::Request<
                                super::super::super::requests::security_metric::SearchSecurityMetricRequestProto,
                            >,
                        ) -> Self::Future {
                            let inner = Arc::clone(&self.0);
                            let fut = async move { (*inner).search(request).await };
                            Box::pin(fut)
                        }
                    }
                    let accept_compression_encodings = self.accept_compression_encodings;
                    let send_compression_encodings = self.send_compression_encodings;
                    let max_decoding_message_size = self.max_decoding_message_size;
                    let max_encoding_message_size = self.max_encoding_message_size;
                    let inner = self.inner.clone();
                    let fut = async move {
                        let inner = inner.0;
                        let method = SearchSvc(inner);
                        let codec = tonic::codec::ProstCodec::default();
                        let mut grpc = tonic::server::Grpc::new(codec)
                            .apply_compression_config(
                                accept_compression_encodings,
                                send_compression_encodings,
                            )
                            .apply_max_message_size_config(
                                max_decoding_message_size,
                                max_encoding_message_size,
                            );
                        let res = grpc.server_streaming(method, req).await;
                        Ok(res)
                    };
                    Box::pin(fut)
                }
                "/fintekkers.services.security_metric_service.SecurityMetric/GetLatest" => {
                    #[allow(non_camel_case_types)]
                    struct GetLatestSvc<T: SecurityMetric>(pub Arc<T>);
                    impl<
                        T: SecurityMetric,
                    > tonic::server::UnaryService<
                        super::super::super::requests::security_metric::GetLatestSecurityMetricRequestProto,
                    > for GetLatestSvc<T> {
                        type Response = super::super::super::requests::security_metric::GetLatestSecurityMetricResponseProto;
                        type Future = BoxFuture<
                            tonic::Response<Self::Response>,
                            tonic::Status,
                        >;
                        fn call(
                            &mut self,
                            request: tonic::Request<
                                super::super::super::requests::security_metric::GetLatestSecurityMetricRequestProto,
                            >,
                        ) -> Self::Future {
                            let inner = Arc::clone(&self.0);
                            let fut = async move { (*inner).get_latest(request).await };
                            Box::pin(fut)
                        }
                    }
                    let accept_compression_encodings = self.accept_compression_encodings;
                    let send_compression_encodings = self.send_compression_encodings;
                    let max_decoding_message_size = self.max_decoding_message_size;
                    let max_encoding_message_size = self.max_encoding_message_size;
                    let inner = self.inner.clone();
                    let fut = async move {
                        let inner = inner.0;
                        let method = GetLatestSvc(inner);
                        let codec = tonic::codec::ProstCodec::default();
                        let mut grpc = tonic::server::Grpc::new(codec)
                            .apply_compression_config(
                                accept_compression_encodings,
                                send_compression_encodings,
                            )
                            .apply_max_message_size_config(
                                max_decoding_message_size,
                                max_encoding_message_size,
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
    impl<T: SecurityMetric> Clone for SecurityMetricServer<T> {
        fn clone(&self) -> Self {
            let inner = self.inner.clone();
            Self {
                inner,
                accept_compression_encodings: self.accept_compression_encodings,
                send_compression_encodings: self.send_compression_encodings,
                max_decoding_message_size: self.max_decoding_message_size,
                max_encoding_message_size: self.max_encoding_message_size,
            }
        }
    }
    impl<T: SecurityMetric> Clone for _Inner<T> {
        fn clone(&self) -> Self {
            Self(Arc::clone(&self.0))
        }
    }
    impl<T: std::fmt::Debug> std::fmt::Debug for _Inner<T> {
        fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
            write!(f, "{:?}", self.0)
        }
    }
    impl<T: SecurityMetric> tonic::server::NamedService for SecurityMetricServer<T> {
        const NAME: &'static str = "fintekkers.services.security_metric_service.SecurityMetric";
    }
}
