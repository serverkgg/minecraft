import type { Bridge } from "@serverkgg/bridge";
import { PURPUR_PROJECT, SERVER_JAR } from "../shared";
import { jarLaunch } from "./launchPlan";

export const installPurpur = async (context: Bridge.Context, gameVersion: string, build: string | null) => {
	await context.files.download(SERVER_JAR, `${PURPUR_PROJECT}/${gameVersion}/${build ?? "latest"}/download`);

	await context.files.ensure("plugins");

	return jarLaunch;
};
