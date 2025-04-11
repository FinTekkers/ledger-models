from setuptools import setup, find_packages
import os 

VERSION = '0.0.0' 
DESCRIPTION = 'Fintekkers Ledger Models python package'
LONG_DESCRIPTION = 'Contains the generated python code for the ledger models protos, as well as hand-written wrapper code. See the package url to link to the proto defintions'

if 'BUILD_VERSION' in os.environ:
    print("******************************************")
    print("************OVERRIDING VERSION FROM ENVIRONMENT******************")
    print("******************************************")
    VERSION = os.environ.get('BUILD_VERSION')

setup(
    name = "fintekkers-ledger-models",
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
        'wheel',
        'setuptools~=58.0.4',
        'python-dateutil~=2.8.2',
        'pytz~=2023.3',
        'protobuf>=5.26.1,<6.0dev',
        'grpcio>=1.71.0',
        'grpcio-tools>=1.71.0',
        'pytest',
        'requests>=2.28.2',
        'python-dotenv~=1.0.1'
    ],
    classifiers= [
        "Programming Language :: Python :: 3",
        "Operating System :: MacOS :: MacOS X",
    ]
)