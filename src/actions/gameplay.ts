import { type Bridge, BridgeKind } from "@serverkgg/bridge";
import { choiceArgument, DIFFICULTIES } from "../shared";

export const gameplay: Bridge.Actions = {
	kind: BridgeKind.Actions,
	requiresRunning: true,
	actions: {
		async timeDay(context) {
			await context.command("time set day");
		},

		async timeNight(context) {
			await context.command("time set night");
		},

		async weatherClear(context) {
			await context.command("weather clear");
		},

		async weatherRain(context) {
			await context.command("weather rain");
		},

		async weatherThunder(context) {
			await context.command("weather thunder");
		},

		async saveAll(context) {
			await context.command("save-all");
		},

		async difficulty(context, args) {
			await context.command(`difficulty ${choiceArgument(args, "mode", DIFFICULTIES)}`);
		},
	},
};
