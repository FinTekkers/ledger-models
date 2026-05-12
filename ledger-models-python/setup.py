from setuptools import setup, find_packages
import os
import subprocess

VERSION = '0.0.0'
DESCRIPTION = 'Fintekkers Ledger Models python package'
LONG_DESCRIPTION = 'Contains the generated python code for the ledger models protos, as well as hand-written wrapper code. See the package url to link to the proto defintions'

if 'BUILD_VERSION' in os.environ:
    print("******************************************")
    print("************OVERRIDING VERSION FROM ENVIRONMENT******************")
    print("******************************************")
    VERSION = os.environ.get('BUILD_VERSION')

# Materialize hierarchy.json into the package directory before the wheel
# bundles it. The canonical lives at ../ledger-models-protos/hierarchy.json
# (one source of truth across all 4 languages) and is mirrored into
# fintekkers/wrappers/models/security/hierarchy.json by
# sync-hierarchy-mirrors.sh at the repo root. CI's pypi-publish workflow
# runs that script before invoking setup.py, but local `python setup.py
# bdist_wheel` builds need the same materialization. Best-effort: if the
# script isn't reachable (sdist already-unpacked, vendored consumer
# build, etc.) skip silently — the mirror may already be present.
_repo_root_sync = os.path.join(os.path.dirname(os.path.abspath(__file__)),
                               '..', 'sync-hierarchy-mirrors.sh')
if os.path.exists(_repo_root_sync):
    try:
        subprocess.run([_repo_root_sync], check=True)
    except subprocess.CalledProcessError as e:
        print(f"WARN: sync-hierarchy-mirrors.sh failed (exit {e.returncode}); "
              f"build will fail later if hierarchy.json is missing.")

setup(
    name = "fintekkers_ledger_models",
    license='MIT',
    author="David Doherty",
    author_email='dave@fintekkers.org',
    include_package_data=True,
    url='https://github.com/fintekkers/ledger-models',
    keywords='fintekkers ledger models',
        version=VERSION,
        description=DESCRIPTION,
        long_description=LONG_DESCRIPTION,
        packages=find_packages(),
        install_requires=[
            'grpcio',
            'protobuf',
            'python-dotenv',
            'python-dateutil',
            'pytz',
        ],
        
        classifiers= [
            "Programming Language :: Python :: 3",
            "Operating System :: MacOS :: MacOS X",
        ]
)