export const nonNegativeNumberInputProps = {
    min: "0",
    onKeyDown: (event) => {
        if (["-", "+", "e", "E"].includes(event.key)) {
            event.preventDefault();
        }
    },
};

export function toNonNegativeNumberValue(value) {
    if (value === "") return "";

    const number = Number(value);

    if (Number.isNaN(number)) return "";
    if (number < 0) return "0";

    return value;
}
