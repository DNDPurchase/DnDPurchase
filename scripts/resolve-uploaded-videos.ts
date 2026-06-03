import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";
import { initializeApp } from "firebase/app";
import { getStorage, ref, getDownloadURL } from "firebase/storage";

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

if (!firebaseConfig.storageBucket) {
  console.error("Error: NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET is not defined in .env");
  process.exit(1);
}

const app = initializeApp(firebaseConfig);
const storage = getStorage(app);

const videos = [
  {
    storagePath: "tutorials/Landing Page.mp4",
    key: "landingPage",
  },
  {
    storagePath: "tutorials/Buyer.mp4",
    key: "buyer",
  },
  {
    storagePath: "tutorials/Seller.mp4",
    key: "seller",
  },
];

async function main() {
  const urls: Record<string, string> = {};
  console.log("Fetching download URLs from Firebase Storage...");

  for (const video of videos) {
    try {
      const storageRef = ref(storage, video.storagePath);
      const downloadURL = await getDownloadURL(storageRef);
      console.log(`Successfully fetched URL for ${video.storagePath}:`);
      console.log(`  ${downloadURL}\n`);
      urls[video.key] = downloadURL;
    } catch (error: any) {
      console.error(`Failed to get download URL for ${video.storagePath}:`, error.message);
      console.log("Checking if the file is in the 'tutorials/' folder instead...");
      try {
        const storageRef = ref(storage, `tutorials/${video.storagePath.toLowerCase().replace(" ", "-")}`);
        const downloadURL = await getDownloadURL(storageRef);
        console.log(`Successfully fetched URL for tutorials/${video.storagePath.toLowerCase().replace(" ", "-")}:`);
        console.log(`  ${downloadURL}\n`);
        urls[video.key] = downloadURL;
      } catch (innerError: any) {
        console.error(`Also failed to get from tutorials/ path:`, innerError.message);
      }
    }
  }

  if (Object.keys(urls).length > 0) {
    const outputFilePath = path.join(process.cwd(), "lib", "video-urls.json");
    fs.writeFileSync(outputFilePath, JSON.stringify(urls, null, 2), "utf8");
    console.log(`Successfully wrote URLs to ${outputFilePath}`);
  } else {
    console.error("No URLs were successfully resolved. Please make sure the files exist in Firebase Storage.");
  }
}

main().catch((err) => {
  console.error("Unhandled error:", err);
  process.exit(1);
});
