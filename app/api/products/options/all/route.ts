import { NextResponse } from "next/server"
import { getAllProductOptions } from "@/lib/store"
import { logger } from "@/lib/logger"

export const revalidate = 0; // Always fetch fresh — admin changes reflect immediately

export async function GET() {
    try {
        const options = await getAllProductOptions()
        return NextResponse.json(options)
    } catch (error: any) {
        logger.error("Error fetching all product options", { error: error?.message })
        return NextResponse.json({ error: error.message || "Failed to fetch all product options" }, { status: 500 })
    }
}
