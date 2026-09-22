/** Refresh the catalog from MediaWiki's structured tables and revision API.
 * Node 20+. No scraping dependencies. --offline reuses the last downloaded snapshot.
 * Downloads and validates everything before replacing any published data.
 */
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import { buildGraph, validateCatalog } from "./data_helpers.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const cache = path.join(root, ".cache", "arc-wiki");
const offline = process.argv.includes("--offline");
const api = "https://arcraiders.wiki/w/api.php";
await fs.mkdir(cache, { recursive: true });

async function request(params) {
  const query = new URLSearchParams({ action: "query", format: "json", ...params });
  const file = path.join(
    cache,
    createHash("sha256").update(query.toString()).digest("hex") + ".json",
  );
  if (offline) return JSON.parse(await fs.readFile(file, "utf8"));
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await fetch(`${api}?${query}`, {
        headers: { "User-Agent": "ARCForge/2.0 (https://github.com/wangyz1999/arcforge)" },
        signal: AbortSignal.timeout(45000),
      });
      if (!response.ok) throw new Error(`Wiki HTTP ${response.status}`);
      const json = await response.json();
      if (json.error) throw new Error(JSON.stringify(json.error));
      await fs.writeFile(file, JSON.stringify(json));
      await new Promise((resolve) => setTimeout(resolve, 150));
      return json;
    } catch (error) {
      if (attempt === 2) throw error;
      await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1)));
    }
  }
}

async function table(name, fields) {
  const rows = [];
  for (let offset = 0; ; offset += 500) {
    const json = await request({
      action: "cargoquery",
      tables: name,
      fields,
      limit: "500",
      offset: String(offset),
      order_by: `${name}._ID`,
    });
    if (!Array.isArray(json.cargoquery)) throw new Error(`Missing table ${name}`);
    rows.push(
      ...json.cargoquery.map((row) =>
        Object.fromEntries(Object.entries(row.title).map(([key, value]) => [key, clean(value)])),
      ),
    );
    if (json.cargoquery.length < 500) break;
  }
  console.log(`${name}: ${rows.length} rows`);
  if (!rows.length) throw new Error(`Empty upstream table: ${name}; refusing to publish`);
  return rows;
}

export function clean(value = "") {
  return String(value)
    .replace(/<!--[^]*?-->/g, "")
    .replace(/<br\s*\/?\s*>/gi, " / ")
    .replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (_, target, label) => label || target)
    .replace(/'{2,}/g, "")
    .replace(/<[^>]*>/g, "")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/\{\{!\}\}/g, " / ")
    .replace(/&quot;/g, '"')
    .replace(/&#0*39;|&apos;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .trim();
}

// Split only at the top level, preserving nested templates and wiki links.
function splitParams(text) {
  const parts = [];
  let depth = 0;
  let links = 0;
  let start = 0;
  for (let i = 0; i < text.length; i++) {
    const pair = text.slice(i, i + 2);
    if (pair === "{{") {
      depth++;
      i++;
    } else if (pair === "}}") {
      depth--;
      i++;
    } else if (pair === "[[") {
      links++;
      i++;
    } else if (pair === "]]") {
      links--;
      i++;
    } else if (text[i] === "|" && depth === 0 && links === 0) {
      parts.push(text.slice(start, i).trim());
      start = i + 1;
    }
  }
  parts.push(text.slice(start).trim());
  return parts;
}

