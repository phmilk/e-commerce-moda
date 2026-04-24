import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "#/components/ui/tooltip";
import type { ProductListSearch } from "#/lib/products/search-params";
import type { CategoryNode, FilterFacets } from "#/server/products";

/** Props for the {@link PLPHeader} component. */
export interface PLPHeaderProps {
	/** Current search params — drives the heading composition. */
	search: ProductListSearch;
	/** Total matching products (drives the aria-live result count). */
	total: number;
	/**
	 * Facet data used to resolve category slugs in `search.categoria`
	 * back to their humanized display names ("Acessórios Femininos"
	 * instead of "acessorios-f"). May be `undefined` on the very first
	 * render if the query cache isn't primed yet.
	 */
	facets: FilterFacets | undefined;
}

/** Formats "A, B, C e D" in pt-BR. Memoized at module scope. */
const LIST_FORMATTER = new Intl.ListFormat("pt-BR", {
	style: "long",
	type: "conjunction",
});

/**
 * Walks the category tree once, collecting every node by slug, so the
 * heading can resolve any selected slug (root or leaf) to its label.
 */
function indexCategoryLabels(nodes: CategoryNode[]): Map<string, string> {
	const out = new Map<string, string>();
	const walk = (n: CategoryNode) => {
		out.set(n.slug, n.displayName ?? n.name);
		for (const child of n.children) walk(child);
	};
	for (const n of nodes) walk(n);
	return out;
}

/**
 * Falls back to a capitalized slug when a selected category is not
 * found in the facet tree (e.g. filter returns 0 and the node was
 * pruned). Keeps the heading readable even in edge cases.
 */
function capitalizeSlug(slug: string): string {
	return slug
		.split("-")
		.map((s) => s.charAt(0).toUpperCase() + s.slice(1))
		.join(" ");
}

/**
 * Composes the page heading according to the active filters:
 *   - nothing active        → "Catálogo"
 *   - search only           → `Resultados para "X"`
 *   - category filter(s)    → `Resultados em A, B e C`
 *   - search + categories   → `Resultados para "X" em A, B e C`
 *
 * Only `q` and `categoria` participate; brand/condition/size are
 * deliberately left out to keep the heading focused on what the user
 * cares most about at a glance.
 */
function buildHeading(
	search: ProductListSearch,
	labels: string[],
): string {
	const hasQuery = Boolean(search.q);
	const hasCats = labels.length > 0;

	if (!hasQuery && !hasCats) return "Catálogo";
	if (hasQuery && !hasCats) return `Resultados para "${search.q}"`;
	const formatted = LIST_FORMATTER.format(labels);
	if (!hasQuery && hasCats) return `Resultados em ${formatted}`;
	return `Resultados para "${search.q}" em ${formatted}`;
}

/**
 * PLP page header: H1 that adapts to active filters plus an `aria-live`
 * result count so screen-reader users hear the list update. The
 * heading is truncated with an ellipsis when it overflows and a
 * tooltip on hover/focus reveals the full text.
 */
export function PLPHeader({ search, total, facets }: PLPHeaderProps) {
	const labelBySlug = facets
		? indexCategoryLabels(facets.categorias)
		: new Map<string, string>();
	const categoryLabels = (search.categoria ?? []).map(
		(slug) => labelBySlug.get(slug) ?? capitalizeSlug(slug),
	);

	const heading = buildHeading(search, categoryLabels);

	return (
		<header className="mb-6 flex flex-col gap-2">
			<Tooltip>
				<TooltipTrigger asChild>
					<h1 className="truncate text-2xl font-semibold tracking-tight md:text-3xl">
						{heading}
					</h1>
				</TooltipTrigger>
				<TooltipContent className="max-w-xl">
					<p>{heading}</p>
				</TooltipContent>
			</Tooltip>
			<p className="text-sm text-muted-foreground" aria-live="polite">
				{total === 1 ? "1 produto" : `${total} produtos`}
			</p>
		</header>
	);
}
