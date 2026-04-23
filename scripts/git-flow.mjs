#!/usr/bin/env node
import { execSync, spawnSync } from "node:child_process";

const COMMIT_TYPES = [
	"feat",
	"fix",
	"chore",
	"docs",
	"refactor",
	"test",
	"ci",
	"perf",
	"build",
	"style",
	"revert",
];
const BRANCH_TYPES = ["feat", "fix", "chore", "release", "hotfix"];
const COMMIT_RE =
	/^(feat|fix|chore|docs|refactor|test|ci|perf|build|style|revert)(\([\w.\-/ ]+\))?!?: .{1,}$/;

const RED = "\x1b[31m";
const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";
const CYAN = "\x1b[36m";
const RESET = "\x1b[0m";

const fail = (msg, code = 1) => {
	console.error(`${RED}✖ ${msg}${RESET}`);
	process.exit(code);
};
const ok = (msg) => console.log(`${GREEN}✓ ${msg}${RESET}`);
const warn = (msg) => console.log(`${YELLOW}! ${msg}${RESET}`);
const info = (msg) => console.log(`${CYAN}ℹ ${msg}${RESET}`);

const sh = (cmd, opts = {}) =>
	execSync(cmd, { stdio: "inherit", encoding: "utf8", ...opts });
const shGet = (cmd) => execSync(cmd, { encoding: "utf8" }).trim();

function suggestTypeFromStaged() {
	let staged = "";
	try {
		staged = shGet("git diff --cached --name-only");
	} catch {
		return null;
	}
	const files = staged.split("\n").filter(Boolean);
	if (!files.length) return null;

	const all = (pred) => files.every(pred);
	const some = (pred) => files.some(pred);

	if (all((f) => f.startsWith(".github/workflows/") || f.startsWith(".github/")))
		return "ci";
	if (all((f) => /\.md$/i.test(f) || f.startsWith("docs/"))) return "docs";
	if (all((f) => /(test|spec)\.[tj]sx?$/.test(f) || f.includes("__tests__/")))
		return "test";
	if (
		all((f) =>
			/^(package\.json|pnpm-lock\.yaml|tsconfig.*\.json|biome\.json|vite\.config\.ts)$/.test(
				f,
			),
		)
	)
		return "chore";
	if (some((f) => /\.(ts|tsx|js|jsx)$/.test(f) && !/(test|spec)\./.test(f)))
		return "feat";
	return "chore";
}

function parseFlag(args, name) {
	const i = args.indexOf(name);
	if (i < 0) return null;
	return args[i + 1] ?? null;
}

function commitCmd(args) {
	const message = parseFlag(args, "-m") ?? parseFlag(args, "--message");
	if (!message)
		fail('Uso: git-flow commit -m "<tipo>(escopo?): descrição"');

	if (!COMMIT_RE.test(message)) {
		console.error(
			`${RED}✖ Mensagem fora do padrão Conventional Commits${RESET}`,
		);
		console.error(`  Recebido: "${message}"`);
		console.error(`  Esperado: <tipo>(<escopo opcional>)!?: <descrição>`);
		console.error(`  Tipos válidos: ${COMMIT_TYPES.join(", ")}`);
		console.error(`  Ex.: feat(cart): adiciona persistência local`);
		console.error(`       fix!: remove campo legado da resposta`);
		const sug = suggestTypeFromStaged();
		if (sug)
			console.error(
				`${YELLOW}  Sugestão (com base nos arquivos staged): ${sug}: ...${RESET}`,
			);
		process.exit(1);
	}

	sh(`git commit -m ${JSON.stringify(message)}`);
	ok("Commit criado");
}

function kebab(input) {
	return input
		.toLowerCase()
		.normalize("NFD")
		.replace(/[̀-ͯ]/g, "")
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/(^-|-$)/g, "");
}

