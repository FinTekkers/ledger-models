//! Approach 2: Product-specific RPC dispatch
//! Each RPC has its own handler that constructs the appropriate internal types.

// This file demonstrates how the server would dispatch product-specific RPCs.
// Each handler converts proto -> internal types -> runs calculation -> converts back.

// Example: bond valuation handler
// fn handle_bond_valuation(req: BondValuationRequest) -> BondValuationResponse {
//     let bond = bond_spec_from_proto(&req.security)?;
//     let curve = curve_from_proto(&req.benchmark_curve)?;
//     let price = parse_decimal(&req.clean_price)?;
//     ...
// }

// Example: swap valuation handler
// fn handle_swap_valuation(req: SwapValuationRequest) -> SwapValuationResponse {
//     let projection = curve_from_proto(&req.projection_curve)?;
//     let discount = curve_from_proto(&req.discount_curve)?;
//     let swap = SwapSpec { ... from req fields ... };
//     let npv = swap::pricing::swap_npv(&swap, direction, &projection, &discount);
//     ...
// }
