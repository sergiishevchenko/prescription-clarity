import puppeteer from "puppeteer";

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

const DEFAULT_LAUNCH_ARGS = ["--no-sandbox", "--disable-setuid-sandbox"];

export class PdfTimeoutError extends Error {
  constructor(message = "PDF rendering timed out") {
    super(message);
    this.name = "PdfTimeoutError";
  }
}

export async function renderPdfBuffer(
  html: string,
  options?: { timeoutMs?: number },
): Promise<Buffer> {
  const timeoutMs = options?.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const launchArgs =
    process.env.CHROMIUM_ARGS?.split(" ").filter(Boolean) ?? DEFAULT_LAUNCH_ARGS;

  const browser = await puppeteer.launch({
    headless: true,
    args: launchArgs,
  });
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
    timeoutHandle = setTimeout(
      () => reject(new PdfTimeoutError()),
      timeoutMs,
    );
  });
  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    clearTimeout(timeoutHandle!);
  }
}
