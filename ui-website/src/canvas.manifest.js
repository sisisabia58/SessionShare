export const manifest = {
  screens: {
    scr_4wkpcm: { name: "Home", route: "/", position: { "x": 160, "y": 220 } },
    scr_amtlc3: { name: "Login", route: "/login", position: { "x": 160, "y": 2200 } },
    scr_72j7hm: { name: "Dashboard", route: "/dashboard", position: { "x": 1560, "y": 220 } },
    scr_sccmxl: { name: "Edit Profile", route: "/profile", position: { "x": 160, "y": 4180 } },
    scr_t92jnt: { name: "Activity Logs", route: "/logs", position: { "x": 1560, "y": 4180 } },
    scr_g86f5k: { name: "Purchase Premium", route: "/order-premium", position: { "x": 160, "y": 6160 } },
    scr_crl1xr: { name: "Cart", route: "/cart", position: { "x": 160, "y": 10120 } },
    scr_3f4wqu: { name: "Payment", route: "/payment", position: { "x": 1560, "y": 10120 } },
    scr_zoxnhv: { name: "Admin Dashboard", route: "/admin", position: { "x": 160, "y": 8140 } }
  },
  sections: {
    sec_fvhnqx: { name: "Main Navigation", x: 0, y: 0, width: 2920, height: 1180 },
    sec_t3bke1: { name: "Authentication Flow", x: 0, y: 1980, width: 1520, height: 1180 },
    sec_0119mg: { name: "User Account", x: 0, y: 3960, width: 2920, height: 1180 },
    sec_4tb1bt: { name: "Premium Upgrade", x: 0, y: 5940, width: 1520, height: 1180 },
    sec_ur8pu6: { name: "Admin Panel", x: 0, y: 7920, width: 1520, height: 1180 },
    sec_65b5w7: { name: "Checkout Flow", x: 0, y: 9900, width: 2920, height: 1180 }
  },
  layers: [
  { kind: "section", id: "sec_fvhnqx", children: [
    { kind: "screen", id: "scr_4wkpcm" },
    { kind: "screen", id: "scr_72j7hm" }]
  },
  { kind: "section", id: "sec_t3bke1", children: [
    { kind: "screen", id: "scr_amtlc3" }]
  },
  { kind: "section", id: "sec_0119mg", children: [
    { kind: "screen", id: "scr_sccmxl" },
    { kind: "screen", id: "scr_t92jnt" }]
  },
  { kind: "section", id: "sec_4tb1bt", children: [
    { kind: "screen", id: "scr_g86f5k" }]
  },
  { kind: "section", id: "sec_ur8pu6", children: [
    { kind: "screen", id: "scr_zoxnhv" }]
  },
  { kind: "section", id: "sec_65b5w7", children: [
    { kind: "screen", id: "scr_crl1xr" },
    { kind: "screen", id: "scr_3f4wqu" }]
  }]

};