'use client';

import { useTranslation } from '../../i18n';

export default function LoadingState() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-[#07020b] text-gray-100 flex items-center justify-center">
      <div className="text-center">
        <div className="text-2xl mb-2">{t('loading.text')}</div>
      </div>
    </div>
  );
}
