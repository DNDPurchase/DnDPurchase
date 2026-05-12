"use client"

import { ThemeToggle } from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"
import {
  ArrowRight,
  BarChart3,
  CheckCircle,
  Package,
  Shield,
  TrendingUp,
  Users,
  BellOff,
  VolumeX,
  Menu,
  X,
} from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion"
import { getProducts } from "@/lib/store"
import { useEffect, useState, useRef } from "react"

const FEATURES = [
  {
    icon: Shield,
    title: "Verified Suppliers",
    desc: "Every seller is verified via GST or Aadhar before they can quote.",
  },
  {
    icon: TrendingUp,
    title: "Competitive Bidding",
    desc: "Activate bidding to drive prices down and find the best deal.",
  },
  {
    icon: BarChart3,
    title: "Real-time Ranking",
    desc: "Sellers see their competitive rank, encouraging better pricing.",
  },
  {
    icon: Users,
    title: "Multi-item Inquiries",
    desc: "Bundle multiple products in a single inquiry for streamlined procurement.",
  },
]

const STEPS = [
  { step: "01", title: "Register & Verify", desc: "Create your account and complete GST or Aadhar verification." },
  { step: "02", title: "Create Inquiry", desc: "Specify materials, grades, quantities, and delivery terms." },
  { step: "03", title: "Receive Offers", desc: "Verified sellers submit competitive price quotes per unit." },
  { step: "04", title: "Finalize Deal", desc: "Compare offers, activate bidding, and accept the best quote." },
]

