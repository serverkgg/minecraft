import { type Bridge, BridgeFailureCode, BridgeFailureError, BridgeKind } from "@serverkgg/bridge";
import {
	CatalogProviderId,
	decodeProviderRef,
	encodeProviderRef,
	MODPACK_CATEGORIES,
	MODPACK_SORTS,
	type ModpackRelease,
	modpackProject,
	modpackReleases,
	modrinthProvider,
	searchModpacks,
} from "../providers";
import { addonDirectory, gameVersionOf, variantOf } from "../shared";
import { MODPACK_VARIABLE } from "./applyModpack";
import { usesQuilt, variantForLoaders } from "./modpackIndex";
import { decodeModpackRef, encodeModpackRef } from "./modpackRef";
import { MODPACK_SIDECAR, modpackIdentity, readModpackSidecar } from "./modpackSidecar";

const PAGE_SIZE = 20;

const sources = (): Bridge.CatalogProvider[] => {
	return [
		{
			id: modrinthProvider.id,
			label: modrinthProvider.label,
			ready: true,
		},
	];
};

const serverRelease = (releases: ModpackRelease[]) => {
	const supported = releases.filter((release) => variantForLoaders(release.loaders) !== null);

	return supported.find((release) => release.stable) ?? supported.at(0) ?? null;
};

const latestRelease = async (context: Bridge.Context, project: string) => {
	return serverRelease(await modpackReleases(context, project));
};

const outdated = async (context: Bridge.Context, project: string, versionId: string) => {
	try {
		const latest = await latestRelease(context, project);

		return latest !== null && latest.versionId !== versionId;
	} catch {
		return false;
	}
};

const describeProject = async (context: Bridge.Context, project: string) => {
	try {
		return await modpackProject(context, project);
	} catch {
		return null;
	}
};

const declaredEntries = async (context: Bridge.Context): Promise<Bridge.CatalogEntry[]> => {
	const declared = context.variable(MODPACK_VARIABLE) ?? "";

	if (declared.length === 0) {
		return [];
	}

	const ref = decodeModpackRef(declared);
	const project = ref ? await describeProject(context, ref.project) : null;

	return [
		{
			id: ref ? encodeProviderRef(ref.provider, ref.project) : declared,
			provider: ref?.provider ?? null,
			path: MODPACK_SIDECAR,
			title: project?.title ?? ref?.project ?? declared,
			version: null,
			sizeBytes: 0,
			enabled: true,
			gameVersion: null,
			stale: true,
			pageUrl: project?.pageUrl ?? null,
			icon: project?.icon ?? null,
		},
	];
};

const installModpack = async (context: Bridge.Context, id: string): Promise<Bridge.CatalogEntry> => {
	const decoded = decodeProviderRef(id);

	if (!decoded || decoded.provider !== CatalogProviderId.Modrinth) {
		throw new Error(`"${id}" is not a modrinth modpack reference`);
	}

	const releases = await modpackReleases(context, decoded.project);
	const release = serverRelease(releases);

	if (!release) {
		throw new BridgeFailureError(
			BridgeFailureCode.NoCatalogVersionAvailable,
			releases.some((candidate) => usesQuilt(candidate.loaders))
				? "this modpack runs on quilt, and serverk has no quilt server type"
				: "this modpack has no build we can run on a server",
		);
	}

	const variant = variantForLoaders(release.loaders);
	const mcVersion = release.gameVersions.at(-1) ?? "";

	if (!variant || mcVersion.length === 0) {
		throw new BridgeFailureError(
			BridgeFailureCode.NoCatalogVersionAvailable,
			"this modpack does not say which minecraft version it runs on",
		);
	}

	const project = await modpackProject(context, decoded.project);

	return {
		id: encodeProviderRef(CatalogProviderId.Modrinth, project.id),
		provider: CatalogProviderId.Modrinth,
		path: MODPACK_SIDECAR,
		title: project.title,
		version: release.version,
		sizeBytes: release.file.sizeBytes ?? 0,
		enabled: true,
		gameVersion: modpackIdentity({
			mcVersion,
			variant,
		}),
		stale: false,
		pageUrl: project.pageUrl,
		icon: project.icon,
		variables: {
			[MODPACK_VARIABLE]: encodeModpackRef(CatalogProviderId.Modrinth, project.id, release.versionId),
			SERVER_TYPE: variant,
			MC_VERSION: mcVersion,
			LOADER_VERSION: "",
		},
	};
};

export const modpacks: Bridge.Catalog = {
	kind: BridgeKind.Catalog,
	pageSize: PAGE_SIZE,

	async search(context, query) {
		const results = await searchModpacks(context, {
			query: query.query,
			page: query.page,
			pageSize: PAGE_SIZE,
			category: query.category,
			sort: query.sort,
		});

		return {
			hits: results.hits.map((hit) => {
				return {
					...hit,
					id: encodeProviderRef(CatalogProviderId.Modrinth, hit.id),
					provider: CatalogProviderId.Modrinth,
				};
			}),
			total: results.total,
			providers: sources(),
			categories: MODPACK_CATEGORIES,
			sorts: MODPACK_SORTS,
		};
	},

	async installed(context) {
		const sidecar = await readModpackSidecar(context);

		if (!sidecar) {
			return await declaredEntries(context);
		}

		const mismatched = sidecar.variant !== variantOf(context) || sidecar.mcVersion !== (await gameVersionOf(context));

		return [
			{
				id: encodeProviderRef(sidecar.provider, sidecar.project),
				provider: sidecar.provider,
				path: MODPACK_SIDECAR,
				title: sidecar.title,
				version: sidecar.version,
				sizeBytes: await context.files.size(addonDirectory(context)),
				enabled: true,
				gameVersion: modpackIdentity(sidecar),
				stale: mismatched || (await outdated(context, sidecar.project, sidecar.versionId)),
				pageUrl: sidecar.pageUrl,
				icon: sidecar.icon,
			},
		];
	},

	async install(context, id) {
		return await installModpack(context, id);
	},

	async remove() {
		throw new Error("clear the modpack from the modpacks tab, removing it rebuilds the server without it");
	},
};
