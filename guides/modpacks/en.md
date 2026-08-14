## What a modpack is

A modpack is a ready-made set of mods with their configs, put together by one author and published as a single file. Instead of installing twenty mods and tuning them yourself, you pick a modpack and we build your server around it.

We pull modpacks from **Modrinth**, and only show the ones that run on a server.

> [!warning] Every player needs the same modpack installed in their own launcher to join. Your server cannot hand the mods out to players.

## Install one

In the **Modpacks** tab search for the one you want and press install.

@[open](panel:modpacks)

We take a backup first, then:

1. We switch your server type and version to what the pack needs — a Fabric pack makes your server Fabric
2. We wipe the `mods`, `config`, `defaultconfigs`, `kubejs` and `scripts` folders
3. We download every mod in the pack and lay its configs down in their place
4. We start your server again

> [!warning] Any mod you installed yourself from the Mods tab goes with the install. And if the pack needs a different server type or an older version than yours, the world goes too. The backup we just took has all of it.

The install takes one to ten minutes depending on the pack's size. You can watch every step on screen.

## After the install

The modpack becomes your server's identity: it decides the server type, the Minecraft version and the loader build. So the **Version** tab hides its switchers and shows a card with the pack's name and the version you are on. Want a different type or version? Remove the pack first.

Mods still install on top from the **Mods** tab, and they run on the pack's own loader.

Your server address does not change:

@[field](server.address)

## Update it

When the pack publishes a new release, an **outdated** badge appears next to its name in the tab. Press update and we run the same steps with the new release — with a backup first.

> [!note] Your world stays where it is as long as the new release is on the same server type and the same version or newer.

## Remove it

Press the delete icon in the same tab. We take a backup first, then remove the pack, its mods and its configs, and the world with them. Your server goes back to plain, on the same type and version, with a fresh world.

> [!warning] A world generated on a modpack cannot open without the pack's mods — the server crashes instead of starting. That is why we start you on a fresh world. If you want the old one, download it from the **Worlds** tab before you remove the pack, or restore the backup.

Changing your server type or version while a pack is applied removes it the same way: the pack, its mods and the world go, and your server comes back on the type and version you picked.

When that happens — or when an install never finished — the pack keeps showing in the tab with an **outdated** badge so you know your server is not on it. Press the delete icon to clear it for good and get the **Version** tab back.

## Limits

- The modpack file itself must be under **256MB**
- Each file inside the pack must be under **512MB**
- The pack must list fewer than **1024** files

Most modpacks are far smaller than that. If a pack goes over a limit you get a clear reason and your server is left as it was.

## Modpacks and crossplay

Crossplay works with modpacks on Fabric and NeoForge. We reinstall Geyser and Floodgate on the first start after a modpack install, so there is no need to turn crossplay off and on again.

> [!note] Modpacks eat more memory than a plain server. Most want **4GB or more**, and some want much more — read the pack's page on Modrinth before you install it.
