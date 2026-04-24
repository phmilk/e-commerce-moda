import { useNavigate } from "@tanstack/react-router";
import { Button } from "#/components/ui/button";
import { Separator } from "#/components/ui/separator";
import {
	Sheet,
	SheetContent,
	SheetFooter,
	SheetHeader,
	SheetTitle,
} from "#/components/ui/sheet";
import { useFilterSheet } from "#/hooks/use-filter-sheet";
import {
	clearFilters,
	countActiveFilters,
	type FilterFacet,
	type ProductListSearch,
	toggleFacet,
} from "#/lib/products/search-params";
import type { FacetOption, FilterFacets } from "#/server/products";
import { SortSelect } from "../SortSelect";
import { CategoryTree } from "./CategoryTree";
import { FilterSection } from "./FilterSection";

/** Flat facet sections (non-hierarchical, rendered as checkbox lists). */
type FlatSectionConfig = {
	key: Exclude<FilterFacet, "categoria">;
	options: "marcas" | "condicoes";
	title: string;
};

const FLAT_SECTIONS: FlatSectionConfig[] = [
	{ key: "marca", options: "marcas", title: "Marca" },
	{ key: "condicao", options: "condicoes", title: "Condição" },
];

/** Props for the {@link FilterSheet} component. */
export interface FilterSheetProps {
	/** Current search params (chip selection reflects these). */
	search: ProductListSearch;
	/** Full facet options with per-option counts. */
	facets: FilterFacets;
}

/**
 * Side sheet that hosts the product filter UI on both desktop and
 * mobile. The open/close state is owned by a module-level store
 * ({@link useFilterSheet}) so the Header's filter button (which lives
 * outside of the PLP tree) can open it without prop drilling.
 *
 * The category section uses {@link CategoryTree} (hierarchical),
 * read from `Category.parentId` on the server. Remaining facets
 * (brand, condition) are flat checkbox lists.
 *
 * Writes go straight to the URL via `useNavigate`: checking a box
 * navigates to the same route with the updated search — the URL is the
 * single source of truth, no local form state.
 */
export function FilterSheet({ search, facets }: FilterSheetProps) {
	const [open, setOpen] = useFilterSheet();
	const navigate = useNavigate();

	const activeCount = countActiveFilters(search);

	function handleToggle(facet: FilterFacet, slug: string) {
		navigate({ to: ".", search: toggleFacet(search, facet, slug) });
	}

	function handleClear() {
		navigate({ to: ".", search: clearFilters(search) });
	}

	const selectedCategorias = new Set(search.categoria ?? []);

	return (
		<Sheet open={open} onOpenChange={setOpen}>
			<SheetContent
				side="right"
				className="flex w-full max-w-sm flex-col gap-0 p-0 sm:max-w-md"
			>
				<SheetHeader className="flex-row items-center justify-between gap-4 border-b py-4 pr-12 pl-6">
					<SheetTitle>Filtros</SheetTitle>
					<SortSelect
						value={search.ordem ?? "relevancia"}
						search={search}
					/>
				</SheetHeader>

				<div className="flex-1 overflow-y-auto px-6 py-5">
					<div className="flex flex-col gap-5">
						<CategoryTree
							nodes={facets.categorias}
							selected={selectedCategorias}
							onSelectionChange={(slugs) =>
								navigate({
									to: ".",
									search: {
										...search,
										categoria: slugs.length > 0 ? slugs : undefined,
										pagina: undefined,
									},
								})
							}
						/>

						{FLAT_SECTIONS.map((section) => {
							const options: FacetOption[] = facets[section.options];
							const selected = new Set(search[section.key] ?? []);
							return (
								<div key={section.key} className="flex flex-col gap-3">
									<Separator />
									<FilterSection
										title={section.title}
										options={options}
										selected={selected}
										onToggle={(slug) => handleToggle(section.key, slug)}
									/>
								</div>
							);
						})}
					</div>
				</div>

				<SheetFooter className="flex-row items-center justify-between border-t px-6 py-4">
					<Button
						type="button"
						variant="ghost"
						onClick={handleClear}
						disabled={activeCount === 0}
					>
						Limpar
					</Button>
					<Button type="button" onClick={() => setOpen(false)}>
						Ver resultados
					</Button>
				</SheetFooter>
			</SheetContent>
		</Sheet>
	);
}
