# ADR: A TBILL has no coupon

## Status

Accepted (LM-258).

## Context

1,619 `TBILL` rows were written with a non-zero `coupon_rate` (LS-38). A loader outside ledger-service wrote them, so a rule in ledger-service alone would not stop the next writer. Treasury bills are discount instruments: they pay no coupon.

The `coupon_rate` comment on `main` also said "decimal fraction (0.05 = 5%)" and "5.0 will be rejected". No binding enforced that, and valuation-service divides `coupon_rate` by 100, so the field is in percentage form in practice.

## Decision

### The rule

When `product_type == TBILL`, `bond_details.coupon_rate` must be unset or 0.

- Unset means either no `coupon_rate` message, or one whose `arbitrary_precision_value` is empty.
- 0 is compared numerically (`0`, `0.00` pass). Any other value, positive or negative, is rejected.
- Only the explicit `product_type` counts. `inferProductType` never infers `TBILL`.
- Link securities (`is_link=true`) are skipped, like every other security rule: hydrate first.
- A value that does not parse as a decimal is skipped, not rejected. This rule is about T-bills having no coupon; it adds no format, unit or magnitude checks.
- Every other product type is unaffected: a `TREASURY_NOTE` with 6.0 passes.

The violation uses the LM-255 shape (`FieldViolationProto`, see `typed-input-errors.md`): `field = "bond_details.coupon_rate"` (the path relative to the security, as the proto spec for `field` requires), `object_id` = the security UUID, and a message naming `coupon_rate` and its value. The typed error's message adds the security ID.

### Units

The proto comment on `coupon_rate` is now the spec: percentage form, 6.0 = 6%, 0.625 = 0.625%. The "5.0 will be rejected" sentence is removed. This supersedes the comment-only commit `28e7ad81` on `docs/vs-26-coupon-rate-percentage-comment`.

### Write-side, not at construction

The rule lives in the security rule set (`SecurityRules.validate` in Java, next to the bond date rule) and is **not** called by `Security.fromProto` or any wrapper constructor. Existing bad rows, like the LS-38 ones, must still load and deserialize. Writers call the validator before saving.

| Binding | Validate (violations) | Require valid (throws/returns error) | Typed input error | Called by in this repo |
|---|---|---|---|---|
| Java | `SecurityRules.validate(SecurityProto)` | `SecurityRules.requireValid` | `ModelValidationException` | none; ledger-service calls it on save |
| Python | `security_rules.validate(SecurityProto)` | `security_rules.require_valid` | `ModelValidationError` | `SecurityService.create_or_update`, `validate_create_or_update` |
| Rust | `validate_security(&SecurityProto)` | `require_valid_security` | `Error::Validation(Vec<FieldViolationProto>)` | none; there is no Rust security client here |
| JS/TS | `security_rules.validate(SecurityProto)` | `security_rules.requireValid` | `ModelValidationError` | `SecurityService.createSecurity`, `validateCreateSecurity` |

Python and JS have a security service client in this repo, so their clients run the rule before the gRPC call; that is what stops the loaders. Java and Rust have no security client here, so their writers (ledger-service) must call the validator themselves.

The Python, JS and Rust typed input errors are the types `typed-input-errors.md` names for LM-255b/c/d, added here with the shape Java has (non-empty violations; first violation's field and object ID). LM-255b/c/d add the remaining bond rules to these same rule modules.

## Consequences

- A Python or JS loader that sends a `TBILL` with a non-zero coupon now fails before the RPC with `ModelValidationError` naming `bond_details.coupon_rate` and the security ID. This is intended.
- Stored `TBILL` rows with a coupon still load in every binding. Cleaning them up belongs to the ledger-service items.
- A writer that bypasses the validators (raw gRPC stub) is not stopped here; ledger-service closes that gap server-side.
