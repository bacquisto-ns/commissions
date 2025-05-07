import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(amount);
}

export function formatPercent(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value / 100);
}

export function getStatusColor(status: string): {
  bg: string;
  text: string;
} {
  switch (status.toLowerCase()) {
    case 'approved':
      return { bg: 'bg-approved/10', text: 'text-approved' };
    case 'pending':
      return { bg: 'bg-pending/10', text: 'text-pending' };
    case 'overdue':
      return { bg: 'bg-overdue/10', text: 'text-overdue' };
    default:
      return { bg: 'bg-gray-100', text: 'text-gray-500' };
  }
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return `${text.substring(0, maxLength)}...`;
}

export function getDaysDifference(date: Date): number {
  const today = new Date();
  const differenceInTime = today.getTime() - date.getTime();
  return Math.floor(differenceInTime / (1000 * 3600 * 24));
}

export function getPercentChangeString(current: number, previous: number): string {
  if (previous === 0) return '+100%';
  
  const percentChange = ((current - previous) / previous) * 100;
  const sign = percentChange >= 0 ? '+' : '';
  return `${sign}${percentChange.toFixed(1)}%`;
}
