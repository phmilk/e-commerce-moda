import { Checkbox } from "#/components/ui/checkbox";
import type { FacetOption } from "#/server/products";

/** Props for the {@link FilterSection} component. */
export interface FilterSectionProps {
	/**
	 * Section title shown above the option list. When omitted, the
	 * heading isn't rendered — useful when the caller already provides
	 * its own outer heading (e.g. grouped subsections).
	 */
	title?: string;
	/** Options to render (already filtered to those with `count > 0`). */
	options: FacetOption[];
	/** Currently selected slugs for this section. */
	selected: Set<string>;
	/** Called when the user ticks/unticks an option. */
	onToggle: (slug: string) => void;
}

/**
 * Single filter group (e.g. "Marca") rendered inside the filter sheet.
 * Encapsulates label + list + checkbox row so {@link FilterSheet} can
 * render N sections without repeating JSX.
 */
export function FilterSection({
	title,
	options,
	selected,
	onToggle,
}: FilterSectionProps) {
	if (options.length === 0) return null;
	return (
		<div className="flex flex-col gap-3">
			{title ? (
				<h3 className="text-sm font-medium text-foreground">{title}</h3>
			) : null}
			<ul className="flex flex-col gap-2">
				{options.map((opt) => {
					const id = `f-${title ?? "section"}-${opt.slug}`;
					return (
						<li key={opt.slug} className="flex items-center gap-2">
							<Checkbox
								id={id}
								checked={selected.has(opt.slug)}
								onCheckedChange={() => onToggle(opt.slug)}
							/>
							<label
								htmlFor={id}
								className="flex flex-1 cursor-pointer items-center justify-between text-sm"
							>
								<span>{opt.name}</span>
								<span className="text-xs text-muted-foreground">
									{opt.count}
								</span>
							</label>
						</li>
					);
				})}
			</ul>
		</div>
	);
}
