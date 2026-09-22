import test from "node:test";
import assert from "node:assert/strict";
import { buildGraph, validateCatalog } from "./data_helpers.mjs";

const item = (name) => ({
  name,
  wiki_url: `https://arcraiders.wiki/wiki/${name}`,
  verified_at: "2026-09-22",
  infobox: { type: "Ammo" },
  image_urls: {},
});

test("recipe paths preserve batch yield, skill and blueprint requirements in both directions", () => {
  const items = [item("Ammo"), item("Metal")];
  items[0].crafting = [
    {
      recipe: [{ item: "Metal", quantity: 4 }],
      output_quantity: 10,
      workshop: "Inventory",
      required_skill: "In-Round Crafting",
      blueprint_locked: true,
    },
  ];
  const graph = buildGraph(items, []);
  validateCatalog(items, [], graph);
  assert.equal(graph[0].edges[0].quantity, 4);
  assert.equal(graph[1].edges[0].relation, "craft_to");
  assert.deepEqual(graph[0].edges[0].dependency, graph[1].edges[0].dependency);
  assert(
    graph[0].edges[0].dependency.some(
      (dependency) => dependency.type === "output_quantity" && dependency.value === 10,
    ),
  );
  assert(graph[0].edges[0].dependency.some((dependency) => dependency.type === "skill"));
});

test("level-specific recycling does not collapse distinct material yields", () => {
  const items = [item("Weapon"), item("Metal")];
  items[0].recycling = {
    recycling: [1, 2].map((quantity) => ({
      input: `Weapon ${quantity === 1 ? "I" : "II"}`,
      materials: [{ item: "Metal", quantity }],
    })),
  };
  const graph = buildGraph(items, []);
  validateCatalog(items, [], graph);
  assert.equal(graph[0].edges.length, 2);
  assert.equal(graph[1].edges[1].output_level, "Weapon II");
});

test("unresolved ingredients and invalid quantities fail validation", () => {
  const broken = item("Ammo");
  broken.crafting = [{ recipe: [{ item: "Missing", quantity: 1 }] }];
  assert.throws(() => buildGraph([broken], []), /Unresolved relationship/);
  broken.crafting = [{ recipe: [{ item: "Ammo", quantity: 0 }] }];
  assert.throws(() => validateCatalog([broken], [], buildGraph([broken], [])), /Invalid recipe/);
});

test("rotating traders can exist without fabricated offers", () => {
  const traders = [{ name: "Ermal", wiki_url: "https://arcraiders.wiki/wiki/Ermal", shop: [] }];
  const items = [item("Metal")];
  const graph = buildGraph(items, traders);
  validateCatalog(items, traders, graph);
  assert.deepEqual(graph[1].edges, []);
});
