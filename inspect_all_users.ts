import "./load_env";
import { db } from "./lib/firebase";
import { collection, getDocs } from "firebase/firestore";

async function inspect() {
  console.log("=== BUYERS ===");
  const buyersSnap = await getDocs(collection(db, "buyers"));
  buyersSnap.docs.forEach(doc => {
    const data = doc.data();
    console.log(`ID: ${doc.id} | Name: ${data.name} | Email: ${data.email} | Code: ${data.user_code} | CreatedAt: ${data.created_at}`);
  });

  console.log("\n=== SELLERS ===");
  const sellersSnap = await getDocs(collection(db, "sellers"));
  sellersSnap.docs.forEach(doc => {
    const data = doc.data();
    console.log(`ID: ${doc.id} | Name: ${data.name} | Email: ${data.email} | Code: ${data.user_code} | CreatedAt: ${data.created_at}`);
  });
}

inspect().catch(err => console.error(err));
