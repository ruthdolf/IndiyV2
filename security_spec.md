# Security Specification - Indiy Marketplace

## Data Invariants
1. **User Identity:** A user can only create or update their own profile.
2. **Service Integrity:** Only the seller can update or delete their service.
3. **Review Invariance:** A buyer can only review a service they don't own. (Simplified: only authenticated buyers can create reviews).
4. **Order Security:** Only the buyer, seller, or admin can view order details.
5. **Storage Security:** Users can only upload media to their own directory.

## The "Dirty Dozen" Payloads (Test Scenarios)
1. **Identity Spoofing:** Attempting to update another user's `uid` in `/users/{uid}`.
2. **Role Escalation:** A `buyer` attempting to set their `role` to `admin` during creation.
3. **Price Poisoning:** Setting a service `price` to a negative number or a string.
4. **Unauthenticated Write:** Creating a service without being logged in.
5. **Unauthorized Update:** User B attempting to update User A's service listing.
6. **Shadow Fields:** Adding a `isVerified` field to a service creation payload (not allowed for sellers).
7. **Large ID Poisoning:** Injected a 10KB string as a `serviceId`.
8. **Status Shortcut:** Moving an order from `pending` straight to `completed` without the intermediate `active` state (if enforced).
9. **Private Name Leak:** Attempting to read a user's `realName` when `isRealNamePublic` is false (as a third party).
10. **Storage Cross-Upload:** User A uploading a video to `services/UserB/videos/hack.mp4`.
11. **Avatar Cross-Upload:** User A uploading an avatar to `avatars/UserB/me.png`.
12. **Blanket Read Attack:** Querying the entire `users` collection without filtering for own ID.
13. **Review Self:** Seller reviewing their own service.

## Security Rule Pillars (Firestore)
- **Authentication:** `request.auth != null`
- **Identity:** `request.auth.uid == userId`
- **Status Locking:** Immortality of `createdAt` and `sellerId` fields.
- **Validation Blueprints:** Using `isValidUser`, `isValidService`, etc.
- **Master Gates:** Using `get()` for relational memberships (e.g. conversations).

## Storage Rule Pillars
- **Public Reads:** Listing images and videos are publicly readable.
- **Private Writes:** Only the owner (`services/{uid}/...`) can write.
- **Content Type:** Validating file types (optional but good).
- **Size Limits:** Max 10MB for images, 50MB for videos, 100MB for downloads.
