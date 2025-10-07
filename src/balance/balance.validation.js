const Joi = require("joi");

// Regex patterns
const evmAddressRegex = /^0x[a-fA-F0-9]{40}$/;
const solanaAddressRegex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

const EVM_CHAINS = ["eth", "bsc", "polygon", "avalanche", "fantom"];
const SOLANA_CHAIN = "sol";

module.exports = {
  create: {
    body: Joi.object({
      name: Joi.string().required(),
      isMe: Joi.boolean().required(),
      walletAddress: Joi.string()
        .required()
        .custom((value, helpers) => {
          // EVM address → lowercase
          if (evmAddressRegex.test(value)) {
            return value.toLowerCase();
          }

          // Solana address → return as-is (case sensitive)
          if (solanaAddressRegex.test(value)) {
            return value;
          }

          return helpers.error("any.invalid");
        })
        .messages({
          "any.required": "walletAddress is required",
          "any.invalid": "Invalid walletAddress format (must be EVM or Solana)",
        }),

      chain: Joi.string()
        .valid(...EVM_CHAINS, SOLANA_CHAIN)
        .required()
        .messages({
          "any.only": `chain must be one of [${[
            ...EVM_CHAINS,
            SOLANA_CHAIN,
          ].join(", ")}]`,
          "any.required": "chain is required",
        }),
    }),
  },
  allAsset: {
    query: Joi.object({
      offset: Joi.number().integer().required(),
      limit: Joi.number().integer().required(),
    }),
  },
};
