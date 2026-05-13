import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const ROUTE_PATHS = {
  DASHBOARD: "/",
  USERS: "/users",
  FILMS: "/films",
  ASSETS: "/assets",
} as const;

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  status: "pending" | "approved" | "rejected";
}

export interface Film {
  id: string;
  title: string;
  category: string;
  tags: string[];
  description: string;
  thumbnail: string;
  status: "pending" | "approved" | "rejected";
  uploader: string;
  uploadDate: string;
  size: number;
}

export interface Asset {
  id: string;
  name: string;
  category: string;
  price: number;
  fileSize: number;
  format: "GLB";
  status: "pending" | "approved" | "rejected";
  uploader: string;
  uploadDate: string;
  tags: string[];
  polygons: number;
}

export interface Order {
  id: string;
  userId: string;
  userName: string;
  itemType: "film" | "asset";
  itemTitle: string;
  amount: number;
  date: string;
  status: "completed" | "pending" | "refunded";
}

export interface ContentItem {
  id: string;
  type: "film" | "asset" | "reported";
  title: string;
  submitter: string;
  submitDate: string;
  status: "pending" | "approved" | "rejected";
  thumbnail?: string;
  description?: string;
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatBytes(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}
