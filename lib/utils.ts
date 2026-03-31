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
  return label
    .replace(/\(number\)/gi, '(No.)')
    .replace(/\(dropdown\)/gi, '(Type)')
    .replace(/\(radio\)/gi, '(Option)')
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
