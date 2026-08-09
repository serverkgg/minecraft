import type { BridgeDriver } from "@serverkgg/bridge";
import { announce } from "./announce";
import { backup } from "./backup";
import { catalog } from "./catalog";
import { players, whitelist } from "./collections";
import { events } from "./events";
import { install } from "./install";
import { lifecycle } from "./lifecycle";
import { gameVersion, loaderBuild, serverType } from "./options";
import { panel } from "./panel";
import { query } from "./query";
import { settings, version } from "./settings";
import { terminal } from "./terminal";

export const driver: BridgeDriver = {
	install,
	lifecycle,
	events,
	query,
	backup,
	announce,
	terminal,
	panel,
	modules: {
		serverType,
		gameVersion,
		loaderBuild,
		version,
		settings,
		players,
		whitelist,
		catalog,
	},
};
