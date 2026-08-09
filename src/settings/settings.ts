import { type Bridge, BridgeKind } from "@serverkgg/bridge";

const PROPERTIES_FILE = "server.properties";

export const settings: Bridge.Settings = {
	kind: BridgeKind.Settings,
	async read(context) {
		return await context.codec.properties.read(PROPERTIES_FILE);
	},
	async write(context, values) {
		await context.codec.properties.merge(PROPERTIES_FILE, values);
	},
};
