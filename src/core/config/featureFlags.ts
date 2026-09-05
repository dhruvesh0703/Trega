import { FeatureFlagsState, FlagKey } from '../../types';

export type { FeatureFlagsState, FlagKey };

const STORAGE_KEY = 'trega_feature_flags_v3';

export const DEFAULT_FEATURE_FLAGS: FeatureFlagsState = {
 isAuthEnabled: true,
 isKycEnabled: true,
 isLocationEnabled: true,
 isFeedEnabled: true,
 isListingEnabled: true,
 isOfferEnabled: true,
 isQaEnabled: true,
 isCheckoutEnabled: true,
 isDisputeEnabled: true,
};

export const FEATURE_METADATA: Record<
 keyof FeatureFlagsState,
 {
 key: FlagKey;
 label: string;
 description: string;
 fallbackDescription: string;
 category: 'Core' | 'Discovery' | 'Engagement' | 'Monetization & Trust';
 }
> = {
 isAuthEnabled: {
 key: 'FEATURE_AUTH_ENABLED',
 label: 'Authentication & Google Login',
 description: 'Dual authentication via Firebase Auth (Phone OTP & Google OAuth)',
 fallbackDescription: 'Bypasses auth gate straight into Guest Browsing Mode',
 category: 'Core',
 },
 isKycEnabled: {
 key: 'FEATURE_KYC_ENABLED',
 label: 'KYC & Trust Verification',
 description: 'Electronic ID verification (Student ID / Aadhaar) for verified badges',
 fallbackDescription: 'Hides KYC submission & checkmarks; permits unverified trades',
 category: 'Monetization & Trust',
 },
 isLocationEnabled: {
 key: 'FEATURE_LOCATION_ENABLED',
 label: 'Hyperlocal Location Engine',
 description: 'Geofencing and radius filtering for local university zones & neighborhoods',
 fallbackDescription: 'Disables GPS distance; shows listings in global chronological order',
 category: 'Discovery',
 },
 isFeedEnabled: {
 key: 'FEATURE_FEED_ENABLED',
 label: 'Marketplace Feed',
 description: 'Product grid discovery, search queries, category filters & real-time sync',
 fallbackDescription: 'Displays clean localized system maintenance / pause screen',
 category: 'Discovery',
 },
 isListingEnabled: {
 key: 'FEATURE_LISTING_ENABLED',
 label: 'Listing Creation',
 description: 'Multi-image capture, client compression, and metadata posting',
 fallbackDescription: 'Hides floating "+" create action globally across all screens',
 category: 'Discovery',
 },
 isOfferEnabled: {
 key: 'FEATURE_OFFER_ENABLED',
 label: 'Make an Offer Negotiation',
 description: 'Interactive price negotiation bottom sheet for buyer-seller counter offers',
 fallbackDescription: 'Hides Make Offer button; enforces fixed-price Buy Now checkout',
 category: 'Engagement',
 },
 isQaEnabled: {
 key: 'FEATURE_QA_ENABLED',
 label: 'Public Questions & Answers',
 description: 'Public community Q&A on seller listings with verified replies and FAQs',
 fallbackDescription: 'Hides listing Q&A thread; keeps seller specs and descriptions only',
 category: 'Engagement',
 },
 isCheckoutEnabled: {
 key: 'FEATURE_CHECKOUT_ENABLED',
 label: 'Virtual Ledger & Checkout',
 description: 'Razorpay & UPI Escrow with Handshake OTP delivery settlement',
 fallbackDescription: 'Disables checkout triggers with Orders Temporarily Paused banner',
 category: 'Monetization & Trust',
 },
 isDisputeEnabled: {
 key: 'FEATURE_DISPUTE_ENABLED',
 label: 'Dispute Management',
 description: '24-hour buyer protection window, status flagging (DISPUTE_OPEN) & resolution',
 fallbackDescription: 'Hides dispute action links; routes issues to standard email support',
 category: 'Monetization & Trust',
 },
};

type Listener = (flags: FeatureFlagsState) => void;

class FeatureFlagService {
 private static instance: FeatureFlagService;
 private flags: FeatureFlagsState;
 private listeners: Set<Listener> = new Set();

 private constructor() {
 this.flags = this.loadFlags();
 }

 public static getInstance(): FeatureFlagService {
 if (!FeatureFlagService.instance) {
 FeatureFlagService.instance = new FeatureFlagService();
 }
 return FeatureFlagService.instance;
 }

 private loadFlags(): FeatureFlagsState {
 try {
 const stored = localStorage.getItem(STORAGE_KEY);
 if (stored) {
 return { ...DEFAULT_FEATURE_FLAGS, ...JSON.parse(stored) };
 }
 } catch {
 // ignore
 }
 return { ...DEFAULT_FEATURE_FLAGS };
 }

 private saveFlags(): void {
 try {
 localStorage.setItem(STORAGE_KEY, JSON.stringify(this.flags));
 } catch {
 // ignore
 }
 this.notify();
 }

 public getFlags(): FeatureFlagsState {
 return { ...this.flags };
 }

 public isEnabled(flagName: keyof FeatureFlagsState): boolean {
 return !!this.flags[flagName];
 }

 public setFlag(flagName: keyof FeatureFlagsState, value: boolean): void {
 this.flags[flagName] = value;
 this.saveFlags();
 }

 public toggleFlag(flagName: keyof FeatureFlagsState): void {
 this.flags[flagName] = !this.flags[flagName];
 this.saveFlags();
 }

 public setAll(flags: Partial<FeatureFlagsState>): void {
 this.flags = { ...this.flags, ...flags };
 this.saveFlags();
 }

 public resetToDefaults(): void {
 this.flags = { ...DEFAULT_FEATURE_FLAGS };
 this.saveFlags();
 }

 public subscribe(listener: Listener): () => void {
 this.listeners.add(listener);
 listener(this.getFlags());
 return () => {
 this.listeners.delete(listener);
 };
 }

 private notify(): void {
 const current = this.getFlags();
 this.listeners.forEach((listener) => listener(current));
 }
}

export const featureFlagService = FeatureFlagService.getInstance();
