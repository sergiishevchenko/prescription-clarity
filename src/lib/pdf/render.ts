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

interface ChromiumModule {
  executablePath: () => Promise<string>;
  args: string[];
}

async function getChromiumConfig() {
  if (isVercelEnvironment()) {
    try {
      const chromium = await import("@sparticuz/chromium");
      const chromiumModule = (chromium.default || chromium) as unknown as ChromiumModule;
      
      if (!chromiumModule || typeof chromiumModule.executablePath !== "function") {
        throw new Error("Invalid chromium module: executablePath is not a function");
      }
      
      const executablePath = await chromiumModule.executablePath();
      const baseArgs = Array.isArray(chromiumModule.args) ? chromiumModule.args : [];
      
      if (!executablePath) {
        throw new Error("Chromium executablePath returned empty value");
      }
      
      return {
        executablePath,
        args: [
          ...baseArgs,
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
          "--disable-accelerated-2d-canvas",
          "--disable-gpu",
          "--single-process",
          "--disable-software-rasterizer",
        ],
      };
    } catch (error) {
      console.error("Failed to load @sparticuz/chromium:", error);
      if (error instanceof Error) {
        console.error("Error details:", error.message, error.stack);
      }
      throw new Error(
        `Failed to initialize Chromium for PDF generation on Vercel: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
  return {
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
    args:
      process.env.CHROMIUM_ARGS?.split(" ").filter(Boolean) ??
      DEFAULT_LAUNCH_ARGS,
  };
}

export async function renderPdfBuffer(
  html: string,
  options?: { timeoutMs?: number },
): Promise<Buffer> {
  const timeoutMs = options?.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const isVercel = isVercelEnvironment();
  const chromiumConfig = await getChromiumConfig();

  let browser;
  if (isVercel) {
    if (!chromiumConfig.executablePath) {
      throw new Error(
        "Chromium executable path is required on Vercel. @sparticuz/chromium may not be installed.",
      );
    }
    browser = await puppeteerCore.launch({
      headless: true,
      executablePath: chromiumConfig.executablePath,
      args: chromiumConfig.args,
    });
  } else {
    const launchOptions: {
      headless: boolean;
      executablePath?: string;
      args: string[];
    } = {
      headless: true,
      args: chromiumConfig.args,
    };
    if (chromiumConfig.executablePath) {
      launchOptions.executablePath = chromiumConfig.executablePath;
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
