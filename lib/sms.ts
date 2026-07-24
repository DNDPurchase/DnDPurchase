import { logger } from "./logger"

const TEST_MODE = process.env.SMS_TEST_MODE === "true"

// MSG91 configuration
const MSG91_AUTH_KEY = process.env.MSG91_AUTH_KEY || ""
const MSG91_API_URL = "https://control.msg91.com/api/v5/flow/"

interface MSG91Payload {
    template_id: string;
    recipients: Array<{
        mobiles: string;
        [key: string]: string; // dynamic variables matching MSG91 template placeholders
    }>;
}

/**
 * MSG91 SMS sender using Flow Builder API
 */
export async function sendSMS(payload: MSG91Payload) {
    if (TEST_MODE) {
        logger.info("Test mode enabled; skipping actual SMS send", { payload })
        return { success: true, messageId: "test-mode-sms-" + Date.now() }
    }

    if (!MSG91_AUTH_KEY) {
        logger.warn("MSG91_AUTH_KEY not configured. Simulating SMS send.", { payload })
        return { success: true, simulated: true }
    }

    try {
        // MSG91 expects mobile numbers without '+' but with country code (e.g., 919876543210)
        const sanitizedPayload = {
            ...payload,
            recipients: payload.recipients.map(recipient => {
                let cleanMobile = recipient.mobiles.replace(/\D/g, "");
                if (cleanMobile.length === 10) {
                    cleanMobile = "91" + cleanMobile;
                } else if (cleanMobile.length === 11 && cleanMobile.startsWith("0")) {
                    cleanMobile = "91" + cleanMobile.slice(1);
                }
                return {
                    ...recipient,
                    mobiles: cleanMobile
                }
            })
        }

        const response = await fetch(MSG91_API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                authkey: MSG91_AUTH_KEY,
            },
            body: JSON.stringify(sanitizedPayload),
        })

        if (!response.ok) {
            const errorText = await response.text()
            throw new Error(`MSG91 Error: ${response.status} ${errorText}`)
        }

        const data = await response.json()
        logger.info("SMS sent successfully via MSG91", { data })
        return { success: true, data }
    } catch (error) {
        logger.error("Failed to send SMS via MSG91", { error: (error as Error).message, payload })
        throw error
    }
}

// ----------------------------------------------------------------------------
// Specific Application SMS Messages
// Variable keys MUST match the placeholder names in MSG91 Flow Builder templates
// ----------------------------------------------------------------------------

/**
 * Welcome_SMS template — no variables
 * "Welcome to DND Purchase! You can now buy and sell Steel & Cement in just 2 steps.
 *  Visit https://dndpurchase.com to get started. - DND Purchase"
 */
export async function sendWelcomeSMS(to: string, _name: string) {
    return sendSMS({
        template_id: process.env.MSG91_TEMPLATE_WELCOME || "SIMULATED",
        recipients: [{ mobiles: to }]
    })
}

/**
 * New_inquiry_alert template — no variables
 * "New inquiry received. Log in to https://dndpurchase.com to submit your offer.
 *  Go to 'New Inquiries' and place your bid. - DND Purchase"
 */
export async function notifySellerOfNewInquirySMS(to: string) {
    return sendSMS({
        template_id: process.env.MSG91_TEMPLATE_NEW_INQUIRY || "SIMULATED",
        recipients: [{ mobiles: to }]
    })
}

/**
 * Bidding_Started template — variable: {#alp#} → inquiryId
 * "Bidding is now live for Inquiry ID {#alp#}. Visit https://dndpurchase.com
 *  to submit or revise your bid before the bidding window closes. - DND Purchase"
 */
export async function notifySellersOfBiddingSMS(to: string, inquiryId: string) {
    return sendSMS({
        template_id: process.env.MSG91_TEMPLATE_BIDDING_STARTED || "SIMULATED",
        recipients: [{ mobiles: to, alp: inquiryId }]
    })
}

