import {
	type Bridge,
	BridgeConfirm,
	BridgeControl,
	BridgeFormTarget,
	BridgeIcon,
	BridgeLayout,
} from "@serverkgg/bridge";

const LOADER_TYPES = [
	"paper",
	"purpur",
	"fabric",
	"forge",
	"neoforge",
];

const versionTab: Bridge.Tab = {
	id: "version",
	title: {
		ar: "النسخة",
		en: "Version",
	},
	icon: BridgeIcon.Tag,
	sections: [
		{
			layout: BridgeLayout.Form,
			id: "version",
			target: BridgeFormTarget.Variables,
			module: "version",
			reinstall: true,
			confirm: BridgeConfirm.Normal,
			confirmText: {
				ar: "ناخذ نسخة احتياطية أول. تغيير نوع السيرفر أو الرجوع لنسخة أقدم يبدأ سيرفر جديد ويحذف الماب والإعدادات والمودات. الترقية لنسخة أحدث بنفس النوع ما تمس شي. تقدر ترجع للنسخة الاحتياطية متى ما تبي.",
				en: "We take a backup first. Switching the server type or going back to an older version starts a fresh server — the world, settings and mods are deleted. Moving to a newer version of the same type leaves everything alone. You can restore the backup whenever you want.",
			},
			fields: [
				{
					key: "SERVER_TYPE",
					control: BridgeControl.Select,
					label: {
						ar: "نوع السيرفر",
						en: "Server type",
					},
					help: {
						ar: "غيّر النوع إذا تبي إضافات أو مودات.",
						en: "Switch type for plugins or mods.",
					},
					options: {
						module: "serverType",
					},
				},
				{
					key: "MC_VERSION",
					control: BridgeControl.Select,
					label: {
						ar: "نسخة ماينكرافت",
						en: "Minecraft version",
					},
					help: {
						ar: "اتركها فاضية لآخر إصدار.",
						en: "Leave empty for the latest release.",
					},
					options: {
						module: "gameVersion",
					},
				},
				{
					key: "LOADER_VERSION",
					control: BridgeControl.Select,
					label: {
						ar: "نسخة المشغّل",
						en: "Loader build",
					},
					help: {
						ar: "اتركها فاضية لأحدث نسخة مستقرة.",
						en: "Leave empty for the latest stable build.",
					},
					options: {
						module: "loaderBuild",
					},
					visibleWhen: {
						variable: "SERVER_TYPE",
						values: LOADER_TYPES,
					},
				},
			],
		},
	],
};

const settingsTab: Bridge.Tab = {
	id: "settings",
	title: {
		ar: "الإعدادات",
		en: "Settings",
	},
	icon: BridgeIcon.Settings,
	sections: [
		{
			layout: BridgeLayout.Form,
			id: "settings",
			target: BridgeFormTarget.Settings,
			module: "settings",
			restartHint: true,
			fields: [
				{
					key: "motd",
					control: BridgeControl.Text,
					label: {
						ar: "رسالة السيرفر",
						en: "MOTD",
					},
					help: {
						ar: "النص اللي يظهر للاعبين في قائمة السيرفرات.",
						en: "Shown to players in the server list.",
					},
					maxLength: 59,
				},
				{
					key: "max-players",
					control: BridgeControl.Number,
					label: {
						ar: "أقصى عدد لاعبين",
						en: "Max players",
					},
					min: 1,
					max: 200,
				},
				{
					key: "gamemode",
					control: BridgeControl.Select,
					label: {
						ar: "نمط اللعب",
						en: "Game mode",
					},
					options: [
						{
							value: "survival",
							label: {
								ar: "البقاء",
								en: "Survival",
							},
						},
						{
							value: "creative",
							label: {
								ar: "الإبداع",
								en: "Creative",
							},
						},
						{
							value: "adventure",
							label: {
								ar: "المغامرة",
								en: "Adventure",
							},
						},
						{
							value: "spectator",
							label: {
								ar: "المشاهدة",
								en: "Spectator",
							},
						},
					],
				},
				{
					key: "difficulty",
					control: BridgeControl.Select,
					label: {
						ar: "الصعوبة",
						en: "Difficulty",
					},
					options: [
						{
							value: "peaceful",
							label: {
								ar: "مسالم",
								en: "Peaceful",
							},
						},
						{
							value: "easy",
							label: {
								ar: "سهل",
								en: "Easy",
							},
						},
						{
							value: "normal",
							label: {
								ar: "عادي",
								en: "Normal",
							},
						},
						{
							value: "hard",
							label: {
								ar: "صعب",
								en: "Hard",
							},
						},
					],
				},
				{
					key: "pvp",
					control: BridgeControl.Boolean,
					label: {
						ar: "قتال اللاعبين (PvP)",
						en: "PvP",
					},
				},
				{
					key: "online-mode",
					control: BridgeControl.Boolean,
					label: {
						ar: "الحسابات الأصلية فقط",
						en: "Online mode",
					},
					warning: {
						ar: "إيقافه يسمح للنسخ غير الأصلية بالدخول ويقلل أمان سيرفرك.",
						en: "Disabling this allows cracked clients and reduces your server's security.",
					},
				},
				{
					key: "white-list",
					control: BridgeControl.Boolean,
					label: {
						ar: "القائمة البيضاء",
						en: "Whitelist",
					},
					help: {
						ar: "لما تفعّلها، ما يدخل إلا اللاعبين اللي تضيفهم بنفسك.",
						en: "When on, only players you add can join.",
					},
				},
				{
					key: "view-distance",
					control: BridgeControl.Slider,
					label: {
						ar: "مدى الرؤية",
						en: "View distance",
					},
					help: {
						ar: "كل ما زاد، زاد استهلاك المعالج والذاكرة.",
						en: "Higher values cost more CPU and memory.",
					},
					min: 3,
					max: 32,
				},
				{
					key: "simulation-distance",
					control: BridgeControl.Slider,
					label: {
						ar: "مدى المحاكاة",
						en: "Simulation distance",
					},
					min: 3,
					max: 32,
				},
				{
					key: "spawn-protection",
					control: BridgeControl.Number,
					label: {
						ar: "حماية نقطة البداية",
						en: "Spawn protection",
					},
					min: 0,
					max: 256,
				},
				{
					key: "level-seed",
					control: BridgeControl.Text,
					label: {
						ar: "بذرة العالم",
						en: "World seed",
					},
					help: {
						ar: "اتركها فاضية لعالم عشوائي. تغييرها ما يأثر على عالم موجود.",
						en: "Leave empty for a random world. Changing it does not affect an existing world.",
					},
				},
				{
					key: "allow-flight",
					control: BridgeControl.Boolean,
					label: {
						ar: "السماح بالطيران",
						en: "Allow flight",
					},
				},
				{
					key: "enable-command-block",
					control: BridgeControl.Boolean,
					label: {
						ar: "تفعيل بلوك الأوامر",
						en: "Command blocks",
					},
				},
			],
		},
	],
};

