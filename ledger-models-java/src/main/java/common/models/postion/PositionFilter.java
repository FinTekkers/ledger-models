package common.models.postion;

import common.models.IFinancialModelObject;
import common.models.portfolio.Portfolio;
import common.models.security.Security;

import java.time.LocalDate;
import java.time.ZonedDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;

/**
 * Allows for filtering of positions based on exact matches.
 *
 */
public class PositionFilter {
    private final HashMap<Field, PositionComparator> filters;
    private final ZonedDateTime asOf;

    public PositionFilter(ZonedDateTime asOf) {
        this.filters = new HashMap<>();
        this.asOf = asOf;
    }
    public PositionFilter() {
        this(ZonedDateTime.now());
    }

    public void addFilter(Field field, Object value) {
        addFilter(field, Operator.EQUALS, value);
    }

    public void addFilter(Field field, Operator operator, Object value) {
        if(value == null) {
            this.filters.remove(field);
            return;
        }

        if(!field.validateFieldValue(value))
            throw new RuntimeException(String.format("Wrong value for this type! %s for type %s",
                    value, field.getType().getName()));

        this.filters.put(field, new PositionComparator(operator, value));
    }

    public void addPositionDateFilter(Position.PositionType positionType, LocalDate date) {
        switch (positionType) {
            case TRANSACTION:
                addFilter(Field.TRADE_DATE, PositionFilter.Operator.LESS_THAN, date);
                break;
            case TAX_LOT:
                addFilter(Field.TAX_LOT_OPEN_DATE, PositionFilter.Operator.LESS_THAN, date);
                break;
        }
    }

    public HashMap<Field, PositionComparator> getFilters() {
        return this.filters;
    }

    public static <Type extends IFinancialModelObject> List<Type> filter(List<Type> dataObjects, PositionFilter filter) {
        final HashMap<Field, PositionComparator> filters = filter.getFilters();
        final List<Type> output = new ArrayList<>();

        for(Type dataObject : dataObjects) {
            boolean include = true;
            for(Field field : filters.keySet()) {
                Comparable value = (Comparable) dataObject.getField(field);

                PositionComparator comparator = filters.get(field);

                if(value == null && comparator.value != null) {
                    include = false;
                    break;
                }

                int compareResult = value.compareTo(comparator.value);

                if((Operator.EQUALS.equals(comparator.operator) ||
                        Operator.MORE_THAN_OR_EQUALS.equals(comparator.operator) ||
                        Operator.LESS_THAN_OR_EQUALS.equals(comparator.operator)) &&
                    compareResult == 0) {
                    continue;
                } else if((Operator.MORE_THAN.equals(comparator.operator) ||
                        Operator.MORE_THAN_OR_EQUALS.equals(comparator.operator)) &&
                        compareResult > 0) {
                    continue;
                } else if((Operator.LESS_THAN.equals(comparator.operator) ||
                        Operator.LESS_THAN_OR_EQUALS.equals(comparator.operator)) &&
                        compareResult < 0) {
                    continue;
                }

                include = false;
            }

            //Check the asOf
            include = include &&
                    (dataObject.getAsOf().isBefore(filter.getAsOf()) || dataObject.getAsOf().isEqual(filter.getAsOf()));

            if(include)
                output.add(dataObject);
        }

        return output;
    }

    public ZonedDateTime getAsOf() {
        return asOf;
    }

    /**
     * Convenience method to create a filter for a specific portfolio and security.
     *
     * May want to consider using a factory approach and keeping commonly used filters in memory to
     * reduce GC
     *
     * @param portfolio a portfolio for the filter
     * @param security a security for the filter
     * @return a position filter representing the tuple of inputs
     */
    public static PositionFilter from(Portfolio portfolio, Security security) {
        return from(portfolio, security, ZonedDateTime.now());
    }

    public static PositionFilter from(Portfolio portfolio, Security security, ZonedDateTime asOf) {
        return new PositionFilter(asOf) {{
            addFilter(Field.PORTFOLIO, portfolio);
            addFilter(Field.SECURITY, security);
        }};
    }

    /**
     * Creates a position filter with a single field/value combination which will default to equals
     *
     * @param field The Field to filter on
     * @param value The exact value to check the field equals
     * @return A PositionFilter
     */
    public static PositionFilter fromString(Field field, String value) {
        return new PositionFilter() {{
            addFilter(field, value);
        }};
    }

    /**
     * Creates a position filter with a single field/value combination which will default to equals
     *
     * @param field The Field to filter on
     * @param operator The operator to use as a comparator
     * @param value The exact value to check the field equals
     * @return A PositionFilter
     */
    public static PositionFilter from(Field field, Operator operator, Object value) {
        return new PositionFilter() {{
            addFilter(field, operator, value);
        }};
    }

    public static class PositionComparator {
        private Operator operator;
        private Object value;

        PositionComparator(Operator operator, Object value) {
            this.operator = operator;
            this.value = value;
        }

        public Operator getOperator() {
            return operator;
        }

        public Object getValue() {
            return value;
        }
    }

    public enum Operator {
        EQUALS, NOT_EQUALS, LESS_THAN, LESS_THAN_OR_EQUALS, MORE_THAN, MORE_THAN_OR_EQUALS
    }
}
