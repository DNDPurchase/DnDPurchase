"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { ArrowLeft, Building2, CheckCircle2, ChevronDown, ChevronRight, CreditCard, Factory, FileText, Loader2, MapPin, Package, ShieldCheck, Upload, User, XCircle, Eye, EyeOff, Pencil, Plus, Circle, Layers, Globe, Save, AlertCircle, X } from "lucide-react"
import Link from "next/link"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useRouter } from "next/navigation"
import { useRef, useState } from "react"
import { toast } from "sonner"
import { auth, storage } from "@/lib/firebase"
import { createUserWithEmailAndPassword } from "firebase/auth"
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"
import { logger } from "@/lib/logger"
import { useAuth } from "@/lib/auth-context"

import { useEffect } from "react"


export default function RegisterPage() {
  const router = useRouter()
  const { register } = useAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const [uploadingFile, setUploadingFile] = useState(false)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [uploadedFilePath, setUploadedFilePath] = useState("")
  const [uploadingAadhaar, setUploadingAadhaar] = useState(false)
  const [aadhaarFile, setAadhaarFile] = useState<File | null>(null)
  const [aadhaarFilePath, setAadhaarFilePath] = useState("")
  const aadhaarInputRef = useRef<HTMLInputElement>(null)

  // Product & Location selection state (for seller/both registration)
  const [availableProducts, setAvailableProducts] = useState<{ id: string; name: string; sub_products?: string[] }[]>([])
  const [locations, setLocations] = useState<any[]>([])
  const [selectedProducts, setSelectedProducts] = useState<string[]>([])
  const [selectedLocations, setSelectedLocations] = useState<Record<string, string[]>>({})
  const [expandedStates, setExpandedStates] = useState<string[]>([])
  const [loadingProductsLocations, setLoadingProductsLocations] = useState(false)

  const [allOptions, setAllOptions] = useState<Record<string, any[]>>({})
  const [sellerProductOptions, setSellerProductOptions] = useState<Record<string, any[]>>({})
  const [tempProductOptions, setTempProductOptions] = useState<Record<string, any>>({})
  const [tempProductItems, setTempProductItems] = useState<Record<string, any[]>>({})
  const [editingItemIndex, setEditingItemIndex] = useState<Record<string, number | null>>({})
  const [expandedProducts, setExpandedProducts] = useState<string[]>([])
  const [tempLocations, setTempLocations] = useState<Record<string, string[]>>({})

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    company: "",
    role: "buyer" as "buyer" | "seller" | "both",
    entityType: "company" as "company" | "individual" | "both",
    aadhaarNumber: "",
    gstin: "",
    documentPath: "",
    aadhaarDocumentPath: "",
    selectedCategories: [] as string[],
    productManufacturers: {} as Record<string, string[]>,
    availableLocations: {} as Record<string, string[]>,
  })

  const updateForm = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))

  }



  // Fetch products and locations for the seller registration step
  const fetchProductsAndLocations = async () => {
    if (availableProducts.length > 0 && locations.length > 0) return
    setLoadingProductsLocations(true)
    try {
      const { getProducts, getAllSellerProductOptions } = await import("@/lib/store")
      const [productsData, optsData, locRes] = await Promise.all([
        getProducts(),
        getAllSellerProductOptions(),
        fetch("/api/locations")
      ])
      setAvailableProducts(productsData)
      setAllOptions(optsData)
      if (locRes.ok) {
        const locData = await locRes.json()
        setLocations(locData)
      }
    } catch (err) {
      toast.error("Failed to load products and locations")
    } finally {
      setLoadingProductsLocations(false)
    }
  }

  const validateProduct = (catName: string, options: Record<string, any>) => {
    const productObj = availableProducts.find(p => p.name === catName)
    if (!productObj) return null

    if (productObj.sub_products && productObj.sub_products.length > 0) {
      const subs = options["Sub-Products"]
      if (!subs || (Array.isArray(subs) ? subs.length === 0 : !subs.trim())) {
        return `Please select a sub-product for ${catName}`
      }
    }

    const pOptions = allOptions[productObj.id] || []
    for (const opt of pOptions) {
      if (opt.seller_option_type !== "none" && opt.seller_option_type !== "table") {
        const val = options[opt.option_name]
        if (!val || (Array.isArray(val) && val.length === 0)) {
          return `Please select at least one ${opt.option_name} for ${catName}`
        }
      }
    }
    return null
  }

  const handleAddItem = (catName: string) => {
    const options = tempProductOptions[catName] || {}
    const error = validateProduct(catName, options)
    if (error) {
      toast.error(error)
      return
    }

    const items = tempProductItems[catName] || []
    const updatedItems = [...items, { ...options }]
    
    setTempProductItems(prev => ({ ...prev, [catName]: updatedItems }))
    setSellerProductOptions(prev => ({ ...prev, [catName]: updatedItems }))
    setTempProductOptions(prev => ({ ...prev, [catName]: {} }))
  }

  const handleUpdateItem = (catName: string) => {
    const idx = editingItemIndex[catName]
    if (idx === undefined || idx === null) return

    const options = tempProductOptions[catName] || {}
    const error = validateProduct(catName, options)
    if (error) {
      toast.error(error)
      return
    }

    const items = [...(tempProductItems[catName] || [])]
    items[idx] = { ...options }

    setTempProductItems(prev => ({ ...prev, [catName]: items }))
    setSellerProductOptions(prev => ({ ...prev, [catName]: items }))
    setEditingItemIndex(prev => ({ ...prev, [catName]: null }))
    setTempProductOptions(prev => ({ ...prev, [catName]: {} }))
    toast.success("Configuration updated.")
  }

  const getSafeItemsArray = (data: any): any[] => {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    if (typeof data === 'object' && Object.keys(data).length > 0) return [data];
    return [];
  }

  const validateAllProductsBeforeSubmit = () => {
    for (const prodName of selectedProducts) {
      const productObj = availableProducts.find(p => p.name === prodName)
      if (!productObj) continue

      const hasSubProducts = !!(productObj.sub_products && productObj.sub_products.length > 0)
      const isMultiConfig = prodName === "Stock of non-standard Color-coated coils/sheets"

      if (isMultiConfig) {
        const items = sellerProductOptions[prodName] || []
        if (items.length === 0) {
          return `Please add at least one configuration variant for product "${prodName}"`
        }
        for (const item of items) {
          const error = validateProduct(prodName, item)
          if (error) return error
        }
      } else {
        const currentConfig = sellerProductOptions[prodName]?.[0]
        if (!currentConfig) {
          return `Please select options for product "${prodName}"`
        }
        const error = validateProduct(prodName, currentConfig)
        if (error) return error
      }
    }
    return null
  }

  const toggleProductExpand = (catName: string) => {
    const productObj = availableProducts.find(p => p.name === catName)
    if (!productObj) return

    const hasSubProducts = !!(productObj.sub_products && productObj.sub_products.length > 0)
    const isMultiConfig = catName === "Stock of non-standard Color-coated coils/sheets"

    const isExpanding = !expandedProducts.includes(catName)
    if (isExpanding) {
      if (isMultiConfig) {
        setTempProductItems(prev => ({ ...prev, [catName]: sellerProductOptions[catName] || [] }))
        setTempProductOptions(prev => ({ ...prev, [catName]: {} }))
      } else {
        setTempProductOptions(prev => ({ ...prev, [catName]: sellerProductOptions[catName]?.[0] || {} }))
      }
      setExpandedProducts(prev => [...prev, catName])
    } else {
      setExpandedProducts(prev => prev.filter(c => c !== catName))
    }
  }

  const saveProduct = (catName: string) => {
    const productObj = availableProducts.find(p => p.name === catName)
    if (!productObj) return

    const hasSubProducts = !!(productObj.sub_products && productObj.sub_products.length > 0)
    const isMultiConfig = catName === "Stock of non-standard Color-coated coils/sheets"

    if (isMultiConfig) {
      // If there are unsaved inputs in tempProductOptions, try to add them if they are valid
      const currentOpts = tempProductOptions[catName] || {}
      if (Object.keys(currentOpts).length > 0) {
        const error = validateProduct(catName, currentOpts)
        if (!error) {
          const items = tempProductItems[catName] || []
          const updatedItems = [...items, { ...currentOpts }]
          setTempProductItems(prev => ({ ...prev, [catName]: updatedItems }))
          setSellerProductOptions(prev => ({ ...prev, [catName]: updatedItems }))
          setTempProductOptions(prev => ({ ...prev, [catName]: {} }))
          setSelectedProducts(prev => prev.includes(catName) ? prev : [...prev, catName])
          toast.success(`Saved variant and saved ${catName} options.`)
          setExpandedProducts(prev => prev.filter(c => c !== catName))
          return
        }
      }

      const items = tempProductItems[catName] || []
      if (items.length === 0) {
        toast.error(`Please add at least one variant configuration for ${catName}`)
        return
      }

      setSellerProductOptions(prev => ({ ...prev, [catName]: items }))
      setSelectedProducts(prev => prev.includes(catName) ? prev : [...prev, catName])
      toast.success(`${catName} options saved successfully!`)
      setExpandedProducts(prev => prev.filter(c => c !== catName))

    } else {
      const options = tempProductOptions[catName] || {}
      const error = validateProduct(catName, options)
      if (error) {
        toast.error(error)
        return
      }

      setSellerProductOptions(prev => ({ ...prev, [catName]: [options] }))
      setSelectedProducts(prev => prev.includes(catName) ? prev : [...prev, catName])
      toast.success(`${catName} options saved successfully!`)
      setExpandedProducts(prev => prev.filter(c => c !== catName))
    }
  }

  const toggleLocationExpand = (stateName: string) => {
    const isExpanding = !expandedStates.includes(stateName)
    if (isExpanding) {
      setTempLocations(prev => ({ ...prev, [stateName]: selectedLocations[stateName] || [] }))
      setExpandedStates(prev => [...prev, stateName])
    } else {
      setExpandedStates(prev => prev.filter(s => s !== stateName))
    }
  }

  const saveLocation = (stateName: string) => {
    const districts = tempLocations[stateName] || []
    if (districts.length === 0) {
      toast.error("Please select at least one district")
      return
    }
    setSelectedLocations(prev => ({
      ...prev,
      [stateName]: districts
    }))
    toast.success(`${stateName} delivery locations saved successfully!`)
    setExpandedStates(prev => prev.filter(s => s !== stateName))
  }

  const renderItemsTable = (
    catName: string,
    items: any[], 
    onRemove?: (index: number) => void,
    onEdit?: (index: number) => void,
    editingIndex?: number | null
  ) => {
    const safeItems = getSafeItemsArray(items);
    if (safeItems.length === 0) return null;
    
    const allColumns = Array.from(new Set(safeItems.flatMap(item => Object.keys(item))));
    const FIELD_ORDER = ["Sub-Products", "Color", "Manufacturer", "Quantity(in tons)", "Location", "Comment"];
    const columns = [
        ...FIELD_ORDER.filter(f => allColumns.includes(f)),
        ...allColumns.filter(f => !FIELD_ORDER.includes(f)),
    ];

    return (
        <div className="rounded-md border border-border overflow-hidden mb-3 bg-muted/20">
            <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                    <thead className="bg-muted/80 text-muted-foreground text-[10px] uppercase font-semibold tracking-wider">
                        <tr>
                            <th className="px-3 py-2 w-8 text-center">#</th>
                            {columns.map(col => (
                                <th key={col} className="px-3 py-2 whitespace-nowrap">{col}</th>
                            ))}
                            {(onRemove || onEdit) && <th className="px-3 py-2 text-right w-16">Action</th>}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                        {safeItems.map((item, idx) => (
                            <tr key={idx} className={`bg-card transition-colors ${editingIndex === idx ? 'bg-primary/5 border-l-2 border-primary' : 'hover:bg-muted/20'}`}>
                                <td className="px-3 py-2 text-center text-muted-foreground font-medium">{idx + 1}</td>
                                {columns.map(col => {
                                    const val = item[col];
                                    const displayVal = Array.isArray(val) ? val.join(", ") : String(val || "-");
                                    return (
                                        <td key={col} className="px-3 py-2 whitespace-nowrap max-w-[150px] truncate" title={displayVal}>
                                            {displayVal}
                                        </td>
                                    )
                                })}
                                {(onRemove || onEdit) && (
                                    <td className="px-3 py-2 text-right">
                                        <div className="flex gap-1 justify-end">
                                            {onEdit && (
                                                <button
                                                    type="button"
                                                    className={`h-5 w-5 p-0 flex items-center justify-center rounded ${editingIndex === idx ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:text-primary hover:bg-primary/10'}`}
                                                    onClick={() => onEdit(idx)}
                                                    title="Edit configuration"
                                                >
                                                    <Pencil className="h-3 w-3" />
                                                </button>
                                            )}
                                            {onRemove && (
                                                <button
                                                    type="button"
                                                    className="h-5 w-5 p-0 flex items-center justify-center rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                                    onClick={() => onRemove(idx)}
                                                    title="Remove item"
                                                >
                                                    <X className="h-3 w-3" />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
  }

  const handleSubmit = async () => {
    if (!uploadedFilePath) {
      toast.error("Please upload the required document")
      return
    }

    if (form.role === "seller" || form.role === "both") {
      if (selectedProducts.length === 0) {
        toast.error("Please select at least one product")
        return
      }
      
      const validationError = validateAllProductsBeforeSubmit()
      if (validationError) {
        toast.error(validationError)
        return
      }

      if (Object.keys(selectedLocations).length === 0) {
        toast.error("Please select at least one delivery location")
        return
      }
    }

    setLoading(true)
    try {
      const { selectedCategories, ...payload } = form
      let verificationType = form.entityType === "company" ? "gst" : form.entityType === "individual" ? "aadhar" : "both"
      
      // Calculate productManufacturers from sellerProductOptions
      const computedProductManufacturers: Record<string, string[]> = {}
      Object.entries(sellerProductOptions).forEach(([prodName, items]) => {
        const mfgs = new Set<string>()
        items.forEach((item: any) => {
          const m = item["Manufacturer"]
          if (m) {
            if (Array.isArray(m)) {
              m.forEach(x => mfgs.add(x))
            } else if (typeof m === 'string') {
              mfgs.add(m)
            }
          }
        })
        if (mfgs.size > 0) {
          computedProductManufacturers[prodName] = Array.from(mfgs)
        }
      })

      const success = await register({
        ...payload,
        verificationType,
        categories: (form.role === "seller" || form.role === "both") ? selectedProducts : [],
        productManufacturers: (form.role === "seller" || form.role === "both") ? computedProductManufacturers : {},
        sellerProductOptions: (form.role === "seller" || form.role === "both") ? sellerProductOptions : {},
        availableLocations: (form.role === "seller" || form.role === "both") ? selectedLocations : {},
      } as any)
      if (!success) {
        toast.error("Registration failed")
        return
      }
      toast.success("Account created successfully!")
      router.push("/dashboard")
    } catch {
      toast.error("Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  const handleRoleChange = (role: string) => {
    setForm((prev) => ({ ...prev, role: role as "buyer" | "seller" | "both" }))
    setForm((prev) => ({ ...prev, selectedCategories: [] }))
  }

  const handleEntityTypeChange = (entityType: string) => {
    setForm((prev) => ({ ...prev, entityType: entityType as "company" | "individual" | "both" }))
    // Reset upload state
    setUploadedFile(null)
    setUploadedFilePath("")
    setAadhaarFile(null)
    setAadhaarFilePath("")
    // Reset file inputs
    if (fileInputRef.current) fileInputRef.current.value = ""
    if (aadhaarInputRef.current) aadhaarInputRef.current.value = ""
  }

  // Trigger file input click
  const handleChangeFile = (e: React.MouseEvent, type: "document" | "aadhaar" = "document") => {
    e.preventDefault()
    e.stopPropagation()
    if (type === "document" && fileInputRef.current) {
      fileInputRef.current.click()
    } else if (type === "aadhaar" && aadhaarInputRef.current) {
      aadhaarInputRef.current.click()
    }
  }

  // File upload handler
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: "document" | "aadhaar" = "document") => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File size must be less than 10MB")
      return
    }

    // Validate file type (Images and PDF only)
    const isValidType = file.type.startsWith("image/") || file.type === "application/pdf"
    if (!isValidType) {
      toast.error("Only image files and PDFs are allowed")
      return
    }

    if (type === "document") setUploadingFile(true)
    else setUploadingAadhaar(true)

    try {
      // Create unique file name
      const timestamp = Date.now()
      const sanitizedUserName = (form.name || "user").replace(/[^a-zA-Z0-9]/g, "_")
      const fileExtension = file.name.split('.').pop()?.toLowerCase() || 'jpg'
      const docPrefix = type === "document" ? "doc" : "aadhaar"
      const fileName = `${sanitizedUserName}_${docPrefix}_${timestamp}.${fileExtension}`

      const storageRef = ref(storage, `documents/${fileName}`)
      const snapshot = await uploadBytes(storageRef, file)
      const downloadURL = await getDownloadURL(snapshot.ref)

      if (type === "document") {
        setUploadedFile(file)
        setUploadedFilePath(fileName)
        setForm((prev) => ({ ...prev, documentPath: fileName }))
        toast.success("Document uploaded successfully!")
      } else {
        setAadhaarFile(file)
        setAadhaarFilePath(fileName)
        setForm((prev) => ({ ...prev, aadhaarDocumentPath: fileName }))
        toast.success("Aadhaar uploaded successfully!")
      }

    } catch (error: any) {
      logger.error("Client side upload error", { error: error.message })
      toast.error("Failed to upload document. Please try again.")
    } finally {
      if (type === "document") setUploadingFile(false)
      else setUploadingAadhaar(false)
    }
  }

  return (
    <div
      className="flex min-h-screen items-center justify-center  px-4 py-12"
      suppressHydrationWarning
    >
      <div className={`w-full transition-all duration-300 ${
        ((step === 5 && form.role !== "buyer" && form.entityType !== "both") ||
         (step === 6 && form.role === "both" && form.entityType === "both"))
          ? "max-w-3xl" : "max-w-lg"
      }`}>
        <Link href="/" className="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" suppressHydrationWarning /> Back to home
        </Link>
        <Card className="card-glossy">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex items-center justify-center">
              <img src="/logo-asset-4.png" alt="DND Purchase" className="h-14 md:h-16 w-auto object-contain" />
            </div>
            <CardTitle className="text-2xl text-foreground font-bold tracking-tight text-metallic">Create your account</CardTitle>
            <CardDescription className="text-muted-foreground">
              {step === 1
                ? "Select your role on the platform"
                : step === 2
                  ? "Register as a company or individual"
                  : step === 3
                    ? "Enter your personal details"
                    : step === 4
                      ? (form.entityType === "company" ? "Enter GSTIN & Upload Certificate" : "Enter Aadhaar & Upload Document")
                      : (step === 5 && form.entityType === "both")
                        ? "Enter GSTIN & Upload Certificate"
                        : ((step === 5 && form.role !== "buyer") || (step === 6 && form.role !== "buyer"))
                          ? "Select your products and delivery locations"
                          : "Enter GSTIN & Upload Certificate"}
            </CardDescription>
            <div className="mt-4 flex items-center justify-center gap-2">
              {Array.from({ length: (() => {
                const base = form.entityType === "both" ? 5 : 4
                return (form.role === "seller" || form.role === "both") ? base + 1 : base
              })() }, (_, i) => i + 1).map((s) => (
                <div key={s} className={`h-2 w-8 rounded-full ${s <= step ? "bg-primary" : "bg-muted"}`} />
              ))}
            </div>
          </CardHeader>
          <CardContent>
            {/* Step 1: Role Selection */}
            {step === 1 && (
              <div className="flex flex-col gap-6">
                <div>
                  <Label className="mb-3 block text-foreground">I want to register as</Label>
                  <RadioGroup value={form.role} onValueChange={handleRoleChange} className="flex flex-col gap-3">
                    {[
                      { value: "buyer", label: "Buyer", desc: "Create inquiries and receive competitive quotes", icon: CreditCard },
                      { value: "seller", label: "Seller", desc: "Browse inquiries and submit price offers", icon: Building2 },
                      { value: "both", label: "Both (Buyer & Seller)", desc: "Create inquiries and submit offers", icon: Package },
                    ].map((opt) => (
                      <label key={opt.value} className={`flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-all ${form.role === opt.value ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"}`}>
                        <RadioGroupItem value={opt.value} className="mt-0.5" />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 font-medium text-foreground">
                            <opt.icon className="h-4 w-4" />
                            {opt.label}
                          </div>
                          <div className="text-sm text-muted-foreground">{opt.desc}</div>
                        </div>
                      </label>
                    ))}
                  </RadioGroup>
                </div>
                <Button className="w-full" onClick={() => {
                  if (form.role === "both") {
                    setForm(prev => ({ ...prev, entityType: "both" }))
                    setStep(3)
                  } else {
                    if (form.entityType === "both") setForm(prev => ({ ...prev, entityType: "company" }))
                    setStep(2)
                  }
                }}>Continue</Button>
              </div>
            )}

            {/* Step 2: Entity Type Selection */}
            {step === 2 && (
              <div className="flex flex-col gap-6">
                <div>
                  <Label className="mb-3 block text-foreground">Register as</Label>
                  <RadioGroup value={form.entityType} onValueChange={handleEntityTypeChange} className="flex flex-col gap-3">
                    {[
                      { value: "company", label: "Company", desc: "Business entity with GSTIN registration", icon: Building2 },
                      { value: "individual", label: "Individual", desc: "Personal account with Aadhaar verification", icon: User },
                    ].map((opt) => (
                      <label key={opt.value} className={`flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-all ${form.entityType === opt.value ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"}`}>
                        <RadioGroupItem value={opt.value} className="mt-0.5" />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 font-medium text-foreground">
                            <opt.icon className="h-4 w-4" />
                            {opt.label}
                          </div>
                          <div className="text-sm text-muted-foreground">{opt.desc}</div>
                        </div>
                      </label>
                    ))}
                  </RadioGroup>
                </div>
                <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
                  <p className="flex items-center gap-2 text-sm text-foreground">
                    <ShieldCheck className="h-4 w-4 text-primary" />
                    {form.entityType === "company"
                      ? "Companies require GSTIN certificate upload (Image/PDF, max 10MB)"
                      : "Individuals require Aadhaar card upload (Image/PDF, max 10MB)"}
                  </p>
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" className="flex-1 bg-transparent" onClick={() => setStep(1)}>Back</Button>
                  <Button className="flex-1" onClick={() => setStep(3)}>Continue</Button>
                </div>
              </div>
            )}

            {/* Step 3: Personal/Company Details */}
            {step === 3 && (
              <div className="flex flex-col gap-4">
                <div>
                  <Label htmlFor="name" className="text-foreground">Full Name</Label>
                  <Input
                    id="name"
                    placeholder="John Doe"
                    value={form.name}
                    onChange={(e) => updateForm("name", e.target.value)}
                    className="mt-1.5"
                  />
                </div>
                {(form.entityType === "company" || form.entityType === "both") && (
                  <div>
                    <Label htmlFor="company" className="text-foreground">Company Name</Label>
                    <Input
                      id="company"
                      placeholder="ABC Industries Pvt. Ltd."
                      value={form.company}
                      onChange={(e) => updateForm("company", e.target.value)}
                      className="mt-1.5"
                    />
                  </div>
                )}
                <div>
                  <Label htmlFor="email" className="text-foreground">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="john@company.com"
                    value={form.email}
                    onChange={(e) => updateForm("email", e.target.value.toLowerCase())}
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label htmlFor="phone" className="text-foreground">
                    Contact Number
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+91 98765 43210"
                    value={form.phone}
                    onChange={(e) => updateForm("phone", e.target.value)}
                    className="mt-1.5"
                  />
                  {/* 
                  <p className="mt-1 text-xs text-muted-foreground">
                    This number will be used for SMS and Email communication
                  </p>
                  */}
                </div>
                <div>
                  <Label htmlFor="password" className="text-foreground">Password</Label>
                  <div className="relative mt-1.5">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Create a strong password"
                      value={form.password}
                      onChange={(e) => updateForm("password", e.target.value)}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>

                </div>
                <div className="flex gap-3 mt-2">
                  <Button variant="outline" className="flex-1 bg-transparent" onClick={() => {
                    if (form.role === "both") setStep(1)
                    else setStep(2)
                  }}>Back</Button>
                  <Button
                    className="flex-1"
                    onClick={async () => {
                      if (!form.name.trim()) {
                        toast.error("Please enter your name")
                        return
                      }
                      if ((form.entityType === "company" || form.entityType === "both") && !form.company.trim()) {
                        toast.error("Please enter your company name")
                        return
                      }
                      setLoading(true)
                      try {
                        await createUserWithEmailAndPassword(auth, form.email, form.password)
                        setStep(4)
                      } catch (e: any) {
                        if (e.code === 'auth/email-already-in-use') {
                          // Email already exists! Proceed forward to the upload assuming they own it (or it will block them later).
                          // For security, if it's already in use, we shouldn't let them upload docs unless they log in. Let's show an error.
                          toast.error("This email is already registered. Please log in.")
                        } else {
                          toast.error(e.message || "Failed to create account")
                        }
                      } finally {
                        setLoading(false)
                      }
                    }}
                    disabled={loading}
                  >
                    {loading ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Authenticating...</>
                    ) : (
                      "Continue"
                    )}
                  </Button>
                </div>
              </div>
            )}

            {/* Step 4: Verification & Document Upload (Aadhaar for Individual/Both, GST for Company) */}
            {step === 4 && (
              <div className="flex flex-col gap-5">
                {/* Company Only: GSTIN (because both moves to step 5) */}
                {form.entityType === "company" && (
                  <>
                    <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
                      <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                        <Building2 className="h-4 w-4 text-primary" />
                        GSTIN Details
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Provide your 15-character GSTIN
                      </p>
                    </div>

                    <div>
                      <Label htmlFor="gstin" className="text-foreground">GSTIN Number</Label>
                      <div className="mt-1.5 flex gap-2">
                        <Input
                          id="gstin"
                          placeholder="27AAPFU0939F1ZV"
                          maxLength={15}
                          value={form.gstin}
                          onChange={(e) => updateForm("gstin", e.target.value.toUpperCase())}
                          className="flex-1 font-mono uppercase tracking-wider"
                        />
                      </div>
                    </div>
                  </>
                )}

                {/* Individual & Both: Aadhaar Details */}
                {(form.entityType === "individual" || form.entityType === "both") && (
                  <>
                    <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
                      <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                        <ShieldCheck className="h-4 w-4 text-primary" />
                        Aadhaar Details
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Provide your 12-digit Aadhaar number
                      </p>
                    </div>

                    <div>
                      <Label htmlFor="aadhaar" className="text-foreground">Aadhaar Number</Label>
                      <div className="mt-1.5 flex gap-2">
                        <Input
                          id="aadhaar"
                          placeholder="XXXX XXXX XXXX"
                          maxLength={14}
                          value={form.aadhaarNumber}
                          onChange={(e) => {
                            const raw = e.target.value.replace(/\D/g, "").slice(0, 12)
                            const formatted = raw.replace(/(\d{4})(?=\d)/g, "$1 ")
                            updateForm("aadhaarNumber", raw)
                            e.target.value = formatted
                          }}
                          className="flex-1 font-mono tracking-wider"
                        />
                      </div>
                    </div>
                  </>
                )}

                {/* Document Upload for Step 4 */}
                {(form.entityType === "company" || form.entityType === "individual") && (
                  <div>
                    <Label htmlFor="document" className="text-foreground">
                      {form.entityType === "company" ? "GSTIN Certificate" : "Aadhaar Card"} (Image or PDF)
                    </Label>
                    <div className="mt-1.5">
                      <div className={`flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 transition-all ${uploadedFile ? "border-green-500 bg-green-500/10" : "border-border hover:border-primary/50"}`}>
                        <input
                          ref={fileInputRef}
                          id="document"
                          type="file"
                          accept="image/*,application/pdf"
                          className="hidden"
                          onChange={(e) => handleFileUpload(e, "document")}
                          disabled={uploadingFile}
                        />
                        {uploadingFile ? (
                          <>
                            <Loader2 className="h-10 w-10 animate-spin text-primary" />
                            <p className="mt-2 text-sm text-muted-foreground">Uploading...</p>
                          </>
                        ) : uploadedFile ? (
                          <>
                            <CheckCircle2 className="h-10 w-10 text-green-600" />
                            <p className="mt-2 text-sm font-medium text-foreground">{uploadedFile.name}</p>
                            <p className="text-xs text-muted-foreground">{(uploadedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                            <Button
                              variant="outline"
                              size="sm"
                              className="mt-3"
                              onClick={(e) => handleChangeFile(e, "document")}
                              type="button"
                            >
                              Change File
                            </Button>
                          </>
                        ) : (
                          <label
                            htmlFor="document"
                            className="flex cursor-pointer flex-col items-center"
                          >
                            <Upload className="h-10 w-10 text-muted-foreground" />
                            <p className="mt-2 text-sm font-medium text-foreground">Click to upload</p>
                            <p className="text-xs text-muted-foreground">Image or PDF only, max 10MB</p>
                          </label>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Upload Area 2: Aadhaar (For "both", kept on Step 4) */}
                {form.entityType === "both" && (
                  <div>
                    <Label htmlFor="aadhaarDocument" className="text-foreground">
                      Aadhaar Card (Image or PDF)
                    </Label>
                    <div className="mt-1.5">
                      <div className={`flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 transition-all ${aadhaarFile ? "border-green-500 bg-green-500/10" : "border-border hover:border-primary/50"}`}>
                        <input
                          ref={aadhaarInputRef}
                          id="aadhaarDocument"
                          type="file"
                          accept="image/*,application/pdf"
                          className="hidden"
                          onChange={(e) => handleFileUpload(e, "aadhaar")}
                          disabled={uploadingAadhaar}
                        />
                        {uploadingAadhaar ? (
                          <>
                            <Loader2 className="h-10 w-10 animate-spin text-primary" />
                            <p className="mt-2 text-sm text-muted-foreground">Uploading...</p>
                          </>
                        ) : aadhaarFile ? (
                          <>
                            <CheckCircle2 className="h-10 w-10 text-green-600" />
                            <p className="mt-2 text-sm font-medium text-foreground">{aadhaarFile.name}</p>
                            <p className="text-xs text-muted-foreground">{(aadhaarFile.size / 1024 / 1024).toFixed(2)} MB</p>
                            <Button
                              variant="outline"
                              size="sm"
                              className="mt-3"
                              onClick={(e) => handleChangeFile(e, "aadhaar")}
                              type="button"
                            >
                              Change File
                            </Button>
                          </>
                        ) : (
                          <label
                            htmlFor="aadhaarDocument"
                            className="flex cursor-pointer flex-col items-center"
                          >
                            <Upload className="h-10 w-10 text-muted-foreground" />
                            <p className="mt-2 text-sm font-medium text-foreground">Click to upload</p>
                            <p className="text-xs text-muted-foreground">Image or PDF only, max 10MB</p>
                          </label>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex gap-3 mt-2">
                  <Button variant="outline" className="flex-1 bg-transparent" onClick={() => setStep(3)}>Back</Button>
                  <Button
                    className="flex-1"
                    onClick={async () => {
                      if ((form.entityType === "individual" || form.entityType === "both") && form.aadhaarNumber.length !== 12) {
                        toast.error("Please enter a valid 12-digit Aadhaar number")
                        return
                      }

                      if (form.entityType === "both") {
                        if (!aadhaarFile || !aadhaarFilePath) {
                          toast.error("Please upload your Aadhaar document")
                          return
                        }
                        // Move to Step 5
                        setStep(5)
                      } else {
                        if (form.entityType === "company" && form.gstin.length !== 15) {
                          toast.error("Please enter a valid 15-character GSTIN")
                          return
                        }
                        if (!uploadedFile || !uploadedFilePath) {
                          toast.error("Please upload the required primary document")
                          return
                        }
                        if (form.role === "seller" || form.role === "both") {
                          fetchProductsAndLocations()
                          setStep(5)
                        } else {
                          await handleSubmit()
                        }
                      }
                    }}
                    disabled={
                      (form.entityType === "both" && (!aadhaarFile || uploadingAadhaar || form.aadhaarNumber.length !== 12)) ||
                      (form.entityType === "company" && (!uploadedFile || uploadingFile || form.gstin.length !== 15 || loading)) ||
                      (form.entityType === "individual" && (!uploadedFile || uploadingFile || form.aadhaarNumber.length !== 12 || loading))
                    }
                  >
                    {form.entityType === "both"
                      ? "Continue To GST"
                      : (form.role === "seller" || form.role === "both")
                        ? "Continue"
                        : (loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Finalizing...</> : "Complete Registration")}
                  </Button>
                </div>
              </div>
            )}

            {/* Step 5: GST Upload (Only for "Both") */}
            {step === 5 && form.entityType === "both" && (
              <div className="flex flex-col gap-5">
                <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
                  <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                    <Building2 className="h-4 w-4 text-primary" />
                    GSTIN Details
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Provide your 15-character GSTIN
                  </p>
                </div>

                <div>
                  <Label htmlFor="gstin_both" className="text-foreground">GSTIN Number</Label>
                  <div className="mt-1.5 flex gap-2">
                    <Input
                      id="gstin_both"
                      placeholder="27AAPFU0939F1ZV"
                      maxLength={15}
                      value={form.gstin}
                      onChange={(e) => updateForm("gstin", e.target.value.toUpperCase())}
                      className="flex-1 font-mono uppercase tracking-wider"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="document_both" className="text-foreground">
                    GSTIN Certificate (Image or PDF)
                  </Label>
                  <div className="mt-1.5">
                    <div className={`flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 transition-all ${uploadedFile ? "border-green-500 bg-green-500/10" : "border-border hover:border-primary/50"}`}>
                      <input
                        ref={fileInputRef}
                        id="document_both"
                        type="file"
                        accept="image/*,application/pdf"
                        className="hidden"
                        onChange={(e) => handleFileUpload(e, "document")}
                        disabled={uploadingFile}
                      />
                      {uploadingFile ? (
                        <>
                          <Loader2 className="h-10 w-10 animate-spin text-primary" />
                          <p className="mt-2 text-sm text-muted-foreground">Uploading...</p>
                        </>
                      ) : uploadedFile ? (
                        <>
                          <CheckCircle2 className="h-10 w-10 text-green-600" />
                          <p className="mt-2 text-sm font-medium text-foreground">{uploadedFile.name}</p>
                          <p className="text-xs text-muted-foreground">{(uploadedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                          <Button
                            variant="outline"
                            size="sm"
                            className="mt-3"
                            onClick={(e) => handleChangeFile(e, "document")}
                            type="button"
                          >
                            Change File
                          </Button>
                        </>
                      ) : (
                        <label
                          htmlFor="document_both"
                          className="flex cursor-pointer flex-col items-center"
                        >
                          <Upload className="h-10 w-10 text-muted-foreground" />
                          <p className="mt-2 text-sm font-medium text-foreground">Click to upload</p>
                          <p className="text-xs text-muted-foreground">Image or PDF only, max 10MB</p>
                        </label>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 mt-2">
                  <Button variant="outline" className="flex-1 bg-transparent" onClick={() => setStep(4)}>Back</Button>
                  <Button
                    className="flex-1"
                    onClick={async () => {
                      if (form.gstin.length !== 15) {
                        toast.error("Please enter a valid 15-character GSTIN")
                        return
                      }
                      if (!uploadedFile || !uploadedFilePath) {
                        toast.error("Please upload the required GSTIN document")
                        return
                      }
                      fetchProductsAndLocations()
                      setStep(6)
                    }}
                    disabled={
                      !uploadedFile ||
                      uploadingFile ||
                      loading ||
                      form.gstin.length !== 15
                    }
                  >
                    {loading ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Finalizing...</>
                    ) : (
                      "Continue"
                    )}
                  </Button>
                </div>
              </div>
            )}

            {/* Product & Location Selection Step (Seller/Both only) */}
            {((step === 5 && form.role === "seller" && form.entityType !== "both") ||
              (step === 5 && form.role === "both" && form.entityType !== "both") ||
              (step === 6 && form.role === "both" && form.entityType === "both")) && (
              <div className="flex flex-col gap-5">
                {loadingProductsLocations ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="mt-3 text-sm text-muted-foreground">Loading products and locations...</p>
                  </div>
                ) : (
                  <>
                    {/* Products Section */}
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
                          <Package className="h-3.5 w-3.5 text-primary" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-foreground">Products I Sell</h4>
                          <p className="text-[11px] text-muted-foreground">Select at least 1 product and configure its options</p>
                        </div>
                        {selectedProducts.length > 0 && (
                          <span className="ml-auto text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                            {selectedProducts.length} selected
                          </span>
                        )}
                      </div>
                      <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                        {availableProducts.map((product) => {
                          const catName = product.name
                          const isSelected = selectedProducts.includes(catName)
                          const isExpanded = expandedProducts.includes(catName)
                          const productOptions = allOptions[product.id] || []
                          const hasSubProducts = !!(product.sub_products && product.sub_products.length > 0)
                          const isMultiConfig = catName === "Stock of non-standard Color-coated coils/sheets"
                          const currentOptions = sellerProductOptions[catName] || []
                          const optValues = tempProductOptions[catName] || {}

                          const FIELD_ORDER = ["Color", "Manufacturer", "Quantity(in tons)", "Location", "Comment"];
                          const sortedPOptions = [
                              ...FIELD_ORDER.map(name => productOptions.find(o => o.option_name === name)).filter(Boolean),
                              ...productOptions.filter(o => !FIELD_ORDER.includes(o.option_name)),
                          ] as typeof productOptions;

                          return (
                            <div
                              key={product.id}
                              className={`rounded-lg border transition-all duration-200 ${
                                isSelected
                                  ? "border-primary/40 bg-card/45 shadow-sm"
                                  : "border-border/60 bg-card/20 hover:border-border"
                              }`}
                            >
                              {/* Product Header */}
                              <div
                                className="flex items-center justify-between px-3.5 py-2.5 cursor-pointer select-none group"
                                onClick={() => toggleProductExpand(catName)}
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <Checkbox
                                    checked={isSelected}
                                    onCheckedChange={(checked: boolean) => {
                                      if (checked) {
                                        if (!isExpanded) {
                                          toggleProductExpand(catName)
                                        }
                                      } else {
                                        setSelectedProducts(prev => prev.filter(p => p !== catName))
                                        setExpandedProducts(prev => prev.filter(c => c !== catName))
                                        setSellerProductOptions(prev => {
                                          const next = { ...prev }
                                          delete next[catName]
                                          return next
                                        })
                                        setTempProductItems(prev => {
                                          const next = { ...prev }
                                          delete next[catName]
                                          return next
                                        })
                                        setTempProductOptions(prev => {
                                          const next = { ...prev }
                                          delete next[catName]
                                          return next
                                        })
                                      }
                                    }}
                                    onClick={(e) => e.stopPropagation()}
                                    className={isSelected ? "border-primary data-[state=checked]:bg-primary" : ""}
                                  />
                                  <span className={`text-sm font-semibold truncate ${
                                    isSelected ? "text-foreground" : "text-muted-foreground"
                                  }`}>
                                    {catName}
                                  </span>
                                  {isSelected && (
                                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ml-2 ${
                                      sellerProductOptions[catName] && sellerProductOptions[catName].length > 0
                                        ? "bg-green-500/15 text-green-600 dark:text-green-400"
                                        : "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                                    }`}>
                                      {sellerProductOptions[catName] && sellerProductOptions[catName].length > 0
                                        ? (isMultiConfig 
                                            ? `${sellerProductOptions[catName].length} variant${sellerProductOptions[catName].length !== 1 ? 's' : ''}` 
                                            : 'configured')
                                        : 'pending configuration'}
                                    </span>
                                  )}
                                </div>
                                
                                <div className="text-muted-foreground/40 group-hover:text-muted-foreground transition-colors">
                                  {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                                </div>
                              </div>

                              {/* Product Body */}
                              {isExpanded && (
                                <div className="border-t border-border/50 p-3 bg-muted/10 space-y-3">
                                  {isMultiConfig && (
                                    <>
                                      {/* Table of configured variants */}
                                      {renderItemsTable(
                                        catName,
                                        tempProductItems[catName] || [],
                                        (idx) => {
                                          const nextItems = (tempProductItems[catName] || []).filter((_, i) => i !== idx)
                                          setTempProductItems(prev => ({ ...prev, [catName]: nextItems }))
                                          setSellerProductOptions(prev => ({ ...prev, [catName]: nextItems }))
                                          if (editingItemIndex[catName] === idx) {
                                            setEditingItemIndex(prev => ({ ...prev, [catName]: null }))
                                            setTempProductOptions(prev => ({ ...prev, [catName]: {} }))
                                          } else if (editingItemIndex[catName] !== undefined && editingItemIndex[catName] !== null && editingItemIndex[catName] > idx) {
                                            setEditingItemIndex(prev => ({ ...prev, [catName]: editingItemIndex[catName]! - 1 }))
                                          }
                                        },
                                        (idx) => {
                                          setEditingItemIndex(prev => ({ ...prev, [catName]: idx }))
                                          setTempProductOptions(prev => ({ ...prev, [catName]: { ...(tempProductItems[catName]?.[idx] || {}) } }))
                                        },
                                        editingItemIndex[catName]
                                      )}
                                    </>
                                  )}

                                  {/* Inputs Form */}
                                  <div className="space-y-3 border border-border/60 bg-card p-3 rounded-md">
                                    <h5 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                                      {isMultiConfig 
                                        ? (editingItemIndex[catName] !== null && editingItemIndex[catName] !== undefined ? "Edit Variant" : "Add New Variant")
                                        : "Product Options"}
                                    </h5>

                                    {/* Sub-Products dropdown / checkbox */}
                                    {hasSubProducts && product.sub_products && (
                                      <div className="space-y-1.5">
                                        <Label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                                          Sub-Products <span className="text-primary">*</span>
                                        </Label>
                                        {isMultiConfig ? (
                                          <Select
                                            value={typeof optValues["Sub-Products"] === 'string' ? optValues["Sub-Products"] : ""}
                                            onValueChange={(val) => {
                                              setTempProductOptions(prev => ({
                                                ...prev,
                                                [catName]: { ...(prev[catName] || {}), "Sub-Products": val }
                                              }))
                                            }}
                                          >
                                            <SelectTrigger className="w-full h-8 text-xs rounded-md bg-muted/30 border-border font-medium text-foreground">
                                              <SelectValue placeholder="Select sub-product..." />
                                            </SelectTrigger>
                                            <SelectContent className="z-[200]">
                                              {product.sub_products.map(sub => (
                                                <SelectItem key={sub} value={sub} className="text-xs font-medium">{sub}</SelectItem>
                                              ))}
                                            </SelectContent>
                                          </Select>
                                        ) : (
                                          <div className="flex flex-wrap gap-1.5">
                                            {product.sub_products.map((sub: string) => {
                                              const currentVals = optValues["Sub-Products"] || []
                                              const checked = Array.isArray(currentVals) && currentVals.includes(sub)
                                              return (
                                                <label
                                                  key={sub}
                                                  className={`inline-flex items-center gap-1.5 text-xs cursor-pointer transition-all duration-150 px-2 py-1 rounded-md border ${
                                                    checked
                                                      ? 'bg-primary border-primary text-primary-foreground font-medium shadow-sm'
                                                      : 'bg-muted/30 border-border text-muted-foreground hover:border-primary/40 hover:bg-muted/50'
                                                  }`}
                                                >
                                                  <Checkbox
                                                    checked={checked}
                                                    className={checked ? "border-primary-foreground/50 bg-primary-foreground/20 data-[state=checked]:bg-primary-foreground/20 data-[state=checked]:text-primary-foreground h-3.5 w-3.5" : "h-3.5 w-3.5"}
                                                    onCheckedChange={(c: boolean) => {
                                                      const prevVals = Array.isArray(currentVals) ? currentVals : []
                                                      const nextVals = c ? [...prevVals, sub] : prevVals.filter((v: string) => v !== sub)
                                                      setTempProductOptions(prev => ({
                                                        ...prev,
                                                        [catName]: { ...(prev[catName] || {}), "Sub-Products": nextVals }
                                                      }))
                                                    }}
                                                  />
                                                  {sub}
                                                </label>
                                              )
                                            })}
                                          </div>
                                        )}
                                      </div>
                                    )}

                                    {/* Dynamic options */}
                                    {sortedPOptions.map(opt => {
                                      if (opt.seller_option_type === 'none') return null;

                                      const isMulti = opt.seller_option_type === "dropdown" || opt.seller_option_type === "checkbox";
                                      const currentVals = optValues[opt.option_name] || (isMulti ? [] : '');

                                      return (
                                        <div key={opt.id} className="space-y-1.5">
                                          <Label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                                            <span>
                                              {opt.option_name} <span className="text-primary">*</span>
                                            </span>
                                            <span className="text-[8px] font-normal px-1 rounded bg-muted text-muted-foreground/70 normal-case tracking-normal">
                                              {opt.seller_option_type === "dropdown" || opt.seller_option_type === "checkbox" ? "multi-select" : opt.seller_option_type}
                                            </span>
                                          </Label>

                                          {(isMulti && opt.dropdown_values) ? (
                                            <div className="flex flex-wrap gap-1.5">
                                              {opt.dropdown_values.map((val: string) => {
                                                const checked = Array.isArray(currentVals) && currentVals.includes(val)
                                                return (
                                                  <label
                                                    key={val}
                                                    className={`inline-flex items-center gap-1.5 text-xs cursor-pointer transition-all duration-150 px-2 py-1 rounded-md border ${
                                                      checked
                                                        ? 'bg-primary border-primary text-primary-foreground font-medium shadow-sm'
                                                        : 'bg-muted/30 border-border text-muted-foreground hover:border-primary/40 hover:bg-muted/50'
                                                    }`}
                                                  >
                                                    <Checkbox
                                                      checked={checked}
                                                      className={checked ? "border-primary-foreground/50 bg-primary-foreground/20 data-[state=checked]:bg-primary-foreground/20 data-[state=checked]:text-primary-foreground h-3.5 w-3.5" : "h-3.5 w-3.5"}
                                                      onCheckedChange={(c: boolean) => {
                                                        const prevVals = Array.isArray(currentVals) ? currentVals : [];
                                                        const nextVals = c ? [...prevVals, val] : prevVals.filter((v: string) => v !== val)
                                                        
                                                        setTempProductOptions(prev => ({
                                                          ...prev,
                                                          [catName]: { ...(prev[catName] || {}), [opt.option_name]: nextVals }
                                                        }))
                                                      }}
                                                    />
                                                    {val}
                                                  </label>
                                                )
                                              })}
                                            </div>
                                          ) : opt.seller_option_type === 'table' ? (
                                            <div className="rounded border border-border/60 bg-muted/20 p-2 text-xs text-muted-foreground">
                                              <span>Tabular data — configured per quotation</span>
                                            </div>
                                          ) : (
                                            <Input
                                              type={opt.seller_option_type === 'number' ? 'number' : 'text'}
                                              placeholder={`Enter ${opt.option_name.toLowerCase()}`}
                                              value={typeof currentVals === 'string' ? currentVals : ''}
                                              onChange={(e) => {
                                                const val = e.target.value
                                                setTempProductOptions(prev => ({
                                                  ...prev,
                                                  [catName]: { ...(prev[catName] || {}), [opt.option_name]: val }
                                                }))
                                              }}
                                              className="h-8 text-xs rounded-md bg-muted/30 border-border font-medium text-foreground"
                                            />
                                          )}
                                        </div>
                                      )
                                    })}

                                    {/* MultiConfig actions */}
                                    {isMultiConfig && (
                                      <div className="pt-2 flex justify-end gap-1.5">
                                        {editingItemIndex[catName] !== null && editingItemIndex[catName] !== undefined ? (
                                          <>
                                            <Button
                                              type="button"
                                              variant="ghost"
                                              size="sm"
                                              onClick={() => {
                                                setEditingItemIndex(prev => ({ ...prev, [catName]: null }))
                                                setTempProductOptions(prev => ({ ...prev, [catName]: {} }))
                                              }}
                                              className="text-xs text-muted-foreground h-7 px-2.5"
                                            >
                                              Cancel Edit
                                            </Button>
                                            <Button
                                              type="button"
                                              size="sm"
                                              onClick={() => handleUpdateItem(catName)}
                                              className="text-xs h-7 px-3 gap-1"
                                            >
                                              <CheckCircle2 className="h-3 w-3" /> Update Variant
                                            </Button>
                                          </>
                                        ) : (
                                          <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleAddItem(catName)}
                                            className="text-xs h-7 px-3 gap-1"
                                          >
                                            <Plus className="h-3 w-3" /> Add Variant
                                          </Button>
                                        )}
                                      </div>
                                    )}
                                  </div>

                                  {/* Save Product Option Button */}
                                  <div className="pt-2 flex justify-end">
                                    <Button
                                      type="button"
                                      size="sm"
                                      onClick={() => saveProduct(catName)}
                                      className="text-xs gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground font-medium shadow-sm"
                                    >
                                      <Save className="h-3.5 w-3.5" /> Save {catName} Options
                                    </Button>
                                  </div>
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>

                    {/* Divider */}
                    <div className="border-t border-border/60" />

                    {/* Locations Section */}
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10">
                          <MapPin className="h-3.5 w-3.5 text-emerald-500" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-foreground">Delivery Locations</h4>
                          <p className="text-[11px] text-muted-foreground">Select at least 1 state with districts</p>
                        </div>
                        {Object.keys(selectedLocations).length > 0 && (
                          <span className="ml-auto text-xs font-semibold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                            {Object.keys(selectedLocations).length} state{Object.keys(selectedLocations).length !== 1 ? "s" : ""}
                          </span>
                        )}
                      </div>
                      <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
                        {locations.map((loc) => {
                          const stateName = loc.state_name
                          const isActive = !!selectedLocations[stateName]
                          const isExpanded = expandedStates.includes(stateName)
                          const currentDistricts = selectedLocations[stateName] || []
                          const draftDistricts = tempLocations[stateName] || []

                          return (
                            <div
                              key={loc.id}
                              className={`rounded-lg border transition-all duration-200 ${
                                isActive
                                  ? "border-emerald-500/30 bg-card shadow-sm"
                                  : "border-border/60 bg-card/50 hover:border-border"
                              }`}
                            >
                              {/* State Header */}
                              <div
                                className="flex items-center justify-between px-3.5 py-2.5 cursor-pointer select-none group"
                                onClick={() => toggleLocationExpand(stateName)}
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  {isActive ? (
                                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-emerald-500/15">
                                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                                    </div>
                                  ) : (
                                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-muted/60">
                                      <MapPin className="h-3.5 w-3.5 text-muted-foreground/50" />
                                    </div>
                                  )}
                                  <div className="min-w-0">
                                    <span className={`text-sm font-semibold truncate ${
                                      isActive ? "text-foreground" : "text-muted-foreground"
                                    }`}>
                                      {stateName}
                                    </span>
                                    {isActive && currentDistricts.length > 0 && !isExpanded && (
                                      <span className="text-[10px] text-muted-foreground ml-2">
                                        {currentDistricts.length} district{currentDistricts.length !== 1 ? "s" : ""}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <div className="text-muted-foreground/40 group-hover:text-muted-foreground transition-colors">
                                  {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                                </div>
                              </div>

                              {/* District Selection */}
                              {isExpanded && (
                                <div className="border-t border-border/50 px-3.5 py-3 space-y-2">
                                  <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                                      Select Districts
                                    </span>
                                    {loc.districts?.length > 0 && (
                                      <button
                                        type="button"
                                        className="text-[10px] font-medium text-primary hover:underline"
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          const allSelected = draftDistricts.length === loc.districts.length
                                          if (allSelected) {
                                            setTempLocations((prev) => {
                                              const next = { ...prev }
                                              delete next[stateName]
                                              return next
                                            })
                                          } else {
                                            setTempLocations((prev) => ({
                                              ...prev,
                                              [stateName]: [...loc.districts],
                                            }))
                                          }
                                        }}
                                      >
                                        {draftDistricts.length === loc.districts?.length ? "Deselect All" : "Select All"}
                                      </button>
                                    )}
                                  </div>
                                  <div className="grid grid-cols-2 gap-1.5">
                                    {loc.districts?.map((dist: string) => {
                                      const checked = draftDistricts.includes(dist)
                                      return (
                                        <label
                                          key={dist}
                                          className={`inline-flex items-center gap-1.5 text-xs cursor-pointer transition-all duration-150 px-2.5 py-1.5 rounded-md border ${
                                            checked
                                              ? "bg-emerald-600 border-emerald-600 text-white font-medium shadow-sm"
                                              : "bg-muted/30 border-border text-muted-foreground hover:border-emerald-500/40"
                                          }`}
                                        >
                                          <Checkbox
                                            checked={checked}
                                            className={checked ? "border-white/50 bg-white/20 data-[state=checked]:bg-white/20 data-[state=checked]:text-white h-3 w-3" : "h-3 w-3"}
                                            onCheckedChange={(c: boolean) => {
                                              setTempLocations((prev) => {
                                                const currentDists = prev[stateName] || []
                                                const newDists = c
                                                  ? [...currentDists, dist]
                                                  : currentDists.filter((d) => d !== dist)
                                                if (newDists.length === 0) {
                                                  const next = { ...prev }
                                                  delete next[stateName]
                                                  return next
                                                }
                                                return { ...prev, [stateName]: newDists }
                                              })
                                            }}
                                          />
                                          {dist}
                                        </label>
                                      )
                                    })}
                                  </div>
                                  {(!loc.districts || loc.districts.length === 0) && (
                                    <p className="text-xs text-muted-foreground italic">No districts defined.</p>
                                  )}

                                  {/* Save Location Button */}
                                  <div className="pt-2 flex justify-end">
                                    <Button
                                      type="button"
                                      size="sm"
                                      onClick={() => saveLocation(stateName)}
                                      className="text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium shadow-sm"
                                    >
                                      <Save className="h-3.5 w-3.5" /> Save {stateName} Locations
                                    </Button>
                                  </div>
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </>
                )}

                <div className="flex gap-3 mt-2">
                  <Button variant="outline" className="flex-1 bg-transparent" onClick={() => {
                    if (form.entityType === "both") setStep(5)
                    else setStep(4)
                  }}>Back</Button>
                  <Button
                    className="flex-1"
                    onClick={handleSubmit}
                    disabled={
                      loading ||
                      loadingProductsLocations ||
                      selectedProducts.length === 0 ||
                      Object.keys(selectedLocations).length === 0
                    }
                  >
                    {loading ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Finalizing...</>
                    ) : (
                      "Complete Registration"
                    )}
                  </Button>
                </div>
              </div>
            )}


            <p className="mt-6 text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link href="/auth/login" className="font-medium text-primary hover:underline">Sign in</Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
