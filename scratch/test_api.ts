
import http from "http";

const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjA1OTEwNzFjLTFjMTYtNDM2OC05MjFlLWM3NjcwNjNiM2FhOSIsIm5hbWUiOiJBZG1pbiIsImVtYWlsIjoiaS5tLnRhbmphbXVsQGdtYWlsLmNvbSIsInJvbGUiOiJhZG1pbiIsInZlcmlmaWNhdGlvblN0YXR1cyI6InZlcmlmaWVkIiwiaWF0IjoxNzc3ODgyOTU2LCJleHAiOjE3ODA0NzQ5NTZ9.XiHKp9H27STJ_9vupWP3glTapNwqK4QvGokwRJTP-UM";

const options = {
  hostname: "localhost",
  port: 3001,
  path: "/api/admin/stats",
  method: "GET",
  headers: {
    "Authorization": `Bearer ${token}`
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

req.end();
