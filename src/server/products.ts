import { createServerFn } from "@tanstack/react-start";
import { prisma } from "#/db";
import {
	PAGE_SIZE,
	type ProductListSearch,
	type SortKey,
	validateProductSearch,
} from "#/lib/products/search-params";

/**
 * Shape returned for each product card in the PLP grid — shaped at the
 * server boundary so the client never sees raw Prisma types and to keep the
 * serialized payload small (no description, no unused relations).
 */
export type ProductCardData = {
	id: number;
	sku: string;
	slug: string;
	name: string;
	priceCents: number;
	currency: string;
	brand: { name: string; slug: string };
	condition: { name: string; slug: string };
	primaryImage: { path: string; alt: string } | null;
	categoriesBreadcrumb: Array<{ name: string; slug: string }>;
};

/** Paged product list payload. */
export type ListProductsResult = {
	items: ProductCardData[];
	page: number;
	pageSize: number;
	total: number;
	totalPages: number;
};

/** One option in a filter section, with the number of matching products. */
export type FacetOption = {
	/** Short label shown inside compact UI (e.g. the filter tree). */
	name: string;
	/**
	 * Humanized, context-aware label used outside of the tree — in the
	 * page heading, chips, breadcrumbs. Omitted for facets where it
	 * would duplicate `name` (brand, condition, size).
	 */
	displayName?: string;
	slug: string;
	count: number;
};

/**
 * One node in the category filter tree. `children` is empty for leaves.
 * The hierarchy is read from `Category.parentId` on the server.
 */
export type CategoryNode = FacetOption & { children: CategoryNode[] };

/** Full set of facet options for the sidebar. */
export type FilterFacets = {
	categorias: CategoryNode[];
	marcas: FacetOption[];
	condicoes: FacetOption[];
};

/**
 * Splits a free-text query into meaningful tokens (1+ char alphanumerics,
 * lowercased) so we can AND-match every token against product name or
 * description — a lightweight fuzzy-style search that tolerates word
 * reordering and typos at word boundaries ("camisa azul" ↔ "azul camisa").
 */
function tokenizeQuery(q: string): string[] {
	return q
		.toLowerCase()
		.split(/\s+/)
		.map((t) => t.replace(/[^\p{L}\p{N}]+/gu, ""))
		.filter((t) => t.length >= 2);
}

/**
 * Builds the Prisma `orderBy` clause for the requested sort key. The
 * secondary `id` order guarantees a stable pagination when primary values
 * tie (e.g. two products with the same price).
 */
function buildOrderBy(ordem: SortKey | undefined) {
	switch (ordem) {
		case "preco-asc":
			return [{ price: "asc" as const }, { id: "asc" as const }];
		case "preco-desc":
			return [{ price: "desc" as const }, { id: "asc" as const }];
		case "nome-asc":
			return [{ name: "asc" as const }, { id: "asc" as const }];
		case "nome-desc":
			return [{ name: "desc" as const }, { id: "asc" as const }];
		default:
			return [{ createdAt: "desc" as const }, { id: "desc" as const }];
	}
}

/**
 * Translates a validated {@link ProductListSearch} into a Prisma `where`
 * clause. Facet filters become relational `some` matches using the slug
 * lookups; free-text queries become an AND of `contains` matches (one per
 * token) joined by OR across name/description.
 */
function buildWhere(search: ProductListSearch): Record<string, unknown> {
	const where: Record<string, unknown> = {};

	if (search.q) {
		const tokens = tokenizeQuery(search.q);
		if (tokens.length > 0) {
			where.AND = tokens.map((token) => ({
				OR: [
					{ name: { contains: token } },
					{ description: { contains: token } },
				],
			}));
		}
	}

	if (search.marca?.length) {
		where.brand = { slug: { in: search.marca } };
	}

	if (search.condicao?.length) {
		where.condition = { slug: { in: search.condicao } };
	}

	if (search.categoria?.length) {
		where.categories = {
			some: { category: { slug: { in: search.categoria } } },
		};
	}

	return where;
}

