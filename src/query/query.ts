import { type Bridge, BridgeKind } from "@serverkgg/bridge";
import { probeMinecraftPing } from "./minecraftPing";

const PING_HOST = "127.0.0.1";

const PING_TIMEOUT_MS = 5000;

export const query: Bridge.Query = {
	kind: BridgeKind.Query,
	refreshSeconds: 30,
	async sample(context) {
		try {
			const status = await probeMinecraftPing(PING_HOST, context.port("game"), PING_TIMEOUT_MS);

			return status.players;
		} catch {
			return {
				online: null,
				max: null,
			};
		}
	},
};
