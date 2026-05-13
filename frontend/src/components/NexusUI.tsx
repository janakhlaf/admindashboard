import React from "react";
import { Search, Trash2 } from "lucide-react";
import { cn } from "@/lib/index";

interface StatusBadgeProps {
  status: "pending" | "approved" | "rejected" | "completed" | "refunded";
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const variants = {
    pending: "badge-pending",
    approved: "badge-approved",
    rejected: "badge-rejected",
    completed: "badge-approved",
    refunded: "bg-muted/20 border border-muted-foreground/30 text-muted-foreground",
  };

  const labels = {
    pending: "Pending",
    approved: "Approved",
    rejected: "Rejected",
    completed: "Completed",
    refunded: "Refunded",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center px-3 py-1 rounded-full text-xs font-medium font-jetbrains",
        variants[status]
      )}
    >
      {labels[status]}
    </span>
  );
}

interface NeonButtonProps {
  variant: "approve" | "reject" | "delete" | "default";
  size: "sm" | "md";
  onClick?: () => void;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
}

export function NeonButton({
  variant,
  size,
  onClick,
  children,
  className,
  disabled,
}: NeonButtonProps) {
  const variants = {
    approve: "btn-neon-cyan",
    reject: "btn-neon-red",
    delete: "btn-neon-red",
    default: "btn-neon-purple",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2 text-sm",
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "inline-flex items-center gap-2 rounded-lg font-medium transition-all duration-200",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        variants[variant],
        sizes[size],
        className
      )}
    >
      {variant === "delete" && <Trash2 className="w-3.5 h-3.5" />}
      {children}
    </button>
  );
}

interface PageHeaderProps {
  title: string;
  badge?: string;
}

export function PageHeader({ title, badge }: PageHeaderProps) {
  return (
    <div className="flex items-center gap-4 mb-8">
      <h1 className="text-4xl font-bold font-orbitron bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
        {title}
      </h1>
      {badge && (
        <div
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full"
          style={{ background: 'oklch(0.65 0.18 155 / 0.12)', border: '1px solid oklch(0.65 0.18 155 / 0.4)' }}
        >
          <span
            className="w-2 h-2 rounded-full animate-pulse"
            style={{ background: 'oklch(0.72 0.20 155)' }}
          />
          <span className="text-xs font-medium font-jetbrains" style={{ color: 'oklch(0.80 0.18 155)' }}>
            {badge}
          </span>
        </div>
      )}
    </div>
  );
}

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function SearchInput({ value, onChange, placeholder }: SearchInputProps) {
  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder || "Search..."}
        className={cn(
          "w-full pl-10 pr-4 py-2.5 rounded-lg",
          "bg-card/50 border border-border",
          "text-foreground placeholder:text-muted-foreground",
          "focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary",
          "transition-all duration-200"
        )}
      />
    </div>
  );
}
