export const manifest = {
  screens: {
    scr_ru6bw3: { name: "Sign in", route: "/login", state: { "authenticated": false, "authStatus": "unauthenticated" }, position: { "x": 160, "y": 220 } },
    scr_sorg4e: { name: "Signing in", route: "/login", state: { "authenticated": false, "authStatus": "authenticating" }, position: { "x": 1560, "y": 220 } },
    scr_wdq5qy: { name: "Sign-in failed", route: "/login", state: { "authenticated": false, "authStatus": "error" }, position: { "x": 2960, "y": 220 } },
    scr_9ra9c7: { name: "Dashboard", route: "/dashboard", state: { "authenticated": true }, position: { "x": 160, "y": 2200 } },
    scr_9ydyf1: { name: "Compose New Email", route: "/compose", state: { "authenticated": true }, position: { "x": 160, "y": 4180 } },
    scr_c7768m: { name: "Scheduled Emails", route: "/scheduled", state: { "authenticated": true }, position: { "x": 1560, "y": 4180 } },
    scr_ai8ve3: { name: "Sent Emails", route: "/sent", state: { "authenticated": true }, position: { "x": 2960, "y": 4180 } }
  },
  sections: {
    sec_yf1qlv: { name: "Authentication", x: 0, y: 0, width: 4320, height: 1180 },
    sec_g9w7z7: { name: "Dashboard", x: 0, y: 1980, width: 1520, height: 1180 },
    sec_4w1owf: { name: "Email Management", x: 0, y: 3960, width: 4320, height: 1180 }
  },
  layers: [
  { kind: "section", id: "sec_yf1qlv", children: [
    { kind: "screen", id: "scr_ru6bw3" },
    { kind: "screen", id: "scr_sorg4e" },
    { kind: "screen", id: "scr_wdq5qy" }]
  },
  { kind: "section", id: "sec_g9w7z7", children: [
    { kind: "screen", id: "scr_9ra9c7" }]
  },
  { kind: "section", id: "sec_4w1owf", children: [
    { kind: "screen", id: "scr_9ydyf1" },
    { kind: "screen", id: "scr_c7768m" },
    { kind: "screen", id: "scr_ai8ve3" }]
  }]

};