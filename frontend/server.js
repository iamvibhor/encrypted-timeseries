const axios = require("axios");

const API_URL = process.env.API_URL || "http://localhost:3000/records";

async function fetchData() {
  try {
    const response = await axios.get(API_URL);
    const records = response.data;

    console.clear();
    console.log("Latest Records (Auto Refresh: 5s)");
    console.log("Last updated:", new Date().toLocaleTimeString());
    console.log("--------------------------------------------------");

    if (!records || !records.length) {
      console.log("No records found.");
      return;
    }

    console.table(
      records.map(r => ({
        Name: r.name || "",
        Origin: r.origin || "",
        Destination: r.destination || "",
        Secret: r.secret || "",
        ReceivedAt: r.receivedAt
          ? new Date(r.receivedAt).toLocaleString()
          : ""
      }))
    );

  } catch (err) {
    console.error("Error fetching data:", err.message);
  }
}

setInterval(fetchData, 5000);
fetchData();