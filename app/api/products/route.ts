import { NextResponse } from "next/server"
// CEMENT-HIDDEN: import { getProducts } from "@/lib/store"
import { getBuyerProducts } from "@/lib/store" // buyer-facing list (restricted products removed)
import { logger } from "@/lib/logger"

export const revalidate = 0; // Always fetch fresh — admin changes reflect immediately

export async function GET() {
    try {
        // CEMENT-HIDDEN: const products = await getProducts()
        const products = await getBuyerProducts()
        return NextResponse.json(products)
    } catch (error: any) {
        logger.error("Error fetching products", { error: error?.message })
        return NextResponse.json({ error: error.message || "Failed to fetch products" }, { status: 500 })
    }
}
