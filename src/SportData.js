const puppeteer = require("puppeteer");
const axios = require("axios");
const fs = require("fs");
const util = require("util");

const { sleep, calculateWithGrothRate } = require("./utils");
const SportTodayModel = require("./db/SportToday.model");
const KOORA_DOT_COM_URL = "https://www.kooora.com/";

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

async function todayMatches() {
  const { today } = await fetchKooraHomeData();

  console.log("start proccess image");

  for (let i = 0; i < today.length; i++) {
    const match = today[i];

    const imageUrl1 = match.teams[0].img.startsWith("//")
      ? `https:${match.teams[0].img}`
      : match.teams[0].img;
    const imageUrl2 = match?.teams[1]?.img?.startsWith("//")
      ? `https:${match.teams[1].img}`
      : match.teams[1].img;

    const imageName1 = `serve/content/images/teams/${match.teams[0].name}-65.png`;
    const imageName2 = `serve/content/images/teams/${match.teams[1].name}-65.png`;
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

    if (state1) today[i].teams[0].img = imageName1;
    if (state2) today[i].teams[1].img = imageName2;
  }

  return today;
}

async function saveSportData() {
  const today = await todayMatches();
  await SportTodayModel.deleteMany();
  console.log("delete all old matches");
  for (let i = 0; i < today.length; i++) {
    const mData = {
      teams: today[i].teams,
      info: today[i].info,
      timestamp: today[i].timestamp,
    };
    const match = new SportTodayModel(mData);
    await match.save();
    console.log(`Match ${today[i].textContent} saved succuffully.`);
  }
}

module.exports = { saveSportData, todayMatches, fetchKooraHomeData };
