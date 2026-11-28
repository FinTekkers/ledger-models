/**
 * LM-509 — the settlement convention contract.
 *
 * A request with SettlementConventionProto (80) and DV01, and a response with
 * settlement_date (60), measure_asof_date (61) and a DV01 result, round-trip
 * unchanged. Measure 31, which LM-509 added, is removed and reserved (LM-514);
 * DV01 stays 25. Request bytes written by
 * v1.1.62 parse with the convention unset and every existing field as it was.
 * ValuationRequests.settlementConvention checks only the calendar-free rules
 * the proto comment states; it computes no date.
 */
export {};
