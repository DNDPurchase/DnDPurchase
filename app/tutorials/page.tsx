"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  ArrowLeft,
  Play,
  Clock,
  User,
  ShieldCheck,
  Film,
  X,
  Volume2,
  VolumeX,
  Maximize,
  HelpCircle,
} from "lucide-react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { useAuth } from "@/lib/auth-context"

// Safe import of Firebase URLs if they exist
let firebaseVideoUrls = {
  landingPage: "/videos/landing-page.mp4",
  buyer: "/videos/buyer.mp4",
  seller: "/videos/seller.mp4",
}

try {
  const customUrls = require("@/lib/video-urls.json")
  firebaseVideoUrls = { ...firebaseVideoUrls, ...customUrls }
} catch (e) {
  // Use fallback local paths
}

interface Tutorial {
  id: string
  title: string
  subtitle: string
  duration: string
  role: string
  videoUrl: string
  thumbnailGradient: string
  description: string
  learnPoints: string[]
  chapters: { time: string; title: string }[]
}

const TUTORIALS: Tutorial[] = [
  {
    id: "overview",
    title: "Platform Overview",
    subtitle: "Learn the core value proposition of DND Purchase",
    duration: "2:02",
    role: "Everyone",
    videoUrl: firebaseVideoUrls.landingPage,
    thumbnailGradient: "from-rose-500/20 via-red-600/10 to-transparent",
    description: "A complete tour of the DND Purchase marketplace. Discover how we eliminate telemarketing spam and secure the best prices for steel and cement in just 2 simple steps.",
    learnPoints: [
      "Understand the 'No Call' negotiation philosophy",
      "Navigate product categories",
      "Overview of the 2-step bidding system",
      "Saves up to 3% on average procurement costs",
    ],
    chapters: [
      { time: "0:00", title: "Introduction to DND Purchase" },
      { time: "0:30", title: "How to Contact for Support" },
      { time: "0:50", title: "Creating your first Account" },

    ],
  },
  {
    id: "buyer",
    title: "Buyer Walkthrough",
    subtitle: "Master the buying workflow from inquiry to bid win",
    duration: "4:36",
    role: "Buyers",
    videoUrl: firebaseVideoUrls.buyer,
    thumbnailGradient: "from-blue-500/20 via-indigo-600/10 to-transparent",
    description: "Step-by-step instructions for buyers. Learn how to create inquiries, compare quotes from verified sellers, and use the automated real-time bidding screen to negotiate the best price.",
    learnPoints: [
      "Submit structured inquiries with specific sub-product parameters",
      "Track and review incoming seller quotes",
      "Launch and control the real-time bidding process",
      "Submit and finalize winning offers",
    ],
    chapters: [
      { time: "0:00", title: "Accessing the Buyer dashboard" },
      { time: "0:50", title: "Creating a new Procurement Inquiry" },
      { time: "2:50", title: "Initiating Bidding for the lowest price" },
      { time: "4:00", title: "Closing the deal & next steps" },
    ],
  },
  {
    id: "seller",
    title: "Seller Walkthrough",
    subtitle: "Learn how to find leads, submit quotes & win bids",
    duration: "5:18",
    role: "Sellers",
    videoUrl: firebaseVideoUrls.seller,
    thumbnailGradient: "from-emerald-500/20 via-teal-600/10 to-transparent",
    description: "Complete guide for verified sellers. Learn how to set up your catalog, receive instant lead notifications, submit official quotes, and participate in bidding to win orders without phone calls.",
    learnPoints: [
      "Configure your products and business location scope",
      "Find pending buyer inquiries matching your categories",
      "Submit formal quotation sheets (PDF/Image support)",
      "Bid dynamically in the real-time bargaining console",
    ],
    chapters: [
      { time: "0:00", title: "Welcome to DND Purchase" },
      { time: "0:20", title: "Setting up your Seller profile & catalog" },
      { time: "1:10", title: "Setting up My Products" },
      { time: "2:20", title: "Submitting quotes & uploading document sheets" },
      { time: "3:10", title: "Participating in active bidding rounds" },
      { time: "4:40", title: "Reviewing history & performance stats" },
    ],
  },
]

