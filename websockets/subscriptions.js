// Simple in-memory subscription store
let subscriptions = [];

/**
 * Add or replace subscription for a room
 */
function addSubscription(sub) {
  // remove any previous subscription for same room
  subscriptions = subscriptions.filter((s) => s.room !== sub.room);
  subscriptions.push(sub);
}

/**
 * Return current subscriptions
 */
function getSubscriptions() {
  return subscriptions;
}

module.exports = { addSubscription, getSubscriptions };
