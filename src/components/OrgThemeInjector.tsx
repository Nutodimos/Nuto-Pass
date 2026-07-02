/**
 * OrgThemeInjector — Server Component
 *
 * Injects CSS custom properties for the org's brand colours, and a
 * dynamic <link> tag for the org's custom favicon, into the <head>.
 *
 * Renders a <style> tag with:
 *   --org-primary: <hex>
 *   --org-primary-rgb: <r>, <g>, <b>
 *   --org-accent: <hex>
 *   --org-accent-rgb: <r>, <g>, <b>
 *
 * Must be placed inside the dashboard layout, before children.
 */

import type { OrgMetadata } from "@/types/organization";

/** Convert hex (#RRGGBB) to an "R, G, B" string for rgba() usage */
function hexToRgb(hex: string): string {
  const cleaned = hex.replace("#", "");
  const r = parseInt(cleaned.substring(0, 2), 16);
  const g = parseInt(cleaned.substring(2, 4), 16);
  const b = parseInt(cleaned.substring(4, 6), 16);
  if (isNaN(r) || isNaN(g) || isNaN(b)) return "10, 30, 75"; // CPENavy fallback
  return `${r}, ${g}, ${b}`;
}

interface OrgThemeInjectorProps {
  metadata: Partial<OrgMetadata> | null;
}

export default function OrgThemeInjector({ metadata }: OrgThemeInjectorProps) {
  const primaryColor = metadata?.uiConfig?.primaryColor || "#0A1E4B";
  const accentColor = metadata?.uiConfig?.accentColor || "#B99146";
  const faviconUrl = metadata?.uiConfig?.faviconUrl;
  const siteTitle = metadata?.uiConfig?.sidebarTitle;

  const cssVars = `:root {
  --org-primary: ${primaryColor};
  --org-primary-rgb: ${hexToRgb(primaryColor)};
  --org-accent: ${accentColor};
  --org-accent-rgb: ${hexToRgb(accentColor)};
}`;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: cssVars }} />
      {faviconUrl && (
        <link rel="icon" href={faviconUrl} type="image/x-icon" />
      )}
      {siteTitle && (
        <title>{siteTitle}</title>
      )}
    </>
  );
}
