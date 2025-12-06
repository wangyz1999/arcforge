"use client";

import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faExclamationTriangle, faTimes, faEyeSlash } from "@fortawesome/free-solid-svg-icons";
import { useTranslation } from "../i18n";

export default function TranslationWarningToast() {
  const {
    t,
    showTranslationWarning,
    dismissTranslationWarning,
    dismissTranslationWarningPermanently,
  } = useTranslation();
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (!showTranslationWarning) {
      return;
    }

    // Small delay for animation
    const timer = setTimeout(() => {
      setIsAnimating(true);
    }, 50);

    return () => clearTimeout(timer);
  }, [showTranslationWarning]);

  const handleDismiss = () => {
    setIsAnimating(false);
    // Wait for animation to complete before hiding
    setTimeout(() => {
      dismissTranslationWarning();
    }, 300);
  };

  const handleDontShowAgain = () => {
    setIsAnimating(false);
    // Wait for animation to complete before hiding
    setTimeout(() => {
      dismissTranslationWarningPermanently();
    }, 300);
  };

  if (!showTranslationWarning) return null;

  return (
    <div
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 max-w-lg w-[calc(100%-3rem)] transition-all duration-300 ${
        isAnimating ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      }`}
    >
      <div className="bg-gradient-to-r from-amber-950/95 to-orange-950/95 backdrop-blur-xl border border-amber-500/40 rounded-xl shadow-2xl shadow-amber-500/20 p-4">
        <div className="flex items-start gap-3">
          {/* Warning Icon */}
          <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center bg-amber-500/20 rounded-lg border border-amber-500/30">
            <FontAwesomeIcon icon={faExclamationTriangle} className="text-amber-400 text-lg" />
          </div>

          {/* Message */}
          <div className="flex-1 min-w-0">
            <p className="text-amber-200 text-sm leading-relaxed">
              {t("toast.translationWarning")}{" "}
              <a
                href="https://github.com/wangyz1999/arcforge/tree/main/app/i18n/translations"
                target="_blank"
                rel="noopener noreferrer"
                className="underline text-amber-100 hover:text-amber-50"
              >
                GitHub translations folder
              </a>
            </p>

            {/* Don't show again button */}
            <button
              onClick={handleDontShowAgain}
              className="mt-2 flex items-center gap-1.5 text-xs text-amber-400/70 hover:text-amber-300 transition-colors"
            >
              <FontAwesomeIcon icon={faEyeSlash} className="text-[10px]" />
              {t("toast.dontShowAgain")}
            </button>
          </div>

          {/* Close Button */}
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 w-8 h-8 flex items-center justify-center text-amber-400/70 hover:text-amber-300 hover:bg-amber-500/20 rounded-lg transition-all duration-200"
            aria-label={t("buttons.close")}
          >
            <FontAwesomeIcon icon={faTimes} className="text-sm" />
          </button>
        </div>
      </div>
    </div>
  );
}
