package common.util;

import com.google.protobuf.Any;
import com.google.protobuf.Descriptors.Descriptor;
import com.google.protobuf.Descriptors.FieldDescriptor;
import com.google.protobuf.Message;
import common.models.portfolio.Portfolio;
import common.models.postion.Field;
import common.models.postion.Measure;
import common.models.postion.Position;
import common.models.postion.PositionFilter;
import common.models.price.Price;
import common.models.security.BondSecurity;
import common.models.security.CashSecurity;
import common.models.security.EquitySecurity;
import common.models.security.IndexSecurity;
import common.models.security.Security;
import common.models.security.Tenor;
import common.models.security.TenorType;
import common.models.security.bonds.FloatingRateNote;
import common.models.security.bonds.MortgageBackedSecurity;
import common.models.security.bonds.TIPSBond;
import common.models.security.identifier.Identifier;
import common.models.security.identifier.IdentifierType;
import common.models.strategy.Strategy;
import common.models.strategy.StrategyAllocation;
import common.models.transaction.Transaction;
import common.models.transaction.TransactionType;
import fintekkers.models.portfolio.PortfolioProto;
import fintekkers.models.price.PriceProto;
import fintekkers.models.security.bond.AgencyProto;
import fintekkers.models.security.BondDetailsProto;
import fintekkers.models.security.CouponFrequencyProto;
import fintekkers.models.security.CouponTypeProto;
import fintekkers.models.security.IdentifierProto;
import fintekkers.models.security.IdentifierTypeProto;
import fintekkers.models.security.index.IndexTypeProto;
import fintekkers.models.security.ProductTypeProto;
import fintekkers.models.security.SecurityProto;
import fintekkers.models.transaction.TransactionProto;
import fintekkers.models.transaction.TransactionTypeProto;
import fintekkers.models.util.ObjectTypeProto;
import fintekkers.models.util.Uuid.UUIDProto;
import fintekkers.requests.portfolio.QueryPortfolioRequestProto;
import fintekkers.requests.portfolio.QueryPortfolioResponseProto;
import fintekkers.requests.security.QuerySecurityRequestProto;
import fintekkers.requests.security.QuerySecurityResponseProto;
import fintekkers.requests.transaction.QueryTransactionRequestProto;
import fintekkers.requests.transaction.QueryTransactionResponseProto;
import fintekkers.services.PortfolioService;
import fintekkers.services.SecurityService;
import fintekkers.services.TransactionService;
import fintekkers.services.portfolio_service.PortfolioGrpc;
import fintekkers.services.security_service.SecurityGrpc;
import fintekkers.services.transaction_service.TransactionGrpc;
import io.grpc.Server;
import io.grpc.netty.NettyServerBuilder;
import io.grpc.stub.StreamObserver;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import protos.serializers.SerializerFactory;
import protos.serializers.portfolio.PortfolioSerializer;
import protos.serializers.position.PositionFilterSerializer;
import protos.serializers.position.PositionSerializer;
import protos.serializers.price.PriceSerializer;
import protos.serializers.security.IdentifierSerializer;
import protos.serializers.security.TenorSerializer;
import protos.serializers.util.proto.ProtoSerializationUtil;