/**
 * Server function that returns a paginated, filtered and sorted product
 * list. Called from both the route loader (SSR) and the client-side
 * `useQuery` on filter changes — TanStack Query deduplicates between the
 * two when the keys match.
 *
 * Parallelism: `findMany` and `count` run in a single `Promise.all`; the
 * `include` was kept minimal (one primary image, the brand/condition
 * lookup, ordered breadcrumb categories) to avoid N+1.
 */
export const listProducts = createServerFn({ method: "GET" })
	.inputValidator(
		(data: unknown): ProductListSearch =>
			validateProductSearch((data ?? {}) as Record<string, unknown>),
	)
	.handler(async ({ data: search }): Promise<ListProductsResult> => {
		const where = buildWhere(search);
		const orderBy = buildOrderBy(search.ordem);
		const page = search.pagina && search.pagina >= 1 ? search.pagina : 1;
		const skip = (page - 1) * PAGE_SIZE;

		const [rows, total] = await Promise.all([
			prisma.product.findMany({
				where,
				orderBy,
				skip,
				take: PAGE_SIZE,
				include: {
					brand: { select: { name: true, slug: true } },
					condition: { select: { name: true, slug: true } },
					images: {
						orderBy: { position: "asc" },
						take: 1,
						select: { path: true },
					},
					categories: {
						orderBy: { position: "asc" },
						select: {
							category: { select: { name: true, slug: true } },
						},
					},
				},
			}),
			prisma.product.count({ where }),
		]);

		const items: ProductCardData[] = rows.map((p) => ({
			id: p.id,
			sku: p.sku,
			slug: p.slug,
			name: p.name,
			priceCents: p.price,
			currency: p.currency,
			brand: p.brand,
			condition: p.condition,
			primaryImage: p.images[0]
				? { path: p.images[0].path, alt: `${p.name} — ${p.brand.name}` }
				: null,
			categoriesBreadcrumb: p.categories.map((c) => c.category),
		}));

		return {
			items,
			page,
			pageSize: PAGE_SIZE,
			total,
			totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
		};
	});

/**
 * Builds the category tree from a flat list of category options plus a
 * parent-of map. Options whose `count` is 0 **and** which are not
 * selected are pruned, along with any resulting empty branches.
 *
 * @param options - Flat list of facet options (already with contextual counts).
 * @param parentOf - `categoryId → parentCategoryId | null` map.
 * @param idBySlug - Lookup from slug back to id (needed to walk the tree).
 */
function buildCategoryTree(
	options: FacetOption[],
	parentOf: Map<number, number | null>,
	idBySlug: Map<string, number>,
): CategoryNode[] {
	const bySlug = new Map<string, CategoryNode>();
	for (const opt of options) {
		bySlug.set(opt.slug, { ...opt, children: [] });
	}

	const roots: CategoryNode[] = [];
	for (const opt of options) {
		const node = bySlug.get(opt.slug);
		if (!node) continue;
		const id = idBySlug.get(opt.slug);
		const parentId = id != null ? parentOf.get(id) ?? null : null;
		// Find parent node in the already-pruned option set. Walk up the
		// chain in case the direct parent was pruned for count=0.
		let currentParentId: number | null = parentId;
		let parentNode: CategoryNode | undefined;
		const slugOfId = (target: number) => {
			for (const [slug, id2] of idBySlug) if (id2 === target) return slug;
			return undefined;
		};
		while (currentParentId != null) {
			const parentSlug = slugOfId(currentParentId);
			if (parentSlug && bySlug.has(parentSlug)) {
				parentNode = bySlug.get(parentSlug);
				break;
			}
			currentParentId = parentOf.get(currentParentId) ?? null;
		}
		if (parentNode) parentNode.children.push(node);
		else roots.push(node);
	}

	// Stable alpha sort at each level.
	const sortRec = (nodes: CategoryNode[]) => {
		nodes.sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
		for (const n of nodes) sortRec(n.children);
	};
	sortRec(roots);

	return roots;
}

