import { FieldProto } from '../../../fintekkers/models/position/field_pb';
import { PositionFilterOperator } from '../../../fintekkers/models/position/position_util_pb';
import { assetClassMatches } from '../security/product_hierarchy';

/** A single filter clause: the field, operator and filter value. */
export interface FilterSpec {
  field: FieldProto;
  operator: PositionFilterOperator;
  value: any;
}

/** A row the matcher can read: the Security and Position wrappers qualify. */
export interface FilterableRow {
  getField(field: FieldProto): any;
}

/**
 * Single-field evaluator (LM-281), mirroring Java's PositionFilter.matches:
 * ASSET_CLASS with EQUALS / NOT_EQUALS uses the shared assetClassMatches
 * rule, so a group code such as FIXED_INCOME matches its members and labels;
 * every other field compares exactly. A null or undefined stored value never
 * throws and drops the row for every operator, except ASSET_CLASS with
 * NOT_EQUALS, which keeps it (LM-281). The null check runs before the
 * ASSET_CLASS branch, so it handles that asset-class exception itself
 * (LM-284). An unknown operator matches nothing. Errors raised by row.getField
 * propagate (a row represents an absent value by returning null).
 */
export function matches(
  field: FieldProto,
  operator: PositionFilterOperator,
  filterValue: any,
  storedValue: any,
): boolean {
  if (storedValue === null || storedValue === undefined) {
    return field === FieldProto.ASSET_CLASS && operator === PositionFilterOperator.NOT_EQUALS;
  }
  if (
    field === FieldProto.ASSET_CLASS &&
    (operator === PositionFilterOperator.EQUALS ||
      operator === PositionFilterOperator.NOT_EQUALS)
  ) {
    const equals = assetClassMatches(filterValue, storedValue);
    return operator === PositionFilterOperator.EQUALS ? equals : !equals;
  }
  switch (operator) {
    case PositionFilterOperator.EQUALS:
      return storedValue === filterValue;
    case PositionFilterOperator.NOT_EQUALS:
      return storedValue !== filterValue;
    case PositionFilterOperator.LESS_THAN:
      return storedValue < filterValue;
    case PositionFilterOperator.LESS_THAN_OR_EQUALS:
      return storedValue <= filterValue;
    case PositionFilterOperator.MORE_THAN:
      return storedValue > filterValue;
    case PositionFilterOperator.MORE_THAN_OR_EQUALS:
      return storedValue >= filterValue;
    default:
      return false;
  }
}

/**
 * Keep the rows matching every clause in `filters` (AND semantics, input
 * order preserved).
 */
export function filterRows<T extends FilterableRow>(rows: T[], filters: FilterSpec[]): T[] {
  return rows.filter((row) => {
    return filters.every((spec) =>
      matches(spec.field, spec.operator, spec.value, row.getField(spec.field)),
    );
  });
}
