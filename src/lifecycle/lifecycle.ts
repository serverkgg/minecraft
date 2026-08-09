import { type Bridge, BridgeKind } from "@serverkgg/bridge";
import { launchArguments, readStamp } from "../install";
import { javaBinary } from "../shared";
import { heapFor } from "./heap";

const READY = /Done \([\d.]+s\)! For help, type "help"/;

const STOPPING = /Stopping the server/;

export const lifecycle: Bridge.Lifecycle = {
	kind: BridgeKind.Lifecycle,
	ready: READY,
	stopTimeoutSeconds: 60,
	async command(context) {
		const stamp = await readStamp(context);

		if (!stamp) {
			throw new Error("minecraft is not installed yet");
		}

		return [
			javaBinary(stamp.java),
			"-Xms128M",
			`-Xmx${heapFor(context.server.memoryMb)}M`,
			...launchArguments(stamp.launch),
			"nogui",
		];
	},
	async stop(context) {
		await context.command("stop", {
			expect: STOPPING,
			timeoutMs: 30_000,
		});
	},
};
