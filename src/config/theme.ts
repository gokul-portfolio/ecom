/**
 * Centralized Theme Configuration
 * Single source of truth for programmatic styling, charts, and inline styles.
 */
export const themeConfig = {
  name: "Midnight Navy & Gold",
  colors: {
    primary: "var(--color-primary)",
    primaryHover: "var(--color-primary-hover)",
    primaryActive: "var(--color-primary-active)",
    primaryLight: "var(--color-primary-light)",
    primaryGlow: "var(--color-primary-glow)",

    secondary: "var(--color-secondary)",
    secondaryHover: "var(--color-secondary-hover)",
    secondaryLight: "var(--color-secondary-light)",

    background: "var(--color-background)",
    surface: "var(--color-surface)",
    surfaceSecondary: "var(--color-surface-secondary)",

    sidebar: "var(--color-sidebar)",
    sidebarSurface: "var(--color-sidebar-surface)",
    sidebarBorder: "var(--color-sidebar-border)",
    sidebarText: "var(--color-sidebar-text)",
    sidebarTextActive: "var(--color-sidebar-text-active)",

    header: "var(--color-header)",
    border: "var(--color-border)",

    textPrimary: "var(--color-text-primary)",
    textSecondary: "var(--color-text-secondary)",
    textMuted: "var(--color-text-muted)",

    success: "var(--color-success)",
    warning: "var(--color-warning)",
    danger: "var(--color-danger)",
    info: "var(--color-info)",
  },
  layout: {
    headerHeight: 68,
    headerHeightMobile: 60,
    sidebarWidth: 260,
    sidebarCollapsedWidth: 76,
    contentMaxWidth: 1600,
  },
  gradients: {
    gold: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
    navy: "linear-gradient(145deg, #0b1329 0%, #162033 60%, #1e293b 100%)",
  },
} as const;
