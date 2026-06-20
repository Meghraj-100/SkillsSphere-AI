const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const CONFIG = {
  baseUrl: 'http://localhost:5174/mock-interview',
  screenshotDir: './screenshots',
  videoDir: './feature-videos',
  video: { width: 1280, height: 720 },
  timeouts: {
    pageLoad: 2000,
    sessionStart: 3000,
    elementWait: 5000,
    sentiment: 8000,
    question: 6000,
  },
  selectors: {
    startButton: [
      'text=Start',
      'text=Begin',
      'button[data-testid="start"]',
      '[aria-label="Start Interview"]',
      'text=Start Interview',
    ],
    endButton: [
      'text=End Session',
      'text=Finish',
      '[data-testid="end-session"]',
      '[aria-label="End Interview"]',
    ],
    sentimentIndicator: [
      '[data-testid="sentiment"]',
      '.sentiment-indicator',
      '[aria-label="Sentiment"]',
      '[data-testid="sentiment-score"]',
      '.sentiment-score',
    ],
    questionText: [
      '[data-testid="question"]',
      '.question-text',
      '[aria-label="Interview Question"]',
      '[class*="question"]',
    ],
    timerIndicator: [
      '[data-testid="timer"]',
      '.timer',
      '[aria-label="Timer"]',
      '[class*="timer"]',
      '[class*="countdown"]',
    ],
    answerInput: [
      'textarea',
      '[data-testid="answer"]',
      '[contenteditable="true"]',
      '[aria-label="Answer"]',
    ],
    scoreDisplay: [
      '[data-testid="score"]',
      '.score',
      '[aria-label="Score"]',
      '[class*="score"]',
    ],
  },
};

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function attachNetworkLogger(page) {
  page.on('requestfailed', req => {
    console.warn(`[network] failed: ${req.method()} ${req.url()} — ${req.failure()?.errorText}`);
  });
  page.on('response', res => {
    if (res.status() >= 400) {
      console.warn(`[network] ${res.status()} ${res.url()}`);
    }
  });
}

function attachConsoleLogger(page) {
  page.on('console', msg => {
    if (msg.type() === 'error') console.warn(`[console.error] ${msg.text()}`);
  });
  page.on('pageerror', err => {
    console.warn(`[page.error] ${err.message}`);
  });
}

async function tryClick(page, selectors, timeout = 5000) {
  for (const sel of selectors) {
    try {
      await page.click(sel, { timeout });
      console.log(`[click] matched: ${sel}`);
      return sel;
    } catch { continue; }
  }
  return null;
}

async function waitForAny(page, selectors, timeout = 5000) {
  for (const sel of selectors) {
    try {
      await page.waitForSelector(sel, { timeout });
      console.log(`[found] selector: ${sel}`);
      return sel;
    } catch { continue; }
  }
  return null;
}

async function waitForNavigation(page, expectedPath, timeout = 5000) {
  try {
    await page.waitForURL(`**${expectedPath}**`, { timeout });
    console.log(`[nav] reached: ${expectedPath}`);
    return true;
  } catch {
    console.warn(`[warn] expected ${expectedPath} — current: ${page.url()}`);
    return false;
  }
}

async function capture(page, filename, label) {
  const filePath = path.join(CONFIG.screenshotDir, filename);
  await page.screenshot({ path: filePath, fullPage: true });
  console.log(`[screenshot] ${label} → ${filePath}`);
  return filePath;
}

async function debugPageElements(page) {
  const buttons = await page.$$eval('button', els => els.map(e => e.innerText.trim()));
  console.log('[debug] buttons:', buttons);
  const testIds = await page.$$eval('[data-testid]', els => els.map(e => e.dataset.testid));
  console.log('[debug] testids:', testIds);
  const classes = await page.$$eval('[class*="sentiment"]', els => els.map(e => e.className));
  console.log('[debug] sentiment classes:', classes);
}

async function extractSentimentData(page, sel) {
  return page.$eval(sel, el => ({
    text: el.innerText ?? el.textContent ?? null,
    ariaLabel: el.getAttribute('aria-label') ?? null,
    dataset: { ...el.dataset },
    className: el.className,
  }));
}

async function extractQuestionData(page) {
  const sel = await waitForAny(page, CONFIG.selectors.questionText, CONFIG.timeouts.question);
  if (!sel) {
    console.warn('[warn] question text not found — check CONFIG.selectors.questionText');
    return null;
  }
  const data = await page.$eval(sel, el => ({
    text: el.innerText ?? el.textContent ?? null,
    dataset: { ...el.dataset },
  }));
  console.log('[question] data:', JSON.stringify(data, null, 2));
  return data;
}

