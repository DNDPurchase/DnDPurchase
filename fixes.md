# DND Purchase — Codebase Audit & Fixes

Full read-through audit of the codebase (data layer, API routes, auth/session, dashboard pages,
notifications/misc). Each item lists the concrete location, why it matters, and the exact fix.
Nothing in this document has been applied to the code — it is a punch list only.

Legend: 🔴 Critical  🟠 High  🟡 Medium  🟢 Low

---

## 1. Security / Access Control

### 🔴 API routes have no authentication at all
**Where:** every route under `app/api/` (`inquiries`, `inquiries/[id]`, `offers`, `offers/[id]`, `user`,
`user/connect-google`, `analytics`).
**Problem:** every route trusts whatever `buyerId` / `sellerId` / `userId` / `offerId` is sent in the
request body or URL. There is no session/token check anywhere, so anyone who can see an ID (they're
short sequential strings like `INQ-0034`, easy to guess or enumerate) can act as that user.
**Concrete exploits confirmed in code:**
- `app/api/inquiries/[id]/route.ts` — close/delete/start-bidding an inquiry that isn't yours.
- `app/api/offers/route.ts` (PATCH `accept`/`disqualify`) and `app/api/offers/[id]/route.ts` (PUT/DELETE)
  — accept, disqualify, edit, or delete any offer by id.
- `app/api/user/route.ts` GET/PUT — read or edit any user's profile (name/email/phone/company) by id.
- `app/api/user/connect-google/route.ts` — link a Google account to any user id.
- `app/api/auth/google-login/route.ts` — logs a session in for any email with **no password/token
  check at all** (full account takeover if you know someone's email).
- `app/api/analytics/route.ts` — pull any user's private sales/business analytics by id + role.
**Fix:** Add a real auth layer — issue a signed session token (Firebase ID token via
`getAuth().verifyIdToken()`, or a custom JWT) on login/register, require it as a Bearer header on every
API route, and derive `userId` from the verified token server-side instead of trusting the request body.
Add ownership checks (`inquiry.buyerId === session.userId`, `offer.sellerId === session.userId`, etc.)
before any mutation.

### 🔴 Passwords stored in plaintext in Firestore
**Where:** `lib/store.ts:375` (`buyers` doc), `lib/store.ts:426` (`sellers` doc) — `password:
data.password` written straight to the document, duplicating the real Firebase Auth credential.
**Problem:** anyone who can read a user document (and today, anyone can via `getUserById` with no
ownership check) gets the user's plaintext password.
**Fix:** stop storing `password` in Firestore entirely. Firebase Auth already owns the real credential.
If a "password" field is needed for the server-side `signInWithEmailAndPassword` calls seen in
`app/api/inquiries/route.ts` and `app/api/offers/route.ts`, switch those routes to use a Firebase Admin
SDK service account instead of re-authenticating as the user with a stored password.

### 🟠 Password reset can desync from the real login password
**Where:** `lib/store.ts` `updateUserPasswordByEmail` (~line 1584-1609), used from
`app/auth/reset-password/page.tsx`.
**Problem:** it updates only the plaintext Firestore copy; the real Firebase Auth password is changed
separately via `confirmPasswordReset`. If the Firestore write fails after the Auth change succeeds, the
user sees "reset failed" even though their real login password did change — confusing retry loop.
**Fix:** remove the Firestore password field per the fix above; there is nothing left to desync once
Firebase Auth is the single source of truth.

### 🟠 Hardcoded email credential fallback
**Where:** `lib/email.ts:7` — `const SMTP_PASS = process.env.SMTP_PASS || "gukl slbv piec fiao"`.
**Problem:** a real Gmail app password is committed to source control as a default.
**Fix:** remove the fallback string entirely; throw a clear startup error if `SMTP_PASS` is unset (the
file already does this pattern for missing SMTP config elsewhere — line 40-43). Rotate/revoke this app
password in the Google account immediately since it's already in git history.

### 🟠 Log files and video tokens committed to git
**Where:** `Logs/*.log` (tracked, not in `.gitignore`), `lib/video-urls.json` (Firebase Storage URLs with
embedded `token=` query params).
**Problem:** log files can contain user emails/phones/errors and grow forever in git history; the video
URLs' tokens grant permanent access to those files regardless of Storage rules, and are now permanently
in git history.
**Fix:** add `Logs/` to `.gitignore` (keep `Logs/.gitkeep` only, or drop logging-to-disk in favor of a
real log service). Regenerate the Firebase Storage download tokens for the tutorial videos and load them
from an environment variable or a Storage read at request time instead of a committed JSON file.

### 🟡 Contact info "reveal" UI is cosmetic
**Where:** `app/dashboard/inquiry/new/page.tsx` (seller directory table for all-table products).
**Problem:** the buyer's browser fetches every matching seller's email/phone from Firestore up front to
build the table; the "Reveal Contact" button only toggles CSS/display, the data is already sitting in
the page's network response and React state.
**Fix:** don't fetch seller contact details until the buyer explicitly requests them (a dedicated
authenticated API call per reveal), so unrevealed contacts never reach the browser.

