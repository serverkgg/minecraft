import { type Bridge, BridgeKind } from "@serverkgg/bridge";
import { applyModpack, detachModpack, ModpackPlanKind, modpackPlan, stageModpack } from "../modpacks";
import { SEEDED_PROPERTIES } from "../settings";
import {
	addonDirectory,
	declaredBuild,
	javaMajorFor,
	latestRelease,
	releaseOrder,
	requestedBuild,
	requestedGameVersion,
	ServerVariant,
	STAGING_ROOT,
	variantOf,
} from "../shared";
import { discoverWorlds, resetActiveWorld, worldPaths } from "../worlds";
import { installFabric } from "./installFabric";
import { installForge } from "./installForge";
import { installNeoForge } from "./installNeoForge";
import { installPaper } from "./installPaper";
import { installPurpur } from "./installPurpur";
import { type InstallIdentity, type InstallStamp, matchesStamp, readStamp, writeStamp } from "./installStamp";
import { installVanilla } from "./installVanilla";
import type { LaunchPlan } from "./launchPlan";

const LOADER_ARTIFACTS = [
	"server.jar",
	"libraries",
	"versions",
	".fabric",
	"run.sh",
	"run.bat",
	"user_jvm_args.txt",
];

const WIPE_DIRECTORIES = [
	"world",
	"world_nether",
	"world_the_end",
	"mods",
	"plugins",
	"config",
	"defaultconfigs",
	"libraries",
	"versions",
	"logs",
	"crash-reports",
	"cache",
	".cache",
	".fabric",
	STAGING_ROOT,
];

type Installer = (
	context: Bridge.Context,
	gameVersion: string,
	build: string | null,
	javaMajor: number,
) => Promise<LaunchPlan>;

const INSTALL_BY_VARIANT: Record<ServerVariant, Installer> = {
	[ServerVariant.Fabric]: (context, gameVersion, build) => installFabric(context, gameVersion, build),
	[ServerVariant.Forge]: installForge,
	[ServerVariant.NeoForge]: installNeoForge,
	[ServerVariant.Paper]: (context, gameVersion, build) => installPaper(context, gameVersion, build),
	[ServerVariant.Purpur]: (context, gameVersion, build) => installPurpur(context, gameVersion, build),
	[ServerVariant.Vanilla]: (context, gameVersion) => installVanilla(context, gameVersion),
};

const resolveBuild = async (
	context: Bridge.Context,
	variant: ServerVariant,
	version: string,
	pinned: string | null,
) => {
	if (variant === ServerVariant.Vanilla) {
		return null;
	}

	return declaredBuild(context) ?? pinned ?? (await requestedBuild(context, version));
};

const resolveVersion = async (context: Bridge.Context, stamp: InstallStamp | null, variant: ServerVariant) => {
	const requested = requestedGameVersion(context);

	if (requested) {
		return requested;
	}

	if (stamp && stamp.variant === variant) {
		return stamp.version;
	}

	return await latestRelease(context);
};

const wipeReason = async (context: Bridge.Context, stamp: InstallStamp, next: InstallIdentity) => {
	if (stamp.variant !== next.variant) {
		return "the new server type cannot read a world made by the old one";
	}

	if (stamp.version === next.version) {
		return null;
	}

	const order = await releaseOrder(context);
	const from = order.get(stamp.version);
	const to = order.get(next.version);

	if (from === undefined || to === undefined) {
		return null;
	}

	return to > from ? "minecraft cannot open a world on an older version" : null;
};

const wipeData = async (context: Bridge.Context) => {
	for (const directory of WIPE_DIRECTORIES) {
		await context.files.remove(directory);
	}

	for (const world of await discoverWorlds(context)) {
		for (const path of worldPaths(world)) {
			await context.files.remove(path);
		}
	}

	for (const entry of await context.files.list("*")) {
		await context.files.remove(entry.path);
	}

	await resetActiveWorld(context);
};

const finalize = async (context: Bridge.Context) => {
	await context.files.write("eula.txt", "eula=true\n");

	if (!(await context.files.exists("server.properties"))) {
		await context.codec.properties.merge("server.properties", SEEDED_PROPERTIES);
	}

	await context.files.ensure(addonDirectory(context), "logs");
};

export const install: Bridge.Install = {
	kind: BridgeKind.Install,
	async run(context) {
		const variant = variantOf(context);
		const stamp = await readStamp(context);
		const version = await resolveVersion(context, stamp, variant);
		const plan = await modpackPlan(context, variant, version);
		const next: InstallIdentity = {
			variant,
			version,
			build: await resolveBuild(context, variant, version, plan.pinnedBuild),
		};

		if (plan.kind === ModpackPlanKind.Detach) {
			context.log("removing the modpack, and the world it built goes with it", {
				modpack: plan.sidecar?.title ?? "",
			});

			await wipeData(context);
		} else if (plan.kind !== ModpackPlanKind.Apply && matchesStamp(stamp, next) && stamp) {
			if (await context.files.exists(stamp.launch.target)) {
				context.log("install is current", {
					variant,
					version,
					build: next.build,
				});

				await finalize(context);

				return;
			}

			context.log("the recorded install is missing its files, installing it again", {
				variant,
				version,
				target: stamp.launch.target,
			});
		} else if (stamp) {
			context.log("reinstalling", {
				from: `${stamp.variant} ${stamp.version}`,
				to: `${variant} ${version}`,
			});

			const reason = await wipeReason(context, stamp, next);

			if (reason) {
				await wipeData(context);

				context.log("starting a fresh server, the backup taken before this change has your old files", {
					reason,
					from: `${stamp.variant} ${stamp.version}`,
					to: `${variant} ${version}`,
				});
			}
		}

		for (const artifact of LOADER_ARTIFACTS) {
			await context.files.remove(artifact);
		}

		const staged =
			plan.kind === ModpackPlanKind.Apply && plan.ref ? await stageModpack(context, plan.ref, variant, version) : null;

		const mismatched = plan.kind === ModpackPlanKind.Apply && staged === null && plan.sidecar !== null;

		if (mismatched) {
			context.log("the modpack that was on this server no longer fits it, so it goes, and its world with it", {
				modpack: plan.sidecar?.title ?? "",
			});

			await wipeData(context);
		}

		const detaching = plan.kind === ModpackPlanKind.Detach || mismatched;

		const build = staged ? staged.index.loaderVersion : next.build;
		const javaMajor = await javaMajorFor(context, version);

		context.log("installing minecraft", {
			variant,
			version,
			build,
			java: javaMajor,
		});

		const launch = await INSTALL_BY_VARIANT[variant](context, version, build, javaMajor);

		await writeStamp(context, {
			variant,
			version,
			build,
			java: javaMajor,
			launch,
		});

		if (staged) {
			await applyModpack(context, staged);
		} else if (detaching) {
			await detachModpack(context);
		}

		await finalize(context);

		context.log("minecraft is installed", {
			variant,
			version,
			build,
			launch: launch.kind,
		});
	},
	async describe(context) {
		const stamp = await readStamp(context);

		return {
			version: stamp?.version ?? null,
			variant: stamp?.variant ?? null,
			build: stamp?.build ?? null,
		};
	},
};
