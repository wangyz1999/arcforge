import Image from 'next/image';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCog, faEye } from '@fortawesome/free-solid-svg-icons';

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  itemSize: 'tiny' | 'small' | 'medium' | 'large';
  setItemSize: (size: 'tiny' | 'small' | 'medium' | 'large') => void;
  displayPrice: boolean;
  setDisplayPrice: (value: boolean) => void;
  displayWeight: boolean;
  setDisplayWeight: (value: boolean) => void;
  showTrackIcons: boolean;
  setShowTrackIcons: (value: boolean) => void;
}

export default function SettingsPanel({
  isOpen,
  onClose,
  itemSize,
  setItemSize,
  displayPrice,
  setDisplayPrice,
  displayWeight,
  setDisplayWeight,
  showTrackIcons,
  setShowTrackIcons
}: SettingsPanelProps) {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 z-40 backdrop-blur-md"
        onClick={onClose}
      />
      
      {/* Settings Panel */}
      <div className="fixed bottom-0 left-0 w-full md:w-[400px] md:bottom-8 md:right-8 md:left-auto bg-gradient-to-br from-black/95 via-blue-950/30 to-black/95 backdrop-blur-2xl border border-blue-500/40 z-50 rounded-t-3xl md:rounded-2xl shadow-2xl animate-slide-up">
        {/* Decorative gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-purple-500/5 pointer-events-none rounded-t-3xl md:rounded-2xl" />
        
        <div className="relative z-10 p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-purple-300 flex items-center gap-3">
              <FontAwesomeIcon icon={faCog} className="text-blue-400" />
              Settings
            </h2>
            <button
              onClick={onClose}
              className="w-10 h-10 flex items-center justify-center bg-black/60 hover:bg-red-500/30 backdrop-blur-sm rounded-xl transition-all duration-300 text-gray-400 hover:text-red-300 border border-blue-500/20 hover:border-red-500/50"
            >
              <span className="text-lg">✕</span>
            </button>
          </div>

          {/* Settings Options */}
          <div className="space-y-6">
            {/* Item Size */}
            <div>
              <label className="text-sm font-bold text-blue-300 mb-3 block uppercase tracking-wider">
                Item Size
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => setItemSize('tiny')}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm font-semibold transition-all border-2 ${
                    itemSize === 'tiny'
                      ? 'bg-blue-500/40 text-blue-100 border-blue-400/60 shadow-lg shadow-blue-500/30'
                      : 'bg-black/40 text-gray-400 border-blue-500/20 hover:bg-blue-500/20 hover:text-blue-300'
                  }`}
                >
                  Tiny
                </button>
                <button
                  onClick={() => setItemSize('small')}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm font-semibold transition-all border-2 ${
                    itemSize === 'small'
                      ? 'bg-blue-500/40 text-blue-100 border-blue-400/60 shadow-lg shadow-blue-500/30'
                      : 'bg-black/40 text-gray-400 border-blue-500/20 hover:bg-blue-500/20 hover:text-blue-300'
                  }`}
                >
                  Small
                </button>
                <button
                  onClick={() => setItemSize('medium')}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm font-semibold transition-all border-2 ${
                    itemSize === 'medium'
                      ? 'bg-blue-500/40 text-blue-100 border-blue-400/60 shadow-lg shadow-blue-500/30'
                      : 'bg-black/40 text-gray-400 border-blue-500/20 hover:bg-blue-500/20 hover:text-blue-300'
                  }`}
                >
                  Medium
                </button>
                <button
                  onClick={() => setItemSize('large')}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm font-semibold transition-all border-2 ${
                    itemSize === 'large'
                      ? 'bg-blue-500/40 text-blue-100 border-blue-400/60 shadow-lg shadow-blue-500/30'
                      : 'bg-black/40 text-gray-400 border-blue-500/20 hover:bg-blue-500/20 hover:text-blue-300'
                  }`}
                >
                  Large
                </button>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-blue-500/20"></div>

            {/* Display Price */}
            <div>
              <label className="flex items-center justify-between cursor-pointer group">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 flex items-center justify-center bg-black/60 rounded-lg border border-blue-500/30 group-hover:border-blue-400/50 transition-colors">
                    <Image src="/coin.webp" alt="Coin" width={24} height={24} />
                  </div>
                  <span className="text-sm font-bold text-blue-300 uppercase tracking-wider">
                    Display Price
                  </span>
                </div>
                <div
                  className={`relative w-14 h-8 rounded-full transition-all duration-300 ${
                    displayPrice ? 'bg-blue-500/60' : 'bg-black/60'
                  } border ${
                    displayPrice ? 'border-blue-400/60' : 'border-blue-500/20'
                  }`}
                  onClick={() => setDisplayPrice(!displayPrice)}
                >
                  <div
                    className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform duration-300 shadow-lg ${
                      displayPrice ? 'translate-x-6' : 'translate-x-0'
                    }`}
                  />
                </div>
              </label>
            </div>

            {/* Display Weight */}
            <div>
              <label className="flex items-center justify-between cursor-pointer group">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 flex items-center justify-center bg-black/60 rounded-lg border border-blue-500/30 group-hover:border-blue-400/50 transition-colors">
                    <Image src="/weight.webp" alt="Weight" width={24} height={24} />
                  </div>
                  <span className="text-sm font-bold text-blue-300 uppercase tracking-wider">
                    Display Weight
                  </span>
                </div>
                <div
                  className={`relative w-14 h-8 rounded-full transition-all duration-300 ${
                    displayWeight ? 'bg-blue-500/60' : 'bg-black/60'
                  } border ${
                    displayWeight ? 'border-blue-400/60' : 'border-blue-500/20'
                  }`}
                  onClick={() => setDisplayWeight(!displayWeight)}
                >
                  <div
                    className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform duration-300 shadow-lg ${
                      displayWeight ? 'translate-x-6' : 'translate-x-0'
                    }`}
                  />
                </div>
              </label>
            </div>

            {/* Show Track Icons */}
            <div>
              <label className="flex items-center justify-between cursor-pointer group">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 flex items-center justify-center bg-black/60 rounded-lg border border-blue-500/30 group-hover:border-blue-400/50 transition-colors">
                    <FontAwesomeIcon icon={faEye} className="text-blue-300 text-lg" />
                  </div>
                  <span className="text-sm font-bold text-blue-300 uppercase tracking-wider">
                    Show Track Icons
                  </span>
                </div>
                <div
                  className={`relative w-14 h-8 rounded-full transition-all duration-300 ${
                    showTrackIcons ? 'bg-blue-500/60' : 'bg-black/60'
                  } border ${
                    showTrackIcons ? 'border-blue-400/60' : 'border-blue-500/20'
                  }`}
                  onClick={() => setShowTrackIcons(!showTrackIcons)}
                >
                  <div
                    className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform duration-300 shadow-lg ${
                      showTrackIcons ? 'translate-x-6' : 'translate-x-0'
                    }`}
                  />
                </div>
              </label>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

