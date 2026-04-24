import { useNavigate, useSearch } from "@tanstack/react-router";
import { Search, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "#/components/ui/button";
import { Input } from "#/components/ui/input";
import { cn } from "#/lib/utils";

/** How long to wait after the user stops typing before updating the URL. */
const DEBOUNCE_MS = 300;

/** Props for the {@link SearchBar} component. */
export interface SearchBarProps {
	/** Extra classes merged onto the wrapper (for layout tweaks). */
	className?: string;
}

/**
 * Free-text product search bound to the `q` search param. Updates are
 * debounced so every keystroke doesn't trigger a navigation; the actual
 * search logic happens server-side (token-based substring match against
 * name and description — a lightweight fuzzy approximation that
 * tolerates word order and partial words).
 *
 * Clearing the input removes the param entirely (not `q=""`) so the
 * canonical URL stays clean.
 */
export function SearchBar({ className }: SearchBarProps) {
	// biome-ignore lint/suspicious/noExplicitAny: search shape is route-specific; we only read `q`
	const search = useSearch({ strict: false }) as Record<string, any>;
	const navigate = useNavigate();

	const [value, setValue] = useState<string>(
		typeof search.q === "string" ? search.q : "",
	);
	const lastPushedRef = useRef<string>(typeof search.q === "string" ? search.q : "");

	// Sync local state when the URL changes externally (e.g. back button).
	useEffect(() => {
		const next = typeof search.q === "string" ? search.q : "";
		if (next !== lastPushedRef.current) {
			setValue(next);
			lastPushedRef.current = next;
		}
	}, [search.q]);

	// Debounce pushes to the URL.
	useEffect(() => {
		const trimmed = value.trim();
		if (trimmed === lastPushedRef.current) return;
		const handle = setTimeout(() => {
			lastPushedRef.current = trimmed;
			navigate({
				to: ".",
				search: (prev: Record<string, unknown>) => ({
					...prev,
					q: trimmed.length > 0 ? trimmed : undefined,
					pagina: undefined,
				}),
			});
		}, DEBOUNCE_MS);
		return () => clearTimeout(handle);
	}, [value, navigate]);

	return (
		<div className={cn("relative flex-1", className)}>
			<Search
				aria-hidden="true"
				className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
			/>
			<Input
				type="search"
				role="searchbox"
				aria-label="Buscar produtos por nome"
				placeholder="Buscar produtos..."
				value={value}
				onChange={(e) => setValue(e.target.value)}
				className="h-10 pl-9 pr-10"
			/>
			{value.length > 0 ? (
				<Button
					type="button"
					variant="ghost"
					size="icon"
					aria-label="Limpar busca"
					onClick={() => setValue("")}
					className="absolute top-1/2 right-1 size-8 -translate-y-1/2"
				>
					<X className="size-4" />
				</Button>
			) : null}
		</div>
	);
}
