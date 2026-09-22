"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faStar,
  faExternalLinkAlt,
  faDiagramProject,
  faLocationDot,
  faQuoteLeft,
  faHeart,
  faWrench,
  faRocket,
  faScroll,
  faTableColumns,
} from "@fortawesome/free-solid-svg-icons";
import { Item, WorkshopUpgradeDetail, QuestDetail } from "../../types/item";
import { rarityColors, rarityGradients } from "../../config/rarityConfig";
import { specialTypeLabels } from "../../config/categoryConfig";
import { useTranslation } from "../../i18n";

interface ItemDetailPanelProps {
  item: Item;
  onClose: () => void;
  onItemTracked: (name: string) => void;
  isTrackedFunc: (name: string) => boolean;
}

const getSellPrice = (
  price: number | number[] | null | undefined,
  notAvailable: string,
): string => {
  if (!price) return notAvailable;
  if (Array.isArray(price)) {
    return `${price[0]} - ${price[price.length - 1]}`;
  }
  return price.toString();
};

export default function ItemDetailPanel({
  item,
  onClose,
  onItemTracked,
  isTrackedFunc,
}: ItemDetailPanelProps) {
  /**
   * ItemDetailPanel
   *
   * Slide-over panel that shows “full details” for one item:
   * - Header (rarity/type), image, quote/location/sources
   * - Special sub-sections (workshop upgrades / expedition / candlelight / quests)
   * - Action buttons:
   *   - Wiki (external)
   *   - Crafting Graph: `/?graph=<ItemName>`
   *   - Crafting Table: `/?graph=<ItemName>&layout=table`
   *
   * Notes:
   * - Translation uses `tItem(item.name)` for display, but routing/IDs use the original `item.name`.
   */
  const { t, tItem } = useTranslation();

  // Get translated item name
  const translatedName = tItem(item.name);

  // Get translated special type label
  const getSpecialTypeLabel = (type: string): string => {
    const key = `specialType.${type}`;
    const translated = t(key);
    return translated !== key ? translated : specialTypeLabels[type] || type;
  };

  // Get translated rarity
  const getRarityLabel = (rarity: string): string => {
    const key = `rarity.${rarity}`;
    const translated = t(key);
    return translated !== key ? translated : rarity;
  };

  // Get translated item type
  const getTypeLabel = (type: string): string => {
    const key = `itemType.${type}`;
    const translated = t(key);
    return translated !== key ? translated : type;
  };

  // Get translated workshop name
  const getWorkshopLabel = (workshop: string): string => {
    const key = `workshop.${workshop}`;
    const translated = t(key);
    return translated !== key ? translated : workshop.replace(/_/g, " ");
  };

  // Get translated quest name
  const getQuestLabel = (quest: string): string => {
    const key = `quest.${quest}`;
    const translated = t(key);
    return translated !== key ? translated : quest;
  };

  // Get translated source name
  const getSourceLabel = (source: string): string => {
    const key = `source.${source}`;
    const translated = t(key);
    return translated !== key ? translated : source;
  };
  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/70 z-40 backdrop-blur-md" onClick={onClose} />

      {/* Detail Panel */}
      <div className="fixed top-0 right-0 h-full w-full md:w-[500px] bg-linear-to-br from-black/95 via-purple-950/30 to-black/95 backdrop-blur-2xl border-l border-purple-500/40 z-50 overflow-y-auto animate-slide-in shadow-2xl">
        {/* Decorative gradient overlay */}
        <div className="absolute inset-0 bg-linear-to-br from-purple-500/5 via-transparent to-blue-500/5 pointer-events-none" />

        <div className="relative z-10 p-5">
          <div className="absolute top-4 right-4 z-50 flex gap-4">
            {/* Favorite Item Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onItemTracked(item.name);
              }}
              title={isTrackedFunc(item.name) ? t("favorite.unfavorite") : t("favorite.favorite")}
              className={`w-10 h-10 flex items-center justify-center rounded-md text-sm ${
                isTrackedFunc(item.name) ? "bg-red-500 text-white" : "bg-black/40 text-purple-200"
              }`}
              style={{ cursor: "pointer" }}
            >
              <FontAwesomeIcon
                icon={faHeart}
                className="text-white text-xl relative z-10 drop-shadow-lg"
              />
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="w-10 h-10 flex items-center justify-center bg-black/60 hover:bg-red-500/30 backdrop-blur-sm rounded-lg transition-all duration-300 text-gray-400 hover:text-red-300 border border-purple-500/20 hover:border-red-500/50 shadow-lg hover:scale-110 group"
              aria-label={t("buttons.close")}
            >
              <span className="text-lg group-hover:rotate-90 transition-transform duration-300">
                ✕
              </span>
            </button>
          </div>

          {/* Item Header with Name */}
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <div
                className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-bold uppercase tracking-wider backdrop-blur-sm border shadow-lg"
                style={{
                  backgroundColor: `${rarityColors[item.infobox?.rarity] || "#717471"}30`,
                  borderColor: `${rarityColors[item.infobox?.rarity] || "#717471"}60`,
                  color: rarityColors[item.infobox?.rarity] || "#717471",
                  boxShadow: `0 4px 20px ${rarityColors[item.infobox?.rarity] || "#717471"}30`,
                }}
              >
                <FontAwesomeIcon icon={faStar} className="text-xs" />
                {getRarityLabel(item.infobox?.rarity || "Unspecified")}
              </div>

              {item.infobox?.type && (
                <span className="text-purple-400 text-xs font-semibold uppercase tracking-wider inline-flex items-center px-2 py-0.5 bg-purple-500/20 rounded-md border border-purple-500/30">
                  {getTypeLabel(item.infobox.type)}
                </span>
              )}
            </div>

            <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-linear-to-r from-gray-100 via-purple-200 to-gray-100 drop-shadow-lg">
              {translatedName}
            </h2>
          </div>

          {/* Side by side: Image left, Info right */}
          <div className="flex gap-4 mb-4">
            {/* Item Image - left side */}
            {item.image_urls?.thumb && (
              <a
                href={`/?graph=${encodeURIComponent(item.name)}`}
                className="relative w-52 h-52 shrink-0 rounded-xl flex items-center justify-center p-4 border overflow-hidden group shadow-xl cursor-pointer"
                style={{
                  background: rarityGradients[item.infobox?.rarity] || rarityGradients.Common,
                  borderColor: `${rarityColors[item.infobox?.rarity] || "#717471"}40`,
                  boxShadow: `0 8px 32px ${rarityColors[item.infobox?.rarity] || "#717471"}40, inset 0 1px 0 rgba(255,255,255,0.1)`,
                }}
              >
                <div className="absolute inset-0 bg-linear-to-tr from-white/0 via-white/10 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.image_urls.thumb}
                  alt={translatedName}
                  className="w-full h-full object-contain relative z-10 drop-shadow-2xl"
                />
              </a>
            )}

            {/* Right side: Quote, Location, Sources */}
            <div className="flex-1 flex flex-col justify-center space-y-2.5 text-sm">
              {/* Quote */}
              {item.infobox?.quote && (
                <p className="text-gray-400 italic leading-relaxed line-clamp-3">
                  <FontAwesomeIcon icon={faQuoteLeft} className="text-purple-400/40 text-xs mr-1" />
                  {item.infobox.quote}
                </p>
              )}

              {/* Location */}
              {item.infobox?.location && (
                <div className="flex items-start gap-1.5">
                  <FontAwesomeIcon
                    icon={faLocationDot}
                    className="text-blue-400/60 text-xs mt-0.5"
                  />
                  <span
                    className="text-gray-400"
                    dangerouslySetInnerHTML={{
                      __html: item.infobox.location.replace(/<br\s*\/?>/gi, " • "),
                    }}
                  />
                </div>
              )}

              {/* Sources */}
              {item.sources && item.sources.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {item.sources.map((source: string, idx: number) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 bg-blue-500/20 text-blue-300 rounded text-xs border border-blue-400/30"
                    >
                      {getSourceLabel(source)}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Stats as compact horizontal pills */}
          <div className="flex flex-wrap gap-4 mb-4 text-sm">
            {item.infobox?.sellprice != null && (
              <span className="text-emerald-400">
                <span className="text-gray-500">💰</span>{" "}
                {getSellPrice(item.infobox.sellprice, t("item.notAvailable"))}
              </span>
            )}
            {item.infobox?.weight != null && (
              <span className="text-gray-300">
                <span className="text-gray-500">⚖️</span> {item.infobox.weight}
              </span>
            )}
            {item.infobox?.stacksize != null && (
              <span className="text-gray-300">
                <span className="text-gray-500">📦</span> {item.infobox.stacksize}
              </span>
            )}
            {item.infobox?.damage != null && (
              <span className="text-red-400">
                <span className="text-gray-500">⚔️</span> {item.infobox.damage}
              </span>
            )}
          </div>

          {Array.isArray(item.infobox.functions) && (
            <ul className="mb-4 space-y-1 text-sm text-gray-300">
              {(item.infobox.functions as string[]).map((effect) => (
                <li key={effect}>{effect}</li>
              ))}
            </ul>
          )}
          {item.infobox.ammo != null && (
            <dl className="mb-4 grid grid-cols-2 gap-2 text-xs">
              {(["ammo", "magsize", "range", "firerate", "ARCarmorpenetr"] as const).map(
                (field) =>
                  item.infobox[field] != null && (
                    <div key={field} className="rounded bg-white/5 p-2">
                      <dt className="text-gray-400">{t(`item.stat.${field}`)}</dt>
                      <dd className="mt-1 text-gray-200">
                        {field === "ammo"
                          ? tItem(String(item.infobox[field]))
                          : String(item.infobox[field])}
                      </dd>
                    </div>
                  ),
              )}
            </dl>
          )}

          {/* Special Type Tags - filter out redundant ones */}
          {item.infobox?.special_types &&
            item.infobox.special_types.length > 0 &&
            (() => {
              const redundantTypes = ["workshop_upgrade", "expedition", "project", "quest"];
              const filteredTypes = item.infobox.special_types.filter(
                (type: string) => !redundantTypes.includes(type),
              );
              return filteredTypes.length > 0 ? (
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {filteredTypes.map((specialType: string) => (
                    <span
                      key={specialType}
                      className="px-2.5 py-1 bg-emerald-500/30 text-emerald-200 rounded-md text-xs font-semibold border border-emerald-400/50 shadow-sm"
                    >
                      {getSpecialTypeLabel(specialType)}
                    </span>
                  ))}
                </div>
              ) : null;
            })()}

          {/* Workshop Upgrades, Expedition, Quests - Side by Side */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            {/* Workshop Upgrades */}
            {item.infobox?.workshop_upgrades && item.infobox.workshop_upgrades.length > 0 && (
              <div>
                <h3 className="text-xs font-bold text-transparent bg-clip-text bg-linear-to-r from-amber-300 to-orange-300 mb-2 uppercase tracking-wider flex items-center gap-2">
                  <FontAwesomeIcon icon={faWrench} className="text-amber-400/70" />
                  {t("item.workshopUpgrades") || "Workshop Upgrades"}
                </h3>
                <div className="space-y-1">
                  {item.infobox.workshop_upgrades.map(
                    (upgrade: WorkshopUpgradeDetail, idx: number) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between px-2 py-1 bg-linear-to-r from-amber-500/20 to-orange-500/20 rounded border border-amber-400/30"
                      >
                        <div className="flex items-center gap-1">
                          <span className="text-amber-200 font-semibold capitalize text-xs">
                            {getWorkshopLabel(upgrade.workshop)}
                          </span>
                          <span className="px-1 py-0.5 bg-amber-500/30 text-amber-100 rounded text-[10px] font-bold">
                            {upgrade.level}
                          </span>
                        </div>
                        <span className="text-amber-300 font-mono text-xs">
                          ×{upgrade.quantity}
                        </span>
                      </div>
                    ),
                  )}
                </div>
              </div>
            )}

            {/* Requirements are grouped by the named personal Expedition or project. */}
            {item.infobox.projects && item.infobox.projects.length > 0 && (
              <div className="col-span-full">
                <h3 className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-cyan-300">
                  <FontAwesomeIcon icon={faRocket} /> {t("item.projects")}
                </h3>
                <p className="mb-2 text-xs leading-relaxed text-gray-400">
                  {t("item.projectAdvice")}
                </p>
                <div className="space-y-2">
                  {item.infobox.projects.map((project, index) => (
                    <a
                      key={index}
                      href={project.wiki_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between gap-3 rounded border border-cyan-400/20 bg-cyan-500/10 px-3 py-2 text-xs hover:bg-cyan-500/20"
                    >
                      <span className="text-cyan-200">
                        {project.project} · {t("item.stage")} {project.stage}
                        {project.part > 1 && (
                          <span>
                            {" "}
                            · {t("item.expeditionPart")} {project.part}
                          </span>
                        )}
                        {project.end && (
                          <span className="mt-1 block text-gray-400">
                            {t("updates.endDate")}: {project.end}
                          </span>
                        )}
                      </span>
                      <span className="shrink-0 font-mono text-cyan-300">×{project.quantity}</span>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Quests */}
            {item.infobox?.quests && item.infobox.quests.length > 0 && (
              <div>
                <h3 className="text-xs font-bold text-transparent bg-clip-text bg-linear-to-r from-rose-300 to-pink-300 mb-2 uppercase tracking-wider flex items-center gap-2">
                  <FontAwesomeIcon icon={faScroll} className="text-rose-400/70" />
                  {t("item.quests") || "Quests"}
                </h3>
                <div className="space-y-1">
                  {item.infobox.quests.map((quest: QuestDetail, idx: number) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between px-2 py-1 bg-linear-to-r from-rose-500/20 to-pink-500/20 rounded border border-rose-400/30"
                    >
                      <span className="text-rose-200 font-semibold text-xs truncate">
                        {getQuestLabel(quest.quest)}
                      </span>
                      <span className="text-rose-300 font-mono text-xs shrink-0">
                        ×{quest.quantity}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {item.verified_at && (
            <p className="mb-4 text-xs leading-relaxed text-gray-400">
              {t("updates.verified")} {item.verified_at.slice(0, 10)} UTC ·{" "}
              <a
                href={item.source_url || item.wiki_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-purple-300 underline"
              >
                {t("item.sourceRevision")}
              </a>
            </p>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2">
            <a
              href={item.wiki_url}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative flex-1 block py-3 bg-linear-to-br from-purple-500/30 to-purple-600/30 hover:from-purple-500/40 hover:to-purple-600/40 backdrop-blur-sm border border-purple-400/50 hover:border-purple-400/70 rounded-lg text-center text-purple-200 hover:text-purple-100 font-semibold text-sm transition-all duration-300 shadow-lg shadow-purple-500/20 hover:shadow-purple-500/40 hover:scale-[1.02] overflow-hidden"
            >
              <div className="absolute inset-0 bg-linear-to-r from-purple-400/0 via-purple-400/20 to-purple-400/0 -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
              <span className="relative z-10 flex items-center justify-center gap-2">
                <FontAwesomeIcon icon={faExternalLinkAlt} />
                {t("item.wiki")}
              </span>
            </a>
            <a
              href={`/?graph=${encodeURIComponent(item.name)}`}
              className="group relative flex-1 block py-3 bg-linear-to-br from-blue-500/30 to-cyan-500/30 hover:from-blue-500/40 hover:to-cyan-500/40 backdrop-blur-sm border border-blue-400/50 hover:border-blue-400/70 rounded-lg text-center text-blue-200 hover:text-blue-100 font-semibold text-sm transition-all duration-300 shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 hover:scale-[1.02] overflow-hidden"
            >
              <div className="absolute inset-0 bg-linear-to-r from-blue-400/0 via-blue-400/20 to-blue-400/0 -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
              <span className="relative z-10 flex items-center justify-center gap-2">
                <FontAwesomeIcon icon={faDiagramProject} />
                <span className="hidden md:inline">{t("item.craftingGraph")}</span>
                <span className="md:hidden">{t("item.graph")}</span>
              </span>
            </a>
            <a
              href={`/?graph=${encodeURIComponent(item.name)}&layout=table`}
              className="group relative flex-1 block py-3 bg-linear-to-br from-orange-500/30 to-amber-500/30 hover:from-orange-500/40 hover:to-amber-500/40 backdrop-blur-sm border border-orange-400/50 hover:border-orange-400/70 rounded-lg text-center text-orange-200 hover:text-orange-100 font-semibold text-sm transition-all duration-300 shadow-lg shadow-orange-500/20 hover:shadow-orange-500/40 hover:scale-[1.02] overflow-hidden"
            >
              <div className="absolute inset-0 bg-linear-to-r from-blue-400/0 via-blue-400/20 to-blue-400/0 -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
              <span className="relative z-10 flex items-center justify-center gap-2">
                <FontAwesomeIcon icon={faTableColumns} />
                <span className="hidden md:inline">{t("item.craftingTable")}</span>
                <span className="md:hidden">{t("item.table")}</span>
              </span>
            </a>
          </div>
        </div>
      </div>
    </>
  );
}
