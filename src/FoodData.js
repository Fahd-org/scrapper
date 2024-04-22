const puppeteer = require("puppeteer");

async function fetchFoodData() {
  const browser = await puppeteer.launch({
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  const page = await browser.newPage();
  await page.goto("https://www.worldometers.info/undernourishment/", {
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

module.exports = { fetchFoodData };
