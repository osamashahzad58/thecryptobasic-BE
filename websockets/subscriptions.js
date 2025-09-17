let pageSubscriptions = [];
let coinIdSubscriptions = [];

// ---- PAGE SUBSCRIPTIONS ----
function addPageSubscription(sub) {
  pageSubscriptions = pageSubscriptions.filter((s) => s.room !== sub.room);
  pageSubscriptions.push(sub);
}

function removePageSubscription(room) {
  pageSubscriptions = pageSubscriptions.filter((s) => s.room !== room);
}

function getPageSubscriptions() {
  return pageSubscriptions;
}

// ---- COINID SUBSCRIPTIONS ----
function addCoinIdSubscription(sub) {
  coinIdSubscriptions = coinIdSubscriptions.filter((s) => s.room !== sub.room);
  coinIdSubscriptions.push(sub);
}

function removeCoinIdSubscription(room) {
  coinIdSubscriptions = coinIdSubscriptions.filter((s) => s.room !== room);
}

function getCoinIdSubscriptions() {
  return coinIdSubscriptions;
}

module.exports = {
  addPageSubscription,
  removePageSubscription,
  getPageSubscriptions,
  addCoinIdSubscription,
  removeCoinIdSubscription,
  getCoinIdSubscriptions,
};
