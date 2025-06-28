const express = require("express");
const crypto = require("crypto");
const axios = require("axios");

const app = express();
const port = process.env.PORT || 3000;
const attendeeUrl = process.env.ATTENDEE_URL || "http://localhost:3000";
const webhookSecret = process.env.CAL_WEBHOOK_SECRET || "";

app.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    try {
      const signature = req.get("Cal-Signature");
      if (!verifySignature(webhookSecret, signature, req.body)) {
        return res.status(400).send("Invalid signature");
      }

      const payload = JSON.parse(req.body.toString());
      const meetingUrl = payload.meetingUrl;
      if (!meetingUrl) {
        return res.status(400).send("missing meetingUrl");
      }

      const botRes = await axios.post(`${attendeeUrl}/bots`, { meetingUrl });
      const botId = botRes.data.id;

      await pollTranscript(botId);

      res.sendStatus(200);
    } catch (err) {
      console.error(err);
      res.status(500).send("Server error");
    }
  },
);

function verifySignature(secret, header, body) {
  if (!secret || !header) return false;
  const parts = header.split(",");
  const timestampPart = parts.find((p) => p.startsWith("t="));
  const signaturePart = parts.find((p) => p.startsWith("v1="));
  if (!timestampPart || !signaturePart) return false;
  const timestamp = timestampPart.replace("t=", "");
  const signature = signaturePart.replace("v1=", "");
  const hmac = crypto
    .createHmac("sha256", secret)
    .update(`${timestamp}.${body}`)
    .digest("hex");
  return crypto.timingSafeEqual(Buffer.from(hmac), Buffer.from(signature));
}

async function pollTranscript(id) {
  const url = `${attendeeUrl}/bots/${id}/transcript`;
  for (let i = 0; i < 60; i++) {
    const res = await axios.get(url);
    if (res.data.transcription_state === "complete") {
      return res.data;
    }
    await new Promise((r) => setTimeout(r, 5000));
  }
  throw new Error("transcript polling timed out");
}

app.listen(port, () => {
  console.log(`glue-service listening on port ${port}`);
});