### 🟡 Email templates are not HTML-escaped
**Where:** `lib/email.ts` — every template (`notifyBuyerOfNewOfferEmail`, `notifySellerOfAcceptanceEmail`,
etc.) interpolates values like `sellerInfo.name`, `buyerInfo.company`, `item.remarks`, `productName`
directly into raw HTML strings.
**Problem:** a company name, remark, or product name containing HTML/script tags gets sent verbatim to
the recipient's email client.
**Fix:** run every interpolated user-supplied string through an HTML-escaping helper before inserting it
into the template strings.

### 🟡 GSTIN/Aadhaar "verification" endpoints don't verify with any authority
**Where:** `app/api/verify/gstin/route.ts`, `app/api/verify/aadhaar/route.ts`.
**Problem:** GSTIN check is regex-format-only (the real government API call is commented out at lines
31-79, disabled since "user reported issues with the free API endpoint"; current fallback response is
honestly worded as format-only). Aadhaar check is Verhoeff-checksum-only (`lib/aadhaar-verhoeff.ts`),
but its response says **"Aadhaar number verified successfully"** (`app/api/verify/aadhaar/route.ts:28`)
which overstates what actually happened — a checksum pass proves the number is well-formed, not that it
belongs to a real, verified individual.
**Fix:** reword the Aadhaar response to something like "Aadhaar format is valid (checksum passed);
identity not verified with UIDAI." For GSTIN, either re-enable the external check once a stable
paid/registered GST API key is available, or keep the current honest "format valid, external check
unavailable" wording (already correct) and remove the dead commented-out block once a decision is made.
No rate limiting exists on either endpoint — add basic per-IP rate limiting so they can't be used as a
checksum oracle to mass-validate stolen ID numbers.

---

## 2. Data integrity / race conditions

### 🟠 Sequential ID generation is not concurrency-safe
**Where:** `lib/store.ts:266-346` — `getNextBuyerId`, `getNextSellerId`, `getNextInquiryId`,
`getNextInquiryItemId`, `getNextOfferId`, `getNextSellerAlias`, `generateUserCode`,
`generatePublicAlias`. Each reads the current highest ID/count, adds 1, and writes — with no
transaction.
**Problem:** two registrations/inquiries/offers created within the same moment can both read the same
"last ID," compute the same next ID, and one `setDoc` silently overwrites the other's document.
**Fix:** replace with a Firestore transaction against a dedicated counter document per collection
(`runTransaction` reading and incrementing e.g. `counters/buyers.lastId` atomically), or use Firestore's
auto-generated document IDs plus a separate indexed `sequenceNumber` field assigned inside the same
transaction.

### 🟡 4-digit zero-padded IDs break sort order past 9999
**Where:** same functions as above (`String(lastNum + 1).padStart(4, "0")`).
**Problem:** `orderBy("id", "desc")` sorts as a string; `"10000"` sorts before `"9999"` alphabetically,
so past 9,999 records in a collection, the "get the last ID" query returns the wrong document and IDs
start colliding/reusing.
**Fix:** switch to a numeric counter field (see transaction fix above) instead of deriving the next ID
from a string-sorted query, so padding width no longer affects ordering.

### 🟡 Rebid can be used twice under concurrent clicks
**Where:** `lib/store.ts` `activateBidding` (~line 976-984) — reads `rebid_count`, checks `>= 1`, then
updates.
**Problem:** two rapid rebid clicks (or two browser tabs) can both pass the check before either write
lands, allowing a second rebid that should have been blocked.
**Fix:** wrap the read-check-write in a Firestore transaction so the check and the increment happen
atomically.

