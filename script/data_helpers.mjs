import assert from "node:assert/strict";

export function buildGraph(items, traders) {
  const nodes = new Map([
    ...items.map((item) => [
      item.name,
      {
        name: item.name,
        node_type: "item",
        wiki_url: item.wiki_url,
        source_url: item.source_url,
        infobox: item.infobox,
        image_urls: item.image_urls,
        edges: [],
      },
    ]),
    ...traders.map((trader) => [
      trader.name,
      {
        name: trader.name,
        node_type: "trader",
        wiki_url: trader.wiki_url,
        image_urls: trader.image_urls,
        edges: [],
      },
    ]),
  ]);
  function connect(from, to, relation, reverse, quantity, dependency = [], levels = {}) {
    assert(nodes.has(from) && nodes.has(to), `Unresolved relationship: ${from} → ${to}`);
    const direction = relation.endsWith("_from") ? "in" : "out";
    const common = {
      ...(quantity !== undefined ? { quantity } : {}),
      ...(dependency.length ? { dependency } : {}),
    };
    nodes.get(from).edges.push({ name: to, direction, relation, ...common, ...levels });
    nodes
      .get(to)
      .edges.push({
        name: from,
        direction: direction === "in" ? "out" : "in",
        relation: reverse,
        ...common,
        ...(levels.input_level ? { output_level: levels.input_level } : {}),
        ...(levels.output_level ? { input_level: levels.output_level } : {}),
      });
  }
  for (const item of items) {
    for (const [key, relation] of [
      ["crafting", "craft"],
      ["upgrades", "upgrade"],
      ["repairs", "repair"],
    ]) {
      for (const recipe of item[key] || []) {
        const dependency = [];
        if (recipe.workshop) dependency.push({ type: "workshop", name: recipe.workshop });
        if (recipe.blueprint_locked) dependency.push({ type: "blueprint", name: "required" });
        if (recipe.required_skill) dependency.push({ type: "skill", name: recipe.required_skill });
        if (recipe.result_level)
          dependency.push({ type: "result_level", name: recipe.result_level });
        if (recipe.output_quantity > 1)
          dependency.push({ type: "output_quantity", value: recipe.output_quantity });
        if (recipe.durability)
          dependency.push({ type: "durability", name: `+${recipe.durability}` });
        if (recipe.item_name) dependency.push({ type: "repair_level", name: recipe.item_name });
        if (recipe.input_level && recipe.output_level)
          dependency.push({
            type: "upgrade_level",
            name: `${recipe.input_level} -> ${recipe.output_level}`,
          });
        const levels = {
          ...(recipe.input_level ? { input_level: recipe.input_level } : {}),
          ...(recipe.output_level ? { output_level: recipe.output_level } : {}),
          ...(recipe.item_name ? { input_level: recipe.item_name } : {}),
        };
        for (const material of recipe.recipe)
          connect(
            item.name,
            material.item,
            `${relation}_from`,
            `${relation}_to`,
            material.quantity,
            dependency,
            levels,
          );
        if (relation === "upgrade")
          connect(
            item.name,
            item.name,
            "upgrade_to",
            "upgrade_from",
            undefined,
            [
              ...dependency,
              ...(recipe.upgrade_perks?.length
                ? [{ type: "perks", name: recipe.upgrade_perks.join(", ") }]
                : []),
            ],
            levels,
          );
      }
    }
    for (const [key, relation] of [
      ["recycling", "recycle"],
      ["salvaging", "salvage"],
    ]) {
      for (const recipe of item.recycling?.[key] || []) {
        for (const material of recipe.materials)
          connect(
            item.name,
            material.item,
            `${relation}_to`,
            `${relation}_from`,
            material.quantity,
            recipe.input ? [{ type: `${relation}_level`, name: recipe.input }] : [],
            recipe.input ? { input_level: recipe.input } : {},
          );
      }
    }
  }
  for (const trader of traders) {
    for (const offer of trader.shop) {
      const dependencies = [
        { type: "price", amount: offer.price, currency: offer.currency },
        {
          type: "stock",
          is_limited: offer.is_limited,
          ...(offer.stock !== undefined ? { value: offer.stock } : {}),
        },
      ];
      if (offer.ammo_count) dependencies.push({ type: "ammo_count", value: offer.ammo_count });
      connect(trader.name, offer.name, "trader", "sold_by", 1, dependencies);
    }
  }
  // Cargo can contain duplicate records from transcluded templates.
  for (const node of nodes.values())
    node.edges = [...new Map(node.edges.map((edge) => [JSON.stringify(edge), edge])).values()];
  return [...nodes.values()];
}

export function validateCatalog(items, traders, graph) {
  assert(items.length > 0, "Empty catalog");
  assert.equal(new Set(items.map((item) => item.name)).size, items.length, "Duplicate item names");
  const positive = (quantity) => Number.isFinite(quantity) && quantity > 0;
  for (const item of items) {
    assert(
      item.name && item.wiki_url && item.infobox.type && item.verified_at,
      `Incomplete item: ${item.name}`,
    );
    assert(
      !item.infobox.special_types?.includes("safe_to_recycle"),
      "Unsafe legacy recycling advice",
    );
    for (const field of ["weight", "stacksize", "sellprice"]) {
      const value = item.infobox[field];
      if (value !== undefined)
        assert(
          (Array.isArray(value) ? value : [value]).every(
            (number) => Number.isFinite(number) && number >= 0,
          ),
          `Invalid ${field}: ${item.name}`,
        );
    }
    for (const recipe of [
      ...(item.crafting || []),
      ...(item.upgrades || []),
      ...(item.repairs || []),
    ])
      assert(
        recipe.recipe.length && recipe.recipe.every((entry) => positive(entry.quantity)),
        `Invalid recipe: ${item.name}`,
      );
    for (const entry of [
      ...(item.infobox.projects || []),
      ...(item.infobox.workshop_upgrades || []),
      ...(item.infobox.quests || []),
    ])
      assert(positive(entry.quantity), `Invalid requirement: ${item.name}`);
  }
  const names = new Set(graph.map((node) => node.name));
  assert.equal(graph.length, items.length + traders.length, "Graph/catalog mismatch");
  for (const node of graph)
    for (const edge of node.edges) {
      assert(names.has(edge.name), `Dangling edge: ${node.name} → ${edge.name}`);
      if (edge.quantity !== undefined)
        assert(positive(edge.quantity), `Invalid edge quantity: ${node.name}`);
      const reverse = graph.find((target) => target.name === edge.name);
      assert(
        reverse.edges.some(
          (back) =>
            back.name === node.name &&
            back.direction !== edge.direction &&
            back.quantity === edge.quantity,
        ),
        `Missing reverse edge: ${node.name} → ${edge.name}`,
      );
    }
}
