// Browser hanya berkomunikasi dengan aplikasi; Supabase dan Gemini tetap di server.
export function contentSecurityPolicy(nonce, development = false) {
  return [
    "default-src 'self'",
    `script-src 'self'${nonce ? ` 'nonce-${nonce}' 'strict-dynamic'` : ""}${development ? " 'unsafe-eval'" : ""}`,
    "script-src-attr 'none'",
    `style-src 'self' https://fonts.googleapis.com${development ? " 'unsafe-inline'" : nonce ? ` 'nonce-${nonce}'` : ""}`,
    "img-src 'self' data: blob: https: http:",
    "font-src 'self' https://fonts.gstatic.com",
    `connect-src 'self'${development ? " ws: wss:" : ""}`,
    "worker-src 'self'",
    "manifest-src 'self'",
    "object-src 'none'",
    "base-uri 'none'",
    "form-action 'self'",
    "frame-src 'none'",
    "frame-ancestors 'none'",
    ...(!development ? ["upgrade-insecure-requests"] : []),
  ].join("; ");
}

export const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "Strict-Transport-Security", value: "max-age=31536000" },
];
