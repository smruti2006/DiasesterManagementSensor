const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const twilio = require('twilio');
const dotenv = require("dotenv");

const app = express();
app.use(express.json());
app.use(cors());
dotenv.config();

const MONGO_URI = process.env.MONGO_URI;
const PORT = process.env.PORT || 3000;

// MongoDB Connection
mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('✅ MongoDB Connected'))
.catch(err => console.log('❌ MongoDB Error:', err));

// Schema
const schoolSchema = new mongoose.Schema({
  name: String,
  headmasterNumber: String,
  username: String,
  password: String
});
const School = mongoose.model('School', schoolSchema);

// Twilio Setup
const accountSid = process.env.SID;
const authToken = process.env.AUTHTOKEN;
const client = twilio(accountSid, authToken);

// Fire Alert API
app.post("/fire-alert", async (req, res) => {
  const { school, intensity } = req.body;

  try {
    if (intensity === "low") {
      await client.messages.create({
        from: "whatsapp:+14155238886",
        to: "whatsapp:+918270010891",
        body: `🔥 Fire Alert at ${school}! Intensity: LOW. Please take action.`
      });
      return res.send("✅ WhatsApp sent to Headmaster");
    }

    if (intensity === "high") {
      const call = await client.calls.create({
        url: "https://diasestermanagementsensor.onrender.com/voice",
        to: "+918270010891", 
        from: "+15342024238"
      });

      await client.messages.create({
        from: "whatsapp:+14155238886",
        to: "whatsapp:+918270010891",
        body: `🔥 Fire Alert at ${school}! Intensity: HIGH. Please take action immediately!`
      });

      return res.send(`📞 Call initiated. SID: ${call.sid}, message also sent to HM`);
    }

    res.send("Unknown intensity level");
  } catch (err) {
    console.error(err);
    res.status(500).send("Error");
  }
});

// Twilio Voice Endpoint
app.post("/voice", (req, res) => {
  res.type("text/xml");
  res.send(`
    <Response>
      <Say voice="alice" language="hi-IN">
        ${req.body.school || 'aapke school'} me aag lag gayi hai. Kripya turant pratikriya dein.
      </Say>
    </Response>
  `);
});

// Start server
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
