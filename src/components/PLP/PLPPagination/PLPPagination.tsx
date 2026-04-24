import { Link } from "@tanstack/react-router";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { buttonVariants } from "#/components/ui/button";
import {
	Pagination,
	PaginationContent,
	PaginationEllipsis,
	PaginationItem,
} from "#/components/ui/pagination";
import type { ProductListSearch } from "#/lib/products/search-params";
import { cn } from "#/lib/utils";

/** Props for the {@link PLPPagination} component. */
export interface PLPPaginationProps {
	/** Current 1-based page number. */
	page: number;
	/** Total number of pages; component short-circuits to `null` when ≤ 1. */
	totalPages: number;
	/** Current search params (preserved across page links). */
	search: ProductListSearch;
}

/**
 * Builds the list of page entries to render in the pagination bar,
 * collapsing the middle section with ellipsis when there are many pages.
 * Keeps the first and last page always visible for crawl discoverability.
 */
function buildPageList(
	page: number,
	totalPages: number,
): Array<number | "ellipsis"> {
	if (totalPages <= 7) {
		return Array.from({ length: totalPages }, (_, i) => i + 1);
	}
	const items: Array<number | "ellipsis"> = [1];
	const start = Math.max(2, page - 1);
	const end = Math.min(totalPages - 1, page + 1);
	if (start > 2) items.push("ellipsis");
	for (let i = start; i <= end; i++) items.push(i);
	if (end < totalPages - 1) items.push("ellipsis");
	items.push(totalPages);
	return items;
}

/**
 * Paginated navigator bound to the `pagina` search param. Each page entry
 * is a real `<Link>` (not a button), so the browser/search engines see
 * proper hrefs and can preload on intent.
 */
export function PLPPagination({ page, totalPages, search }: PLPPaginationProps) {
	if (totalPages <= 1) return null;

	const pages = buildPageList(page, totalPages);
	const makeSearch = (p: number) => ({
		...search,
		pagina: p === 1 ? undefined : p,
	});

	return (
		<Pagination>
			<PaginationContent>
				<PaginationItem>
					{page > 1 ? (
						<Link
							to="."
							search={makeSearch(page - 1)}
							aria-label="Página anterior"
							className={cn(
								buttonVariants({ variant: "ghost", size: "default" }),
								"gap-1 px-2.5",
							)}
						>
							<ChevronLeftIcon />
							<span className="hidden sm:block">Anterior</span>
						</Link>
					) : (
						<span
							aria-disabled="true"
							className={cn(
								buttonVariants({ variant: "ghost", size: "default" }),
								"gap-1 px-2.5 pointer-events-none opacity-50",
							)}
						>
							<ChevronLeftIcon />
							<span className="hidden sm:block">Anterior</span>
						</span>
					)}
				</PaginationItem>

				{pages.map((p, idx) =>
					p === "ellipsis" ? (
						// biome-ignore lint/suspicious/noArrayIndexKey: position-stable placeholder
						<PaginationItem key={`e-${idx}`}>
							<PaginationEllipsis />
						</PaginationItem>
					) : (
						<PaginationItem key={p}>
							<Link
								to="."
								search={makeSearch(p)}
								aria-label={`Ir para página ${p}`}
								aria-current={p === page ? "page" : undefined}
								className={cn(
									buttonVariants({
										variant: p === page ? "outline" : "ghost",
										size: "icon",
									}),
								)}
							>
								{p}
							</Link>
						</PaginationItem>
					),
				)}

				<PaginationItem>
					{page < totalPages ? (
						<Link
							to="."
							search={makeSearch(page + 1)}
							aria-label="Próxima página"
							className={cn(
								buttonVariants({ variant: "ghost", size: "default" }),
								"gap-1 px-2.5",
							)}
						>
							<span className="hidden sm:block">Próxima</span>
							<ChevronRightIcon />
						</Link>
					) : (
						<span
							aria-disabled="true"
							className={cn(
								buttonVariants({ variant: "ghost", size: "default" }),
								"gap-1 px-2.5 pointer-events-none opacity-50",
							)}
						>
							<span className="hidden sm:block">Próxima</span>
							<ChevronRightIcon />
						</span>
					)}
				</PaginationItem>
			</PaginationContent>
		</Pagination>
	);
}
