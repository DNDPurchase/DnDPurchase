import nodemailer from "nodemailer"
import { logger } from "./logger"

// Configuration
const SMTP_USER = process.env.SMTP_USER || "contact@dndpurchase.com"
const SMTP_PASS = process.env.SMTP_PASS || "gukl slbv piec fiao"
const envFrom = process.env.EMAIL_FROM_ADDRESS || SMTP_USER
const EMAIL_FROM_ADDRESS = envFrom.includes('<') ? envFrom : `"DND Purchase" <${envFrom}>`
const TEST_MODE = process.env.EMAIL_TEST_MODE === "true"

// Google Workspace SMTP Configuration
const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true, // true for 465, false for other ports
    auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
    },
})

/**
 * Generic email sender using Google Workspace SMTP
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

    if (!SMTP_USER || !SMTP_PASS) {
        logger.error("SMTP_USER or SMTP_PASS not configured. Cannot send email.", { to, subject })
        throw new Error("SMTP credentials are missing. Please configure them to send emails in production.")
    }

    try {
        const info = await transporter.sendMail({
            from: EMAIL_FROM_ADDRESS,
            to,
            subject,
            html,
        })

        logger.info("Email sent successfully via Google Workspace", { to, messageId: info.messageId })
        return { success: true, messageId: info.messageId }
    } catch (error) {
        logger.error("Failed to send email via Google Workspace", { error: (error as Error).message, to })
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

export async function notifySellerOfNewInquiryEmail(to: string, inquiryId: string, productName: string) {
    const subject = `New Inquiry Alert: ${productName}`
    const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #333;">
      <h2>New Inquiry Alert</h2>
      <p>A new inquiry (#${inquiryId}) for <strong>${productName}</strong> has been posted that matches your categories.</p>
      <p>Log in to your dashboard to view the details and submit an offer.</p>
      <p>Best regards,<br/>The DND Team</p>
    </div>
  `
    return sendEmail({ to, subject, html })
}

export async function notifySellersOfBiddingEmail(to: string, inquiryId: string, productName: string) {
    const subject = `Bidding Initiated for ${productName}`
    const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #333;">
      <h2>Bidding Started</h2>
      <p>The buyer has finalized Draft Inquiry #${inquiryId} for <strong>${productName}</strong> and bidding has started.</p>
      <p>Log in to submit or update your offers before the timer ends!</p>
      <p>Best regards,<br/>The DND Team</p>
    </div>
  `
    return sendEmail({ to, subject, html })
}

export async function notifyBuyerOfNewOfferEmail(to: string, inquiryId: string, productName: string, offerCount: number) {
    const shouldSend = offerCount === 1 || offerCount === 3 || offerCount === 5 || (offerCount >= 10 && offerCount % 10 === 0);
    if (!shouldSend) {
        return { success: true, skipped: true };
    }

    const subject = `New Offers Received on ${productName}`
    const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #333;">
      <h2>Offer Milestone Reached!</h2>
      <p>Your Inquiry #${inquiryId} for <strong>${productName}</strong> has now received <strong>${offerCount} offers</strong>.</p>
      <p>Log in to review all current offers.</p>
      <p>Best regards,<br/>The DND Team</p>
    </div>
  `
    return sendEmail({ to, subject, html })
}

export async function notifyBuyerOfAcceptanceEmail(to: string, offerId: string, inquiryId: string, productName: string) {
    const subject = `Offer Accepted Successfully for ${productName}`
    const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #333;">
      <h2>Offer Accepted</h2>
      <p>You have successfully accepted Offer #${offerId} on Inquiry #${inquiryId} for <strong>${productName}</strong>.</p>
      <p>The seller has been notified and you can now communicate directly to finalize the details.</p>
      <p>Best regards,<br/>The DND Team</p>
    </div>
  `
    return sendEmail({ to, subject, html })
}

export async function notifySellerOfAcceptanceEmail(to: string, offerId: string, inquiryId: string, productName: string) {
    const subject = `Congratulations! Your Offer for ${productName} was Accepted`
    const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #333;">
      <h2>Offer Accepted!</h2>
      <p>Congratulations! Your Offer #${offerId} on Inquiry #${inquiryId} for <strong>${productName}</strong> has been accepted by the buyer.</p>
      <p>Log in to view the buyer's contact details and proceed with the order.</p>
      <p>Best regards,<br/>The DND Team</p>
    </div>
  `
    return sendEmail({ to, subject, html })
}

export async function notifySellerOfRejectionEmail(to: string, offerId: string, inquiryId: string, productName: string) {
    const subject = `Offer Update for ${productName}`
    const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #333;">
      <h2>Offer Status Update</h2>
      <p>Your Offer #${offerId} on Inquiry #${inquiryId} for <strong>${productName}</strong> was not accepted this time.</p>
      <p>Thank you for participating! Check out other active inquiries in your dashboard.</p>
      <p>Best regards,<br/>The DND Team</p>
    </div>
  `
    return sendEmail({ to, subject, html })
}

export async function notifyBuyerOfInquiryClosedEmail(to: string, inquiryId: string, productName: string) {
    const subject = `Inquiry Closed: ${productName}`
    const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #333;">
      <h2>Inquiry Closed</h2>
      <p>Your Inquiry #${inquiryId} for <strong>${productName}</strong> has been closed.</p>
      <p>Thank you for using DND.</p>
      <p>Best regards,<br/>The DND Team</p>
    </div>
  `
    return sendEmail({ to, subject, html })
}

export async function notifySellerOfInquiryClosedEmail(to: string, inquiryId: string, productName: string) {
    const subject = `Inquiry Closed: ${productName}`
    const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #333;">
      <h2>Inquiry Update</h2>
      <p>The Inquiry #${inquiryId} for <strong>${productName}</strong> has been closed by the buyer or system.</p>
      <p>Any pending offers for this inquiry will no longer be considered.</p>
      <p>Best regards,<br/>The DND Team</p>
    </div>
  `
    return sendEmail({ to, subject, html })
}