/**
 * New_Offer template — variable: {#alp#} → inquiryId
 * "New offers received for your Inquiry ID {#alp#}. Log in to https://dndpurchase.com
 *  and check 'My Inquiries' to view and manage offers. - DND Purchase"
 */
export async function notifyBuyerOfNewOfferSMS(to: string, inquiryId: string) {
    return sendSMS({
        template_id: process.env.MSG91_TEMPLATE_NEW_OFFER || "SIMULATED",
        recipients: [{ mobiles: to, alp: inquiryId }]
    })
}

/**
 * Offer_Accepted_Buyer template — variable: {#alp#} → offerId
 * "You have accepted Offer ID {#alp#}. Connect directly with the seller to
 *  finalize shipment & billing details: www.dndpurchase.com - DND Purchase"
 */
export async function notifyBuyerOfAcceptanceSMS(to: string, offerId: string) {
    return sendSMS({
        template_id: process.env.MSG91_TEMPLATE_OFFER_ACCEPTED_BUYER || "SIMULATED",
        recipients: [{ mobiles: to, alp: offerId }]
    })
}

/**
 * Offer_Accepted_Seller template — variable: {#var#} → offerId
 * "Congratulations! Your Offer ID {#var#} has been accepted by the buyer.
 *  Please connect with them to arrange delivery: www.dndpurchase.com - DND Purchase"
 */
export async function notifySellerOfAcceptanceSMS(to: string, offerId: string) {
    return sendSMS({
        template_id: process.env.MSG91_TEMPLATE_OFFER_ACCEPTED_SELLER || "SIMULATED",
        recipients: [{ mobiles: to, var: offerId }]
    })
}

/**
 * Offer_Rejected_Seller template — variable: {#var#} → offerId
 * "Your Offer ID {#var#} was not accepted this time. Check out other active
 *  inquiries on your dashboard: www.dndpurchase.com - DND Purchase"
 */
export async function notifySellerOfRejectionSMS(to: string, offerId: string) {
    return sendSMS({
        template_id: process.env.MSG91_TEMPLATE_OFFER_REJECTED_SELLER || "SIMULATED",
        recipients: [{ mobiles: to, var: offerId }]
    })
}

/**
 * Inquiry_closed template — variable: {#var#} → inquiryId
 * "Inquiry ID {#var#} has been closed or cancelled. Pending offers for this
 *  inquiry will no longer be active. - DND Purchase"
 */
export async function notifyBuyerOfInquiryClosedSMS(to: string, inquiryId: string) {
    return sendSMS({
        template_id: process.env.MSG91_TEMPLATE_INQUIRY_CLOSED || "SIMULATED",
        recipients: [{ mobiles: to, var: inquiryId }]
    })
}

export async function notifySellerOfInquiryClosedSMS(to: string, inquiryId: string) {
    return sendSMS({
        template_id: process.env.MSG91_TEMPLATE_INQUIRY_CLOSED || "SIMULATED",
        recipients: [{ mobiles: to, var: inquiryId }]
    })
}

/**
 * Reuses Inquiry_closed template for deleted inquiries — variable: {#var#} → inquiryId
 * Falls back to INQUIRY_CLOSED if no separate deleted template is configured.
 */
export async function notifyBuyerOfInquiryDeletedSMS(to: string, inquiryId: string) {
    return sendSMS({
        template_id: process.env.MSG91_TEMPLATE_INQUIRY_DELETED || process.env.MSG91_TEMPLATE_INQUIRY_CLOSED || "SIMULATED",
        recipients: [{ mobiles: to, var: inquiryId }]
    })
}

export async function notifySellerOfInquiryDeletedSMS(to: string, inquiryId: string) {
    return sendSMS({
        template_id: process.env.MSG91_TEMPLATE_INQUIRY_DELETED || process.env.MSG91_TEMPLATE_INQUIRY_CLOSED || "SIMULATED",
        recipients: [{ mobiles: to, var: inquiryId }]
    })
}
