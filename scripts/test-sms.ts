// Local SMS test harness — sends real SMS via the actual lib/sms.ts code path
// (the same functions production uses) to a fixed set of test numbers, across
// every template and both DLT variable-naming patterns (alp / var).
//
// Requires MSG91_AUTH_KEY and the MSG91_TEMPLATE_* vars to be set in .env or
// .env.local, and SMS_TEST_MODE=false (or unset) to actually hit the MSG91 API.
//
// Run with: npx tsx scripts/test-sms.ts

import "dotenv/config"
import {
    sendWelcomeSMS,
    notifySellerOfNewInquirySMS,
    notifySellersOfBiddingSMS,
    notifyBuyerOfNewOfferSMS,
    notifyBuyerOfAcceptanceSMS,
    notifySellerOfAcceptanceSMS,
    notifySellerOfRejectionSMS,
    notifyBuyerOfInquiryClosedSMS,
} from "../lib/sms"

const TEST_NUMBERS = ["8160911006", "7990693524"]

async function run(label: string, fn: () => Promise<any>) {
    try {
        const result = await fn()
        const ok = result?.success === true && !result?.simulated
        console.log(`[${ok ? "PASS" : "WARN"}] ${label}`, JSON.stringify(result))
        return ok
    } catch (err: any) {
        console.log(`[FAIL] ${label} threw:`, err?.message || err)
        return false
    }
}

async function main() {
    console.log("MSG91_AUTH_KEY set:", !!process.env.MSG91_AUTH_KEY)
    console.log("SMS_TEST_MODE:", process.env.SMS_TEST_MODE)
    console.log("")

    const [n1, n2] = TEST_NUMBERS
    const results: boolean[] = []

    results.push(await run("Welcome_SMS (no vars)", () => sendWelcomeSMS(n1, "Test User")))
    results.push(await run("New_inquiry_alert (no vars)", () => notifySellerOfNewInquirySMS(n2)))
    results.push(await run("Bidding_Started (alp var)", () => notifySellersOfBiddingSMS(n1, "TEST-INQ-0001")))
    results.push(await run("New_Offer (alp var)", () => notifyBuyerOfNewOfferSMS(n2, "TEST-INQ-0001")))
    results.push(await run("Offer_Accepted_Buyer (alp var)", () => notifyBuyerOfAcceptanceSMS(n1, "TEST-OFR-0001")))
    results.push(await run("Offer_Accepted_Seller (var var)", () => notifySellerOfAcceptanceSMS(n2, "TEST-OFR-0001")))
    results.push(await run("Offer_Rejected_Seller (var var)", () => notifySellerOfRejectionSMS(n1, "TEST-OFR-0002")))
    results.push(await run("Inquiry_closed (var var)", () => notifyBuyerOfInquiryClosedSMS(n2, "TEST-INQ-0002")))

    console.log("")
    console.log(`${results.filter(Boolean).length}/${results.length} sends succeeded`)
}

main().then(() => process.exit(0)).catch((e) => {
    console.error("Script failed:", e)
    process.exit(1)
})
