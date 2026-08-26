# Developer Setup & Installation Guide

This guide contains step-by-step instructions for getting the **DND Purchase** project running locally on a fresh clone.

---

## 1. Prerequisites

Ensure you have the following installed on your development machine:

- **Node.js**: `v20.x` or `v22.x` (LTS recommended)
- **Package Manager**: `npm` (v10+), `yarn`, or `pnpm`
- **Git**: Latest version
- **Firebase Account**: Access to a Firebase project with Firestore, Authentication, and Storage enabled.
- **MSG91 Account** *(Optional for local UI dev)*: For transactional SMS testing.

---

## 2. Quick Start

### Step 1: Clone the Repository
```bash
git clone <repository-url>
cd DnDPurchase-main
```

### Step 2: Install Dependencies
```bash
npm install
```

---

## 3. Environment Variables Configuration

Create a local environment file `.env` (or `.env.local`) in the root directory:

```bash
cp .env.local.example .env.local
```

### Required Variable Groups:

> **Important**: Never commit your `.env` or `.env.local` files to Git.

#### 1. Firebase Client SDK (Public Web Credentials)
Get these from **Firebase Console &rarr; Project Settings &rarr; General &rarr; Your apps &rarr; Web app**:
```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

#### 2. SMS Gateway Configuration (MSG91 Flow Builder)
Get your Auth Key and Flow template IDs from **MSG91 Dashboard &rarr; Flow Builder**:
```env
SMS_TEST_MODE=false
MSG91_AUTH_KEY=your_msg91_auth_key

# Template Flow IDs
MSG91_TEMPLATE_WELCOME=your_welcome_flow_id
MSG91_TEMPLATE_NEW_INQUIRY=your_new_inquiry_flow_id
MSG91_TEMPLATE_BIDDING_STARTED=your_bidding_started_flow_id
MSG91_TEMPLATE_NEW_OFFER=your_new_offer_flow_id
MSG91_TEMPLATE_OFFER_ACCEPTED_BUYER=your_offer_accepted_buyer_flow_id
MSG91_TEMPLATE_OFFER_ACCEPTED_SELLER=your_offer_accepted_seller_flow_id
MSG91_TEMPLATE_OFFER_REJECTED_SELLER=your_offer_rejected_seller_flow_id
MSG91_TEMPLATE_INQUIRY_CLOSED=your_inquiry_closed_flow_id
MSG91_TEMPLATE_INQUIRY_DELETED=your_inquiry_deleted_flow_id
```

#### 3. Email Gateway Configuration (SMTP / AWS SES)
Configure email credentials for transactional submission receipts and notifications:
```env
SMTP_USER=contact@dndpurchase.com
SMTP_PASS=your_app_password
EMAIL_FROM_ADDRESS="DND Purchase" <contact@dndpurchase.com>
EMAIL_TEST_MODE=false
```

---

## 4. Firebase Services Setup

### 1. Enable Firebase Authentication
1. Go to **Firebase Console &rarr; Build &rarr; Authentication**.
2. Enable **Email/Password** provider.
3. Enable **Google OAuth** provider (optional, for Google Sign-In).

### 2. Set Up Cloud Firestore
1. Go to **Firebase Console &rarr; Build &rarr; Firestore Database**.
2. Create a database in **Production mode** (or Test mode for staging).
3. Apply security rules located in [`firestore-rules.txt`](file:///Users/jeelpatel/Desktop/Jeel/DND%20Main/DnDPurchase-main/firestore-rules.txt) to **Firestore &rarr; Rules**.

### 3. Set Up Cloud Storage
1. Go to **Firebase Console &rarr; Build &rarr; Storage**.
2. Enable Cloud Storage for document uploads (GST certificates, Aadhaar cards, quotation attachments).
3. Apply storage rules from [`firebase-storage.txt`](file:///Users/jeelpatel/Desktop/Jeel/DND%20Main/DnDPurchase-main/firebase-storage.txt).

---

## 5. Running the Application

### Development Server
Run the local Next.js development server with Turbopack / Webpack:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build & Local Test
To build and test the optimized production bundle:
```bash
npm run build
npm run start
```

### Code Quality & Linting
```bash
npm run lint
```

---

## 6. Maintenance & Diagnostic Scripts

The project includes TypeScript execution utilities via `tsx`:

| Script / Command | Purpose |
| :--- | :--- |
| `npm run db:stats` | Displays statistics and counts for Firestore collections. |
| `npx tsx inspect_sellers.ts` | Inspects all seller accounts and their configured options. |
| `npx tsx inspect_all_users.ts` | Lists all registered buyers and sellers with verification flags. |
| `npx tsx scripts/resolve-uploaded-videos.ts` | Resolves video tutorial URLs and storage mappings. |

---

## 7. Troubleshooting & FAQ

### 1. `Missing environment variable` or Firebase Auth error
- Ensure your `.env` or `.env.local` file contains all valid `NEXT_PUBLIC_FIREBASE_*` variables.
- Verify that your local domain (`localhost`) is added under **Firebase Console &rarr; Authentication &rarr; Settings &rarr; Authorized domains**.

### 2. SMS alerts not delivering
- Check if `SMS_TEST_MODE="true"` is set in `.env` (logs payload to console instead of dispatching).
- Ensure template variables in MSG91 match variable placeholders defined in `lib/sms.ts`.

### 3. File upload errors
- Verify that Firebase Storage bucket CORS rules and permissions allow write access for authenticated users.
