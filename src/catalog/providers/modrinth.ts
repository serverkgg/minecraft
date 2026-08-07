import { type Bridge, BridgeNetError, BridgeSecretError } from "@serverkgg/bridge";
import { ServerVariant } from "../../shared";
import { CatalogKind, type CatalogTarget } from "../catalogTarget";
import {
	type CatalogFile,
	type CatalogProvider,
	CatalogProviderId,
	type CatalogRelease,
	type CatalogResults,
} from "./provider";
import { asRateLimit } from "./rateLimit";

const SEARCH_CACHE_SECONDS = 60;

const PROJECT_CACHE_SECONDS = 600;

const MODRINTH = "https://api.modrinth.com/v2";

const MODRINTH_CDN = "cdn.modrinth.com";

const SECRET = "MODRINTH_API_KEY";

const SHA512_PATTERN = /^[a-f0-9]{128}$/;

const REJECTED_STATUSES = [
	401,
	403,
];

const PLUGIN_LOADERS = [
	"paper",
	"spigot",
	"bukkit",
	"purpur",
	"folia",
];

interface ModrinthHit {
	project_id: string;
	title: string;
	description: string;
	icon_url: string | null;
	downloads: number;
	author: string | null;
	categories: string[];
	date_modified: string | null;
	slug: string;
}

interface ModrinthSearch {
	hits: ModrinthHit[];
	total_hits: number;
}

interface ModrinthFile {
	url: string;
	filename: string;
	primary: boolean;
	size: number;
	hashes: {
		sha512?: string;
	};
}

interface ModrinthDependency {
	project_id: string | null;
	dependency_type: string;
}

interface ModrinthVersion {
	project_id: string;
	version_number: string;
	version_type: string;
	files: ModrinthFile[];
	dependencies: ModrinthDependency[];
}

interface ModrinthProject {
	id: string;
	slug: string;
	title: string;
	icon_url: string | null;
}

const headersOf = (context: Bridge.Context) => {
	const key = context.secret(SECRET);

	return key
		? {
				authorization: key,
			}
		: undefined;
};

const request = async <Result>(
	context: Bridge.Context,
	url: string,
	cacheSeconds = PROJECT_CACHE_SECONDS,
): Promise<Result> => {
	const headers = headersOf(context);

	try {
		return await context.net.json<Result>(url, {
			headers,
			cacheSeconds,
		});
	} catch (error) {
		if (
			headers
			&& error instanceof BridgeNetError
			&& error.status !== null
			&& REJECTED_STATUSES.includes(error.status)
		) {
			throw new BridgeSecretError(SECRET, `modrinth rejected the configured key — ${error.message}`);
		}

		throw asRateLimit(error, CatalogProviderId.Modrinth);
	}
};

const loadersFor = (target: CatalogTarget) => {
	return target.kind === CatalogKind.Mod
		? [
				target.variant === ServerVariant.NeoForge ? "neoforge" : target.variant,
			]
		: PLUGIN_LOADERS;
};

const fileOf = (version: ModrinthVersion): CatalogFile | null => {
	const file = version.files.find((candidate) => candidate.primary) ?? version.files.at(0);

	if (!file || file.size <= 0) {
		return null;
	}

	if (!URL.canParse(file.url) || new URL(file.url).hostname !== MODRINTH_CDN) {
		return null;
	}

	const sha512 = file.hashes.sha512 ?? "";

	return {
		filename: file.filename,
		url: file.url,
		sizeBytes: file.size,
		digest: SHA512_PATTERN.test(sha512) ? `sha512:${sha512}` : null,
	};
};

const versionFor = async (context: Bridge.Context, target: CatalogTarget, project: string) => {
	const url = new URL(`${MODRINTH}/project/${encodeURIComponent(project)}/version`);

	url.searchParams.set("loaders", JSON.stringify(loadersFor(target)));
	url.searchParams.set(
		"game_versions",
		JSON.stringify([
			target.gameVersion,
		]),
	);

	const versions = await request<ModrinthVersion[]>(context, url.toString());

	return versions.find((version) => version.version_type === "release") ?? versions.at(0) ?? null;
};

