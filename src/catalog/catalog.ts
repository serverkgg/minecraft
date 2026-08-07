import { type Bridge, BridgeFailureCode, BridgeFailureError, BridgeKind } from "@serverkgg/bridge";
import { decodeCatalogId, encodeCatalogId } from "./catalogId";
import {
	DISABLED_SUFFIX,
	enabledName,
	readSidecar,
	type Sidecar,
	type SidecarEntry,
	writeSidecar,
} from "./catalogSidecar";
import { type CatalogTarget, catalogTarget } from "./catalogTarget";
import type { CatalogProvider, CatalogRelease } from "./providers";
import { describeProviders, providerById, resolveProvider } from "./providers";

const PAGE_SIZE = 20;

const MAX_DEPENDENCIES = 8;

interface PendingFile {
	release: CatalogRelease;
	project: string;
}

let sidecarLock: Promise<unknown> = Promise.resolve();

const exclusive = <Result>(run: () => Promise<Result>): Promise<Result> => {
	const next = sidecarLock.then(run, run);

	sidecarLock = next.catch(() => undefined);

	return next;
};

const entryFor = (
	filename: string,
	tracked: SidecarEntry | undefined,
	target: CatalogTarget,
	sizeBytes: number,
): Bridge.CatalogEntry => {
	const enabled = !filename.endsWith(DISABLED_SUFFIX);
	const name = enabledName(filename);

	return {
		id: tracked ? encodeCatalogId(tracked.provider, tracked.project) : name,
		provider: tracked?.provider ?? null,
		path: `${target.directory}/${filename}`,
		title: tracked?.title ?? name,
		version: tracked?.version ?? null,
		sizeBytes,
		enabled,
		gameVersion: tracked?.gameVersion ?? null,
		stale: tracked ? tracked.gameVersion !== target.gameVersion : false,
		pageUrl: tracked?.pageUrl ?? null,
		icon: tracked?.icon ?? null,
	};
};

const listFiles = async (context: Bridge.Context, target: CatalogTarget) => {
	const enabled = await context.files.list(`${target.directory}/*.jar`);
	const disabled = await context.files.list(`${target.directory}/*.jar${DISABLED_SUFFIX}`);

	return [
		...enabled,
		...disabled,
	];
};

const findTracked = (sidecar: Sidecar, id: string) => {
	const decoded = decodeCatalogId(id);

	return Object.entries(sidecar)
		.filter(([filename, entry]) => {
			return decoded ? entry.provider === decoded.provider && entry.project === decoded.project : filename === id;
		})
		.map(([filename]) => filename);
};

const forget = async (context: Bridge.Context, target: CatalogTarget, sidecar: Sidecar, filename: string) => {
	for (const candidate of [
		filename,
		`${filename}${DISABLED_SUFFIX}`,
	]) {
		if (await context.files.exists(`${target.directory}/${candidate}`)) {
			await context.files.remove(`${target.directory}/${candidate}`);
		}
	}

	delete sidecar[filename];
};

const gather = async (
	context: Bridge.Context,
	provider: CatalogProvider,
	target: CatalogTarget,
	project: string,
): Promise<PendingFile[]> => {
	const release = await provider.resolve(context, target, project);

	if (!release) {
		return [];
	}

	const pending: PendingFile[] = [
		{
			release,
			project,
		},
	];

	for (const dependency of release.dependencies) {
		if (pending.length >= MAX_DEPENDENCIES) {
			break;
		}

		if (pending.some((entry) => entry.project === dependency)) {
			continue;
		}

		try {
			const resolved = await provider.resolve(context, target, dependency);

			if (resolved) {
				pending.push({
					release: resolved,
					project: dependency,
				});
			}
		} catch {
			context.log("skipped a dependency we could not resolve", {
				provider: provider.id,
				dependency,
			});
		}
	}

	return pending;
};

