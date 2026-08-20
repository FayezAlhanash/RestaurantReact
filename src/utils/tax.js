const taxValueKeys = [
    "restaurantTaxPercentage",
    "restaurantTaxRate",
    "tax_percentage",
    "taxPercentage",
    "tax_rate",
    "taxRate",
];

export function normalizeTaxRate(value) {
    const numericValue = Number(value);

    if (!Number.isFinite(numericValue) || numericValue <= 0) return 0;

    return numericValue > 1 ? numericValue / 100 : numericValue;
}

export function getRestaurantTaxRate(source = {}) {
    const directValue = taxValueKeys
        .map((key) => source?.[key])
        .find((value) => value !== undefined && value !== null && value !== "");
    const restaurantValue = taxValueKeys
        .map((key) => source?.restaurant?.[key])
        .find((value) => value !== undefined && value !== null && value !== "");

    return normalizeTaxRate(directValue ?? restaurantValue);
}

export function getLineSubtotal(item = {}) {
    const quantity = Number(item.quantity ?? 1);
    const unitPrice = Number(
        item.price ?? item.unitPrice ?? item.unit_price ?? item.unit_price_cents ?? 0,
    );
    const explicitLineTotal = Number(
        item.lineTotal ?? item.line_total ?? item.total_price ?? item.totalPrice,
    );

    if (Number.isFinite(explicitLineTotal) && explicitLineTotal > 0) {
        return explicitLineTotal;
    }

    return (Number.isFinite(unitPrice) ? unitPrice : 0) *
        (Number.isFinite(quantity) ? quantity : 1);
}

export function getLineTax(item = {}) {
    return getLineSubtotal(item) * getRestaurantTaxRate(item);
}

export function getCartTotals(items = []) {
    const subtotal = items.reduce((sum, item) => sum + getLineSubtotal(item), 0);
    const tax = items.reduce((sum, item) => sum + getLineTax(item), 0);

    return {
        subtotal,
        tax,
        total: subtotal + tax,
    };
}
