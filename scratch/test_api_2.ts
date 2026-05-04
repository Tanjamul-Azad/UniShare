import http from "http";

const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjA1OTEwNzFjLTFjMTYtNDM2OC05MjFlLWM3NjcwNjNiM2FhOSIsIm5hbWUiOiJBZG1pbiIsImVtYWlsIjoiaS5tLnRhbmphbXVsQGdtYWlsLmNvbSIsInJvbGUiOiJhZG1pbiIsInZlcmlmaWNhdGlvblN0YXR1cyI6InZlcmlmaWVkIiwiaWF0IjoxNzc3ODgyOTU2LCJleHAiOjE3ODA0NzQ5NTZ9.XiHKp9H27STJ_9vupWP3glTapNwqK4QvGokwRJTP-UM";

// Create a ~2MB base64 string
const largeBase64 = "data:image/png;base64," + "A".repeat(2 * 1024 * 1024);

const payload = JSON.stringify({
  title: "Pen",
  category: "Stationary",
  listingType: "sell",
  condition: "Like New",
  description: "The pen was imported and It writes really well",
  price: 40,
  imageUrl: largeBase64
});

const options = {
  hostname: "localhost",
  port: 3000,
  path: "/api/marketplace/",
  method: "POST",
  headers: {
    "Authorization": `Bearer ${token}`,
    "Content-Type": "application/json",
    "Content-Length": Buffer.byteLength(payload)
  }
};

const req = http.request(options, (res) => {
  let data = "";
  res.on("data", (chunk) => {
    data += chunk;
  });
  res.on("end", () => {
    console.log("Status Code:", res.statusCode);
    console.log("Response:", data);
  });
});

req.on("error", (error) => {
  console.error("Error:", error.message);
});

req.write(payload);
req.end();
