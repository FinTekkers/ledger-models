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


# Publishing

The Java package is published after a release version is created via the workflow file: .github/workflows/maven-publish.yml (to Github) and maven-central.yml (to Maven Central). The gradle publish of the build publishes the package and relies on the NPM_TOKEN secret being injected leveraging GitHub secrets.

The gradle import would be 
implementation group: 'io.github.fintekkers', name: 'ledger-models', version: '0.1.x'. Please ignore 1.0.x versions as these were published in error. Upon public launch the major version will update.

# GPG signing

The packages 