async function extractTimerData(page) {
  const sel = await waitForAny(page, CONFIG.selectors.timerIndicator, 3000);
  if (!sel) {
    console.warn('[warn] timer not found — check CONFIG.selectors.timerIndicator');
    return null;
  }
  const text = await page.$eval(sel, el => el.innerText ?? el.textContent ?? null);
  console.log(`[timer] value: ${text}`);
  return text;
}

async function extractScoreData(page) {
  const sel = await waitForAny(page, CONFIG.selectors.scoreDisplay, 3000);
  if (!sel) {
    console.warn('[warn] score display not found — check CONFIG.selectors.scoreDisplay');
    return null;
  }
  const data = await page.$eval(sel, el => ({
    text: el.innerText ?? el.textContent ?? null,
    dataset: { ...el.dataset },
  }));
  console.log('[score] data:', JSON.stringify(data, null, 2));
  return data;
}

async function typeAnswer(page, answer) {
  const sel = await waitForAny(page, CONFIG.selectors.answerInput, CONFIG.timeouts.elementWait);
  if (!sel) {
    console.warn('[warn] answer input not found — check CONFIG.selectors.answerInput');
    return false;
  }
  await page.fill(sel, answer);
  console.log(`[fill] answer typed via: ${sel}`);
  return true;
}

(async () => {
  ensureDir(CONFIG.screenshotDir);
  ensureDir(CONFIG.videoDir);

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    recordVideo: { dir: CONFIG.videoDir, size: CONFIG.video },
  });

  try {
    const page = await context.newPage();
    attachNetworkLogger(page);
    attachConsoleLogger(page);

    // --- Lobby ---
    console.log('[nav] loading lobby...');
    await page.goto(CONFIG.baseUrl, { waitUntil: 'networkidle' });
    await page.waitForTimeout(CONFIG.timeouts.pageLoad);
    await capture(page, '01-lobby.png', 'lobby loaded');
    await debugPageElements(page);

    // --- Start session ---
    const startSel = await tryClick(page, CONFIG.selectors.startButton, CONFIG.timeouts.elementWait);
    if (startSel) {
      await page.waitForTimeout(CONFIG.timeouts.sessionStart);
      await capture(page, '02-session-active.png', 'session started');
      await debugPageElements(page);

      // --- Question detection ---
      await extractQuestionData(page);
      await capture(page, '03-question-visible.png', 'question loaded');

      // --- Timer detection ---
      await extractTimerData(page);

      // --- Type answer ---
      const answered = await typeAnswer(page, 'This is a test answer for the mock interview question.');
      if (answered) {
        await capture(page, '04-answer-typed.png', 'answer typed');
      }

      // --- Sentiment indicator ---
      const sentimentSel = await waitForAny(
        page,
        CONFIG.selectors.sentimentIndicator,
        CONFIG.timeouts.sentiment
      );
      if (sentimentSel) {
        await capture(page, '05-sentiment-visible.png', 'sentiment visible');
        const sentimentData = await extractSentimentData(page, sentimentSel);
        console.log(`[sentiment] data:`, JSON.stringify(sentimentData, null, 2));
      } else {
        console.warn('[warn] sentiment indicator not found — check CONFIG.selectors.sentimentIndicator');
        await capture(page, '05-sentiment-missing.png', 'sentiment not found');
      }

      // --- End session ---
      const endSel = await tryClick(page, CONFIG.selectors.endButton, CONFIG.timeouts.elementWait);
      if (endSel) {
        await page.waitForTimeout(CONFIG.timeouts.pageLoad);
        await capture(page, '06-session-ended.png', 'session ended');
        await waitForNavigation(page, '/mock-interview/results', 3000);
        await capture(page, '07-results-page.png', 'results page');

        // --- Score on results page ---
        await extractScoreData(page);
        await capture(page, '08-score-visible.png', 'score captured');
      } else {
        console.warn('[warn] end button not found — check CONFIG.selectors.endButton');
      }

    } else {
      console.warn('[warn] start button not found — check CONFIG.selectors.startButton');
      await capture(page, '02-start-missing.png', 'start button not found');
    }

  } catch (err) {
    console.error('[error]', err.message);
    process.exit(1);
  } finally {
    await context.close();
    await browser.close();
    console.log('[done] video saved to', CONFIG.videoDir);
  }
})();