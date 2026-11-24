//! LM-485: the README's security metric example runs against the fake
//! server, and the README's ```rust block under "## Security metrics" is
//! exactly the text between the README markers below.

#[path = "common/security_metric_fake.rs"]
mod security_metric_fake;

use ledger_models::fintekkers::models::security::SecurityMetricTypeProto;
use ledger_models::fintekkers::wrappers::services::security_metric::SecurityMetricService;
use rust_decimal::Decimal;
use security_metric_fake::{d, dec, FakeServer, SPY};
use uuid::Uuid;

#[tokio::test]
async fn readme_example_runs_against_the_fake() -> Result<(), Box<dyn std::error::Error>> {
    let fake = FakeServer::start().await;
    let service = SecurityMetricService::from_env_with(fake.env())?;
    let spy_uuid = SPY;
    let qqq_uuid = Uuid::from_bytes([0x11; 16]);

    // README:start
    use chrono::NaiveDate;
    use ledger_models::fintekkers::models::security::SecurityMetricTypeProto::{NavPerShare, SharesOutstanding};
    use ledger_models::fintekkers::wrappers::models::security::{link_of_latest, SecurityWrapper};
    use rust_decimal_macros::dec;

    let monday = NaiveDate::from_ymd_opt(2026, 11, 23).ok_or("bad date")?;
    let spy = SecurityWrapper::new(link_of_latest(spy_uuid));

    // The latest value on or before a date: Friday's point, 3 days old.
    if let Some(shares) = spy.get_metric_with(&service, SharesOutstanding, Some(monday)).await? {
        println!("{} shares on {} ({} days old)", shares.value, shares.date, shares.age_days());
    }
    // The same through a shortcut.
    let shares = spy.metrics_with(&service).shares_outstanding(Some(monday)).await?;

    // Many securities in one call: every UUID is a key, unknown ones are None.
    let latest = service.get(SharesOutstanding, &[spy_uuid, qqq_uuid], Some(monday)).await?;
    assert!(latest[&qqq_uuid].is_none());

    // Every point in a range, ascending; gaps stay gaps.
    let from = NaiveDate::from_ymd_opt(2026, 11, 1).ok_or("bad date")?;
    let history = spy.metrics_with(&service).shares_outstanding_history(from, Some(monday)).await?;
    for point in &history.points {
        println!("{} {}", point.date, point.value);
    }

    // Write points: checked first (whole share counts, no duplicate dates),
    // then sent in chunks. Returns the as_of the server stamped.
    let as_of = service.record(NavPerShare, spy_uuid, &[(monday, dec!(512.34))]).await?;
    println!("stored at {as_of}; shares {:?}", shares.map(|s| s.value));
    // README:end

    assert_eq!(shares.map(|s| (s.value, s.date, s.age_days())), Some((dec("15210000000"), d("2026-11-20"), 3)));
    assert_eq!(latest[&spy_uuid].as_ref().map(|r| r.value), Some(dec("15210000000")));
    assert_eq!(history.points.len(), 2);
    assert_eq!(fake.get_latest_calls(), 3);
    assert_eq!(fake.search_calls(), 1);
    assert_eq!(fake.create_calls(), 1);
    let stored = fake.state.lock().map_err(|e| e.to_string())?.store
        [&(spy_uuid, SecurityMetricTypeProto::NavPerShare as i32)]
        .clone();
    assert_eq!(stored.get(&monday), Some(&Decimal::new(51234, 2)));
    assert_eq!(as_of.timestamp(), security_metric_fake::BASE_AS_OF_SECONDS + 1);
    fake.stop();
    Ok(())
}

/// Lines with surrounding blank lines and trailing whitespace removed and
/// the common indentation stripped.
fn normalise(text: &str) -> Vec<String> {
    let lines: Vec<&str> = text.lines().map(str::trim_end).collect();
    let start = lines.iter().position(|l| !l.is_empty()).unwrap_or(lines.len());
    let end = lines.iter().rposition(|l| !l.is_empty()).map_or(start, |i| i + 1);
    let lines = &lines[start..end];
    let indent = lines
        .iter()
        .filter(|l| !l.is_empty())
        .map(|l| l.len() - l.trim_start().len())
        .min()
        .unwrap_or(0);
    lines.iter().map(|l| if l.is_empty() { String::new() } else { l[indent..].to_string() }).collect()
}

fn between<'a>(text: &'a str, start: &str, end: &str) -> &'a str {
    let from = text.find(start).unwrap_or_else(|| panic!("no {start:?}"));
    let after = &text[from + start.len()..];
    // Skip the rest of the marker line.
    let after = &after[after.find('\n').map_or(after.len(), |i| i + 1)..];
    let to = after.find(end).unwrap_or_else(|| panic!("no {end:?} after {start:?}"));
    // Drop the end marker's own line prefix (its indentation and `//`).
    let body = &after[..to];
    &body[..body.rfind('\n').map_or(0, |i| i + 1)]
}

#[test]
fn readme_block_equals_the_tested_example() {
    let root = std::path::Path::new(env!("CARGO_MANIFEST_DIR"));
    let readme = std::fs::read_to_string(root.join("README.md")).expect("README.md");
    let test = std::fs::read_to_string(root.join("tests/security_metric_readme_test.rs")).expect("this test");

    let section = &readme[readme.find("## Security metrics (LM-485)").expect("README section")..];
    let block = between(section, "```rust", "```");
    let marked = between(&test, &["// README", ":start"].concat(), &["// README", ":end"].concat());

    let (block, marked) = (normalise(block), normalise(marked));
    assert!(block.len() > 10, "README block is too short: {block:?}");
    assert_eq!(block, marked, "the README block must equal the README:start..README:end text");
}
