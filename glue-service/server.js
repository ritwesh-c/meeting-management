import express from "express";
import crypto from "crypto";
import axios from "axios";
import getRawBody from "raw-body";
import dotenv from "dotenv";

dotenv.config();

const app = express();

async function parseJson(req, res, next) {
  if (req.headers["content-type"] !== "application/json") {
    return res.status(415).send("Unsupported Media Type");
  }
  try {
    req.rawBody = await getRawBody(req);
    req.body = JSON.parse(req.rawBody.toString());
    next();
  } catch (err) {
    next(err);
  }
}
const { PORT = 4000, CAL_WEBHOOK_SECRET, ATTENDEE_URL } = process.env;

function verifySignature(req, res, next) {
  const signature = req.headers["cal-signature"];
  if (!signature) return res.status(401).send("Missing signature");

  const hmac = crypto.createHmac("sha256", CAL_WEBHOOK_SECRET);
  hmac.update(req.rawBody);
  const digest = hmac.digest("hex");

  if (!crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(signature))) {
    return res.status(401).send("Invalid signature");
  }
  next();
}

async function pollTranscript(botId) {
  const base = `${ATTENDEE_URL}/bots/${botId}`;
  let delay = 5000;
  for (let i = 0; i < 12; i++) {
    await new Promise((r) => setTimeout(r, delay));
    const resp = await axios.get(base);
    if (resp.data.transcription_state === "complete") {
      return axios.get(`${base}/transcript`);
    }
    delay = Math.min(60000, delay * 2);
  }
  throw new Error("Polling timed out");
}

app.post("/webhook", parseJson, verifySignature, async (req, res) => {
  try {
    const meetingUrl = req.body.payload.conferencing.join_url;
    const createResp = await axios.post(`${ATTENDEE_URL}/bots`, { meetingUrl });
    const { id: botId } = createResp.data;
    const transcriptResp = await pollTranscript(botId);
    // TODO: save transcriptResp.data into your DB
    console.log("Transcript:", transcriptResp.data);
    res.status(200).send("Processed");
  } catch (err) {
    console.error(err);
    res.status(500).send("Error processing webhook");
  }
});

app.listen(PORT, () => console.log(`Listening on ${PORT}`));
