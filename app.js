document.addEventListener('DOMContentLoaded', () => {

    const startCallBtn = document.getElementById('startCallBtn');
    const endCallBtn = document.getElementById('endCallBtn');
    const waveform = document.querySelector('.waveform');
    const transcriptBox = document.getElementById('transcriptBox');
    const saveConfigBtn = document.getElementById('saveConfigBtn');

    let callSimulationInterval;
    const mockDialogFlow = [
        { role: 'agent', text: "Welcome to AwaazCart! I'm your virtual assistant. How can I help you regarding your orders or store policies today?" },
        { role: 'user', text: "Hi, I want to know the status of my order." },
        { role: 'agent', text: "Sure thing! Could you please provide your 6-digit AwaazCart order number?" },
        { role: 'user', text: "It's 894512." },
        { role: 'agent', text: "Thank you. Let me check... Your order #894512 is currently 'Out for Delivery' and should reach you by 4 PM today! Do you have any other questions?" },
        { role: 'user', text: "No, that's all. Thank you." },
        { role: 'agent', text: "You're very welcome! Have a great day ahead!" }
    ];

    let flowIndex = 0;

    startCallBtn.addEventListener('click', () => {
        // Toggle UI
        startCallBtn.classList.add('hidden');
        endCallBtn.classList.remove('hidden');
        waveform.classList.add('active');

        // Clear transcript
        transcriptBox.innerHTML = '';
        flowIndex = 0;

        // Start mock conversation
        simulateConversation();
    });

    endCallBtn.addEventListener('click', () => {
        endCall();
    });

    saveConfigBtn.addEventListener('click', () => {
        const originalText = saveConfigBtn.innerText;
        saveConfigBtn.innerText = 'Saved!';
        saveConfigBtn.style.background = 'rgba(0, 230, 118, 0.2)';
        saveConfigBtn.style.color = 'var(--success)';
        saveConfigBtn.style.borderColor = 'rgba(0, 230, 118, 0.4)';
        
        setTimeout(() => {
            saveConfigBtn.innerText = originalText;
            saveConfigBtn.style.background = '';
            saveConfigBtn.style.color = '';
            saveConfigBtn.style.borderColor = '';
        }, 2000);
    });

    function simulateConversation() {
        if (flowIndex >= mockDialogFlow.length) {
            setTimeout(endCall, 2000);
            return;
        }

        const currentMsg = mockDialogFlow[flowIndex];
        
        // Calculate delay based on text length to make it slightly realistic
        const delay = flowIndex === 0 ? 800 : (mockDialogFlow[flowIndex-1].text.length * 40) + 500;

        callSimulationInterval = setTimeout(() => {
            addMessage(currentMsg.role, currentMsg.text);
            flowIndex++;
            simulateConversation();
        }, delay);
    }

    function addMessage(role, text) {
        const msgDiv = document.createElement('div');
        msgDiv.className = `msg ${role}`;
        msgDiv.innerHTML = text;
        transcriptBox.appendChild(msgDiv);
        transcriptBox.scrollTop = transcriptBox.scrollHeight;
    }

    function endCall() {
        clearTimeout(callSimulationInterval);
        startCallBtn.classList.remove('hidden');
        endCallBtn.classList.add('hidden');
        waveform.classList.remove('active');
        
        const sysMsg = document.createElement('p');
        sysMsg.className = 'sys-msg';
        sysMsg.innerText = 'Call Ended. Total Duration: 0m ' + (flowIndex * 5) + 's';
        transcriptBox.appendChild(sysMsg);
        transcriptBox.scrollTop = transcriptBox.scrollHeight;
    }
});