### 🟡 Offer acceptance and inquiry closing are not atomic
**Where:** `app/dashboard/offers/page.tsx` (~line 135-136) — `acceptOffer(offerId)` then
`closeInquiry(inquiryId)` as two separate calls.
**Problem:** if the second call fails (network blip, permission error) after the first succeeds, the
system ends up with an accepted offer sitting on a still-open/biddable inquiry.
**Fix:** move both writes into a single server-side API call that performs them in one Firestore
transaction (or `writeBatch`), so either both succeed or neither does.

### 🟢 First-offer seller alias can be assigned twice
**Where:** `lib/store.ts` `createOffer` (~line 1007-1014) calling `getNextSellerAlias()`.
**Problem:** two concurrent first-offers from the same seller on the same inquiry can each see "no alias
yet" and each generate a new alias, giving one seller two different aliases on the same inquiry.
**Fix:** same transaction pattern — check-and-assign the alias atomically, keyed on
`(inquiryId, sellerId)`.

### 🟢 No double-click protection on destructive/one-shot actions
**Where:** `app/dashboard/offers/page.tsx` Accept/Disqualify/Rebid buttons (~line 499-506, 662-667).
**Problem:** rapid double-clicks can fire the same mutation twice before the first request resolves.
**Fix:** disable the button (or show a spinner and ignore further clicks) for the duration of the
in-flight request, keyed per row/offer id, not globally.

---

## 3. "Not real-time" / stale data (the class of bug you originally found in Settings)

### 🟠 Auth/session state never re-syncs with Firestore after login
**Where:** `lib/auth-context.tsx:60-85` (loads `user`/`allUsers` from `localStorage` on every mount, not
from the DB) and `88-106` (only writes back to localStorage, never reads live).
**Problem:** already discussed in depth this session — any manual Firestore edit, or edit made on
another device/tab, is invisible until the affected user logs out and back in. This is also why a
seller's saved product categories / delivery locations (used to decide which inquiries they're shown)
go stale across devices.
**Fix (pick one, in order of effort):**
1. Minimal: on mount, after loading the localStorage snapshot, kick off a background `getUserById` (or
   an equivalent Firestore read) for the active user and merge/update if the DB differs.
2. Better: replace the one-shot Firestore reads in `lib/store.ts` with `onSnapshot` listeners for the
   active user's `buyers`/`sellers` document, so any DB change is pushed to the UI live without a
   refresh.
3. Most robust: move session state off `localStorage` entirely and treat Firestore (via `onSnapshot`) as
   the single source of truth, using `localStorage` only to remember *which* user id was last active.

### 🟡 "Realtime Stats" isn't real-time
**Where:** `lib/analytics.ts` `getRealtimeStats` (~line 423-440).
**Problem:** the function name implies a live feed, but it's a one-shot count query — same "nothing is
actually live" pattern as above, just in the analytics dashboard.
**Fix:** either rename it to reflect what it actually is (`getCurrentStats`), or back it with an
`onSnapshot` listener if the dashboard genuinely needs it to update without a manual refresh.

---

## 4. Validation gaps

### 🟡 No server-side re-validation of registration fields
**Where:** `lib/store.ts:348-361` `registerUser` — takes `phone`, `gstin`, `aadhaarNumber`, `email`
as-is and writes them straight to Firestore. `validateAadhaar` (Verhoeff checksum, in
`lib/aadhaar-verhoeff.ts`) exists but is never called from here.
**Problem:** all format checks (10-digit phone, 15-char GSTIN, 12-digit Aadhaar with valid checksum) only
run in the browser (`app/auth/register/page.tsx`). A direct API/script call bypasses every one of them.
**Fix:** call the same validation (phone regex, GSTIN regex, `validateAadhaar()`) inside `registerUser`
itself before any `setDoc`, and reject with a clear error if any fail.

### 🟡 A password-strength checker exists but is disabled and unused
**Where:** `lib/utils.ts:27-35` — `validatePassword()` always returns every flag as `true` regardless of
input ("Restrictions removed as requested"), and is not called anywhere in the codebase.
**Problem:** dead, misleading code — reads as if password strength is enforced somewhere, but nothing
calls it, and even if something did, it would always pass.
**Fix:** either remove the function entirely (only real length check today is Firebase Auth's own
minimum), or restore real strength rules and wire it into the register/reset-password forms if stronger
passwords are actually wanted.

