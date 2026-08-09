import { type Bridge, BridgeKind } from "@serverkgg/bridge";
import { buildsFor, gameVersionOf } from "../shared";

export const loaderBuild: Bridge.Options = {
	kind: BridgeKind.Options,
	dependsOn: [
		"SERVER_TYPE",
		"MC_VERSION",
	],
	ttlSeconds: 1800,
	async list(context) {
		return await buildsFor(context, await gameVersionOf(context));
	},
};
