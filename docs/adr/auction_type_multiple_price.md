# ADR: MULTIPLE_PRICE auction type and the meaning of price_for_single_price_auction

## Status

Accepted (LM-367).

## Context

`AuctionTypeProto` had only `UNKNOWN_AUCTION_TYPE = 0` and `SINGLE_PRICE = 1`. US Treasury auctions before 1998-11-01 were multiple-price: each winning bidder paid the price it bid. Those auctions could only be recorded as unknown, which looks the same as unset.

The comment on `IssuanceProto.price_for_single_price_auction` said only "the price paid by bidders". It gave no units, did not say what TIPS store, and did not say when the field is unset.

## Decision

### MULTIPLE_PRICE = 2

`AuctionTypeProto` gains `MULTIPLE_PRICE = 2`. It is the next free number. `UNKNOWN_AUCTION_TYPE = 0` and `SINGLE_PRICE = 1` keep their numbers and names. Nothing is renumbered, renamed or removed.

| Value | Meaning |
|---|---|
| `UNKNOWN_AUCTION_TYPE = 0` | Unset or not known. |
| `SINGLE_PRICE = 1` | All winning bidders pay one clearing price. US Treasury auctions from 1998-11-01. |
| `MULTIPLE_PRICE = 2` | Each winning bidder pays the price it bid. US Treasury auctions before 1998-11-01. |

### price_for_single_price_auction (field 25)

The field number and type do not change. The proto comment is now the spec:

- It is the auction's single issue price, **per 100 par**.
- For inflation-indexed securities (TIPS) it is the **real, unadjusted** price. It is **not** multiplied by the index ratio.
- It is **unset** when the auction has no single issue price: multiple-price auctions, reopenings and bills.

No binding enforces the unset rule. That would be new validation logic; see Out of scope.

## Wire compatibility

proto3 enums are open. A reader built against the old enum parses a message with `auction_type = 2` without error and keeps the raw value:

| Binding | Old binding reading `2` |
|---|---|
| Python | `proto.auction_type == 2`; the wrapper's `get_auction_type()` returns `2`. |
| Java | `getAuctionType() == UNRECOGNIZED`; `getAuctionTypeValue() == 2`. |
| Rust | `proto.auction_type == 2`; the wrapper's `auction_type()` returns `UnknownAuctionType`. |
| JS | `getAuctionType() === 2`. |

Each binding's Issuance wrapper test decodes field 24 with the unknown value `99` and checks this. `scripts/checks/wire-diff.py` rule `lm367` allows exactly the one new enum value.

## Rollback

Revert the change. Do not reuse `2` once a release carries it: add `reserved 2; reserved "MULTIPLE_PRICE";` instead.

## Out of scope (possible follow-ups)

- Raw-value accessors on the wrappers (for example Rust `auction_type_raw()`), so the Rust wrapper stops collapsing values it does not know to `UnknownAuctionType`.
- A models validator that rejects `price_for_single_price_auction` set together with `auction_type = MULTIPLE_PRICE`.
