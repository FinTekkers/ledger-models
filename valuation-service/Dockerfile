FROM rust AS builder
WORKDIR /app
COPY /valuation-service /app/valuation-service
COPY /rust-types /app/rust-types
WORKDIR /app/valuation-service
RUN cargo build --release

FROM gcr.io/distroless/cc
COPY --from=builder app/valuation-service/target/release/valuation-service-server /
EXPOSE 8080
CMD ["./valuation-service-server"]


