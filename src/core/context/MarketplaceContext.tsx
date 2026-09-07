import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { format } from "date-fns";
import { usePersistentState } from "../hooks/usePersistentState";
import {
  useFirestoreSync,
  useFirestoreRecordSync,
  useFirestoreDocSync,
} from "../hooks/useFirestoreSync";
import {
  Listing,
  ProductCategory,
  ItemCondition,
  User,
  Offer,
  ChatMessage,
  Conversation,
  TransactionOrder,
  DisputeTicket,
  LocationData,
  KycStatus,
  AadhaarKycSubmission as KycSubmission,
  ListingQuestion,
  AppNotification,
} from "../../types";
import { requestFCMPermission, listenToForegroundFCM } from "../../lib/fcm";
import {
  MOCK_USERS,
  CURRENT_USER_DEFAULT,
  INITIAL_LISTINGS,
  INITIAL_OFFERS,
  INITIAL_CONVERSATIONS,
  INITIAL_MESSAGES,
  INITIAL_ORDERS,
  INITIAL_LISTING_QUESTIONS,
} from "../data/mockData";
import {
  DEFAULT_USER_LOCATION,
  reverseGeocode,
  calculateDistanceKm,
} from "../location/localLocations";
import { featureFlagService, FeatureFlagsState } from "../config/featureFlags";
import {
  auth,
  db,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  signOut,
  onAuthStateChanged,
  ConfirmationResult,
  FirebaseUser,
  handleFirestoreError,
  OperationType,
} from "../../lib/firebase";
import { Capacitor } from '@capacitor/core';
import { FirebaseAuthentication } from '@capacitor-firebase/authentication';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  onSnapshot,
  deleteDoc,
} from "firebase/firestore";

export type SortOption = "NEAREST" | "PRICE_LOW" | "PRICE_HIGH" | "NEWEST";

export type ModalType =
  | "AUTH"
  | "AUTH"
  | "KYC"
  | "ADMIN_KYC_REVIEW"
  | "CREATE_LISTING"
  | "MAKE_OFFER"
  | "CHECKOUT"
  | "DISPUTE"
  | "LOCATION_PICKER"
  | "LOCATION_PICKER_ADD"
  | "DEVTOLS_DRAWER"
  | "PROFILE"
  | "LEGAL_PRIVACY"
  | "LEGAL_TERMS"
  | "LEGAL_DELETION"
  | "LEGAL_REFUND"
  | null;

interface MarketplaceContextType {
  // Feature Flags
  flags: FeatureFlagsState;
  toggleFlag: (key: keyof FeatureFlagsState) => void;
  setAllFlags: (newFlags: Partial<FeatureFlagsState>) => void;
  resetFlags: () => void;

  // Authentication & Profile (Firebase Phone Auth Only)
  currentUser: User | null;
  isGuest: boolean;
  isAuthReady: boolean;
  firebaseAuthUser: FirebaseUser | null;
  loginWithPhone: (phone: string, name?: string) => void;
  sendFirebasePhoneOtp: (
    phoneNumber: string,
    appVerifier?: RecaptchaVerifier | null,
  ) => Promise<ConfirmationResult | null>;
  verifyFirebasePhoneOtp: (
    confirmationResult: ConfirmationResult | null,
    otpCode: string,
    profileData?: {
      name?: string;
      avatar?: string;
      localityName?: string;
      locationId?: string;
      isSignUp?: boolean;
      phoneNumber?: string;
    },
  ) => Promise<{ user: User; isNewUser: boolean }>;
  updateUserProfile: (data: Partial<User>) => Promise<void>;
  toggleSavedListing: (listingId: string) => Promise<void>;
  switchUserPersona: (user: User) => void;
  continueAsGuest: () => void;
  logout: () => Promise<void>;

  // KYC Utils
  resetKyc: () => Promise<void>;
  isUserKycVerified: boolean;
  requireKycVerified: (actionName?: string) => boolean;

  // Modals with KYC gate
  openCreateListing: () => void;
  openMakeOffer: (listing: Listing) => void;

  // Location & Discovery Radius
  userLocation: LocationData;
  setUserLocation: (loc: LocationData) => void;
  fetchLiveLocation: (options?: {
    silent?: boolean;
    highAccuracy?: boolean;
  }) => Promise<boolean>;
  isLocating: boolean;
  radiusKm: number | null; // null means 'Any Distance in Local Area'
  setRadiusKm: (radius: number | null) => void;

  // Listings & Feed Filters
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  selectedCategory: ProductCategory | "ALL";
  setSelectedCategory: (cat: ProductCategory | "ALL") => void;
  selectedCondition: ItemCondition | "ALL";
  setSelectedCondition: (cond: ItemCondition | "ALL") => void;
  sortOption: "NEAREST" | "PRICE_LOW" | "PRICE_HIGH" | "NEWEST";
  setSortOption: (
    sort: "NEAREST" | "PRICE_LOW" | "PRICE_HIGH" | "NEWEST",
  ) => void;

  listings: Listing[];
  filteredListings: Listing[];
  isFeedLoading: boolean;
  refreshFeedData: () => Promise<void>;
  addListing: (
    listing: Omit<
      Listing,
      "id" | "createdAt" | "viewsCount" | "isReserved" | "isSold" | "seller"
    >,
  ) => Listing;
  markAsSold: (listingId: string) => void;
  reserveListing: (listingId: string, buyerId: string) => void;
  deleteListing: (listingId: string) => void;

  // Offers
  offers: Offer[];
  makeOffer: (
    listingId: string,
    offeredPrice: number,
    message: string,
  ) => Offer;
  respondToOffer: (
    offerId: string,
    status: "ACCEPTED" | "REJECTED",
    counterPrice?: number,
  ) => void;

  // FCM Notifications
  notifications: AppNotification[];
  unreadNotificationCount: number;
  markNotificationAsRead: (notificationId: string) => void;
  clearAllNotifications: () => void;
  sendFcmNotification: (
    recipientUserId: string,
    title: string,
    body: string,
    data?: Record<string, any>,
  ) => Promise<void>;

  // Public Listing Q&A (Replaces private chat with public Q&A on listings)
  listingQuestions: Record<string, ListingQuestion[]>;
  isQaLoading: boolean;
  askListingQuestion: (
    listingId: string,
    questionText: string,
  ) => Promise<ListingQuestion>;
  answerListingQuestion: (
    listingId: string,
    questionId: string,
    answerText: string,
  ) => Promise<void>;
  upvoteListingQuestion: (listingId: string, questionId: string) => void;
  deleteListingQuestion: (
    listingId: string,
    questionId: string,
  ) => Promise<void>;

  // Real-time Chat
  conversations: Conversation[];
  messages: Record<string, ChatMessage[]>;
  activeConversationId: string | null;
  isChatLoading: boolean;
  refreshChatData: () => Promise<void>;
  setActiveConversationId: (id: string | null) => void;
  sendMessage: (
    conversationId: string,
    text: string,
    options?: {
      imageUrl?: string;
      isLocationShare?: boolean;
      sharedLocation?: string;
    },
  ) => void;
  startOrGetConversation: (listing: Listing, initialOffer?: Offer) => string;

