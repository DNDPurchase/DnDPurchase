import { logger } from "@/lib/logger"
import { createInquiry, getAllSellerPhones, getInquiriesByBuyerId, getOpenInquiries, getSellersContactInfoByCategories } from "@/lib/store"
import { notifySellerOfNewInquiryEmail, notifySellersOfBiddingEmail } from "@/lib/email"
import { notifySellerOfNewInquirySMS, notifySellersOfBiddingSMS } from "@/lib/sms"
import { getUserById } from "@/lib/store"
import { NextResponse } from "next/server"

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const buyerId = searchParams.get("buyerId")
    const mode = searchParams.get("mode") // "seller" to get all open

    if (mode === "seller") {
      const inquiries = await getOpenInquiries()
      return NextResponse.json(inquiries)
    }

    if (!buyerId) {
      return NextResponse.json({ error: "buyerId required" }, { status: 400 })
    }

    const inquiries = await getInquiriesByBuyerId(buyerId)
    return NextResponse.json(inquiries)
  } catch (error: any) {
    logger.error("Error fetching inquiries", { error: error?.message })
    return NextResponse.json({ error: error.message || "Failed to fetch inquiries" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { buyerId, buyerName, items, deliveryDetails, biddingDuration, inquiryId } = body

    if (!buyerId || !items || items.length === 0 || !inquiryId) {
      return NextResponse.json({ error: "buyerId, inquiryId, and items required" }, { status: 400 })
    }

    // No longer creating inquiry here directly. Client provides inquiryId.

    // Send notifications to targeted sellers about new inquiry
    try {
      const categories = Array.from(new Set(items.map((item: any) => item.product))) as string[]
      const sellerContacts = await getSellersContactInfoByCategories(categories)

      logger.info("New inquiry created, sending targeted notifications", {
        inquiryId,
        categories,
        targetedSellerCount: sellerContacts.length
      })

      if (sellerContacts.length > 0) {
        logger.debug("Seller contacts for inquiry notification", { count: sellerContacts.length })

        const deadline = new Date();
        if (biddingDuration) {
          deadline.setDate(deadline.getDate() + Number(biddingDuration));
        }

        // Send notifications in parallel
        const promises = sellerContacts.map((contact: any) => {
          const tasks = [];
          if (biddingDuration) {
            if (contact.phone) tasks.push(notifySellersOfBiddingSMS(contact.phone, inquiryId).catch(() => false));
            if (contact.email) tasks.push(notifySellersOfBiddingEmail(contact.email, inquiryId).catch(() => false));
          } else {
            if (contact.phone) tasks.push(notifySellerOfNewInquirySMS(contact.phone).catch(() => false));
            if (contact.email) tasks.push(notifySellerOfNewInquiryEmail(contact.email).catch(() => false));
          }
          return Promise.allSettled(tasks);
        }).flat()

        const results = await Promise.allSettled(promises)
        
        logger.info("New inquiry notifications complete")
      } else {
        logger.warn("No verified sellers found for inquiry notification")
      }
    } catch (notificationError) {
      logger.error("Failed to send notifications for new inquiry", { error: (notificationError as Error)?.message })
      // Don't fail the request
    }

    return NextResponse.json({ success: true }, { status: 201 })
  } catch (error: any) {
    logger.error("Error creating inquiry", { error: error?.message })
    return NextResponse.json({ error: error.message || "Failed to create inquiry" }, { status: 500 })
  }
}
