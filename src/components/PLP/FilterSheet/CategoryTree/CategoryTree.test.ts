import { describe, expect, it } from "vitest";
import type { CategoryNode } from "#/server/products";
import {
	collectLeafSlugs,
	compactSelection,
	expandToLeaves,
	simplifyTree,
	subtreeState,
} from "./CategoryTree";

/**
 * Builds a miniature facet tree shaped after the real catalog:
 * Moda Feminina is a root; inside it Acessórios has two real siblings
 * (Bolsas, Chapéus) and Chapéus has a single child (Esporte) — the
 * shape that exposed the "single-child" and "compact-widening" bugs.
 */
function buildTree(): CategoryNode[] {
	return [
		{
			name: "Moda Feminina",
			slug: "moda-feminina",
			count: 10,
			children: [
				{
					name: "Acessórios",
					slug: "acessorios-f",
					count: 10,
					children: [
						{
							name: "Bolsas",
							slug: "bolsas-f",
							count: 4,
							children: [],
						},
						{
							name: "Chapéus",
							slug: "chapeus-f",
							count: 6,
							children: [
								{
									name: "Esporte",
									slug: "esporte-f",
									count: 1,
									children: [],
								},
							],
						},
					],
				},
			],
		},
	];
}

describe("collectLeafSlugs", () => {
	it("retorna o próprio slug para uma folha", () => {
		const [mf] = buildTree();
		const bolsas = mf.children[0].children[0];
		expect(collectLeafSlugs(bolsas)).toEqual(["bolsas-f"]);
	});

	it("desce recursivamente coletando só folhas", () => {
		const [mf] = buildTree();
		const acessorios = mf.children[0];
		expect(collectLeafSlugs(acessorios).sort()).toEqual(
			["bolsas-f", "esporte-f"].sort(),
		);
	});

	it("da raiz, retorna folhas de todo o subtree", () => {
		const [mf] = buildTree();
		expect(collectLeafSlugs(mf).sort()).toEqual(
			["bolsas-f", "esporte-f"].sort(),
		);
	});
});

describe("simplifyTree", () => {
	it("colapsa nó com filho único transformando-o em folha", () => {
		const simplified = simplifyTree(buildTree());
		const mf = simplified[0];
		// Moda Feminina tem só 1 filho (Acessórios) → vira folha na árvore visível.
		expect(mf.children).toEqual([]);
	});

	it("preserva nós com múltiplos filhos", () => {
		const tree: CategoryNode[] = [
			{
				name: "A",
				slug: "a",
				count: 5,
				children: [
					{ name: "B", slug: "b", count: 2, children: [] },
					{ name: "C", slug: "c", count: 3, children: [] },
				],
			},
		];
		const simplified = simplifyTree(tree);
		expect(simplified[0].children).toHaveLength(2);
	});

	it("não muta o input", () => {
		const tree = buildTree();
		const simplified = simplifyTree(tree);
		expect(tree[0].children.length).toBe(1);
		expect(simplified[0].children.length).toBe(0);
	});
});

describe("expandToLeaves", () => {
	it("expande um parent slug para todas as folhas do subtree", () => {
		const nodes = buildTree();
		// Nesse shape, Acessórios tem folhas [bolsas-f, esporte-f].
		const expanded = expandToLeaves(new Set(["acessorios-f"]), nodes);
		expect(expanded).toEqual(new Set(["bolsas-f", "esporte-f"]));
	});

	it("mantém folhas como folhas", () => {
		const nodes = buildTree();
		const expanded = expandToLeaves(new Set(["bolsas-f"]), nodes);
		expect(expanded).toEqual(new Set(["bolsas-f"]));
	});

	it("preserva slug desconhecido para compat com URLs legadas", () => {
		const nodes = buildTree();
		const expanded = expandToLeaves(new Set(["slug-obsoleto"]), nodes);
		expect(expanded).toEqual(new Set(["slug-obsoleto"]));
	});

	it("mescla múltiplos slugs deduplicando folhas", () => {
		const nodes = buildTree();
		const expanded = expandToLeaves(
			new Set(["acessorios-f", "bolsas-f"]),
			nodes,
		);
		expect(expanded).toEqual(new Set(["bolsas-f", "esporte-f"]));
	});
});

