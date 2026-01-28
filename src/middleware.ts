import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const host = request.headers.get("host") || "";

  // Redirect visitors from old Vercel domain to maarij.sa
  if (host.includes("khair-frontend-three.vercel.app")) {
    const html = `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>منصة معارج</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background: linear-gradient(135deg, #1a365d 0%, #2d3748 50%, #1a202c 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .container {
      background: rgba(255, 255, 255, 0.95);
      border-radius: 24px;
      padding: 60px 50px;
      text-align: center;
      max-width: 500px;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.4);
      animation: fadeIn 0.8s ease-out;
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .icon {
      font-size: 64px;
      margin-bottom: 24px;
    }
    h1 {
      color: #1a365d;
      font-size: 32px;
      margin-bottom: 16px;
      font-weight: 700;
    }
    p {
      color: #4a5568;
      font-size: 20px;
      line-height: 1.8;
      margin-bottom: 32px;
    }
    .highlight {
      color: #2b6cb0;
      font-weight: 600;
    }
    a.button {
      display: inline-block;
      background: linear-gradient(135deg, #2b6cb0 0%, #1a365d 100%);
      color: white;
      text-decoration: none;
      padding: 16px 48px;
      border-radius: 12px;
      font-size: 20px;
      font-weight: 600;
      transition: all 0.3s ease;
      box-shadow: 0 4px 15px rgba(43, 108, 176, 0.4);
    }
    a.button:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(43, 108, 176, 0.5);
    }
    .domain {
      direction: ltr;
      display: inline-block;
      font-weight: 700;
      color: #2b6cb0;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="icon">🌙</div>
    <h1>مرحبا</h1>
    <p>
      تم التغيير إلى دومين جديد
      <br>
      <span class="highlight">حياك هنا</span>
    </p>
    <a href="https://maarij.sa" class="button">
      <span class="domain">maarij.sa</span>
    </a>
  </div>
</body>
</html>
    `;

    return new NextResponse(html, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
      },
    });
  }

  // Note: Token is stored in localStorage which is not accessible in middleware
  // Authentication is handled client-side in the ProtectedRoute component
  // This middleware is kept minimal to allow client-side auth handling

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
