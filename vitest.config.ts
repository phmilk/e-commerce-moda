import { defineConfig } from "vitest/config";

export default defineConfig({
	resolve: { tsconfigPaths: true },
	test: {
		environment: "jsdom",
		include: ["src/**/*.{test,spec}.{ts,tsx}"],
	},
});
