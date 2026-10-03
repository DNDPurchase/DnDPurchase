import { logger } from "./logger"

const TEST_MODE = process.env.WHATSAPP_TEST_MODE === "true"

const WHATSAPP_API_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN || ""
const WHATSAPP_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID || ""
const WHATSAPP_API_URL = `https://graph.facebook.com/v20.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`

interface TemplateComponent {
    type: "body" | "button"
    parameters: Array<{ type: "text"; text: string }>
    sub_type?: "url"
    index?: string
}

interface WhatsAppPayload {
    to: string
    templateName: string
    variables?: string[]       // ordered body {{1}}, {{2}}, ... values
    urlButtonParams?: string[] // ordered URL button {{1}}, ... values (button index 0)
}

function normalizePhone(raw: string): string {
    let clean = String(raw || "").replace(/\D/g, "")
    if (clean.length === 10) clean = "91" + clean
    else if (clean.length === 11 && clean.startsWith("0")) clean = "91" + clean.slice(1)
    return clean
}

async function sendWhatsAppTemplate(payload: WhatsAppPayload): Promise<{ success: boolean; messageId?: string }> {
    if (TEST_MODE) {
        logger.info("WhatsApp test mode enabled; skipping actual send", { payload })
        return { success: true, messageId: "test-mode-wa-" + Date.now() }
    }

    if (!WHATSAPP_API_TOKEN || !WHATSAPP_PHONE_NUMBER_ID) {
        logger.warn("WhatsApp credentials not configured. Simulating send.", { payload })
        return { success: true, messageId: "simulated-wa-" + Date.now() }
    }

    const cleanPhone = normalizePhone(payload.to)
    if (!/^91\d{10}$/.test(cleanPhone)) {
        logger.error("Refusing to send WhatsApp to malformed number", { raw: payload.to })
        throw new Error(`Invalid phone number format: "${payload.to}"`)
    }

    const components: TemplateComponent[] = []

    if (payload.variables && payload.variables.length > 0) {
        components.push({
            type: "body",
            parameters: payload.variables.map(v => ({ type: "text" as const, text: String(v) })),
        })
    }

    if (payload.urlButtonParams && payload.urlButtonParams.length > 0) {
        components.push({
            type: "button",
            sub_type: "url",
            index: "0",
            parameters: payload.urlButtonParams.map(v => ({ type: "text" as const, text: String(v) })),
        })
    }

    const body: any = {
        messaging_product: "whatsapp",
        to: cleanPhone,
        type: "template",
        template: {
            name: payload.templateName,
            language: { code: "en" },
        }
    }

    if (components.length > 0) {
        body.template.components = components
    }

    try {
        const response = await fetch(WHATSAPP_API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${WHATSAPP_API_TOKEN}`,
            },
            body: JSON.stringify(body),
        })

        const data = await response.json()

        if (!response.ok) {
            const errorCode = data?.error?.code
            const errorMsg = data?.error?.message || JSON.stringify(data)
            logger.error("WhatsApp API error", { status: response.status, code: errorCode, message: errorMsg, to: cleanPhone, template: payload.templateName })
            throw new Error(`WhatsApp API error ${errorCode}: ${errorMsg}`)
        }

        const messageId = data?.messages?.[0]?.id
        logger.info("WhatsApp message sent", { to: cleanPhone, template: payload.templateName, messageId })
        return { success: true, messageId }
    } catch (error) {
        logger.error("Failed to send WhatsApp message", { error: (error as Error).message, to: cleanPhone, template: payload.templateName })
        throw error
    }
}

// ---------------------------------------------------------------------------
// Application-level notification functions
// Drop-in replacements for lib/sms.ts — same signatures
// ---------------------------------------------------------------------------

export async function sendWelcomeSMS(to: string, _name: string) {
    return sendWhatsAppTemplate({
        to,
        templateName: process.env.WHATSAPP_TEMPLATE_WELCOME || "dnd_welcome",
    })
}

export async function notifySellerOfNewInquirySMS(to: string) {
    return sendWhatsAppTemplate({
        to,
        templateName: process.env.WHATSAPP_TEMPLATE_NEW_INQUIRY || "dnd_new_inquiry",
    })
}

export async function notifySellersOfBiddingSMS(to: string, inquiryId: string) {
    return sendWhatsAppTemplate({
        to,
        templateName: process.env.WHATSAPP_TEMPLATE_BIDDING_STARTED || "dnd_bidding_started",
        variables: [inquiryId],
    })
}

export async function notifyBuyerOfNewOfferSMS(to: string, inquiryId: string) {
    return sendWhatsAppTemplate({
        to,
        templateName: process.env.WHATSAPP_TEMPLATE_NEW_OFFER || "dnd_new_offer",
        variables: [inquiryId],
        urlButtonParams: [inquiryId],
    })
}

export async function notifyBuyerOfAcceptanceSMS(to: string, offerId: string) {
    return sendWhatsAppTemplate({
        to,
        templateName: process.env.WHATSAPP_TEMPLATE_OFFER_ACCEPTED_BUYER || "dnd_offer_accepted_buyer",
        variables: [offerId],
    })
}

export async function notifySellerOfAcceptanceSMS(to: string, offerId: string) {
    return sendWhatsAppTemplate({
        to,
        templateName: process.env.WHATSAPP_TEMPLATE_OFFER_ACCEPTED_SELLER || "dnd_offer_accepted_seller",
        variables: [offerId],
    })
}

export async function notifySellerOfRejectionSMS(to: string, offerId: string) {
    return sendWhatsAppTemplate({
        to,
        templateName: process.env.WHATSAPP_TEMPLATE_OFFER_REJECTED_SELLER || "dnd_offer_rejected_seller",
        variables: [offerId],
    })
}

export async function notifyBuyerOfInquiryClosedSMS(to: string, inquiryId: string) {
    return sendWhatsAppTemplate({
        to,
        templateName: process.env.WHATSAPP_TEMPLATE_INQUIRY_CLOSED || "dnd_inquiry_closed",
        variables: [inquiryId],
    })
}

export async function notifySellerOfInquiryClosedSMS(to: string, inquiryId: string) {
    return sendWhatsAppTemplate({
        to,
        templateName: process.env.WHATSAPP_TEMPLATE_INQUIRY_CLOSED || "dnd_inquiry_closed",
        variables: [inquiryId],
    })
}

export async function notifyBuyerOfInquiryDeletedSMS(to: string, inquiryId: string) {
    return sendWhatsAppTemplate({
        to,
        templateName: process.env.WHATSAPP_TEMPLATE_INQUIRY_DELETED || process.env.WHATSAPP_TEMPLATE_INQUIRY_CLOSED || "dnd_inquiry_deleted",
        variables: [inquiryId],
    })
}

export async function notifySellerOfInquiryDeletedSMS(to: string, inquiryId: string) {
    return sendWhatsAppTemplate({
        to,
        templateName: process.env.WHATSAPP_TEMPLATE_INQUIRY_DELETED || process.env.WHATSAPP_TEMPLATE_INQUIRY_CLOSED || "dnd_inquiry_deleted",
        variables: [inquiryId],
    })
}
