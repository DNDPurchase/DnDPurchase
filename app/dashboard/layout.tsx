"use client"

import React from "react"

import { useAuth } from "@/lib/auth-context"
import { DashboardShell } from "@/components/dashboard-shell"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

function DashboardGuard({ children }: { children: React.ReactNode }) {
  const { user, isInitialized } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (isInitialized && !user) {
      router.push("/auth/login")
    }
  }, [user, isInitialized, router])

  // Still reading localStorage — render nothing visible (no flicker)
  if (!isInitialized) {
    return (
      <div className="flex min-h-screen min-h-dvh items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex min-h-screen min-h-dvh items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  return <DashboardShell>{children}</DashboardShell>
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <DashboardGuard>{children}</DashboardGuard>
}
