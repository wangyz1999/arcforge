"use client";

import Link from "next/link";
import Header from "../Header";
import { useTranslation } from "../../i18n";

interface ErrorStateProps {
  itemName: string;
}

export default function ErrorState({ itemName }: ErrorStateProps) {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-[#07020b] text-gray-100 flex flex-col">
      <Header />
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">❌</div>
          <h2 className="text-2xl font-bold text-gray-300 mb-2">{t("error.itemNotFound")}</h2>
          <p className="text-gray-500 mb-4">
            &quot;{itemName}&quot; {t("error.couldNotBeFound")}
          </p>
          <Link
            href="/crafting-graph?item=Power%20Rod"
            className="px-6 py-3 bg-purple-500/20 border border-purple-500/30 rounded-lg text-purple-300 hover:bg-purple-500/30 transition-all inline-block"
          >
            {t("error.goToPowerRod")}
          </Link>
        </div>
      </div>
    </div>
  );
}
