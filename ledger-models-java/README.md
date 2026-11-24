# Ledger-models-Java

The Java contains a standalone implementation of models. This is to allow for behavioral aspects to be added to
models. For example the Transaction.java class has logic for creating cash impacts and
maturation children transactions. Behaviors can't be defined in protobuf, so have to be
implemented per language.

This philosophical approach requires great thought to go into data modelling. This is on purpose. Concepts like
'strategy' have far-reaching implementation trade-offs that need to be considered at design time.

## src/main/java/common/models/*

Contains packages for different groups of models, with the Java code:

* Portfolio
* Price
* Security
* Strategy
* TaxLot
* Transaction
* Position

All of the above are RawDataModelObjects meaning they are bi-temporal in nature. 

## Security metrics (LM-485)

Shares outstanding, NAV per share and total net assets of a security, by date, from the
SecurityMetric service. `Security.getMetric` and the shortcuts (`sharesOutstanding`,
`navPerShare`, `totalNetAssets` and their `...History` forms) go through
`SecurityMetricService.getInstance()`, which finds the service like every other client: the
broker when `BROKER_HOST` is set, else `PRICE_SERVICE_HOST`/`PRICE_SERVICE_PORT`, else
`API_URL`, else `localhost:8083`.

A missing value is `null`, never 0. Bad input (no UUID, an unknown metric, fractional share
counts, duplicate dates) throws a `SecurityMetricException` before any call. Service failures
throw a `SecurityMetricServiceException` naming `host:port` and the gRPC status;
`ServiceUnavailable` when the service cannot be reached. `record` sends at most 5000 points
per call and returns the as-of time the service stamped. Tests can replace the gRPC calls with
`SecurityMetricService.setFetcher(...)`.

```java
// Any Security whose proto carries a UUID works: a link is enough, nothing is hydrated.
MetricResult shares = security.getMetric(SecurityMetricTypeProto.SHARES_OUTSTANDING, LocalDate.of(2026, 11, 23));
if (shares != null) { // null means no value: never 0
    System.out.println(shares.value() + " on " + shares.date() + ", " + shares.ageDays() + " days old");
}
MetricResult nav = security.navPerShare(); // latest on or before today, or null

SecurityMetricService metrics = SecurityMetricService.getInstance();
Map<UUID, MetricResult> batch = metrics.get(SecurityMetricTypeProto.SHARES_OUTSTANDING,
        List.of(spyId, qqqId), LocalDate.of(2026, 11, 23)); // one call; every UUID is a key

MetricSeries history = security.sharesOutstandingHistory(LocalDate.of(2026, 11, 1), LocalDate.of(2026, 11, 23));
for (MetricSeries.MetricPoint point : history.points()) {
    System.out.println(point.date() + " " + point.value());
}

ZonedDateTime storedAsOf = metrics.record(SecurityMetricTypeProto.SHARES_OUTSTANDING, spyId,
        Map.of(LocalDate.of(2026, 11, 23), new BigDecimal("15220000000")));
```

`SecurityMetricReadmeTest` runs this example against a fake service and fails if this block
and the test drift apart.


# Publishing

The Java package is published after a release version is created via the workflow file: .github/workflows/maven-publish.yml (to Github) and maven-central.yml (to Maven Central). The gradle publish of the build publishes the package and relies on the NPM_TOKEN secret being injected leveraging GitHub secrets.

The gradle import would be 
implementation group: 'io.github.fintekkers', name: 'ledger-models', version: '0.1.x'. Please ignore 1.0.x versions as these were published in error. Upon public launch the major version will update.

# GPG signing

The packages 