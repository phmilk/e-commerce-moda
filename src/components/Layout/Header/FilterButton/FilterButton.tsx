import { useSearch } from "@tanstack/react-router";
import { SlidersHorizontal } from "lucide-react";
import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import { openFilterSheet } from "#/hooks/use-filter-sheet";
import { countActiveFilters } from "#/lib/products/search-params";
import { cn } from "#/lib/utils";

/** Props for the {@link FilterButton} component. */
export interface FilterButtonProps {
	/** Extra classes merged onto the button (for layout tweaks). */
	className?: string;
}

/**
 * Header button that opens the product filter sheet. Reads the current
 * URL search params (non-strict, so it no-ops on routes without the PLP
 * schema) to show a small badge with the number of active filter values.
 *
 * Open state lives in the module-level `use-filter-sheet` store so this
 * button (mounted in the Header, outside of the PLP route tree) can
 * trigger a sheet rendered inside the PLP.
 */
export function FilterButton({ className }: FilterButtonProps) {
	// biome-ignore lint/suspicious/noExplicitAny: search shape is route-specific; we only read known keys
	const search = useSearch({ strict: false }) as Record<string, any>;
	const activeCount = countActiveFilters(search);
	const label =
		activeCount > 0
			? `Abrir filtros (${activeCount} ativos)`
			: "Abrir filtros";

	return (
		<Button
			type="button"
			variant="outline"
			size="icon"
			aria-label={label}
			onClick={openFilterSheet}
			className={cn("relative size-10 shrink-0", className)}
		>
			<SlidersHorizontal />
			{activeCount > 0 ? (
				<Badge
					aria-hidden="true"
					className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full p-0 text-[10px]"
				>
					{activeCount}
				</Badge>
			) : null}
		</Button>
	);
}
