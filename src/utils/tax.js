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
    return Number(item.price ?? 0) * Number(item.quantity ?? 1);
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
