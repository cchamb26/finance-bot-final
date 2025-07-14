$(function() {
    // Initialize the interface
    initializeChatbot();
    
    // Mood assessment submission page
    $('#start-chat').on('click', function() {
        startChat();
    });
    
    // Handle chat form submission
    $('#chat-form').on('submit', function(e) {
        e.preventDefault();
        sendMessage();
    });
    
    $('#clear-chat').on('click', function() {
        clearChat();
    });
    
    $('#export-chat').on('click', function() {
        exportChat();
    });
    
    // Exit confirm, save session, clear session
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
    
    // Enter key to submit
    $('#user-input').on('keydown', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            $('#chat-form').submit();
        }
    });

    function initializeChatbot() {
        // Show mood assessment, hide chat until submitted
        $('#mood-assessment').show();
        $('#chat-window').hide();
        $('#chat-input-container').hide();
        // Restore session if exists (after chat starts)
    }

    function startChat() {
        // Hide mood assessment, show chat
        $('#mood-assessment').fadeOut(300, function() {
            $('#chat-window').fadeIn(300);
            $('#chat-input-container').fadeIn(300);
            // Bot intro message
            setTimeout(function() {
                appendMessage('bot', "Hi! I'm your personal trading assistant. How can I help you today?");
            }, 300);
        });
        // Restore session if exists
        const savedSession = localStorage.getItem('volatility_vault_chat_session');
        if (savedSession) {
            const messages = JSON.parse(savedSession);
            messages.forEach(msg => {
                appendMessage(msg.type, msg.content);
            });
        }
    }
    
    function sendMessage() {
        const userInput = $('#user-input').val().trim();
        if (!userInput) return;
        
        appendMessage('user', userInput);
        
        // Clear input
        $('#user-input').val('').css('height', 'auto');
        
        // Disable input while bot is typing
        $('#user-input').prop('disabled', true);
        $('#send-btn').prop('disabled', true);
        
        const moodData = {
            calm: $('#slider-calm').val(),
            confidence: $('#slider-confidence').val(),
            impulsive: $('#slider-impulsive').val()
        };
        
        // Show typing indicator
        showTypingIndicator();
        
        // Send to backend
        $.ajax({
            url: 'http://localhost:3001/api/chat', // Update this to your deployed backend URL
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
            // Format dash-separated points as separate lines
            let formatted = content
              .split(/\s*-\s+/)
              .filter(Boolean)
              .map(line => `<div class="bot-bullet">- ${line.trim()}</div>`)
              .join('');
            messageDiv.html('<span class="bot-name">Volatility Vault AI</span>' + formatted);
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

// Custom reload/close confirmation modal
let reloadConfirmed = false;
window.addEventListener('beforeunload', function(e) {
    if (!reloadConfirmed) {
        e.preventDefault();
        showReloadConfirmModal();
        // Chrome requires returnValue to be set
        e.returnValue = '';
    }
});

function showReloadConfirmModal() {
    if ($('#reload-confirm-modal').length) return;
    const modal = $(`
        <div id="reload-confirm-modal" style="position:fixed;top:0;left:0;width:100vw;height:100vh;z-index:2000;display:flex;align-items:center;justify-content:center;background:rgba(11,12,27,0.95);">
          <div style="background:#181A2A;padding:40px 32px;border-radius:20px;max-width:400px;width:90%;box-shadow:0 8px 32px rgba(30,144,255,0.10);text-align:center;">
            <h3 style="color:#fff;font-size:26px;font-weight:700;margin-bottom:24px;">Leave this page?</h3>
            <p style="color:#CCCCCC;font-size:18px;margin-bottom:32px;">Are you sure you want to reload or close? Unsaved chat will be lost.</p>
            <button id="reload-yes" class="primary-btn" style="margin-right:16px;">Yes, leave</button>
            <button id="reload-cancel" class="primary-btn" style="background:linear-gradient(to right,#23243A,#23243A);color:#fff;">Cancel</button>
          </div>
        </div>
    `);
    $('body').append(modal);
    $('#reload-yes').on('click', function() {
        reloadConfirmed = true;
        $('#reload-confirm-modal').remove();
        window.location.reload();
    });
    $('#reload-cancel').on('click', function() {
        reloadConfirmed = false;
        $('#reload-confirm-modal').remove();
    });
} 