"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSearch } from "@fortawesome/free-solid-svg-icons";
import { Item } from "../../types/item";
import ItemCard from "./ItemCard";
import { useTranslation } from "../../i18n";

interface ItemsGridProps {
  items: Item[];
  itemSize: "tiny" | "small" | "medium" | "large";
  displayPrice: boolean;
  displayWeight: boolean;
  showTrackIcons: boolean;
  onItemClick: (item: Item) => void;
  onItemTracked: (name: string) => void;
  isTrackedFunc: (name: string) => boolean;
  openCraftingGraphOnClick: boolean;
  onOpenCraftingGraph?: (itemName: string) => void;
  lightweightMode?: boolean;
}

export default function ItemsGrid({
  items,
  itemSize,
  displayPrice,
  displayWeight,
  showTrackIcons,
  onItemClick,
  onItemTracked,
  isTrackedFunc,
  openCraftingGraphOnClick,
  onOpenCraftingGraph,
  lightweightMode = false,
}: ItemsGridProps) {
  const { t } = useTranslation();

  return (
    <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 relative z-10">
      <div className="max-w-[1600px] mx-auto">
        <div
          className={`grid gap-3 sm:gap-4 lg:gap-6 ${
            itemSize === "tiny"
              ? "grid-cols-5 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 xl:grid-cols-10 2xl:grid-cols-10"
              : itemSize === "small"
                ? "grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-8 2xl:grid-cols-8"
                : itemSize === "medium"
                  ? "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6"
                  : "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-4"
          }`}
        >
          {items.map((item, index) => {
            const handleClick = () => {
              if (openCraftingGraphOnClick && onOpenCraftingGraph) {
                onOpenCraftingGraph(item.name);
              } else {
                onItemClick(item);
              }
            };

            return (
              <ItemCard
                key={`${item.name}-${index}`}
                item={item}
                displayPrice={displayPrice}
                displayWeight={displayWeight}
                showTrackIcon={showTrackIcons}
                lightweightMode={lightweightMode}
                onClick={handleClick}
                onTracked={() => onItemTracked(item.name)}
                isTrackedFunc={isTrackedFunc}
              />
            );
          })}
        </div>

        {/* No Results */}
        {items.length === 0 && (
          <div className="relative text-center py-32">
            <div className="absolute inset-0 flex items-center justify-center opacity-5">
              <FontAwesomeIcon icon={faSearch} className="text-[20rem] text-purple-500" />
            </div>
            <div className="relative z-10">
              <div className="text-8xl mb-6 animate-pulse">🔍</div>
              <h3 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-gray-300 via-purple-300 to-gray-300 mb-3">
                {t("grid.noItemsFound")}
              </h3>
              <p className="text-gray-400 text-lg">{t("grid.tryAdjusting")}</p>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
