$(function() {
    // Initialize the interface
    initializeChatbot();
    
    // Handle mood assessment submission
    $('#start-chat').on('click', function() {
        startChat();
    });
    
    // Handle chat form submission
    $('#chat-form').on('submit', function(e) {
        e.preventDefault();
        sendMessage();
    });
    
    // Handle clear chat
    $('#clear-chat').on('click', function() {
        clearChat();
    });
    
    // Handle export chat
    $('#export-chat').on('click', function() {
        exportChat();
    });
    
    // Handle modals
    $('#exit-confirm-yes').on('click', function() {
        $('#exit-confirm-modal').hide();
        $('#save-session-modal').fadeIn(150);
    });
    
    $('#exit-confirm-cancel').on('click', function() {
        $('#exit-confirm-modal').fadeOut(150);
    });
    
    $('#save-session-yes').on('click', function() {
        saveSession();
    });
    
    $('#save-session-no').on('click', function() {
        clearSession();
    });
    
    // Make textarea auto-resize up to 120px as user types
    $('#user-input').on('input', function() {
        this.style.height = '40px'; // reset to base height
        this.style.height = Math.min(this.scrollHeight, 120) + 'px';
    });
    
    // Handle Enter key
    $('#user-input').on('keydown', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            $('#chat-form').submit();
        }
    });
    
    
    function initializeChatbot() {
        // Check for saved session
        const savedSession = localStorage.getItem('volatility_vault_chat_session');
        const savedMood = localStorage.getItem('volatility_vault_mood_assessment');
        
        if (savedSession && savedMood) {
            // Restore saved session
            const messages = JSON.parse(savedSession);
            const moodData = JSON.parse(savedMood);
            
            // Restore mood sliders
            $('#slider-calm').val(moodData.calm || 3);
            $('#slider-confidence').val(moodData.confidence || 3);
            $('#slider-impulsive').val(moodData.impulsive || 3);
            
            // Start chat directly
            startChat();
            
            // Restore messages
            messages.forEach(msg => {
                appendMessage(msg.type, msg.content);
            });
        } else {
            // Reset sliders to default
            $('#slider-calm').val(3);
            $('#slider-confidence').val(3);
            $('#slider-impulsive').val(3);
        }
    }
    
    function startChat() {
        // Hide mood assessment
        $('#mood-assessment').fadeOut(300, function() {
            // Show chat interface
            $('#chat-window').fadeIn(300);
            $('#chat-input-container').fadeIn(300);
            // Bot intro message
            setTimeout(function() {
                appendMessage('bot', "Hi! I'm your personal trading assistant. How can I help you today?");
            }, 300);
        });
    }
    
    function sendMessage() {
        const userInput = $('#user-input').val().trim();
        if (!userInput) return;
        
        // Add user message
        appendMessage('user', userInput);
        
        // Clear input
        $('#user-input').val('').css('height', 'auto');
        
        // Disable input while bot is typing
        $('#user-input').prop('disabled', true);
        $('#send-btn').prop('disabled', true);
        
        // Get mood data
        const moodData = {
            calm: $('#slider-calm').val(),
            confidence: $('#slider-confidence').val(),
            impulsive: $('#slider-impulsive').val()
        };
        
        // Show typing indicator
        showTypingIndicator();
        
        // Send to backend
        $.ajax({
            url: 'https://YOUR-BACKEND-URL/api/chat', // Update this to your deployed backend URL
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ 
                message: userInput, 
                personality: moodData
            }),
            success: function(response) {
                hideTypingIndicator();
                appendMessage('bot', response.reply || 'I understand your question. Let me help you with that.');
                // Re-enable input
                $('#user-input').prop('disabled', false);
                $('#send-btn').prop('disabled', false);
                $('#user-input').focus();
            },
            error: function() {
                hideTypingIndicator();
                appendMessage('bot', 'I apologize, but I\'m experiencing some technical difficulties. Please try again in a moment.');
                // Re-enable input
                $('#user-input').prop('disabled', false);
                $('#send-btn').prop('disabled', false);
                $('#user-input').focus();
            }
        });
    }
    
    function appendMessage(type, content) {
        let messageDiv;
        if (type === 'user') {
            messageDiv = $('<div>').addClass('user-msg');
            messageDiv.html($('<div>').text(content).html());
        } else {
            messageDiv = $('<div>').addClass('bot-msg');
            messageDiv.html('<span class="bot-name">Volatility Vault AI</span>' + $('<div>').text(content).html());
        }

        $('#chat-messages').append(messageDiv);
        scrollToBottom();

        // Save to session
        saveMessageToSession(type, content);
    }
    
    function showTypingIndicator() {
        const typingDiv = $('<div>').addClass('bot-msg typing-indicator');
        typingDiv.html('<div>Volatility Vault AI is typing...</div>');
        $('#chat-messages').append(typingDiv);
        scrollToBottom();
    }
    
    function hideTypingIndicator() {
        $('.typing-indicator').remove();
    }
    
    function scrollToBottom() {
        const chatMessages = $('#chat-messages')[0];
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
    
    function clearChat() {
        if (confirm('Are you sure you want to clear the chat history?')) {
            $('#chat-messages').empty();
            localStorage.removeItem('volatility_vault_chat_session');
        }
    }
    
    function exportChat() {
        const messages = [];
        $('#chat-messages .user-msg, #chat-messages .bot-msg').each(function() {
            const isUser = $(this).hasClass('user-msg');
            const content = $(this).text();
            messages.push({
                type: isUser ? 'User' : 'Volatility Vault AI',
                content: content,
                timestamp: new Date().toISOString()
            });
        });
        
        const chatData = {
            title: 'Volatility Vault AI Chat Export',
            date: new Date().toISOString(),
            messages: messages
        };
        
        const dataStr = JSON.stringify(chatData, null, 2);
        const dataBlob = new Blob([dataStr], {type: 'application/json'});
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `volatility-vault-chat-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
    }
    
    function saveMessageToSession(type, content) {
        const savedSession = localStorage.getItem('volatility_vault_chat_session');
        const messages = savedSession ? JSON.parse(savedSession) : [];
        
        messages.push({
            type: type,
            content: content,
            timestamp: new Date().toISOString()
        });
        
        localStorage.setItem('volatility_vault_chat_session', JSON.stringify(messages));
    }
    
    function saveSession() {
        const moodData = {
            calm: $('#slider-calm').val(),
            confidence: $('#slider-confidence').val(),
            impulsive: $('#slider-impulsive').val()
        };
        
        localStorage.setItem('volatility_vault_mood_assessment', JSON.stringify(moodData));
        $('#save-session-modal').hide();
        
        // Show confirmation
        appendMessage('bot', 'Your session has been saved. You can continue where you left off next time.');
    }
    
    function clearSession() {
        localStorage.removeItem('volatility_vault_chat_session');
        localStorage.removeItem('volatility_vault_mood_assessment');
        $('#save-session-modal').hide();
        
        // Show confirmation
        appendMessage('bot', 'Session cleared. Starting fresh next time.');
    }
    
    // Add some CSS for typing indicator
    $('<style>')
        .prop('type', 'text/css')
        .html(`
            .typing-indicator {
                opacity: 0.7;
                font-style: italic;
            }
            .typing-indicator::before {
                content: "Volatility Vault AI";
                position: absolute;
                top: -24px;
                left: 0;
                color: #1E90FF;
                font-size: 14px;
                font-weight: 600;
            }
        `)
        .appendTo('head');
}); 