import Vapi from "https://esm.sh/@vapi-ai/web";

document.addEventListener('DOMContentLoaded', () => {

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const synth = window.speechSynthesis;

    window.activeUtterances = [];

    // Initialize Vapi SDK with your Public Key
    // Importing Vapi as an ES Module guarantees it loads correctly.
    const vapi = new Vapi("35745b45-6767-4564-8b8e-20f139f500dc");

    // Function to attach Vapi to AwaazCart UI components
    const integrateVapiAgent = (elementPrefix, assistantId) => {
        const btnCall = document.getElementById(`btnCall${elementPrefix}`);
        const btnEnd = document.getElementById(`btnEnd${elementPrefix}`);
        const status = document.getElementById(`${elementPrefix.toLowerCase()}Status`);
        const transcriptArea = document.getElementById(`${elementPrefix.toLowerCase()}Transcript`);
        const visualizer = document.getElementById(`${elementPrefix.toLowerCase()}Visualizer`);
        const waveform = visualizer.querySelector('.waveform');

        let isCallActive = false;

        function appendMessage(role, text) {
            const msg = document.createElement('div');
            msg.className = `msg ${role}`;
            msg.innerText = text;
            transcriptArea.appendChild(msg);
            transcriptArea.scrollTop = transcriptArea.scrollHeight;
        }

        btnCall.addEventListener('click', () => {
            status.innerText = "Connecting to AwaazCart AI...";
            status.style.color = "var(--text-muted)";
            transcriptArea.innerHTML = '';
            
            // Start the Vapi call
            vapi.start(assistantId);
        });

        btnEnd.addEventListener('click', () => {
            vapi.stop();
        });

        vapi.on('call-start', () => {
            isCallActive = true;
            btnCall.classList.add('hidden');
            btnEnd.classList.remove('hidden');
            visualizer.classList.remove('hidden');
            status.innerText = "Call Connected - Speak now!";
            status.style.color = "var(--success)";
        });

        vapi.on('call-end', () => {
            isCallActive = false;
            btnEnd.classList.add('hidden');
            btnCall.classList.remove('hidden');
            visualizer.classList.add('hidden');
            waveform.classList.remove('active');
            status.style.color = "var(--danger)";
            status.innerText = "Call Ended";
        });

        vapi.on('message', (message) => {
            if (message.type === 'transcript' && message.transcriptType === 'final') {
                if (message.role === 'user') {
                    appendMessage('user', message.transcript);
                } else if (message.role === 'assistant') {
                    appendMessage('agent', message.transcript);
                    waveform.classList.add('active');
                    setTimeout(() => { waveform.classList.remove('active'); }, 1500);
                }
            }
            if (message.type === 'function-call' && message.functionCall.name === 'book_appointment') {
                 status.innerText = "Booking securely in background...";
                 status.style.color = "var(--accent)";
            }
        });

        vapi.on('error', (e) => {
            console.error("Vapi Error:", e);
            status.innerText = "Connection Failed!";
            status.style.color = "var(--danger)";
        });
    };

    // Check for API support
    if (!SpeechRecognition) {
        console.warn("Speech API not supported in this browser. Please use Chrome/Edge.");
    }

    const createSimulation = (elementPrefix, conversationFlow) => {
        const btnCall = document.getElementById(`btnCall${elementPrefix}`);
        const btnEnd = document.getElementById(`btnEnd${elementPrefix}`);
        const status = document.getElementById(`${elementPrefix.toLowerCase()}Status`);
        const transcriptArea = document.getElementById(`${elementPrefix.toLowerCase()}Transcript`);
        const visualizer = document.getElementById(`${elementPrefix.toLowerCase()}Visualizer`);
        const waveform = visualizer.querySelector('.waveform');

        let flowIndex = 0;
        let isCallActive = false;
        let recognition = null;

        if (SpeechRecognition) {
            recognition = new SpeechRecognition();
            recognition.continuous = false;
            recognition.interimResults = false;
            recognition.lang = 'en-IN';

            recognition.onstart = () => {
                if (!isCallActive) return;
                status.innerText = "🟢 Listening... Please speak now!";
                status.style.color = "var(--success)";
                waveform.classList.add('active');
            };

            recognition.onresult = (event) => {
                if (!isCallActive) return;
                const transcript = event.results[0][0].transcript;
                appendMessage('user', transcript);
                
                // Jump to agent's next line automatically
                flowIndex += 2; 
                setTimeout(runConversation, 500);
            };

            recognition.onerror = (event) => {
                if (!isCallActive) return;
                console.error('Speech recognition error:', event.error);
                
                if (event.error === 'not-allowed') {
                    status.innerText = "⚠️ Microphone Blocked!";
                    status.style.color = "var(--danger)";
                    appendMessage('system', "YOUR MICROPHONE IS BLOCKED! You cannot use the microphone if you double-click the file to open it. Look at the chat instructions for how to use 'Live Server' to fix this.");
                    waveform.classList.remove('active');
                } else if (event.error === 'no-speech') {
                    // Try listening again if user was just quiet
                    try { recognition.start(); } catch(e){}
                }
            };
            
            recognition.onend = () => {
                if(!synth.speaking && isCallActive && status.innerText.includes("Listening")) {
                    waveform.classList.remove('active');
                }
            };
        }

        btnCall.addEventListener('click', () => {
            if (!SpeechRecognition) {
                alert("Your browser does not support Live Voice. Use Google Chrome Desktop.");
                return;
            }
            
            isCallActive = true;
            btnCall.classList.add('hidden');
            btnEnd.classList.remove('hidden');
            visualizer.classList.remove('hidden');
            
            transcriptArea.innerHTML = '';
            flowIndex = 0;

            status.style.color = "var(--text-muted)";
            status.innerText = "Call Connected - Agent incoming...";

            if (synth.paused) synth.resume();
            synth.cancel();

            runConversation();
        });

        btnEnd.addEventListener('click', () => endCall());

        function appendMessage(role, text) {
            const msg = document.createElement('div');
            msg.className = `msg ${role}`;
            if (role === 'system') {
                msg.style.background = 'rgba(255,0,0,0.2)';
                msg.style.color = 'white';
                msg.style.boxShadow = 'inset 2px 0 0 red';
            }
            msg.innerText = text;
            transcriptArea.appendChild(msg);
            transcriptArea.scrollTop = transcriptArea.scrollHeight;
        }

        function runConversation() {
            if (!isCallActive) return;
            if (flowIndex >= conversationFlow.length) {
                setTimeout(endCall, 3000);
                return;
            }

            const agentStep = conversationFlow[flowIndex];
            
            appendMessage('agent', agentStep.text);
            status.innerText = "🎙️ Agent is speaking...";
            status.style.color = "var(--text-muted)";
            waveform.classList.add('active');
            
            const utterThis = new SpeechSynthesisUtterance(agentStep.text);
            utterThis.lang = 'en-IN';
            window.activeUtterances.push(utterThis); 

            utterThis.onend = () => {
                if (!isCallActive) return;
                waveform.classList.remove('active');

                if (flowIndex + 1 < conversationFlow.length) {
                    try {
                        recognition.start();
                    } catch(e) {
                         console.error("Mic already capturing.", e);
                    }
                } else {
                    setTimeout(endCall, 2000);
                }
            };
            
            let ttsTriggered = false;
            utterThis.onstart = () => { ttsTriggered = true; };
            setTimeout(() => {
                if (!ttsTriggered && isCallActive && flowIndex < conversationFlow.length) {
                    utterThis.onend(); 
                }
            }, 1000);
            
            synth.speak(utterThis);
        }

        function endCall() {
            isCallActive = false;
            synth.cancel(); 
            try { if(recognition) recognition.stop(); } catch(e){}
            
            btnEnd.classList.add('hidden');
            btnCall.classList.remove('hidden');
            visualizer.classList.add('hidden');
            waveform.classList.remove('active');
            
            status.style.color = "var(--danger)";
            status.innerText = "Call Ended";
            setTimeout(() => {
                if(!isCallActive) {
                    status.style.color = "var(--text-muted)";
                    status.innerText = "Ready to Call";
                }
            }, 3000);
        }
    };

    // Replace the mock simulation with the actual Vapi implementation
    // IMPORTANT: Swap "REPLACE_WITH_YOUR_ASSISTANT_ID" with your real Assistant ID from the Vapi Dashboard
    integrateVapiAgent('Salon', "25b1b8b2-6af7-4d03-8901-9d28024a4a20");

    createSimulation('Clinic', [
        { role: 'agent', text: "Namaste, AwaazCart Clinic. Are you an existing patient or is this your first visit?" },
        { role: 'user', text: "" },
        { role: 'agent', text: "We can help with that. Doctor Sharma is available on Friday morning. Does 10:30 AM suit you?" },
        { role: 'user', text: "" },
        { role: 'agent', text: "To confirm, could I please have your full name?" },
        { role: 'user', text: "" },
        { role: 'agent', text: "Thank you. Your appointment with Doctor Sharma is confirmed. Have a great day!" }
    ]);

    createSimulation('Steel', [
        { role: 'agent', text: "Welcome to AwaazCart Steel Traders. Are you calling to place a bulk order?" },
        { role: 'user', text: "" },
        { role: 'agent', text: "Let me check our inventory. Yes, we currently have stock. Would you like to place an order now?" },
        { role: 'user', text: "" },
        { role: 'agent', text: "Order confirmed. Generating your invoice now. It will be sent to your registered WhatsApp so you can process the payment." },
        { role: 'user', text: "" }
    ]);

    createSimulation('Mystery', [
        { role: 'agent', text: "Hello! You have reached shadows. Are you brave enough to book a session?" },
        { role: 'user', text: "" },
        { role: 'agent', text: "Excellent. We have the Haunted Asylum and the Murder Mystery available tonight. Which will be your fate?" },
        { role: 'user', text: "" },
        { role: 'agent', text: "A thrilling choice. Your doom is sealed. I mean, your booking is confirmed! See you at midnight." },
        { role: 'user', text: "" }
    ]);

    // Dropdown selection logic
    const agentSelect = document.getElementById('agentSelect');
    const mockups = {
        'salon': document.getElementById('mockup-salon'),
        'clinic': document.getElementById('mockup-clinic'),
        'steel': document.getElementById('mockup-steel'),
        'mystery': document.getElementById('mockup-mystery')
    };

    agentSelect.addEventListener('change', (e) => {
        const selected = e.target.value;
        
        // Hide all mockups
        Object.values(mockups).forEach(mockup => {
            if (mockup) mockup.classList.add('hidden-mockup');
        });
        
        // Show the selected mockup
        if (mockups[selected]) {
            mockups[selected].classList.remove('hidden-mockup');
        }
    });

});