export default function TutorialsPage() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<"all" | "everyone" | "buyers" | "sellers">("all")
  const [selectedTutorial, setSelectedTutorial] = useState<Tutorial | null>(null)

  const v = (name: string) => `var(--lp-${name})`

  // Filter tutorials based on tab selection
  const filteredTutorials = TUTORIALS.filter((t) => {
    if (activeTab === "all") return true
    return t.role.toLowerCase() === activeTab
  })

  // Prevent scroll when video modal is open
  useEffect(() => {
    if (selectedTutorial) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = "unset"
    }
    return () => {
      document.body.style.overflow = "unset"
    }
  }, [selectedTutorial])

  return (
    <div className="min-h-screen pb-20 relative overflow-hidden" style={{ backgroundColor: v("bg"), color: v("text") }}>
      {/* Textured background */}
      <div
        className="fixed inset-0 z-0 opacity-40 pointer-events-none"
        style={{
          backgroundImage: "url(/dark-texture-bg.png)",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />
      {/* Grid overlay */}
      <div
        className="absolute inset-0 z-0 pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(to right, ${v("grid-line")} 1px, transparent 1px), linear-gradient(to bottom, ${v("grid-line")} 1px, transparent 1px)`,
          backgroundSize: "6rem 6rem",
        }}
      />

      {/* Red ambient light glow */}
      <div className="absolute top-[-10%] left-[50%] -translate-x-1/2 w-[600px] h-[300px] bg-red-600/10 rounded-full blur-[120px] pointer-events-none -z-10" />

      {/* Header */}
      <header className="sticky top-0 z-40 border-b backdrop-blur-2xl transition-all duration-300" style={{ borderColor: v("border"), backgroundColor: v("bg-alt") }}>
        <div className="flex items-center justify-between px-4 py-4 md:px-8 max-w-7xl mx-auto">
          <div className="flex items-center gap-4">
            <Button asChild variant="ghost" size="sm" className="text-muted-foreground hover:text-white transition-colors gap-2">
              <Link href={user ? "/dashboard" : "/"}>
                <ArrowLeft className="h-4 w-4" />
                Back
              </Link>
            </Button>
            <div className="h-4 w-[1px] bg-white/10 hidden sm:block" />
            <Link href="/" className="items-center gap-2 select-none hidden sm:flex">
              <img src="/logo-asset-4.png" alt="DND Purchase" className="h-10 w-auto object-contain" />
            </Link>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-glow-red bg-red-500/10 border border-red-500/20 px-3 py-1.5 rounded-full">
              Video Tutorials
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 md:px-8 mt-12">
        {/* Title Block */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-metallic">
            Learn DND Purchase
          </h1>
          <p className="mt-3 text-lg md:text-xl font-medium text-metallic-muted">
            Everything you need to know to buy and sell steel & cement in minutes, with zero spam calls.
          </p>
        </div>

        {/* Filters */}
        <div className="flex justify-center mb-10">
          <div className="inline-flex rounded-xl p-1 bg-black/40 border border-white/5 backdrop-blur-lg">
            {(["all", "everyone", "buyers", "sellers"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-5 py-2.5 rounded-lg text-sm font-semibold capitalize transition-all ${
                  activeTab === tab
                    ? "bg-red-600 text-white shadow-lg shadow-red-600/20"
                    : "text-muted-foreground hover:text-white"
                }`}
              >
                {tab === "everyone" ? "Platform Overview" : tab}
              </button>
            ))}
          </div>
        </div>

        {/* Tutorials Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <AnimatePresence mode="popLayout">
            {filteredTutorials.map((tutorial, index) => (
              <motion.div
                key={tutorial.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="flex flex-col rounded-2xl overflow-hidden card-glossy shadow-2xl h-full group"
                style={{ border: `1px solid ${v("border")}` }}
              >
                {/* Visual Thumbnail */}
                <div
                  className={`aspect-video w-full relative flex items-center justify-center bg-black overflow-hidden border-b border-white/5 cursor-pointer`}
                  onClick={() => setSelectedTutorial(tutorial)}
                >
                  {/* Subtle inner background glow */}
                  <div className={`absolute inset-0 bg-gradient-to-tr ${tutorial.thumbnailGradient} opacity-70 group-hover:scale-105 transition-transform duration-500`} />

                  {/* Play Button Overlay */}
                  <div className="relative z-10 w-16 h-16 rounded-full bg-red-600 flex items-center justify-center text-white shadow-xl shadow-red-600/30 group-hover:scale-110 transition-transform duration-300">
                    <Play className="h-8 w-8 fill-current ml-1" />
                  </div>

                  {/* Duration Badge */}
                  <div className="absolute bottom-3 right-3 bg-black/75 backdrop-blur-md px-2.5 py-1 rounded-md text-xs font-bold text-white flex items-center gap-1.5 border border-white/5">
                    <Clock className="h-3.5 w-3.5" />
                    {tutorial.duration}
                  </div>

                  {/* Role Badge */}
                  <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-md px-3 py-1 rounded-md text-xs font-bold text-white uppercase tracking-wider border border-white/5">
                    {tutorial.role}
                  </div>
                </div>

                {/* Content */}
                <div className="p-6 flex flex-col flex-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-red-500 mb-1.5 block">
                    Tutorial Guide
                  </span>
                  <h3 className="text-2xl font-black text-white group-hover:text-red-400 transition-colors">
                    {tutorial.title}
                  </h3>
                  <p className="text-sm font-semibold opacity-60 mt-1.5 mb-4 line-clamp-2">
                    {tutorial.subtitle}
                  </p>

                  <p className="text-sm leading-relaxed mb-6" style={{ color: v("text") }}>
                    {tutorial.description}
                  </p>

                  {/* Learn Points */}
                  <div className="mt-auto space-y-2.5 border-t border-white/5 pt-5">
                    <p className="text-xs font-black uppercase tracking-wider text-metallic-muted mb-2">What you will learn:</p>
                    {tutorial.learnPoints.map((point, i) => (
                      <div key={i} className="flex gap-2.5 items-start text-xs font-semibold text-white/95">
                        <ShieldCheck className="h-4.5 w-4.5 text-red-500 shrink-0 stroke-[2.5]" />
                        <span>{point}</span>
                      </div>
                    ))}
                  </div>

                  {/* Action Button */}
                  <Button
                    onClick={() => setSelectedTutorial(tutorial)}
                    className="w-full mt-6 gap-2 bg-neutral-900 border border-white/10 hover:bg-neutral-800 text-white font-bold h-11 rounded-xl transition-all"
                  >
                    <Film className="h-4 w-4" />
                    Watch Tutorial
                  </Button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </main>

      {/* Cinematic Modal Player */}
      <AnimatePresence>
        {selectedTutorial && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-xl p-4 md:p-8"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="relative w-full max-w-5xl rounded-3xl bg-neutral-950 border border-white/10 overflow-hidden shadow-2xl flex flex-col md:grid md:grid-cols-12 md:h-[650px]"
            >
              {/* Left Column: Video Player */}
              <div className="relative md:col-span-8 bg-black flex items-center justify-center aspect-video md:aspect-auto md:h-full">
                <video
                  src={selectedTutorial.videoUrl}
                  controls
                  autoPlay
                  playsInline
                  className="w-full h-full object-contain md:max-h-full"
                />
              </div>

              {/* Right Column: Chapters & Details */}
              <div className="md:col-span-4 p-6 md:p-8 flex flex-col h-full border-t md:border-t-0 md:border-l border-white/10 bg-neutral-900/40 overflow-y-auto">
                <div className="flex justify-between items-start gap-4 mb-4">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-red-500">
                      {selectedTutorial.role} Guide
                    </span>
                    <h2 className="text-2xl font-black text-white mt-1">
                      {selectedTutorial.title}
                    </h2>
                  </div>
                  <button
                    onClick={() => setSelectedTutorial(null)}
                    className="p-2 rounded-full hover:bg-white/10 transition-colors text-white/70 hover:text-white"
                    aria-label="Close video player"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>

                <p className="text-sm leading-relaxed mb-6 text-white/70">
                  {selectedTutorial.description}
                </p>

                {/* Chapters list */}
                <div className="flex-1">
                  <h4 className="text-xs font-black uppercase tracking-wider text-metallic-muted mb-3.5">
                    Chapters
                  </h4>
                  <div className="space-y-3">
                    {selectedTutorial.chapters.map((chapter, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-3.5 p-2 rounded-lg hover:bg-white/5 transition-colors border border-transparent hover:border-white/5"
                      >
                        <span className="text-xs font-black text-red-500 bg-red-500/10 px-2 py-1 rounded-md shrink-0">
                          {chapter.time}
                        </span>
                        <span className="text-sm font-semibold text-white/90">
                          {chapter.title}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-8 pt-4 border-t border-white/5 text-xs text-white/40 flex items-center gap-2">
                  <HelpCircle className="h-4 w-4" />
                  <span>Struggling? Contact contact@dndpurchase.com</span>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
