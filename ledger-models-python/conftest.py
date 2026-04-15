import os
import pytest


def pytest_collection_modifyitems(config, items):
    if os.environ.get("EXCLUDE_SERVICE_TESTS") == "1":
        skip = pytest.mark.skip(reason="EXCLUDE_SERVICE_TESTS=1")
        for item in items:
            if "integration" in item.keywords:
                item.add_marker(skip)