const installProject = async (context: Bridge.Context, id: string): Promise<Bridge.CatalogEntry> => {
	const decoded = decodeCatalogId(id);

	if (!decoded) {
		throw new Error(`"${id}" is not a catalog id`);
	}

	const target = await catalogTarget(context);
	const provider = providerById(decoded.provider);

	if (!provider?.supports(target)) {
		throw new Error(`${decoded.provider} has nothing for a ${target.variant} server`);
	}

	const pending = await gather(context, provider, target, decoded.project);
	const primary = pending.at(0);

	if (!primary) {
		throw new BridgeFailureError(
			BridgeFailureCode.NoCatalogVersionAvailable,
			`this ${target.kind} has no build for ${target.variant} ${target.gameVersion}`,
		);
	}

	await context.files.ensure(target.directory);

	const sidecar = await readSidecar(context, target.directory);

	for (const entry of pending) {
		for (const filename of findTracked(sidecar, encodeCatalogId(provider.id, entry.project))) {
			await forget(context, target, sidecar, filename);
		}
	}

	for (const entry of pending) {
		const { file } = entry.release;

		await context.files.download(`${target.directory}/${file.filename}`, file.url, {
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

		sidecar[file.filename] = {
			provider: provider.id,
			project: entry.project,
			version: entry.release.version,
			title: entry.release.title,
			gameVersion: target.gameVersion,
			icon: entry.release.icon,
			pageUrl: entry.release.pageUrl,
		};
	}

	await writeSidecar(context, target.directory, sidecar);

	context.log("installed from the catalog", {
		provider: provider.id,
		title: primary.release.title,
		version: primary.release.version,
		files: pending.length,
	});

	return entryFor(
		primary.release.file.filename,
		sidecar[primary.release.file.filename],
		target,
		primary.release.file.sizeBytes ?? 0,
	);
};

const removeEntry = async (context: Bridge.Context, id: string) => {
	const target = await catalogTarget(context);
	const sidecar = await readSidecar(context, target.directory);
	const tracked = findTracked(sidecar, id);

	if (tracked.length > 0) {
		for (const filename of tracked) {
			await forget(context, target, sidecar, filename);
		}

		await writeSidecar(context, target.directory, sidecar);

		return;
	}

	const name = enabledName(id);

	if (!name.endsWith(".jar")) {
		throw new Error(`"${id}" is not installed`);
	}

	await forget(context, target, sidecar, name);
	await writeSidecar(context, target.directory, sidecar);
};

const toggleEntry = async (context: Bridge.Context, id: string, enabled: boolean) => {
	const target = await catalogTarget(context);
	const sidecar = await readSidecar(context, target.directory);
	const tracked = findTracked(sidecar, id);
	const names =
		tracked.length > 0
			? tracked
			: [
					enabledName(id),
				];

	for (const name of names) {
		const active = `${target.directory}/${name}`;
		const parked = `${active}${DISABLED_SUFFIX}`;

		if (enabled && (await context.files.exists(parked))) {
			await context.files.move(parked, active);
		}

		if (!enabled && (await context.files.exists(active))) {
			await context.files.move(active, parked);
		}
	}
};

export const catalog: Bridge.Catalog = {
	kind: BridgeKind.Catalog,
	pageSize: PAGE_SIZE,

	async search(context, query) {
		const target = await catalogTarget(context);
		const provider = resolveProvider(context, target, query.provider);
		const providers = describeProviders(context, target);

		if (!provider) {
			return {
				hits: [],
				total: 0,
				providers,
				categories: [],
				sorts: [],
			};
		}

		const facets = {
			providers,
			categories: provider.categories(target),
			sorts: provider.sorts,
		};

		if (!provider.ready(context)) {
			return {
				hits: [],
				total: 0,
				...facets,
			};
		}

		const results = await provider.search(context, target, {
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
					id: encodeCatalogId(provider.id, hit.id),
					provider: provider.id,
				};
			}),
			total: results.total,
			...facets,
		};
	},

	async installed(context) {
		const target = await catalogTarget(context);
		const sidecar = await readSidecar(context, target.directory);
		const entries = await listFiles(context, target);

		return entries.map((entry) => {
			return entryFor(entry.name, sidecar[enabledName(entry.name)], target, entry.sizeBytes);
		});
	},

	async install(context, id) {
		return await exclusive(() => installProject(context, id));
	},

	async remove(context, id) {
		await exclusive(() => removeEntry(context, id));
	},

	async toggle(context, id, enabled) {
		await exclusive(() => toggleEntry(context, id, enabled));
	},
};
