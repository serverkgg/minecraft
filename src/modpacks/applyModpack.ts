import type { Bridge } from "@serverkgg/bridge";
import {
	CatalogProviderId,
	type ModpackProject,
	type ModpackRelease,
	modpackProject,
	modpackRelease,
} from "../providers";
import { type ServerVariant, STAGING_ROOT } from "../shared";
import { MODPACK_INDEX, type ModpackIndex, parseModpackIndex, variantForLoaders } from "./modpackIndex";
import { decodeModpackRef, type ModpackRef } from "./modpackRef";
import { clearModpackSidecar, type ModpackSidecar, readModpackSidecar, writeModpackSidecar } from "./modpackSidecar";

export const MODPACK_VARIABLE = "MODPACK";

const PACK_STAGING = `${STAGING_ROOT}/pack`;

const ARCHIVE = `${PACK_STAGING}/modpack.mrpack`;

const INDEX_PATH = `${PACK_STAGING}/${MODPACK_INDEX}`;

const OVERRIDE_FOLDERS = [
	"overrides",
	"server-overrides",
];

const PACK_DIRECTORIES = [
	"mods",
	"config",
	"defaultconfigs",
	"kubejs",
	"scripts",
];

const PROGRESS_STEP = 25;

const NO_MATCHING_FILES = "contained no matching files";

export enum ModpackPlanKind {
	Apply = "apply",
	Current = "current",
	Detach = "detach",
	None = "none",
}

export interface ModpackPlan {
	kind: ModpackPlanKind;
	ref: ModpackRef | null;
	sidecar: ModpackSidecar | null;
	pinnedBuild: string | null;
}

export interface StagedModpack {
	ref: ModpackRef;
	project: ModpackProject;
	release: ModpackRelease;
	index: ModpackIndex;
}

const isEmptySelection = (error: unknown) => {
	return error instanceof Error && error.message.endsWith(NO_MATCHING_FILES);
};

const clearStaging = async (context: Bridge.Context) => {
	await context.files.remove(PACK_STAGING);
};

const clearPackDirectories = async (context: Bridge.Context) => {
	for (const directory of PACK_DIRECTORIES) {
		await context.files.remove(directory);
	}
};

const applyOverrides = async (context: Bridge.Context, folder: string) => {
	try {
		const written = await context.files.extract(ARCHIVE, "", {
			tree: true,
			select: `${folder}/`,
		});

		context.log("copied the modpack's own files", {
			folder,
			files: written.length,
		});
	} catch (error) {
		if (!isEmptySelection(error)) {
			throw error;
		}
	}
};

const downloadFiles = async (context: Bridge.Context, index: ModpackIndex) => {
	let done = 0;
	let milestone = 0;

	for (const file of index.files) {
		await context.files.download(file.path, file.url, {
			cache: true,
			...(file.digest === null
				? {}
				: {
						digest: file.digest,
					}),
			...(file.sizeBytes === null
				? {}
				: {
						sizeBytes: file.sizeBytes,
					}),
		});

		done += 1;

		if (done - milestone >= PROGRESS_STEP && done < index.files.length) {
			milestone = done;

			context.log("downloading the modpack", {
				done,
				total: index.files.length,
			});
		}
	}
};

export const modpackPlan = async (
	context: Bridge.Context,
	variant: ServerVariant,
	version: string,
): Promise<ModpackPlan> => {
	const declared = context.variable(MODPACK_VARIABLE) ?? "";
	const sidecar = await readModpackSidecar(context);

	const detach = (): ModpackPlan => {
		return {
			kind: ModpackPlanKind.Detach,
			ref: null,
			sidecar,
			pinnedBuild: sidecar?.loaderVersion ?? null,
		};
	};

	if (declared.length === 0) {
		return sidecar
			? detach()
			: {
					kind: ModpackPlanKind.None,
					ref: null,
					sidecar: null,
					pinnedBuild: null,
				};
	}

	const ref = decodeModpackRef(declared);

	if (!ref) {
		context.log.warn("the modpack setting is not readable, leaving the server as it is", {
			value: declared,
		});

		return {
			kind: ModpackPlanKind.None,
			ref: null,
			sidecar,
			pinnedBuild: sidecar?.loaderVersion ?? null,
		};
	}

	const installed =
		sidecar !== null
		&& sidecar.provider === ref.provider
		&& sidecar.project === ref.project
		&& sidecar.versionId === ref.versionId
			? sidecar
			: null;

	if (installed && (installed.variant !== variant || installed.mcVersion !== version)) {
		context.log.warn("the server type or version no longer matches the modpack, removing the modpack", {
			modpack: `${installed.variant} ${installed.mcVersion}`,
			server: `${variant} ${version}`,
		});

		return detach();
	}

	return {
		kind: installed ? ModpackPlanKind.Current : ModpackPlanKind.Apply,
		ref,
		sidecar,
		pinnedBuild: installed?.loaderVersion ?? null,
	};
};