  // Checkout & Escrow Ledger
  orders: TransactionOrder[];
  initiateOrder: (
    listing: Listing,
    amount: number,
    paymentMethod: "UPI" | "FASTRR_CHECKOUT" | "NET_BANKING" | "CASHFREE",
    deliveryDetails?: {
      address: string;
      hostelOrRoom?: string;
      phone: string;
      paymentId?: string;
      orderId?: string;
    },
  ) => TransactionOrder;
  releaseEscrowToSeller: (orderId: string, isAutoRelease?: boolean) => void;
  autoRelease24Hours: (orderId: string) => void;

  // Disputes
  disputes: DisputeTicket[];
  raiseDispute: (
    orderId: string,
    reason: DisputeTicket["reason"],
    description: string,
    evidenceImages: string[],
  ) => DisputeTicket;
  resolveDispute: (
    disputeId: string,
    resolution: "REFUND_BUYER" | "PAY_SELLER",
    notes: string,
  ) => void;

  // Active Modals state
  activeModal: ModalType;
  setActiveModal: (modal: ModalType) => void;
  modalPayload: any;
  setModalPayload: (payload: any) => void;

  selectedListing: Listing | null;
  setSelectedListing: (listing: Listing | null) => void;

  // Toast Notification
  toastMessage: string | null;
  showToast: (msg: string) => void;
}

const MarketplaceContext = createContext<MarketplaceContextType | undefined>(
  undefined,
);

