import { describe, it, expect } from "vitest";
import { isAllowedOrigin, corsHeaders, handlePreflight, addCorsHeaders } from "../src/cors";

describe("isAllowedOrigin", () => {
  it("localhost:3000은 허용된 origin이다", () => {
    expect(isAllowedOrigin("http://localhost:3000")).toBe(true);
  });

  it("feedme.vercel.app은 허용된 origin이다", () => {
    expect(isAllowedOrigin("https://feedme.vercel.app")).toBe(true);
  });

  it("preview deployment (feedme-git-xxx.vercel.app)은 허용된 origin이다", () => {
    expect(isAllowedOrigin("https://feedme-git-feature-branch.vercel.app")).toBe(true);
    expect(isAllowedOrigin("https://feedme-git-main.vercel.app")).toBe(true);
  });

  it("malicious.com은 허용되지 않는다", () => {
    expect(isAllowedOrigin("https://malicious.com")).toBe(false);
  });

  it("null origin은 허용되지 않는다", () => {
    expect(isAllowedOrigin(null)).toBe(false);
  });

  it("빈 문자열은 허용되지 않는다", () => {
    expect(isAllowedOrigin("")).toBe(false);
  });
});

describe("corsHeaders", () => {
  it("Access-Control-Allow-Origin에 요청 origin을 설정한다", () => {
    const headers = corsHeaders("https://feedme.vercel.app");
    expect(headers["Access-Control-Allow-Origin"]).toBe("https://feedme.vercel.app");
  });

  it("Access-Control-Allow-Methods를 설정한다", () => {
    const headers = corsHeaders("https://feedme.vercel.app");
    expect(headers["Access-Control-Allow-Methods"]).toBe("POST, OPTIONS");
  });

  it("Access-Control-Allow-Headers를 설정한다", () => {
    const headers = corsHeaders("https://feedme.vercel.app");
    expect(headers["Access-Control-Allow-Headers"]).toBe("Content-Type");
  });
});

describe("handlePreflight", () => {
  it("OPTIONS 요청이 아닌 경우 null을 반환한다", () => {
    const request = new Request("https://worker.example.com/", {
      method: "POST",
      headers: { Origin: "https://feedme.vercel.app" },
    });
    expect(handlePreflight(request)).toBeNull();
  });

  it("허용된 origin의 OPTIONS 요청 → 204 + CORS 헤더", () => {
    const request = new Request("https://worker.example.com/", {
      method: "OPTIONS",
      headers: { Origin: "https://feedme.vercel.app" },
    });
    const response = handlePreflight(request);
    expect(response).not.toBeNull();
    expect(response!.status).toBe(204);
    expect(response!.headers.get("Access-Control-Allow-Origin")).toBe("https://feedme.vercel.app");
  });

  it("비허용 origin의 OPTIONS 요청 → 204이지만 CORS 헤더 없음", () => {
    const request = new Request("https://worker.example.com/", {
      method: "OPTIONS",
      headers: { Origin: "https://malicious.com" },
    });
    const response = handlePreflight(request);
    expect(response).not.toBeNull();
    expect(response!.status).toBe(204);
    expect(response!.headers.get("Access-Control-Allow-Origin")).toBeNull();
  });

  it("origin 없는 OPTIONS 요청 → 204이지만 CORS 헤더 없음", () => {
    const request = new Request("https://worker.example.com/", {
      method: "OPTIONS",
    });
    const response = handlePreflight(request);
    expect(response).not.toBeNull();
    expect(response!.status).toBe(204);
    expect(response!.headers.get("Access-Control-Allow-Origin")).toBeNull();
  });
});

describe("addCorsHeaders", () => {
  it("허용된 origin 요청 → 응답에 CORS 헤더 추가", () => {
    const request = new Request("https://worker.example.com/", {
      method: "POST",
      headers: { Origin: "https://feedme.vercel.app" },
    });
    const original = new Response(JSON.stringify({ ok: true }), { status: 200 });
    const response = addCorsHeaders(original, request);
    expect(response.headers.get("Access-Control-Allow-Origin")).toBe("https://feedme.vercel.app");
  });

  it("비허용 origin 요청 → 응답에 CORS 헤더 없음", () => {
    const request = new Request("https://worker.example.com/", {
      method: "POST",
      headers: { Origin: "https://malicious.com" },
    });
    const original = new Response(JSON.stringify({ ok: true }), { status: 200 });
    const response = addCorsHeaders(original, request);
    expect(response.headers.get("Access-Control-Allow-Origin")).toBeNull();
  });

  it("origin 없는 요청 → 응답에 CORS 헤더 없음", () => {
    const request = new Request("https://worker.example.com/", {
      method: "POST",
    });
    const original = new Response(JSON.stringify({ ok: true }), { status: 200 });
    const response = addCorsHeaders(original, request);
    expect(response.headers.get("Access-Control-Allow-Origin")).toBeNull();
  });

  it("localhost origin 요청 → 응답에 CORS 헤더 추가", () => {
    const request = new Request("https://worker.example.com/", {
      method: "POST",
      headers: { Origin: "http://localhost:3000" },
    });
    const original = new Response(JSON.stringify({ ok: true }), { status: 200 });
    const response = addCorsHeaders(original, request);
    expect(response.headers.get("Access-Control-Allow-Origin")).toBe("http://localhost:3000");
  });
});
