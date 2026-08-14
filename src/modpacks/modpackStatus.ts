import { type Bridge, BridgeKind } from "@serverkgg/bridge";
import { modpackBuildIdentity, readModpackSidecar } from "./modpackSidecar";

export const modpackStatus: Bridge.Collection = {
	kind: BridgeKind.Collection,
	async list(context) {
		const sidecar = await readModpackSidecar(context);

		if (!sidecar) {
			return [];
		}

		return [
			{
				id: sidecar.project,
				title: sidecar.title,
				identity: modpackBuildIdentity(sidecar),
			},
		];
	},
};
