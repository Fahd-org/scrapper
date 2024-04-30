const puppeteer = require("puppeteer");

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function calculateWithGrothRate(dataFetcher, cnt = 10, sleepMs = 1000) {
  let data;

  for (let i = 0; i < cnt; i++) {
    console.log(`fetching Home data(${i + 1}/${cnt})...`);
    let newData = await dataFetcher();
    newData = newData.map((d, idx) => ({
      ...d,
      growthRate: data
        ? (data[idx].growthRate ?? 0) +
          (d.value - data[idx].value) / (d.timestamp - data[idx].timestamp)
        : 0,
    }));
    data = newData;
    await sleep(sleepMs);
  }

  data = data.map((d) => ({
    ...d,
    growthRate: d.growthRate / Math.max(1, cnt - 1),
  }));

  return data;
}

async function fetchTableyData(url) {
  const browser = await puppeteer.launch({
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  const page = await browser.newPage();
  await page.goto(url, {
    waitUntil: "networkidle2",
  });

  const result = await page.evaluate(() => {
    const rows = document.querySelectorAll("#example2 tr");
    return Array.from(rows, (row) => {
      const columns = row.querySelectorAll("td");
      return Array.from(columns, (column) => column.innerText);
    });
  });

  await browser.close();
  return result;
}

module.exports = { sleep, calculateWithGrothRate, fetchTableyData };
