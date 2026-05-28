import * as dotenv from "dotenv";
dotenv.config();

console.log("API KEY IN SCRIPT:", process.env.NEXT_PUBLIC_FIREBASE_API_KEY);
console.log("PROJECT ID IN SCRIPT:", process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID);