export const stageModpack = async (
	context: Bridge.Context,
	ref: ModpackRef,
	variant: ServerVariant,
	version: string,
): Promise<StagedModpack | null> => {
	if (ref.provider !== CatalogProviderId.Modrinth) {
		context.log.warn("this modpack comes from a source we cannot install, skipping it", {
			provider: ref.provider,
		});

		return null;
	}

	const release = await modpackRelease(context, ref.versionId);

	if (!release) {
		context.log.warn("could not find this modpack version, skipping it", {
			project: ref.project,
			version: ref.versionId,
		});

		return null;
	}

	if (variantForLoaders(release.loaders) !== variant || !release.gameVersions.includes(version)) {
		context.log.warn("the modpack does not match this server type or version, leaving it out", {
			project: ref.project,
			wants: `${release.loaders.join("/")} ${release.gameVersions.join("/")}`,
			server: `${variant} ${version}`,
		});

		return null;
	}

	const project = await modpackProject(context, ref.project);

	context.log("downloading the modpack", {
		title: project.title,
		version: release.version,
		sizeBytes: release.file.sizeBytes,
	});

	await clearStaging(context);
	await context.files.download(ARCHIVE, release.file.url, {
		cache: true,
		...(release.file.digest === null
			? {}
			: {
					digest: release.file.digest,
				}),
		...(release.file.sizeBytes === null
			? {}
			: {
					sizeBytes: release.file.sizeBytes,
				}),
	});

	await context.files.extract(ARCHIVE, PACK_STAGING, {
		tree: true,
		extensions: [
			"json",
		],
	});

	const index = parseModpackIndex(await context.files.read(INDEX_PATH));

	if (index.variant !== variant || index.mcVersion !== version) {
		context.log.warn("the modpack does not match this server type or version, leaving it out", {
			wants: `${index.variant} ${index.mcVersion}`,
			server: `${variant} ${version}`,
		});

		await clearStaging(context);

		return null;
	}

	return {
		ref,
		project,
		release,
		index,
	};
};

export const applyModpack = async (context: Bridge.Context, staged: StagedModpack) => {
	const { index, project, release, ref } = staged;

	context.log("clearing the old mods and configs before the modpack goes in", {
		directories: PACK_DIRECTORIES.join(", "),
	});

	await clearPackDirectories(context);

	context.log("installing the modpack", {
		title: project.title,
		version: release.version,
		files: index.files.length,
	});

	await downloadFiles(context, index);

	for (const folder of OVERRIDE_FOLDERS) {
		await applyOverrides(context, folder);
	}

	await writeModpackSidecar(context, {
		provider: ref.provider,
		project: ref.project,
		versionId: ref.versionId,
		version: release.version,
		title: project.title,
		icon: project.icon,
		pageUrl: project.pageUrl,
		mcVersion: index.mcVersion,
		variant: index.variant,
		loaderVersion: index.loaderVersion,
		appliedAt: new Date().toISOString(),
		fileCount: index.files.length,
	});

	await clearStaging(context);

	context.log("the modpack is ready", {
		title: project.title,
		version: release.version,
	});
};

export const detachModpack = async (context: Bridge.Context) => {
	context.log("removing the modpack and everything it installed", {
		directories: PACK_DIRECTORIES.join(", "),
	});

	await clearPackDirectories(context);
	await clearModpackSidecar(context);
	await clearStaging(context);
};
