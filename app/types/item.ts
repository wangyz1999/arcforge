export interface WorkshopUpgradeDetail {
  workshop: string;
  level: number;
  quantity: number;
}

export interface ExpeditionDetail {
  part: number;
  quantity: number;
}

export interface CandlelightDetail {
  part: number;
  quantity: number;
}

export interface QuestDetail {
  quest: string;
  quantity: number;
  note?: string;
}

export interface Item {
  name: string;
  wiki_url: string;
  infobox: {
    image: string;
    rarity: string;
    quote?: string;
    type?: string;
    special_types?: string[];
    workshop_upgrades?: WorkshopUpgradeDetail[];
    expedition_parts?: ExpeditionDetail[];
    candlelight_parts?: CandlelightDetail[];
    quests?: QuestDetail[];
    location?: string;
    weight?: number;
    sellprice?: number | number[];
    stacksize?: number;
    damage?: number;
    [key: string]: unknown;
  };
  image_urls: {
    thumb?: string;
    original?: string;
    file_page?: string;
  };
  sources?: string[];
  [key: string]: unknown;
}
