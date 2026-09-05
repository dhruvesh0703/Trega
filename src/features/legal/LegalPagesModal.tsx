import React from 'react';
import { useMarketplace } from '../../core/context/MarketplaceContext';
import { X, ShieldCheck, Scale, Trash2, ArrowLeft, RefreshCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const LegalPagesModal: React.FC = () => {
  const { activeModal, setActiveModal } = useMarketplace();

  if (activeModal !== 'LEGAL_PRIVACY' && activeModal !== 'LEGAL_TERMS' && activeModal !== 'LEGAL_DELETION' && activeModal !== 'LEGAL_REFUND') return null;

  const renderContent = () => {
    switch (activeModal) {
      case 'LEGAL_PRIVACY':
        return (
          <>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-stone-100 text-stone-900 flex items-center justify-center border border-stone-200">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-black text-stone-900 font-display">Privacy Policy</h2>
                <p className="text-xs text-stone-500 font-medium">Last updated: August 2026</p>
              </div>
            </div>

            <div className="prose prose-sm prose-stone max-w-none text-xs text-stone-700 space-y-5">
              <div>
                <h3 className="text-sm font-bold text-stone-900 mb-2">1. Data We Collect</h3>
                <p>
                  Trega collects personal information to provide our hyperlocal marketplace services. This includes:
                </p>
                <ul className="list-disc pl-5 mt-2 space-y-1">
                  <li><strong>Account Data:</strong> Phone number (for OTP login), full name, and profile pictures.</li>
                  <li><strong>KYC & Identity Data:</strong> Aadhaar numbers (masked) and Didit verification records for platform safety.</li>
                  <li><strong>Location Data:</strong> Device GPS coordinates (with your permission) to calculate proximity to listings and enable the hyperlocal radius feature.</li>
                  <li><strong>Transaction Data:</strong> Escrow orders, Razorpay/UPI details, and marketplace chat messages.</li>
                  <li><strong>Camera & Media:</strong> Photos and videos captured via the live camera tool for verifiable listings.</li>
                </ul>
              </div>

              <div>
                <h3 className="text-sm font-bold text-stone-900 mb-2">2. How We Use Your Data</h3>
                <p>
                  Your data is strictly used for platform functionality: ensuring secure escrow payments, mitigating fraud through KYC, and pairing buyers with sellers within physical proximity. We do not sell your personal data to third-party ad networks.
                </p>
              </div>

              <div>
                <h3 className="text-sm font-bold text-stone-900 mb-2">3. Third-Party Integrations</h3>
                <p>
                  We share necessary data securely with verified service providers: Google Cloud (Hosting & Storage), Razorpay (Payment Processing), and Didit (Aadhaar KYC Verification).
                </p>
              </div>
              
              <div>
                <h3 className="text-sm font-bold text-stone-900 mb-2">4. App Store & Play Store Compliance</h3>
                <p>
                  This policy adheres strictly to the privacy guidelines set forth by Apple's App Store and the Google Play Store, ensuring transparent data handling, prompt deletion request fulfillment, and explicit user consent for sensitive permissions (Location, Camera, Storage).
                </p>
              </div>
            </div>
          </>
        );
      
      
      case 'LEGAL_REFUND':
        return (
          <>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-stone-100 text-stone-900 flex items-center justify-center border border-stone-200">
                <RefreshCcw className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-black text-stone-900 font-display">Refund & Return Policy</h2>
                <p className="text-xs text-stone-500 font-medium">Trega 24-Hour Buyer Protection</p>
              </div>
            </div>

            <div className="prose prose-sm prose-stone max-w-none text-xs text-stone-700 space-y-5">
              <div>
                <h3 className="text-sm font-bold text-stone-900 mb-2">1. The 24-Hour Inspection Window</h3>
                <p>
                  Trega operates on a strict escrow-based peer-to-peer model. When you purchase an item, your money is held securely in escrow. Upon delivery, you are granted exactly <strong>24 hours</strong> to inspect and test the item.
                </p>
              </div>
              
              <div>
                <h3 className="text-sm font-bold text-stone-900 mb-2">2. How to Request a Refund</h3>
                <p>
                  If the item is defective, broken, or significantly not as described, you must open a <strong>Dispute Ticket</strong> from your My Orders tab within this 24-hour window. Opening a dispute freezes the escrow funds immediately.
                </p>
                <ul className="list-disc pl-5 mt-2 space-y-1">
                  <li>You must provide clear photo/video evidence of the defect.</li>
                  <li>Our mediation team will review the claim within 2 hours.</li>
                  <li>If the claim is validated, you will receive a <strong>100% full refund</strong> to your original payment method, and the item must be returned to the seller.</li>
                </ul>
              </div>

              <div>
                <h3 className="text-sm font-bold text-stone-900 mb-2">3. Final Sales (No Returns After 24 Hours)</h3>
                <p>
                  If the 24-hour window elapses without a dispute being raised, or if you manually approve the item in the app, the escrow funds are irrevocably released to the seller's UPI account. 
                </p>
                <div className="p-3 bg-stone-100 border border-stone-200 rounded-lg mt-2">
                  <p className="font-bold text-stone-900">Once the seller is paid, the transaction is considered final and closed.</p>
                  <p className="mt-1">Trega cannot process refunds, facilitate returns, or mediate disputes after the funds have been released.</p>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-bold text-stone-900 mb-2">4. Seller Cancellations</h3>
                <p>
                  If a seller cancels the order before dispatching the item, or fails to hand over the item to the delivery executive, the buyer is automatically refunded 100% of their payment instantly.
                </p>
              </div>
            </div>
          </>
        );

      case 'LEGAL_TERMS':
        return (
          <>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-stone-100 text-stone-900 flex items-center justify-center border border-stone-200">
                <Scale className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-black text-stone-900 font-display">Terms of Service</h2>
                <p className="text-xs text-stone-500 font-medium">Last updated: August 2026</p>
              </div>
            </div>

            <div className="prose prose-sm prose-stone max-w-none text-xs text-stone-700 space-y-5">
              <div>
                <h3 className="text-sm font-bold text-stone-900 mb-2">1. Acceptance of Terms</h3>
                <p>By accessing or using the Trega platform, you agree to be bound by these Terms. If you do not agree, you must not use our services.</p>
              </div>
              
              <div>
                <h3 className="text-sm font-bold text-stone-900 mb-2">2. The Marketplace Escrow System</h3>
                <p>
                  Trega acts solely as an escrow intermediary. We temporarily hold buyer funds securely during the 24-Hour Dispute Window. If no dispute is raised by the buyer within 24 hours of delivery, funds are irrevocably released to the seller's designated UPI ID, and Trega's role in the transaction is concluded.
                </p>
              </div>

              <div>
                <h3 className="text-sm font-bold text-stone-900 mb-2">3. User Conduct & KYC</h3>
                <p>
                  Sellers are required to complete Aadhaar-based KYC verification. Any attempt to defraud buyers, post counterfeit goods, or manipulate the escrow system will result in permanent account suspension and cooperation with local law enforcement.
                </p>
              </div>

              <div>
                <h3 className="text-sm font-bold text-stone-900 mb-2">4. Prohibited Items</h3>
                <p>Users may not list illegal, hazardous, recalled, or heavily regulated items. Trega reserves the right to remove any listing without prior notice.</p>
              </div>
            </div>
          </>
        );

      case 'LEGAL_DELETION':
        return (
          <>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-200">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-black text-stone-900 font-display">Data & Account Deletion</h2>
                <p className="text-xs text-stone-500 font-medium">Compliance with App Store & Play Store Data Guidelines</p>
              </div>
            </div>

            <div className="prose prose-sm prose-stone max-w-none text-xs text-stone-700 space-y-5">
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl">
                <h3 className="text-sm font-bold text-rose-900 mb-1">Right to Erasure</h3>
                <p className="text-rose-800">
                  You have the right to request the complete deletion of your account and all associated personal data from our active databases.
                </p>
              </div>

              <div>
                <h3 className="text-sm font-bold text-stone-900 mb-2">How to Request Deletion</h3>
                <p>To permanently delete your account, you have two options:</p>
                <ol className="list-decimal pl-5 mt-2 space-y-2 font-medium">
                  <li><strong>In-App:</strong> Navigate to <span className="px-1.5 py-0.5 bg-stone-100 rounded border border-stone-200">Profile &gt; Settings &gt; Delete Account</span>. Follow the on-screen prompts to authenticate and confirm deletion.</li>
                  <li><strong>Via Email:</strong> Send an email to <strong className="text-stone-900">dhruveshpatil03@gmail.com</strong> from your registered email address with the subject "Account Deletion Request". Include your registered phone number.</li>
                </ol>
              </div>

              <div>
                <h3 className="text-sm font-bold text-stone-900 mb-2">What Gets Deleted</h3>
                <ul className="list-disc pl-5 mt-2 space-y-1">
                  <li>Your user profile, name, and profile pictures.</li>
                  <li>Your phone number and authentication records.</li>
                  <li>Your Aadhaar KYC records (completely purged from Didit ).</li>
                  <li>All active marketplace listings created by you.</li>
                </ul>
              </div>

              <div>
                <h3 className="text-sm font-bold text-stone-900 mb-2">Data Retention Exceptions</h3>
                <p>
                  For financial compliance and fraud prevention, we are legally required to retain transaction histories (escrow records, UPI settlement IDs) and past dispute tickets for a period of up to 5 years. These records are anonymized where possible.
                </p>
              </div>
            </div>
          </>
        );
      
      default:
        return null;
    }
  };

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }} 
        className="fixed inset-0 z-50 flex flex-col bg-stone-50 overflow-y-auto"
      >
        <div className="flex flex-col w-full h-full relative p-4 sm:p-6 pb-24 max-w-2xl mx-auto bg-white shadow-xl min-h-screen">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-stone-100">
            <button 
              onClick={() => setActiveModal(null)}
              className="p-2 hover:bg-stone-100 rounded-full cursor-pointer text-stone-600 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <span className="text-sm font-bold text-stone-400 uppercase tracking-wider">Legal Center</span>
          </div>

          <div className="flex-1">
            {renderContent()}
          </div>
          
          <div className="mt-8 pt-6 border-t border-stone-100 flex flex-col sm:flex-row items-center justify-between text-[11px] text-stone-500 gap-4 text-center sm:text-left">
            <span>© 2026 TREGA MARKETPLACE (DHRUVESH SHESHRAO PATIL). All rights reserved.</span>
            <div className="flex flex-col sm:text-right">
              <span className="font-semibold text-stone-700">dhruveshpatil03@gmail.com</span>
              <span className="font-semibold text-stone-700">+91 9130851374</span>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
