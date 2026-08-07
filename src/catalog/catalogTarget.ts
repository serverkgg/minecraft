import type { Bridge } from "@serverkgg/bridge";
import { installedGameVersion } from "../install";
import {
	catalogDirectory,
	latestRelease,
	MOD_VARIANTS,
	requestedGameVersion,
	type ServerVariant,
	variantOf,
} from "../shared";

export enum CatalogKind {
	Mod = "mod",
	Plugin = "plugin",
}

export interface CatalogTarget {
	kind: CatalogKind;
	variant: ServerVariant;
	gameVersion: string;
	directory: string;
}

export const catalogTarget = async (context: Bridge.Context): Promise<CatalogTarget> => {
	const variant = variantOf(context);
	const gameVersion =
		(await installedGameVersion(context)) ?? requestedGameVersion(context) ?? (await latestRelease(context));

	return {
		kind: MOD_VARIANTS.includes(variant) ? CatalogKind.Mod : CatalogKind.Plugin,
		variant,
		gameVersion,
		directory: catalogDirectory(context),
	};
};
