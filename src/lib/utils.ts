import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getMonthKey(date: Date = new Date()): string {
    return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
}

export function getDayKey(date: Date = new Date()): string {
    return date.getDate().toString().padStart(2, '0');
}

export function getTodaysDateKey(): string {
    return getDayKey(new Date());
}
