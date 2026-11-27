"""LM-508: docs/release-notes/lm-508.md flags the PriceProto `price` -> `mid`
rename as source-breaking, covers the JSON / toObject() key change and names
every consumer repo that must update.
"""
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[3]
NOTES = (REPO_ROOT / "docs" / "release-notes" / "lm-508.md").read_text()


def test_rename_is_called_source_breaking():
    assert "source-breaking" in NOTES
    assert "`price` → `mid`" in NOTES


def test_names_every_consumer_repo():
    for repo in ("price-service-rust", "valuation-service", "ledger-service", "ui-service",
                 "market-data-inputs", "broker-service"):
        assert f"`{repo}`" in NOTES, repo


def test_json_and_to_object_key_change():
    assert "JSON" in NOTES
    assert "toObject()" in NOTES


def test_bid_only_valuation_and_older_readers():
    assert "bid-only" in NOTES
    assert "mid-only" in NOTES