function templates(text, wanted) {
  const result = [];
  const regex = /\{\{([^|{}\n]+)/g;
  for (const match of text.matchAll(regex)) {
    if (!wanted.test(match[1].trim())) continue;
    let depth = 1;
    let end = match.index + 2;
    for (; end < text.length - 1; end++) {
      const pair = text.slice(end, end + 2);
      if (pair === "{{") {
        depth++;
        end++;
      } else if (pair === "}}") {
        depth--;
        if (!depth) break;
        end++;
      }
    }
    const parts = splitParams(text.slice(match.index + 2, end));
    const values = { template: parts.shift() };
    let index = 1;
    for (const part of parts) {
      const eq = part.indexOf("=");
      if (eq < 0) values[index++] = part;
      else values[part.slice(0, eq).trim()] = part.slice(eq + 1).trim();
    }
    result.push(values);
  }
  return result;
}

const numeric = (value) => {
  const match = String(value ?? "")
    .trim()
    .replaceAll(",", "")
    .match(/^(-?\d+(?:\.\d+)?)([kKmM])?$/);
  return match
    ? Number(match[1]) * ({ k: 1000, m: 1000000 }[match[2]?.toLowerCase()] || 1)
    : undefined;
};
const wiki = (name) =>
  `https://arcraiders.wiki/wiki/${encodeURIComponent(name.replaceAll(" ", "_"))}`;
const fields = {
  items: "_pageName=page,name,image,rarity,description,type,location,weight,stacksize,sellprice",
  crafting:
    "_pageName=page,resultItem,resultQty,ingredients,requireBlueprint,requireStation,requireSkill",
  recycling: "inputItem,outputQty,outputItem,recipeType",
  projectItems: "projectPage,projectName,projectPart,stage,context,itemPage,itemName,qty",
  projects: "name,type,start,end",
  workshopUpgrades: "station,stationLevel,itemPage,itemName,qty",
  questItems: "_pageName=page,context,itemPage,itemName,qty,type",
};
const tables = {};
for (const [name, columns] of Object.entries(fields)) tables[name] = await table(name, columns);
const weaponPages = [];
let continuation = {};
do {
  const result = await request({
    list: "embeddedin",
    eititle: "Template:Infobox weapon",
    einamespace: "0",
    eilimit: "500",
    ...continuation,
  });
  weaponPages.push(...result.query.embeddedin.map((page) => page.title));
  continuation = result.continue;
} while (continuation);
const traderNames = ["Apollo", "Celeste", "Lance", "Shani", "Tian Wen", "Ermal"];
const titles = [
  ...new Set([...tables.items.map((row) => row.page), ...weaponPages, ...traderNames]),
].sort();
const pages = new Map();
for (let i = 0; i < titles.length; i += 50) {
  const json = await request({
    prop: "revisions",
    rvprop: "ids|timestamp|content",
    rvslots: "main",
    titles: titles.slice(i, i + 50).join("|"),
  });
  for (const page of Object.values(json.query.pages)) {
    if (!page.revisions?.[0]) throw new Error(`Missing source revision: ${page.title}`);
    pages.set(page.title, page);
  }
  console.log(`Source pages: ${Math.min(i + 50, titles.length)}/${titles.length}`);
}
const source = (name) => pages.get(name)?.revisions[0].slots.main["*"] || "";
const timestampFile = path.join(cache, "fetched-at.txt");
const checkedAt = offline
  ? (await fs.readFile(timestampFile, "utf8")).trim()
  : new Date().toISOString();
if (!offline) await fs.writeFile(timestampFile, checkedAt);
const catalog = new Map();
const omitted = [];

for (const title of [...new Set([...tables.items.map((row) => row.page), ...weaponPages])]) {
  const row = tables.items.find((entry) => entry.page === title);
  const raw = source(title)
    .replace(/<!--[^]*?-->/g, "")
    .replaceAll("{{PAGENAME}}", title);
  const box = templates(raw, /^Infobox (?:item|weapon|augment|mod)$/i)[0];
  // Blueprint/quest templates may populate Cargo without a conventional infobox.
  if (!box && !row) {
    omitted.push(title);
    continue;
  }
  const infobox = {};
  for (const [key, value] of Object.entries(box || {})) {
    if (key === "template") continue;
    const text = clean(value);
    if (text && !text.includes("{{")) infobox[key] = numeric(text) ?? text;
  }
  const name = clean(box?.name || row?.name || title);
  infobox.name = name;
  infobox.image = clean(box?.image || row?.image || "").replace(/^File:/, "");
  infobox.rarity = clean(box?.rarity || row?.rarity || "");
  infobox.type = clean(box?.type || row?.type || "");
  if (box?.template.toLowerCase() === "infobox augment") infobox.type = "Augment";
  if (infobox.type.startsWith("Ammunition")) infobox.type = "Ammo";
  if (infobox.type.startsWith("Mods-"))
    infobox.type = infobox.type.replace("Mods-", "Modification-");
  if (infobox.type === "Mods") infobox.type = "Modification";
  if (!infobox.type) throw new Error(`Missing item type: ${title}`);
  if (row?.description || box?.weaponquote || box?.quote)
    infobox.quote = clean(box?.weaponquote || box?.quote || row.description);
  for (const key of ["weight", "stacksize"]) {
    const value = numeric(box?.[key] ?? row?.[key]);
    if (value !== undefined) infobox[key] = value;
    else delete infobox[key];
  }
  const priceText = box?.sellprice || row?.sellprice || "";
  const priceTemplates = templates(priceText, /^Price$/i);
  const prices = (
    priceTemplates.length
      ? priceTemplates.map((entry) => entry[1])
      : priceText.split(/<br\s*\/?\s*>/i)
  )
    .map(numeric)
    .filter((n) => n !== undefined);
  delete infobox.sellprice;
  if (prices.length) infobox.sellprice = prices.length === 1 ? prices[0] : prices;
  if (row?.location && !infobox.location) infobox.location = row.location;
  const functions = Object.entries(box || {})
    .filter(([key]) => /^fun\d+$/.test(key))
    .sort(([a], [b]) => Number(a.slice(3)) - Number(b.slice(3)))
    .map(([, value]) => clean(value));
  if (functions.length) infobox.functions = functions;
  const revision = pages.get(title).revisions[0];
  const item = {
    name,
    wiki_url: wiki(title),
    source_url: `https://arcraiders.wiki/w/index.php?oldid=${revision.revid}`,
    source_revision: revision.revid,
    source_updated_at: revision.timestamp,
    verified_at: checkedAt,
    infobox,
    image_urls: {},
  };
  const sourceSection = raw.match(/==\s*Sources\s*==([^]*?)(?=\n==[^=]|$)/i)?.[1] || "";
  item.sources = sourceSection
    .split("\n")
    .filter((line) => /^\*[^*]/.test(line))
    .map((line) => clean(line.slice(1)))
    .filter(
      (line) =>
        line &&
        !line.includes("{{") &&
        !line.startsWith("Quests:") &&
        !line.startsWith("Projects:"),
    )
    .map((line) => line.replace(/\s*\([^]*$/, ""));
  for (const upgrade of templates(raw, /^Weapon upgrades$/i)) {
    item.upgrades = [2, 3, 4]
      .filter((level) => upgrade[`level${level}-ingredients`])
      .map((level) => ({
        input_level: ["I", "II", "III"][level - 2],
        output_level: ["II", "III", "IV"][level - 2],
        workshop: clean(upgrade.station || ""),
        recipe: materials(upgrade[`level${level}-ingredients`]),
        upgrade_perks: clean(upgrade[`level${level}-perks`] || "").split(" / "),
      }));
  }
  const repairing = raw.match(
    /==\s*(?:Repairing|Required Materials to Repair)\s*==([^]*?)(?=\n==[^=]|$)/i,
  )?.[1];
  if (repairing) {
    item.repairs = repairing
      .split("|-")
      .slice(1)
      .flatMap((text) => {
        const cells = text.split(/\n\|/).slice(1).map(clean);
        const recipe = [...text.matchAll(/(\d+)\s*[×x]\s*\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/g)].map(
          (m) => ({ quantity: Number(m[1]), item: clean(m[2]) }),
        );
        if (!recipe.length) return [];
        return [
          {
            item_name: cells[0] || name,
            recipe,
            ...(cells[2]?.match(/\+([\d.]+)/)
              ? { durability: Number(cells[2].match(/\+([\d.]+)/)[1]) }
              : {}),
          },
        ];
      });
  }
  catalog.set(name, item);
}

function materials(text) {
  return text.split(/\s+\+\s+/).map((value) => {
    const match = clean(value).match(/^(\d+)\s*[×x]?\s+(.+)$/);
    if (!match) throw new Error(`Unrecognized material: ${value}`);
    return { quantity: Number(match[1]), item: match[2] };
  });
}
function base(name) {
  if (catalog.has(name)) return name;
  const withoutLevel = name.replace(/ (IV|III|II|I)$/, "");
  return catalog.has(withoutLevel) ? withoutLevel : name;
}
for (const row of tables.crafting) {
  const item = catalog.get(base(row.resultItem));
  if (!item) throw new Error(`Unknown craft output: ${row.resultItem}`);
  // The Weapon upgrades template also writes to Cargo's crafting table.
  if (item.upgrades?.length && / (II|III|IV)$/.test(row.resultItem)) continue;
  const recipe = row.ingredients.split(",").map((value) => {
    const match = value.match(/^([^:]+):(\d+)(?::(.+))?$/);
    if (!match) throw new Error(`Unrecognized ingredient: ${value}`);
    return { item: base(match[3] || match[1]), quantity: Number(match[2]) };
  });
  (item.crafting ||= []).push({
    recipe,
    output_quantity: Number(row.resultQty),
    output_item: row.resultItem,
    workshop: row.requireStation,
    blueprint_locked: Boolean(row.requireBlueprint),
    ...(row.requireSkill ? { required_skill: row.requireSkill } : {}),
    ...(row.resultItem !== item.name ? { result_level: row.resultItem.split(" ").at(-1) } : {}),
  });
}
for (const row of tables.recycling) {
  const item = catalog.get(base(row.inputItem));
  if (!item) throw new Error(`Unknown recycle input: ${row.inputItem}`);
  if (!["recycling", "salvaging"].includes(row.recipeType))
    throw new Error(`Unknown recycling type ${row.recipeType}`);
  const recipes = (item.recycling ||= { recycling: [], salvaging: [] })[row.recipeType];
  let recipe = recipes.find((entry) => entry.input === row.inputItem);
  if (!recipe) {
    recipe = { input: row.inputItem, materials: [] };
    recipes.push(recipe);
  }
  recipe.materials.push({ item: base(row.outputItem), quantity: Number(row.outputQty) });
}
function tag(item, name) {
  const types = (item.infobox.special_types ||= []);
  if (!types.includes(name)) types.push(name);
}
for (const row of tables.workshopUpgrades) {
  const item = catalog.get(base(row.itemPage));
  if (!item) throw new Error(`Unknown workshop material: ${row.itemPage}`);
  tag(item, "workshop_upgrade");
  (item.infobox.workshop_upgrades ||= []).push({
    workshop: row.station.toLowerCase().replaceAll(" ", "_"),
    level: Number(row.stationLevel),
    quantity: Number(row.qty),
  });
}
for (const row of tables.questItems.filter((entry) => entry.context === "require")) {
  const item = catalog.get(base(row.itemPage));
  if (!item) continue; // Quest requirements may be currencies or objectives, not inventory items.
  tag(item, "quest");
  (item.infobox.quests ||= []).push({ quest: row.page, quantity: Number(row.qty) });
}
const today = checkedAt.slice(0, 10);
const projects = tables.projects
  .filter((row) => (!row.start || row.start <= today) && (!row.end || row.end >= today))
  .map((row) => ({
    name: row.name,
    start: row.start || null,
    end: row.end || null,
    wiki_url: wiki(row.name),
    requirements: tables.projectItems.filter(
      (entry) => entry.projectPage === row.name && entry.context === "require",
    ),
  }));
for (const project of projects) {
  for (const row of project.requirements) {
    const item = catalog.get(base(row.itemPage));
    if (!item) continue; // Coin-value contribution stages are described on the project page.
    tag(item, project.name === "Expedition" ? "expedition" : "project");
    (item.infobox.projects ||= []).push({
      project: row.projectName,
      part: Number(row.projectPart),
      stage: Number(row.stage),
      quantity: Number(row.qty),
      wiki_url: project.wiki_url,
      end: project.end,
    });
  }
}
for (const item of catalog.values()) {
  for (const recipe of [
    ...(item.crafting || []),
    ...(item.upgrades || []),
    ...(item.repairs || []),
  ]) {
    for (const material of recipe.recipe) {
      material.item = base(material.item);
      const ingredient = catalog.get(material.item);
      if (ingredient) tag(ingredient, "crafting_material");
    }
  }
}
const traders = traderNames.map((name) => {
  const raw = source(name);
  const shop = [];
  for (const grid of name === "Ermal" ? [] : templates(raw, /^ItemGrid$/i)) {
    for (const key of Object.keys(grid).filter((key) => /^name\d+$/.test(key))) {
      const index = key.slice(4);
      const price = templates(grid[`price${index}`] || "", /^Price$/i)[0];
      if (!price) continue; // Ermal's accepted barter and rotating offers aren't fixed shop prices.
      const itemName = base(clean(grid[key]));
      if (!catalog.has(itemName)) throw new Error(`Unknown trader item: ${name} / ${itemName}`);
      const amount = numeric(price[1]);
      if (amount === undefined) throw new Error(`Unknown trader price: ${name} / ${itemName}`);
      const stock = grid[`category-icon${index}`]?.match(/(\d+)\/(\d+)/);
      shop.push({
        name: itemName,
        price: amount,
        currency: clean(price[2] || "Coins"),
        is_limited: grid[`isLimited${index}`] === "true",
        ...(stock ? { stock: Number(stock[2]) } : {}),
        ...(grid[`ammo-count${index}`] ? { ammo_count: Number(grid[`ammo-count${index}`]) } : {}),
      });
    }
  }
  const image = raw.match(/\[\[File:([^|\]]+)/)?.[1];
  return {
    name,
    wiki_url: wiki(name),
    source_url: `https://arcraiders.wiki/w/index.php?oldid=${pages.get(name).revisions[0].revid}`,
    verified_at: checkedAt,
    image_filename: image,
    image_urls: {},
    shop,
    ...(name === "Ermal"
      ? { note: "Rotating barter offers; check the in-game shop for current stock and costs." }
      : {}),
  };
});

const images = [
  ...new Set(
    [...catalog.values()]
      .map((item) => item.infobox.image)
      .concat(traders.map((trader) => trader.image_filename))
      .filter(Boolean),
  ),
];
const imageUrls = new Map();
for (let i = 0; i < images.length; i += 50) {
  const json = await request({
    prop: "imageinfo",
    iiprop: "url",
    iiurlwidth: "348",
    titles: images
      .slice(i, i + 50)
      .map((name) => `File:${name}`)
      .join("|"),
  });
  const normalized = new Map((json.query.normalized || []).map((entry) => [entry.from, entry.to]));
  for (const name of images.slice(i, i + 50)) {
    const title = normalized.get(`File:${name}`) || `File:${name}`;
    const info = Object.values(json.query.pages).find((page) => page.title === title)
      ?.imageinfo?.[0];
    if (info)
      imageUrls.set(name, {
        thumb: info.thumburl || info.url,
        original: info.url,
        file_page: info.descriptionurl,
      });
  }
  console.log(`Images: ${Math.min(i + 50, images.length)}/${images.length}`);
}
for (const item of catalog.values()) item.image_urls = imageUrls.get(item.infobox.image) || {};
for (const trader of traders) trader.image_urls = imageUrls.get(trader.image_filename) || {};
const items = [...catalog.values()].sort((a, b) => a.name.localeCompare(b.name, "en"));
const graph = buildGraph(items, traders);
validateCatalog(items, traders, graph);
const previous = JSON.parse(await fs.readFile(path.join(root, "data/items_database.json"), "utf8"));
if (items.length < previous.length * 0.9)
  throw new Error(
    "Catalog shrank more than 10%; refusing to publish. Review upstream changes first.",
  );
if (omitted.length) throw new Error(`Unparsed weapon pages: ${omitted.join(", ")}`);
const metadata = {
  checked_at: checkedAt,
  source: "ARC Raiders Wiki",
  source_url: "https://arcraiders.wiki/",
  license: "CC BY-SA 4.0",
  license_url: "https://creativecommons.org/licenses/by-sa/4.0/",
  item_count: items.length,
  weapon_count: weaponPages.length,
  trader_count: traders.length,
  crafting_recipe_count: tables.crafting.length,
  recycling_row_count: tables.recycling.length,
  missing_images: items.filter((item) => !item.image_urls.thumb).map((item) => item.name),
  notes: [
    "Community-maintained item data; linked wiki revisions record provenance.",
    "No item is labeled safe to recycle. Check quests, workshop upgrades and project requirements first.",
    "Ermal's rotating barter inventory is linked rather than represented as fixed trades.",
    "Untranslated item names fall back to English.",
  ],
};
const specialTypes = {
  workshop_upgrade: {},
  quest: {},
  projects,
  crafting_material: items
    .filter((item) => item.infobox.special_types?.includes("crafting_material"))
    .map((item) => item.name),
};
for (const row of tables.workshopUpgrades) {
  const station = row.station.toLowerCase().replaceAll(" ", "_");
  ((specialTypes.workshop_upgrade[station] ||= {})[`level_${row.stationLevel}`] ||= []).push({
    item: base(row.itemPage),
    quantity: Number(row.qty),
  });
}
for (const row of tables.questItems.filter(
  (entry) => entry.context === "require" && catalog.has(base(entry.itemPage)),
))
  (specialTypes.quest[row.page] ||= []).push({
    item: base(row.itemPage),
    quantity: Number(row.qty),
  });
const outputs = {
  "items_database.json": items,
  "traders_database.json": traders,
  "items_relation.json": graph,
  "projects.json": projects,
  "data_status.json": metadata,
  "special_item_types.json": specialTypes,
};
for (const [filename, value] of Object.entries(outputs))
  await fs.writeFile(
    path.join(root, "data", `${filename}.tmp`),
    JSON.stringify(value, null, 2) + "\n",
  );
for (const filename of Object.keys(outputs))
  await fs.rename(path.join(root, "data", `${filename}.tmp`), path.join(root, "data", filename));
await fs.writeFile(
  path.join(root, "data/names.txt"),
  items.map((item) => item.name).join("\n") + "\n",
);
await fs.writeFile(path.join(root, "data/traders.txt"), traderNames.join("\n") + "\n");
console.log(
  `Published ${items.length} items, ${traders.length} traders, ${Object.keys(graph).length} graph nodes.`,
);
