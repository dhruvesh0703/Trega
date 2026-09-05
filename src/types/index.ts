
export interface UserAddress {
  id: string;
  label: string; // 'Home', 'Office', 'Other'
  addressLine1: string; // Flat, Floor, Building
  addressLine2: string; // Street, Locality
  city?: string;
  pincode?: string;
  phone: string;
  lat: number;
  lng: number;
  isDefault?: boolean;
}

export type FlagKey =
 | 'FEATURE_AUTH_ENABLED'
 | 'FEATURE_KYC_ENABLED'
 | 'FEATURE_LOCATION_ENABLED'
 | 'FEATURE_FEED_ENABLED'
 | 'FEATURE_LISTING_ENABLED'
 | 'FEATURE_OFFER_ENABLED'
 | 'FEATURE_QA_ENABLED'
 | 'FEATURE_CHECKOUT_ENABLED'
 | 'FEATURE_DISPUTE_ENABLED';

export interface FeatureFlagsState {
 isAuthEnabled: boolean;
 isKycEnabled: boolean;
 isLocationEnabled: boolean;
 isFeedEnabled: boolean;
 isListingEnabled: boolean;
 isOfferEnabled: boolean;
 isQaEnabled: boolean;
 isCheckoutEnabled: boolean;
 isDisputeEnabled: boolean;
}

export type ItemCondition = 'BRAND_NEW' | 'LIKE_NEW' | 'EXCELLENT' | 'GOOD' | 'FAIR';

export type ProductCategory =
 | 'ALL'
 | 'BOOKS_NOTES'
 | 'ELECTRONICS_TECH'
 | 'HOME_LIVING'
 | 'CYCLES_MOBILITY'
 | 'TOOLS_APPLIANCES'
 | 'SPORTS_FITNESS'
 | 'FASHION_ACCESSORIES'
 | 'MUSIC_HOBBIES';

export interface LocationData {
 id: string;
 name: string;
 type: 'NEIGHBORHOOD' | 'LOCALITY' | 'TECH_PARK';
 area: string;
 lat: number;
 lng: number;
}

export type KycStatus = 'UNVERIFIED' | 'PENDING_REVIEW' | 'INCOMPLETE' | 'APPROVED' | 'REJECTED';

export interface User {
  savedListingIds?: string[];
  savedAddresses?: UserAddress[];
 id: string;
 name: string;
 email: string;
 phone: string;
 avatar: string;
 collegeOrArea: string;
 locationId: string;
 isKycVerified: boolean;
 kycStatus?: KycStatus;
 kycType?: 'PAN' | 'AADHAAR' | 'GOVT_ID' | 'PASSPORT';
 kycProvider?: 'SETU_SANDBOX' | 'SETU' | 'MANUAL_AADHAAR' | 'DIGILOCKER';
 kycDocumentName?: string;
 panNumberMasked?: string;
 aadhaarNumberMasked?: string;
 setuRefId?: string;
 setuResponse?: any;
 rollNumberOrId?: string;
 verifiedAt?: string;
 kycSubmittedAt?: string;
 kycRejectionReason?: string;
 kycReviewNotes?: string;
 
 completedOrders: number;
 joinedDate: string;
 upiId?: string; // UPI ID for receiving payouts
  isAdmin?: boolean;
}

export interface SetuKycRecord {
 id: string;
 userId: string;
 userName: string;
 userEmail?: string;
 userPhone?: string;
 collegeOrArea?: string;
 panNumberMasked: string;
 kycType: 'PAN';
 kycProvider: 'SETU_SANDBOX';
 status: 'APPROVED' | 'REJECTED' | 'INCOMPLETE';
 setuRefId?: string;
 setuResponse?: any;
 submittedAt: string;
 reviewedAt?: string;
 reviewedBy?: string;
 rejectionReason?: string;
 reviewerNotes?: string;
 frontImageUrl?: string;
 backImageUrl?: string;
 aadhaarNumberMasked?: string;
}

export type AadhaarKycSubmission = SetuKycRecord;


export interface Listing {
  isNegotiable?: boolean;
 id: string;
 title: string;
 description: string;
 price: number;
 originalPrice?: number;
 category: ProductCategory;
 condition: ItemCondition;
 images: string[];
 videoUrl?: string; // In-app camera recorded item video
 sellerUpiId?: string; // Seller's UPI ID for receiving payments
 locationId: string;
 locationName: string;
 locationArea: string;
 lat: number;
 lng: number;
 seller: User;
 createdAt: string;
 viewsCount: number;
 isReserved?: boolean;
  reservedUntil?: number;
  reservedForBuyerId?: string;
 isSold: boolean;
  isDeleted?: boolean;
 hasWarranty: boolean;
 originalBillIncluded: boolean;
 tags: string[];
 deliveryAvailable?: boolean;
 estimatedDeliveryTime?: string;
 deliveryCoverage?: string;
}

