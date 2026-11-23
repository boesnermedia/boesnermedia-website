// Lädt den Ordner _site in die Bunny Storage Zone hoch und leert danach den CDN-Cache.
import { readdir, readFile } from "node:fs/promises";
import { join, relative } from "node:path";

const zone = process.env.BUNNY_STORAGE_ZONE;
const host = (process.env.BUNNY_STORAGE_HOST || "storage.bunnycdn.com").replace(/^https?:\/\//, "").replace(/\/$/, "");
const password = process.env.BUNNY_STORAGE_PASSWORD;
const apiKey = process.env.BUNNY_API_KEY;
const pullZoneId = process.env.BUNNY_PULLZONE_ID;
const root = "_site";

if (!zone || !password) {
  console.log("Noch nicht verbunden: In GitHub fehlen BUNNY_STORAGE_ZONE oder BUNNY_STORAGE_PASSWORD. Nichts hochgeladen.");
  process.exit(0);
}

async function files(dir) {
  const out = [];
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) out.push(...(await files(p)));
    else if (!p.endsWith(".map")) out.push(p);
  }
  return out;
}

async function upload(file) {
  const path = relative(root, file).split("\\").join("/");
  const url = `https://${host}/${zone}/${path.split("/").map(encodeURIComponent).join("/")}`;
  for (let attempt = 1; attempt <= 3; attempt++) {
    const res = await fetch(url, { method: "PUT", headers: { AccessKey: password, "Content-Type": "application/octet-stream" }, body: await readFile(file) });
    if (res.ok) return;
    if (attempt === 3) throw new Error(`${path}: ${res.status} ${await res.text()}`);
  }
}

const list = await files(root);
console.log(`Lade ${list.length} Dateien hoch …`);
const queue = [...list];
await Promise.all(Array.from({ length: 8 }, async () => {
  while (queue.length) await upload(queue.shift());
}));
console.log("Hochladen fertig.");

if (apiKey && pullZoneId) {
  const res = await fetch(`https://api.bunny.net/pullzone/${pullZoneId}/purgeCache`, { method: "POST", headers: { AccessKey: apiKey } });
  console.log(res.ok ? "CDN-Cache geleert, neue Version ist online." : `Cache leeren fehlgeschlagen: ${res.status}`);
} else {
  console.log("Hinweis: BUNNY_API_KEY oder BUNNY_PULLZONE_ID fehlt, Cache wurde nicht geleert.");
}
