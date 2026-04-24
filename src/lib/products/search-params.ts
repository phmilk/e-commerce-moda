/**
 * Valid sort keys accepted by the product listing page, serialized in the URL
 * as the `ordem` search param.
 */
export const SORT_KEYS = [
	"relevancia",
	"preco-asc",
	"preco-desc",
	"nome-asc",
	"nome-desc",
] as const;

/** Union of valid values for the `ordem` search param. */
export type SortKey = (typeof SORT_KEYS)[number];

/**
 * Shape of the URL search params for the PLP route. The URL is the single
 * source of truth for filters, sort and pagination — no parallel state.
 */
export type ProductListSearch = {
	/** Free-text search term (matched against product name/description). */
	q?: string;
	/** Selected category slugs. */
	categoria?: string[];
	/** Selected brand slugs. */
	marca?: string[];
	/** Selected condition slugs. */
	condicao?: string[];
	/** Sort key; defaults to `relevancia` when missing. */
	ordem?: SortKey;
	/** 1-based page number; defaults to `1` when missing. */
	pagina?: number;
};

/** Number of items per PLP page. */
export const PAGE_SIZE = 24;

/** Human-readable labels for each sort option (used in the `<SortSelect>`). */
export const SORT_LABELS: Record<SortKey, string> = {
	relevancia: "Relevância",
	"preco-asc": "Menor preço",
	"preco-desc": "Maior preço",
	"nome-asc": "Nome (A → Z)",
	"nome-desc": "Nome (Z → A)",
};

/** Names of multi-value filter facets mirrored in the URL. */
export type FilterFacet = "categoria" | "marca" | "condicao";

function toStringArray(value: unknown): string[] | undefined {
	if (value == null) return undefined;
	if (Array.isArray(value)) {
		const cleaned = value.filter(
			(v): v is string => typeof v === "string" && v.length > 0,
		);
		return cleaned.length > 0 ? cleaned : undefined;
	}
	if (typeof value === "string" && value.length > 0) return [value];
	return undefined;
}

function toSortKey(value: unknown): SortKey | undefined {
	if (typeof value !== "string") return undefined;
	return (SORT_KEYS as readonly string[]).includes(value)
		? (value as SortKey)
		: undefined;
}

function toPage(value: unknown): number | undefined {
	const n = typeof value === "number" ? value : Number(value);
	if (!Number.isFinite(n)) return undefined;
	const int = Math.trunc(n);
	return int >= 1 ? int : undefined;
}

/**
 * Parses an opaque record (typically `URLSearchParams` entries) into a typed
 * {@link ProductListSearch}. Invalid values are silently dropped; this makes
 * the route resilient to stale or user-crafted URLs.
 *
 * Used as the `validateSearch` callback on the PLP route.
 *
 * @param input - Raw search params as received from the router.
 * @returns A normalized {@link ProductListSearch} with only defined fields.
 */
export function validateProductSearch(
	input: Record<string, unknown>,
): ProductListSearch {
	const q =
		typeof input.q === "string" && input.q.trim().length > 0
			? input.q.trim()
			: undefined;

	const out: ProductListSearch = {
		q,
		categoria: toStringArray(input.categoria),
		marca: toStringArray(input.marca),
		condicao: toStringArray(input.condicao),
		ordem: toSortKey(input.ordem),
		pagina: toPage(input.pagina),
	};

	for (const key of Object.keys(out) as (keyof ProductListSearch)[]) {
		if (out[key] === undefined) delete out[key];
	}

	return out;
}

/**
 * Produces a stable, serializable key from a search object — used as the
 * second item in a TanStack Query key so that requests with equivalent
 * filters hit the same cache entry even if param order differs.
 *
 * @param search - The validated search object.
 * @returns A normalized object with deterministic array ordering and defaults.
 */
export function normalizeSearchKey(search: ProductListSearch) {
	const sortArr = (xs: string[] | undefined) => (xs ? [...xs].sort() : []);
	return {
		q: search.q ?? "",
		categoria: sortArr(search.categoria),
		marca: sortArr(search.marca),
		condicao: sortArr(search.condicao),
		ordem: search.ordem ?? "relevancia",
		pagina: search.pagina ?? 1,
	};
}

/**
 * Returns a new search where the given facet slug is toggled on/off and the
 * page is reset to the first one (filter changes invalidate pagination).
 *
 * @param current - Current search params.
 * @param facet - Facet name to toggle within.
 * @param slug - Lookup slug to add or remove.
 */
export function toggleFacet(
	current: ProductListSearch,
	facet: FilterFacet,
	slug: string,
): ProductListSearch {
	const list = current[facet] ?? [];
	const has = list.includes(slug);
	const next = has ? list.filter((s) => s !== slug) : [...list, slug];
	return {
		...current,
		[facet]: next.length > 0 ? next : undefined,
		pagina: undefined,
	};
}

/**
 * Strips every filter facet but preserves free-text query and sort. Used by
 * the "Clear filters" actions in the filter sheet, active-filter chips and
 * empty state.
 *
 * @param current - Current search params.
 */
export function clearFilters(current: ProductListSearch): ProductListSearch {
	return { q: current.q, ordem: current.ordem };
}

/**
 * Counts how many filter facet values are currently applied (sum across all
 * facets, excluding `q` and `ordem`).
 *
 * @param search - Current search params.
 */
export function countActiveFilters(search: ProductListSearch): number {
	return (
		(search.categoria?.length ?? 0) +
		(search.marca?.length ?? 0) +
		(search.condicao?.length ?? 0)
	);
}
