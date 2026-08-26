import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatOptionType(type: string): string {
  switch (type.toLowerCase()) {
    case 'number': return 'No.'
    case 'dropdown': return 'Type'
    case 'radio': return 'Option'
    default: return type.charAt(0).toUpperCase() + type.slice(1)
  }
}

export function formatOptionLabel(label: string): string {
  if (!label) return label
  let cleaned = label
  // Remove all parenthesized, bracketed, or braced substrings (e.g., "(Example: 40×20)", "(No.)", "[...]", "{...}")
  while (/\([^)]*\)|\[[^\]]*\]|\{[^}]*\}/.test(cleaned)) {
    cleaned = cleaned.replace(/\s*\([^)]*\)|\s*\[[^\]]*\]|\s*\{[^}]*\}/g, '')
  }
  return cleaned.trim() || label.trim()
}

export function validatePassword(password: string) {
  return {
    minLength: true,
    hasUpper: true, // Restrictions removed as requested
    hasLower: true,
    hasNumber: true,
    hasSpecial: true,
  }
}

export function sortInquiryOptions(options: Record<string, any>, metadata: any[] = []) {
  return Object.entries(options).sort(([keyA], [keyB]) => {
    const nameA = keyA.toLowerCase().trim().split('(')[0].trim()
    const nameB = keyB.toLowerCase().trim().split('(')[0].trim()

    // 1. Manufacturer Always First
    const isManA = nameA === "manufacturer"
    const isManB = nameB === "manufacturer"
    if (isManA && !isManB) return -1
    if (!isManA && isManB) return 1

    // 2. Locked Options (Metadata-driven) Next
    if (metadata && metadata.length > 0) {
      const metaA = metadata.find(m => m.option_name === keyA || `${m.option_name} (${formatTypeLabel(m.buyer_option_type)})` === keyA)
      const metaB = metadata.find(m => m.option_name === keyB || `${m.option_name} (${formatTypeLabel(m.buyer_option_type)})` === keyB)

      const isLockedA = metaA ? (metaA.seller_option_type && metaA.seller_option_type !== 'none') : false
      const isLockedB = metaB ? (metaB.seller_option_type && metaB.seller_option_type !== 'none') : false

      if (isLockedA && !isLockedB) return -1
      if (!isLockedA && isLockedB) return 1
    }

    // 3. Quantity & Measurement Always Last (Measurement second last)
    const specialEndOrder = ["quantity measurement", "quantity"]
    const endIdxA = specialEndOrder.indexOf(nameA)
    const endIdxB = specialEndOrder.indexOf(nameB)

    if (endIdxA !== -1 && endIdxB !== -1) return endIdxA - endIdxB
    if (endIdxA !== -1) return 1
    if (endIdxB !== -1) return -1

    // 4. Alphabetical for others
    return keyA.localeCompare(keyB)
  })
}

function formatTypeLabel(type: string) {
  switch (type) {
    case 'radio': return 'Radio';
    case 'checkbox': return 'Checkbox';
    case 'dropdown': return 'Dropdown';
    case 'number': return 'Number';
    case 'text': return 'Text';
    default: return type;
  }
}
