import "./load_env";
import { db } from "./lib/firebase";
import { collection, getDocs } from "firebase/firestore";

async function inspect() {
  console.log("Fetching sellers...");
  try {
    const snap = await getDocs(collection(db, "sellers"));
    console.log(`Found ${snap.docs.length} sellers.`);
    snap.docs.forEach(doc => {
      const data = doc.data();
      console.log(`Seller ID: ${doc.id}`);
      console.log(`Name: ${data.name}`);
      console.log(`Email: ${data.email}`);
      console.log(`Categories:`, data.categories);
      console.log(`seller_product_options:`, JSON.stringify(data.seller_product_options, null, 2));
      console.log(`available_locations:`, JSON.stringify(data.available_locations, null, 2));
      console.log("-----------------------------------------");
    });
  } catch (error) {
    console.error("Error inspecting database:", error);
  }
}

inspect().catch(err => console.error(err));
