import { describe, expect, it } from "vitest";
import { cn } from "./utils";

describe("cn", () => {
	it("concatena classes separadas por espaco", () => {
		expect(cn("px-2", "py-1")).toBe("px-2 py-1");
	});

	it("resolve conflitos do tailwind mantendo a ultima classe", () => {
		expect(cn("p-2", "p-4")).toBe("p-4");
	});

	it("ignora valores falsy", () => {
		expect(cn("text-sm", false, null, undefined, "font-bold")).toBe(
			"text-sm font-bold",
		);
	});

	it("aceita arrays e objetos no padrao clsx", () => {
		expect(cn(["rounded", { hidden: false, block: true }])).toBe(
			"rounded block",
		);
	});
});
