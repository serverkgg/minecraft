import type { Bridge } from "@serverkgg/bridge";

export enum ServerVariant {
	Fabric = "fabric",
	Forge = "forge",
	NeoForge = "neoforge",
	Paper = "paper",
	Purpur = "purpur",
	Vanilla = "vanilla",
}

export const PLUGIN_VARIANTS = [
	ServerVariant.Paper,
	ServerVariant.Purpur,
];

export const MOD_VARIANTS = [
	ServerVariant.Fabric,
	ServerVariant.Forge,
	ServerVariant.NeoForge,
];

export const LOADER_VARIANTS = [
	...PLUGIN_VARIANTS,
	...MOD_VARIANTS,
];

const VARIANTS = new Set<string>(Object.values(ServerVariant));

export const variantOf = (context: Bridge.Context): ServerVariant => {
	const declared = context.variable("SERVER_TYPE") ?? "";

	return VARIANTS.has(declared) ? (declared as ServerVariant) : ServerVariant.Vanilla;
};

export const catalogDirectory = (context: Bridge.Context) => {
	return MOD_VARIANTS.includes(variantOf(context)) ? "mods" : "plugins";
};
