//! Finds the address of a FinTekkers service from the environment. Every
//! default client (`connect_default_{security,portfolio,transaction}_client`)
//! resolves through here, in this order:
//!
//! 1. `BROKER_HOST` (`host[:port]`, port defaults to [`BROKER_PORT`]): all
//!    calls go through the broker.
//! 2. Only if that is unset, `<SERVICE>_SERVICE_HOST` with
//!    `<SERVICE>_SERVICE_PORT` (or the service's standard port).
//!    `_PORT` without `_HOST` is ignored.
//! 3. `API_URL`, with the service's standard port unless it carries one.
//! 4. `localhost` on the service's standard port.
//!
//! An empty value counts as unset. A leading `http://` or `https://` is
//! ignored. Loopback hosts (`localhost`, `127.0.0.1`) are plaintext; any
//! other host uses TLS. A port that is not a number is an error naming the
//! variable.
//!
//! The same cases are checked in every language against
//! `test-fixtures/service-address-cases.json`. Mirrors Java's
//! `fintekkers.services.ServiceAddress`.

pub const BROKER_PORT: u16 = 8085;
pub const LEDGER_PORT: u16 = 8082;
pub const VALUATION_PORT: u16 = 8080;
pub const PRICE_PORT: u16 = 8083;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Service {
    Broker,
    Security,
    Transaction,
    Portfolio,
    Valuation,
    Price,
}

impl Service {
    /// Prefix of this service's `<SERVICE>_SERVICE_HOST/_PORT` variables.
    pub fn env_prefix(self) -> &'static str {
        match self {
            Service::Broker => "BROKER",
            Service::Security | Service::Transaction | Service::Portfolio => "LEDGER",
            Service::Valuation => "VALUATION",
            Service::Price => "PRICE",
        }
    }

    pub fn standard_port(self) -> u16 {
        match self {
            Service::Broker => BROKER_PORT,
            Service::Security | Service::Transaction | Service::Portfolio => LEDGER_PORT,
            Service::Valuation => VALUATION_PORT,
            Service::Price => PRICE_PORT,
        }
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct ServiceAddress {
    pub host: String,
    pub port: u16,
    pub plaintext: bool,
}

impl ServiceAddress {
    fn new(host: String, port: u16) -> Self {
        let plaintext = host == "localhost" || host == "127.0.0.1";
        ServiceAddress { host, port, plaintext }
    }

    /// `http://host:port` for plaintext, `https://host:port` otherwise.
    pub fn uri(&self) -> String {
        let scheme = if self.plaintext { "http" } else { "https" };
        format!("{}://{}:{}", scheme, self.host, self.port)
    }

    /// A tonic endpoint for this address, with TLS configured when the
    /// address is not plaintext. Errs when the host is not valid in a URI.
    pub fn endpoint(&self) -> Result<tonic::transport::Endpoint, String> {
        let endpoint = tonic::transport::Channel::from_shared(self.uri())
            .map_err(|e| format!("{}: {}", self.uri(), e))?;
        if self.plaintext {
            Ok(endpoint)
        } else {
            endpoint
                .tls_config(tonic::transport::ClientTlsConfig::new())
                .map_err(|e| e.to_string())
        }
    }
}

/// A malformed environment value. `variable` names the offending variable.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct ServiceAddressError {
    pub variable: String,
    pub value: String,
    pub reason: &'static str,
}

impl std::fmt::Display for ServiceAddressError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{} has {}: '{}'", self.variable, self.reason, self.value)
    }
}

impl std::error::Error for ServiceAddressError {}

/// Resolves `service` from the process environment.
pub fn resolve(service: Service) -> Result<ServiceAddress, ServiceAddressError> {
    resolve_with(service, |name| std::env::var(name).ok())
}

/// Resolves `service` against `env`, a variable-name lookup returning
/// `None` when unset.
pub fn resolve_with(
    service: Service,
    env: impl Fn(&str) -> Option<String>,
) -> Result<ServiceAddress, ServiceAddressError> {
    let read = |name: &str| {
        env(name)
            .map(|v| v.trim().to_string())
            .filter(|v| !v.is_empty())
    };

    if let Some(broker) = read("BROKER_HOST") {
        return parse(&broker, "BROKER_HOST", BROKER_PORT);
    }

    let host_var = format!("{}_SERVICE_HOST", service.env_prefix());
    if let Some(host) = read(&host_var) {
        let mut address = parse(&host, &host_var, service.standard_port())?;
        let port_var = format!("{}_SERVICE_PORT", service.env_prefix());
        if let Some(port) = read(&port_var) {
            address.port = parse_port(&port, &port_var)?;
        }
        return Ok(address);
    }

    if let Some(api_url) = read("API_URL") {
        return parse(&api_url, "API_URL", service.standard_port());
    }

    Ok(ServiceAddress::new("localhost".to_string(), service.standard_port()))
}

fn parse(value: &str, variable: &str, default_port: u16) -> Result<ServiceAddress, ServiceAddressError> {
    let address = match value.find("://") {
        Some(i) => &value[i + 3..],
        None => value,
    }
    .trim_end_matches('/');

    let (host, port) = match address.rfind(':') {
        Some(i) => (&address[..i], parse_port(&address[i + 1..], variable)?),
        None => (address, default_port),
    };
    if host.is_empty() {
        return Err(ServiceAddressError {
            variable: variable.to_string(),
            value: value.to_string(),
            reason: "no host",
        });
    }
    Ok(ServiceAddress::new(host.to_string(), port))
}

