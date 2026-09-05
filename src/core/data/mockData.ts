import { User, Listing, Offer, TransactionOrder, Conversation, ChatMessage, ListingQuestion } from '../../types';

export const CURRENT_USER_DEFAULT: User | null = null;

export const INITIAL_LISTINGS: Listing[] = [];
export const INITIAL_OFFERS: Offer[] = [];
export const INITIAL_ORDERS: TransactionOrder[] = [];
export const INITIAL_CONVERSATIONS: Conversation[] = [];
export const INITIAL_MESSAGES: Record<string, ChatMessage[]> = {};
export const INITIAL_LISTING_QUESTIONS: Record<string, ListingQuestion[]> = {};

export const MOCK_USERS: User[] = [];
