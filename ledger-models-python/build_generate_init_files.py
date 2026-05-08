"""
Walks ./fintekkers and creates an empty `__init__.py` in any directory
that doesn't already have one. Ensures `setuptools.find_packages()`
picks up every directory containing generated *_pb2.py files at wheel
build time — without these init files, the .py modules are silently
dropped from the wheel while their .pyi stubs are still included by
the catch-all MANIFEST glob.

See FinTekkers/second-brain#217 for the bug this guards against.

Idempotent: safe to run on every regen.
"""

import os

ROOT = './fintekkers'

# Names (not paths) of directories to skip at every nesting level.
# Previous implementation only matched top-level paths, so nested
# `__pycache__` dirs got bogus `__init__.py` files — caught this in PR
# fixing #217.
IGNORE_DIR_NAMES = {
    '__pycache__',
    '.DS_Store',
    'fintekkers_ledger_models.egg-info',
}


def create_init_files(directory: str) -> None:
    for name in os.listdir(directory):
        path = os.path.join(directory, name)

        if not os.path.isdir(path):
            continue
        if name in IGNORE_DIR_NAMES:
            print(f"Ignoring directory: {path}")
            continue

        init_file = os.path.join(path, '__init__.py')
        if not os.path.exists(init_file):
            with open(init_file, 'w'):
                pass  # touch
            print(f"Created {init_file}")

        create_init_files(path)


if __name__ == '__main__':
    create_init_files(ROOT)
