const fs = require("fs");

class ClaimManager {
  async submitClaim(requestBody) {
    // eslint-disable-next-line no-useless-catch
    try {
      console.log("submit claim service: " + JSON.stringify(requestBody));
      // json data
      let jsonData = {
        username: requestBody.username,
        walletAddress: requestBody.walletAddress,
        claimType: requestBody.claimType,
      };

      // stringify JSON Object
      let jsonContent = JSON.stringify(jsonData);
      console.log(jsonContent);

      let parsedExistingData = [];
      if (fs.existsSync("./data/claim-signing-request.json")) {
        // Calling the readFileSync() method
        // to read 'input.txt' file
        const data = fs.readFileSync("./data/claim-signing-request.json", {
          encoding: "utf8",
          flag: "r",
        });
        parsedExistingData = JSON.parse(data);
      }
      parsedExistingData.push(jsonContent);

      fs.writeFileSync(
        "./data/claim-signing-request.json",
        JSON.stringify(parsedExistingData, null, 2),
        { encoding: "utf8" },
        function (err) {
          if (err) {
            console.log("An error occured while writing JSON Object to File.");
            return console.log(err);
          }
          console.log("JSON file has been saved.");
          return jsonContent;
        }
      );
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  async getClaims() {
    // eslint-disable-next-line no-useless-catch
    try {
      //logic here
      console.log("get-claims service");
      if (fs.existsSync("./data/claim-signing-request.json")) {
        const data = fs.readFileSync("./data/claim-signing-request.json", {
          encoding: "utf8",
          flag: "r",
        });
        return JSON.parse(data);
      } else {
        return [];
      }
      // eslint-disable-next-line no-unreachable
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  async getClaimsForIdentity() {
    // eslint-disable-next-line no-useless-catch
    try {
      //logic here
      console.log("getClaimsForIdentity service");
      if (fs.existsSync("./data/claim-signing-request.json")) {
        const data = fs.readFileSync("./data/claim-signing-request.json", {
          encoding: "utf8",
          flag: "r",
        });
        const identityClaims = JSON.parse(data).filter(
          (c) => c.walletAddress == walletAddress
        );
        return JSON.parse(identityClaims);
      } else {
        return [];
      }
      // eslint-disable-next-line no-unreachable
    } catch (error) {
      console.error(error);
      throw error;
    }
  }
}

module.exports = new ClaimManager();
