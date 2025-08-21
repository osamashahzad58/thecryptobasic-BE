const speakeasy = require("speakeasy");


exports.verify2FAToken = (tempSecret, token, result = {}) => {
    try {
      result = speakeasy.totp.verify({
        secret: tempSecret, //secret of the logged in user
        encoding: "base32",
        token: token,
      });
    } catch (ex) {
      result = false;
    } finally {
      return result;
    }
  };
  