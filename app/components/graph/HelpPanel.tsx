'use client';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faQuestionCircle } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from '../../i18n';

interface HelpPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function HelpPanel({ isOpen, onClose }: HelpPanelProps) {
  const { t } = useTranslation();

  if (!isOpen) return null;

  // Edge colors with translation keys
  const EDGE_COLORS = [
    { labelKey: 'graph.craft', color: '#60a5fa' },
    { labelKey: 'graph.repair', color: '#ef4444' },
    { labelKey: 'graph.upgrade', color: '#ec4899' },
    { labelKey: 'graph.recycle', color: '#34d399' },
    { labelKey: 'graph.salvage', color: '#10b981' },
    { labelKey: 'graph.trade', color: '#fbbf24' },
  ];

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-8 md:w-[420px] bg-gradient-to-br from-black/95 via-purple-950/30 to-black/95 backdrop-blur-2xl border border-purple-500/40 z-50 rounded-2xl shadow-2xl animate-slide-up pointer-events-auto max-h-[calc(100vh-100px)] overflow-y-auto">
      {/* Decorative gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-pink-500/5 pointer-events-none rounded-2xl" />
      
      <div className="relative z-10 p-5">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-pink-300 flex items-center gap-2">
            <FontAwesomeIcon icon={faQuestionCircle} className="text-purple-400 text-sm" />
            {t('help.title')}
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center bg-black/60 hover:bg-red-500/30 backdrop-blur-sm rounded-lg transition-all duration-300 text-gray-400 hover:text-red-300 border border-purple-500/20 hover:border-red-500/50"
            aria-label={t('buttons.close')}
          >
            <span className="text-sm">✕</span>
          </button>
        </div>

        <div className="space-y-4 text-sm">
          {/* Navigation */}
          <div className="bg-black/40 rounded-lg p-3 border border-purple-500/20">
            <h3 className="text-purple-300 font-semibold mb-2 text-xs uppercase tracking-wide">{t('help.navigation')}</h3>
            <ul className="space-y-1 text-gray-300">
              <li>• <span className="text-purple-200">{t('help.clickNodes')}</span> {t('help.clickNodesToNavigate')}</li>
              <li>• <span className="text-purple-200">{t('help.scrollPinch')}</span> {t('help.scrollPinchToZoom')}</li>
              <li>• <span className="text-purple-200">{t('help.dragBackground')}</span> {t('help.dragBackgroundToPan')}</li>
            </ul>
          </div>

          {/* Edge Color */}
          <div className="bg-black/40 rounded-lg p-3 border border-purple-500/20">
            <h3 className="text-purple-300 font-semibold mb-2 text-xs uppercase tracking-wide">{t('help.edgeColor')}</h3>
            <div className="grid grid-cols-2 gap-2">
              {EDGE_COLORS.map((edge) => (
                <div key={edge.labelKey} className="flex items-center gap-2">
                  <div 
                    className="w-3 h-0.5 rounded-full"
                    style={{ backgroundColor: edge.color }}
                  />
                  <span className="text-gray-300 text-xs">{t(edge.labelKey)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Graph Structure */}
          <div className="bg-black/40 rounded-lg p-3 border border-purple-500/20">
            <h3 className="text-purple-300 font-semibold mb-2 text-xs uppercase tracking-wide">{t('help.graphStructure')}</h3>
            <ul className="space-y-1 text-gray-300">
              <li>• <span className="text-yellow-300">{t('help.centerNode')}</span>: {t('help.centerNodeDesc')}</li>
              <li>• <span className="text-blue-300">{t('help.leftNodes')}</span>: {t('help.leftNodesDesc')}</li>
              <li>• <span className="text-green-300">{t('help.rightNodes')}</span>: {t('help.rightNodesDesc')}</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
