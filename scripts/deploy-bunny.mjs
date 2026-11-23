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
  // Browser sollen Seiten höchstens 10 Minuten zwischenspeichern, sonst sehen Besucher alte Versionen
  try {
    const zoneUrl = `https://api.bunny.net/pullzone/${pullZoneId}`;
    const zone = await (await fetch(zoneUrl, { headers: { AccessKey: apiKey, Accept: "application/json" } })).json();
    if (zone.CacheControlPublicMaxAgeOverride !== 600) {
      const upd = await fetch(zoneUrl, { method: "POST", headers: { AccessKey: apiKey, "Content-Type": "application/json" }, body: JSON.stringify({ CacheControlPublicMaxAgeOverride: 600 }) });
      console.log(upd.ok ? "Browser-Cache auf 10 Minuten gesetzt." : `Browser-Cache konnte nicht gesetzt werden: ${upd.status}`);
    } else {
      console.log("Browser-Cache steht auf 10 Minuten.");
    }
  } catch (e) {
    console.log("Hinweis: Browser-Cache-Einstellung nicht geprüft:", e.message);
  }

  // Weiterleitungen alter Adressen (301) als Bunny-Edge-Regeln pflegen – nur fehlende neu anlegen
  try {
    const { liste } = JSON.parse(await readFile(new URL("../src/_data/weiterleitungen.json", import.meta.url), "utf8"));
    const zoneUrl = `https://api.bunny.net/pullzone/${pullZoneId}`;
    const zone = await (await fetch(zoneUrl, { headers: { AccessKey: apiKey, Accept: "application/json" } })).json();
    const soll = new Set(liste.map((w) => `Weiterleitung ${w.von} -> ${w.nach}`));
    // Veraltete Weiterleitungen entfernen (z. B. wenn ein Ziel geändert wurde)
    for (const r of zone.EdgeRules || []) {
      if ((r.Description || "").startsWith("Weiterleitung ") && !soll.has(r.Description)) {
        await fetch(`${zoneUrl}/edgerules/${r.Guid}`, { method: "DELETE", headers: { AccessKey: apiKey } });
      }
    }
    const vorhanden = new Set((zone.EdgeRules || []).map((r) => r.Description));
    let neu = 0;
    for (const w of liste) {
      const name = `Weiterleitung ${w.von} -> ${w.nach}`;
      if (vorhanden.has(name)) continue;
      const pfad = w.von.replace(/\/$/, "");
      const regel = {
        ActionType: 1, // Weiterleitung
        ActionParameter1: w.nach, // relative Adresse: funktioniert auf jeder Domain
        ActionParameter2: "301",
        TriggerMatchingType: 0, // eine Bedingung reicht
        Triggers: [{ Type: 0, PatternMatches: [`*://*${pfad}`, `*://*${pfad}/`], PatternMatchingType: 0, Parameter1: "" }],
        Description: name,
        Enabled: true
      };
      const r = await fetch(`${zoneUrl}/edgerules/addOrUpdate`, { method: "POST", headers: { AccessKey: apiKey, "Content-Type": "application/json" }, body: JSON.stringify(regel) });
      if (r.ok) neu++; else console.log(`Weiterleitung ${w.von} nicht angelegt: ${r.status} ${await r.text()}`);
    }
    console.log(`Weiterleitungen: ${liste.length} gesamt, ${neu} neu angelegt.`);
  } catch (e) {
    console.log("Hinweis: Weiterleitungen nicht geprüft:", e.message);
  }

  const res = await fetch(`https://api.bunny.net/pullzone/${pullZoneId}/purgeCache`, { method: "POST", headers: { AccessKey: apiKey } });
  if (res.ok) {
    console.log("CDN-Cache geleert, neue Version ist online.");
  } else {
    // Laut scheitern, damit es in GitHub sofort auffällt: sonst bleiben alte Seiten im Zwischenspeicher
    console.error(`Cache leeren fehlgeschlagen: ${res.status}. Bitte BUNNY_API_KEY (Konto-API-Schlüssel) und BUNNY_PULLZONE_ID prüfen.`);
    process.exit(1);
  }
} else {
  console.log("Hinweis: BUNNY_API_KEY oder BUNNY_PULLZONE_ID fehlt, Cache wurde nicht geleert.");
}
