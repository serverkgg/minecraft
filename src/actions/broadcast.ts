import { type Bridge, BridgeKind } from "@serverkgg/bridge";
import { messageArgument, tellrawAll, titleAll } from "../shared";

export const broadcast: Bridge.Actions = {
	kind: BridgeKind.Actions,
	requiresRunning: true,
	actions: {
		async say(context, args) {
			await tellrawAll(context, messageArgument(args));
		},

		async title(context, args) {
			await titleAll(context, messageArgument(args));
		},
	},
};
