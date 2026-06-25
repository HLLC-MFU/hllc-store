export default function UnsupportedPage() {
  return (
    <html lang="th">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>HLLC Store</title>
      </head>
      <body style={{ margin: 0, padding: 0, background: "#f3f4f6", fontFamily: "Arial, 'Noto Sans Thai', sans-serif", minHeight: "100vh", display: "flex", flexDirection: "column" }}>

        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 24px", textAlign: "center" }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>📱</div>
          <div style={{ color: "#8b2420", fontSize: 22, fontWeight: 800, letterSpacing: 3, marginBottom: 4 }}>HLLC</div>
          <div style={{ color: "#6b7280", fontSize: 11, fontWeight: 700, letterSpacing: 2, marginBottom: 28 }}>ONLINE STORE</div>
          <h1 style={{ margin: "0 0 6px", fontSize: 20, fontWeight: 800, color: "#111827" }}>เบราว์เซอร์ไม่รองรับ</h1>
          <h2 style={{ margin: "0 0 20px", fontSize: 15, fontWeight: 700, color: "#374151" }}>Browser Not Supported</h2>
          <p style={{ margin: 0, fontSize: 14, color: "#4b5563", lineHeight: 1.7 }}>
            เบราว์เซอร์ของคุณไม่รองรับเว็บไซต์นี้<br />
            กรุณาติดต่อสั่งซื้อผ่านช่องทางด้านล่าง
          </p>
          <p style={{ margin: "12px 0 0", fontSize: 13, color: "#6b7280", lineHeight: 1.7 }}>
            Your browser is not supported.<br />
            Please contact us to place an order via the channels below.
          </p>
        </div>

        <footer style={{ background: "#8b2420", width: "100%" }}>
          <div style={{ maxWidth: 384, margin: "0 auto", padding: "32px 24px 112px", display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>

            <p style={{ margin: 0, fontSize: 11, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.15em", color: "rgba(255,255,255,0.5)" }}>
              ติดต่อเรา / Contact Us
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

              <a href="mailto:activity@mfu.ac.th" style={{ display: "flex", alignItems: "center", gap: 12, textDecoration: "none" }}>
                <div style={{ width: 36, height: 36, borderRadius: 12, background: "rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
                  </svg>
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.1em" }}>Email</p>
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "white" }}>activity@mfu.ac.th</p>
                </div>
              </a>

              <a href="https://instagram.com/mfu_activities" target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", gap: 12, textDecoration: "none" }}>
                <div style={{ width: 36, height: 36, borderRadius: 12, background: "rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="white" stroke="none"/>
                  </svg>
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.1em" }}>Instagram</p>
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "white" }}>@mfu_activities</p>
                </div>
              </a>

              <a href="https://facebook.com/mfuactivities" target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", gap: 12, textDecoration: "none" }}>
                <div style={{ width: 36, height: 36, borderRadius: 12, background: "rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
                  </svg>
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.1em" }}>Facebook</p>
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "white" }}>MFU Activities</p>
                </div>
              </a>

            </div>

            <p style={{ margin: 0, fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.3)", paddingTop: 8, borderTop: "1px solid rgba(255,255,255,0.1)", width: "100%", textAlign: "center" }}>
              © {new Date().getFullYear()} HLLC Store.
            </p>
          </div>
        </footer>

      </body>
    </html>
  );
}
