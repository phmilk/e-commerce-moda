import { ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";
import { Checkbox } from "#/components/ui/checkbox";
import { cn } from "#/lib/utils";
import type { CategoryNode } from "#/server/products";

/** Aggregate selection state for a subtree. */
export type TreeState = "checked" | "unchecked" | "indeterminate";

/** Props for the {@link CategoryTree} component. */
export interface CategoryTreeProps {
	/** Root-level category nodes. */
	nodes: CategoryNode[];
	/** Currently selected category slugs (as they live in the URL). */
	selected: Set<string>;
	/**
	 * Called with the minimal (compacted) set of slugs whenever the
	 * selection changes. A parent slug replaces its whole subtree when
	 * every descendant leaf is on, recursively up to the root.
	 */
	onSelectionChange: (nextSlugs: string[]) => void;
}

/**
 * Collects every **leaf** slug under a node (or the node's own slug if
 * it is itself a leaf). Internal node slugs are excluded.
 */
export function collectLeafSlugs(node: CategoryNode): string[] {
	if (node.children.length === 0) return [node.slug];
	const out: string[] = [];
	for (const child of node.children) out.push(...collectLeafSlugs(child));
	return out;
}

/**
 * Indexes every node in the tree by slug for O(1) lookups.
 */
function indexNodesBySlug(
	nodes: CategoryNode[],
): Map<string, CategoryNode> {
	const byslug = new Map<string, CategoryNode>();
	const walk = (n: CategoryNode) => {
		byslug.set(n.slug, n);
		for (const c of n.children) walk(c);
	};
	for (const r of nodes) walk(r);
	return byslug;
}

/**
 * Expands the URL-level selection (which may contain parent slugs as
 * shortcuts) into the equivalent set of **leaf** slugs. A parent slug
 * stands for "every leaf in this subtree is selected"; this lets the
 * component always reason in a single, flat domain internally.
 */
export function expandToLeaves(
	selected: Set<string>,
	nodes: CategoryNode[],
): Set<string> {
	const byslug = indexNodesBySlug(nodes);
	const out = new Set<string>();
	for (const slug of selected) {
		const node = byslug.get(slug);
		if (!node) {
			// Unknown slug (e.g. stale from an older URL) — keep as-is so the
			// backend still matches if applicable.
			out.add(slug);
			continue;
		}
		if (node.children.length === 0) {
			out.add(slug);
		} else {
			for (const leaf of collectLeafSlugs(node)) out.add(leaf);
		}
	}
	return out;
}

/**
 * Sums contextual counts across every leaf in a subtree. Used by
 * {@link compactSelection} to detect whether the visible leaf set
 * actually accounts for every product tagged under a given parent —
 * if some products live on the parent without any leaf tag, we must
 * not compact, because the parent slug would widen the filter.
 */
function sumLeafCounts(node: CategoryNode): number {
	if (node.children.length === 0) return node.count;
	let total = 0;
	for (const child of node.children) total += sumLeafCounts(child);
	return total;
}

/**
 * Compacts a fully-expanded leaf selection into the minimal slug list.
 * Walks the tree bottom-up: a subtree is "covered" only when every
 * leaf is selected **and** the sum of those leaf counts accounts for
 * every product under the parent (preventing a narrow sub-leaf like
 * "Esporte" from collapsing up into a broader parent like "Chapéus"
 * when the parent has products outside the visible subtree).
 *
 * Safe invariant: the output never contains both a parent slug and
 * any of its descendants — the parent implies them — and never
 * widens the filter beyond what the user actually selected.
 */
export function compactSelection(
	nodes: CategoryNode[],
	leafSelected: Set<string>,
): string[] {
	const fullyCovered = new Set<string>();

	const walk = (node: CategoryNode): boolean => {
		if (node.children.length === 0) {
			if (leafSelected.has(node.slug)) {
				fullyCovered.add(node.slug);
				return true;
			}
			return false;
		}
		let all = true;
		for (const child of node.children) {
			if (!walk(child)) all = false;
		}
		if (!all) return false;
		// Only compact when the visible subtree covers every product tagged
		// with the parent slug. If `sumLeafCounts < node.count`, the parent
		// has "bare" products without a matching leaf — compacting would
		// silently widen the selection.
		if (sumLeafCounts(node) < node.count) return false;
		fullyCovered.add(node.slug);
		return true;
	};
	for (const root of nodes) walk(root);

	const out: string[] = [];
	const emit = (node: CategoryNode) => {
		if (fullyCovered.has(node.slug)) {
			out.push(node.slug);
			return;
		}
		for (const c of node.children) emit(c);
	};
	for (const root of nodes) emit(root);
	return out;
}

/**
 * Aggregate selection state for a subtree, counted over leaves. Works
 * in the expanded-leaves domain so it naturally handles URLs that
 * carry a compact parent slug.
 */
export function subtreeState(
	node: CategoryNode,
	expandedLeaves: Set<string>,
): TreeState {
	const leaves = collectLeafSlugs(node);
	let picked = 0;
	for (const slug of leaves) if (expandedLeaves.has(slug)) picked++;
	if (picked === 0) return "unchecked";
	if (picked === leaves.length) return "checked";
	return "indeterminate";
}

/**
 * Hides single-child descendants from the rendered tree: when a node
 * has exactly one child, the child is dropped and the node itself
 * becomes a leaf in the visible tree. Users then pick the parent
 * directly — its slug already filters the broader set — avoiding the
 * confusion of a "sub-category" that only restricts the parent by a
 * narrower subset. Drilling only makes sense when there are real
 * siblings to choose from.
 */
export function simplifyTree(nodes: CategoryNode[]): CategoryNode[] {
	return nodes.map(simplifyNode);
}

export function simplifyNode(node: CategoryNode): CategoryNode {
	if (node.children.length === 0) return node;
	if (node.children.length === 1) {
		return { ...node, children: [] };
	}
	return { ...node, children: node.children.map(simplifyNode) };
}

/**
 * Renders the category filter as a hierarchical tree: parents can be
 * expanded/collapsed, checked, or indeterminate when some descendants
 * are selected. Clicking a parent bulk-toggles its whole subtree; on
 * write, the selection is compacted so the URL stays short (a full
 * subtree collapses into just its root slug).
 */
export function CategoryTree({
	nodes,
	selected,
	onSelectionChange,
}: CategoryTreeProps) {
	const visibleNodes = useMemo(() => simplifyTree(nodes), [nodes]);
	const expandedLeaves = useMemo(
		() => expandToLeaves(selected, visibleNodes),
		[selected, visibleNodes],
	);

	if (visibleNodes.length === 0) return null;

	function handleToggleSubtree(node: CategoryNode) {
		const leaves = collectLeafSlugs(node);
		const state = subtreeState(node, expandedLeaves);
		const next = new Set(expandedLeaves);
		if (state === "unchecked") {
			for (const leaf of leaves) next.add(leaf);
		} else {
			for (const leaf of leaves) next.delete(leaf);
		}
		onSelectionChange(compactSelection(visibleNodes, next));
	}

	return (
		<div className="flex flex-col gap-3">
			<h3 className="text-sm font-medium text-foreground">Categoria</h3>
			<ul className="flex flex-col gap-1">
				{visibleNodes.map((node) => (
					<CategoryTreeNode
						key={node.slug}
						node={node}
						depth={0}
						expandedLeaves={expandedLeaves}
						onToggle={handleToggleSubtree}
					/>
				))}
			</ul>
		</div>
	);
}

interface CategoryTreeNodeProps {
	node: CategoryNode;
	depth: number;
	expandedLeaves: Set<string>;
	onToggle: (node: CategoryNode) => void;
}

/**
 * True when any leaf inside this subtree is currently selected —
 * used to keep branches auto-expanded when there's a live descendant.
 */
function hasSelectedDescendant(
	node: CategoryNode,
	expandedLeaves: Set<string>,
): boolean {
	const leaves = collectLeafSlugs(node);
	for (const leaf of leaves) if (expandedLeaves.has(leaf)) return true;
	return false;
}

/** Recursive node renderer with expand/collapse + indentation per depth. */
function CategoryTreeNode({
	node,
	depth,
	expandedLeaves,
	onToggle,
}: CategoryTreeNodeProps) {
	const hasChildren = node.children.length > 0;
	const [open, setOpen] = useState<boolean>(
		hasChildren && hasSelectedDescendant(node, expandedLeaves),
	);

	const state = subtreeState(node, expandedLeaves);
	const checked: boolean | "indeterminate" =
		state === "checked"
			? true
			: state === "indeterminate"
				? "indeterminate"
				: false;
	const id = `cat-${node.slug}`;

	return (
		<li>
			<div
				className="flex items-center gap-2"
				style={{ paddingLeft: `${depth * 16}px` }}
			>
				{hasChildren ? (
					<button
						type="button"
						aria-expanded={open}
						aria-label={open ? "Recolher" : "Expandir"}
						onClick={() => setOpen((v) => !v)}
						className="inline-flex size-5 shrink-0 items-center justify-center rounded hover:bg-accent"
					>
						<ChevronRight
							className={cn(
								"size-3.5 transition-transform",
								open && "rotate-90",
							)}
						/>
					</button>
				) : (
					<span aria-hidden className="inline-block size-5 shrink-0" />
				)}

				<Checkbox
					id={id}
					checked={checked}
					onCheckedChange={() => onToggle(node)}
				/>
				<label
					htmlFor={id}
					className="flex flex-1 cursor-pointer items-center justify-between text-sm"
				>
					<span>{node.name}</span>
					<span className="text-xs text-muted-foreground">{node.count}</span>
				</label>
			</div>

			{hasChildren && open ? (
				<ul className="mt-1 flex flex-col gap-1">
					{node.children.map((child) => (
						<CategoryTreeNode
							key={child.slug}
							node={child}
							depth={depth + 1}
							expandedLeaves={expandedLeaves}
							onToggle={onToggle}
						/>
					))}
				</ul>
			) : null}
		</li>
	);
}
