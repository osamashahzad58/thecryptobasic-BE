module.exports = {
  DATABASE_ERROR_CODES: {
    UNIQUE_VIOLATION: 11000,
  },
  DATABASE_ERROR_NAMES: {
    MONGO_SERVER_ERROR: "MongoServerError",
  },
  ROLES: {
    USER: "user",
    ADMIN: "admin",
    CREATOR: "creator",
  },
  LAUNCHPAD_STATUS: {
    DRAFT: "draft",
    SUBMITTED: "submitted",
    APPROVED: "approved",
    REJECTED: "rejected",
    LISTED: "listed",
    COMPLETED: "completed",
    FAILED: "failed",
  },
  DURATION_CONSTANT: {
    PAST: "past",
    LIVE: "live",
    UPCOMING: "upcoming",
  },
  NFT_STATUS: {
    OWNED: "owned",
    ONSALE: "onSale",
    ONAUCTION: "onAuction",
  },
  ACTIVITY_STATUS: {
    SELL: "sell",
    BID: "bid",
    TRANSFER: "transfer",
    OFFER: "offer",
    LIST: "list",
    MINTED: "minted",
  },
};