export type OfferStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'COUNTERED';

export interface Offer {
 id: string;
 listingId: string;
 listingTitle: string;
 listingImage: string;
 buyerId: string;
 buyerName: string;
 buyerAvatar: string;
 sellerId: string;
 sellerName: string;
 originalPrice: number;
 offeredPrice: number;
 status: OfferStatus;
 counterPrice?: number;
 message: string;
 createdAt: string;
}

export interface QuestionAuthor {
 id: string;
 name: string;
 avatar: string;
 collegeOrArea: string;
 isKycVerified: boolean;
 
}

export interface ListingQuestion {
 id: string;
 listingId: string;
 listingTitle?: string;
 sellerId: string;
 askedBy: QuestionAuthor;
 question: string;
 createdAt: string;
 answer?: {
 answeredBy: QuestionAuthor;
 answerText: string;
 answeredAt: string;
 } | null;
 upvotesCount?: number;
}

export interface ChatMessage {
 id: string;
 conversationId: string;
 senderId: string;
 senderName: string;
 senderAvatar: string;
 text: string;
 timestamp: string;
 imageUrl?: string;
 isLocationShare?: boolean;
 sharedLocation?: string;
 isOfferCard?: boolean;
 offerDetails?: {
 offerId: string;
 amount: number;
 status: OfferStatus;
 };
 isSystem?: boolean;
}

export interface AppNotification {
 id: string;
 recipientUserId: string;
 title: string;
 body: string;
 data?: Record<string, any>;
 read: boolean;
 createdAt: string;
}

export interface Conversation {
 id: string;
 listingId: string;
 listingTitle: string;
 listingImage: string;
 listingPrice: number;
 buyerId: string;
 buyerName: string;
 buyerAvatar: string;
 sellerId: string;
 sellerName: string;
 sellerAvatar: string;
 lastMessage: string;
 lastMessageTime: string;
 unreadCount: number;
 offerId?: string;
 offerStatus?: OfferStatus;
 offeredPrice?: number;
}

export type EscrowStatus =
 | 'PENDING_SETTLEMENT'
 | 'HELD_IN_ESCROW'
 | 'DELIVERY_CONFIRMED'
 | 'PAYOUT_COMPLETED'
 | 'DISPUTE_OPEN'
 | 'REFUNDED'
 | 'DEAL_CLOSED';

export type DeliveryStatus =
 | 'ORDER_CONFIRMED'
 | 'PICKED_UP_FROM_SELLER'
 | 'OUT_FOR_DELIVERY'
 | 'DELIVERED_AND_VERIFIED';

export interface TransactionOrder {
 id: string;
 listingId: string;
 listingTitle: string;
 listingImage: string;
 buyerId: string;
 buyerName: string;
 sellerId: string;
 sellerName: string;
 sellerUpiId: string;
 amount: number;
  platformFee?: number;
  deliveryFee?: number;
  buyerTotal?: number;
  sellerPayout?: number;
 paymentMethod: 'UPI' | 'FASTRR_CHECKOUT' | 'NET_BANKING' | 'CASHFREE';
 escrowStatus: EscrowStatus;
 deliveryAddress?: string;
 deliveryHostelOrRoom?: string;
 deliveryContactPhone?: string;
 deliveryStatus?: DeliveryStatus;
 createdAt: string;
 createdAtTimestamp: number;
 disputeExpiresAtTimestamp: number;
 isDisputeExpired?: boolean;
 disputeDeadline: string; // 24 hours from delivery / order placement
 disputeTicketId?: string;
 deliveryConfirmedAt?: string;
 payoutCompletedAt?: string;
 settledAt?: string;
 dealClosedNote?: string;
}

export type DisputeStatus = 'DISPUTE_OPEN' | 'UNDER_REVIEW' | 'REFUND_APPROVED' | 'SELLER_RELEASED';

export interface DisputeTicket {
 id: string;
 orderId: string;
 listingTitle: string;
 amount: number;
 raisedByUserId: string;
 raisedByName: string;
 reason: 'DEFECTIVE_ITEM' | 'NOT_AS_DESCRIBED' | 'WRONG_ITEM' | 'SELLER_NO_SHOW' | 'OTHER';
 description: string;
 evidenceImages: string[];
 status: DisputeStatus;
 createdAt: string;
 resolvedAt?: string;
 resolutionNote?: string;
}
