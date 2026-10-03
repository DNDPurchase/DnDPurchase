import { logger } from "@/lib/logger"
import { NextResponse } from "next/server"

const VERIFY_TOKEN = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN || ""

// Meta calls GET to verify the webhook endpoint during setup
export async function GET(req: Request) {
    const { searchParams } = new URL(req.url)
    const mode = searchParams.get("hub.mode")
    const token = searchParams.get("hub.verify_token")
    const challenge = searchParams.get("hub.challenge")

    if (mode === "subscribe" && token === VERIFY_TOKEN) {
        logger.info("WhatsApp webhook verified successfully")
        return new Response(challenge, { status: 200 })
    }

    logger.warn("WhatsApp webhook verification failed", { mode, token })
    return new Response("Forbidden", { status: 403 })
}

// Meta calls POST for every delivery status update and incoming message
export async function POST(req: Request) {
    try {
        const body = await req.json()

        const entry = body?.entry?.[0]
        const changes = entry?.changes?.[0]
        const value = changes?.value

        if (!value) {
            return NextResponse.json({ status: "ok" })
        }

        // Delivery status updates
        if (value.statuses) {
            for (const status of value.statuses) {
                const { id, status: deliveryStatus, timestamp, recipient_id, errors } = status
                if (errors && errors.length > 0) {
                    logger.error("WhatsApp message delivery error", {
                        messageId: id,
                        to: recipient_id,
                        status: deliveryStatus,
                        errorCode: errors[0]?.code,
                        errorTitle: errors[0]?.title,
                    })
                } else {
                    logger.info("WhatsApp delivery status", {
                        messageId: id,
                        to: recipient_id,
                        status: deliveryStatus,
                        timestamp,
                    })
                }
            }
        }

        // Incoming messages (users replying — log only, no action needed)
        if (value.messages) {
            for (const msg of value.messages) {
                logger.info("WhatsApp incoming message received", {
                    from: msg.from,
                    type: msg.type,
                    messageId: msg.id,
                })
            }
        }

        // Always respond 200 quickly — Meta retries if you don't
        return NextResponse.json({ status: "ok" })
    } catch (error) {
        logger.error("WhatsApp webhook processing error", { error: (error as Error).message })
        // Still return 200 to prevent Meta from disabling the webhook
        return NextResponse.json({ status: "ok" })
    }
}
