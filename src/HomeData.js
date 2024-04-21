const puppeteer = require("puppeteer");
const { sleep, calculateWithGrothRate } = require("./utils");
const WORLD_METTER_URL = "https://www.worldometers.info/";

async function fetchHomeData() {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto(WORLD_METTER_URL, { waitUntil: "networkidle2" });

  const counters = await page.evaluate(() => {
    return [...document.querySelectorAll(".rts-counter")].map((element) => {
      return {
        textContent: element.textContent.trim(),
        value: Number(element.textContent.trim().replace(/,/g, "")),
        rel: element.getAttribute("rel"),
        timestamp: Date.now(),
      };
    });
  });

  await browser.close();
  return counters;
}

async function calculateHomeData(cnt, time) {
  //   let data;

  //   for (let i = 0; i < 2; i++) {
  //     console.log(`fetching Home data(${i + 1}/10)...`);
  //     let newData = await fetchHomeData();
  //     newData = newData.map((d, i) => ({
  //       ...d,
  //       growthRate: data
  //         ? ((data[i].growthRate ?? 0) + d.value - data[i].value) /
  //           (d.timestamp - data[i].timestamp)
  //         : 0,
  //     }));
  //     data = newData;
  //     sleep(1000);
  //   }

  //   data = data.map((d) => ({ ...d, growthRate: d.growthRate / 9 }));

  return calculateWithGrothRate(fetchHomeData, cnt, time);
}

module.exports = { fetchHomeData, calculateHomeData };