### 🟢 Bidding duration / price fields have no real bounds
**Where:** `app/dashboard/inquiries/page.tsx` (~line 317-326), `app/dashboard/offers/page.tsx`
(~line 722-731), `app/dashboard/seller/pending/page.tsx` (~line 911-924).
**Problem:** `<Input type="number" min="1">` doesn't reliably block 0/negative on manual typing in every
browser, and there's no upper bound on price fields — a typo with extra zeros goes straight into the
database.
**Fix:** validate the parsed number in the submit handler (`value > 0 && value <= REASONABLE_MAX`)
before calling the store/API function, in addition to the HTML attribute.

### 🟢 Secondary emails aren't validated
**Where:** `app/dashboard/settings/page.tsx` (~line 260-297).
**Problem:** no email-format check, no de-duplication, no max count on the secondary-emails list; an
unverified secondary email can still be checked under "Email Notification Preferences" (~334-367) and
receive notifications despite never being confirmed as owned by the user.
**Fix:** validate email syntax and de-dupe on add; only allow a secondary email to be checked for
notifications once `verifiedSecondaryEmails` actually contains it.

### 🟢 File uploads are only checked by extension/MIME on the client
**Where:** registration document upload (`app/auth/register/page.tsx` `handleFileUpload`), offer
attachment upload (`app/dashboard/seller/pending/page.tsx` ~1012-1017,
`app/dashboard/seller/my-offers/page.tsx` ~589).
**Problem:** `accept=".pdf,.jpeg,.jpg,.png"` and a `file.type` check are both client-side and trivially
bypassed; nothing re-checks the actual file bytes server-side.
**Fix:** if/when uploads move behind a real API (see Section 1's auth fix), verify the file's magic
bytes/content-type server-side before accepting it into Storage.

---

## 5. Confirmed functional bugs (wrong output today)

### 🟠 "Total Est." price is wrong on Offers, Pending, My-Offers, Submitted-Offers pages
**Where:**
- `app/dashboard/offers/page.tsx:391-394` and `:534-536`
- `app/dashboard/seller/pending/page.tsx` and `app/dashboard/seller/my-offers/page.tsx` /
  `submitted-offers/page.tsx` (same computation duplicated across files)
**Problem:** the code looks up quantity via
`item.options["Quantity"] || item.options["Qty"] || item.options["quantity"]`, but the actual field
name used everywhere the option is set (see `app/dashboard/seller/my-products/page.tsx` `FIELD_ORDER`)
is `"Quantity(in tons)"`. The lookup always misses, silently falls back to `|| 1`, so every displayed
"Total Est." is just `pricePerTon × 1` instead of the real quantity.
**Fix:** change the lookup to `item.options["Quantity(in tons)"]` in all four locations (search for the
`"Quantity"] || ... ["Qty"]` pattern to find every occurrence).

### 🟠 `offer.requestedQuantity` is always undefined
**Where:** `app/dashboard/seller/my-offers/page.tsx:199,308` and the duplicate in
`submitted-offers/page.tsx`.
**Problem:** `requestedQuantity` is read off the `offer` object, but nothing in the offer-creation code
path (`lib/store.ts` `createOffer`) ever sets that field — it's always `undefined`, so these totals are
also always `price × 1`.
**Fix:** pull the quantity from the related inquiry item's `"Quantity(in tons)"` option (same source of
truth as the fix above) instead of a non-existent `offer.requestedQuantity` field.

### 🟡 Offer attachment deletion from Storage likely silently fails
**Where:** `app/dashboard/seller/my-offers/page.tsx:403-409` (and the duplicate in
`submitted-offers/page.tsx`).
**Problem:** `ref(storage, targetOffer.pdfUrl)` is passed a full `https://` download URL, but Firebase's
`ref()` expects a `gs://` URI or a plain storage path. `deleteObject` most likely throws, which is caught
and logged — meaning attachments are never actually removed from Storage even when the UI says they
were.
**Fix:** store the Storage *path* (e.g. `documents/offer_123.pdf`) alongside `pdfUrl` when the file is
uploaded, and use that path with `ref(storage, path)` for deletion instead of the download URL.

### 🟡 Landing page phone number has no country code
**Where:** `app/page.tsx:549` — footer `tel:9510461387`.
**Problem:** same class of bug as the original SMS issue — dialing this link from outside India (or from
some carriers/apps) may not resolve correctly without a country code.
**Fix:** change to `tel:+919510461387`.

