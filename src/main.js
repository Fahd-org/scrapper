require("dotenv").config();
const { connect } = require("./db/config");
const { calculateHomeData } = require("./HomeData");
const { fetchFoodData } = require("./FoodData");
const FoodModel = require("./db/Food.model");
const { saveEnergyData } = require("./EnergyData");
const {
  fetchKooraHomeData,
  todayMatches,
  saveSportData,
} = require("./SportData");
const util = require("util");

(async function main() {
  try {
    // connect to database
    console.log("start connecting to db will take some seconds ......");
    await connect();
    // await saveFoodData();
    // await saveEnergyData();

    // await saveHomeData();

    // const kooraData = await todayMatches();
    // console.log(util.inspect(kooraData, { depth: null, colors: true }));

    await saveSportData();
    // console.log();

    console.log("Script finishe Succefully !!");
    process.exit(0);
  } catch (er) {
    console.error(er);
    console.error("Script has error!");
    process.exit(-1);
  }
})();

async function saveFoodData() {
  let data = await fetchFoodData();

  for (const d of data) {
    if (d.length < 5) continue;
    const food = new FoodModel({
      rank: Number(d[0]),
      country: d[1],
      value: d[2],
      precentage: d[3],
      pop: d[4],
    });
    await food.save();
    console.log(`Save ${food.country}`);
  }
}

async function saveHomeData() {
  console.log("::HOME DATA::");

  const data = await calculateHomeData(2, 1000);
  const HomeModule = require("./db/Home.model");

  for (const d of data) {
    const old = await HomeModule.findOne().byRel(d.rel);

    if (old) {
      const growthRate =
        ((d.value - old.value) / (d.timestamp - old.timestamp) +
          old.growthRate +
          d.growthRate) /
        3;

      old.growthRate = growthRate;
      old.value = d.value;
      old.timestamp = d.timestamp;
      await old.save();
      console.log("Update: ", d.rel);
    } else {
      const homeModule = new HomeModule(d);
      await homeModule.save();
      console.log("Saved: ", d.rel);
    }
  }

  console.log("::HOME DATA(Finished)::");
}
