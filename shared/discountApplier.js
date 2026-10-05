export function computeDiscountAmount(subtotal, discount) {
  if (!discount || !subtotal) {
    return 0
  }

  if (discount.type === "percentage") {
    return Number((subtotal * (discount.value / 100)).toFixed(2))
  }

  if (discount.type === "fixed") {
    return Math.min(subtotal, Number(discount.value))
  }

  return 0
}
