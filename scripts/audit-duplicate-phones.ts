// Read-only diagnostic — checks whether multiple verified seller documents
// share the same phone number, which would cause the notification loops in
// getSellersContactInfoByCategories / getSellerContactInfoFromOffers to send
// the SAME SMS content to the SAME number twice in the same request (MSG91
// error 311), independent of any UI double-click.
// Run with: npx tsx scripts/audit-duplicate-phones.ts

import "dotenv/config"
import { collection, getDocs, query, where } from "firebase/firestore"
import { db } from "../lib/firebase"

function normalizePhone(raw: string): string {
    let clean = String(raw || "").replace(/\D/g, "")
    if (clean.length === 10) clean = "91" + clean
    else if (clean.length === 11 && clean.startsWith("0")) clean = "91" + clean.slice(1)
    return clean
}

async function main() {
    const sellersSnap = await getDocs(query(collection(db, "sellers"), where("verified", "==", true)))
    console.log(`Total verified sellers: ${sellersSnap.size}`)

    const byPhone: Record<string, { id: string; categories: string[] }[]> = {}
    sellersSnap.docs.forEach(d => {
        const data = d.data()
        const phone = normalizePhone(data.phone)
        if (!phone) return
        if (!byPhone[phone]) byPhone[phone] = []
        byPhone[phone].push({ id: d.id, categories: data.categories || [] })
    })

    const dupes = Object.entries(byPhone).filter(([, sellers]) => sellers.length > 1)
    console.log(`Phone numbers shared by 2+ verified seller accounts: ${dupes.length}`)
    dupes.forEach(([phone, sellers]) => {
        console.log(`  ${phone.slice(0, 4)}******${phone.slice(-2)} -> ${sellers.map(s => s.id).join(", ")}`)
        sellers.forEach(s => console.log(`      ${s.id} categories: ${JSON.stringify(s.categories)}`))
    })

    // Also check whether any of those duplicate-phone sellers share an overlapping
    // category, which is what would actually trigger a simultaneous duplicate send.
    const dupesWithOverlap = dupes.filter(([, sellers]) => {
        for (let i = 0; i < sellers.length; i++) {
            for (let j = i + 1; j < sellers.length; j++) {
                const overlap = sellers[i].categories.some(c => sellers[j].categories.includes(c))
                if (overlap) return true
            }
        }
        return false
    })
    console.log(`\nOf those, sharing an overlapping product category (would fire simultaneously on matching inquiries): ${dupesWithOverlap.length}`)
}

main().then(() => process.exit(0)).catch((e) => {
    console.error("Audit failed:", e)
    process.exit(1)
})
