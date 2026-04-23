/**
 * Shared background style for all main layouts (auth, funnel, dashboard).
 * Apply to container divs for consistent visual style.
 */
export const appBackgroundStyle: React.CSSProperties = {
  backgroundColor: '#EEF7FB',
  backgroundImage: 'radial-gradient(#00A1CD18 2px, transparent 2px)',
  backgroundSize: '24px 24px',
};

export const blobTopRight: React.CSSProperties = {
  background: 'radial-gradient(circle, #00A1CD14 0%, #00A1CD05 45%, transparent 70%)',
};

export const blobBottomLeft: React.CSSProperties = {
  background: 'radial-gradient(circle, #A3E63514 0%, #A3E63505 45%, transparent 70%)',
};

export function backgroundStyle(): React.CSSProperties {
  return appBackgroundStyle;
}
