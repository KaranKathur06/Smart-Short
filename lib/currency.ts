/**
 * Centralized currency formatting utilities for SmartShort
 * 
 * Currency Rules:
 * - CPM (Cost Per Mille) is always in USD ($)
 * - Earnings are always in INR (₹) for Indian users
 * - Conversion rate: 1 USD = 83 INR (configurable)
 */

/**
 * USD to INR conversion rate
 * This can be made dynamic in the future by fetching from an API
 */
export const USD_TO_INR_RATE = 83;

/**
 * CPM value in USD
 * Industry standard: Cost per 1000 ad views
 */
export const CPM_USD = 10;

/**
 * Format a number as USD currency
 * Used for: CPM display
 * @param amount - The amount to format
 * @returns Formatted string like "$10.00"
 */
export function formatUSD(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format a number as INR currency
 * Used for: Earnings display
 * @param amount - The amount to format
 * @returns Formatted string like "₹830.00"
 */
export function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Calculate earnings in INR from views and CPM
 * Formula: (views / 1000) * CPM_USD * USD_TO_INR_RATE
 * 
 * @param views - Number of valid ad views
 * @param cpmUsd - CPM rate in USD (default: CPM_USD constant)
 * @returns Earnings in INR
 * 
 * @example
 * calculateEarningsInINR(1000, 10) // Returns 830 (₹830)
 * calculateEarningsInINR(100, 10)  // Returns 83 (₹83)
 */
export function calculateEarningsInINR(
  views: number,
  cpmUsd: number = CPM_USD
): number {
  return (views / 1000) * cpmUsd * USD_TO_INR_RATE;
}

/**
 * Convert USD amount to INR
 * @param usdAmount - Amount in USD
 * @returns Amount in INR
 */
export function convertUSDToINR(usdAmount: number): number {
  return usdAmount * USD_TO_INR_RATE;
}

/**
 * Get the CPM value in INR (for display purposes only)
 * @returns CPM in INR
 */
export function getCPMInINR(): number {
  return CPM_USD * USD_TO_INR_RATE;
}
