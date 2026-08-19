## The Worlds tab

The **Worlds** tab lists every world on your server, its size, and which one is active right now.

@[open](panel:worlds)

The active world is the one your server opens on start, and its name lives in `server.properties` under `level-name`. Anything you switch from the tab applies after a restart.

## Switch world

Pick the world in the table and press **Activate**, then restart your server. The old world stays exactly where it is, and you can go back to it the same way whenever you want.

## Upload a world from your computer

A world is a zip with a folder inside it that holds `level.dat`. From the Worlds tab:

1. Press **Upload world** and pick the zip
2. Keep the page open until the progress bar finishes — we upload the file, unpack it, and add the world for you
3. Activate the new world and restart

The world takes its name from the folder inside the zip. If a world with that name is already here we tell you, so rename the folder and upload it again.

> [!note] If the world comes from a Minecraft version older than your server, Minecraft upgrades it the moment it opens it, and there is no way back. Take a backup first.

> [!warning] Before Minecraft 26.1 a Paper or Purpur world keeps its Nether and End in sibling folders ending in `_nether` and `_the_end`, while a Vanilla, Fabric or Forge world keeps them inside itself; from 26.1 on every type keeps them inside the world. A world you upload in the other layout will not show its dimensions until the folders are rearranged. When you change the server type from the Version tab we move them for you.

## Download a world to your computer

Press the download button on the world's row. We pack the world into a zip, your browser downloads it, and we delete the temporary file from your server afterwards. It is the easiest way to take the world into single player or send it to a friend.

> [!note] Download with the server off. If the world is live while you download it, its files change as we pack them and the copy you get can be incomplete.

> [!warning] On Paper and Purpur before 26.1 the Nether and the End are folders next to the world, and the download takes the overworld only. If you want them too, download their folders from the files page:

@[open](files)

## Reset the Nether or the End

**Reset the Nether** and **Reset the End** wipe that dimension completely, and it generates again the next time somebody walks in. Handy when everything has been looted, or when you want a fresh dragon.

> [!danger] Everything you built in the dimension you reset is gone forever. Portals in the overworld stay where they are, but what is on the other side changes.

## Delete a world

**Delete** removes the world with its Nether and its End forever. We will not let you delete the active world — activate another one first.

A backup is your only way back, so take one before any delete:

@[open](backups)

## Worlds and backups

Every world on your server goes into the backup. Leave five old worlds parked and your backups grow, take longer, and eat into your disk. Delete what you do not need, or download it first and then delete it here.
