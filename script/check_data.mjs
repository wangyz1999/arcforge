import fs from "node:fs/promises";
import assert from "node:assert/strict";
import { buildGraph, validateCatalog } from "./data_helpers.mjs";

const read = async (name) =>
  JSON.parse(await fs.readFile(new URL(`../data/${name}.json`, import.meta.url), "utf8"));
const items = await read("items_database");
const traders = await read("traders_database");
const graph = await read("items_relation");
const status = await read("data_status");
validateCatalog(items, traders, graph);
assert.deepEqual(graph, buildGraph(items, traders), "Graph is stale; refresh the catalog");
assert.equal(items.length, status.item_count);
assert.equal(traders.length, status.trader_count);
for (const item of items) {
  assert(
    item.source_revision && item.source_url.endsWith(String(item.source_revision)),
    `Missing provenance: ${item.name}`,
  );
  for (const url of Object.values(item.image_urls))
    assert.equal(new URL(url).hostname, "arcraiders.wiki");
  assert(
    !item.infobox.expedition_2_parts && !item.infobox.candlelight_parts,
    `Legacy project requirements: ${item.name}`,
  );
  assert.equal(item.verified_at, status.checked_at);
}
console.log(
  `Validated ${items.length} items, ${traders.length} traders, ${graph.reduce((count, node) => count + node.edges.length, 0)} graph edges and source revisions.`,
);
