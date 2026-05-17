import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses"
import { logger } from "./logger"

// AWS SES Configuration
const REGION = process.env.AWS_REGION || "ap-south-1"
const sesClient = new SESClient({
    region: REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
    }
})

const TEST_MODE = process.env.EMAIL_TEST_MODE === "true"

/**
 * Generic email sender using AWS SES
 */
export async function sendEmail({
    to,
    subject,
    html,
}: {
    to: string
    subject: string
    html: string
}) {
    if (TEST_MODE) {
        logger.info("Test mode enabled; skipping actual email send", { to, subject })
        return { success: true, messageId: "test-mode-email-" + Date.now() }
    }

    if (!process.env.AWS_ACCESS_KEY_ID) {
        logger.warn("AWS_ACCESS_KEY_ID not configured. Simulating email send.", { to, subject })
        return { success: true, simulated: true }
    }

    try {
        const command = new SendEmailCommand({
            Destination: {
                ToAddresses: [to],
            },
            Message: {
                Body: {
                    Html: {
                        Charset: "UTF-8",
                        Data: html,
                    },
                },
                Subject: {
                    Charset: "UTF-8",
                    Data: subject,
                },
            },
            Source: process.env.EMAIL_FROM_ADDRESS || "no-reply@example.com",
        })

        const response = await sesClient.send(command)

        logger.info("Email sent successfully via AWS SES", { to, messageId: response.MessageId })
        return { success: true, messageId: response.MessageId }
    } catch (error) {
        logger.error("Failed to send email via AWS SES", { error: (error as Error).message, to })
        throw error
    }
}

// ----------------------------------------------------------------------------
// Specific Application Emails
// ----------------------------------------------------------------------------

export async function sendWelcomeEmail(to: string, name: string) {
    const subject = "Welcome to DND App!"
    const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #333;">
      <h2>Hello ${name},</h2>
      <p>Welcome to our platform! We're excited to have you on board.</p>
      <p>If you have any questions, feel free to reach out to our support team.</p>
      <p>Best regards,<br/>The DND Team</p>
    </div>
  `
    return sendEmail({ to, subject, html })
}

export async function notifySellerOfNewInquiryEmail(to: string) {
    const subject = "New Inquiry Alert"
    const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #333;">
      <h2>New Inquiry Alert</h2>
      <p>A new inquiry has been posted that matches your categories.</p>
      <p>Log in to your dashboard to view the details and submit an offer.</p>
      <p>Best regards,<br/>The DND Team</p>
    </div>
  `
    return sendEmail({ to, subject, html })
}

export async function notifySellersOfBiddingEmail(to: string, inquiryId: string) {
    const subject = "Bidding Initiated for Draft Inquiry"
    const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #333;">
      <h2>Bidding Started</h2>
      <p>The buyer has finalized Draft Inquiry #${inquiryId} and bidding has started.</p>
      <p>Log in to submit or update your offers before the timer ends!</p>
      <p>Best regards,<br/>The DND Team</p>
    </div>
  `
    return sendEmail({ to, subject, html })
}

export async function notifyBuyerOfNewOfferEmail(to: string, inquiryId: string) {
    const subject = "New Offer Received"
    const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #333;">
      <h2>New Offer!</h2>
      <p>You have received a new offer on Inquiry #${inquiryId}.</p>
      <p>Log in to review all current offers.</p>
      <p>Best regards,<br/>The DND Team</p>
    </div>
  `
    return sendEmail({ to, subject, html })
}

export async function notifyBuyerOfAcceptanceEmail(to: string, offerId: string) {
    const subject = "Offer Accepted Successfully"
    const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #333;">
      <h2>Offer Accepted</h2>
      <p>You have successfully accepted Offer #${offerId}.</p>
      <p>The seller has been notified and you can now communicate directly to finalize the details.</p>
      <p>Best regards,<br/>The DND Team</p>
    </div>
  `
    return sendEmail({ to, subject, html })
}

export async function notifySellerOfAcceptanceEmail(to: string, offerId: string) {
    const subject = "Congratulations! Your Offer was Accepted"
    const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #333;">
      <h2>Offer Accepted!</h2>
      <p>Congratulations! Your Offer #${offerId} has been accepted by the buyer.</p>
      <p>Log in to view the buyer's contact details and proceed with the order.</p>
      <p>Best regards,<br/>The DND Team</p>
    </div>
  `
    return sendEmail({ to, subject, html })
}

export async function notifySellerOfRejectionEmail(to: string, offerId: string) {
    const subject = "Offer Update"
    const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #333;">
      <h2>Offer Status Update</h2>
      <p>Your Offer #${offerId} was not accepted this time.</p>
      <p>Thank you for participating! Check out other active inquiries in your dashboard.</p>
      <p>Best regards,<br/>The DND Team</p>
    </div>
  `
    return sendEmail({ to, subject, html })
}

export async function notifyBuyerOfInquiryClosedEmail(to: string, inquiryId: string) {
    const subject = "Inquiry Closed"
    const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #333;">
      <h2>Inquiry Closed</h2>
      <p>Your Inquiry #${inquiryId} has been closed.</p>
      <p>Thank you for using DND.</p>
      <p>Best regards,<br/>The DND Team</p>
    </div>
  `
    return sendEmail({ to, subject, html })
}

export async function notifySellerOfInquiryClosedEmail(to: string, inquiryId: string) {
    const subject = "Inquiry Closed"
    const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #333;">
      <h2>Inquiry Update</h2>
      <p>The Inquiry #${inquiryId} has been closed by the buyer or system.</p>
      <p>Any pending offers for this inquiry will no longer be considered.</p>
      <p>Best regards,<br/>The DND Team</p>
    </div>
  `
    return sendEmail({ to, subject, html })
}
