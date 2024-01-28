const jwtt = require("jsonwebtoken");

const sign = "testtest";

module.exports = {
  generete(data) {
    return jwtt.sign(data, sign, { expressIn: "30d" });
  },
  verify(token) {
    return jwtt.verify(token, sign);
  },
};
