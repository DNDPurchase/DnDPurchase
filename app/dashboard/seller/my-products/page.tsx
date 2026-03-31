"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/lib/auth-context"
import { logger } from "@/lib/logger"
import { Loader2, Package, X, Save, MapPin, Pencil, ChevronDown, ChevronRight, CheckCircle2, Circle, ShieldCheck, Layers, Globe } from "lucide-react"
import { useState, useEffect } from "react"
import { toast } from "sonner"
import { updateUser } from "@/lib/store"
import { ProductOption } from "@/lib/store"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"

export default function MyProductsPage() {
    const { user, updateUserData } = useAuth()
    const [loading, setLoading] = useState(false)
    const [editingProduct, setEditingProduct] = useState<string | null>(null)
    const [editingLocation, setEditingLocation] = useState<string | null>(null)
    const [expandedProducts, setExpandedProducts] = useState<string[]>([])
    const [expandedLocations, setExpandedLocations] = useState<string[]>([])

    // We maintain a local copy of the data for the item being edited
    const [tempProductOptions, setTempProductOptions] = useState<Record<string, any>>({})
    const [tempLocationDistricts, setTempLocationDistricts] = useState<string[]>([])

    const [formData, setFormData] = useState({
        categories: user?.categories || [] as string[],
        sellerProductOptions: user?.sellerProductOptions || {} as Record<string, Record<string, any>>,
        availableLocations: user?.availableLocations || {} as Record<string, string[]>,
    })
    const [locations, setLocations] = useState<any[]>([])
    const [availableProducts, setAvailableProducts] = useState<{ id: string, name: string, sub_products?: string[] }[]>([])
    const [allOptions, setAllOptions] = useState<Record<string, ProductOption[]>>({})

    useEffect(() => {
        const fetchCats = async () => {
            try {
                const { getProducts, getAllSellerProductOptions } = await import("@/lib/store")
                const [data, optsData, locRes] = await Promise.all([
                    getProducts(),
                    getAllSellerProductOptions(),
                    fetch("/api/locations")
                ])
                setAvailableProducts(data)
                setAllOptions(optsData)
                if (locRes.ok) {
                    const locData = await locRes.json()
                    setLocations(locData)
                }
            } catch (err) {
                logger.error("Failed to fetch products for My Products page", { error: (err as Error).message })
            }
        }
        fetchCats()
    }, [])

    useEffect(() => {
        if (user) {
            setFormData({
                categories: user.categories || [],
                sellerProductOptions: user.sellerProductOptions || {},
                availableLocations: user.availableLocations || {},
            })
        }
    }, [user])

    const toggleProductExpand = (catName: string) => {
        const isCurrentlyExpanded = expandedProducts.includes(catName);
        const isActive = formData.categories.includes(catName);

        if (!isCurrentlyExpanded && !isActive) {
            // If expanding a new product, initialize its options from empty
            setTempProductOptions({});
        }

        setExpandedProducts(prev =>
            prev.includes(catName) ? prev.filter(c => c !== catName) : [...prev, catName]
        )
    }

    const toggleLocationExpand = (stateName: string) => {
        const isCurrentlyExpanded = expandedLocations.includes(stateName);
        const isActive = !!formData.availableLocations[stateName];

        if (!isCurrentlyExpanded && !isActive) {
            // If expanding a new location, initialize its districts from empty
            setTempLocationDistricts([]);
        }

        setExpandedLocations(prev =>
            prev.includes(stateName) ? prev.filter(s => s !== stateName) : [...prev, stateName]
        )
    }

    const validateProduct = (catName: string, options: Record<string, any>) => {
        const productObj = availableProducts.find(p => p.name === catName)
        if (!productObj) return null

        // Check sub-products
        if (productObj.sub_products && productObj.sub_products.length > 0) {
            const subs = options["Sub-Products"]
            if (!subs || (Array.isArray(subs) && subs.length === 0)) {
                return `Please select at least one sub-product for ${catName}`
            }
        }

        // Check other options
        const pOptions = allOptions[productObj.id] || []
        for (const opt of pOptions) {
            if (opt.seller_option_type !== "none") {
                const val = options[opt.option_name]
                if (!val || (Array.isArray(val) && val.length === 0)) {
                    return `Please select at least one ${opt.option_name} for ${catName}`
                }
            }
        }
        return null
    }

    const saveProduct = async (catName: string) => {
        if (!user) return

        const error = validateProduct(catName, tempProductOptions)
        if (error) {
            toast.error(error)
            return
        }

        setLoading(true)
        try {
            const newCategories = formData.categories.includes(catName)
                ? formData.categories
                : [...formData.categories, catName]

            const newOptions = {
                ...formData.sellerProductOptions,
                [catName]: tempProductOptions
            }

            const data = await updateUser(user.id, {
                categories: newCategories,
                sellerProductOptions: newOptions,
            })

            if (!data) throw new Error("Failed to update product")

            if (updateUserData) updateUserData(data)
            toast.success(`${catName} updated successfully`)
            setEditingProduct(null)
            if (!expandedProducts.includes(catName)) {
                setExpandedProducts(prev => [...prev, catName])
            }
        } catch (error) {
            toast.error("Failed to save product")
        } finally {
            setLoading(false)
        }
    }

    const deleteProduct = async (catName: string) => {
        if (!user) return
        if (!confirm(`Are you sure you want to remove ${catName}?`)) return

        setLoading(true)
        try {
            const newCategories = formData.categories.filter(c => c !== catName)
            const newOptions = { ...formData.sellerProductOptions }
            delete newOptions[catName]

            const data = await updateUser(user.id, {
                categories: newCategories,
                sellerProductOptions: newOptions,
            })

            if (!data) throw new Error("Failed to remove product")

            if (updateUserData) updateUserData(data)
            toast.success(`${catName} removed`)
            setExpandedProducts(prev => prev.filter(c => c !== catName))
        } catch (error) {
            toast.error("Failed to remove product")
        } finally {
            setLoading(false)
        }
    }

    const saveLocation = async (stateName: string) => {
        if (!user) return

        if (tempLocationDistricts.length === 0) {
            toast.error("Please select at least one district")
            return
        }

        setLoading(true)
        try {
            const newLocs = {
                ...formData.availableLocations,
                [stateName]: tempLocationDistricts
            }

            const data = await updateUser(user.id, {
                availableLocations: newLocs,
            })

            if (!data) throw new Error("Failed to update location")

            if (updateUserData) updateUserData(data)
            toast.success(`${stateName} updated successfully`)
            setEditingLocation(null)
            if (!expandedLocations.includes(stateName)) {
                setExpandedLocations(prev => [...prev, stateName])
            }
        } catch (error) {
            toast.error("Failed to save location")
        } finally {
            setLoading(false)
        }
    }

    const deleteLocation = async (stateName: string) => {
        if (!user) return
        if (!confirm(`Are you sure you want to remove ${stateName}?`)) return

        setLoading(true)
        try {
            const newLocs = { ...formData.availableLocations }
            delete newLocs[stateName]

            const data = await updateUser(user.id, {
                availableLocations: newLocs,
            })

            if (!data) throw new Error("Failed to remove location")

            if (updateUserData) updateUserData(data)
            toast.success(`${stateName} removed`)
            setExpandedLocations(prev => prev.filter(s => s !== stateName))
        } catch (error) {
            toast.error("Failed to remove location")
        } finally {
            setLoading(false)
        }
    }

    if (user?.role !== "seller" && user?.role !== "both") {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <p className="text-muted-foreground">You don't have permission to view this page.</p>
            </div>
        )
    }

    const activeProductCount = formData.categories.length
    const activeLocationCount = Object.keys(formData.availableLocations).length

    return (
        <div className="mx-auto max-w-4xl pb-20 px-4 md:px-0">
            {/* Page Header */}
            <div className="mb-10">
                <h2 className="font-serif text-3xl font-bold text-foreground tracking-tight">My Products & Locations</h2>
                <p className="mt-2 text-muted-foreground text-[15px]">
                    Configure the products you supply and the regions you deliver to.
                </p>
                {/* Summary Stats */}
                <div className="mt-5 flex flex-wrap gap-3">
                    <div className="flex items-center gap-2 rounded-full bg-primary/10 border border-primary/20 px-4 py-1.5 text-sm font-medium text-primary">
                        <Package className="h-3.5 w-3.5" />
                        {activeProductCount} Product{activeProductCount !== 1 ? "s" : ""} Active
                    </div>
                    <div className="flex items-center gap-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-4 py-1.5 text-sm font-medium text-emerald-500">
                        <MapPin className="h-3.5 w-3.5" />
                        {activeLocationCount} Location{activeLocationCount !== 1 ? "s" : ""} Covered
                    </div>
                </div>
            </div>

            <div className="space-y-14">
                {/* ═══════════════════════ Products Section ═══════════════════════ */}
                <section>
                    <div className="flex items-center gap-3 mb-5">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 border border-primary/20">
                            <Layers className="h-4.5 w-4.5 text-primary" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-foreground">Products I Sell</h3>
                            <p className="text-xs text-muted-foreground">Click a product to configure or add it to your catalog.</p>
                        </div>
                    </div>

                    <div className="space-y-3">
                        {availableProducts.map((product) => {
                            const catName = product.name
                            const isActive = formData.categories.includes(catName)
                            const isEditing = editingProduct === catName
                            const isExpanded = expandedProducts.includes(catName)
                            const isConfiguring = isEditing || (isExpanded && !isActive)
                            const currentOptions = isConfiguring ? tempProductOptions : (formData.sellerProductOptions[catName] || {})
                            const pOptions = allOptions[product.id] || []
                            const savedOptionCount = Object.values(formData.sellerProductOptions[catName] || {}).filter(v => Array.isArray(v) ? v.length > 0 : !!v).length

                            return (
                                <div
                                    key={product.id}
                                    className={`rounded-xl border transition-all duration-200 ${isActive
                                        ? 'border-primary/30 bg-card shadow-sm'
                                        : 'border-border/60 bg-card/50 hover:border-border'
                                        } ${isEditing || (isExpanded && !isActive) ? 'ring-2 ring-primary/20' : ''}`}
                                >
                                    {/* Product Header Row */}
                                    <div
                                        className="flex items-center justify-between px-4 py-3.5 cursor-pointer select-none group"
                                        onClick={() => toggleProductExpand(catName)}
                                    >
                                        <div className="flex items-center gap-3 min-w-0">
                                            {/* Status Indicator */}
                                            {isActive ? (
                                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/15">
                                                    <CheckCircle2 className="h-4 w-4 text-primary" />
                                                </div>
                                            ) : (
                                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted/60">
                                                    <Circle className="h-4 w-4 text-muted-foreground/50" />
                                                </div>
                                            )}
                                            <div className="min-w-0">
                                                <div className={`font-semibold text-lg truncate ${isActive ? 'text-foreground' : 'text-muted-foreground'}`}>
                                                    {catName}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <div onClick={(e) => e.stopPropagation()}>
                                                {(isEditing || (isExpanded && !isActive)) ? (
                                                    <div className="flex gap-2">
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            className="h-8 px-3 text-xs text-muted-foreground hover:text-foreground"
                                                            onClick={() => {
                                                                setEditingProduct(null)
                                                                if (!isActive) setExpandedProducts(prev => prev.filter(c => c !== catName))
                                                            }}
                                                            disabled={loading}
                                                        >
                                                            Cancel
                                                        </Button>
                                                        {(() => {
                                                            const isValid = validateProduct(catName, tempProductOptions) === null;
                                                            return (
                                                                <Button
                                                                    size="sm"
                                                                    className={`h-8 px-4 text-xs font-medium gap-1.5 ${isValid ? 'bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm' : 'bg-muted text-muted-foreground cursor-not-allowed'}`}
                                                                    onClick={() => saveProduct(catName)}
                                                                    disabled={loading}
                                                                >
                                                                    {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <><Save className="h-3.5 w-3.5" /> Save</>}
                                                                </Button>
                                                            );
                                                        })()}
                                                    </div>
                                                ) : (
                                                    isActive && (
                                                        <div className="flex gap-1.5">
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                className="h-8 w-8 p-0 text-muted-foreground hover:text-primary hover:bg-primary/10"
                                                                onClick={() => {
                                                                    setEditingProduct(catName)
                                                                    setTempProductOptions(formData.sellerProductOptions[catName] || {})
                                                                }}
                                                                disabled={loading}
                                                                title="Edit product"
                                                            >
                                                                <Pencil className="h-3.5 w-3.5" />
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                                                onClick={() => deleteProduct(catName)}
                                                                disabled={loading}
                                                                title="Remove product"
                                                            >
                                                                <X className="h-3.5 w-3.5" />
                                                            </Button>
                                                        </div>
                                                    )
                                                )}
                                            </div>
                                            <div className="ml-1 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors">
                                                {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Product Content */}
                                    {(isEditing || isExpanded) && (
                                        <div className="border-t border-border/50">
                                            {(isEditing || (isExpanded && !isActive)) ? (
                                                <div className="p-5 space-y-5">
                                                    {/* Sub-Products */}
                                                    {product.sub_products && product.sub_products.length > 0 && (
                                                        <div className="space-y-2.5">
                                                            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                                                Sub-Products <span className="text-primary">*</span>
                                                            </Label>
                                                            <div className="flex flex-wrap gap-2">
                                                                {product.sub_products.map(sub => {
                                                                    const checked = (tempProductOptions["Sub-Products"] || []).includes(sub)
                                                                    return (
                                                                        <label
                                                                            key={sub}
                                                                            className={`inline-flex items-center gap-2 text-sm cursor-pointer transition-all duration-150 px-3.5 py-2 rounded-lg border ${checked
                                                                                ? 'bg-primary border-primary text-primary-foreground font-medium shadow-sm'
                                                                                : 'bg-muted/30 border-border text-muted-foreground hover:border-primary/40 hover:bg-muted/50'
                                                                                }`}
                                                                        >
                                                                            <Checkbox
                                                                                checked={checked}
                                                                                className={checked ? "border-primary-foreground/50 bg-primary-foreground/20 data-[state=checked]:bg-primary-foreground/20 data-[state=checked]:text-primary-foreground" : ""}
                                                                                onCheckedChange={(c: boolean) => {
                                                                                    const prev = tempProductOptions["Sub-Products"] || []
                                                                                    const next = c ? [...prev, sub] : prev.filter((s: string) => s !== sub)
                                                                                    setTempProductOptions({ ...tempProductOptions, "Sub-Products": next })
                                                                                }}
                                                                            />
                                                                            {sub}
                                                                        </label>
                                                                    )
                                                                })}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Dynamic Options */}
                                                    {pOptions.map(opt => {
                                                        const isMulti = opt.seller_option_type === "dropdown" || opt.seller_option_type === "checkbox"
                                                        if (!isMulti || !opt.dropdown_values) return null

                                                        const currentVals = tempProductOptions[opt.option_name] || []
                                                        return (
                                                            <div key={opt.id} className="space-y-2.5">
                                                                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                                                    {opt.option_name} <span className="text-primary">*</span>
                                                                </Label>
                                                                <div className="flex flex-wrap gap-2">
                                                                    {opt.dropdown_values.map(val => {
                                                                        const checked = currentVals.includes(val)
                                                                        return (
                                                                            <label
                                                                                key={val}
                                                                                className={`inline-flex items-center gap-2 text-sm cursor-pointer transition-all duration-150 px-3.5 py-2 rounded-lg border ${checked
                                                                                    ? 'bg-primary border-primary text-primary-foreground font-medium shadow-sm'
                                                                                    : 'bg-muted/30 border-border text-muted-foreground hover:border-primary/40 hover:bg-muted/50'
                                                                                    }`}
                                                                            >
                                                                                <Checkbox
                                                                                    checked={checked}
                                                                                    className={checked ? "border-primary-foreground/50 bg-primary-foreground/20 data-[state=checked]:bg-primary-foreground/20 data-[state=checked]:text-primary-foreground" : ""}
                                                                                    onCheckedChange={(c: boolean) => {
                                                                                        const next = c ? [...currentVals, val] : currentVals.filter((v: string) => v !== val)
                                                                                        setTempProductOptions({ ...tempProductOptions, [opt.option_name]: next })
                                                                                    }}
                                                                                />
                                                                                {val}
                                                                            </label>
                                                                        )
                                                                    })}
                                                                </div>
                                                            </div>
                                                        )
                                                    })}
                                                </div>
                                            ) : (
                                                /* Read-Only Summary */
                                                <div className="px-5 py-4 space-y-3">
                                                    {Object.entries(currentOptions).map(([optName, optVals]) => {
                                                        const isArray = Array.isArray(optVals)
                                                        if (isArray && optVals.length === 0) return null
                                                        return (
                                                            <div key={optName}>
                                                                <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70 mb-1.5">{optName}</div>
                                                                <div className="flex flex-wrap gap-1.5">
                                                                    {isArray ? (optVals as string[]).map(v => (
                                                                        <span key={v} className="inline-flex items-center bg-primary/8 text-primary border border-primary/15 px-2.5 py-1 rounded-md text-xs font-medium">{v}</span>
                                                                    )) : <span className="inline-flex items-center bg-primary/8 text-primary border border-primary/15 px-2.5 py-1 rounded-md text-xs font-medium">{String(optVals)}</span>}
                                                                </div>
                                                            </div>
                                                        )
                                                    })}
                                                    {Object.keys(currentOptions).length === 0 && (
                                                        <p className="text-xs text-muted-foreground/60 italic py-1">No specifications configured. Click Edit to set up.</p>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                </section>

                {/* ═══════════════════════ Locations Section ═══════════════════════ */}
                <section>
                    <div className="flex items-center gap-3 mb-5">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                            <Globe className="h-4.5 w-4.5 text-emerald-500" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-foreground">Delivery Locations</h3>
                            <p className="text-xs text-muted-foreground">Select the states and districts you deliver to.</p>
                        </div>
                    </div>

                    <div className="space-y-3">
                        {locations.map((loc) => {
                            const stateName = loc.state_name
                            const isActive = !!formData.availableLocations[stateName]
                            const isEditing = editingLocation === stateName
                            const isExpanded = expandedLocations.includes(stateName)
                            const isConfiguring = isEditing || (isExpanded && !isActive)
                            const currentDistricts = isConfiguring ? tempLocationDistricts : (formData.availableLocations[stateName] || [])
                            const districtCount = (formData.availableLocations[stateName] || []).length

                            return (
                                <div
                                    key={loc.id}
                                    className={`rounded-xl border transition-all duration-200 ${isActive
                                        ? 'border-emerald-500/30 bg-card shadow-sm'
                                        : 'border-border/60 bg-card/50 hover:border-border'
                                        } ${isEditing || (isExpanded && !isActive) ? 'ring-2 ring-emerald-500/20' : ''}`}
                                >
                                    {/* Location Header Row */}
                                    <div
                                        className="flex items-center justify-between px-4 py-3.5 cursor-pointer select-none group"
                                        onClick={() => toggleLocationExpand(stateName)}
                                    >
                                        <div className="flex items-center gap-3 min-w-0">
                                            {isActive ? (
                                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/15">
                                                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                                </div>
                                            ) : (
                                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted/60">
                                                    <Circle className="h-4 w-4 text-muted-foreground/50" />
                                                </div>
                                            )}
                                            <div className="min-w-0">
                                                <div className={`font-semibold text-[15px] truncate ${isActive ? 'text-foreground' : 'text-muted-foreground'}`}>
                                                    {stateName}
                                                </div>
                                                {isActive && districtCount > 0 && !isEditing && (
                                                    <div className="text-[11px] text-muted-foreground mt-0.5">
                                                        {districtCount} district{districtCount !== 1 ? "s" : ""} covered
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <div onClick={(e) => e.stopPropagation()}>
                                                {(isEditing || (isExpanded && !isActive)) ? (
                                                    <div className="flex gap-2">
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            className="h-8 px-3 text-xs text-muted-foreground hover:text-foreground"
                                                            onClick={() => {
                                                                setEditingLocation(null)
                                                                if (!isActive) setExpandedLocations(prev => prev.filter(s => s !== stateName))
                                                            }}
                                                            disabled={loading}
                                                        >
                                                            Cancel
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            onClick={() => saveLocation(stateName)}
                                                            disabled={loading || tempLocationDistricts.length === 0}
                                                            className={`h-8 px-4 text-xs font-medium gap-1.5 ${tempLocationDistricts.length > 0 ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm' : 'bg-muted text-muted-foreground cursor-not-allowed'}`}
                                                        >
                                                            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <><Save className="h-3.5 w-3.5" /> Save</>}
                                                        </Button>
                                                    </div>
                                                ) : (
                                                    isActive && (
                                                        <>
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                className="h-8 w-8 p-0 text-muted-foreground hover:text-emerald-600 hover:bg-emerald-500/10"
                                                                onClick={() => {
                                                                    setEditingLocation(stateName)
                                                                    setTempLocationDistricts(formData.availableLocations[stateName] || [])
                                                                }}
                                                                disabled={loading}
                                                                title="Edit location"
                                                            >
                                                                <Pencil className="h-3.5 w-3.5" />
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                                                onClick={() => deleteLocation(stateName)}
                                                                disabled={loading}
                                                                title="Remove location"
                                                            >
                                                                <X className="h-3.5 w-3.5" />
                                                            </Button>
                                                        </>
                                                    )
                                                )}
                                            </div>
                                            <div className="ml-1 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors">
                                                {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Location Content */}
                                    {(isEditing || isExpanded) && (
                                        <div className="border-t border-border/50">
                                            {(isEditing || (isExpanded && !isActive)) ? (
                                                <div className="p-5 space-y-3">
                                                    <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                                        Select Districts
                                                    </Label>
                                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                                        {loc.districts?.map((dist: string) => {
                                                            const checked = currentDistricts.includes(dist)
                                                            return (
                                                                <label
                                                                    key={dist}
                                                                    className={`inline-flex items-center gap-2 text-sm cursor-pointer transition-all duration-150 px-3.5 py-2 rounded-lg border ${checked
                                                                        ? 'bg-emerald-600 border-emerald-600 text-white font-medium shadow-sm'
                                                                        : 'bg-muted/30 border-border text-muted-foreground hover:border-emerald-500/40 hover:bg-muted/50'
                                                                        }`}
                                                                >
                                                                    <Checkbox
                                                                        checked={checked}
                                                                        className={checked ? "border-white/50 bg-white/20 data-[state=checked]:bg-white/20 data-[state=checked]:text-white" : ""}
                                                                        onCheckedChange={(c: boolean) => {
                                                                            const next = c ? [...currentDistricts, dist] : currentDistricts.filter(d => d !== dist)
                                                                            setTempLocationDistricts(next)
                                                                        }}
                                                                    />
                                                                    {dist}
                                                                </label>
                                                            )
                                                        })}
                                                    </div>
                                                    {(!loc.districts || loc.districts.length === 0) && (
                                                        <p className="text-sm text-muted-foreground italic">No districts defined for this state.</p>
                                                    )}
                                                </div>
                                            ) : (
                                                /* Read-Only Summary */
                                                <div className="px-5 py-4">
                                                    <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70 mb-2">Covered Districts</div>
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {currentDistricts.length > 0 ? currentDistricts.map(d => (
                                                            <span key={d} className="inline-flex items-center bg-emerald-500/8 text-emerald-600 dark:text-emerald-400 border border-emerald-500/15 px-2.5 py-1 rounded-md text-xs font-medium">{d}</span>
                                                        )) : <span className="text-xs text-muted-foreground/60 italic">All Districts Covered</span>}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                </section>
            </div>
        </div>
    )
}
