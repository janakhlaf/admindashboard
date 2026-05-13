import { motion } from "framer-motion";
import { Users, Film, Box, ShieldCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/NexusUI";
import { ROUTE_PATHS } from "@/lib/index";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.12 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 32 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 260, damping: 28 },
  },
};

const navItems = [
  {
    icon: Users,
    title: "Users",
    description: "View all registered users and their uploaded content",
    route: ROUTE_PATHS.USERS,
    glowColor: "oklch(0.72 0.20 195)",   // cyan
    borderColor: "oklch(0.72 0.20 195 / 0.5)",
    bgColor: "oklch(0.72 0.20 195 / 0.08)",
    iconColor: "oklch(0.80 0.18 195)",
  },
  {
    icon: Film,
    title: "Films",
    description: "Review, approve or reject film submissions",
    route: ROUTE_PATHS.FILMS,
    glowColor: "oklch(0.70 0.25 275)",   // purple
    borderColor: "oklch(0.70 0.25 275 / 0.5)",
    bgColor: "oklch(0.70 0.25 275 / 0.08)",
    iconColor: "oklch(0.78 0.22 275)",
  },
  {
    icon: Box,
    title: "Assets",
    description: "Manage 3D asset uploads and GLB file moderation",
    route: ROUTE_PATHS.ASSETS,
    glowColor: "oklch(0.70 0.22 340)",   // pink
    borderColor: "oklch(0.70 0.22 340 / 0.5)",
    bgColor: "oklch(0.70 0.22 340 / 0.08)",
    iconColor: "oklch(0.78 0.20 340)",
  },
  {
    icon: ShieldCheck,
    title: "Moderation",
    description: "Approve or reject content submitted by users",
    route: ROUTE_PATHS.USERS,
    glowColor: "oklch(0.78 0.18 85)",    // amber
    borderColor: "oklch(0.78 0.18 85 / 0.5)",
    bgColor: "oklch(0.78 0.18 85 / 0.08)",
    iconColor: "oklch(0.84 0.16 85)",
  },
];

export default function Overview() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen w-full bg-background relative overflow-hidden">
      {/* Grid background */}
      <div className="nexus-grid-bg absolute inset-0 pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center justify-start px-8 pt-16 pb-16">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-16 text-center"
        >
          <PageHeader title="Admin Page" badge="LIVE" />
        </motion.div>

        {/* Nav cards */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 w-full max-w-5xl"
        >
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.title}
                variants={cardVariants}
                whileHover={{ scale: 1.04, y: -4 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate(item.route)}
                style={{
                  background: `oklch(0.13 0.02 270 / 0.85)`,
                  backdropFilter: "blur(16px)",
                  border: `1px solid ${item.borderColor}`,
                  cursor: "pointer",
                }}
                className="relative rounded-2xl p-8 flex flex-col items-center text-center gap-5 transition-all duration-300 group overflow-hidden"
              >
                {/* Glow blob on hover */}
                <div
                  className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                  style={{
                    boxShadow: `0 0 40px ${item.glowColor} inset, 0 0 60px ${item.glowColor}`,
                  }}
                />

                {/* Icon circle */}
                <div
                  className="relative z-10 w-20 h-20 rounded-2xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110"
                  style={{
                    background: item.bgColor,
                    boxShadow: `0 0 24px ${item.glowColor}`,
                  }}
                >
                  <Icon
                    className="w-9 h-9"
                    style={{ color: item.iconColor }}
                  />
                </div>

                {/* Title */}
                <h3
                  className="relative z-10 text-xl font-bold font-orbitron tracking-wide"
                  style={{ color: item.iconColor }}
                >
                  {item.title}
                </h3>

                {/* Description */}
                <p className="relative z-10 text-sm text-muted-foreground leading-relaxed">
                  {item.description}
                </p>

                {/* Bottom accent line */}
                <div
                  className="absolute bottom-0 left-0 right-0 h-[2px] opacity-60 group-hover:opacity-100 transition-opacity duration-300"
                  style={{
                    background: `linear-gradient(90deg, transparent, ${item.glowColor}, transparent)`,
                  }}
                />
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </div>
  );
}
