export function resolveItemPrice(basePrice, customizations = {}) {
  for (const choice of Object.values(customizations)) {
    if (choice?.overridePrice != null) {
      return Number(choice.overridePrice)
    }
  }

  const totalMarkup = Object.values(customizations)
    .filter((choice) => choice?.type === "customizable_options")
    .reduce((sum, choice) => sum + Number(choice.priceMarkup || 0), 0)

  return Number(basePrice) + totalMarkup
}
