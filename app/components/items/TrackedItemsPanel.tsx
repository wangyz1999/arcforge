import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Item } from "../../types/item";
import { faEye } from "@fortawesome/free-solid-svg-icons";
import Image from "next/image";

interface TrackedItemsPanelProps {
  items: Item[];
  trackedItems: Set<string>;
  isOpen: boolean;
  itemSize: "tiny" | "small" | "medium" | "large";
  onClose: () => void;
  onItemClick: (item: Item) => void;
  onItemTracked: (name: string) => void;
  isTrackedFunc: (name: string) => boolean;
}

const rarityColors: { [key: string]: string } = {
  Common: "#717471",
  Uncommon: "#41EB6A",
  Rare: "#1ECBFC",
  Epic: "#d8299b",
  Legendary: "#fbc700",
};

const rarityGradients: { [key: string]: string } = {
  Common:
    "linear-gradient(to right, rgb(153 159 165 / 25%) 0%, rgb(5 13 36) 100%)",
  Uncommon:
    "linear-gradient(to right, rgb(86 203 134 / 25%) 0%, rgb(5 13 36) 100%)",
  Rare: "linear-gradient(to right, rgb(30 150 252 / 30%) 0%, rgb(5 13 36) 100%)",
  Epic: "linear-gradient(to right, rgb(216 41 155 / 25%) 0%, rgb(5 13 36) 100%)",
  Legendary:
    "linear-gradient(to right, rgb(251 199 0 / 25%) 0%, rgb(5 13 36) 100%)",
};

export default function TrackedItemsPanel({
  items,
  trackedItems,
  isOpen,
  itemSize,
  onClose,
  onItemClick,
  onItemTracked,
  isTrackedFunc,
}: TrackedItemsPanelProps) {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 z-40 backdrop-blur-md"
        onClick={onClose}
      />
      {/* Panel */}
      <div className="fixed bottom-0 left-0 w-full md:w-[70vw] h-[70vh] md:bottom-8 md:right-8 md:left-auto bg-gradient-to-br from-black/95 via-blue-950/30 to-black/95 backdrop-blur-2xl border border-blue-500/40 z-50 rounded-t-3xl md:rounded-2xl shadow-2xl animate-slide-up">
        {/* Gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-purple-500/5 pointer-events-none rounded-t-3xl md:rounded2-xl" />

        <div className="relative z-10 p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-purple-300 flex items-center gap-3">
              Tracked Items
            </h2>
            <h3 className="text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-purple-300 flex items-center gap-3">
              Click an item to navigate to details
            </h3>
            <div className="flex">
              <button
                onClick={() => {
                  // snapshot tracked names then toggle each off
                  const toClear = Array.from(trackedItems);
                  toClear.forEach((name) => onItemTracked(name));
                  // remove storage key (safer than serializing a Set)
                  try {
                    localStorage.removeItem("tracked_items");
                  } catch {}
                }}
                className="flex items-center justify-center px-4 py-2 rounded-lg bg-red-500/30 text-red-200 font-semibold hover:bg-red-500/50 hover:text-white transition-all mr-4"
                title="Clear all tracked items">
                Clear All
              </button>
              <button
                onClick={onClose}
                className="w-10 h-10 flex items-center justify-center bg-black/60 hover:bg-red-500/30 backdrop-blur-sm rounded-xl transition-all duration-300 text-gray-400 hover:text-red-300 border border-blue-500/20 hover:border-red-500/50">
                <span className="text-lg">✕</span>
              </button>
            </div>
          </div>

          {/* Tracked Items */}
          <div
            className={`grid gap-3 sm:gap-4 lg:gap-6 ${
              itemSize === "small"
                ? "grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-7 xl:grid-cols-8 2xl:grid-cols-10"
                : itemSize === "medium"
                ? "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6"
                : "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-4"
            }`}
            style={{
              maxHeight: "55vh",
              overflowY: "auto",
              paddingRight: "0.5rem",
            }}>
            {items
              .filter((item) => isTrackedFunc(item.name))
              .map((item, index) => {
                const rarity = item.infobox?.rarity || "Common";
                const borderColor = rarityColors[rarity] || "#717471";
                const gradient =
                  rarityGradients[rarity] || rarityGradients.Common;
                return (
                  <div
                    key={`${item.name}-${index}`}
                    onClick={() => {
                      onItemClick(item);
                      onClose();
                    }}
                    className="group relative bg-gradient-to-br from-black/60 via-black/40 to-black/60 backdrop-blur-sm rounded-2xl overflow-hidden transition-all duration-300 cursor-pointer"
                    style={{
                      borderWidth: "2px",
                      borderStyle: "solid",
                      borderColor: borderColor,
                      boxShadow: `0 4px 20px ${borderColor}30, 0 0 40px ${borderColor}10, inset 0 1px 0 rgba(255,255,255,0.1)`,
                    }}>
                    {/* Item Tracking toggle */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onItemTracked(item.name);
                      }}
                      title={isTrackedFunc(item.name) ? "Untrack" : "Track"}
                      className={`absolute top-2 left-2 z-20 w-8 h-8 rounded-md flex items-center justify-center text-sm ${
                        isTrackedFunc(item.name)
                          ? "bg-yellow-400 text-black"
                          : "bg-black/40 text-gray-300"
                      }`}
                      style={{cursor: "pointer"}}
                    >
                      <FontAwesomeIcon
                        icon={faEye}
                        className="text-white text-xl relative z-10 drop-shadow-lg"
                      />
                    </button>
                    {/* Animated border glow on hover */}
                    <div
                      className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-2xl"
                      style={{
                        boxShadow: `0 0 30px ${borderColor}60, inset 0 0 20px ${borderColor}20`,
                      }}
                    />
                    {/* Image Section */}
                    <div
                      className="aspect-square flex items-center justify-center p-4 relative overflow-hidden"
                      style={{ background: gradient }}>
                      {item.image_urls?.thumb ? (
                        <Image
                          src={item.image_urls.thumb}
                          alt={item.name}
                          fill
                          sizes="(max-width: 768px) 100vw, 33vw"
                          className="w-full h-full object-contain relative z-10 group-hover:scale-110 group-hover:rotate-2 transition-all duration-300 drop-shadow-2xl"
                          onError={(e) => {
                            if (e && e.currentTarget) {
                              e.currentTarget.style.display = "none";
                            }
                          }}
                          style={{ objectFit: "contain" }}
                        />
                      ) : (
                        <div className="text-2xl text-gray-700/50">?</div>
                      )}
                    </div>
                    {/* Name Section */}
                    <div
                      className="p-2.5 bg-gradient-to-br from-black/80 to-black/60 backdrop-blur-sm border-t"
                      style={{ borderColor: `${borderColor}20` }}>
                      <h3
                        className="font-semibold text-xs group-hover:brightness-125 transition-all line-clamp-2 text-center leading-tight drop-shadow-lg"
                        style={{
                          color: borderColor,
                          textShadow: `0 2px 8px ${borderColor}40`,
                        }}>
                        {item.name}
                      </h3>
                    </div>
                    <div
                      className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none rounded-2xl"
                      style={{
                        background: `radial-gradient(circle at center, ${borderColor}20 0%, transparent 70%)`,
                      }}
                    />
                  </div>
                );
              })}
            {Array.from(trackedItems).length === 0 && (
              <div className="text-center text-gray-400 py-16 text-lg">
                No tracked items yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
