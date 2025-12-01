import puppeteer from "puppeteer-core";

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

      return await puppeteer.launch({
        args: chromiumModule.args || [],
        executablePath: await chromiumModule.executablePath(),
        headless: chromiumModule.headless ?? true,
        defaultViewport: chromiumModule.defaultViewport ?? {
          width: 1920,
          height: 1080,
        },
      });
    } catch (error) {
      console.error("Failed to load @sparticuz/chromium:", error);
      throw new Error("Chromium module not available in Vercel environment");
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
  const timeoutMs = options?.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const browser = await launchBrowser();

  const page = await browser.newPage();

  try {
    await page.setContent(html, {
      waitUntil: "networkidle0",
      timeout: timeoutMs,
    });
    const pdfBuffer = await withTimeout(
      page.pdf(DEFAULT_PDF_OPTIONS),
      timeoutMs,
    );
    return Buffer.from(pdfBuffer);
  } finally {
    await page.close().catch(() => {});
    await browser.close().catch(() => {});
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
