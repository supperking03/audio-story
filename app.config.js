const mobileConfig = require("./apps/mobile/app.json");
const rootConfig = require("./app.json");

const mobileExpo = mobileConfig.expo ?? {};
const rootExpo = rootConfig.expo ?? {};
const rootIos = rootExpo.ios ?? rootConfig.ios ?? {};

module.exports = {
  expo: {
    ...mobileExpo,
    ios: {
      ...(mobileExpo.ios ?? {}),
      ...rootIos
    }
  }
};
