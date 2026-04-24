import { useNavigate } from "@tanstack/react-router";
import { PackageOpen } from "lucide-react";
import { Button } from "#/components/ui/button";
import {
	clearFilters,
	type ProductListSearch,
} from "#/lib/products/search-params";

/** Props for the {@link EmptyState} component. */
export interface EmptyStateProps {
	/** Current search params — used to build the "clear filters" action. */
	search: ProductListSearch;
}

/**
 * Friendly empty state shown when the combination of filters + query
 * returns zero products. Offers a one-click reset that keeps the
 * free-text query and sort intact.
 */
export function EmptyState({ search }: EmptyStateProps) {
	const navigate = useNavigate();

	return (
		<div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed py-16 text-center">
			<PackageOpen className="size-10 text-muted-foreground" aria-hidden />
			<h2 className="text-lg font-semibold">Nenhum produto encontrado</h2>
			<p className="max-w-sm text-sm text-muted-foreground">
				Tente remover algum filtro ou buscar por outro termo para ver mais
				opções.
			</p>
			<Button
				type="button"
				variant="outline"
				onClick={() => navigate({ to: ".", search: clearFilters(search) })}
			>
				Limpar filtros
			</Button>
		</div>
	);
}
