import { type Bridge, BridgeKind } from "@serverkgg/bridge";

const SAVED = /Saved the game/;

export const backup: Bridge.Backup = {
	kind: BridgeKind.Backup,
	settleSeconds: 5,
	async quiesce(context) {
		await context.command("save-off");
		await context.command("save-all flush", {
			expect: SAVED,
			timeoutMs: 30_000,
		});
	},
	async release(context) {
		await context.command("save-on");
	},
};
