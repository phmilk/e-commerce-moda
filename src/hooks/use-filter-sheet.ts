import { useSyncExternalStore } from "react";

type Listener = () => void;

let open = false;
const listeners = new Set<Listener>();

function subscribe(listener: Listener): () => void {
	listeners.add(listener);
	return () => {
		listeners.delete(listener);
	};
}

function getSnapshot(): boolean {
	return open;
}

/**
 * Sets the filter sheet's open state (fires subscribers).
 *
 * Lives at module scope so that unrelated components (Header's filter
 * button and the PLP page that renders the actual `<Sheet>`) can
 * coordinate without an ambient React Context or prop-drilling. Kept
 * intentionally minimal — only one boolean — to avoid creeping into a
 * general-purpose global store.
 */
function setOpen(value: boolean): void {
	if (open === value) return;
	open = value;
	for (const listener of listeners) listener();
}

/**
 * React hook exposing the filter-sheet open state as a reactive boolean.
 * Pairs `openFilterSheet`/`closeFilterSheet` for imperative callers.
 *
 * @returns `[open, setOpen]` tuple; same-shape as `useState`.
 */
export function useFilterSheet(): readonly [boolean, (value: boolean) => void] {
	const value = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
	return [value, setOpen] as const;
}

/** Imperatively open the filter sheet (e.g. from an event handler). */
export function openFilterSheet(): void {
	setOpen(true);
}

/** Imperatively close the filter sheet. */
export function closeFilterSheet(): void {
	setOpen(false);
}
