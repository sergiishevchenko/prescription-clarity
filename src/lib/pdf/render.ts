import puppeteer from "puppeteer";
import puppeteerCore from "puppeteer-core";

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

async function getChromiumExecutablePath(): Promise<string | undefined> {
  if (isVercelEnvironment()) {
    try {
      const chromium = (await import("@sparticuz/chromium")) as {
        executablePath?: () => Promise<string>;
      };
      if (chromium.executablePath) {
        return await chromium.executablePath();
      }
    } catch (error) {
      console.warn("Failed to load @sparticuz/chromium:", error);
    }
  }
  return process.env.PUPPETEER_EXECUTABLE_PATH || undefined;
}

async function getLaunchArgs(): Promise<string[]> {
  if (isVercelEnvironment()) {
    try {
      const chromium = (await import("@sparticuz/chromium")) as {
        args?: string[];
      };
      return chromium.args || DEFAULT_LAUNCH_ARGS;
    } catch (error) {
      console.warn("Failed to load @sparticuz/chromium args:", error);
    }
  }
  return (
    process.env.CHROMIUM_ARGS?.split(" ").filter(Boolean) ?? DEFAULT_LAUNCH_ARGS
  );
}

export async function renderPdfBuffer(
  html: string,
  options?: { timeoutMs?: number },
): Promise<Buffer> {
  const timeoutMs = options?.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const isVercel = isVercelEnvironment();
  const launchArgs = await getLaunchArgs();
  const executablePath = await getChromiumExecutablePath();

  let browser;
  if (isVercel) {
    if (!executablePath) {
      throw new Error(
        "Chromium executable path is required on Vercel. @sparticuz/chromium may not be installed.",
      );
    }
    browser = await puppeteerCore.launch({
      headless: true,
      executablePath,
      args: launchArgs,
    });
  } else {
    const launchOptions: {
      headless: boolean;
      executablePath?: string;
      args: string[];
    } = {
      headless: true,
      args: launchArgs,
    };
    if (process.env.PUPPETEER_EXECUTABLE_PATH) {
      launchOptions.executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;
    }
    browser = await puppeteer.launch(launchOptions);
  }

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
