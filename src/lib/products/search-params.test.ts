import { describe, expect, it } from "vitest";
import {
	clearFilters,
	countActiveFilters,
	normalizeSearchKey,
	type ProductListSearch,
	toggleFacet,
	validateProductSearch,
} from "./search-params";

describe("validateProductSearch", () => {
	it("retorna objeto vazio para input vazio", () => {
		expect(validateProductSearch({})).toEqual({});
	});

	it("preserva q com trim", () => {
		expect(validateProductSearch({ q: "  bolsa  " })).toEqual({ q: "bolsa" });
	});

	it("ignora q em branco", () => {
		expect(validateProductSearch({ q: "   " })).toEqual({});
	});

	it("envolve string solta num array de slugs", () => {
		expect(validateProductSearch({ categoria: "acessorios-m" })).toEqual({
			categoria: ["acessorios-m"],
		});
	});

	it("preserva arrays e remove entradas vazias/não-string", () => {
		expect(
			validateProductSearch({
				marca: ["kairo", "", 42 as unknown as string, "vertice-moda"],
			}),
		).toEqual({ marca: ["kairo", "vertice-moda"] });
	});

	it("descarta ordem inválida", () => {
		expect(validateProductSearch({ ordem: "qualquer-coisa" })).toEqual({});
	});

	it("aceita ordem válida", () => {
		expect(validateProductSearch({ ordem: "preco-asc" })).toEqual({
			ordem: "preco-asc",
		});
	});

	it("converte pagina string em número e descarta < 1", () => {
		expect(validateProductSearch({ pagina: "3" })).toEqual({ pagina: 3 });
		expect(validateProductSearch({ pagina: "0" })).toEqual({});
		expect(validateProductSearch({ pagina: "abc" })).toEqual({});
	});

	it("combina múltiplos facets", () => {
		expect(
			validateProductSearch({
				q: "bone",
				categoria: ["chapeus-m"],
				marca: "kairo",
				condicao: ["novo", "usado"],
				ordem: "nome-asc",
				pagina: 2,
			}),
		).toEqual({
			q: "bone",
			categoria: ["chapeus-m"],
			marca: ["kairo"],
			condicao: ["novo", "usado"],
			ordem: "nome-asc",
			pagina: 2,
		});
	});
});

describe("normalizeSearchKey", () => {
	it("preenche defaults e ordena arrays", () => {
		const search: ProductListSearch = {
			categoria: ["roupas-m", "acessorios-m"],
			marca: ["kairo"],
		};
		expect(normalizeSearchKey(search)).toEqual({
			q: "",
			categoria: ["acessorios-m", "roupas-m"],
			marca: ["kairo"],
			condicao: [],
			ordem: "relevancia",
			pagina: 1,
		});
	});

	it("duas buscas com mesma semântica geram chaves iguais", () => {
		const a: ProductListSearch = {
			categoria: ["b", "a"],
			marca: ["y", "x"],
		};
		const b: ProductListSearch = {
			categoria: ["a", "b"],
			marca: ["x", "y"],
		};
		expect(normalizeSearchKey(a)).toEqual(normalizeSearchKey(b));
	});
});

describe("toggleFacet", () => {
	it("adiciona slug quando ausente", () => {
		expect(toggleFacet({}, "marca", "kairo")).toEqual({
			marca: ["kairo"],
			pagina: undefined,
		});
	});

	it("remove slug quando presente", () => {
		const result = toggleFacet(
			{ marca: ["kairo", "vertice-moda"] },
			"marca",
			"kairo",
		);
		expect(result.marca).toEqual(["vertice-moda"]);
	});

	it("remove o facet por completo quando a última opção é desmarcada", () => {
		const result = toggleFacet({ marca: ["kairo"] }, "marca", "kairo");
		expect(result.marca).toBeUndefined();
	});

	it("sempre reseta pagina", () => {
		const result = toggleFacet(
			{ marca: ["kairo"], pagina: 3 },
			"marca",
			"vertice-moda",
		);
		expect(result.pagina).toBeUndefined();
	});
});

describe("clearFilters", () => {
	it("preserva q e ordem, remove facets", () => {
		expect(
			clearFilters({
				q: "bolsa",
				ordem: "preco-asc",
				categoria: ["acessorios-m"],
				marca: ["kairo"],
				condicao: ["novo"],
				pagina: 2,
			}),
		).toEqual({ q: "bolsa", ordem: "preco-asc" });
	});

	it("quando tudo está vazio retorna objeto sem chaves definidas", () => {
		expect(clearFilters({})).toEqual({ q: undefined, ordem: undefined });
	});
});

describe("countActiveFilters", () => {
	it("zero para busca vazia", () => {
		expect(countActiveFilters({})).toBe(0);
	});

	it("ignora q e ordem", () => {
		expect(countActiveFilters({ q: "bolsa", ordem: "preco-asc" })).toBe(0);
	});

	it("soma slugs de categoria, marca e condição", () => {
		expect(
			countActiveFilters({
				categoria: ["a", "b"],
				marca: ["x"],
				condicao: ["novo", "usado"],
			}),
		).toBe(5);
	});
});
