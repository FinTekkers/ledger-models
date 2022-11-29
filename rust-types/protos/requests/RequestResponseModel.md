# Overview

# Making a Request

# Was the request successful?

* HTTP codes?
* Messages?
* Exceptions? Technical vs. Business
  * Technical -> HTTP codes? E.g. 200 means system processed it
  * Business -> E.g. was this transaction successfully applied to the portfolio
  
# The Response

Formats: proto vs. json

* Service-to-service communication via protos
* Clients can use JSON, but there is a performance penalty
  * There are no guarantees around re-hydrating data back from JSON into proto
  * Example being position responses as they are a point-in-time reflection of the underlying data