function branchCmd(args) {
	const [type, ...descParts] = args;
	if (!type || !descParts.length)
		fail("Uso: git-flow branch <tipo> <descrição>");
	if (!BRANCH_TYPES.includes(type))
		fail(`Tipo inválido "${type}". Use: ${BRANCH_TYPES.join(", ")}`);

	const slug = kebab(descParts.join(" "));
	if (!slug) fail("Descrição vazia após normalização");

	const name = `${type}/${slug}`;
	sh(`git checkout -b ${name}`);
	ok(`Branch criada: ${name}`);
}

const LABEL_BY_TYPE = {
	feat: "enhancement",
	fix: "bug",
	chore: "chore",
	release: "release",
	hotfix: "hotfix",
};

function prCmd() {
	let branch;
	try {
		branch = shGet("git rev-parse --abbrev-ref HEAD");
	} catch {
		fail("Não foi possível detectar a branch atual (você está num repo git?)");
	}
	if (branch === "main" || branch === "master")
		fail(`Você está na "${branch}". Crie uma branch antes: git-flow branch ...`);

	const m = branch.match(/^(feat|fix|chore|release|hotfix)\/(.+)$/);
	if (!m)
		fail(
			`Branch "${branch}" não segue a convenção <tipo>/<kebab>. Use git-flow branch ...`,
		);
	const [, type, slug] = m;

	const title = `${type}: ${slug.replace(/-/g, " ")}`;
	const body = [
		"## Descrição",
		"<!-- O que esta mudança faz e por quê -->",
		"",
		"## Checklist",
		"- [ ] Commits seguem Conventional Commits",
		"- [ ] `pnpm lint` passa localmente",
		"- [ ] `pnpm test` passa localmente",
		"- [ ] `pnpm build` passa localmente",
		"- [ ] Documentação/README atualizado (se aplicável)",
		"",
		"## Como testar",
		"<!-- Passos para validar a mudança -->",
		"",
		"---",
		`_Branch: \`${branch}\`_`,
	].join("\n");

	const ghCheck = spawnSync("gh", ["--version"], { stdio: "ignore" });
	if (ghCheck.status !== 0)
		fail("GitHub CLI (gh) não encontrado. Instale: https://cli.github.com/");

	const auth = spawnSync("gh", ["auth", "status"], { stdio: "ignore" });
	if (auth.status !== 0) fail('Não autenticado. Rode: "gh auth login"');

	try {
		sh(`git push -u origin ${branch}`);
	} catch {
		warn("git push falhou — talvez upstream já exista; seguindo para criar PR");
	}

	const ghArgs = [
		"pr",
		"create",
		"--base",
		"main",
		"--head",
		branch,
		"--title",
		title,
		"--body",
		body,
	];
	const label = LABEL_BY_TYPE[type];
	if (label) ghArgs.push("--label", label);

	const r = spawnSync("gh", ghArgs, { stdio: "inherit" });
	if (r.status !== 0)
		fail("Falha ao criar PR via gh. Verifique permissões e se o remote aponta para o GitHub.");
	ok("PR criado");
}

function help() {
	console.log(`git-flow — automação de Git Flow + Conventional Commits

Uso:
  git-flow commit -m "<tipo>(escopo?): descrição"
  git-flow branch <tipo> <descrição>
  git-flow pr
  git-flow help

Tipos de commit: ${COMMIT_TYPES.join(", ")}
Tipos de branch: ${BRANCH_TYPES.join(", ")}

Exemplos:
  git-flow commit -m "feat(auth): adiciona login com Google"
  git-flow commit -m "fix!: remove campo legado (BREAKING CHANGE)"
  git-flow branch feat user authentication      # -> feat/user-authentication
  git-flow branch hotfix carrinho preco zero    # -> hotfix/carrinho-preco-zero
  git-flow pr                                   # abre PR para main
`);
}

const [, , cmd, ...rest] = process.argv;
switch (cmd) {
	case "commit":
		commitCmd(rest);
		break;
	case "branch":
		branchCmd(rest);
		break;
	case "pr":
		prCmd();
		break;
	case "help":
	case "-h":
	case "--help":
	case undefined:
		help();
		break;
	default:
		fail(`Comando desconhecido: ${cmd}\nRode "git-flow help" para ver as opções.`);
}
