import warnings
from importlib.metadata import version

try:
    package_version = version("fintekkers-ledger-models")
    if package_version == "0.0.0":
        warnings.warn(
            "You are using a locally built version of fintekkers-ledger-models. "
            "This version may contain experimental features or changes that are not yet "
            "available in the official release. Use with caution.",
            UserWarning,
            stacklevel=2
        )
except Exception as e:
    # Log the error but don't show the warning
    import logging
    logging.debug(f"Could not determine package version: {str(e)}")