export const MarketplaceProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  // Feature flags
  const [flags, setFlags] = useState<FeatureFlagsState>(
    featureFlagService.getFlags(),
  );

  useEffect(() => {
    return featureFlagService.subscribe((updated) => setFlags(updated));
  }, []);

  const toggleFlag = (key: keyof FeatureFlagsState) =>
    featureFlagService.toggleFlag(key);
  const setAllFlags = (newFlags: Partial<FeatureFlagsState>) =>
    featureFlagService.setAll(newFlags);
  const resetFlags = () => featureFlagService.resetToDefaults();

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((current) => (current === msg ? null : current));
    }, 4000);
  }, []);

  // Location State
  const [userLocation, setUserLocation] = useState<LocationData>(
    DEFAULT_USER_LOCATION,
  );
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [radiusKm, setRadiusKm] = useState<number | null>(5);

  // User state
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [firebaseAuthUser, setFirebaseAuthUser] = useState<FirebaseUser | null>(
    null,
  );
  const [isGuest, setIsGuest] = useState<boolean>(true);
  const [isAuthReady, setIsAuthReady] = useState<boolean>(false);

  // Sync Firebase Auth State with Firestore User Document
  useEffect(() => {
    let userUnsubscribe: () => void = () => {};
    
    const authUnsubscribe = onAuthStateChanged(auth, async (user) => {
      setFirebaseAuthUser(user);
      
      // Cleanup previous listener
      if (userUnsubscribe) {
        userUnsubscribe();
      }

      if (user) {
        try {
          const userDocRef = doc(db, "users", user.uid);
          
          // Set up a listener for the current user so live updates (like KYC) sync back!
          userUnsubscribe = onSnapshot(
            userDocRef,
            (snap) => {
              if (snap.exists()) {
                setCurrentUser(snap.data() as User);
              }
            },
            (err: any) => {
              if (err.code === "resource-exhausted")
                console.warn(
                  "User snapshot quota exceeded. Falling back to local auth state.",
                );
            },
          );
          const userSnap = await getDoc(userDocRef);
          if (userSnap.exists()) {
            const data = userSnap.data() as User;
            setCurrentUser(data);
            setIsGuest(false);
          } else {
            // Document does not exist yet; populate initial profile in Firestore
            const phoneDigits =
              user.phoneNumber?.replace(/\D/g, "").slice(-10) || "9822100293";
            const initialUser: User = {
              id: user.uid,
              name: user.displayName || "Local Resident",
              email: user.email || `${phoneDigits}@trega.in`,
              phone: user.phoneNumber || `+91 ${phoneDigits}`,
              avatar:
                user.photoURL ||
                "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80",
              collegeOrArea: userLocation.name,
              locationId: userLocation.id,
              isKycVerified: false,
              kycStatus: "UNVERIFIED",
              completedOrders: 0,
              joinedDate: new Date().toLocaleDateString("en-IN", {
                month: "short",
                year: "numeric",
              }),
            };
            try {
              const cleanInitial = JSON.parse(JSON.stringify(initialUser));
              await setDoc(userDocRef, cleanInitial);
            } catch (err) {
              console.warn("Could not persist initial user to Firestore:", err);
            }
            setCurrentUser(initialUser);
            setIsGuest(false);
          }
        } catch (error) {
          console.debug("Error fetching user document from Firestore:", error);
        }
      } else {
        setCurrentUser(null);
      }
      setIsAuthReady(true);
    });

    return () => {
      authUnsubscribe();
      if (userUnsubscribe) userUnsubscribe();
    };
  }, [userLocation.name, userLocation.id]);

  // If Auth flag is turned off, automatically grant guest browsing mode per PRD fallback
  useEffect(() => {
    if (!flags.isAuthEnabled && !currentUser && !isGuest) {
      setIsGuest(true);
    }
  }, [flags.isAuthEnabled, currentUser, isGuest]);

  // Send Firebase Phone OTP
  const sendFirebasePhoneOtp = async (
    phoneNumber: string,
    appVerifier?: RecaptchaVerifier | null,
  ): Promise<ConfirmationResult | null> => {
    const formattedPhone = phoneNumber.startsWith("+")
      ? phoneNumber
      : `+91${phoneNumber.replace(/\D/g, "")}`;
      
    // Handle Capacitor Native iOS/Android via FirebaseAuthentication plugin
    if (Capacitor.isNativePlatform()) {
      try {
        const result = await FirebaseAuthentication.signInWithPhoneNumber({
          phoneNumber: formattedPhone
        });
        showToast(`SMS OTP sent to ${formattedPhone}`);
        return {
          verificationId: result.verificationId,
          confirm: async () => null // Handled differently in verify step
        } as unknown as ConfirmationResult;
      } catch (error: any) {
        console.error("Native Firebase Phone Auth Error:", error);
        showToast(`SMS Error: ${error.message || 'Failed to send SMS.'}`);
        throw error;
      }
    }

    // Handle Web/PWA via Standard JS SDK
    if (!appVerifier) {
      throw new Error("reCAPTCHA verifier not initialized");
    }
    try {
      const confirmationResult = await signInWithPhoneNumber(
        auth,
        formattedPhone,
        appVerifier,
      );
      showToast(`SMS OTP sent to ${formattedPhone}`);
      return confirmationResult;
    } catch (error: any) {
      console.error("Firebase Phone Auth Error:", error);
      showToast("SMS Error: Failed to send SMS. Please try again.");
      throw error;
    }
  };

  // Verify Firebase Phone OTP & Register or Login Profile
  const verifyFirebasePhoneOtp = async (
    confirmationResult: ConfirmationResult | null,
    otpCode: string,
    profileData?: {
      name?: string;
      avatar?: string;
      localityName?: string;
      locationId?: string;
      isSignUp?: boolean;
      phoneNumber?: string;
    },
  ): Promise<{ user: User; isNewUser: boolean }> => {
    if (!confirmationResult) {
      throw new Error("No live confirmation session found.");
    }

    let uid = "";
    let verifiedPhone = "";

    try {
      const result = await confirmationResult.confirm(otpCode);
      const fbUser = result.user;
      uid = fbUser.uid;
      if (fbUser.phoneNumber) {
        verifiedPhone = fbUser.phoneNumber;
      } else {
        verifiedPhone = profileData?.phoneNumber || "";
      }
    } catch (err: any) {
      console.error("OTP Validation error:", err);
      showToast("Invalid OTP. Please check your SMS code.");
      throw err;
    }

    const phoneDigits = verifiedPhone.replace(/\D/g, "").slice(-10);
    const area = profileData?.localityName || userLocation.name;
    const locId = profileData?.locationId || userLocation.id;
    const displayName =
      profileData?.name ||
      (profileData?.isSignUp
        ? "Local Resident"
        : currentUser?.name || "Local Resident");
    const avatarImg =
      profileData?.avatar ||
      currentUser?.avatar ||
      "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80";

    let isNewUser = true;

    // Check existing Firestore record or create
    let finalUser: User = {
      id: uid,
      name: displayName,
      email: `${phoneDigits}@trega.in`,
      phone: verifiedPhone,
      avatar: avatarImg,
      collegeOrArea: area,
      locationId: locId,
      isKycVerified: currentUser?.isKycVerified || false,
      kycStatus: currentUser?.kycStatus || "UNVERIFIED",
      aadhaarNumberMasked: currentUser?.aadhaarNumberMasked,

      completedOrders: currentUser?.completedOrders || 0,
      joinedDate: currentUser?.joinedDate || "Today",
    };

    try {
      const userRef = doc(db, "users", uid);
      const snap = await getDoc(userRef);
      if (snap.exists()) {
        const existingData = snap.data() as User;
        if (
          existingData.name &&
          existingData.name.trim() !== "" &&
          existingData.name !== "Local Resident"
        ) {
          isNewUser = false;
        }

        // Logic fix: Don't allow signup for existing users
        if (profileData?.isSignUp === true && !isNewUser) {
          await signOut(auth);
          throw new Error("You already have an account. Please switch to Sign In.");
        }

        finalUser = {
          ...existingData,
          id: uid,
          phone: verifiedPhone,
          name: existingData.name || profileData?.name || "Local Resident",
          avatar: existingData.avatar || profileData?.avatar || avatarImg,
          collegeOrArea:
            existingData.collegeOrArea || profileData?.localityName || area,
          locationId:
            existingData.locationId || profileData?.locationId || locId,
        };
        const cleanData = JSON.parse(JSON.stringify(finalUser));
        await setDoc(userRef, cleanData, { merge: true });
      } else {
        isNewUser = true;

        // Logic fix: Don't allow signin for non-existent users
        if (profileData?.isSignUp === false) {
          await signOut(auth);
          throw new Error("Account not found. Please switch to Create Account.");
        }

        const cleanData = JSON.parse(JSON.stringify(finalUser));
        await setDoc(userRef, cleanData);
      }
    } catch (dbErr: any) {
      if (dbErr.message.includes("You already have an account") || dbErr.message.includes("Account not found")) {
        throw dbErr;
      }
      console.debug("Firestore user lookup note:", dbErr);
    }

    setCurrentUser(finalUser);
    setIsGuest(false);
    showToast(`Verified successfully (+91 ${phoneDigits})`);
    return { user: finalUser, isNewUser };
  };

  // Update user profile fields (Name, Avatar, Locality, Phone)
  const updateUserProfile = async (data: Partial<User>): Promise<void> => {
    if (!currentUser) return;
    const updated: User = {
      ...currentUser,
      ...data,
    };

    setCurrentUser(updated);

    try {
      // Strip undefined values to prevent Firestore errors
      const cleanData = JSON.parse(JSON.stringify(updated));
      const userRef = doc(db, "users", currentUser.id);
      await setDoc(userRef, cleanData, { merge: true });
    } catch (err) {
      console.debug("Failed to sync updated profile with Firestore:", err);
    }
  };

  const toggleSavedListing = async (listingId: string): Promise<void> => {
    if (!currentUser) {
      showToast("Please sign in to save items to your wishlist.");
      setActiveModal("AUTH");
      return;
    }
    const currentSaved = currentUser.savedListingIds || [];
    const isSaved = currentSaved.includes(listingId);
    let newSaved;
    if (isSaved) {
      newSaved = currentSaved.filter((id) => id !== listingId);
      showToast("Removed from wishlist");
    } else {
      newSaved = [...currentSaved, listingId];
      showToast("Added to wishlist");
    }
    await updateUserProfile({ savedListingIds: newSaved });
  };

  const loginWithPhone = (phone: string, name?: string) => {
    const formattedPhone = phone.startsWith("+91")
      ? phone
      : `+91 ${phone.replace(/\D/g, "")}`;
    const newUser: User = {
      id: `user_${Date.now()}`,
      name: name || "Local Resident",
      email: `${phone.replace(/\D/g, "").slice(-6)}@trega.in`,
      phone: formattedPhone,
      avatar:
        "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80",
      collegeOrArea: userLocation.name,
      locationId: userLocation.id,
      isKycVerified: false,
      kycStatus: "UNVERIFIED",

      completedOrders: 0,
      joinedDate: "Today",
    };
    setCurrentUser(newUser);
    setIsGuest(false);
    showToast(`Logged in successfully with Phone OTP: ${formattedPhone}`);
  };

  const switchUserPersona = (user: User) => {
    setCurrentUser(user);
    setIsGuest(false);
    showToast(
      `Switched persona to ${user.name} (${user.isKycVerified ? "Verified" : "Unverified"})`,
    );
  };

  const continueAsGuest = () => {
    setCurrentUser(null);
    setIsGuest(true);
    showToast("Entered Guest Browsing Mode");
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (e) {
      console.debug("SignOut error:", e);
    }
    setCurrentUser(null);
    setIsGuest(true);
    showToast("Logged out successfully");
  };

  // KYC Submissions state for admin review & status tracking
  const resetKyc = async () => {
    try {
      auth.currentUser?.getIdToken().then(idToken => {
        fetch("/api/kyc/reset", { 
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "Authorization": `Bearer ${idToken}`,
            "x-trega-client": "trega-web-app"
          }
        }).catch(err => console.warn(err));
      });
      // refreshKycSubmissions();
      if (currentUser) {
        setCurrentUser({
          ...currentUser,
          isKycVerified: false,
          kycStatus: "UNVERIFIED",
          kycType: undefined,
          aadhaarNumberMasked: undefined,
          kycSubmittedAt: undefined,
          kycRejectionReason: undefined,
          verifiedAt: undefined,
        });
      }
      showToast("KYC submissions reset to seed state.");
    } catch (e) {
      console.error("Failed to reset KYC:", e);
    }
  };

  const isUserKycVerified = !!(
    currentUser &&
    (currentUser.isKycVerified || currentUser.kycStatus === "APPROVED")
  );

  const requireKycVerified = (actionName = "perform this action"): boolean => {
    if (!flags.isKycEnabled) return true;
    if (!currentUser) {
      showToast(`Please sign in and verify your Aadhaar to ${actionName}.`);
      setActiveModal("AUTH");
      return false;
    }
    if (!isUserKycVerified) {
      showToast(`Aadhaar KYC Verification is required to ${actionName}.`);
      setActiveModal("KYC");
      return false;
    }
    return true;
  };

  const openCreateListing = () => {
    if (!flags.isListingEnabled) {
      showToast("Listing creation is currently paused by feature flag.");
      return;
    }
    if (flags.isKycEnabled && !isUserKycVerified) {
      if (currentUser?.kycStatus === "REJECTED") {
        showToast(
          `Cannot Post Listing: Aadhaar KYC was Rejected. ${currentUser.kycRejectionReason || "Please re-upload documents."}`,
        );
      } else if (currentUser?.kycStatus === "PENDING_REVIEW") {
        showToast(
          "⏳ Cannot Post Listing: Your Aadhaar KYC is currently under review by moderators.",
        );
      } else {
        showToast(
          "Aadhaar KYC Verification is mandatory to create product listings.",
        );
      }
      setActiveModal("CREATE_LISTING");
      return;
    }
    setActiveModal("CREATE_LISTING");
  };

  const openMakeOffer = (listing: Listing) => {
    if (!flags.isOfferEnabled) {
      showToast("Offers are currently paused by feature flag.");
      return;
    }
    if (flags.isKycEnabled && !isUserKycVerified) {
      showToast(
        "Aadhaar KYC Verification is mandatory to submit price offers.",
      );
      setActiveModal("MAKE_OFFER");
      setModalPayload(listing);
      return;
    }
    setModalPayload(listing);
    setActiveModal("MAKE_OFFER");
  };

  // Live Location State & Auto-detection
  const fetchLiveLocation = useCallback(
    async (options?: {
      silent?: boolean;
      highAccuracy?: boolean;
    }): Promise<boolean> => {
      if (!navigator.geolocation) {
        if (!options?.silent) {
          showToast("Geolocation is not supported by your browser");
        }
        return false;
      }

      setIsLocating(true);
      return new Promise((resolve) => {
        navigator.geolocation.getCurrentPosition(
          async (pos) => {
            const { latitude, longitude } = pos.coords;
            try {
              const geocoded = await reverseGeocode(latitude, longitude);

              const liveLoc: LocationData = {
                id: `live_${Math.round(latitude * 1000)}_${Math.round(longitude * 1000)}`,
                name: geocoded.name,
                area: geocoded.area,
                type: "NEIGHBORHOOD",
                lat: latitude,
                lng: longitude,
              };

              setUserLocation(liveLoc);
              setIsLocating(false);
              if (!options?.silent) {
                showToast(`Location detected: ${geocoded.name}`);
              }
              resolve(true);
            } catch (err) {
              const fallbackLoc: LocationData = {
                id: `live_${Math.round(latitude * 1000)}_${Math.round(longitude * 1000)}`,
                name: `Local Area (${latitude.toFixed(3)}°N, ${longitude.toFixed(3)}°E)`,
                area: "Local Area",
                type: "NEIGHBORHOOD",
                lat: latitude,
                lng: longitude,
              };
              setUserLocation(fallbackLoc);
              setIsLocating(false);
              if (!options?.silent) {
                showToast(`Location detected: ${fallbackLoc.name}`);
              }
              resolve(true);
            }
          },
          (err) => {
            console.warn("Geolocation failed:", err.message);
            setIsLocating(false);
            if (!options?.silent) {
              showToast(
                "Could not fetch current location. Please allow location permissions.",
              );
            }
            resolve(false);
          },
          {
            enableHighAccuracy: options?.highAccuracy ?? true,
            timeout: 8000,
            maximumAge: 30000,
          },
        );
      });
    },
    [showToast],
  );

  // Automatically auto-locate on initial app launch
  useEffect(() => {
    fetchLiveLocation({ silent: true });
  }, [fetchLiveLocation]);

  // Feed & Listings State
  const [listings, setListings, isListingsReady] = useFirestoreSync<Listing>(
    "listings",
    INITIAL_LISTINGS,
  );
  const [isFeedRefreshing, setIsFeedRefreshing] = useState<boolean>(false);
  const isFeedLoading =
    (!isListingsReady && listings.length === 0) || isFeedRefreshing;
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<
    ProductCategory | "ALL"
  >("ALL");
  const [selectedCondition, setSelectedCondition] = useState<
    ItemCondition | "ALL"
  >("ALL");
  const [sortOption, setSortOption] = useState<
    "NEAREST" | "PRICE_LOW" | "PRICE_HIGH" | "NEWEST"
  >("NEAREST");

  const refreshFeedData = useCallback(async () => {
    setIsFeedRefreshing(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
    } catch (e) {
      console.debug("Error refreshing feed data:", e);
    } finally {
      setIsFeedRefreshing(false);
    }
  }, []);

  const addListing = (
    newListingData: Omit<
      Listing,
      "id" | "createdAt" | "viewsCount" | "isReserved" | "isSold" | "seller"
    >,
  ): Listing => {
    if (!currentUser) {
      setActiveModal("AUTH");
      throw new Error("You must be logged in to create a listing");
    }
    const seller: User = currentUser;

    const newListing: Listing = {
      ...newListingData,
      id: `list_${Date.now()}`,
      createdAt: "Just now",
      viewsCount: 1,
      isReserved: false,
      isSold: false,
      seller,
    };

    setListings([newListing, ...listings]);
    showToast("Listing published successfully to Marketplace!");
    return newListing;
  };

  const reserveListing = (listingId: string, buyerId: string) => {
    setListings((prev) =>
      prev.map((item) =>
        item.id === listingId
          ? { 
              ...item, 
              isReserved: true, 
              reservedUntil: Date.now() + 12 * 60 * 60 * 1000, 
              reservedForBuyerId: buyerId 
            }
          : item
      )
    );
  };

  const markAsSold = (listingId: string) => {
    setListings((prev) =>
      prev.map((item) =>
        item.id === listingId
          ? { ...item, isSold: true, isReserved: false }
          : item,
      ),
    );
  };

  const deleteListing = (listingId: string) => {
    setListings((prev) =>
      prev.map((item) =>
        item.id === listingId ? { ...item, isDeleted: true } : item,
      ),
    );
    // We intentionally DO NOT delete offers and questions so they remain in history
  };

  // Offers State
  const [offers, setOffers] = useFirestoreSync<Offer>("offers", INITIAL_OFFERS);

  // FCM Notifications State
  const [notifications, setNotifications] = useFirestoreSync<AppNotification>(
    "notifications",
    [],
  );

  const unreadNotificationCount = currentUser
    ? notifications.filter((n) => n.recipientUserId === currentUser.id && !n.read).length
    : 0;

  const markNotificationAsRead = (notificationId: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n)),
    );
  };

  const clearAllNotifications = () => {
    if (!currentUser) {
      setNotifications([]);
      return;
    }

    // Actually delete from Firestore so they don't come back
    const userNotifications = notifications.filter(
      (n) => n.recipientUserId === currentUser.id,
    );
    userNotifications.forEach((notif) => {
      deleteDoc(doc(db, "notifications", notif.id)).catch(console.error);
    });

    setNotifications((prev) =>
      prev.filter((n) => n.recipientUserId !== currentUser.id),
    );
  };

  const sendFcmNotification = async (
    recipientUserId: string,
    title: string,
    body: string,
    data?: Record<string, any>,
  ) => {
    try {
      const notifId = `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const newNotif: AppNotification = {
        id: notifId,
        recipientUserId,
        title,
        body,
        data,
        read: false,
        createdAt: new Date().toISOString(),
      };

      setNotifications((prev) => [newNotif, ...prev]);

      const idToken = auth.currentUser ? await auth.currentUser.getIdToken() : '';
      await fetch("/api/fcm/send", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${idToken}`,
          "x-trega-client": "trega-web-app"
        },
        body: JSON.stringify({ recipientUserId, title, body, data }),
      }).catch((err) => console.warn("FCM dispatch warning:", err));
    } catch (err) {
      console.warn("FCM Error:", err);
    }
  };

  // Listen for FCM foreground push notifications
  useEffect(() => {
    let unsubscribeFCM: (() => void) | undefined;
    listenToForegroundFCM((payload) => {
      showToast(`${payload.title}: ${payload.body}`);
    }).then((unsub) => {
      if (unsub) unsubscribeFCM = unsub;
    });

    return () => {
      if (unsubscribeFCM) unsubscribeFCM();
    };
  }, []);

  // Sync FCM token when user logs in
  useEffect(() => {
    if (currentUser?.id) {
      if (
        typeof window !== "undefined" &&
        "Notification" in window &&
        Notification.permission === "granted"
      ) {
        requestFCMPermission(currentUser.id);
      }
    }
  }, [currentUser?.id]);

  const makeOffer = (
    listingId: string,
    offeredPrice: number,
    message: string,
  ): Offer => {
    if (!isUserKycVerified) {
      showToast(
        "Access Denied: Aadhaar KYC must be Verified before making price offers.",
      );
      setActiveModal("KYC");
      throw new Error("KYC verification required to make offer");
    }

    const listing = listings.find((l) => l.id === listingId);
    if (!listing) throw new Error("Listing not found");

    if (!currentUser) {
      setActiveModal("AUTH");
      throw new Error("You must be logged in to make an offer");
    }
    const buyer = currentUser;

    const newOffer: Offer = {
      id: `off_${Date.now()}`,
      listingId: listing.id,
      listingTitle: listing.title,
      listingImage: listing.images[0] || "",
      buyerId: buyer.id,
      buyerName: buyer.name || "Verified Buyer",
      buyerAvatar: buyer.avatar || "",
      sellerId: listing.seller.id,
      sellerName: listing.seller.name,
      originalPrice: listing.price,
      offeredPrice,
      status: "PENDING",
      message,
      createdAt: "Just now",
    };

    setOffers([newOffer, ...offers]);

    // Send email notification to seller
    auth.currentUser?.getIdToken().then(idToken => {
      fetch("/api/notify", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${idToken}`,
          "x-trega-client": "trega-web-app"
        },
        body: JSON.stringify({
          userId: listing.seller.id,
          type: "OFFER_RECEIVED",
          data: {
            offeredPrice,
            listingTitle: listing.title,
            message,
          },
        }),
      }).catch((err) => console.error("Failed to send offer email:", err));
    });

    const convId = startOrGetConversation(listing, newOffer);

    const offerMsg: ChatMessage = {
      id: `msg_${Date.now()}`,
      conversationId: convId,
      senderId: buyer.id,
      senderName: buyer.name || "Buyer",
      senderAvatar: buyer.avatar || "",
      text: `Offered ₹${offeredPrice}: "${message}"`,
      timestamp: "Just now",
      isOfferCard: true,
      offerDetails: {
        offerId: newOffer.id,
        amount: offeredPrice,
        status: "PENDING",
      },
    };

    setMessages((prev) => ({
      ...prev,
      [convId]: [...(prev[convId] || []), offerMsg],
    }));

    // Trigger FCM Notification to Seller
    sendFcmNotification(
      listing.seller.id,
      `New Offer Received: ₹${offeredPrice}`,
      `${buyer.name} made an offer of ₹${offeredPrice} on "${listing.title}". Tap to review and respond.`,
      {
        type: "NEW_OFFER",
        listingId: listing.id,
        offerId: newOffer.id,
        offeredPrice,
      },
    );

    showToast(
      `Offer of ₹${offeredPrice} sent! Chat and order checkout unlock once ${listing.seller.name} accepts.`,
    );
    return newOffer;
  };

  const respondToOffer = (
    offerId: string,
    status: "ACCEPTED" | "REJECTED",
    counterPrice?: number,
  ) => {
    setOffers((prev) =>
      prev.map((off) =>
        off.id === offerId
          ? {
              ...off,
              status: counterPrice ? "COUNTERED" : status,
              counterPrice,
            }
          : off,
      ),
    );

    const targetOffer = offers.find((o) => o.id === offerId);
    if (targetOffer) {
      setConversations((prev) =>
        prev.map((c) =>
          c.listingId === targetOffer.listingId || c.offerId === offerId
            ? {
                ...c,
                offerStatus: status,
                offeredPrice: targetOffer.offeredPrice,
                lastMessage:
                  status === "ACCEPTED"
                    ? `Offer of ₹${targetOffer.offeredPrice} accepted! Chat and order checkout are open.`
                    : `Offer was ${status.toLowerCase()}`,
                lastMessageTime: "Just now",
              }
            : c,
        ),
      );

      const matchingConv = conversations.find(
        (c) => c.listingId === targetOffer.listingId || c.offerId === offerId,
      );
      if (matchingConv) {
        const sysMsg: ChatMessage = {
          id: `msg_${Date.now()}`,
          conversationId: matchingConv.id,
          senderId: "system",
          senderName: "Trega System",
          senderAvatar: "",
          text:
            status === "ACCEPTED"
              ? `Offer of ₹${targetOffer.offeredPrice} was ACCEPTED by the seller! Live chat & delivery escrow order button are now unlocked.`
              : `Offer of ₹${targetOffer.offeredPrice} was ${status.toLowerCase()} by the seller.`,
          timestamp: "Just now",
          isSystem: true,
        };

        setMessages((prev) => {
          const currentMsgs = prev[matchingConv.id] || [];
          const updatedMsgs = currentMsgs.map((m) => {
            if (m.isOfferCard && m.offerDetails) {
              return {
                ...m,
                offerDetails: {
                  ...m.offerDetails,
                  status,
                },
              };
            }
            return m;
          });
          return {
            ...prev,
            [matchingConv.id]: [...updatedMsgs, sysMsg],
          };
        });
      }

      // Trigger FCM Notification to Buyer
      if (status === "ACCEPTED") {
        sendFcmNotification(
          targetOffer.buyerId,
          `Offer Accepted for ₹${targetOffer.offeredPrice}!`,
          `${targetOffer.sellerName} accepted your offer on "${targetOffer.listingTitle}". Chat and order checkout are now unlocked!`,
          {
            type: "OFFER_ACCEPTED",
            listingId: targetOffer.listingId,
            offerId: targetOffer.id,
            offeredPrice: targetOffer.offeredPrice,
            status,
          },
        );
      } else if (status === "REJECTED") {
        sendFcmNotification(
          targetOffer.buyerId,
          `Offer Update on "${targetOffer.listingTitle}"`,
          `${targetOffer.sellerName} declined your offer of ₹${targetOffer.offeredPrice}.`,
          {
            type: "OFFER_REJECTED",
            listingId: targetOffer.listingId,
            offerId: targetOffer.id,
            status,
          },
        );
      }
    }

    showToast(
      status === "ACCEPTED"
        ? `Offer of ₹${targetOffer?.offeredPrice || ""} accepted! Chat and order checkout are now unlocked.`
        : `Offer ${status.toLowerCase()}`,
    );
  };

  // Public Listing Q&A State
  const [listingQuestions, setListingQuestions] =
    useFirestoreRecordSync<ListingQuestion>(
      "questions",
      INITIAL_LISTING_QUESTIONS,
    );
  const [isQaLoading, setIsQaLoading] = useState<boolean>(false);

  const askListingQuestion = async (
    listingId: string,
    questionText: string,
  ): Promise<ListingQuestion> => {
    if (!currentUser) {
      showToast("Please sign in to ask a public question to the seller.");
      setActiveModal("AUTH");
      throw new Error("Authentication required to ask question");
    }

    const trimmed = questionText.trim();
    if (!trimmed) {
      throw new Error("Question cannot be empty");
    }

    const listing = listings.find((l) => l.id === listingId);
    if (!listing) throw new Error("Listing not found");

    const newQuestion: ListingQuestion = {
      id: `q_${Date.now()}`,
      listingId,
      listingTitle: listing.title,
      sellerId: listing.seller.id,
      askedBy: {
        id: currentUser.id,
        name: currentUser.name,
        avatar: currentUser.avatar,
        collegeOrArea: currentUser.collegeOrArea || userLocation.name,
        isKycVerified:
          currentUser.isKycVerified || currentUser.kycStatus === "APPROVED",
      },
      question: trimmed,
      createdAt: "Just now",
      answer: null,
      upvotesCount: 0,
    };

    setListingQuestions((prev) => ({
      ...prev,
      [listingId]: [newQuestion, ...(prev[listingId] || [])],
    }));

    showToast(
      "Question posted publicly on this listing! Seller can now reply.",
    );
    return newQuestion;
  };

  const answerListingQuestion = async (
    listingId: string,
    questionId: string,
    answerText: string,
  ): Promise<void> => {
    if (!currentUser) {
      showToast("Please sign in to answer questions.");
      setActiveModal("AUTH");
      throw new Error("Authentication required");
    }

    const trimmed = answerText.trim();
    if (!trimmed) throw new Error("Answer cannot be empty");

    const listing = listings.find((l) => l.id === listingId);
    const isSeller = listing ? listing.seller.id === currentUser.id : true;

    setListingQuestions((prev) => {
      const currentList = prev[listingId] || [];
      const updated = currentList.map((q) => {
        if (q.id === questionId) {
          return {
            ...q,
            answer: {
              answeredBy: {
                id: currentUser.id,
                name: currentUser.name + (isSeller ? " (Seller)" : ""),
                avatar: currentUser.avatar,
                collegeOrArea: currentUser.collegeOrArea || userLocation.name,
                isKycVerified:
                  currentUser.isKycVerified ||
                  currentUser.kycStatus === "APPROVED",
              },
              answerText: trimmed,
              answeredAt: "Just now",
            },
          };
        }
        return q;
      });
      return {
        ...prev,
        [listingId]: updated,
      };
    });

    showToast("Answer published publicly on listing for all buyers to view!");
  };

  const upvoteListingQuestion = (listingId: string, questionId: string) => {
    setListingQuestions((prev) => {
      const currentList = prev[listingId] || [];
      const updated = currentList.map((q) => {
        if (q.id === questionId) {
          return { ...q, upvotesCount: (q.upvotesCount || 0) + 1 };
        }
        return q;
      });
      return { ...prev, [listingId]: updated };
    });
    showToast("Marked question as helpful ");
  };

  const deleteListingQuestion = async (
    listingId: string,
    questionId: string,
  ) => {
    setListingQuestions((prev) => {
      const currentList = prev[listingId] || [];
      return {
        ...prev,
        [listingId]: currentList.filter((q) => q.id !== questionId),
      };
    });
    showToast("Question removed.");
  };

  // Chat State
  const [conversations, setConversations] = useFirestoreSync<Conversation>(
    "conversations",
    INITIAL_CONVERSATIONS,
  );
  const [messages, setMessages] = useFirestoreRecordSync<ChatMessage>(
    "messages",
    INITIAL_MESSAGES,
  );
  const [activeConversationId, setActiveConversationId] = useState<
    string | null
  >(null);
  const [isChatLoading, setIsChatLoading] = useState<boolean>(true);

  const refreshChatData = useCallback(async () => {
    setIsChatLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 600));
    } catch (e) {
      console.debug("Error syncing chat with Firebase:", e);
    } finally {
      setIsChatLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsChatLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  const startOrGetConversation = (
    listing: Listing,
    initialOffer?: Offer,
  ): string => {
    const existing = conversations.find(
      (c) =>
        c.listingId === listing.id &&
        (currentUser ? c.buyerId === currentUser.id : true),
    );
    if (existing) {
      if (initialOffer) {
        setConversations((prev) =>
          prev.map((c) =>
            c.id === existing.id
              ? {
                  ...c,
                  offerId: initialOffer.id,
                  offerStatus: initialOffer.status,
                  offeredPrice: initialOffer.offeredPrice,
                }
              : c,
          ),
        );
      }
      setActiveConversationId(existing.id);
      return existing.id;
    }

    const newConvId = `conv_${Date.now()}`;
    if (!currentUser) {
      setActiveModal("AUTH");
      throw new Error("You must be logged in to start a chat");
    }
    const buyer = currentUser;

    const newConv: Conversation = {
      id: newConvId,
      listingId: listing.id,
      listingTitle: listing.title,
      listingImage: listing.images[0] || "",
      listingPrice: listing.price,
      buyerId: buyer.id,
      buyerName: buyer.name || "Buyer",
      buyerAvatar: buyer.avatar || "",
      sellerId: listing.seller.id,
      sellerName: listing.seller.name,
      sellerAvatar: listing.seller.avatar,
      lastMessage: initialOffer
        ? `Offer pending: ₹${initialOffer.offeredPrice}`
        : "Conversation initiated",
      lastMessageTime: "Just now",
      unreadCount: 0,
      offerId: initialOffer?.id,
      offerStatus: initialOffer ? initialOffer.status : "PENDING",
      offeredPrice: initialOffer?.offeredPrice,
    };

    setConversations([newConv, ...conversations]);
    setMessages({
      ...messages,
      [newConvId]: [
        {
          id: `msg_${Date.now()}`,
          conversationId: newConvId,
          senderId: "system",
          senderName: "Trega Delivery & Escrow",
          senderAvatar: "",
          text: `delivery Marketplace: Chat and order checkout unlock as soon as the seller accepts your offer. No travel needed — deliveries are handled directly across Local Area.`,
          timestamp: "Just now",
          isSystem: true,
        },
      ],
    });

    setActiveConversationId(newConvId);
    return newConvId;
  };

  const sendMessage = (
    conversationId: string,
    text: string,
    options?: {
      imageUrl?: string;
      isLocationShare?: boolean;
      sharedLocation?: string;
    },
  ) => {
    if (!currentUser) {
      setActiveModal("AUTH");
      throw new Error("You must be logged in to send a message");
    }
    const sender = currentUser;

    let filteredText = text;
    filteredText = filteredText.replace(
      /(?:(?:\+|0{0,2})91(\s*[\ -]\s*)?|[0]?)?[6789]\d{9}|(\d[ -]?){10}/g,
      "[PHONE NUMBER REMOVED]",
    );
    filteredText = filteredText.replace(
      /(https?:\/\/[^\s]+)/g,
      "[LINK REMOVED]",
    );
    filteredText = filteredText.replace(
      /(ig|instagram|snapchat|snap|insta)[:\s]*@?[a-zA-Z0-9_.]+/gi,
      "[SOCIAL MEDIA REMOVED]",
    );
    filteredText = filteredText.replace(
      /@[a-zA-Z0-9_]+/g,
      "[USERNAME REMOVED]",
    );
    filteredText = filteredText.replace(
      /(meet\s*at|come\s*to|meeting\s*point|let's\s*meet)[^.]*/gi,
      "[MEETING INFO BLOCKED - USE PLATFORM DELIVERY]",
    );

    const newMsg: ChatMessage = {
      id: `msg_${Date.now()}`,
      conversationId,
      senderId: sender.id,
      senderName: sender.name || "You",
      senderAvatar: sender.avatar || "",
      text: filteredText,
      timestamp: format(new Date(), "p"),
      imageUrl: options?.imageUrl,
      isLocationShare: options?.isLocationShare,
      sharedLocation: options?.sharedLocation,
    };

    setMessages((prev) => ({
      ...prev,
      [conversationId]: [...(prev[conversationId] || []), newMsg],
    }));

    setConversations((prev) =>
      prev.map((c) =>
        c.id === conversationId
          ? {
              ...c,
              lastMessage: options?.isLocationShare
                ? `Location: ${options.sharedLocation}`
                : filteredText,
              lastMessageTime: "Just now",
            }
          : c,
      ),
    );
  };

  // Orders & Virtual Escrow Ledger
  const [orders, setOrders] = useFirestoreSync<TransactionOrder>(
    "orders",
    INITIAL_ORDERS,
  );

  // Background auto-release checker for orders past 24 hours
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      // Replaced interval with direct firestore updates
      orders.forEach((o) => {
        if (
          o.escrowStatus === "HELD_IN_ESCROW" &&
          o.disputeExpiresAtTimestamp &&
          now >= o.disputeExpiresAtTimestamp &&
          !o.isDisputeExpired
        ) {
          const nowStr = "Today, " + format(new Date(), "p");
          const updateData = {
            escrowStatus: "PAYOUT_COMPLETED",
            deliveryStatus: "DELIVERED_AND_VERIFIED",
            isDisputeExpired: true,
            payoutCompletedAt: nowStr,
            settledAt: nowStr,
            dealClosedNote:
              "24-hour window elapsed without dispute. Funds released to seller UPI. Trega is out of the deal.",
          };
          setDoc(doc(db, "orders", o.id), updateData, { merge: true })
            .then(() => {
              setOrders((prev) =>
                prev.map((p) =>
                  p.id === o.id
                    ? ({ ...p, ...updateData } as TransactionOrder)
                    : p,
                ),
              );
              showToast(
                "⏳ 24h Dispute window expired for order. Payout released to seller UPI — Trega is out of the deal.",
              );
            })
            .catch(console.error);
        }
      });
    }, 15000);
    return () => clearInterval(interval);
  }, [orders, showToast]);

  const initiateOrder = (
    listing: Listing,
    amount: number,
    paymentMethod: "UPI" | "FASTRR_CHECKOUT" | "NET_BANKING" | "CASHFREE",
    deliveryDetails?: {
      address: string;
      hostelOrRoom?: string;
      phone: string;
      paymentId?: string;
      orderId?: string;
    },
  ): TransactionOrder => {
    // Fee calculations
    const platformFee = Math.round(listing.price * 0.02);
    const deliveryFee = 100;

    const buyerTotal = Math.round(
      listing.price + deliveryFee / 2 + platformFee / 2,
    );
    const sellerPayout = Math.round(
      listing.price - deliveryFee / 2 - platformFee / 2,
    );

    if (!currentUser) {
      setActiveModal("AUTH");
      throw new Error("You must be logged in to checkout");
    }
    const buyer = currentUser;

    const now = Date.now();
    const disputeExpiresAtTimestamp = now + 24 * 60 * 60 * 1000; // 24 hours from delivery

    const newOrder: TransactionOrder = {
      id:
        deliveryDetails?.orderId ||
        `ord_trg_${Math.floor(100 + Math.random() * 900)}`,
      listingId: listing.id,
      listingTitle: listing.title,
      listingImage: listing.images[0] || "",
      buyerId: buyer.id,
      buyerName: buyer.name || "Verified Buyer",
      sellerId: listing.seller.id,
      sellerName: listing.seller.name,
      sellerUpiId:
        listing.sellerUpiId ||
        listing.seller.upiId ||
        `${listing.seller.name.toLowerCase().replace(/\s+/g, "")}@okaxis`,
      amount,
      paymentMethod,
      escrowStatus: "HELD_IN_ESCROW",
      deliveryAddress:
        deliveryDetails?.address || `${listing.locationName}, Local Area`,
      deliveryHostelOrRoom:
        deliveryDetails?.hostelOrRoom || "Apartment / Building",
      deliveryContactPhone:
        deliveryDetails?.phone || buyer.phone || "+91 98221 00293",
      deliveryStatus: "ORDER_CONFIRMED",
      createdAt: "Today, Just now",
      createdAtTimestamp: now,
      disputeExpiresAtTimestamp,
      platformFee,
      deliveryFee,
      buyerTotal,
      sellerPayout,
      isDisputeExpired: false,
      disputeDeadline: "24 Hours after delivery",
    };

    setOrders([newOrder, ...orders]);
    markAsSold(listing.id);
    showToast(
      `Payment of ₹${amount} secured in Escrow! 24-Hour Buyer Dispute Window is now active.`,
    );
    return newOrder;
  };

  const releaseEscrowToSeller = (
    orderId: string,
    isAutoRelease: boolean = false,
  ) => {
    const order = orders.find((o) => o.id === orderId);
    if (!order) return;

    const nowStr = "Today, " + format(new Date(), "p");
    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? {
              ...o,
              escrowStatus: "PAYOUT_COMPLETED",
              deliveryStatus: "DELIVERED_AND_VERIFIED",
              isDisputeExpired: true,
              payoutCompletedAt: nowStr,
              settledAt: nowStr,
              dealClosedNote: isAutoRelease
                ? "24-hour inspection window elapsed with no disputes. Payout released to seller UPI. Trega is out of the deal."
                : "Buyer verified and approved item. Payout released to seller UPI. Trega is out of the deal.",
            }
          : o,
      ),
    );

    if (isAutoRelease) {
      showToast(
        `⏳ 24h dispute window expired with no disputes! ₹${order.amount} payout released to seller's UPI. Trega is now out of the deal.`,
      );
    } else {
      showToast(
        `Buyer accepted item! ₹${order.amount} payout released to seller's UPI. Trega is out of the deal.`,
      );
    }
  };

  const autoRelease24Hours = (orderId: string) => {
    releaseEscrowToSeller(orderId, true);
  };

  // Disputes State
  const [disputes, setDisputes] = useFirestoreSync<DisputeTicket>(
    "disputes",
    [],
  );

  const raiseDispute = (
    orderId: string,
    reason: DisputeTicket["reason"],
    description: string,
    evidenceImages: string[],
  ): DisputeTicket => {
    const order = orders.find((o) => o.id === orderId);
    if (!order) throw new Error("Order not found");

    const now = Date.now();
    const isExpired =
      order.isDisputeExpired ||
      (order.disputeExpiresAtTimestamp &&
        now > order.disputeExpiresAtTimestamp);

    if (isExpired) {
      showToast(
        "24-Hour Dispute Window has expired. Funds were released to seller and Trega is out of the deal.",
      );
      throw new Error("24-Hour Dispute Window has expired");
    }

    const newTicket: DisputeTicket = {
      id: `disp_${Date.now()}`,
      orderId,
      listingTitle: order.listingTitle,
      amount: order.amount,
      raisedByUserId: currentUser?.id || "buyer_user",
      raisedByName: currentUser?.name || "Verified Buyer",
      reason,
      description,
      evidenceImages,
      status: "DISPUTE_OPEN",
      createdAt: "Just now",
    };

    setDisputes([newTicket, ...disputes]);
    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? {
              ...o,
              escrowStatus: "DISPUTE_OPEN",
              disputeTicketId: newTicket.id,
            }
          : o,
      ),
    );

    showToast(
      "Buyer Protection Dispute Ticket #DISP raised. Escrow funds frozen.",
    );
    return newTicket;
  };

  const resolveDispute = (
    disputeId: string,
    resolution: "REFUND_BUYER" | "PAY_SELLER",
    notes: string,
  ) => {
    const dispute = disputes.find((d) => d.id === disputeId);
    if (!dispute) return;

    const nowStr = "Today, " + format(new Date(), "p");

    setDisputes((prev) =>
      prev.map((d) =>
        d.id === disputeId
          ? {
              ...d,
              status:
                resolution === "REFUND_BUYER"
                  ? "REFUND_APPROVED"
                  : "SELLER_RELEASED",
              resolvedAt: "Just now",
              resolutionNote: notes,
            }
          : d,
      ),
    );

    // Send email notification to the buyer (or seller, both are involved but we'll send it to the buyer for now as requested)
    auth.currentUser?.getIdToken().then(idToken => {
      fetch("/api/notify", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${idToken}`,
          "x-trega-client": "trega-web-app"
        },
        body: JSON.stringify({
          userId: dispute.raisedByUserId,
          type: "DISPUTE_RESOLVED",
          data: {
            orderId: dispute.orderId,
            resolutionStatus: notes,
          },
        }),
      }).catch((err) => console.error("Failed to send dispute email:", err));
    });

    setOrders((prev) =>
      prev.map((o) =>
        o.id === dispute.orderId
          ? {
              ...o,
              escrowStatus:
                resolution === "REFUND_BUYER" ? "REFUNDED" : "PAYOUT_COMPLETED",
              isDisputeExpired: true,
              payoutCompletedAt: nowStr,
              settledAt: nowStr,
              dealClosedNote:
                resolution === "REFUND_BUYER"
                  ? "Dispute resolved: Buyer 100% refunded. Deal closed."
                  : "Dispute resolved: Seller paid via UPI. Deal closed — Trega is out of the deal.",
            }
          : o,
      ),
    );

    showToast(
      resolution === "REFUND_BUYER"
        ? `Dispute resolved: 100% Refund of ₹${dispute.amount} processed to buyer.`
        : `Dispute resolved: Escrow payout of ₹${dispute.amount} released to seller. Trega is out of the deal.`,
    );
  };

  // Active Modals & Payload
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [modalPayload, setModalPayload] = useState<any>(null);
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);

  // Filtered Listings logic (respecting Feature Flags)
  const filteredListings = listings
    .filter((item) => {
      // Hide sold out items from public feed; they only appear in buyer & seller history/profile
      if (item.isSold || item.isDeleted) return false;
        // Hide reserved items from the public feed during the 12-hour window
        if (item.isReserved && item.reservedUntil && item.reservedUntil > Date.now()) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = item.title.toLowerCase().includes(q);
        const matchDesc = item.description.toLowerCase().includes(q);
        const matchTag = item.tags.some((t) => t.toLowerCase().includes(q));
        const matchLoc =
          item.locationName.toLowerCase().includes(q) ||
          item.locationArea.toLowerCase().includes(q);
        if (!matchTitle && !matchDesc && !matchTag && !matchLoc) return false;
      }

      if (selectedCategory !== "ALL" && item.category !== selectedCategory) {
        return false;
      }

      if (selectedCondition !== "ALL" && item.condition !== selectedCondition) {
        return false;
      }

      if (flags.isLocationEnabled && radiusKm !== null) {
        const dist = calculateDistanceKm(
          userLocation.lat,
          userLocation.lng,
          item.lat,
          item.lng,
        );
        if (dist > radiusKm) return false;
      }

      return true;
    })
    .sort((a, b) => {
      if (flags.isLocationEnabled && sortOption === "NEAREST") {
        const distA = calculateDistanceKm(
          userLocation.lat,
          userLocation.lng,
          a.lat,
          a.lng,
        );
        const distB = calculateDistanceKm(
          userLocation.lat,
          userLocation.lng,
          b.lat,
          b.lng,
        );
        return distA - distB;
      }
      if (sortOption === "PRICE_LOW") return a.price - b.price;
      if (sortOption === "PRICE_HIGH") return b.price - a.price;

      return 0;
    });

  return (
    <MarketplaceContext.Provider
      value={{
        flags,
        toggleFlag,
        setAllFlags,
        resetFlags,
        currentUser,
        isAuthReady,
        isGuest,
        firebaseAuthUser,
        loginWithPhone,
        sendFirebasePhoneOtp,
        verifyFirebasePhoneOtp,
        updateUserProfile,
        toggleSavedListing,
        switchUserPersona,
        continueAsGuest,
        logout,
        resetKyc,
        isUserKycVerified,
        requireKycVerified,
        openCreateListing,
        openMakeOffer,
        userLocation,
        setUserLocation,
        fetchLiveLocation,
        isLocating,
        radiusKm,
        setRadiusKm,
        searchQuery,
        setSearchQuery,
        selectedCategory,
        setSelectedCategory,
        selectedCondition,
        setSelectedCondition,
        sortOption,
        setSortOption,
        listings,
        filteredListings,
        isFeedLoading,
        refreshFeedData,
        addListing,
        markAsSold,
        reserveListing,
        deleteListing,
        offers,
        makeOffer,
        respondToOffer,
        notifications: currentUser
          ? notifications
              .filter((n) => n.recipientUserId === currentUser.id)
              .sort((a, b) => {
                const timeB = isNaN(new Date(b.createdAt).getTime())
                  ? Date.now()
                  : new Date(b.createdAt).getTime();
                const timeA = isNaN(new Date(a.createdAt).getTime())
                  ? Date.now()
                  : new Date(a.createdAt).getTime();
                return timeB - timeA;
              })
          : [],
        unreadNotificationCount,
        markNotificationAsRead,
        clearAllNotifications,
        sendFcmNotification,
        listingQuestions,
        isQaLoading,
        askListingQuestion,
        answerListingQuestion,
        upvoteListingQuestion,
        deleteListingQuestion,
        conversations,
        messages,
        activeConversationId,
        setActiveConversationId,
        isChatLoading,
        refreshChatData,
        sendMessage,
        startOrGetConversation,
        orders,
        initiateOrder,
        releaseEscrowToSeller,
        autoRelease24Hours,
        disputes,
        raiseDispute,
        resolveDispute,
        activeModal,
        setActiveModal,
        modalPayload,
        setModalPayload,
        selectedListing,
        setSelectedListing,
        toastMessage,
        showToast,
      }}
    >
      {children}
    </MarketplaceContext.Provider>
  );
};

export const useMarketplace = () => {
  const ctx = useContext(MarketplaceContext);
  if (!ctx)
    throw new Error("useMarketplace must be used within MarketplaceProvider");
  return ctx;
};