export default function LandingPage() {
  const [products, setProducts] = useState<any[]>([])
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const heroRef = useRef(null)

  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"]
  })

  const heroY = useTransform(scrollYProgress, [0, 1], ["0%", "50%"])
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0])

  useEffect(() => {
    getProducts().then(setProducts)
  }, [])

  // CSS variable helpers — keeps JSX clean
  const v = (name: string) => `var(--lp-${name})`

  return (
    <div className="min-h-screen overflow-x-hidden" style={{ backgroundColor: v('bg'), color: v('text') }}>
      {/* Textured background — only visible in dark mode */}
      <div
        className="fixed inset-0 z-0 opacity-0 dark:opacity-100 transition-opacity duration-500"
        style={{
          backgroundImage: 'url(/dark-texture-bg.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />
      {/* Overlay */}
      <div className="fixed inset-0 z-0" style={{ backgroundColor: v('overlay') }} />

      {/* Light mode subtle texture */}
      <div
        className="fixed inset-0 z-0 dark:opacity-0 transition-opacity duration-500"
        style={{
          background: 'radial-gradient(ellipse at top, rgba(255,127,80,0.04), transparent 70%)',
        }}
      />

      {/* ─── Header ─── */}
      <header
        className="sticky top-0 z-50 border-b backdrop-blur-2xl shadow-xl transition-all duration-300"
        style={{ borderColor: v('border'), backgroundColor: v('bg-alt') }}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 md:px-6 md:py-4">
          <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.5 }}
            whileHover={{ scale: 1.05 }}
          >
            <Link href="/" className="flex items-center gap-2 md:gap-3">
              <Image src="/dnd-logo.png" alt="DND Purchase" width={36} height={36} className="rounded-lg md:w-12 md:h-12" />
              <div className="flex flex-col leading-none">
                <span className="font-serif text-base md:text-xl font-bold tracking-tight" style={{ color: v('heading') }}>
                  DND Purchase
                </span>
                <span className="text-[8px] md:text-[10px] font-medium tracking-wider" style={{ color: v('accent') }}>
                  B2B INDUSTRIAL
                </span>
              </div>
            </Link>
          </motion.div>

          <nav className="hidden items-center gap-8 md:flex">
            {["features", "how-it-works", "products"].map((item, i) => (
              <motion.a
                key={item}
                href={`#${item}`}
                initial={{ y: -10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1 * i, duration: 0.5 }}
                className="lp-nav-link text-sm font-medium transition-all relative group"
                style={{ color: v('text') }}
              >
                {item.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 transition-all group-hover:w-full" style={{ backgroundColor: v('accent') }} />
              </motion.a>
            ))}
          </nav>

          {/* Desktop actions */}
          <motion.div
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="hidden md:flex items-center gap-3"
          >
            <ThemeToggle />
            <Button asChild variant="outline" size="sm" className="transition-all hover:opacity-80" style={{ backgroundColor: 'transparent', borderColor: v('outline-btn-border'), color: v('outline-btn-text') }}>
              <Link href="/auth/login">Sign In</Link>
            </Button>
            <Button asChild size="sm" className="shadow-lg hover:-translate-y-0.5 transition-all active:scale-95 font-semibold" style={{ backgroundColor: v('accent'), color: v('cta-text'), boxShadow: `0 4px 20px ${v('accent-glow-strong')}` }}>
              <Link href="/auth/register">Get Started <ArrowRight className="ml-1 h-4 w-4" /></Link>
            </Button>
          </motion.div>

          {/* Mobile actions */}
          <div className="flex items-center gap-2 md:hidden">
            <ThemeToggle />
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg transition-colors"
              style={{ color: v('heading') }}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile menu drawer */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="overflow-hidden md:hidden"
              style={{ borderTop: `1px solid ${v('border')}` }}
            >
              <div className="px-4 py-4 flex flex-col gap-3">
                {["features", "how-it-works", "products"].map((item) => (
                  <a
                    key={item}
                    href={`#${item}`}
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-sm font-medium py-2 px-3 rounded-lg transition-colors"
                    style={{ color: v('text') }}
                  >
                    {item.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                  </a>
                ))}
                <div className="flex flex-col gap-2 pt-2" style={{ borderTop: `1px solid ${v('border')}` }}>
                  <Button asChild variant="outline" size="sm" className="w-full transition-all" style={{ backgroundColor: 'transparent', borderColor: v('outline-btn-border'), color: v('outline-btn-text') }}>
                    <Link href="/auth/login" onClick={() => setMobileMenuOpen(false)}>Sign In</Link>
                  </Button>
                  <Button asChild size="sm" className="w-full shadow-lg transition-all font-semibold" style={{ backgroundColor: v('accent'), color: v('cta-text'), boxShadow: `0 4px 20px ${v('accent-glow-strong')}` }}>
                    <Link href="/auth/register" onClick={() => setMobileMenuOpen(false)}>Get Started <ArrowRight className="ml-1 h-4 w-4" /></Link>
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div
          className="h-1 origin-left"
          style={{ scaleX: scrollYProgress, background: v('scroll-bar') }}
        />
      </header>

      {/* ─── Hero ─── */}
      <section ref={heroRef} className="relative min-h-[90vh] flex items-center overflow-hidden z-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `linear-gradient(to right, ${v('grid-line')} 1px, transparent 1px), linear-gradient(to bottom, ${v('grid-line')} 1px, transparent 1px)`,
          backgroundSize: '6rem 6rem',
        }} />

        {/* Floating glow orbs */}
        <motion.div
          animate={{ y: [0, -20, 0], opacity: [`var(--lp-orb-opacity-min)`, `var(--lp-orb-opacity-max)`, `var(--lp-orb-opacity-min)`] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[10%] left-[5%] w-64 h-64 rounded-full blur-3xl pointer-events-none"
          style={{ backgroundColor: v('accent') }}
        />
        <motion.div
          animate={{ y: [0, 30, 0], opacity: [`var(--lp-orb-opacity-min)`, `var(--lp-orb-opacity-max)`, `var(--lp-orb-opacity-min)`] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-[20%] right-[10%] w-96 h-96 rounded-full blur-3xl pointer-events-none"
          style={{ backgroundColor: v('accent') }}
        />

        <motion.div style={{ y: heroY, opacity: heroOpacity }} className="relative mx-auto max-w-7xl px-6 py-24 md:py-36 w-full">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 2, ease: "easeOut" }}
            className="mx-auto max-w-3xl text-center"
          >
            {/* Hero logo — Custom Text */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, duration: 2, ease: "easeOut" }}
              className="mb-8 flex flex-col items-center justify-center select-none"
            >
              <div 
                className="flex items-center text-[8rem] sm:text-[11rem] md:text-[14rem] leading-none font-serif font-bold tracking-tighter drop-shadow-sm dark:drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)]" 
              >
                <span className="relative inline-flex items-center justify-center">
                  <span className="bg-gradient-to-b from-black to-neutral-700 bg-clip-text text-transparent dark:from-white dark:via-neutral-400 dark:to-neutral-600">D</span>
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.8, duration: 2, ease: "easeOut" }}
                    className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none translate-x-[20%] translate-y-[5%]"
                  >
                    <BellOff className="w-6 h-6 sm:w-9 sm:h-9 md:w-11 md:h-11" style={{ marginLeft: '25px', color: v('accent'), filter: `drop-shadow(0 0 15px ${v('accent')}) drop-shadow(0 0 5px ${v('accent')})` }} strokeWidth={2.5} />
                  </motion.div>
                </span>
                <span className="bg-gradient-to-b from-black to-neutral-700 bg-clip-text text-transparent dark:from-white dark:via-neutral-400 dark:to-neutral-600">N</span>
                <span className="relative inline-flex items-center justify-center">
                  <span className="bg-gradient-to-b from-black to-neutral-700 bg-clip-text text-transparent dark:from-white dark:via-neutral-400 dark:to-neutral-600">D</span>
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 1.0, duration: 2, ease: "easeOut" }}
                    className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none translate-x-[20%] translate-y-[5%]"
                  >
                    <VolumeX className="w-6 h-6 sm:w-9 sm:h-9 md:w-11 md:h-11" style={{marginLeft: '25px', color: v('accent'), filter: `drop-shadow(0 0 15px ${v('accent')}) drop-shadow(0 0 5px ${v('accent')})` }} strokeWidth={2.5} />
                  </motion.div>
                </span>
              </div>
              <div 
                className="text-4xl sm:text-5xl md:text-6xl font-serif mt-2 tracking-tight bg-gradient-to-b from-black to-neutral-700 bg-clip-text text-transparent dark:from-white dark:via-neutral-400 dark:to-neutral-600 drop-shadow-sm dark:drop-shadow-[0_8px_15px_rgba(0,0,0,0.4)]" 
              >
                Purchase
              </div>
            </motion.div>

            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.6, duration: 1.5, ease: "easeOut" }}
              className="mb-6 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm"
              style={{ border: `1px solid ${v('badge-border')}`, backgroundColor: v('badge-bg'), color: v('accent') }}
            >
              <CheckCircle className="h-4 w-4" />
              Trusted by 500+ verified businesses
            </motion.div>

            <h1 className="text-balance font-serif text-4xl font-bold leading-tight tracking-tight md:text-6xl" style={{ color: v('heading') }}>
              Industrial Raw Materials, <br />
              <span className="italic" style={{ color: v('accent') }}>Precision Pricing</span>
            </h1>

            <p className="mt-6 text-pretty text-lg leading-relaxed md:text-xl" style={{ color: v('text-muted') }}>
              Connect with verified buyers and sellers of Steel, Cement, TMT Rebars and more.
              Get competitive quotes through our transparent inquiry-to-offer workflow.
            </p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.0, duration: 1.5, ease: "easeOut" }}
              className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row"
            >
              <Button asChild size="lg" className="gap-2 px-8 text-base group relative overflow-hidden font-semibold" style={{ backgroundColor: v('accent'), color: v('cta-text'), boxShadow: `0 4px 30px ${v('accent-glow-strong')}` }}>
                <Link href="/auth/register" className="relative z-10">
                  Start as Buyer <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="gap-2 px-8 text-base transition-all active:scale-95" style={{ backgroundColor: 'transparent', borderColor: v('outline-btn-border'), color: v('outline-btn-text') }}>
                <Link href="/auth/register">Register as Seller</Link>
              </Button>
            </motion.div>
          </motion.div>
        </motion.div>
      </section>

      {/* ─── Features ─── */}
      <section id="features" className="relative mx-auto max-w-7xl px-6 py-24 overflow-hidden z-10">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          className="mx-auto mb-16 max-w-2xl text-center"
        >
          <div className="inline-flex items-center rounded-full px-3 py-1 text-sm mb-6" style={{ border: `1px solid ${v('badge-border')}`, backgroundColor: v('badge-bg'), color: v('accent') }}>
            <span className="flex h-2 w-2 rounded-full mr-2 animate-pulse" style={{ backgroundColor: v('accent') }} />
            Why Choose Us
          </div>
          <h2 className="text-balance font-serif text-4xl font-bold tracking-tight md:text-5xl" style={{ color: v('heading') }}>
            Built for Industrial Procurement
          </h2>
          <p className="mt-6 text-pretty text-lg leading-relaxed" style={{ color: v('text-muted') }}>
            Every feature is designed to bring transparency and efficiency to B2B raw material sourcing.
          </p>
        </motion.div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15, duration: 1.5, ease: "easeOut" }}
              whileHover={{ y: -5, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="group relative overflow-hidden rounded-2xl p-6 backdrop-blur-xl transition-all duration-300 h-full hover:shadow-2xl" style={{ border: `1px solid ${v('border')}`, backgroundColor: v('surface') }}>
                <div className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100" style={{ background: `linear-gradient(to bottom right, ${v('surface-hover')}, transparent)` }} />
                <div className="relative z-10">
                  <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-xl shadow-inner transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3" style={{ background: v('icon-bg'), color: v('accent') }}>
                    <f.icon className="h-7 w-7 drop-shadow-sm" />
                  </div>
                  <h3 className="font-serif text-xl font-semibold tracking-tight mb-3 transition-colors" style={{ color: v('heading') }}>{f.title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: v('text-muted') }}>{f.desc}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ─── How it Works ─── */}
      <section id="how-it-works" className="relative z-10" style={{ borderTop: `1px solid ${v('border')}`, borderBottom: `1px solid ${v('border')}`, backgroundColor: v('surface') }}>
        <div className="absolute inset-0" style={{ background: `radial-gradient(ellipse at bottom, ${v('accent-glow')}, transparent, transparent)` }} />
        <div className="relative mx-auto max-w-7xl px-6 py-24">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            className="mx-auto mb-16 max-w-2xl text-center"
          >
            <h2 className="text-balance font-serif text-4xl font-bold tracking-tight md:text-5xl" style={{ color: v('heading') }}>
              How It Works
            </h2>
            <p className="mt-6 text-pretty text-lg leading-relaxed" style={{ color: v('text-muted') }}>
              From registration to deal finalization in four simple steps.
            </p>
          </motion.div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((s, i) => (
              <motion.div
                key={s.step}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.2, duration: 1.5, ease: "easeOut" }}
                className="group relative overflow-hidden rounded-2xl p-8 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl"
                style={{ border: `1px solid ${v('border')}`, backgroundColor: v('surface') }}
              >
                <div className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100" style={{ background: `linear-gradient(to bottom right, ${v('surface-hover')}, transparent)` }} />
                <div className="relative z-10">
                  <div className="mb-6 font-serif text-5xl font-extrabold transition-colors duration-300" style={{ color: v('step-num') }}>{s.step}</div>
                  <h3 className="font-serif text-xl font-semibold mb-3 transition-colors" style={{ color: v('heading') }}>{s.title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: v('text-muted') }}>{s.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Products ─── */}
      <section id="products" className="relative mx-auto max-w-7xl px-6 py-32 overflow-hidden z-10">
        <div className="absolute inset-0 -z-10" style={{ background: `radial-gradient(ellipse at top, ${v('accent-glow')}, transparent, transparent)` }} />
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          className="mx-auto mb-20 max-w-2xl text-center"
        >
          <div className="inline-flex items-center rounded-full px-3 py-1 text-sm mb-6" style={{ border: `1px solid ${v('badge-border')}`, backgroundColor: v('badge-bg'), color: v('accent') }}>
            <span className="flex h-2 w-2 rounded-full mr-2 animate-pulse" style={{ backgroundColor: v('accent') }} />
            Available Now
          </div>
          <h2 className="text-balance font-serif text-4xl font-bold tracking-tight md:text-5xl" style={{ color: v('heading') }}>
            Product Categories
          </h2>
          <p className="mt-6 text-pretty text-lg leading-relaxed" style={{ color: v('text-muted') }}>
            Source from a comprehensive catalog of high-quality industrial raw materials, directly from verified manufacturers.
          </p>
        </motion.div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {products.map((p, i) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 1.5, ease: "easeOut" }}
              whileHover={{ scale: 1.02, y: -5 }}
            >
              <Link href="/auth/login">
                <div className="group relative flex flex-col overflow-hidden rounded-2xl backdrop-blur-xl transition-all duration-300 h-full hover:shadow-2xl" style={{ border: `1px solid ${v('border')}`, backgroundColor: v('surface') }}>
                  <div className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100 pointer-events-none" style={{ background: `linear-gradient(to bottom right, ${v('surface-hover')}, transparent)` }} />
                  
                  {/* Top Image Section */}
                  <div className="aspect-[4/3] relative flex items-center justify-center overflow-hidden bg-white dark:bg-white/5 border-b" style={{ borderColor: v('border') }}>
                    {p.image_url ? (
                      <Image
                        src={p.image_url}
                        alt={p.name}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                        className="object-contain p-6 group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="flex h-16 w-16 items-center justify-center rounded-xl shadow-inner transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3" style={{ background: v('icon-bg'), color: v('accent') }}>
                        <Package className="h-8 w-8 drop-shadow-sm" />
                      </div>
                    )}
                  </div>
                  
                  {/* Bottom Text Section */}
                  <div className="relative flex flex-col flex-1 p-6 z-10">
                    <h3 className="text-xl font-semibold tracking-tight mb-2 transition-colors line-clamp-2" style={{ color: v('heading') }}>
                      {p.name}
                    </h3>
                    <div className="mt-auto pt-4 flex items-center text-sm font-medium transition-colors" style={{ color: v('accent') }}>
                      <span>Explore category</span>
                      <ArrowRight className="ml-2 h-4 w-4 translate-x-0 transition-transform duration-300 opacity-0 group-hover:opacity-100 group-hover:translate-x-1" />
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="relative overflow-hidden z-10" style={{ borderTop: `1px solid ${v('border')}`, background: v('cta-section-bg') }}>
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-0 left-0 w-full h-full pointer-events-none"
          style={{ background: 'radial-gradient(circle at center, rgba(255,255,255,0.15), transparent, transparent)' }}
        />
        <div className="mx-auto max-w-7xl px-6 py-20 text-center relative z-10">
          <motion.h2
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            className="text-balance font-serif text-3xl font-bold md:text-4xl"
            style={{ color: v('cta-section-text') }}
          >
            Ready to Transform Your Procurement?
          </motion.h2>
          <p className="mt-4" style={{ color: v('cta-section-sub') }}>
            Join hundreds of verified businesses already sourcing smarter.
          </p>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button asChild size="lg" className="mt-8 gap-2 px-8 text-base shadow-xl transition-all font-semibold" style={{ backgroundColor: v('cta-btn-bg'), color: v('cta-btn-text') }}>
              <Link href="/auth/register">Create Free Account <ArrowRight className="h-4 w-4" /></Link>
            </Button>
          </motion.div>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="z-10 relative" style={{ borderTop: `1px solid ${v('border')}`, backgroundColor: v('footer-bg') }}>
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 py-8 sm:flex-row">
          <motion.div
            whileHover={{ scale: 1.1, rotate: 2 }}
            transition={{ type: "spring", stiffness: 400, damping: 10 }}
          >
            <Link href="/" className="flex items-center gap-2.5">
              <Image src="/dnd-logo.png" alt="DND Purchase" width={32} height={32} className="rounded-md" />
              <span className="font-serif text-lg font-bold tracking-tight" style={{ color: v('heading') }}>
                DND Purchase
              </span>
            </Link>
          </motion.div>
          <p className="text-sm" style={{ color: v('text-muted') }}>
            &copy; {new Date().getFullYear()} DND Purchase. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}
