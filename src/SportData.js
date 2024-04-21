const puppeteer = require("puppeteer");
const axios = require("axios");
const fs = require("fs");

const { sleep, calculateWithGrothRate } = require("./utils");
const SportTodayModel = require("./db/SportToday.model");
const KOORA_DOT_COM_URL = "https://www.kooora.com/";

async function fetchKooraHomeData() {
  const browser = await puppeteer.launch();
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
      const midElCh = midEl?.children[0];
      let info = {
        text: midEl?.textContent,
        line1: midElCh?.firstChild?.textContent,
        line2: midElCh?.lastChild?.textContent,
      };

      return {
        textContent: element?.textContent,
        teams,
        info,
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

    const imageUrl1 = match.teams[0].img.startsWith("https")
      ? match.teams[0].img
      : `https:${match.teams[0].img}`;

    const imageName1 = `serve/content/images/teams/${match.teams[0].name}-65.png`;
    const imageUrl2 = `https:${match.teams[1].img}`;
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
    const match = new SportTodayModel({
      teams: today[i].teams,
      info: {
        line1: today[i].info.line1,
        line2: today[i].info.line2,
      },
      timestamp: today[i].timestamp,
    });

    await match.save();
    console.log(`Match ${today[i].textContent} saved succuffully.`);
  }
}

module.exports = { saveSportData, todayMatches, fetchKooraHomeData };
