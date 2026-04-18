import express from 'express';
import { WebSocketServer } from 'ws';
import http from 'http';
import dotenv from 'dotenv';
import { getAwaazCartPrompt } from './services/agentPrompt.js';
import { createCalendarAppointment } from './services/calendar.js';

dotenv.config();

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const server = http.createServer(app);
const wss = new WebSocketServer({ server });

// Simulated Telephony Webhook (for Exotel/Twilio)
app.post('/api/incoming-call', (req, res) => {
    console.log('[Webhook] Incoming call detected.');
    
    // In a real provider, we'd return a TwiML or Exotel webhook response
    // pointing to our wss:// stream URL to open the bidirectional audio connection.
    const streamUrl = process.env.STREAM_URL || `wss://${req.headers.host}/stream`;
    
    res.status(200).json({
        action: "connect",
        stream_url: streamUrl,
        message: "Routing caller to AwaazCart Voice Agent..."
    });
});

// WebSocket for Bidirectional Audio
wss.on('connection', (ws) => {
    console.log('[WebSocket] Caller stream connected.');

    // Normally this connects to OpenAI Realtime API via WebRTC/WebSocket
    // and streams audio chunks back and forth.
    const agentPrompt = getAwaazCartPrompt();

    ws.on('message', async (message) => {
        try {
            const data = JSON.parse(message);

            // Mock check: Did the AI detect a booking intent with slots?
            if (data.event === 'tool_call' && data.function === 'book_appointment') {
                console.log(`[Agent] Attempting to book appointment for: ${data.args.customerName}`);
                
                const result = await createCalendarAppointment(
                    data.args.customerName, 
                    data.args.userPhone, 
                    data.args.timeSlot
                );

                ws.send(JSON.stringify({
                    event: 'tool_result',
                    status: result.success ? 'success' : 'failed',
                    meetingLink: result.meetingLink,
                    message: "Booking confirmed."
                }));
            }
        } catch (error) {
            console.error('Error handling WS message', error);
        }
    });

    ws.on('close', () => {
        console.log('[WebSocket] Caller stream disconnected.');
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`🚀 AwaazCart MVP Engine running on port ${PORT}`);
    console.log(`📡 Ready to receive Webhooks and WebSocket streams`);
});