fn parse_port(value: &str, variable: &str) -> Result<u16, ServiceAddressError> {
    match value.trim().parse::<u16>() {
        Ok(port) if port >= 1 => Ok(port),
        _ => Err(ServiceAddressError {
            variable: variable.to_string(),
            value: value.to_string(),
            reason: "an invalid port",
        }),
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::collections::{BTreeSet, HashMap};

    fn fixture() -> serde_json::Value {
        let path = std::path::Path::new(env!("CARGO_MANIFEST_DIR"))
            .join("..")
            .join("test-fixtures")
            .join("service-address-cases.json");
        let text = std::fs::read_to_string(&path)
            .unwrap_or_else(|e| panic!("reading {}: {}", path.display(), e));
        serde_json::from_str(&text).expect("fixture is valid JSON")
    }

    fn service_named(name: &str) -> Service {
        match name {
            "BROKER" => Service::Broker,
            "SECURITY" => Service::Security,
            "TRANSACTION" => Service::Transaction,
            "PORTFOLIO" => Service::Portfolio,
            "VALUATION" => Service::Valuation,
            "PRICE" => Service::Price,
            other => panic!("unknown service in fixture: {}", other),
        }
    }

    #[test]
    fn resolves_as_the_shared_fixture_says() {
        let fixture = fixture();
        let cases = fixture["cases"].as_array().expect("cases is an array");
        let mut checked = 0;
        for case in cases {
            let name = case["name"].as_str().unwrap();
            let env: HashMap<String, String> = case["env"]
                .as_object()
                .unwrap()
                .iter()
                .map(|(k, v)| (k.clone(), v.as_str().unwrap().to_string()))
                .collect();
            for service in case["services"].as_array().unwrap() {
                let service = service_named(service.as_str().unwrap());
                let got = resolve_with(service, |k| env.get(k).cloned());
                if let Some(variable) = case.get("error") {
                    let err = got.expect_err(name);
                    assert_eq!(err.variable, variable.as_str().unwrap(), "{} [{:?}]", name, service);
                    assert!(err.to_string().contains(variable.as_str().unwrap()));
                } else {
                    let expected = &case["expected"];
                    let want = ServiceAddress {
                        host: expected["host"].as_str().unwrap().to_string(),
                        port: expected["port"].as_u64().unwrap() as u16,
                        plaintext: expected["plaintext"].as_bool().unwrap(),
                    };
                    assert_eq!(got.as_ref(), Ok(&want), "{} [{:?}]", name, service);
                }
                checked += 1;
            }
        }
        // 28 cases expanding to 48 (case, service) checks; a truncated or
        // emptied fixture must not pass silently.
        assert!(cases.len() >= 28, "fixture has only {} cases", cases.len());
        assert!(checked >= 48, "only {} checks ran", checked);
    }

    #[test]
    fn fixture_covers_every_step() {
        let fixture = fixture();
        let steps: BTreeSet<&str> = fixture["cases"]
            .as_array()
            .unwrap()
            .iter()
            .map(|c| c["step"].as_str().unwrap())
            .collect();
        assert_eq!(steps, BTreeSet::from(["a", "b", "c", "d"]));
    }

    #[test]
    fn standard_ports() {
        assert_eq!(BROKER_PORT, 8085);
        assert_eq!(LEDGER_PORT, 8082);
        assert_eq!(VALUATION_PORT, 8080);
        assert_eq!(PRICE_PORT, 8083);
    }

    #[test]
    fn standard_ports_match_the_shared_fixture() {
        let ports = &fixture()["standard_ports"];
        assert_eq!(ports["BROKER"].as_u64(), Some(BROKER_PORT as u64));
        assert_eq!(ports["LEDGER"].as_u64(), Some(LEDGER_PORT as u64));
        assert_eq!(ports["VALUATION"].as_u64(), Some(VALUATION_PORT as u64));
        assert_eq!(ports["PRICE"].as_u64(), Some(PRICE_PORT as u64));
    }

    #[test]
    fn every_default_client_targets_the_broker_when_only_broker_host_is_set() {
        use crate::fintekkers::wrappers::models::{portfolio, security, transaction};
        let env = |k: &str| (k == "BROKER_HOST").then(|| "127.0.0.1:8085".to_string());
        let broker = "http://127.0.0.1:8085";
        assert_eq!(security::default_security_endpoint_with(env).unwrap().uri(), broker);
        assert_eq!(portfolio::default_portfolio_endpoint_with(env).unwrap().uri(), broker);
        assert_eq!(transaction::default_transaction_endpoint_with(env).unwrap().uri(), broker);
    }

    #[test]
    fn uri_is_http_for_loopback_and_https_otherwise() {
        let env = |k: &str| (k == "BROKER_HOST").then(|| "broker.example:443".to_string());
        assert_eq!(resolve_with(Service::Security, env).unwrap().uri(), "https://broker.example:443");
        let env = |k: &str| (k == "BROKER_HOST").then(|| "127.0.0.1:8085".to_string());
        assert_eq!(resolve_with(Service::Security, env).unwrap().uri(), "http://127.0.0.1:8085");
    }

    #[test]
    fn endpoint_builds_for_tls_and_plaintext_and_errs_on_a_bad_host() {
        let tls = ServiceAddress::new("broker.example".to_string(), 443);
        assert!(tls.endpoint().is_ok());
        let plain = ServiceAddress::new("127.0.0.1".to_string(), 8085);
        assert!(plain.endpoint().is_ok());
        let bad = ServiceAddress::new("bad host".to_string(), 8085);
        assert!(bad.endpoint().is_err());
    }
}
