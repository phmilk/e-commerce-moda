import {
	normalizeSearchKey,
	type ProductListSearch,
} from "#/lib/products/search-params";

/**
 * Base URL used to build absolute URLs (canonical, og:url, JSON-LD). Falls
 * back to localhost in dev; read from `BETTER_AUTH_URL` in production.
 */
export const SITE_URL =
	(typeof process !== "undefined" && process.env?.BETTER_AUTH_URL) ||
	"http://localhost:3000";

/**
 * Builds the `<title>` tag for the current PLP view. The title is purposely
 * descriptive (includes active filters + result count) so search engines can
 * differentiate filter combinations as distinct pages.
 *
 * @param search - Active search params.
 * @param total - Total number of matching products.
 */
export function buildTitle(search: ProductListSearch, total: number): string {
	const parts: string[] = [];
	if (search.categoria?.length) parts.push(search.categoria.join(", "));
	if (search.marca?.length) parts.push(search.marca.join(", "));
	if (search.q) parts.push(`"${search.q}"`);
	const prefix = parts.length > 0 ? `${parts.join(" · ")} — ` : "";
	const base = total > 0 ? `${total} produtos` : "Catálogo";
	return `${prefix}${base} | Moda`;
}

/**
 * Builds the `<meta name="description">` string for the current PLP view.
 *
 * @param search - Active search params.
 * @param total - Total number of matching products.
 */
export function buildDescription(
	search: ProductListSearch,
	total: number,
): string {
	const filters: string[] = [];
	if (search.categoria?.length)
		filters.push(`categoria ${search.categoria.join("/")}`);
	if (search.marca?.length) filters.push(`marca ${search.marca.join("/")}`);
	if (search.condicao?.length)
		filters.push(`condição ${search.condicao.join("/")}`);
	const ctx = filters.length > 0 ? ` filtrados por ${filters.join(", ")}` : "";
	return `Explore ${total} produtos${ctx} no catálogo Moda — peças com curadoria, fotos reais e preços em reais.`;
}

/**
 * Builds the canonical URL for the current PLP view. Params are normalized
 * (sorted, defaults dropped) so equivalent filter combinations collapse to a
 * single canonical URL — preventing duplicate-content penalties.
 *
 * @param search - Active search params.
 */
export function buildCanonical(search: ProductListSearch): string {
	const params = new URLSearchParams();
	const norm = normalizeSearchKey(search);
	if (norm.q) params.set("q", norm.q);
	for (const slug of norm.categoria) params.append("categoria", slug);
	for (const slug of norm.marca) params.append("marca", slug);
	for (const slug of norm.condicao) params.append("condicao", slug);
	if (norm.ordem !== "relevancia") params.set("ordem", norm.ordem);
	if (norm.pagina > 1) params.set("pagina", String(norm.pagina));
	const qs = params.toString();
	return qs ? `${SITE_URL}/?${qs}` : `${SITE_URL}/`;
}
