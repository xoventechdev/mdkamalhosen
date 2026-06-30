/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx,mdx}"],
  theme: {
    container: {
      center: true,
      padding: { DEFAULT: "1.25rem", sm: "1.5rem", lg: "2rem" },
      screens: { "2xl": "1200px" },
    },
    extend: {
      colors: {
        background: "rgb(var(--background) / <alpha-value>)",
        foreground: "rgb(var(--foreground) / <alpha-value>)",
        card: "rgb(var(--card) / <alpha-value>)",
        cardForeground: "rgb(var(--card-foreground) / <alpha-value>)",
        muted: "rgb(var(--muted) / <alpha-value>)",
        mutedForeground: "rgb(var(--muted-foreground) / <alpha-value>)",
        border: "rgb(var(--border) / <alpha-value>)",
        input: "rgb(var(--input) / <alpha-value>)",
        ring: "rgb(var(--ring) / <alpha-value>)",
        accent: {
          DEFAULT: "rgb(var(--accent) / <alpha-value>)",
          foreground: "rgb(var(--accent-foreground) / <alpha-value>)",
          soft: "rgb(var(--accent-soft) / <alpha-value>)",
        },
        // Category color coding — each project/blog domain gets a hue.
        cat: {
          bms: "rgb(var(--cat-bms) / <alpha-value>)",
          software: "rgb(var(--cat-software) / <alpha-value>)",
          iot: "rgb(var(--cat-iot) / <alpha-value>)",
          android: "rgb(var(--cat-android) / <alpha-value>)",
        },
        violet: {
          DEFAULT: "rgb(var(--violet) / <alpha-value>)",
          soft: "rgb(var(--violet-soft) / <alpha-value>)",
        },
        navy: {
          950: "#060b1a",
          900: "#0b1a3a",
          800: "#0f2552",
          700: "#1b3266",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["var(--font-jetbrains)", "ui-monospace", "monospace"],
      },
      borderRadius: {
        lg: "0.75rem",
        md: "0.5rem",
        sm: "0.375rem",
        xl: "1rem",
        "2xl": "1.25rem",
      },
      maxWidth: { prose: "68ch" },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-up-lg": {
          "0%": { opacity: "0", transform: "translateY(24px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "scale-in": {
          "0%": { opacity: "0", transform: "scale(0.96)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        "slide-in-right": {
          "0%": { transform: "translateX(100%)" },
          "100%": { transform: "translateX(0)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-8px)" },
        },
        "gradient-pan": {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
        "pulse-ring": {
          "0%": { transform: "scale(0.95)", opacity: "0.7" },
          "70%": { transform: "scale(1.2)", opacity: "0" },
          "100%": { transform: "scale(0.95)", opacity: "0" },
        },
        "spring-in": {
          "0%": { opacity: "0", transform: "translateY(20px) scale(0.98)" },
          "100%": { opacity: "1", transform: "translateY(0) scale(1)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.5s cubic-bezier(0.22, 1, 0.36, 1) both",
        "fade-up-lg": "fade-up-lg 0.6s cubic-bezier(0.22, 1, 0.36, 1) both",
        "fade-in": "fade-in 0.4s ease-out both",
        "scale-in": "scale-in 0.3s ease-out both",
        "slide-in-right": "slide-in-right 0.25s ease-out both",
        float: "float 4s ease-in-out infinite",
        "gradient-pan": "gradient-pan 12s ease infinite",
        shimmer: "shimmer 2s infinite",
        "pulse-ring": "pulse-ring 2s ease-out infinite",
        "spring-in": "spring-in 0.5s cubic-bezier(0.22, 1, 0.36, 1) both",
      },
      transitionTimingFunction: {
        spring: "cubic-bezier(0.22, 1, 0.36, 1)",
      },
      backgroundImage: {
        "grid-pattern":
          "linear-gradient(rgb(var(--border) / 0.5) 1px, transparent 1px), linear-gradient(90deg, rgb(var(--border) / 0.5) 1px, transparent 1px)",
        "radial-fade":
          "radial-gradient(circle at center, rgb(var(--accent) / 0.15), transparent 60%)",
      },
      backgroundSize: {
        grid: "32px 32px",
      },
      boxShadow: {
        card: "0 1px 2px rgba(11,26,58,0.06), 0 8px 24px rgba(11,26,58,0.04)",
        "card-hover":
          "0 14px 36px -6px rgba(11,26,58,0.14), 0 6px 14px -2px rgba(11,26,58,0.06)",
        glow: "0 0 32px -8px rgb(var(--accent) / 0.4)",
        "glow-bms": "0 0 36px -10px rgb(var(--cat-bms) / 0.45)",
        "glow-software": "0 0 36px -10px rgb(var(--cat-software) / 0.45)",
        "glow-iot": "0 0 36px -10px rgb(var(--cat-iot) / 0.45)",
        "glow-android": "0 0 36px -10px rgb(var(--cat-android) / 0.45)",
        "glow-violet": "0 0 36px -10px rgb(var(--violet) / 0.45)",
      },
    },
  },
  plugins: [],
};