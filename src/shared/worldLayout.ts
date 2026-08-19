import { PLUGIN_VARIANTS, type ServerVariant } from "./variant";

export const UNIFIED_STORAGE_VERSION = "26.1";

export const NETHER_SUFFIX = "_nether";

export const END_SUFFIX = "_the_end";

export const VANILLA_NETHER = "DIM-1";

export const VANILLA_END = "DIM1";

export const UNIFIED_NETHER = "dimensions/minecraft/the_nether";

export const UNIFIED_END = "dimensions/minecraft/the_end";

export const DIMENSION_SUFFIXES = [
	NETHER_SUFFIX,
	END_SUFFIX,
];

const LEGACY_VERSION_PREFIX = "1.";

export enum StorageEra {
	Legacy = "legacy",
	Unified = "unified",
}

export enum WorldLayout {
	Bukkit = "bukkit",
	Unified = "unified",
	Vanilla = "vanilla",
}

export const eraOf = (order: Map<string, number>, version: string): StorageEra => {
	const index = order.get(version);
	const unified = order.get(UNIFIED_STORAGE_VERSION);

	if (index === undefined || unified === undefined) {
		return version.startsWith(LEGACY_VERSION_PREFIX) ? StorageEra.Legacy : StorageEra.Unified;
	}

	return index <= unified ? StorageEra.Unified : StorageEra.Legacy;
};

export const layoutOf = (variant: ServerVariant, era: StorageEra): WorldLayout => {
	if (era === StorageEra.Unified) {
		return WorldLayout.Unified;
	}

	return PLUGIN_VARIANTS.includes(variant) ? WorldLayout.Bukkit : WorldLayout.Vanilla;
};
