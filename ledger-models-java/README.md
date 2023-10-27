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

The Java package is published after a release version is created via the workflow file: .github/workflows/maven-publish.yml. The gradle publish of the build publishes the package and relies on the NPM_TOKEN secret being injected leveraging GitHub secrets.

Currently, this is published to Github's package repository. ledger-models is set-up on maven central with David's personal account (I think). Need to industrialize this to avoid needing people to setup npm package repo with permissions...