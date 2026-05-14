const os = require("os");
const mobileConfig = require("./apps/mobile/app.json");
const rootConfig = require("./app.json");

// Auto-detect current LAN IP so the mobile app always finds the dev server,
// even after machine restarts or DHCP IP changes.
// Override by setting EXPO_PUBLIC_API_BASE_URL in your environment.
function detectLanIp() {
  const nets = os.networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === "IPv4" && !net.internal) {
        return net.address;
      }
    }
  }
  return "localhost";
}

const apiBaseUrl =
  process.env.EXPO_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ??
  `http://${detectLanIp()}:3000`;

const mobileExpo = mobileConfig.expo ?? {};
const rootExpo = rootConfig.expo ?? {};
const rootIos = rootExpo.ios ?? rootConfig.ios ?? {};

console.log(`[app.config.js] API base URL: ${apiBaseUrl}`);

module.exports = {
  expo: {
    ...mobileExpo,
    extra: {
      ...(mobileExpo.extra ?? {}),
      apiBaseUrl,
    },
    ios: {
      ...(mobileExpo.ios ?? {}),
      ...rootIos,
    },
  },
};