/**
 * Server function that returns facet options with **contextual counts** —
 * each section shows "how many products would match if I toggled this
 * option", which is the standard faceted-search UX.
 *
 * For each facet, the count is computed by applying the current search
 * **minus that facet's own filter**. This way an already-selected option
 * reflects the hypothetical count as if it were unchecked — users can
 * always tell whether checking another box will narrow or change
 * direction.
 *
 * Implementation: one `groupBy` per facet (4 queries total), all running
 * in parallel, plus one lookup fetch per facet to hydrate names/slugs.
 */
export const listFilterFacets = createServerFn({ method: "GET" })
	.inputValidator(
		(data: unknown): ProductListSearch =>
			validateProductSearch((data ?? {}) as Record<string, unknown>),
	)
	.handler(async ({ data: search }): Promise<FilterFacets> => {
		// Build one "where" per facet, dropping that facet's own filter so
		// the count reflects what the user would see if they flipped it.
		const whereExceptBrand = buildWhere({ ...search, marca: undefined });
		const whereExceptCondition = buildWhere({ ...search, condicao: undefined });
		const whereExceptCategory = buildWhere({ ...search, categoria: undefined });

		const [
			brandGroups,
			conditionGroups,
			categoryGroups,
			brands,
			conditions,
			categories,
		] = await Promise.all([
			prisma.product.groupBy({
				by: ["brandId"],
				where: whereExceptBrand,
				_count: { _all: true },
			}),
			prisma.product.groupBy({
				by: ["conditionId"],
				where: whereExceptCondition,
				_count: { _all: true },
			}),
			prisma.productCategory.groupBy({
				by: ["categoryId"],
				where: { product: whereExceptCategory },
				_count: { _all: true },
			}),
			prisma.brand.findMany({
				select: { id: true, name: true, slug: true },
				orderBy: { name: "asc" },
			}),
			prisma.condition.findMany({
				select: { id: true, name: true, slug: true },
				orderBy: { name: "asc" },
			}),
			prisma.category.findMany({
				select: {
					id: true,
					name: true,
					displayName: true,
					slug: true,
					parentId: true,
				},
				orderBy: { name: "asc" },
			}),
		]);

		// Category hierarchy comes straight from the DB — `parentId` is
		// the canonical parent (set by the seed from GENDERED_CATEGORY_TREE).
		const categoryParents = new Map<number, number | null>(
			categories.map((c) => [c.id, c.parentId ?? null]),
		);

		// Index counts by the grouped FK id for O(1) joins below.
		const brandCountById = new Map(
			brandGroups.map((g) => [g.brandId, g._count._all]),
		);
		const conditionCountById = new Map(
			conditionGroups.map((g) => [g.conditionId, g._count._all]),
		);
		const categoryCountById = new Map(
			categoryGroups.map((g) => [g.categoryId, g._count._all]),
		);

		/**
		 * Joins a lookup list with its contextual count map and drops options
		 * whose count is 0 **unless** the user already selected them (we
		 * always keep selected options so the user can un-tick).
		 */
		const toOptions = (
			rows: Array<{
				id: number;
				name: string;
				slug: string;
				displayName?: string | null;
			}>,
			countById: Map<number, number>,
			selected: string[] | undefined,
		): FacetOption[] => {
			const selectedSet = new Set(selected ?? []);
			return rows
				.map((r) => {
					const opt: FacetOption = {
						name: r.name,
						slug: r.slug,
						count: countById.get(r.id) ?? 0,
					};
					if (r.displayName) opt.displayName = r.displayName;
					return opt;
				})
				.filter((opt) => opt.count > 0 || selectedSet.has(opt.slug));
		};

		const categoryIdBySlug = new Map(categories.map((c) => [c.slug, c.id]));

		return {
			marcas: toOptions(brands, brandCountById, search.marca),
			condicoes: toOptions(conditions, conditionCountById, search.condicao),
			categorias: buildCategoryTree(
				toOptions(categories, categoryCountById, search.categoria),
				categoryParents,
				categoryIdBySlug,
			),
		};
	});
