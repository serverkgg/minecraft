import type { Bridge } from "@serverkgg/bridge";
import { installedGameVersion } from "../install";
import { AddonKind, type AddonTarget } from "../providers";
import { addonDirectory, latestRelease, MOD_VARIANTS, requestedGameVersion, variantOf } from "../shared";

export const addonTarget = async (context: Bridge.Context): Promise<AddonTarget> => {
	const variant = variantOf(context);
	const gameVersion =
		(await installedGameVersion(context)) ?? requestedGameVersion(context) ?? (await latestRelease(context));

	return {
		kind: MOD_VARIANTS.includes(variant) ? AddonKind.Mod : AddonKind.Plugin,
		variant,
		gameVersion,
		directory: addonDirectory(context),
	};
};
