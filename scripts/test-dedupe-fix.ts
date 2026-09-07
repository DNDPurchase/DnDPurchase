// Verifies the phone-dedup fix against the real duplicate-phone seller
// cluster found in production (SEL-0013/0015/0016, category "GP-GI Coils or
// Purlins"), using the real getSellersContactInfoByCategories function.
// Run with: npx tsx scripts/test-dedupe-fix.ts

import "dotenv/config"
import { getSellersContactInfoByCategories } from "../lib/store"

async function main() {
    const contacts = await getSellersContactInfoByCategories(["GP-GI Coils or Purlins"])
    console.log(`Matched contacts: ${contacts.length}`)

    const phones = contacts.map(c => c.phone).filter(Boolean)
    const uniquePhones = new Set(phones)
    console.log(`Unique phone numbers among them: ${uniquePhones.size}`)

    if (phones.length !== uniquePhones.size) {
        console.log("FAIL: duplicate phone numbers still present in the contact list")
        process.exit(1)
    } else {
        console.log("PASS: no duplicate phone numbers in the contact list — dedup is working")
    }
}

main().then(() => process.exit(0)).catch((e) => {
    console.error("Test failed:", e)
    process.exit(1)
})
