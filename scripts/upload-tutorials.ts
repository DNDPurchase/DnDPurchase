import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";
import { initializeApp } from "firebase/app";
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";

// Load environment variables from .env
dotenv.config();

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Ensure storage bucket is loaded
if (!firebaseConfig.storageBucket) {
  console.error("Error: NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET is not defined in .env");
  process.exit(1);
}

const app = initializeApp(firebaseConfig);
const storage = getStorage(app);

const videos = [
  {
    localName: "Landing Page.mp4",
    storageName: "landing-page.mp4",
    key: "landingPage",
  },
  {
    localName: "Buyer.mp4",
    storageName: "buyer.mp4",
    key: "buyer",
  },
  {
    localName: "Seller.mp4",
    storageName: "seller.mp4",
    key: "seller",
  },
];

async function uploadFile(localPath: string, storagePath: string): Promise<string> {
  if (!fs.existsSync(localPath)) {
    throw new Error(`File does not exist: ${localPath}`);
  }

  const fileBuffer = fs.readFileSync(localPath);
  const storageRef = ref(storage, storagePath);
  const metadata = {
    contentType: "video/mp4",
  };

  console.log(`Starting upload for ${path.basename(localPath)} (${(fileBuffer.length / (1024 * 1024)).toFixed(2)} MB)...`);

  return new Promise((resolve, reject) => {
    const uploadTask = uploadBytesResumable(storageRef, fileBuffer, metadata);

    uploadTask.on(
      "state_changed",
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        console.log(`Uploading ${path.basename(localPath)}: ${progress.toFixed(2)}% complete`);
      },
      (error) => {
        reject(error);
      },
      async () => {
        try {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          console.log(`Uploaded ${path.basename(localPath)} successfully!`);
          console.log(`Download URL: ${downloadURL}\n`);
          resolve(downloadURL);
        } catch (err) {
          reject(err);
        }
      }
    );
  });
}

async function main() {
  const localVideoDir = path.join(process.cwd(), "DND Video");
  const urls: Record<string, string> = {};

  console.log("Starting tutorials video upload to Firebase Storage...");
  console.log(`Storage Bucket: ${firebaseConfig.storageBucket}`);

  for (const video of videos) {
    const localPath = path.join(localVideoDir, video.localName);
    const storagePath = `tutorials/${video.storageName}`;

    try {
      const downloadURL = await uploadFile(localPath, storagePath);
      urls[video.key] = downloadURL;
    } catch (error: any) {
      console.error(`\nFailed to upload ${video.localName}:`, error.message);
      console.error("Please make sure Firebase Storage rules allow writing to /tutorials/ folder.");
      console.error("Temporary rules suggestion for firebase-storage.txt (or in Firebase Console):");
      console.error("  match /tutorials/{fileName} {");
      console.error("    allow read, write: if true;");
      console.error("  }\n");
      process.exit(1);
    }
  }

  const outputFilePath = path.join(process.cwd(), "lib", "video-urls.json");
  fs.writeFileSync(outputFilePath, JSON.stringify(urls, null, 2), "utf8");
  console.log(`Successfully wrote URLs to ${outputFilePath}`);
  console.log("All uploads complete!");
}

main().catch((err) => {
  console.error("Unhandled error:", err);
  process.exit(1);
});
