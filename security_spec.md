# Security Specification & Threat Model for Trega Pune Hyperlocal Marketplace

## 1. Data Invariants
1. **User Profiles (`/users/{userId}`)**: A user can only write to their own profile (`request.auth.uid == userId`). Roles and verified flags cannot be self-elevated.
2. **Listings (`/listings/{listingId}`)**: A listing can only be created or modified by its authenticated owner (`sellerId == request.auth.uid`). Once sold, its core state is frozen.
3. **Offers (`/offers/{offerId}`)**: Only the buyer can submit an offer proposal. Only the seller or buyer associated with the offer can update its status (`ACCEPTED`, `REJECTED`, `COUNTERED`).
4. **Conversations & Messages (`/conversations/{conversationId}/messages/{messageId}`)**: Messages can only be read or created by members of that conversation (`request.auth.uid in [conversation.buyerId, conversation.sellerId]`). Sender ID must match `request.auth.uid`.
5. **Transactions (`/transactions/{transactionId}`)**: Escrow orders can only be accessed by the buyer, seller, or system admin. Status transitions must follow strict state machine rules.
6. **Aadhaar KYC Submissions (`/kyc_submissions/{submissionId}`)**: Applicants can create and view their own submissions (`userId == request.auth.uid`). Only admins can approve or reject.

## 2. The Dirty Dozen Attack Payloads (All must return PERMISSION_DENIED)
1. **Attack 1: Identity Spoofing in User Profile**: Authenticated User A tries to overwrite `/users/user_B`.
2. **Attack 2: Self-Granting Verified Badge**: User A attempts to set `isKycVerified: true` without admin verification.
3. **Attack 3: Listing Hijacking**: User B attempts to edit or delete User A's listing.
4. **Attack 4: Ghost Fields Injection**: Creating a listing with arbitrary extra injected fields (`isAdmin: true`).
5. **Attack 5: Chat Wiretapping**: User C tries to read messages from `/conversations/conv_AB/messages`.
6. **Attack 6: Message Sender Impersonation**: User A sends a message in `conv_AB` setting `senderId: "user_B"`.
7. **Attack 7: Unauthorized Offer State Manipulation**: User C accepts an offer on User A's listing.
8. **Attack 8: Escrow Fund Release Bypass**: Buyer tries to complete seller payout without OTP handshake.
9. **Attack 9: KYC Identity Theft**: User B reads User A's unmasked Aadhaar documents.
10. **Attack 10: Oversized Payload Attack**: Injected 1MB string into listing description or chat message.
11. **Attack 11: Malicious Document ID**: Attempting path traversal or oversized special-character document IDs.
12. **Attack 12: Terminal State Tampering**: Modifying an escrow transaction that is already in `PAYOUT_COMPLETED`.
