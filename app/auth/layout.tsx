"use client"

import React from "react"

import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const { user, isInitialized } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (isInitialized && user) {
      router.push("/dashboard")
    }
  }, [user, isInitialized, router])

  return <>{children}</>
}