describe("subtreeState", () => {
	const nodes = buildTree();
	const acessorios = nodes[0].children[0];
	const bolsas = acessorios.children[0];
	const chapeus = acessorios.children[1];

	it("unchecked quando nada selecionado", () => {
		expect(subtreeState(acessorios, new Set())).toBe("unchecked");
	});

	it("checked quando todas as folhas selecionadas", () => {
		expect(
			subtreeState(acessorios, new Set(["bolsas-f", "esporte-f"])),
		).toBe("checked");
	});

	it("indeterminate quando parte das folhas selecionadas", () => {
		expect(subtreeState(acessorios, new Set(["bolsas-f"]))).toBe(
			"indeterminate",
		);
	});

	it("folha: checked/unchecked reflete presença direta", () => {
		expect(subtreeState(bolsas, new Set(["bolsas-f"]))).toBe("checked");
		expect(subtreeState(bolsas, new Set())).toBe("unchecked");
	});

	it("nó interno com única folha marcada aparece checked", () => {
		expect(subtreeState(chapeus, new Set(["esporte-f"]))).toBe("checked");
	});
});

describe("compactSelection", () => {
	it("uma folha isolada não colapsa pro parent se a cobertura é parcial", () => {
		// Chapéus tem count=6 mas Esporte cobre só 1 produto.
		// Colapsar para chapeus-f ampliaria a seleção → não deve compactar.
		const nodes = buildTree();
		const result = compactSelection(nodes, new Set(["esporte-f"]));
		expect(result).toEqual(["esporte-f"]);
	});

	it("compacta quando a soma de folhas cobre o parent", () => {
		// Acessórios count=10. Bolsas=4 + Esporte=1 = 5. Não cobre Acessórios.
		// Por isso, mesmo com todas as folhas selecionadas, Acessórios não
		// compacta — match com a semântica que evita ampliar.
		const nodes = buildTree();
		const result = compactSelection(
			nodes,
			new Set(["bolsas-f", "esporte-f"]),
		);
		expect(result.sort()).toEqual(["bolsas-f", "esporte-f"].sort());
	});

	it("compacta quando folhas realmente cobrem o parent", () => {
		// Árvore onde as folhas SOMAM o count do parent — compactação safe.
		const tree: CategoryNode[] = [
			{
				name: "Roupas",
				slug: "roupas",
				count: 5,
				children: [
					{ name: "Blusas", slug: "blusas", count: 2, children: [] },
					{ name: "Calças", slug: "calcas", count: 3, children: [] },
				],
			},
		];
		const result = compactSelection(tree, new Set(["blusas", "calcas"]));
		expect(result).toEqual(["roupas"]);
	});

	it("nunca emite parent + filho juntos", () => {
		const tree: CategoryNode[] = [
			{
				name: "Roupas",
				slug: "roupas",
				count: 5,
				children: [
					{ name: "Blusas", slug: "blusas", count: 2, children: [] },
					{ name: "Calças", slug: "calcas", count: 3, children: [] },
				],
			},
		];
		const result = compactSelection(tree, new Set(["blusas", "calcas"]));
		expect(result).not.toContain("blusas");
		expect(result).not.toContain("calcas");
	});

	it("seleção vazia gera lista vazia", () => {
		expect(compactSelection(buildTree(), new Set())).toEqual([]);
	});

	it("seleção parcial emite apenas as folhas marcadas", () => {
		const nodes = buildTree();
		const result = compactSelection(nodes, new Set(["bolsas-f"]));
		expect(result).toEqual(["bolsas-f"]);
	});
});