import java.io.IOException;
import java.lang.reflect.Constructor;
import java.lang.reflect.Executable;
import java.lang.reflect.Method;
import java.lang.reflect.Modifier;
import java.math.BigDecimal;
import java.net.InetSocketAddress;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDate;
import java.time.Period;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.TreeSet;
import java.util.UUID;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicReference;
import java.util.function.Supplier;
import java.util.stream.Collectors;
import java.util.stream.Stream;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Builders stamp what they build (LM-323, the Java part of LM-322).
 *
 * <p>Every public member that creates a message with object_type has a fixture in
 * {@link #FIXTURES} that calls it, or an entry in {@link #EXCLUDED} with a reason. The
 * fixture's message, and every nested message with object_type, must carry its own type
 * ({@link ObjectTypes#ownType}) and {@link ObjectTypes#SCHEMA_VERSION}. Members are found by
 * reflection over the compiled library, so a public builder that is in neither map fails.
 *
 * <p>A candidate is a public, non-abstract member of a public class under {@link #SCAN_ROOTS}
 * that either returns a message (or message builder) whose type has object_type, or a
 * general message type that could be one ({@code GeneratedMessageV3}); or is a public
 * constructor of a class whose public {@code getProto()} returns such a message; or is a
 * {@code main(String[])} entry point. Abstract methods have no body to stamp: the
 * implementations are scanned instead. Test fixtures in {@code testutil.*} are outside the
 * roots: they build through the wrappers covered here.
 *
 * <p>Sites fixed by LM-323 and the fixture that reaches each:
 * <ul>
 *   <li>Security.linkOf, linkOfLatest: their own fixtures.</li>
 *   <li>Security.buildBaselineProto (private): the POJO constructors of Security,
 *       EquitySecurity, IndexSecurity, BondSecurity, TIPSBond, MortgageBackedSecurity and
 *       FloatingRateNote.</li>
 *   <li>CashSecurity.buildCashProto (private) and its nested IdentifierProto: the CashSecurity
 *       POJO constructor, and the settlement currency (CashSecurity.USD) nested in the other
 *       POJO fixtures.</li>
 *   <li>fromPricerInputs on BondSecurity, TIPSBond, MortgageBackedSecurity and
 *       FloatingRateNote: their own fixtures.</li>
 *   <li>Transaction.stripSecurity, stripPortfolio, stripPrice (private): the Transaction
 *       proto constructor fixture and the POJO constructor fixtures, which pass full,
 *       non-link security, portfolio and price.</li>
 *   <li>PositionFilterSerializer.serialize: its own fixture.</li>
 * </ul>
 */
class BuilderStampCoverageTest {

    /**
     * Package roots scanned, as class-file directories. {@code fintekkers/services} is scanned
     * without subpackages: those hold the generated gRPC stubs.
     */
    private static final List<String> SCAN_ROOTS = List.of("common", "protos/serializers");
    private static final String SERVICES_ROOT = "fintekkers/services";

    /** Fewer scanned classes than this means the scan lost its root. */
    private static final int MIN_SCANNED_CLASSES = 50;

    /** The one wildcard exclusion allowed. */
    private static final String MAIN_WILDCARD = "*#main(String[])";

    private static final ZonedDateTime AS_OF = ZonedDateTime.of(2024, 1, 2, 9, 30, 0, 0, ZoneId.of("America/New_York"));
    private static final LocalDate ISSUE = LocalDate.of(2024, 1, 15);
    private static final LocalDate MATURITY = LocalDate.of(2034, 1, 15);

    /**
     * A call to a public member and the paths in its message that the caller supplied.
     * Those are passed through and not stamped by the library, so the walk skips them
     * (their children are still walked). The root's path is {@link #ROOT}.
     */
    record Fixture(Supplier<Message> build, Set<String> callerSupplied) {
    }

    /** Request capture: a fake fetcher and a local gRPC server record the outbound request. */
    private static final String HOST = "127.0.0.1";
    private static final AtomicReference<Message> captured = new AtomicReference<>();
    private static Server server;

    /** The path of the message a fixture returns. */
    static final String ROOT = "(top)";

    private static final Map<String, Fixture> FIXTURES = new LinkedHashMap<>();
    private static final Map<String, String> EXCLUDED = new LinkedHashMap<>();

    static {
        // ---- Security factories
        fixture("common.models.security.Security#linkOf(UUID,ZonedDateTime)",
                () -> Security.linkOf(UUID.randomUUID(), AS_OF));
        fixture("common.models.security.Security#linkOfLatest(UUID)",
                () -> Security.linkOfLatest(UUID.randomUUID()));
        fixture("common.models.security.BondSecurity#fromPricerInputs(BigDecimal,BigDecimal,CouponTypeProto,CouponFrequencyProto,LocalDate,LocalDate)",
                () -> BondSecurity.fromPricerInputs(BigDecimal.valueOf(1000), BigDecimal.valueOf(4.25),
                        CouponTypeProto.FIXED, CouponFrequencyProto.SEMIANNUALLY, ISSUE, MATURITY));
        fixture("common.models.security.bonds.TIPSBond#fromPricerInputs(BigDecimal,BigDecimal,CouponTypeProto,CouponFrequencyProto,LocalDate,LocalDate,BigDecimal,LocalDate,IndexTypeProto)",
                () -> TIPSBond.fromPricerInputs(BigDecimal.valueOf(1000), BigDecimal.valueOf(1.25),
                        CouponTypeProto.FIXED, CouponFrequencyProto.SEMIANNUALLY, ISSUE, MATURITY,
                        BigDecimal.valueOf(308.4), ISSUE, IndexTypeProto.CPI_U));
        fixture("common.models.security.bonds.MortgageBackedSecurity#fromPricerInputs(BigDecimal,BigDecimal,CouponTypeProto,CouponFrequencyProto,LocalDate,LocalDate,String,AgencyProto,BigDecimal,int,BigDecimal,BigDecimal,BigDecimal,BigDecimal,BigDecimal)",
                () -> MortgageBackedSecurity.fromPricerInputs(BigDecimal.valueOf(1000), BigDecimal.valueOf(5.5),
                        CouponTypeProto.FIXED, CouponFrequencyProto.MONTHLY, ISSUE, MATURITY,
                        "FN1234", AgencyProto.FNMA, BigDecimal.valueOf(6.0), 348, BigDecimal.valueOf(5.5),
                        BigDecimal.valueOf(0.9), BigDecimal.valueOf(1000000), BigDecimal.valueOf(900000), BigDecimal.valueOf(150)));
        fixture("common.models.security.bonds.FloatingRateNote#fromPricerInputs(BigDecimal,BigDecimal,CouponTypeProto,CouponFrequencyProto,LocalDate,LocalDate,BigDecimal,IndexTypeProto,CouponFrequencyProto)",
                () -> FloatingRateNote.fromPricerInputs(BigDecimal.valueOf(1000), BigDecimal.valueOf(5.3),
                        CouponTypeProto.FLOAT, CouponFrequencyProto.QUARTERLY, ISSUE, MATURITY,
                        BigDecimal.valueOf(0.2), IndexTypeProto.SOFR, CouponFrequencyProto.QUARTERLY));

        // ---- Security POJO constructors (Security.buildBaselineProto, CashSecurity.buildCashProto)
        fixture("common.models.security.Security#Security(UUID,String,ZonedDateTime,CashSecurity)",
                () -> new Security(UUID.randomUUID(), "Issuer", AS_OF, CashSecurity.USD).getProto());
        fixture("common.models.security.EquitySecurity#EquitySecurity(UUID,String,ZonedDateTime,CashSecurity)",
                () -> new EquitySecurity(UUID.randomUUID(), "ACME", AS_OF, CashSecurity.USD).getProto());
        fixture("common.models.security.IndexSecurity#IndexSecurity(UUID,String,ZonedDateTime,CashSecurity)",
                () -> new IndexSecurity(UUID.randomUUID(), "S&P", AS_OF, CashSecurity.USD).getProto());
        fixture("common.models.security.BondSecurity#BondSecurity(UUID,String,ZonedDateTime,CashSecurity)",
                () -> new BondSecurity(UUID.randomUUID(), "US Treasury", AS_OF, CashSecurity.USD).getProto());
        fixture("common.models.security.bonds.TIPSBond#TIPSBond(UUID,String,ZonedDateTime,CashSecurity)",
                () -> new TIPSBond(UUID.randomUUID(), "US Treasury", AS_OF, CashSecurity.USD).getProto());
        fixture("common.models.security.bonds.MortgageBackedSecurity#MortgageBackedSecurity(UUID,String,ZonedDateTime,CashSecurity)",
                () -> new MortgageBackedSecurity(UUID.randomUUID(), "FNMA", AS_OF, CashSecurity.USD).getProto());
        fixture("common.models.security.bonds.FloatingRateNote#FloatingRateNote(UUID,String,ZonedDateTime,CashSecurity)",
                () -> new FloatingRateNote(UUID.randomUUID(), "US Treasury", AS_OF, CashSecurity.USD).getProto());
        fixture("common.models.security.CashSecurity#CashSecurity(UUID,String,ZonedDateTime)",
                () -> new CashSecurity(UUID.randomUUID(), "EUR", AS_OF).getProto());

        // ---- Other wrappers
        fixture("common.models.portfolio.Portfolio#Portfolio(UUID,String,ZonedDateTime)",
                () -> new Portfolio(UUID.randomUUID(), "Fund", AS_OF).getProto());
        fixture("common.models.strategy.Strategy#Strategy(UUID,String,Strategy,ZonedDateTime)",
                () -> new Strategy(UUID.randomUUID(), "Child", new Strategy(UUID.randomUUID(), "Parent", null, AS_OF), AS_OF).getProto());
        fixture("common.models.strategy.StrategyAllocation#StrategyAllocation(UUID,ZonedDateTime)",
                () -> new StrategyAllocation(UUID.randomUUID(), AS_OF).getProto());

        // ---- Transaction: strip-on-write builds new link stubs (QA R1, R2)
        fixture("common.models.transaction.Transaction#Transaction(TransactionProto)",
                () -> new Transaction(callerTransaction()).getProto(), ROOT);
        fixture("common.models.transaction.Transaction#Transaction(UUID,Portfolio,Price,LocalDate,LocalDate,BigDecimal,Security,TransactionType,StrategyAllocation,ZonedDateTime)",
                () -> pojoTransaction(false).getProto());
        fixture("common.models.transaction.Transaction#Transaction(UUID,Portfolio,Price,LocalDate,LocalDate,BigDecimal,Security,TransactionType,StrategyAllocation,ZonedDateTime,Transaction,String,PositionStatusProto)",
                () -> pojoTransaction(true).getProto());

        // ---- Serializers
        fixture("protos.serializers.portfolio.PortfolioSerializer#serialize(Portfolio)",
                () -> PortfolioSerializer.getInstance().serialize(new Portfolio(UUID.randomUUID(), "Fund", AS_OF)));
        fixture("protos.serializers.price.PriceSerializer#serialize(Price)",
                () -> PriceSerializer.getInstance().serialize(price(equity())));
        fixture("protos.serializers.position.PositionSerializer#serialize(Position)",
                () -> PositionSerializer.getInstance().serialize(new Position(Position.PositionType.TRANSACTION,
                        Measure.DIRECTED_QUANTITY, new Portfolio(UUID.randomUUID(), "Fund", AS_OF), equity(), AS_OF)));
        fixture("protos.serializers.position.PositionFilterSerializer#serialize(PositionFilter)",
                () -> {
                    PositionFilter filter = new PositionFilter();
                    filter.addFilter(Field.PORTFOLIO_NAME, PositionFilter.Operator.EQUALS, "Fund");
                    return PositionFilterSerializer.getInstance().serialize(filter);
                });
        fixture("protos.serializers.security.IdentifierSerializer#serialize(Identifier)",
                () -> IdentifierSerializer.getInstance().serialize(new Identifier(IdentifierType.CUSIP, "912828ZT0")));
        fixture("protos.serializers.security.TenorSerializer#serialize(Tenor)",
                () -> TenorSerializer.getInstance().serialize(new Tenor(TenorType.TERM, Period.ofYears(10))));
        fixture("protos.serializers.SerializerFactory#serialize(IRawDataModelObject)",
                () -> unpack(SerializerFactory.getInstance().serialize(new Portfolio(UUID.randomUUID(), "Fund", AS_OF)), PortfolioProto.class));
        fixture("protos.serializers.util.proto.ProtoSerializationUtil#serialize(Object)",
                () -> ProtoSerializationUtil.serialize(equity()));

        // ---- Request builders: the message these build is the request, captured on the way out.
        fixture("common.util.LinkResolver#getSecurity(UUID)",
                () -> {
                    newLinkResolver().getSecurity(UUID.randomUUID());
                    return captured.getAndSet(null);
                });
        fixture("common.util.LinkResolver#getSecurity(UUID,LocalTimestampProto)",
                () -> {
                    newLinkResolver().getSecurity(UUID.randomUUID(), ProtoSerializationUtil.serializeTimestamp(AS_OF));
                    return captured.getAndSet(null);
                });
        fixture("common.util.LinkResolver#getPortfolio(UUID)",
                () -> {
                    newLinkResolver().getPortfolio(UUID.randomUUID());
                    return captured.getAndSet(null);
                });
        fixture("common.util.LinkResolver#getPortfolio(UUID,LocalTimestampProto)",
                () -> {
                    newLinkResolver().getPortfolio(UUID.randomUUID(), ProtoSerializationUtil.serializeTimestamp(AS_OF));
                    return captured.getAndSet(null);
                });
        fixture("fintekkers.services.SecurityService#getByUuid(UUID,ZonedDateTime)",
                () -> {
                    new SecurityService(HOST, server.getPort(), true).getByUuid(UUID.randomUUID(), AS_OF);
                    return captured.getAndSet(null);
                });
        fixture("fintekkers.services.PortfolioService#getByUuid(UUID,ZonedDateTime)",
                () -> {
                    new PortfolioService(HOST, server.getPort(), true).getByUuid(UUID.randomUUID(), AS_OF);
                    return captured.getAndSet(null);
                });
        fixture("fintekkers.services.TransactionService#getByUuid(UUID,ZonedDateTime)",
                () -> {
                    new TransactionService(HOST, server.getPort(), true).getByUuid(UUID.randomUUID(), AS_OF);
                    return captured.getAndSet(null);
                });

        // ---- Exclusions, each by full signature
        exclude(MAIN_WILDCARD, "demo entry point, not a library builder");
        exclude("common.util.ObjectTypes#stamp(Builder,ObjectTypeProto)",
                "the stamping helper itself: stamps the caller's builder; ObjectTypesTest covers it");
        exclude("common.util.ObjectTypes#stampOwn(Builder)",
                "the stamping helper itself: stamps the caller's builder; ObjectTypeCoverageTest covers it");

        String accessor = "accessor of the wrapped proto; the constructor fixtures check what it returns";
        exclude("common.models.security.Security#getProto()", accessor);
        exclude("common.models.security.Security#getSecurityProto()", accessor);
        exclude("common.models.portfolio.Portfolio#getProto()", accessor);
        exclude("common.models.strategy.Strategy#getProto()", accessor);
        exclude("common.models.strategy.StrategyAllocation#getProto()", accessor);
        exclude("common.models.transaction.Transaction#getProto()", accessor);
        exclude("common.models.transaction.Transaction#getRawProto()",
                "accessor of the wrapped proto without strip-on-write; the constructor fixtures check that proto via getProto()");

        String passThrough = "pass-through: wraps the caller's proto and does not re-stamp it (LM-322 ruling); "
                + "callerProtosAreNotReStamped covers it";
        for (String cls : List.of("common.models.security.Security", "common.models.security.EquitySecurity",
                "common.models.security.IndexSecurity", "common.models.security.BondSecurity",
                "common.models.security.CashSecurity", "common.models.security.bonds.TIPSBond",
                "common.models.security.bonds.MortgageBackedSecurity", "common.models.security.bonds.FloatingRateNote")) {
            exclude(cls + "#" + cls.substring(cls.lastIndexOf('.') + 1) + "(SecurityProto)", passThrough);
        }
        exclude("common.models.portfolio.Portfolio#Portfolio(PortfolioProto)", passThrough);
        exclude("common.models.strategy.Strategy#Strategy(StrategyProto)", passThrough);
        exclude("common.models.strategy.StrategyAllocation#StrategyAllocation(StrategyAllocationProto)", passThrough);
        exclude("protos.serializers.SerializerFactory#deserializeFromBytes(byte[])",
                "pass-through: parses the caller's bytes into an Any; builds nothing");
        exclude("fintekkers.services.ValuationService#runValuation(ValuationRequestProto)",
                "pass-through: sends the caller's request and returns the server's response; builds nothing");
    }

    private static void fixture(String member, Supplier<Message> build, String... callerSupplied) {
        FIXTURES.put(member, new Fixture(build, Set.of(callerSupplied)));
    }

    private static void exclude(String member, String reason) {
        EXCLUDED.put(member, reason);
    }

    // ---- Fixture inputs

    private static EquitySecurity equity() {
        return new EquitySecurity(UUID.randomUUID(), "ACME", AS_OF, CashSecurity.USD);
    }

    private static Price price(Security security) {
        return new Price(UUID.randomUUID(), BigDecimal.TEN, security, AS_OF);
    }

    /** A POJO transaction holding a full, non-link security, portfolio and price (QA R2). */
    private static Transaction pojoTransaction(boolean longForm) {
        EquitySecurity security = equity();
        Portfolio portfolio = new Portfolio(UUID.randomUUID(), "Fund", AS_OF);
        assertFalse(security.getProto().getIsLink());
        LocalDate trade = LocalDate.of(2024, 1, 2);
        if (longForm) {
            return new Transaction(UUID.randomUUID(), portfolio, price(security), trade, trade.plusDays(2),
                    BigDecimal.valueOf(100), security, TransactionType.BUY, new StrategyAllocation(UUID.randomUUID(), AS_OF),
                    AS_OF, null, "Trade", null);
        }
        return new Transaction(UUID.randomUUID(), portfolio, price(security), trade, trade.plusDays(2),
                BigDecimal.valueOf(100), security, TransactionType.BUY, new StrategyAllocation(UUID.randomUUID(), AS_OF), AS_OF);
    }

    /** An unstamped caller TransactionProto holding a full, non-link security, portfolio and price (QA R1). */
    private static TransactionProto callerTransaction() {
        SecurityProto security = SecurityProto.newBuilder()
                .setUuid(ProtoSerializationUtil.serializeUUID(UUID.randomUUID()))
                .setAsOf(ProtoSerializationUtil.serializeTimestamp(AS_OF))
                .setProductType(ProductTypeProto.COMMON_STOCK)
                .setIssuerName("ACME")
                .build();
        return TransactionProto.newBuilder()
                .setUuid(ProtoSerializationUtil.serializeUUID(UUID.randomUUID()))
                .setAsOf(ProtoSerializationUtil.serializeTimestamp(AS_OF))
                .setTransactionType(TransactionTypeProto.BUY)
                .setSecurity(security)
                .setPortfolio(PortfolioProto.newBuilder()
                        .setUuid(ProtoSerializationUtil.serializeUUID(UUID.randomUUID()))
                        .setAsOf(ProtoSerializationUtil.serializeTimestamp(AS_OF))
                        .setPortfolioName("Fund"))
                .setPrice(PriceProto.newBuilder()
                        .setUuid(ProtoSerializationUtil.serializeUUID(UUID.randomUUID()))
                        .setAsOf(ProtoSerializationUtil.serializeTimestamp(AS_OF))
                        .setPrice(ProtoSerializationUtil.serializeBigDecimal(BigDecimal.TEN))
                        .setSecurity(security))
                .build();
    }

    private static <T extends Message> T unpack(Message any, Class<T> type) {
        try {
            return ((Any) any).unpack(type);
        } catch (com.google.protobuf.InvalidProtocolBufferException e) {
            throw new AssertionError(e);
        }
    }

    private static LinkResolver newLinkResolver() {
        return new LinkResolver(
                request -> {
                    captured.set(request);
                    return QuerySecurityResponseProto.newBuilder()
                            .addSecurityResponse(SecurityProto.newBuilder().setUuid(request.getUuIds(0))).build();
                },
                request -> {
                    captured.set(request);
                    return QueryPortfolioResponseProto.newBuilder()
                            .addPortfolioResponse(PortfolioProto.newBuilder().setUuid(request.getUuIds(0))).build();
                });
    }

    @BeforeAll
    static void startServer() throws IOException {
        server = NettyServerBuilder.forAddress(new InetSocketAddress(HOST, 0))
                .addService(new SecurityGrpc.SecurityImplBase() {
                    @Override
                    public void getByIds(QuerySecurityRequestProto request, StreamObserver<QuerySecurityResponseProto> response) {
                        captured.set(request);
                        response.onNext(QuerySecurityResponseProto.getDefaultInstance());
                        response.onCompleted();
                    }
                })
                .addService(new PortfolioGrpc.PortfolioImplBase() {
                    @Override
                    public void getByIds(QueryPortfolioRequestProto request, StreamObserver<QueryPortfolioResponseProto> response) {
                        captured.set(request);
                        response.onNext(QueryPortfolioResponseProto.getDefaultInstance());
                        response.onCompleted();
                    }
                })
                .addService(new TransactionGrpc.TransactionImplBase() {
                    @Override
                    public void getByIds(QueryTransactionRequestProto request, StreamObserver<QueryTransactionResponseProto> response) {
                        captured.set(request);
                        response.onNext(QueryTransactionResponseProto.getDefaultInstance());
                        response.onCompleted();
                    }
                })
                .build()
                .start();
    }

    @AfterAll
    static void stopServer() throws InterruptedException {
        if (server != null) {
            server.shutdownNow().awaitTermination(5, TimeUnit.SECONDS);
        }
    }

    // ---- The stamp walk

    /**
     * Paths of the messages in {@code message} (itself included, as {@link #ROOT}) whose type has
     * object_type but that lack their own type or {@link ObjectTypes#SCHEMA_VERSION}.
     * Paths in {@code callerSupplied} are skipped; their children are still walked.
     */
    static List<String> unstamped(Message message, Set<String> callerSupplied) {
        List<String> out = new ArrayList<>();
        walk(message, ROOT, callerSupplied, out);
        return out;
    }

    private static void walk(Message message, String path, Set<String> callerSupplied, List<String> out) {
        Optional<ObjectTypeProto> own = ObjectTypes.ownType(message.getDescriptorForType());
        if (own.isPresent() && !callerSupplied.contains(path)
                && (ObjectTypes.readType(message) != own.get()
                    || !ObjectTypes.readVersion(message).equals(Optional.of(ObjectTypes.SCHEMA_VERSION)))) {
            out.add(path);
        }
        for (Map.Entry<FieldDescriptor, Object> e : message.getAllFields().entrySet()) {
            FieldDescriptor f = e.getKey();
            if (f.getJavaType() != FieldDescriptor.JavaType.MESSAGE) {
                continue;
            }
            String child = path.equals(ROOT) ? f.getName() : path + "." + f.getName();
            if (f.isRepeated()) {
                List<?> items = (List<?>) e.getValue();
                for (int i = 0; i < items.size(); i++) {
                    walk((Message) items.get(i), child + "[" + i + "]", callerSupplied, out);
                }
            } else {
                walk((Message) e.getValue(), child, callerSupplied, out);
            }
        }
    }

    // ---- The reflection scan

    /** The public classes under the scan roots of the compiled library. */
    static List<Class<?>> scannedClasses() throws IOException {
        Path root;
        try {
            root = Path.of(Security.class.getProtectionDomain().getCodeSource().getLocation().toURI());
        } catch (java.net.URISyntaxException e) {
            throw new AssertionError(e);
        }
        assertTrue(Files.isDirectory(root), "library classes are not a directory: " + root);
        List<Path> files = new ArrayList<>();
        for (String scanRoot : SCAN_ROOTS) {
            try (Stream<Path> walk = Files.walk(root.resolve(scanRoot))) {
                walk.forEach(files::add);
            }
        }
        try (Stream<Path> list = Files.list(root.resolve(SERVICES_ROOT))) {
            list.forEach(files::add);
        }
        List<Class<?>> classes = new ArrayList<>();
        for (Path file : files) {
            String name = root.relativize(file).toString();
            if (!name.endsWith(".class")) {
                continue;
            }
            String className = name.substring(0, name.length() - ".class".length()).replace(file.getFileSystem().getSeparator(), ".");
            try {
                Class<?> c = Class.forName(className, false, Security.class.getClassLoader());
                if (Modifier.isPublic(c.getModifiers()) && !c.isAnonymousClass() && !c.isSynthetic()) {
                    classes.add(c);
                }
            } catch (ClassNotFoundException e) {
                throw new AssertionError(className, e);
            }
        }
        return classes;
    }

    /** The candidate members of {@code c}, by signature. See the class comment for the rule. */
    static List<String> candidates(Class<?> c) {
        List<String> out = new ArrayList<>();
        for (Method m : c.getDeclaredMethods()) {
            int mod = m.getModifiers();
            if (!Modifier.isPublic(mod) || Modifier.isAbstract(mod) || m.isSynthetic() || m.isBridge()) {
                continue;
            }
            boolean main = m.getName().equals("main") && Modifier.isStatic(mod)
                    && Arrays.equals(m.getParameterTypes(), new Class<?>[]{String[].class});
            if (main || isTypedMessage(m.getReturnType())) {
                out.add(signature(m));
            }
        }
        if (!c.isInterface() && !Modifier.isAbstract(c.getModifiers()) && hasTypedGetProto(c)) {
            for (Constructor<?> k : c.getDeclaredConstructors()) {
                if (Modifier.isPublic(k.getModifiers()) && !k.isSynthetic()) {
                    out.add(signature(k));
                }
            }
        }
        return out;
    }

    private static boolean hasTypedGetProto(Class<?> c) {
        try {
            return isTypedMessage(c.getMethod("getProto").getReturnType());
        } catch (NoSuchMethodException e) {
            return false;
        }
    }

    /**
     * A message or message builder whose type has object_type, or a general message type
     * ({@code Message}, {@code GeneratedMessageV3}) that could hold one.
     */
    static boolean isTypedMessage(Class<?> t) {
        Class<?> messageClass;
        if (Message.class.isAssignableFrom(t)) {
            messageClass = t;
        } else if (Message.Builder.class.isAssignableFrom(t)) {
            messageClass = t.getDeclaringClass();
            if (messageClass == null || !Message.class.isAssignableFrom(messageClass)) {
                return true;
            }
        } else {
            return false;
        }
        if (messageClass.isInterface() || Modifier.isAbstract(messageClass.getModifiers())) {
            return true;
        }
        try {
            Descriptor d = (Descriptor) messageClass.getMethod("getDescriptor").invoke(null);
            return ObjectTypes.ownType(d).isPresent();
        } catch (ReflectiveOperationException e) {
            throw new AssertionError(messageClass.getName() + ": no static getDescriptor()", e);
        }
    }

    static String signature(Executable e) {
        String name = e instanceof Constructor ? e.getDeclaringClass().getSimpleName() : e.getName();
        String params = Arrays.stream(e.getParameterTypes()).map(Class::getSimpleName).collect(Collectors.joining(","));
        return e.getDeclaringClass().getName() + "#" + name + "(" + params + ")";
    }

    private static boolean matchesExclusion(String member, Set<String> excluded) {
        return excluded.contains(member)
                || (excluded.contains(MAIN_WILDCARD) && member.endsWith(MAIN_WILDCARD.substring(1)));
    }

    /** Candidates in neither the fixtures nor the exclusions. */
    static List<String> unlisted(List<String> candidates, Set<String> fixtures, Set<String> excluded) {
        return candidates.stream()
                .filter(m -> !fixtures.contains(m) && !matchesExclusion(m, excluded))
                .collect(Collectors.toList());
    }

    /** Blank reasons, wildcards other than {@link #MAIN_WILDCARD}, and keys that match no candidate. */
    static List<String> exclusionProblems(Map<String, String> excluded, List<String> candidates) {
        List<String> problems = new ArrayList<>();
        excluded.forEach((member, reason) -> {
            if (reason == null || reason.isBlank()) {
                problems.add(member + ": no reason");
            }
            if (member.contains("*") && !member.equals(MAIN_WILDCARD)) {
                problems.add(member + ": wildcard");
            }
            boolean matches = member.equals(MAIN_WILDCARD)
                    ? candidates.stream().anyMatch(c -> c.endsWith(MAIN_WILDCARD.substring(1)))
                    : candidates.contains(member);
            if (!matches) {
                problems.add(member + ": stale, no such candidate");
            }
        });
        return problems;
    }

    private static List<String> allCandidates() throws IOException {
        List<String> out = new ArrayList<>();
        for (Class<?> c : scannedClasses()) {
            out.addAll(candidates(c));
        }
        return out;
    }

    // ---- Tests: metric 1

    @Test
    void everyFixtureIsStamped() {
        Map<String, List<String>> failures = new LinkedHashMap<>();
        FIXTURES.forEach((member, fixture) -> {
            Message built = fixture.build().get();
            assertTrue(built != null, member + " built nothing");
            List<String> paths = unstamped(built, fixture.callerSupplied());
            if (!paths.isEmpty()) {
                failures.put(member, paths);
            }
        });
        assertEquals(Map.of(), failures, "unstamped messages, by member and path");
    }

    @Test
    void everyPublicBuilderIsListedOrExcluded() throws IOException {
        List<String> candidates = allCandidates();
        assertEquals(List.of(), unlisted(candidates, FIXTURES.keySet(), EXCLUDED.keySet()),
                "public builders with no fixture and no exclusion");
        Set<String> staleFixtures = new TreeSet<>(FIXTURES.keySet());
        candidates.forEach(staleFixtures::remove);
        assertEquals(Set.of(), staleFixtures, "fixtures for members the scan does not find");
    }

    @Test
    void theStubsTransactionBuildsAreStampedAndTheCallersProtoIsNot() {
        TransactionProto caller = callerTransaction();
        TransactionProto out = new Transaction(caller).getProto();

        assertTrue(out.getSecurity().getIsLink() && out.getPortfolio().getIsLink());
        // LM-394: the price stays inline; only its nested Security is a link.
        assertFalse(out.getPrice().getIsLink());
        assertTrue(out.getPrice().getSecurity().getIsLink());
        assertEquals(ObjectTypeProto.OBJECT_TYPE_SECURITY, ObjectTypes.readType(out.getSecurity()));
        assertEquals(ObjectTypeProto.OBJECT_TYPE_PORTFOLIO, ObjectTypes.readType(out.getPortfolio()));
        assertEquals(ObjectTypeProto.OBJECT_TYPE_PRICE, ObjectTypes.readType(out.getPrice()));
        for (Message stub : List.of(out.getSecurity(), out.getPortfolio(), out.getPrice())) {
            assertEquals(Optional.of(ObjectTypes.SCHEMA_VERSION), ObjectTypes.readVersion(stub));
        }
        assertEquals(caller.getSecurity().getUuid(), out.getSecurity().getUuid());
        assertEquals(caller.getSecurity().getAsOf(), out.getSecurity().getAsOf());

        // The caller's top level keeps its own (unset) type and version.
        assertEquals(ObjectTypes.readType(caller), ObjectTypes.readType(out));
        assertEquals(ObjectTypes.readVersion(caller), ObjectTypes.readVersion(out));
        assertEquals(ObjectTypeProto.OBJECT_TYPE_UNKNOWN, ObjectTypes.readType(out));
    }

    @Test
    void theCashSecurityIdentifierIsStamped() {
        SecurityProto cash = new CashSecurity(UUID.randomUUID(), "EUR", AS_OF).getProto();
        IdentifierProto id = cash.getIdentifiers(0);
        assertEquals(IdentifierTypeProto.CASH, id.getIdentifierType());
        assertEquals(ObjectTypeProto.OBJECT_TYPE_IDENTIFIER, ObjectTypes.readType(id));
        assertEquals(Optional.of(ObjectTypes.SCHEMA_VERSION), ObjectTypes.readVersion(id));
    }

    // ---- Tests: guardrails

    @Test
    void callerProtosAreNotReStamped() {
        SecurityProto equity = SecurityProto.newBuilder()
                .setUuid(ProtoSerializationUtil.serializeUUID(UUID.randomUUID()))
                .setAsOf(ProtoSerializationUtil.serializeTimestamp(AS_OF))
                .setProductType(ProductTypeProto.COMMON_STOCK)
                .setIssuerName("ACME")
                .build();
        assertEquals(equity, new Security(equity).getProto());
        assertEquals(equity, Security.fromProto(equity).getProto());

        // A caller's link inside a transaction stays byte-identical (QA O5).
        SecurityProto link = SecurityProto.newBuilder()
                .setIsLink(true)
                .setUuid(ProtoSerializationUtil.serializeUUID(UUID.randomUUID()))
                .setAsOf(ProtoSerializationUtil.serializeTimestamp(AS_OF))
                .build();
        TransactionProto withLink = TransactionProto.newBuilder()
                .setUuid(ProtoSerializationUtil.serializeUUID(UUID.randomUUID()))
                .setAsOf(ProtoSerializationUtil.serializeTimestamp(AS_OF))
                .setSecurity(link)
                .build();
        assertEquals(link.toByteString(), new Transaction(withLink).getProto().getSecurity().toByteString());

        // Identifiers that force the overlay rebuild add no stamp to the caller's top level (QA R7).
        SecurityProto withIdentifier = equity.toBuilder()
                .addIdentifiers(IdentifierProto.newBuilder()
                        .setIdentifierType(IdentifierTypeProto.CUSIP)
                        .setIdentifierValue("912828ZT0"))
                .build();
        SecurityProto rebuilt = new Security(withIdentifier).getProto();
        assertNotEquals(withIdentifier.getIdentifiers(0), rebuilt.getIdentifiers(0), "the overlay rebuild did not run");
        assertEquals(ObjectTypeProto.OBJECT_TYPE_UNKNOWN, ObjectTypes.readType(rebuilt));
        assertEquals(Optional.empty(), ObjectTypes.readVersion(rebuilt));
        assertEquals(withIdentifier.toBuilder().clearIdentifiers().build(), rebuilt.toBuilder().clearIdentifiers().build());
    }

    @Test
    void exclusionsHaveReasons() throws IOException {
        assertEquals(List.of(), exclusionProblems(EXCLUDED, allCandidates()));
    }

    @Test
    void aBadExclusionIsReported() {
        Map<String, String> bad = new LinkedHashMap<>();
        bad.put("common.models.security.Security#linkOf(UUID,ZonedDateTime)", " ");
        bad.put("*#get*", "getters");
        bad.put(MAIN_WILDCARD, "demo entry point");
        List<String> candidates = List.of("common.models.security.Security#linkOf(UUID,ZonedDateTime)", "a.B#getX()");
        assertEquals(List.of(
                "common.models.security.Security#linkOf(UUID,ZonedDateTime): no reason",
                "*#get*: wildcard",
                "*#get*: stale, no such candidate",
                MAIN_WILDCARD + ": stale, no such candidate"), exclusionProblems(bad, candidates));
    }

    // ---- Self-tests: the walk is not vacuous (QA R4)

    @Test
    void anUnstampedNestedMessageIsReported() {
        TransactionProto txn = ObjectTypes.stamp(TransactionProto.newBuilder(), ObjectTypeProto.OBJECT_TYPE_TRANSACTION)
                .setSecurity(SecurityProto.newBuilder().setIssuerName("unstamped"))
                .build();
        assertEquals(List.of("security"), unstamped(txn, Set.of()));
        assertEquals(List.of(), unstamped(txn, Set.of("security")));
    }

    @Test
    void anUnstampedRepeatedMessageIsReported() {
        SecurityProto stamped = ObjectTypes.stamp(SecurityProto.newBuilder(), ObjectTypeProto.OBJECT_TYPE_SECURITY).build();
        QuerySecurityResponseProto response = ObjectTypes.stamp(QuerySecurityResponseProto.newBuilder(), ObjectTypeProto.OBJECT_TYPE_QUERY_SECURITY_RESPONSE)
                .addSecurityResponse(stamped)
                .addSecurityResponse(SecurityProto.getDefaultInstance())
                .build();
        assertEquals(List.of("security_response[1]"), unstamped(response, Set.of()));
    }

    @Test
    void aWrongTypeOrVersionIsReported() {
        SecurityProto wrongType = ObjectTypes.stamp(SecurityProto.newBuilder(), ObjectTypeProto.OBJECT_TYPE_PRICE).build();
        SecurityProto noVersion = ObjectTypes.stamp(SecurityProto.newBuilder(), ObjectTypeProto.OBJECT_TYPE_SECURITY).clearVersion().build();
        assertEquals(List.of(ROOT), unstamped(wrongType, Set.of()));
        assertEquals(List.of(ROOT), unstamped(noVersion, Set.of()));
    }

    @Test
    void messagesWithoutObjectTypePass() {
        assertEquals(List.of(), unstamped(BondDetailsProto.newBuilder().setFaceValue(
                ProtoSerializationUtil.serializeBigDecimal(BigDecimal.ONE)).build(), Set.of()));
        assertEquals(List.of(), unstamped(ProtoSerializationUtil.serializeUUID(UUID.randomUUID()), Set.of()));
    }

    // ---- Self-tests: the scan is not vacuous (QA R5)

    @Test
    void theScanFindsTheLibrary() throws IOException {
        List<Class<?>> classes = scannedClasses();
        assertTrue(classes.size() >= MIN_SCANNED_CLASSES, "scan found only " + classes.size() + " classes");
        for (Class<?> c : List.of(Security.class, Transaction.class, PositionFilterSerializer.class,
                SecurityService.class, LinkResolver.class)) {
            assertTrue(classes.contains(c), "scan missed " + c.getName());
        }
        assertFalse(classes.contains(SecurityGrpc.class), "scan includes generated gRPC stubs");
    }

    /** A deliberately unlisted sample. */
    public static class Sample {
        public SecurityProto.Builder builder() {
            return SecurityProto.newBuilder();
        }

        public UUIDProto untyped() {
            return UUIDProto.getDefaultInstance();
        }

        SecurityProto notPublic() {
            return SecurityProto.getDefaultInstance();
        }
    }

    /** A sample wrapper: its public constructor is a candidate. */
    public static class SampleWrapper {
        public SampleWrapper() {
        }

        public SecurityProto getProto() {
            return SecurityProto.getDefaultInstance();
        }
    }

    @Test
    void theCandidateRuleFindsBuildersAndWrapperConstructors() {
        String sample = Sample.class.getName();
        assertEquals(List.of(sample + "#builder()"), candidates(Sample.class));
        String wrapper = SampleWrapper.class.getName();
        assertEquals(Set.of(wrapper + "#getProto()", wrapper + "#SampleWrapper()"), Set.copyOf(candidates(SampleWrapper.class)));
        assertTrue(isTypedMessage(SecurityProto.Builder.class));
        assertTrue(isTypedMessage(com.google.protobuf.GeneratedMessageV3.class));
        assertFalse(isTypedMessage(UUIDProto.class));
        assertFalse(isTypedMessage(BondDetailsProto.Builder.class));
    }

    @Test
    void anUnlistedBuilderIsReported() {
        assertEquals(List.of(Sample.class.getName() + "#builder()"),
                unlisted(candidates(Sample.class), FIXTURES.keySet(), EXCLUDED.keySet()));
    }
}
