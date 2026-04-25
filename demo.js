import Vapi from "https://esm.sh/@vapi-ai/web";

document.addEventListener('DOMContentLoaded', () => {

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const synth = window.speechSynthesis;

    window.activeUtterances = [];

    const vapi = new Vapi("35745b45-6767-4564-8b8e-20f139f500dc");

    const agentsConfig = {
        salon: {
            theme: 'salon-theme',
            icon: 'scissors',
            title: 'AwaazCart Salon',
            subtitle: 'AI Receptionist',
            type: 'vapi',
            vapiId: '25b1b8b2-6af7-4d03-8901-9d28024a4a20'
        },
        clinic: {
            theme: 'clinic-theme',
            icon: 'stethoscope',
            title: 'AwaazCart Clinic',
            subtitle: 'Medical AI Assistant',
            type: 'vapi',
            vapiId: '054e74b6-e4eb-462d-bc77-c4928b073606'
        },
        steel: {
            theme: 'steel-theme',
            icon: 'factory',
            title: 'AwaazCart Steel',
            subtitle: 'B2B Order Agent',
            type: 'vapi',
            vapiId: '963505b1-a8d8-4496-8dbf-e019425981ad'
        },
        mystery: {
            theme: 'mystery-theme',
            icon: 'ghost',
            title: 'AwaazCart Mystery',
            subtitle: 'Escape Room Booking Agent',
            type: 'simulation',
            flow: [
                { role: 'agent', text: "Hello! You have reached shadows. Are you brave enough to book a session?" },
                { role: 'user', text: "" },
                { role: 'agent', text: "Excellent. We have the Haunted Asylum and the Murder Mystery available tonight. Which will be your fate?" },
                { role: 'user', text: "" },
                { role: 'agent', text: "A thrilling choice. Your doom is sealed. I mean, your booking is confirmed! See you at midnight." },
                { role: 'user', text: "" }
            ]
        }
    };

    let currentAgentId = 'salon';
    let isCallActive = false;
    
    // UI Elements
    const dynamicPhone = document.getElementById('dynamicPhone');
    const agentAvatar = document.getElementById('agentAvatar');
    const agentTitle = document.getElementById('agentTitle');
    const agentSubtitle = document.getElementById('agentSubtitle');
    const status = document.getElementById('agentStatus');
    const transcriptArea = document.getElementById('agentTranscript');
    const visualizer = document.getElementById('agentVisualizer');
    const waveform = visualizer.querySelector('.waveform');
    const btnCall = document.getElementById('btnCallAgent');
    const btnEnd = document.getElementById('btnEndAgent');
    const agentSelect = document.getElementById('agentSelect');

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

    function switchAgent(agentId) {
        if (isCallActive) {
            endCurrentCall();
        }
        
        currentAgentId = agentId;
        const config = agentsConfig[agentId];
        
        // Update UI
        dynamicPhone.className = `phone-mockup ${config.theme}`;
        agentAvatar.innerHTML = `<i data-lucide="${config.icon}"></i>`;
        agentTitle.innerText = config.title;
        agentSubtitle.innerText = config.subtitle;
        transcriptArea.innerHTML = '';
        status.innerText = "Ready to Call";
        status.style.color = "var(--text-muted)";
        
        // Re-initialize lucide icons for the new avatar
        if (window.lucide) {
            window.lucide.createIcons();
        }
    }

    agentSelect.addEventListener('change', (e) => {
        switchAgent(e.target.value);
    });

    // Vapi Event Listeners
    vapi.on('call-start', () => {
        if (agentsConfig[currentAgentId].type !== 'vapi') return;
        isCallActive = true;
        btnCall.classList.add('hidden');
        btnEnd.classList.remove('hidden');
        visualizer.classList.remove('hidden');
        status.innerText = "Call Connected - Speak now!";
        status.style.color = "var(--success)";
    });

    vapi.on('call-end', () => {
        if (agentsConfig[currentAgentId].type !== 'vapi') return;
        handleCallEnded();
    });

    vapi.on('message', (message) => {
        if (agentsConfig[currentAgentId].type !== 'vapi') return;
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
        if (agentsConfig[currentAgentId].type !== 'vapi') return;
        console.error("Vapi Error:", e);
        status.innerText = "Connection Failed!";
        status.style.color = "var(--danger)";
    });

    // Simulation State
    let flowIndex = 0;
    let recognition = null;
    let simulationTimeout = null;

    if (SpeechRecognition) {
        recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-IN';

        recognition.onstart = () => {
            if (!isCallActive || agentsConfig[currentAgentId].type !== 'simulation') return;
            status.innerText = "🟢 Listening... Please speak now!";
            status.style.color = "var(--success)";
            waveform.classList.add('active');
        };

        recognition.onresult = (event) => {
            if (!isCallActive || agentsConfig[currentAgentId].type !== 'simulation') return;
            const transcript = event.results[0][0].transcript;
            appendMessage('user', transcript);
            
            flowIndex += 2; 
            simulationTimeout = setTimeout(runConversation, 500);
        };

        recognition.onerror = (event) => {
            if (!isCallActive || agentsConfig[currentAgentId].type !== 'simulation') return;
            console.error('Speech recognition error:', event.error);
            
            if (event.error === 'not-allowed') {
                status.innerText = "⚠️ Microphone Blocked!";
                status.style.color = "var(--danger)";
                appendMessage('system', "YOUR MICROPHONE IS BLOCKED! You cannot use the microphone if you double-click the file to open it. Look at the chat instructions for how to use 'Live Server' to fix this.");
                waveform.classList.remove('active');
            } else if (event.error === 'no-speech') {
                try { recognition.start(); } catch(e){}
            }
        };
        
        recognition.onend = () => {
            if(!synth.speaking && isCallActive && status.innerText.includes("Listening")) {
                waveform.classList.remove('active');
            }
        };
    } else {
        console.warn("Speech API not supported in this browser. Please use Chrome/Edge.");
    }

    function runConversation() {
        if (!isCallActive || agentsConfig[currentAgentId].type !== 'simulation') return;
        const config = agentsConfig[currentAgentId];
        if (flowIndex >= config.flow.length) {
            simulationTimeout = setTimeout(endCurrentCall, 3000);
            return;
        }

        const agentStep = config.flow[flowIndex];
        
        appendMessage('agent', agentStep.text);
        status.innerText = "🎙️ Agent is speaking...";
        status.style.color = "var(--text-muted)";
        waveform.classList.add('active');
        
        const utterThis = new SpeechSynthesisUtterance(agentStep.text);
        utterThis.lang = 'en-IN';
        window.activeUtterances.push(utterThis); 

        utterThis.onend = () => {
            if (!isCallActive || agentsConfig[currentAgentId].type !== 'simulation') return;
            waveform.classList.remove('active');

            if (flowIndex + 1 < config.flow.length) {
                try {
                    recognition.start();
                } catch(e) {
                     console.error("Mic already capturing.", e);
                }
            } else {
                simulationTimeout = setTimeout(endCurrentCall, 2000);
            }
        };
        
        let ttsTriggered = false;
        utterThis.onstart = () => { ttsTriggered = true; };
        simulationTimeout = setTimeout(() => {
            if (!ttsTriggered && isCallActive && flowIndex < config.flow.length) {
                utterThis.onend(); 
            }
        }, 1000);
        
        synth.speak(utterThis);
    }

    btnCall.addEventListener('click', () => {
        const config = agentsConfig[currentAgentId];
        
        if (config.type === 'vapi') {
            status.innerText = "Connecting to AwaazCart AI...";
            status.style.color = "var(--text-muted)";
            transcriptArea.innerHTML = '';
            vapi.start(config.vapiId);
        } else {
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
        }
    });

    btnEnd.addEventListener('click', () => {
        endCurrentCall();
    });

    function endCurrentCall() {
        const config = agentsConfig[currentAgentId];
        if (config.type === 'vapi') {
            vapi.stop();
        } else {
            isCallActive = false;
            synth.cancel(); 
            clearTimeout(simulationTimeout);
            try { if(recognition) recognition.stop(); } catch(e){}
            handleCallEnded();
        }
    }

    function handleCallEnded() {
        isCallActive = false;
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
});
