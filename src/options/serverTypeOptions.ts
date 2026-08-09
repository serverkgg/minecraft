import { type Bridge, BridgeKind } from "@serverkgg/bridge";

export const serverType: Bridge.Options = {
	kind: BridgeKind.Options,
	async list() {
		return [
			{
				value: "vanilla",
				label: {
					ar: "فانيلا (Vanilla)",
					en: "Vanilla",
				},
				help: {
					ar: "نسخة موجانق الأصلية بدون أي تعديل.",
					en: "Mojang's unmodified server.",
				},
			},
			{
				value: "paper",
				label: {
					ar: "بيبر (Paper)",
					en: "Paper",
				},
				help: {
					ar: "الأفضل للأداء والإضافات.",
					en: "Best performance and plugin support.",
				},
			},
			{
				value: "purpur",
				label: {
					ar: "بيربر (Purpur)",
					en: "Purpur",
				},
				help: {
					ar: "بيبر مع إعدادات إضافية للتحكم الدقيق.",
					en: "Paper plus extra settings for fine-grained control.",
				},
			},
			{
				value: "fabric",
				label: {
					ar: "فابريك (Fabric)",
					en: "Fabric",
				},
				help: {
					ar: "للمودات الخفيفة والسريعة.",
					en: "For lightweight, fast mods.",
				},
			},
			{
				value: "neoforge",
				label: {
					ar: "نيوفورج (NeoForge)",
					en: "NeoForge",
				},
				help: {
					ar: "الخيار الأفضل للمودات الحين، ومعظم المودات الجديدة عليه.",
					en: "The best pick for mods today — most new mods target it.",
				},
			},
			{
				value: "forge",
				label: {
					ar: "فورج (Forge)",
					en: "Forge",
				},
				help: {
					ar: "للمودات والمودباكات القديمة.",
					en: "For older mods and modpacks.",
				},
			},
		];
	},
};