export const modrinthProvider: CatalogProvider = {
	id: CatalogProviderId.Modrinth,

	label: {
		ar: "مودرينث",
		en: "Modrinth",
	},

	note: {
		ar: "مودرينث ما يرد علينا الحين. جرّب مرة ثانية بعد شوي.",
		en: "Modrinth is not answering right now. Try again in a bit.",
	},

	sorts: [
		{
			value: "relevance",
			label: {
				ar: "الأنسب",
				en: "Best match",
			},
		},
		{
			value: "downloads",
			label: {
				ar: "الأكثر تحميلًا",
				en: "Most downloaded",
			},
		},
		{
			value: "follows",
			label: {
				ar: "الأكثر متابعة",
				en: "Most followed",
			},
		},
		{
			value: "updated",
			label: {
				ar: "آخر تحديث",
				en: "Recently updated",
			},
		},
	],

	categories(target) {
		const shared: Bridge.CatalogFacet[] = [
			{
				value: "optimization",
				label: {
					ar: "تحسين الأداء",
					en: "Performance",
				},
			},
			{
				value: "utility",
				label: {
					ar: "أدوات",
					en: "Utility",
				},
			},
			{
				value: "management",
				label: {
					ar: "إدارة",
					en: "Management",
				},
			},
			{
				value: "economy",
				label: {
					ar: "اقتصاد",
					en: "Economy",
				},
			},
			{
				value: "social",
				label: {
					ar: "اجتماعي",
					en: "Social",
				},
			},
		];

		if (target.kind === CatalogKind.Plugin) {
			return shared;
		}

		return [
			...shared,
			{
				value: "adventure",
				label: {
					ar: "مغامرات",
					en: "Adventure",
				},
			},
			{
				value: "technology",
				label: {
					ar: "تقنية",
					en: "Technology",
				},
			},
			{
				value: "magic",
				label: {
					ar: "سحر",
					en: "Magic",
				},
			},
			{
				value: "library",
				label: {
					ar: "مكتبات",
					en: "Libraries",
				},
			},
		];
	},

	supports() {
		return true;
	},

	ready() {
		return true;
	},

	async search(context, target, search) {
		const facets: string[][] = [
			[
				`project_type:${target.kind}`,
			],
			loadersFor(target).map((loader) => `categories:${loader}`),
			[
				`versions:${target.gameVersion}`,
			],
		];

		if (search.category) {
			facets.push([
				`categories:${search.category}`,
			]);
		}

		const url = new URL(`${MODRINTH}/search`);

		url.searchParams.set("query", search.query);
		url.searchParams.set("offset", String(search.page * search.pageSize));
		url.searchParams.set("limit", String(search.pageSize));
		url.searchParams.set("index", search.sort ?? (search.query.length > 0 ? "relevance" : "downloads"));
		url.searchParams.set("facets", JSON.stringify(facets));

		const result = await request<ModrinthSearch>(context, url.toString(), SEARCH_CACHE_SECONDS);

		return {
			hits: result.hits.map((hit) => {
				return {
					id: hit.project_id,
					title: hit.title,
					description: hit.description,
					icon: hit.icon_url,
					downloads: hit.downloads,
					author: hit.author,
					categories: hit.categories,
					updatedAt: hit.date_modified,
					pageUrl: `https://modrinth.com/${target.kind}/${hit.slug}`,
				};
			}),
			total: result.total_hits,
		} satisfies CatalogResults;
	},

	async resolve(context, target, project): Promise<CatalogRelease | null> {
		const details = await request<ModrinthProject>(context, `${MODRINTH}/project/${encodeURIComponent(project)}`);
		const version = await versionFor(context, target, project);

		if (!version) {
			return null;
		}

		const file = fileOf(version);

		if (!file) {
			return null;
		}

		return {
			title: details.title,
			version: version.version_number,
			icon: details.icon_url,
			pageUrl: `https://modrinth.com/${target.kind}/${details.slug}`,
			file,
			dependencies: version.dependencies
				.filter((dependency) => dependency.dependency_type === "required" && dependency.project_id !== null)
				.map((dependency) => dependency.project_id as string),
		};
	},
};
