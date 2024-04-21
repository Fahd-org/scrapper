const puppeteer = require("puppeteer");
const { fetchTableyData } = require("./utils");
const EnergyModel = require("./db/Energy.model");

async function saveEnergyData() {
  let data = await fetchTableyData("https://www.worldometers.info/energy/");

  for (const d of data) {
    if (d.length < 5) continue;
    const found = await EnergyModel.findOne({ country: d[1] });
    if (found) {
      console.log(`Skip ${d[1]}`);
      continue;
    }

    const food = new EnergyModel({
      rank: Number(d[0]),
      country: d[1],
      consumed: d[2],
      worldShare: d[3],
      perCapita: d[4],
    });
    await food.save();
    console.log(`Save ${food.country}`);
  }
}

module.exports = { saveEnergyData };
