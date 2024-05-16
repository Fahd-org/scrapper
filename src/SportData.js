const puppeteer = require("puppeteer");
const axios = require("axios");
const fs = require("fs");
const util = require("util");

const { sleep, calculateWithGrothRate } = require("./utils");
const SportTodayModel = require("./db/SportToday.model");
const KOORA_DOT_COM_URL = "https://clw.kooora.com/";
const YALLA_KOORA_DOT_COM_URL = "https://www.yallakora.com/match-center/";

async function fetchKooraHomeData() {
  const browser = await puppeteer.launch({
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  const page = await browser.newPage();
  console.log("Start ...");
  await page.goto(KOORA_DOT_COM_URL, {
    timeout: 60000,
    waitUntil: "domcontentloaded",
  });
  console.log("Page Loaded ...");

  await page.waitForSelector(".matchRow", { timeout: 60000 });
  console.log("got it");

  const currentMatches = await page.evaluate(() => {
    return [...document.querySelectorAll(".matchRow")].map((element) => {
      const liveTeam = element.querySelectorAll(".liveTeam");
      let teams = [];
      [...liveTeam].forEach((e) => {
        teams.push({
          name: e?.querySelector(".teamName")?.textContent,
          img: e?.querySelector("img")?.getAttribute("src"),
        });
      });
      const midEl = element?.querySelector(".liveDet");

      return {
        textContent: element?.textContent,
        teams,
        info: midEl?.innerText,
        element: element,
        timestamp: Date.now(),
      };
    });
  });
  console.log("Element Loaded Loaded ...");

  await browser.close();
  return { today: currentMatches };
}

async function downloadImage(url, filename) {
  try {
    if (!url) return;
    const response = await axios.get(url, { responseType: "arraybuffer" });
    console.log(`download ${filename}...`);

    fs.writeFile(filename, response.data, (err) => {
      if (err) throw err;
      console.log("Image downloaded successfully!");
    });

    return true;
  } catch (er) {
    console.log("Can't downloaded this image!");
    return false;
  }
}

async function fetchYallaKora() {
  const browser = await puppeteer.launch({
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  const page = await browser.newPage();
  console.log("Start ...");
  await page.goto(YALLA_KOORA_DOT_COM_URL, {
    timeout: 60000,
    waitUntil: "domcontentloaded",
  });
  console.log("Page Loaded ...");

  await page.waitForSelector(".allData", { timeout: 60000 });
  console.log("got it");

  const currentMatches = await page.evaluate(() => {
    return [...document.querySelectorAll(".allData")].map((element) => {
      const week = element?.querySelector(".date")?.textContent ?? "";
      const time = element?.querySelector(".time")?.textContent ?? "00:00";
      const status =
        element?.querySelector(".matchStatus span")?.textContent ?? "لم تبدأ";
      const teamA = {
        name: element?.querySelector(".teamA p")?.textContent ?? "",
        image: element?.querySelector(".teamA img")?.getAttribute("src") ?? "",
      };
      const teamB = {
        name: element?.querySelector(".teamB p")?.textContent ?? "",
        image: element?.querySelector(".teamB img")?.getAttribute("src") ?? "",
      };

      const score = {
        a:
          element?.querySelector(".MResult .score:nth-child(1)")?.textContent ??
          "-",
        b:
          element?.querySelector(".MResult .score:nth-child(3)")?.textContent ??
          "-",
      };

      return {
        week,
        time,
        status,
        teams: {
          a: teamA,
          b: teamB,
        },
        score: {
          a: score.a,
          b: score.b,
        },
        timestamp: Date.now(),
      };
    });
  });
  console.log("Element Loaded Loaded ...");

  await browser.close();
  return { today: currentMatches };
}

async function todayMatches() {
  const { today } = await fetchYallaKora();

  console.log("start proccess image");

  for (let i = 0; i < today.length; i++) {
    const match = today[i];

    const imageUrl1 = match.teams.a.image.startsWith("//")
      ? `https:${match.teams.a.image}`
      : match.teams.a.image;

    const imageUrl2 = match?.teams.b.image?.img?.startsWith("//")
      ? `https:${match.teams.b.image}`
      : match.teams.b.image;

    const imageName1 = `serve/content/images/teams/${match.teams.a.name}-65.png`;
    const imageName2 = `serve/content/images/teams/${match.teams.b.name}-65.png`;
    let state1 = true;
    let state2 = true;

    if (!fs.existsSync(imageName1)) {
      console.log(`Can't find image ${imageName1}.`);
      state1 = await downloadImage(imageUrl1, imageName1);
      await sleep(5000);
    }
    if (!fs.existsSync(imageName2)) {
      console.log(`Can't find image ${imageName2}.`);
      state2 = await downloadImage(imageUrl2, imageName2);
      await sleep(5000);
    }

    if (state1) today[i].teams.a.image = imageName1;
    if (state2) today[i].teams.b.image = imageName2;
  }

  return today;
}

async function saveSportData() {
  const today = await todayMatches();
  await SportTodayModel.deleteMany();
  console.log("delete all old matches");
  for (let i = 0; i < today.length; i++) {
    const match = new SportTodayModel(today[i]);
    await match.save();
    console.log(
      `Match ${today[i].teams.a.name}-${today[i].teams.b.name} saved succuffully.`
    );
  }
}

module.exports = { saveSportData, todayMatches, fetchKooraHomeData };
