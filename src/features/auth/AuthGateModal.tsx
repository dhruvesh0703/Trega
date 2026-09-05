import React from "react";
import { useMarketplace } from "../../core/context/MarketplaceContext";
import { AuthPage } from "./AuthPage";

export const AuthGateModal: React.FC = () => {
  const { activeModal, setActiveModal, flags, continueAsGuest, currentUser } =
    useMarketplace();

  React.useEffect(() => {
    if (activeModal === "AUTH" && currentUser) {
      setActiveModal(null);
    }
  }, [activeModal, currentUser, setActiveModal]);

  if (activeModal !== "AUTH") return null;

  // Fallback when Auth feature flag is disabled
  if (!flags.isAuthEnabled) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900 ">
        <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-sm border border-stone-200 text-center">
          <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center mx-auto mb-4 font-bold shadow-sm"></div>
          <h3 className="text-xl font-bold text-stone-900 mb-1">
            Guest Browsing Active
          </h3>
          <p className="text-xs font-mono text-amber-800 bg-transparent border border-amber-300 py-1 px-2.5 rounded-md inline-block mb-3">
            FEATURE_AUTH_ENABLED: false
          </p>
          <p className="text-sm text-stone-600 mb-6 leading-relaxed">
            Authentication is currently disabled in runtime settings. You can
            freely explore the Local Area marketplace in Guest Mode.
          </p>
          <button
            onClick={() => {
              continueAsGuest();
              setActiveModal(null);
            }}
            className="w-full py-3 px-4 bg-stone-900 hover:bg-stone-800 text-white text-sm font-bold rounded-xl transition-all cursor-pointer"
          >
            Continue as Guest
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-stone-50 overflow-y-auto">
      <div className="flex flex-col w-full h-full relative p-4 pb-24 max-w-lg mx-auto justify-center">
        <AuthPage
          isModal
          onSuccess={() => setActiveModal(null)}
          onCancel={() => {
            continueAsGuest();
            setActiveModal(null);
          }}
        />
        
        {/* Security Status Indicator */}
        <div className="mt-6 flex flex-col items-center justify-center gap-2">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-full text-emerald-700 text-[11px] font-bold tracking-wide uppercase shadow-sm">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>
            SSL Secured Environment
          </div>
          <div className="flex items-center gap-3 text-[10px] text-stone-400 font-medium">
            <span className="flex items-center gap-1">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              End-to-End Encrypted
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
              MFA Active (SMS)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
