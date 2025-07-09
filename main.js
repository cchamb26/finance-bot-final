$(function() {
    // Initial state: only demo content and chat-fab visible
    $('#chat-container').hide();
    $('#chat-fab').show();

    // On chat open, show only the mood sliders first
    $('#chat-fab').on('click', function() {
        $('#chat-container').fadeIn(200);
        $('#chat-fab').hide();
        $('#chat-dialogue-options').show();
        $('#chat-window').hide();
        $('#chat-form').hide();
        showMaximizeIfMobile();
    });
    // When mood is submitted, show chat window and form
    $('#submit-dialogue-options').on('click', function() {
        $('#chat-dialogue-options').fadeOut(200, function() {
            $('#chat-window').fadeIn(200);
            $('#chat-form').fadeIn(200);
        });
    });

    // Hide dialogue options on submit
    $('#submit-dialogue-options').on('click', function() {
        $('#chat-dialogue-options').fadeOut(200);
    });

    // Hide chat container when close button is pressed, with in-chat modal
    $('#close-chat').on('click', function() {
        $('#exit-confirm-modal').fadeIn(150);
    });
    $('#exit-confirm-yes').on('click', function() {
        $('#exit-confirm-modal').hide();
        $('#save-session-modal').fadeIn(150);
    });
    $('#exit-confirm-cancel').on('click', function() {
        $('#exit-confirm-modal').fadeOut(150);
    });

    // Save session modal logic
    $('#save-session-yes').on('click', function() {
        // Save chat messages and slider values to localStorage
        var messages = [];
        document.querySelectorAll('.user-msg, .financebot-msg').forEach(function(msg) {
            messages.push({
                class: msg.className,
                html: msg.innerHTML
            });
        });
        var dialogueValues = {
            calm: $('#slider-calm').val(),
            confidence: $('#slider-confidence').val(),
            impulsive: $('#slider-impulsive').val()
        };
        localStorage.setItem('financebot_chat_session', JSON.stringify(messages));
        localStorage.setItem('financebot_dialogue_options', JSON.stringify(dialogueValues));
        $('#save-session-modal').hide();
        $('#chat-container').fadeOut(200, function() {
            $('#chat-fab').show();
            location.reload();
        });
    });
    $('#save-session-no').on('click', function() {
        // Clear session data and reset sliders
        localStorage.removeItem('financebot_chat_session');
        localStorage.removeItem('financebot_dialogue_options');
        $('#save-session-modal').hide();
        $('#chat-container').fadeOut(200, function() {
            $('#chat-fab').show();
            location.reload();
        });
    });

    // (Optional) On page load, restore session if exists
    var saved = localStorage.getItem('financebot_chat_session');
    var dialogueSaved = localStorage.getItem('financebot_dialogue_options');
    if (saved) {
        var messages = JSON.parse(saved);
        var chatWindow = document.getElementById('chat-window');
        messages.forEach(function(msg) {
            var div = document.createElement('div');
            div.className = msg.class;
            div.innerHTML = msg.html;
            chatWindow.appendChild(div);
        });
        chatWindow.scrollTop = chatWindow.scrollHeight;
        // Restore dialogue slider values
        if (dialogueSaved) {
            var dialogueValues = JSON.parse(dialogueSaved);
            $('#slider-calm').val(dialogueValues.calm || 3);
            $('#slider-confidence').val(dialogueValues.confidence || 3);
            $('#slider-impulsive').val(dialogueValues.impulsive || 3);
        }
    } else {
        // Reset sliders to default
        $('#slider-calm').val(3);
        $('#slider-confidence').val(3);
        $('#slider-impulsive').val(3);
    }

    // Show/hide maximize button on resize
    $(window).on('resize', showMaximizeIfMobile);
    function showMaximizeIfMobile() {
        if (window.innerWidth <= 600) {
            $('#maximize-chat').show();
        } else {
            $('#maximize-chat').hide();
            $('#chat-container').removeClass('maximized-mobile');
            $('#maximize-chat').text('⬆️');
        }
    }

    // Maximize/restore logic
    $('#maximize-chat').on('click', function() {
        var $chat = $('#chat-container');
        if ($chat.hasClass('maximized-mobile')) {
            $chat.removeClass('maximized-mobile');
            $('#maximize-chat').text('⬆️');
        } else {
            $chat.addClass('maximized-mobile');
            $('#maximize-chat').text('⬇️');
        }
    });

    // Snap sliders to nearest tick only on mouseup/touchend (not on every change)
    $('.dialogue-slider').off('change mouseup touchend');
    $('.dialogue-slider').on('mouseup touchend', function() {
        var val = Math.round($(this).val());
        $(this).val(val);
    });

    // Chat form logic (existing)
    $('#chat-form').on('submit', function(e) {
        e.preventDefault();
        var userInput = $('#user-input').val();
        if (!userInput.trim()) return;
        $('#chat-window').append('<div class="user-msg">' + $('<div>').text(userInput).html() + '</div>');
        $('#user-input').val('');
        $('#chat-window').scrollTop($('#chat-window')[0].scrollHeight);
        // Send to backend
        $.ajax({
            url: 'https://YOUR-BACKEND-URL/api/chat', // Update this to your deployed backend URL
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ 
                message: userInput, 
                personality: {
                    calm: $('#slider-calm').val(),
                    confidence: $('#slider-confidence').val(),
                    impulsive: $('#slider-impulsive').val()
                }
            }),
            success: function(res) {
                $('#chat-window').append('<div class="financebot-msg">FinanceBot: ' + $('<div>').text(res.reply).html() + '</div>');
                $('#chat-window').scrollTop($('#chat-window')[0].scrollHeight);
            },
            error: function() {
                $('#chat-window').append('<div class="financebot-msg error">FinanceBot: Sorry, there was an error.</div>');
                $('#chat-window').scrollTop($('#chat-window')[0].scrollHeight);
            }
        });
    });

    // Make chat textarea grow vertically as user types
    $('#user-input').on('input', function() {
        this.style.height = 'auto';
        this.style.height = (this.scrollHeight) + 'px';
    });
    // Reset textarea height after sending a message
    $('#chat-form').on('submit', function() {
        $('#user-input').css('height', 'auto');
    });

    // Allow Enter to send, Shift+Enter for newline
    $('#user-input').on('keydown', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            $('#chat-form').submit();
        }
    });

    //Resize chat window from top left, anchor point on bottom right
    let isResizing = false;
    let startX, startY, startWidth, startHeight;
    const $chat = $('#chat-container');
    const minWidth = 260, minHeight = 320;

    $('#resize-handle').on('mousedown', function(e) {
        if (window.innerWidth <= 600) return; // Disable on mobile
        e.preventDefault();
        isResizing = true;
        startX = e.clientX;
        startY = e.clientY;
        startWidth = $chat.width();
        startHeight = $chat.height();
        $chat.css('transition', 'none');
        $(document).on('mousemove.resizeChat', resizeChat);
        $(document).on('mouseup.resizeChat', stopResizeChat);
    });

    function resizeChat(e) {
        if (!isResizing) return;
        const winW = $(window).width();
        const winH = $(window).height();
        let dx = e.clientX - startX;
        let dy = e.clientY - startY;
        // Only adjust width/height, keep bottom right fixed
        let newWidth = Math.max(minWidth, Math.min(winW - 40, startWidth - dx)); // 40px right margin
        let newHeight = Math.max(minHeight, Math.min(winH - 100, startHeight - dy)); // 100px bottom margin
        $chat.css({
            width: newWidth + 'px',
            height: newHeight + 'px'
            // right and bottom remain fixed
        });
    }

    function stopResizeChat() {
        isResizing = false;
        $chat.css('transition', 'box-shadow 0.3s, transform 0.3s');
        $(document).off('.resizeChat');
    }

    // Initial maximize button state
    showMaximizeIfMobile();
}); 