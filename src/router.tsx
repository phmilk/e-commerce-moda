import { createRouter as createTanStackRouter } from "@tanstack/react-router";
import { setupRouterSsrQueryIntegration } from "@tanstack/react-router-ssr-query";
import { getContext } from "./integrations/tanstack-query/root-provider";
import { routeTree } from "./routeTree.gen";

/**
 * Parses a URL search string into a plain record, treating repeated
 * keys as arrays. Keeps values as strings — each route's
 * `validateSearch` is responsible for coercion (numbers, enums, etc.).
 */
function parseSearch(searchStr: string): Record<string, unknown> {
	const params = new URLSearchParams(searchStr);
	const out: Record<string, unknown> = {};
	for (const [key, value] of params) {
		if (key in out) {
			const existing = out[key];
			if (Array.isArray(existing)) existing.push(value);
			else out[key] = [existing, value];
		} else {
			out[key] = value;
		}
	}
	return out;
}

/**
 * Serializes a search record back to a URL query string. Arrays are
 * emitted as repeated keys (`?categoria=a&categoria=b`) instead of
 * JSON, which keeps URLs short, shareable and SEO-friendly.
 */
function stringifySearch(search: Record<string, unknown>): string {
	const params = new URLSearchParams();
	for (const [key, value] of Object.entries(search)) {
		if (value == null) continue;
		if (Array.isArray(value)) {
			for (const v of value) {
				if (v == null) continue;
				params.append(key, String(v));
			}
		} else {
			params.set(key, String(value));
		}
	}
	const str = params.toString();
	return str ? `?${str}` : "";
}

export function getRouter() {
	const context = getContext();

	const router = createTanStackRouter({
		routeTree,
		context,
		scrollRestoration: true,
		defaultPreload: "intent",
		defaultPreloadStaleTime: 0,
		parseSearch,
		stringifySearch,
	});

	setupRouterSsrQueryIntegration({ router, queryClient: context.queryClient });

	return router;
}

declare module "@tanstack/react-router" {
	interface Register {
		router: ReturnType<typeof getRouter>;
	}
}
