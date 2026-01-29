"use client";

export default function RedirectNoticePage() {
  return (
    <div
      style={{
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
        background: "linear-gradient(135deg, #1a365d 0%, #2d3748 50%, #1a202c 100%)",
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
        direction: "rtl",
      }}
    >
      <div
        style={{
          background: "rgba(255, 255, 255, 0.95)",
          borderRadius: "24px",
          padding: "60px 50px",
          textAlign: "center",
          maxWidth: "500px",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.4)",
        }}
      >
        <div style={{ fontSize: "64px", marginBottom: "24px" }}>🕌</div>
        <h1
          style={{
            color: "#1a365d",
            fontSize: "32px",
            marginBottom: "16px",
            fontWeight: 700,
          }}
        >
          انتقلنا إلى موقعنا الجديد
        </h1>
        <p
          style={{
            color: "#4a5568",
            fontSize: "20px",
            lineHeight: 1.8,
            marginBottom: "32px",
          }}
        >
          تفضل بزيارتنا على الرابط الجديد
        </p>
        <a
          href="https://maarij.sa"
          style={{
            display: "inline-block",
            background: "linear-gradient(135deg, #2b6cb0 0%, #1a365d 100%)",
            color: "white",
            textDecoration: "none",
            padding: "16px 48px",
            borderRadius: "12px",
            fontSize: "20px",
            fontWeight: 600,
            boxShadow: "0 4px 15px rgba(43, 108, 176, 0.4)",
            transition: "transform 0.2s, box-shadow 0.2s",
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.transform = "translateY(-2px)";
            e.currentTarget.style.boxShadow = "0 6px 20px rgba(43, 108, 176, 0.5)";
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "0 4px 15px rgba(43, 108, 176, 0.4)";
          }}
        >
          maarij.sa
        </a>
      </div>
    </div>
  );
}
