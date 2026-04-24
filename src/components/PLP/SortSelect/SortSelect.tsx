import { useNavigate } from "@tanstack/react-router";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "#/components/ui/select";
import {
	type ProductListSearch,
	SORT_KEYS,
	SORT_LABELS,
	type SortKey,
} from "#/lib/products/search-params";

/** Props for the {@link SortSelect} component. */
export interface SortSelectProps {
	/** Current sort key (drives the trigger label). */
	value: SortKey;
	/** Current search params — preserved when the sort changes. */
	search: ProductListSearch;
}

/**
 * Sort dropdown bound to the `ordem` search param. Selecting a value
 * navigates to the same route with the updated search, which triggers the
 * loader and cache update — no local state.
 */
export function SortSelect({ value, search }: SortSelectProps) {
	const navigate = useNavigate();

	function handleChange(next: string) {
		const ordem = next as SortKey;
		navigate({
			to: ".",
			search: {
				...search,
				ordem: ordem === "relevancia" ? undefined : ordem,
				pagina: undefined,
			},
		});
	}

	return (
		<div className="flex items-center gap-2">
			<label htmlFor="sort-select" className="text-sm text-muted-foreground">
				Ordenar
			</label>
			<Select value={value} onValueChange={handleChange}>
				<SelectTrigger id="sort-select" size="sm" className="min-w-44">
					<SelectValue placeholder="Ordenar por" />
				</SelectTrigger>
				<SelectContent>
					{SORT_KEYS.map((key) => (
						<SelectItem key={key} value={key}>
							{SORT_LABELS[key]}
						</SelectItem>
					))}
				</SelectContent>
			</Select>
		</div>
	);
}
