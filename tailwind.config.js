/** @type {import('tailwindcss').Config} */
module.exports = {
  // Every page plus the JS that injects classes (e.g. scroll-reveal states).
  content: ["./*.html", "./js/**/*.js"],

  // The site ships its own modern reset in src/input.css. Turning Preflight off
  // keeps that reset authoritative, so the compiled CSS renders identically to
  // the hand-written stylesheet this project started with.
  corePlugins: {
    preflight: false,
  },

  theme: {
    extend: {
      // The design tokens in src/input.css are the source of truth. Mapping
      // them here gives Tailwind the same palette, so utilities like
      // bg-surface, text-muted or border-line always match the components.
      colors: {
        bg: "var(--bg)",
        surface: {
          DEFAULT: "var(--surface)",
          soft: "var(--surface-2)",
        },
        line: {
          DEFAULT: "var(--border)",
          strong: "var(--border-strong)",
        },
        ink: {
          DEFAULT: "var(--text)",
          muted: "var(--muted)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          soft: "var(--accent-soft)",
          strong: "var(--accent-strong)",
        },
      },

      fontFamily: {
        mono: [
          "JetBrains Mono",
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "Consolas",
          "Liberation Mono",
          "monospace",
        ],
      },

      maxWidth: {
        container: "var(--container-width)",
      },

      borderRadius: {
        control: "var(--radius-sm)",
        card: "var(--radius-md)",
        panel: "var(--radius-lg)",
        pill: "var(--radius-pill)",
      },

      boxShadow: {
        card: "var(--shadow-card)",
      },

      spacing: {
        gutter: "var(--space-5)",
      },

      transitionDuration: {
        fast: "150ms",
      },
    },
  },

  plugins: [],
};
