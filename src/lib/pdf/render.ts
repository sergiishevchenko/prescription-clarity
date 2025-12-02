import puppeteer from "puppeteer-core";

const VERCEL_TIMEOUT_MS = 8000;
const DEFAULT_TIMEOUT_MS = 20000;

const DEFAULT_PDF_OPTIONS = {
  format: "A4" as const,
  printBackground: true,
  margin: {
    top: "8mm",
    bottom: "10mm",
    left: "8mm",
    right: "8mm",
  },
};

const DEFAULT_LAUNCH_ARGS = [
  "--no-sandbox",
  "--disable-setuid-sandbox",
  "--disable-dev-shm-usage",
  "--disable-accelerated-2d-canvas",
  "--disable-gpu",
];

export class PdfTimeoutError extends Error {
  constructor(message = "PDF rendering timed out") {
    super(message);
    this.name = "PdfTimeoutError";
  }
}

export class PdfChromiumError extends Error {
  constructor(message = "Chromium failed to launch") {
    super(message);
    this.name = "PdfChromiumError";
  }
}

function isVercelEnvironment(): boolean {
  return !!(
    process.env.VERCEL ||
    process.env.AWS_LAMBDA_FUNCTION_NAME ||
    process.env.VERCEL_ENV
  );
}

async function launchBrowser() {
  const isVercel = isVercelEnvironment();

  if (isVercel) {
    try {
      const chromium = await import(
        /* webpackIgnore: true */ "@sparticuz/chromium"
      );
      const chromiumModule = chromium.default || chromium;

      const executablePath = await chromiumModule.executablePath();
      if (!executablePath) {
        throw new PdfChromiumError("Chromium executable path not available");
      }

      const chromiumArgs = [
        ...(chromiumModule.args || []),
        "--disable-dev-shm-usage",
        "--disable-software-rasterizer",
        "--disable-gpu",
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-web-security",
        "--disable-features=IsolateOrigins,site-per-process",
        "--disable-site-isolation-trials",
      ];

      const headlessValue =
        typeof chromiumModule.headless === "boolean"
          ? chromiumModule.headless
          : true;

      return await puppeteer.launch({
        args: chromiumArgs,
        executablePath,
        headless: headlessValue,
        defaultViewport: chromiumModule.defaultViewport ?? {
          width: 1920,
          height: 1080,
        },
      });
    } catch (error) {
      if (error instanceof PdfChromiumError) {
        throw error;
      }
      console.error("Failed to load @sparticuz/chromium:", error);
      throw new PdfChromiumError(
        `Chromium module not available: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  return await puppeteer.launch({
    headless: true,
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
    args:
      process.env.CHROMIUM_ARGS?.split(" ").filter(Boolean) ??
      DEFAULT_LAUNCH_ARGS,
  });
}

export async function renderPdfBuffer(
  html: string,
  options?: { timeoutMs?: number },
): Promise<Buffer> {
  const isVercel = isVercelEnvironment();
  const timeoutMs =
    options?.timeoutMs ?? (isVercel ? VERCEL_TIMEOUT_MS : DEFAULT_TIMEOUT_MS);

  if (html.length > 5 * 1024 * 1024) {
    throw new Error("HTML content too large for PDF generation");
  }

  let browser;
  let page;

  try {
    browser = await launchBrowser();
    page = await browser.newPage();

    const waitUntil = isVercel ? "domcontentloaded" : "networkidle0";

    await page.setContent(html, {
      waitUntil,
      timeout: Math.min(timeoutMs, 5000),
    });

    if (isVercel) {
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    const pdfBuffer = await withTimeout(
      page.pdf(DEFAULT_PDF_OPTIONS),
      timeoutMs - 2000,
    );
    return Buffer.from(pdfBuffer);
  } catch (error) {
    if (error instanceof PdfTimeoutError || error instanceof PdfChromiumError) {
      throw error;
    }
    console.error("PDF rendering error:", error);
    throw new Error(
      `PDF generation failed: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  } finally {
    if (page) {
      await page.close().catch(() => {});
    }
    if (browser) {
      await browser.close().catch(() => {});
    }
  }
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number) {
  let timeoutHandle: NodeJS.Timeout;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutHandle = setTimeout(() => reject(new PdfTimeoutError()), timeoutMs);
  });
  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    clearTimeout(timeoutHandle!);
  }
}
