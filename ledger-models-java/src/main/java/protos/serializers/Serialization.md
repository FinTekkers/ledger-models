# Strategy for serialization

Currently, we serialize each object and their dependencies as of the time 
the parent object was created. This means if you create a price object both 
the price and the security will be serialized. If you create a transaction 
object the portfolio, security, price, etc will be serialized also. This means
you can load a transaction object and see the state of dependencies at serialization
time, but it may mean you are looking at old data. 

Short term, we will allow old data to be serialized as the objects will remain quite
small. When data sizes explode we may need to change that. Also need to consider the 
impact of data model changes, especially breaking changes.

## Formats

### Native

The center of the universe is the programming-based object hierarchy. The Java 
implementation is the gold-standard with other programming languages implemented to 
mirror the object and inheritance model. 

The rationale behind this is to make programming against the object model an easier 
achievement. For example, someone wanting to use the object model and services should be
able to code natively in Python/Java/etc without having to spend a lot of upfront time mapping
JSON objects (which is painful and can be haphazard).

### Proto

Google Protobuf is used to serialize objects in a compact manner while retaining schema information. 
Note that the protobuf language is meant purely for serialization, and therefore doesn't have 
concepts like input validation. Any validation logic would be available when using the native language
implementations. 

Service-to-service communication will use protobuf formats to communicate. This allows the backend to
pick different languages based on the use case.

### JSON

JSON is supported only as a presentation format because it is heavily used by various languages and
frameworks. JSON is converted into protobufs or native formats as early as possible as they will have 
functionality attached to object (e.g. validation).

Those writing UI layers will have the optionality to leverage JSON natively or use profobuf combined with 
Javascript implementation. As JSON is free-format, schema changes will be harder to foresee.

WARNING: JSON serialization will likely be less performant than other formats as it attempts to leverage
human readable strings where possible which may involve the creation of intermediate objects and/or formatters.

# Change Management

## Additive Changes

Previously serialized objects will successfully deserialize but values may be unknown, and 
code needs to understand that.

## Breaking Changes - Not currently supported

Options:

1/ Resolve on load (conversion on demand)
2/ Resolve on upgrade (update written down items)
3/ ?

Examples:
* Transactions with parent / child relationships. 
* Foreign key relationships, how far to nest

# Transaction: object plus serializer (LM-444)

Java `Transaction` is a plain object again: fields plus its list of child
transactions. `common.models.transaction.TransactionSerializer` builds a new
`TransactionProto` on every `getProto()` call and only reads the transaction,
so two threads serialising the same transaction cannot corrupt each other's
output. #340 had made it a wrapper around a proto with a shared mutable
builder, and two ledger-service threads serialising one BUY on 6 Nov stored
rows with the wrong number of children.

The bytes are unchanged: the nested Security and Portfolio are written as
links, the trade Price inline with its Security as a link (LM-394). Building
from a proto resolves those links once (see `docs/adr/lazy-link-hydration.md`);
getters and serialising never fetch. The serializer sits next to `Transaction`
so it can read its package-private fields.
