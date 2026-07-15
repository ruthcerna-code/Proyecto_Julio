# Security Specification - Firestore Security Rules

## 1. Data Invariants
- **Identity Isolation**: A user can only read, write, or update their own user profile document under `/users/{userId}` and their logs under `/users/{userId}/logs/{date}`. No cross-user access is permitted.
- **Verification Requirement**: All writes must be authenticated and, if possible, the user must be verified (`request.auth.token.email_verified == true`).
- **Profile Integrity**: A user cannot modify or spoof their email or other critical fields, and must supply valid types and bounds (e.g. valid age, cycle Length).
- **Daily Log Bounds**:
  - `sleepQuality`, `fatigue`, `pain`, `stress`, `mood` must be integers between 1 and 5.
  - Text fields (`sleepDetails`, `additionalNotes`, `behavior`) must not exceed reasonable lengths (e.g. 5000 characters) to prevent denial-of-wallet payload attacks.
  - `createdAt`/`updatedAt` parameters should be bound to `request.time` if they are defined (or we just secure them at the field level).

## 2. The "Dirty Dozen" Payloads
These payloads attempt to bypass identity or integrity rules and must be rejected:

1. **Spoofed User Creation (Invalid ID)**: Creating `/users/attackerId` with user credentials of `victimId`.
2. **Obscene/Excessive Profile Length**: Saving a name of 100,000 characters.
3. **Invalid Age**: Setting `age` as a negative integer or text.
4. **Invalid Cycle Length**: Setting `cycleLength` as 500 days.
5. **Cross-User Log Access**: User `A` trying to read `B`'s daily logs.
6. **Cross-User Log Insertion**: User `A` trying to write a daily log into `/users/B/logs/2026-07-14`.
7. **Invalid Log Score Range**: Saving `mood` as `10` or `-1` or a string `“happy”`.
8. **Invalid Log Date Pattern**: Saving a log with ID `invalid-date-chars!` instead of a proper date matching `^[0-9]{4}-[0-9]{2}-[0-9]{2}$`.
9. **Log Ghost Field Attack (Shadow Update)**: Attempting to inject extra fields like `isVerifiedAdmin: true` into `DailyLog`.
10. **Unauthenticated Read**: Unauthenticated request trying to read `/users/someUser`.
11. **Spoofed Email Claim**: Trying to access profiles of a verified user with an unverified email token.
12. **Tampering with Immortals**: Trying to alter the `date` of an existing DailyLog document on update.

## 3. The Test Runner (`firestore.rules.test.ts`)
Below is the TypeScript representation of the tests for these rules. Note that in this environment, we write rules directly and verify them with linting and compilation.

```typescript
import { assertSucceeds, assertFails, initializeTestEnvironment } from '@firebase/rules-unit-testing';

// Verification tests would follow this structure to run against the emulator/validator.
```