const playersTab: Bridge.Tab = {
	id: "players",
	title: {
		ar: "اللاعبون",
		en: "Players",
	},
	icon: BridgeIcon.Users,
	sections: [
		{
			layout: BridgeLayout.Table,
			id: "players",
			title: {
				ar: "المتصلون الحين",
				en: "Online now",
			},
			module: "players",
			columns: [
				{
					key: "name",
					label: {
						ar: "اللاعب",
						en: "Player",
					},
				},
			],
			actions: [
				{
					id: "kick",
					label: {
						ar: "طرد",
						en: "Kick",
					},
					confirm: BridgeConfirm.Normal,
				},
				{
					id: "ban",
					label: {
						ar: "حظر",
						en: "Ban",
					},
					confirm: BridgeConfirm.Normal,
				},
				{
					id: "op",
					label: {
						ar: "ترقية لمشرف",
						en: "Make operator",
					},
					confirm: BridgeConfirm.Strong,
				},
			],
			empty: {
				ar: "ما فيه أحد داخل السيرفر حاليًا.",
				en: "Nobody is online right now.",
			},
		},
		{
			layout: BridgeLayout.Table,
			id: "whitelist",
			title: {
				ar: "القائمة البيضاء",
				en: "Whitelist",
			},
			module: "whitelist",
			columns: [
				{
					key: "name",
					label: {
						ar: "اللاعب",
						en: "Player",
					},
				},
			],
			add: {
				label: {
					ar: "إضافة لاعب",
					en: "Add player",
				},
				placeholder: "PlayerName",
			},
			actions: [
				{
					id: "remove",
					label: {
						ar: "إزالة",
						en: "Remove",
					},
					confirm: BridgeConfirm.Normal,
				},
			],
			empty: {
				ar: "القائمة البيضاء فاضية.",
				en: "The whitelist is empty.",
			},
		},
	],
};

const modsTab: Bridge.Tab = {
	id: "mods",
	title: {
		ar: "المودات",
		en: "Mods",
	},
	icon: BridgeIcon.Puzzle,
	sections: [
		{
			layout: BridgeLayout.Catalog,
			id: "plugins",
			title: {
				ar: "الإضافات",
				en: "Plugins",
			},
			module: "catalog",
			restartHint: true,
			empty: {
				ar: "ما ركّبت أي إضافات بعد.",
				en: "No plugins installed yet.",
			},
			visibleWhen: {
				variable: "SERVER_TYPE",
				values: [
					"paper",
					"purpur",
				],
			},
		},
		{
			layout: BridgeLayout.Catalog,
			id: "mod-list",
			title: {
				ar: "المودات",
				en: "Mods",
			},
			module: "catalog",
			restartHint: true,
			empty: {
				ar: "ما ركّبت أي مودات بعد.",
				en: "No mods installed yet.",
			},
			visibleWhen: {
				variable: "SERVER_TYPE",
				values: [
					"fabric",
					"forge",
					"neoforge",
				],
			},
		},
	],
};

export const panel: Bridge.Panel = {
	tabs: [
		versionTab,
		settingsTab,
		playersTab,
		modsTab,
	],
};
