import { ImageResponse } from "next/og";

export const runtime = "edge";

type OgType = "landing" | "blog" | "docs";

function titleFontSize(title: string) {
  const len = title.trim().length;
  if (len > 110) return 54;
  if (len > 90) return 60;
  if (len > 70) return 66;
  if (len > 55) return 72;
  return 78;
}

function parseOgType(v: string | null): OgType {
  if (v === "blog" || v === "docs" || v === "landing") return v;
  return "landing";
}

function formatDate(ms: number) {
  if (!Number.isFinite(ms)) return null;
  try {
    return new Date(ms).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return null;
  }
}

async function loadFont(request: Request, path: string) {
  const url = new URL(path, request.url);
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to load font: ${path} (${res.status})`);
  }
  return res.arrayBuffer();
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = parseOgType(searchParams.get("type"));

  let title = (searchParams.get("title") || "").trim();
  let subtitle = (searchParams.get("subtitle") || "").trim();
  let section = (searchParams.get("section") || "").trim();
  let date = formatDate(Number(searchParams.get("date")));

  const fontRegular = await loadFont(
    request,
    "/fonts/Reddit_Sans/static/RedditSans-Regular.ttf"
  );
  const fontBold = await loadFont(
    request,
    "/fonts/Reddit_Sans/static/RedditSans-Bold.ttf"
  );

  title = type === "landing" ? "Audio Metadata Simplified" : title || "Audexis";

  subtitle =
    type === "landing"
      ? "A powerful and intuitive audio metadata editor for macOS."
      : subtitle;

  section =
    type === "docs" && section ? section : type === "blog" && date ? date : "";

  return new ImageResponse(
    (
      <div
        tw="w-full h-full flex p-[60px]"
        style={{
          fontFamily: "Reddit Sans",
        }}
      >
        <div
          tw="w-full h-full flex flex-col justify-between rounded-[28px] border p-[56px]"
          style={{
            borderColor: "#272e38",
          }}
        >
          <div tw="flex items-center gap-[14px]">
            <div
              tw="w-[10px] h-[48px] rounded-full"
              style={{ backgroundColor: "#e11d48" }}
            />
            <div tw="flex flex-col ml-4">
              <div tw="text-[22px] font-bold" style={{}}>
                Audexis
              </div>
              <div tw="text-[16px]" style={{ color: "#2c323a" }}>
                {type === "landing"
                  ? "Audio metadata editor"
                  : type === "blog"
                  ? "Blog"
                  : "Documentation"}
              </div>
            </div>
          </div>

          <div tw="flex flex-col gap-[18px]">
            <div
              tw="flex flex-col max-w-[980px] max-h-[320px] overflow-hidden"
              style={{
                color: "var(--foreground)",
                fontWeight: 800,
                fontSize: titleFontSize(title),

                lineHeight: 1.05,
              }}
            >
              {type === "landing" ? (
                <>
                  <span>Audio Metadata</span>
                  <span style={{ color: "#e11d48" }}>&nbsp;Simplified</span>
                </>
              ) : (
                <span>{title}</span>
              )}
            </div>

            {subtitle ? (
              <div
                tw="text-[26px] leading-[1.25] max-w-[980px] max-h-[96px] overflow-hidden"
                style={{ color: "#2c323a" }}
              >
                {subtitle}
              </div>
            ) : null}

            {section ? (
              <div tw="flex items-center gap-[10px] mt-[6px]">
                <div
                  tw="h-[10px] w-[10px] rounded-full"
                  style={{ backgroundColor: "#e11d48" }}
                />
                <div
                  tw="text-[18px] font-medium ml-[6px]"
                  style={{ color: "#2c323a" }}
                >
                  {section}
                </div>
              </div>
            ) : null}
          </div>

          <div tw="flex items-center justify-between gap-[18px]">
            <div
              tw="flex items-center gap-[10px] text-[18px]"
              style={{
                color: "#2c323a",
                fontWeight: 500,
              }}
            >
              <span>www.audexis.app &nbsp;</span>
              <span style={{ opacity: 0.5 }}>•</span>
              <span>&nbsp;macOS &nbsp;</span>
              <span style={{ opacity: 0.5 }}>•</span>
              <span>&nbsp;Windows &nbsp;</span>
            </div>
            <div
              tw="rounded-[14px]  px-[14px] py-[10px] text-[18px] font-semibold border"
              style={{
                borderColor: "#e11d48",
                backgroundColor: "#e11d48",
                color: "#fff",
              }}
            >
              Free download
            </div>
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      fonts: [
        {
          name: "Reddit Sans",
          data: fontRegular,
          style: "normal",
          weight: 400,
        },
        {
          name: "Reddit Sans",
          data: fontBold,
          style: "normal",
          weight: 700,
        },
      ],
    }
  );
}