### 🟢 Inconsistent marketing numbers on the landing page
**Where:** `app/page.tsx:238` ("Trusted by 500+ verified businesses") vs `app/page.tsx:328` ("100+
Verified Sellers").
**Fix:** reconcile to one accurate, consistent number (or two clearly different labeled metrics, e.g.
"500+ businesses" vs "100+ of them are sellers").

### 🟢 `require()` used inside a client component
**Where:** `app/tutorials/page.tsx:29-34` — `require("@/lib/video-urls.json")` wrapped in a silent
`try/catch`, inside a `"use client"` file.
**Problem:** CommonJS `require` in a client bundle is fragile across bundler versions, and the empty
`catch` hides any real failure (e.g. a missing/corrupt JSON file) as if it were an intentional fallback.
**Fix:** replace with a static `import videoUrls from "@/lib/video-urls.json"` and remove the try/catch,
or fetch it from an API route if it needs to be dynamic.

### 🟢 Logging in to a "both" (buyer+seller) account always lands on Buyer
**Where:** `lib/auth-context.tsx:152` (`login`) and `:265` (`loginWithGoogle`) — both do
`userDatas.find(u => u.role === "buyer" || u.role === "both") || userDatas[0]` regardless of the
`role` parameter passed in.
**Problem:** there's no way to sign in directly to the Seller side of a combined account via the login
form or Google login.
**Fix:** respect the `role` argument when picking which profile becomes active, falling back to buyer
only when no role was specified.

### 🟢 Logging out one role can drop all linked profiles
**Where:** `lib/auth-context.tsx:296-318` `logout()` — filters `allUsers` by `u.email !== user.email`.
**Problem:** for a "both" account (or any email with multiple linked role-profiles), logging out removes
every profile sharing that email, not just the active session.
**Fix:** filter by the specific profile's `id`, not by `email`, so switching/removing one role-profile
doesn't affect the others.

---

## 6. Reliability / silent failures

### 🟡 SMS vs email notification failure behavior is inconsistent
**Where:** `lib/sms.ts:40-43` (missing `MSG91_AUTH_KEY` → silently "succeeds" as simulated) vs
`lib/email.ts:40-43` (missing SMTP config → throws).
**Fix:** pick one behavior for "provider not configured" across both (recommended: log a clear warning
and skip the send, returning `{ success: false, skipped: true }` from both, so callers can tell the
difference between "sent," "failed," and "not configured").

### 🟢 SMS and email for the same event fire on different schedules
**Where:** `app/api/offers/route.ts` sends buyer SMS on every new offer, while
`lib/email.ts` `notifyBuyerOfNewOfferEmail` (~line 154) only emails on offer counts 1, 3, 5, or
multiples of 10.
**Fix:** either document this as intentional (reduce email noise, keep SMS immediate) or align both to
the same cadence if the difference is accidental — worth confirming intent with product before changing.

### 🟢 Log writes are fire-and-forget and never rotate
**Where:** `lib/logger.ts:61-81` (`writeLogFile`, called via `void writeLogFile(...)` at line 105),
writes to `process.cwd()/Logs` with a new file per day and no cleanup.
**Problem:** a crash before the async write flushes loses that log line; on most modern hosting
(serverless/read-only filesystems) this write may silently no-op in production; disk usage grows
forever locally.
**Fix:** await the write (or accept the small loss risk explicitly), add a retention/rotation policy
(delete log files older than N days), and route production logging to a real log sink (e.g. a hosted
logging service) instead of local disk if deploying to a serverless platform.

### 🟢 Welcome notification after registration has no retry
**Where:** `lib/auth-context.tsx:220-229` — the `/api/auth/register` fetch (which triggers welcome
email/SMS) is fire-and-forget with a comment "not critical."
**Fix:** acceptable to keep non-blocking, but log a distinguishable event when this specific fetch fails
outright (network-level, not just the notification-send failing server-side) so it's visible in
monitoring instead of fully silent.

---

## 7. Performance

- **N+1 reads building inquiry lists** — `lib/store.ts` `mapInquiryFromDb` (~187-237) does 3 sequential
  Firestore reads per inquiry (items, accepted-offer check, offer count), run inside a `Promise.all` map
  over every inquiry in `getInquiriesByBuyerId`/`getAllInquiries`/`getOpenInquiries`. **Fix:** denormalize
  `itemCount`/`hasAcceptedOffer`/`offerCount` onto the inquiry document itself, updated at write time,
  instead of recomputed on every read.
- **Extra read per ID generation** — every buyer/seller/inquiry/item/offer creation does a full
  `orderBy("id","desc").limit(1)` query first. **Fix:** resolved by the counter-transaction fix in
  Section 2.
- **Full-collection scan for seller notification targeting** — `lib/store.ts`
  `getSellersContactInfoByCategories` (~835-846) fetches *all* verified sellers and filters in memory.
  **Fix:** add a Firestore composite index on `categories` (array-contains) + `verified` and query
  directly instead of filtering client-side.
- **Analytics has no pagination or caching** — `lib/analytics.ts`'s metrics functions
  (`getSalesMetrics`, `getTimeSeriesData`, `getProductAnalytics`, `getBuyerAnalytics`,
  `getSellerAnalytics`) fetch entire collections and aggregate in memory on every dashboard view, with
  chunked `"in"` queries (10 per chunk) for buyer/product lookups. **Fix:** cache computed metrics for a
  short TTL (e.g. 60s) server-side, or precompute daily aggregates in a scheduled job instead of
  recomputing from raw documents on every page view.
- **Sequential fetch loops instead of parallel** — `app/dashboard/inquiries/page.tsx` (~60-84),
  `app/dashboard/offers/page.tsx` (~56-81), `app/dashboard/seller/pending/page.tsx` (~158-183) fetch
  product options with a `for...of` + `await fetch` loop per product/sub-product pair. **Fix:** replace
  with `Promise.all(pairs.map(fetchOptions))`.

---

## 8. Dead code / maintenance hazards

- **`app/dashboard/inquiry/new/page.tsx.bak`** — a 444-line stray backup file checked into the repo.
  **Fix:** delete it; git history already preserves any prior version.
- **`app/dashboard/seller/create-quotation/page.tsx`** — placeholder page that just tells the user to go
  elsewhere; looks unfinished. **Fix:** either finish it or remove the route/nav link until it's ready.
- **`my-offers/page.tsx` and `submitted-offers/page.tsx` are near-duplicate files** — same handlers,
  same table markup, same bugs (see Section 5). **Fix:** extract the shared table/handlers into one
  component both pages render with different props, so a fix only needs to happen once.
- **Hardcoded product-name string used as a business-logic switch** — the literal string
  `"Stock of non-standard Color-coated coils/sheets"` is repeated across `inquiry/new`, `offers`,
  `seller/pending`, and `seller/my-products` to special-case behavior (including bypassing the
  "accept to view contact" rule in `app/dashboard/offers/page.tsx:382,465,523,626`). **Fix:** add an
  explicit boolean flag (e.g. `isMultiConfig` / `bypassContactLock`) on the product document in
  Firestore instead of matching on the display name, so renaming the product doesn't silently change
  behavior.
- **Native `confirm()` used for destructive actions** — `app/dashboard/inquiries/page.tsx:132`,
  `app/dashboard/seller/pending/page.tsx:340`, `app/dashboard/seller/my-offers/page.tsx:108,394`.
  **Fix:** replace with the app's own `Dialog` component for a consistent, non-blocking confirmation UI.
- **Email templates duplicate the same header/footer HTML ~15 times** in `lib/email.ts`, with the
  domain/URL hardcoded in every function. **Fix:** extract one `wrapEmailTemplate(bodyHtml)` helper and
  a `SITE_URL` constant, and have every template function use them.
- **`lib/empty.ts`** exports an empty object with no clear purpose. **Fix:** confirm nothing imports it
  (`grep -r "lib/empty"`) and delete if unused.

---

## Suggested order of work

1. **Section 1 (Security)** — especially the no-auth API routes and plaintext passwords. This is the
   highest actual risk to the business and users right now.
2. **Section 5 bugs** — the wrong "Total Est." calculations are visible, confusing, and quick to fix
   (one field-name correction, applied in a few places).
3. **Section 3 (stale data)** — the live-update fix for `auth-context`, since it's the exact issue you
   already ran into with Settings and will keep resurfacing anywhere cached user data is shown.
4. **Section 2 (race conditions)** — the ID-generation transaction fix, before traffic grows enough to
   make collisions likely.
5. Everything else (Sections 4, 6, 7, 8) as ongoing hardening — none of it is actively broken today, but
   all of it will bite as usage grows.
