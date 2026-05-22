# Security Specification: QueSale

## 1. Data Invariants
- **Users**: Only the owner of a user document can write to it.
- **Events**: Only authorized admins of the organizing company can create/edit an event.
- **Tickets**: Users can only see their own tickets. Tickets are immutable after purchase (except for state updates during validation).
- **Posts**: Users can only edit/delete their own posts.

## 2. The "Dirty Dozen" Payloads (Examples)
1. **Identity Spoofing**: Attempt to update `users/targetUid` as `maliciousUid`.
2. **Resource Poisoning**: Send a 1MB string as a document ID for an event.
3. **Privilege Escalation**: Attempt to set `featuredLevel: 2` on an event without paying.
4. **Ticket Duplication**: Attempt to create a ticket for another user.
5. **Unauthorized Post Deletion**: Malicious user trying to delete a staff post.
6. **State Shortcut**: Attempt to update ticket state from `active` to `used` without a valid validator code.
7. **Phantom Organizer**: Creating an event with a non-existent `organizerId`.
8. **Shadow Field Injection**: Adding `isVerified: true` to a user profile.

## 3. Test Runner Plan
We will use `firestore.rules.test.ts` to verify:
- `deny` writes if `request.auth` is null.
- `deny` updates that change `ownerId` or `uid`.
- `deny` event creation by non-organizer admins.
- `allow` event read for all.
- `allow` ticket read only for owner.

... will implement rules based on these Assertions.
