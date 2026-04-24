const BRL = new Intl.NumberFormat("pt-BR", {
	style: "currency",
	currency: "BRL",
});

/**
 * Formats a value stored in cents as a Brazilian Real (BRL) string.
 *
 * @param cents - Amount in cents (e.g. `15999` renders as `R$ 159,99`).
 * @returns Localized BRL string using `pt-BR` locale.
 */
export function formatBRL(cents: number): string {
	return BRL.format(cents / 100);
}
