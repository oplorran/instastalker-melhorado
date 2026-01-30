// ============================================
// SCRIPT.JS - Chat functionalities
// NOTE: This file depends on api.js for location functions
// ============================================

// ===== DISABLE TEXT SELECTION AND COPY (iOS + Android) =====

// Block selection start
document.addEventListener('selectstart', function(e) {
    if (e.target.id !== 'messageInput' && e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
        e.preventDefault();
        return false;
    }
}, { passive: false });

// Block copy
document.addEventListener('copy', function(e) {
    if (e.target.id !== 'messageInput' && e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
        e.preventDefault();
        return false;
    }
}, { passive: false });

// Prevent native context menu
document.addEventListener('contextmenu', function(e) {
    if (e.target.id !== 'messageInput' && e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
        e.preventDefault();
        return false;
    }
}, { passive: false });

// iOS SOLUTION: Clear selection automatically when detected
document.addEventListener('selectionchange', function() {
    const selection = window.getSelection();
    const activeElement = document.activeElement;
    
    // If not in an input, clear selection
    if (activeElement && activeElement.id !== 'messageInput' && 
        activeElement.tagName !== 'INPUT' && activeElement.tagName !== 'TEXTAREA') {
        if (selection && selection.toString().length > 0) {
            selection.removeAllRanges();
        }
    }
});

// AGGRESSIVE iOS SOLUTION: Block text selection in messages
(function() {
    // Function to clear selection
    function clearSelection() {
        if (window.getSelection) {
            const selection = window.getSelection();
            if (selection.rangeCount > 0) {
                selection.removeAllRanges();
            }
        }
        if (document.selection) {
            document.selection.empty();
        }
    }
    
    // Intercept ALL touches on messages
    document.addEventListener('touchstart', function(e) {
        const target = e.target;
        const isInput = target.id === 'messageInput' || 
                        target.tagName === 'INPUT' || 
                        target.tagName === 'TEXTAREA';
        
        if (!isInput) {
            // Clear any existing selection
            clearSelection();
        }
    }, { passive: true });
    
    document.addEventListener('touchend', function(e) {
        const target = e.target;
        const isInput = target.id === 'messageInput' || 
                        target.tagName === 'INPUT' || 
                        target.tagName === 'TEXTAREA';
        
        if (!isInput) {
            // Clear selection after release
            setTimeout(clearSelection, 0);
            setTimeout(clearSelection, 50);
            setTimeout(clearSelection, 100);
        }
    }, { passive: true });
    
    // Constantly clear selection
    setInterval(function() {
        const activeElement = document.activeElement;
        const isInput = activeElement && (
            activeElement.id === 'messageInput' || 
            activeElement.tagName === 'INPUT' || 
            activeElement.tagName === 'TEXTAREA'
        );
        
        if (!isInput) {
            clearSelection();
        }
    }, 50); // Every 50ms
    
    // Observe selection changes
    document.addEventListener('selectionchange', function() {
        const activeElement = document.activeElement;
        const isInput = activeElement && (
            activeElement.id === 'messageInput' || 
            activeElement.tagName === 'INPUT' || 
            activeElement.tagName === 'TEXTAREA'
        );
        
        if (!isInput) {
            clearSelection();
        }
    });
})();

// Elementos
const messageInput = document.getElementById('messageInput');
const chatMessages = document.getElementById('chatMessages');
const contextMenu = document.getElementById('contextMenu');
const quickReactions = document.getElementById('quickReactions');
const likeBtn = document.getElementById('likeBtn');
const callBtn = document.getElementById('callBtn');
const videoBtn = document.getElementById('videoBtn');
const voiceBtn = document.getElementById('voiceBtn');
const photoBtn = document.getElementById('photoBtn');
const menusOverlay = document.getElementById('menusOverlay');
const stickerBtn = document.getElementById('stickerBtn');

// ============================================================================
// DYNAMIC FUNNEL VARIABLES (WILL BE CAPTURED BEFORE)
// ============================================================================
// 
// 1. SPIED USER NAME:
//    - Variable: userSpiedName (ex: "André")
//    - Fallback: "" (empty - don't leave anything)
//    - Usage: Replace in messages like "Please {userSpiedName}" or "{userSpiedName}???"
//
// 2. USER IP CITY:
//    - Variable: userCity (ex: "Londrina")
//    - Fallback 1: Nearest nearby city (search via API)
//    - Fallback 2: "square"
//    - Usage: "Tell her yes in {userCity}"
//
// 3. TOURIST SPOT/NEARBY LOCATION:
//    - Variable: nearbyLocation (ex: "Cathedral Square")
//    - Fallback: "Fernanda's House"
//    - Usage: Received location message
//
// 4. PREVIOUS WEEKDAY:
//    - Variable: previousWeekday (ex: "WED" for Wednesday)
//    - Calculation: Day of week before current date
//    - Usage: "Ok, tomorrow or Thursday {previousWeekday}"
//
// 5. TIME FORMAT:
//    - Today (same day): "12:23"
//    - Yesterday: "YESTERDAY, 12:23"
//    - Week (day 18-14): "FRI, 12:23" (abbreviated weekday)
//    - Older (1 week+): "31 OCT., 13:23" (day number + abbreviated month)
//
// ============================================================================

// Global variables
let selectedMessage = null;
let isRecordingVoice = false;
let isLoadingMessages = false;
let oldestMessageTime = new Date();

// Function to get unique identifier of current chat
function getChatId() {
    // Use HTML filename as unique identifier (chat-1, chat-2, chat-3, etc)
    const pathname = window.location.pathname;
    const filename = pathname.split('/').pop() || pathname.split('\\').pop();
    
    if (filename.includes('chat-1.html')) {
        return 'chat_1';
    } else if (filename.includes('chat-2.html')) {
        return 'chat_2';
    } else if (filename.includes('chat-3.html')) {
        return 'chat_3';
    } else if (filename.includes('chat-4.html')) {
        return 'chat_4';
    } else if (filename.includes('chat-5.html')) {
        return 'chat_5';
    } else if (filename.includes('index.html')) {
        return 'chat_index';
    }
    
    // Fallback: use username if can't identify by URL
    const chatUserName = document.getElementById('chatUserName');
    if (chatUserName) {
        return `chat_${chatUserName.textContent.trim()}`;
    }
    return 'chat_default';
}

// Words to apply blur (sexual content)
const blurWords = [
    'sexo', 'nude', 'nudes', 'pelado', 'pelada', 'buceta', 'pau', 'pênis', 
    'vagina', 'tesão', 'gostosa', 'gostoso', 'safada', 'safado', 'putaria',
    'foder', 'transar', 'sexy', 'sensual', 'peitos', 'bunda', 'raba',
    'excitado', 'excitada', 'tesuda', 'tesudo', 'pornô', 'porno', 'xvideos',
    'pack', 'intimate photo', 'intimate video', 'naked video call'
];

// Function to format asterisks in groups of maximum 2
function formatAsterisks(count) {
    if (count <= 0) return '';
    if (count === 1) return '*';
    if (count === 2) return '**';
    
    // For 3 or more, group in pairs of 2 and remainder of 1
    const pairs = Math.floor(count / 2);
    const remainder = count % 2;
    const result = [];
    
    // Add pairs of **
    for (let i = 0; i < pairs; i++) {
        result.push('**');
    }
    
    // Add loose asterisk if there's remainder
    if (remainder === 1) {
        result.push('*');
    }
    
    return result.join(' ');
}

// Function to generate asterisks based on text length
function generateAsterisks(text) {
    // If text contains commas or spaces, vary asterisks per word
    if (text.includes(',') || text.split(' ').length > 1) {
        const words = text.split(/[,\s]+/).filter(w => w.length > 0);
        return words.map(word => {
            const count = word.length;
            // Vary between count-1 and count+2 for more variation
            const asteriskCount = Math.max(3, count + Math.floor(Math.random() * 3) - 1);
            return formatAsterisks(asteriskCount);
        }).join(' ');
    }
    // For single words, use asterisks based on length
    const count = text.length;
    return formatAsterisks(Math.max(3, count));
}

// Function to apply blur to words
function applyBlurToText(text) {
    let processedText = text;
    
    // First, process text between ** (double asterisks)
    processedText = processedText.replace(/\*\*(.+?)\*\*/g, (match, content) => {
        const asterisks = generateAsterisks(content);
        return `<span class="blur-word">${asterisks}</span>`;
    });
    
    // Then, process words from blur list
    blurWords.forEach(word => {
        const regex = new RegExp(`\\b${word}\\b`, 'gi');
        processedText = processedText.replace(regex, (match) => {
            // Don't apply blur if already inside a blur-word span
            if (processedText.includes(`<span class="blur-word">`)) {
                return match;
            }
            const asterisks = generateAsterisks(match);
            return `<span class="blur-word">${asterisks}</span>`;
        });
    });
    
    return processedText;
}

// Random messages for infinite scroll (varied texts - short and long)
const randomMessages = [
    // Short texts
    { type: 'text', content: 'Hi!', received: true },
    { type: 'text', content: 'Hi', received: false },
    { type: 'text', content: 'How are you?', received: true },
    { type: 'text', content: 'Yes', received: false },
    { type: 'text', content: 'And you?', received: true },
    { type: 'text', content: 'All good', received: false },
    { type: 'text', content: 'Great!', received: true },
    { type: 'text', content: '😊', received: false },
    { type: 'text', content: '❤️', received: true },
    { type: 'text', content: 'Thanks', received: false },
    { type: 'text', content: 'You\'re welcome', received: true },
    { type: 'text', content: 'Cool', received: false },
    { type: 'text', content: 'Ok', received: true },
    { type: 'text', content: 'Got it', received: false },
    { type: 'text', content: 'Nice', received: true },
    { type: 'text', content: 'Thanks', received: false },
    // Medium texts
    { type: 'text', content: 'Hi, how are you? How are you doing?', received: true },
    { type: 'text', content: 'All good, and you? How was your day?', received: false },
    { type: 'text', content: 'What a beautiful photo! You look so pretty 😍', received: true },
    { type: 'text', content: 'Thanks! You look handsome too ❤️', received: false },
    { type: 'text', content: 'Want to go out today? How about a movie?', received: true },
    { type: 'text', content: 'I\'d love to! What time do you want to go?', received: false },
    { type: 'text', content: 'I miss you', received: true },
    { type: 'text', content: 'I miss you too 💕', received: false },
    { type: 'text', content: 'You look beautiful today! What a nice outfit', received: true },
    { type: 'text', content: 'Aw, thanks! You\'re so kind 😊', received: false },
    { type: 'text', content: 'Send me a photo of you', received: true },
    { type: 'text', content: 'What kind of photo do you want? 👀', received: false },
    { type: 'text', content: 'You know... a more intimate photo', received: true },
    { type: 'text', content: 'Hmm maybe later 😏', received: false },
    { type: 'text', content: 'I\'m thinking about you now', received: true },
    { type: 'text', content: 'Great! I\'m thinking about you too', received: false },
    // Long texts
    { type: 'text', content: 'Hi! How are you? It\'s been a while since we talked, how are you? I hope everything is okay there!', received: true },
    { type: 'text', content: 'Hi! All good, thanks for asking! I\'m fine, working a lot but everything is calm. How are you?', received: false },
    { type: 'text', content: 'Great that you\'re doing well! I\'m also all good, just working a lot but can\'t complain. I was missing talking to you!', received: true },
    { type: 'text', content: 'I was missing you too! Let\'s plan to meet soon? It\'s been a while since we saw each other in person, it would be great!', received: false },
    { type: 'text', content: 'Sure! I\'d love to! How about this weekend? We can go somewhere nice, maybe a new restaurant that opened nearby?', received: true },
    { type: 'text', content: 'Perfect! I loved the idea! I\'ll check my schedule and let you know, but I think I can make it. I\'m already excited!', received: false },
    { type: 'text', content: 'Great! I\'ll be waiting then. Meanwhile, tell me what you\'ve been up to, what\'s been happening in your life?', received: true },
    { type: 'text', content: 'Wow, so much! I started a new course, I\'m learning interesting things. And you? What have you been doing differently?', received: false },
    { type: 'text', content: 'How cool! I\'m happy you\'re doing new things. I also started some interesting projects, it\'s been very productive!', received: true },
    { type: 'text', content: 'How amazing! I love when you get excited about new projects. You always have very creative ideas, I really admire that about you!', received: false }
];

// Detect scroll at top to load messages
chatMessages.addEventListener('scroll', function() {
    if (this.scrollTop === 0 && !isLoadingMessages) {
        loadOlderMessages();
    }
});

// Function to get random local image (without repeating)
function getRandomLocalImage(chatId) {
    const usedImagesKey = `${chatId}_usedStoryImages`;
    let usedImages = JSON.parse(localStorage.getItem(usedImagesKey) || '[]');
    
    // List of specific images to use
    const allImages = [
        'chat.5.8.png',
        'chat1.png',
        'chat2.nudes1.png',
        'chat2.png',
        'chat3-story2.png',
        'chat3-story1.png',
        'chat3-story3.png',
        'chat5.1.png',
        'chat3.png',
        'chat5.1a.png',
        'chat5.2.png',
        'chat5.2a.jpg',
        'chat5.3.png',
        'Chat5.4.png',
        'Chat5.5.png',
        'Chat5.5a.png',
        'chat5.6.png',
        'Chat5.6a.png',
        'Chat5.7.png',
        'chat5.7a.png',
        'chat5.8a.png',
        'Chat5.a.png'
    ];
    
    // Filter already used images
    const availableImages = allImages.filter(img => !usedImages.includes(img));
    
    // If all were used, reset and start over
    if (availableImages.length === 0) {
        usedImages = [];
        availableImages.push(...allImages);
    }
    
    // Choose random image from available ones
    const randomIndex = Math.floor(Math.random() * availableImages.length);
    const selectedImage = availableImages[randomIndex];
    
    // Add to used list
    usedImages.push(selectedImage);
    localStorage.setItem(usedImagesKey, JSON.stringify(usedImages));
    
    return `../../imagens/${selectedImage}`;
}

// Function to load older messages (FILLER CONTENT)
function loadOlderMessages() {
    if (isLoadingMessages) return;
    
    // Get chat-specific counter
    const chatId = getChatId();
    const loadCountKey = `${chatId}_messagesLoadCount`;
    let messagesLoadCount = parseInt(localStorage.getItem(loadCountKey) || '0');
    
    // Check if already 3 loads
    if (messagesLoadCount >= 3) {
        // Show blocked popup on 4th attempt
        showBlockedPopup("Become a VIP member of Stalkea.ai<br>to load more messages");
        return;
    }
    
    isLoadingMessages = true;
    
    // Add loading indicator (animation only, no text)
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'messages-loading';
    loadingDiv.innerHTML = `
        <div class="loading-spinner"></div>
    `;
    chatMessages.insertBefore(loadingDiv, chatMessages.firstChild);
    
    // Save current scroll position
    const oldScrollHeight = chatMessages.scrollHeight;
    
    // Simulate loading delay
    setTimeout(() => {
        // Generate between 3 and 8 random messages (FILLER CONTENT)
        const numMessages = Math.floor(Math.random() * 6) + 3;
        
        // Get current user avatar to use in received messages
        const chatUserAvatar = document.getElementById('chatUserAvatar');
        const avatarSrc = chatUserAvatar ? chatUserAvatar.src : 'https://i.pravatar.cc/150?img=1';
        
        // Message types for filler content
        // For chat-5 (memes chat), add more stories
        const isMemesChat = chatId === 'chat_5';
        
        const messageTypes = isMemesChat ? [
            'story', 'story', 'story', 'story', 'story', 'story', 'story', 'story', 'story', 'story',
            'story', 'story', 'story', 'story', 'story', 'story', 'story', 'story', 'story', 'story',
            'story', 'story', 'story', 'story', 'story', 'story', 'story', 'story', 'story', 'story',
            'story', 'story', 'story', 'story', 'story', 'story', 'story', 'story', 'story', 'story',
            'story', 'story', 'story', 'story', 'story', 'story', 'story', 'story', 'story', 'story',
            'story', 'story', 'story', 'story', 'story', 'story', 'story', 'story', 'story', 'story',
            'story', 'story', 'story', 'story', 'story', 'story', 'story', 'story', 'story', 'story',
            'story', 'story', 'story', 'story', 'story', 'story', 'story', 'story', 'story', 'story',
            'text', 'text', 'text', 'text', 'text', 'text', 'text', 'text', 'text',
            'audio'
        ] : [
            'text', 'text', 'text', 'text', 'text', 'text', 'text', 'text', 'text', 'text', 
            'text', 'text', 'text', 'text', 'text', 'text', 'text', 'text', 'text', 'text',
            'heart', 'heart', 'heart',
            'audio', 'audio',
            'call', 'call',
            'video',
            'photo'
        ];
        
        // Check if messages already saved for this load
        const savedMessagesKey = `${chatId}_savedEnchacaoMessages_${messagesLoadCount}`;
        let savedMessages = localStorage.getItem(savedMessagesKey);
        
        if (savedMessages) {
            // Restore saved messages (lighter, doesn't need to render)
            try {
                const messages = JSON.parse(savedMessages);
                messages.forEach(msgHTML => {
                    const tempDiv = document.createElement('div');
                    tempDiv.innerHTML = msgHTML;
                    const messageDiv = tempDiv.firstElementChild;
                    if (messageDiv) {
                        chatMessages.insertBefore(messageDiv, loadingDiv.nextSibling);
                    }
                });
                
                // Remove loading
                loadingDiv.remove();
                
                // Increment counter
                messagesLoadCount++;
                localStorage.setItem(loadCountKey, messagesLoadCount.toString());
                
                // Maintain scroll position
                chatMessages.scrollTop = chatMessages.scrollHeight - oldScrollHeight;
                isLoadingMessages = false;
                
                // Divide texts into divs by line
                setTimeout(() => {
                    wrapTextLinesInDivs();
                }, 100);
                
                return; // Exit function, don't need to generate new messages
            } catch (e) {
                console.warn('Error restoring saved messages:', e);
                // If error, continue and generate new ones
            }
        }
        
        // Array to save HTML of generated messages
        const messagesHTML = [];
        
        for (let i = 0; i < numMessages; i++) {
            // Decrease old message time
            oldestMessageTime = new Date(oldestMessageTime.getTime() - Math.random() * 3600000);
            const time = oldestMessageTime.getHours().toString().padStart(2, '0') + ':' + 
                        oldestMessageTime.getMinutes().toString().padStart(2, '0');
            
            const messageDiv = document.createElement('div');
            const isReceived = Math.random() > 0.4; // 60% received, 40% sent
            const messageType = messageTypes[Math.floor(Math.random() * messageTypes.length)];
            
            // FILLER CONTENT: add strong blur class
            messageDiv.className = `message ${isReceived ? 'received' : 'sent'} enchacao-de-linguica`;
            
            let messageHTML = '';
            
            if (messageType === 'photo') {
                // Received photo or sent Nudes - use Unsplash images with valid IDs
                const photoIds = [
                    '1506905925346-21bda4d32df4',
                    '1469474968028-56623f02e42e',
                    '1511367461989-f85a21fda167',
                    '1682687220742-aba13b6e50ba',
                    '1498050108023-c5249f4df085',
                    '1506905925346-21bda4d32df4',
                    '1511367461989-f85a21fda167'
                ];
                const randomPhotoId = photoIds[Math.floor(Math.random() * photoIds.length)];
                
                if (isReceived) {
                    // Received photo - with video-sensitive-icon
                    messageHTML = `
                        <img src="${avatarSrc}" alt="User" class="message-avatar">
                        <div class="message-bubble">
                            <div class="message-video">
                                <img src="../../imagens/fotoblur1.jpg" alt="Video" class="video-blurred">
                                <div class="video-sensitive-overlay">
                                    <div class="video-sensitive-content">
                                        <div class="video-sensitive-icon">
                                            <i class="fas fa-eye-slash"></i>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    `;
                } else {
                    // Sent Nudes - with video-sensitive-icon
                    messageHTML = `
                        <div class="message-bubble">
                            <div class="message-photo">
                                <img src="https://images.unsplash.com/photo-${randomPhotoId}?w=400" alt="Nudes">
                                <div class="video-sensitive-overlay">
                                    <div class="video-sensitive-content">
                                        <div class="video-sensitive-icon">
                                            <i class="fas fa-eye-slash"></i>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    `;
                }
            } else if (messageType === 'audio') {
                // Audio (only received)
                if (isReceived) {
                    const duration = Math.floor(Math.random() * 30) + 5; // 5-35 seconds
                    // Generate bars with smooth heights (avoiding very large contrasts)
                    // For dynamic audios, use duration + counter for stable key
                    const chatId = getChatId();
                    const audioCounterKey = `${chatId}_audio_counter`;
                    let audioCounter = parseInt(localStorage.getItem(audioCounterKey) || '0');
                    audioCounter++;
                    localStorage.setItem(audioCounterKey, audioCounter.toString());
                    
                    const audioKey = `${chatId}_audio_dynamic_${duration}_${audioCounter}`;
                    let savedHeights = localStorage.getItem(audioKey);
                    
                    let heights = [];
                    if (savedHeights) {
                        heights = JSON.parse(savedHeights);
                    } else {
                        // Generate fixed heights (random but always the same for this audio)
                        let currentHeight = Math.floor(Math.random() * 21) + 15; // 15-36px
                        
                        for (let i = 0; i < 30; i++) {
                            const rand = Math.random();
                            const variation = rand < 0.5 
                                ? Math.floor(Math.random() * 17) - 8   // 50%: -8 a +8
                                : rand < 0.8 
                                    ? Math.floor(Math.random() * 31) - 15  // 30%: -15 a +15
                                    : Math.floor(Math.random() * 41) - 20; // 20%: -20 a +20
                            
                            currentHeight = Math.max(12, Math.min(40, currentHeight + variation));
                            heights.push(currentHeight);
                        }
                        localStorage.setItem(audioKey, JSON.stringify(heights));
                    }
                    
                    let waveformBars = '';
                    heights.forEach(height => {
                        waveformBars += `<div class="audio-recebido-waveform-bar" style="height: ${height}px;"></div>`;
                    });
                    messageHTML = `
                        <img src="${avatarSrc}" alt="User" class="message-avatar">
                        <div class="message-bubble">
                            <div class="audio-recebido">
                                <button class="audio-recebido-play-btn">
                                    <i class="fas fa-play"></i>
                                </button>
                                <div class="audio-recebido-waveform">
                                    ${waveformBars}
                                </div>
                                <span class="audio-recebido-duration">0:${duration.toString().padStart(2, '0')}</span>
                            </div>
                        </div>
                    `;
                } else {
                    // If sent, becomes text
                    const randomMsg = randomMessages[Math.floor(Math.random() * randomMessages.length)];
            const processedContent = applyBlurToText(randomMsg.content);
                    messageHTML = `
                        <div class="message-bubble">
                            <div class="message-content">${processedContent}</div>
                        </div>
                    `;
                }
            } else if (messageType === 'video') {
                // Video with blur (only received)
                if (isReceived) {
                    messageHTML = `
                        <img src="${avatarSrc}" alt="User" class="message-avatar">
                        <div class="message-bubble">
                            <div class="message-video">
                                <img src="../../imagens/fotoblur1.jpg" alt="Video" class="video-blurred">
                                <div class="video-sensitive-overlay">
                                    <div class="video-sensitive-content">
                                        <div class="video-sensitive-icon">
                                            <i class="fas fa-eye-slash"></i>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    `;
                } else {
                    // If sent, becomes text
                    const randomMsg = randomMessages[Math.floor(Math.random() * randomMessages.length)];
                    const processedContent = applyBlurToText(randomMsg.content);
                    messageHTML = `
                        <div class="message-bubble">
                            <div class="message-content">${processedContent}</div>
                        </div>
                    `;
                }
            } else if (messageType === 'heart') {
                // Heart message (only sent)
                if (!isReceived) {
                    messageHTML = `
                        <div class="message-bubble">
                            <div class="message-content-heart">❤️</div>
                        </div>
                    `;
                } else {
                    // If received, becomes text
                    const randomMsg = randomMessages[Math.floor(Math.random() * randomMessages.length)];
                    const processedContent = applyBlurToText(randomMsg.content);
                    messageHTML = `
                        <img src="${avatarSrc}" alt="User" class="message-avatar">
                        <div class="message-bubble">
                            <div class="message-content">${processedContent}</div>
                        </div>
                    `;
                }
            } else if (messageType === 'call') {
                // Video call (system)
                const callTypes = ['lost', 'ended', 'normal'];
                const callType = callTypes[Math.floor(Math.random() * callTypes.length)];
                const callTime = time;
                
                if (callType === 'lost') {
                    messageHTML = `
                        <div class="message-system">
                            <div class="message-system-content">
                                <i class="fas fa-video"></i>
                                <span>Missed video call</span>
                            </div>
                            <button class="message-system-btn">Call back</button>
                        </div>
                    `;
                } else if (callType === 'ended') {
                    messageHTML = `
                        <div class="message-system ended">
                            <div class="message-system-content">
                                <i class="fas fa-video"></i>
                                <div class="message-system-text-wrapper">
                                    <span>Video call ended</span>
                                    <span class="message-system-time">${callTime}</span>
                                </div>
                            </div>
                        </div>
                    `;
                } else {
                    messageHTML = `
                        <div class="message-system normal">
                            <div class="message-system-content">
                                <i class="fas fa-video"></i>
                                <div class="message-system-text-wrapper">
                                    <span>Video call</span>
                                    <span class="message-system-time">${callTime}</span>
                                </div>
                            </div>
                        </div>
                    `;
                }
            } else if (messageType === 'story') {
                // Story/Reel (for memes chat)
                const storyIndex = Math.floor(Math.random() * 1000) + 1;
                const maskId = isReceived ? `play-mask-received-${storyIndex}` : `play-mask-sent-${storyIndex}`;
                const userName = isReceived ? (chatUserAvatar ? chatUserAvatar.getAttribute('alt') || 'carla_memes' : 'carla_memes') : 'you';
                const userAvatar = isReceived ? avatarSrc : 'https://i.pravatar.cc/150?img=2';
                
                // Use random local image (without repeating)
                const storyImageSrc = getRandomLocalImage(chatId);
                
                // 30% with 😂, 60% without reaction (no ❤️ for chat-5)
                const reactionRand = Math.random();
                let reactionHTML = '';
                if (reactionRand < 0.3) {
                    reactionHTML = '<div class="message-reaction">😂</div>';
                }
                
                if (isReceived) {
                    messageHTML = `
                        <img src="${avatarSrc}" alt="User" class="message-avatar">
                        <div class="message-bubble">
                            <div class="story-encaminhado-recebido">
                                <div class="story-encaminhado-header">
                                    <img src="${userAvatar}" alt="User" class="story-encaminhado-avatar">
                                    <div class="story-encaminhado-info">
                                        <span class="story-encaminhado-name">${userName}</span>
                                    </div>
                                </div>
                                <img src="${storyImageSrc}" alt="Story" class="story-encaminhado-image">
                                <div class="story-encaminhado-play-btn">
                                    <svg width="32.5" height="32.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M8 5 L8 19 L19 12 Z" fill="#F9F9F9" stroke="#F9F9F9" stroke-width="7" stroke-linejoin="round" stroke-linecap="round"/>
                                    </svg>
                                </div>
                                <div class="story-encaminhado-clip-icon">
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <defs>
                                            <mask id="${maskId}">
                                                <rect width="24" height="24" fill="#F9F9F9"/>
                                                <path d="M10 8 L10 16 L16 12 Z" fill="black" stroke="black" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>
                                            </mask>
                                        </defs>
                                        <rect x="2" y="2" width="20" height="20" rx="6" ry="6" fill="#F9F9F9" mask="url(#${maskId})"/>
                                    </svg>
                                </div>
                            </div>
                            ${reactionHTML}
                        </div>
                    `;
                } else {
                    messageHTML = `
                        <div class="message-bubble">
                            <div class="story-encaminhado-recebido">
                                <div class="story-encaminhado-header">
                                    <img src="${userAvatar}" alt="User" class="story-encaminhado-avatar">
                                    <div class="story-encaminhado-info">
                                        <span class="story-encaminhado-name">${userName}</span>
                                    </div>
                                </div>
                                <img src="${storyImageSrc}" alt="Story" class="story-encaminhado-image">
                                <div class="story-encaminhado-play-btn">
                                    <svg width="32.5" height="32.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M8 5 L8 19 L19 12 Z" fill="#F9F9F9" stroke="#F9F9F9" stroke-width="7" stroke-linejoin="round" stroke-linecap="round"/>
                                    </svg>
                                </div>
                                <div class="story-encaminhado-clip-icon">
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <defs>
                                            <mask id="${maskId}">
                                                <rect width="24" height="24" fill="#F9F9F9"/>
                                                <path d="M10 8 L10 16 L16 12 Z" fill="black" stroke="black" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>
                                            </mask>
                                        </defs>
                                        <rect x="2" y="2" width="20" height="20" rx="6" ry="6" fill="#F9F9F9" mask="url(#${maskId})"/>
                                    </svg>
                                </div>
                            </div>
                            ${reactionHTML}
                        </div>
                    `;
                }
            } else {
                // Normal text
                const randomMsg = randomMessages[Math.floor(Math.random() * randomMessages.length)];
                const processedContent = applyBlurToText(randomMsg.content);
                
                if (isReceived) {
                    messageHTML = `
                        <img src="${avatarSrc}" alt="User" class="message-avatar">
                    <div class="message-bubble">
                        <div class="message-content">${processedContent}</div>
                    </div>
                `;
            } else {
                    // Sometimes add reaction
                    const hasReaction = Math.random() > 0.7;
                    const reactions = ['❤️', '👍', '😂', '😍', '🔥'];
                    const reaction = reactions[Math.floor(Math.random() * reactions.length)];
                    
                    messageHTML = `
                    <div class="message-bubble">
                        <div class="message-content">${processedContent}</div>
                            ${hasReaction ? `<div class="message-reaction">${reaction}</div>` : ''}
                    </div>
                `;
                }
            }
            
            messageDiv.innerHTML = messageHTML;
            
            // Save message HTML to restore later
            messagesHTML.push(messageDiv.outerHTML);
            
            // Insert after loading (which is at top)
            chatMessages.insertBefore(messageDiv, loadingDiv.nextSibling);
            // DON'T add listeners for filler content (not interactive)
        }
        
        // Save generated messages to localStorage
        localStorage.setItem(savedMessagesKey, JSON.stringify(messagesHTML));
        
        // Configure transcription buttons for new audios
        setupTranscricaoButtons();
        
        // Dividir textos em divs por linha
        setTimeout(() => {
            wrapTextLinesInDivs();
        }, 100);
        
        // Remove loading
        loadingDiv.remove();
        
        // Increment load counter (chat-specific)
        messagesLoadCount++;
        localStorage.setItem(loadCountKey, messagesLoadCount.toString());
        
        // Maintain scroll position
        chatMessages.scrollTop = chatMessages.scrollHeight - oldScrollHeight;
        
        isLoadingMessages = false;
    }, 800);
}

// Initial scroll
chatMessages.scrollTop = chatMessages.scrollHeight;

// Manage input icons and message sending
if (messageInput) {
    const inputActions = document.querySelector('.message-input-actions');
    const inputActionIcons = inputActions ? inputActions.querySelectorAll('.input-action-icon:not(.input-send-icon)') : [];
    const inputSendIcon = document.getElementById('inputSendIcon');
    const cameraIcon = document.getElementById('cameraIcon');
    const searchIcon = document.getElementById('searchIcon');
    
    // Function to update icon visibility
    function updateInputIcons(hasText) {
        if (hasText) {
            // Hide the 4 icons and PURPLE DIV (camera)
            inputActionIcons.forEach(icon => {
                icon.style.display = 'none';
            });
            if (cameraIcon) cameraIcon.style.display = 'none';
            // Show magnifying glass (without purple background) and send button
            if (searchIcon) searchIcon.style.display = 'flex';
            if (inputSendIcon) inputSendIcon.style.display = 'flex';
        } else {
            // Show the 4 icons and PURPLE DIV (camera), hide send and magnifying glass
            inputActionIcons.forEach(icon => {
                icon.style.display = 'flex';
            });
            if (inputSendIcon) inputSendIcon.style.display = 'none';
            if (cameraIcon) cameraIcon.style.display = 'flex';
            if (searchIcon) searchIcon.style.display = 'none';
        }
    }

// Send message with Enter
messageInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter' && this.value.trim() !== '') {
        sendMessage(this.value);
        this.value = '';
            updateInputIcons(false);
    }
});

    // Show/hide input icons based on text
messageInput.addEventListener('input', function() {
        updateInputIcons(this.value.trim() !== '');
    });
    
    // Event listener for send icon
    if (inputSendIcon) {
        inputSendIcon.addEventListener('click', function() {
            if (messageInput.value.trim() !== '') {
                sendMessage(messageInput.value);
                messageInput.value = '';
                updateInputIcons(false);
            }
        });
    }
}

// Function to send heart message
function sendHeartMessage() {
    const now = new Date();
    const time = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
    const messageId = 'msg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    
    // Save message to localStorage (chat-specific)
    const chatId = getChatId();
    const storageKey = `${chatId}_sentMessages`;
    const sentMessages = JSON.parse(localStorage.getItem(storageKey) || '[]');
    sentMessages.push({
        id: messageId,
        text: '❤️',
        time: time,
        timestamp: Date.now(),
        isHeart: true
    });
    localStorage.setItem(storageKey, JSON.stringify(sentMessages));
    
    // Heart message with different style
    const messageDivSent = document.createElement('div');
    messageDivSent.className = 'message sent message-heart';
    messageDivSent.setAttribute('data-message-id', messageId);
    messageDivSent.innerHTML = `
        <div class="message-bubble">
            <div class="message-content-heart">❤️</div>
            <div class="message-time">${time}</div>
        </div>
    `;
    chatMessages.appendChild(messageDivSent);
    addMessageListeners(messageDivSent);
    
    // Apply rounded corners after adding new message
    applyMessageRoundedCorners();
    
    // Update heart message gradient (doesn't have .message-content, so not needed)
    
    scrollToBottom();
    
    // Remove VIP error from previous messages (but keep borders)
    const previousErrors = document.querySelectorAll('.message-vip-error');
    previousErrors.forEach(error => error.remove());
    
    // Show "not VIP MEMBER" error below last sent message (permanent)
    setTimeout(() => {
        showVIPError(messageDivSent);
    }, 1500);
}

// Function to send message
function sendMessage(text) {
    const now = new Date();
    const time = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
    const messageId = 'msg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    
    // Apply blur to text
    const processedText = applyBlurToText(escapeHtml(text));
    
    // Save message to localStorage (chat-specific)
    const chatId = getChatId();
    const storageKey = `${chatId}_sentMessages`;
    const sentMessages = JSON.parse(localStorage.getItem(storageKey) || '[]');
    sentMessages.push({
        id: messageId,
        text: text,
        time: time,
        timestamp: Date.now()
    });
    localStorage.setItem(storageKey, JSON.stringify(sentMessages));
    
    // ONLY sent message - NO duplication
    const messageDivSent = document.createElement('div');
    messageDivSent.className = 'message sent new-message';
    messageDivSent.setAttribute('data-message-id', messageId);
    messageDivSent.innerHTML = `
        <div class="message-bubble">
            <div class="message-content">${processedText}</div>
            <div class="message-time">${time}</div>
        </div>
    `;
    chatMessages.appendChild(messageDivSent);
    addMessageListeners(messageDivSent);
    
    // Apply rounded corners after adding new message
    applyMessageRoundedCorners();
    
    // Update new message gradient
    setTimeout(() => {
        updateMessageGradient(messageDivSent);
        // Divide text into divs by line
        wrapTextLinesInDivs();
    }, 100);
    
    scrollToBottom();
    
    // Remove VIP error from previous messages (but keep borders)
    const previousErrors = document.querySelectorAll('.message-vip-error');
    previousErrors.forEach(error => error.remove());
    
    // Show "not VIP MEMBER" error below last sent message (permanent)
    setTimeout(() => {
        showVIPError(messageDivSent);
    }, 1500);
}

// Show VIP MEMBER error below message (permanent)
function showVIPError(messageElement) {
    if (!messageElement) return;
    
    // Check if error already exists after this message
    const nextSibling = messageElement.nextElementSibling;
    if (nextSibling && nextSibling.classList.contains('message-vip-error')) {
        return; // Don't create duplicate
    }
    
    const errorDiv = document.createElement('div');
    errorDiv.className = 'message-vip-error';
    errorDiv.innerHTML = '<span>Message not sent. <span class="saiba-mais">Learn more</span></span>';
    messageElement.insertAdjacentElement('afterend', errorDiv);
    
    // Add event listener for "Learn more"
    const saibaMais = errorDiv.querySelector('.saiba-mais');
    if (saibaMais) {
        saibaMais.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            showBlockedPopup();
        });
    }
    
    scrollToBottom();
}

// Escape HTML for security
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Smooth scroll to bottom
function scrollToBottom() {
    chatMessages.scrollTo({
        top: chatMessages.scrollHeight,
        behavior: 'smooth'
    });
}

// Context menu (right click on messages)
function addMessageListeners(messageElement) {
    const bubble = messageElement.querySelector('.message-bubble');
    if (!bubble) return;
    
    // Clique direito (desktop)
    bubble.addEventListener('contextmenu', function(e) {
        e.preventDefault();
        const rect = bubble.getBoundingClientRect();
        showBothMenus(rect, messageElement);
    });
    
    // Hold for reactions (mouse - desktop)
    let pressTimer;
    bubble.addEventListener('mousedown', function(e) {
        if (e.button !== 0) return; // Only left button
        pressTimer = setTimeout(() => {
            const rect = bubble.getBoundingClientRect();
            showBothMenus(rect, messageElement);
        }, 500);
    });
    
    bubble.addEventListener('mouseup', function() {
        clearTimeout(pressTimer);
    });
    
    bubble.addEventListener('mouseleave', function() {
        clearTimeout(pressTimer);
    });
    
    // ===== TOUCH EVENTS PARA iOS/MOBILE =====
    let touchTimer;
    let touchMoved = false;
    
    bubble.addEventListener('touchstart', function(e) {
        touchMoved = false;
        touchTimer = setTimeout(() => {
            if (!touchMoved) {
                e.preventDefault();
                const rect = bubble.getBoundingClientRect();
                showBothMenus(rect, messageElement);
                // Vibrar no celular (se suportado)
                if (navigator.vibrate) {
                    navigator.vibrate(50);
                }
            }
        }, 500); // 500ms de long press
    }, { passive: false });
    
    bubble.addEventListener('touchmove', function() {
        touchMoved = true;
        clearTimeout(touchTimer);
    });
    
    bubble.addEventListener('touchend', function() {
        clearTimeout(touchTimer);
    });
    
    bubble.addEventListener('touchcancel', function() {
        clearTimeout(touchTimer);
    });
}

// Convert hex to RGB
function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}

// Interpolate between two RGB colors
function interpolateColor(color1, color2, factor) {
    const rgb1 = hexToRgb(color1);
    const rgb2 = hexToRgb(color2);
    if (!rgb1 || !rgb2) return color1;
    
    const r = Math.round(rgb1.r + (rgb2.r - rgb1.r) * factor);
    const g = Math.round(rgb1.g + (rgb2.g - rgb1.g) * factor);
    const b = Math.round(rgb1.b + (rgb2.b - rgb1.b) * factor);
    
    return `rgb(${r}, ${g}, ${b})`;
}

// Update solid color of sent messages based on position
function updateMessageGradient(messageElement) {
    const content = messageElement.querySelector('.message-content') || messageElement.querySelector('.audio-recebido');
    if (!content || !messageElement.classList.contains('sent')) return;
    
    const rect = messageElement.getBoundingClientRect();
    const headerHeight = 60;
    const inputHeight = 70;
    const viewportHeight = window.innerHeight;
    
    // Calculate relative position (0 = near header, 1 = near input)
    const topPosition = rect.top - headerHeight;
    const availableHeight = viewportHeight - headerHeight - inputHeight;
    const relativePosition = Math.max(0, Math.min(1, topPosition / availableHeight));
    
    // Interpolate between colors
    // Closer to input (relativePosition near 1), more #584FF9 (blue)
    // Closer to header (relativePosition near 0), more #ae34e2 (purple)
    const colorInput = '#584FF9'; // Color when near input (bottom) - blue
    const colorHeader = '#ae34e2'; // Color when near header (top) - purple
    
    // Interpolate: relativePosition = 0 (top) → more purple, relativePosition = 1 (bottom) → more blue
    const interpolatedColor = interpolateColor(colorHeader, colorInput, relativePosition);
    
    content.style.background = interpolatedColor;
}

// Update gradients of all sent messages
function updateAllMessageGradients() {
    const sentMessages = document.querySelectorAll('.message.sent');
    sentMessages.forEach(msg => {
        updateMessageGradient(msg);
    });
}

// Close all menus and overlay
function closeAllMenus() {
    contextMenu.classList.remove('show');
    quickReactions.classList.remove('show');
    if (menusOverlay) {
        menusOverlay.classList.remove('show');
    }
    // Clear transform and z-index of messages
    const messages = document.querySelectorAll('.message');
    messages.forEach(msg => {
        msg.style.transition = '';
        msg.style.transform = '';
        msg.style.position = '';
        msg.style.zIndex = '';
    });
}

// Show both menus together
function showBothMenus(rect, messageElement) {
    selectedMessage = messageElement;
    
    const padding = 10;
    const headerHeight = 60; // altura aproximada do header
    const reactionsWidth = (6 * 48) + (5 * 2) + 28; // 6 emojis + 5 gaps + padding total
    const reactionsHeight = 68; // altura aproximada (48px emoji + padding)
    
    // Get real height of context menu
    contextMenu.classList.add('show');
    const menuHeight = contextMenu.offsetHeight;
    contextMenu.classList.remove('show');
    
    // Calculate where reactions would be (above message)
    let reactionsY = rect.top - reactionsHeight - 10;
    
    // Calculate where menu would be (below message)
    let menuY = rect.bottom + 10;
    
    // Check if reactions will cut at top
    const reactionsWillCutTop = reactionsY < headerHeight + padding;
    
    // Check if menu will cut at bottom
    const menuWillCutBottom = menuY + menuHeight > window.innerHeight - padding;
    
    // Calculate scale needed to fit everything WITHOUT CUTTING
    let scale = 1;
    let moveY = 0;
    
    if (reactionsWillCutTop || menuWillCutBottom) {
        // Calculate available space
        const availableHeight = window.innerHeight - headerHeight - padding;
        const totalNeeded = reactionsHeight + 10 + rect.height + 10 + menuHeight;
        
        // If it doesn't fit, reduce scale until everything fits
        if (totalNeeded > availableHeight) {
            // Calculate scale so everything fits
            scale = (availableHeight - reactionsHeight - 10 - menuHeight - 10) / rect.height;
            // Limit minimum and maximum scale
            scale = Math.max(0.4, Math.min(1, scale));
        }
        
        // After reducing, check positions again
        const scaledMessageHeight = rect.height * scale;
        const newReactionsY = rect.top - (scaledMessageHeight - rect.height) / 2 - reactionsHeight - 10;
        const newMenuY = rect.bottom + (scaledMessageHeight - rect.height) / 2 + 10;
        
        // If still cuts, adjust vertical position
        if (newReactionsY < headerHeight + padding) {
            // Reactions still cut: move message down
            const neededSpace = headerHeight + padding + reactionsHeight + 10;
            const messageTopAfterScale = rect.top - (scaledMessageHeight - rect.height) / 2;
            moveY = neededSpace - messageTopAfterScale + (scaledMessageHeight - rect.height) / 2;
        } else if (newMenuY + menuHeight > window.innerHeight - padding) {
            // Menu still cuts: move message up
            const neededSpace = window.innerHeight - padding - menuHeight - 10;
            const messageBottomAfterScale = rect.bottom + (scaledMessageHeight - rect.height) / 2;
            moveY = neededSpace - messageBottomAfterScale - (scaledMessageHeight - rect.height) / 2;
        }
    }
    
    // Apply transform to message
    messageElement.style.position = 'relative';
    messageElement.style.zIndex = '1002';
    messageElement.style.transition = 'transform 0.2s ease-out';
    messageElement.style.transformOrigin = 'center center';
    
    if (scale !== 1 || moveY !== 0) {
        messageElement.style.transform = `translateY(${moveY}px) scale(${scale})`;
    } else {
        messageElement.style.transition = '';
        messageElement.style.transform = '';
    }
    
    // Recalculate positions after transforming message
    const scaledHeight = rect.height * scale;
    const newMessageTop = rect.top + moveY - (scaledHeight - rect.height) / 2;
    const newMessageBottom = newMessageTop + scaledHeight;
    let newReactionsY = newMessageTop - reactionsHeight - 10;
    let newMenuY = newMessageBottom + 10;
    
    // Ensure menu is NEVER cut
    if (newMenuY + menuHeight > window.innerHeight - padding) {
        // Menu will cut: adjust menu position upward
        newMenuY = window.innerHeight - padding - menuHeight;
        // Recalculate message position based on menu
        const newMessageBottomFromMenu = newMenuY - 10;
        const newMessageTopFromMenu = newMessageBottomFromMenu - scaledHeight;
        // Adjust moveY so message is in correct position
        moveY = newMessageTopFromMenu - (rect.top - (scaledHeight - rect.height) / 2);
        // Recalculate reactions based on new message position
        newReactionsY = newMessageTopFromMenu - reactionsHeight - 10;
    }
    
    // Ensure reactions are NEVER cut
    if (newReactionsY < headerHeight + padding) {
        // Reactions will cut: adjust reactions position
        newReactionsY = headerHeight + padding;
        // Recalculate message position based on reactions
        const newMessageTopFromReactions = newReactionsY + reactionsHeight + 10;
        // Adjust moveY
        moveY = newMessageTopFromReactions - (rect.top - (scaledHeight - rect.height) / 2);
        // Recalculate menu based on new message position
        const newMessageBottomFromReactions = newMessageTopFromReactions + scaledHeight;
        newMenuY = newMessageBottomFromReactions + 10;
        
        // If menu still cuts after adjusting reactions, reduce message more
        if (newMenuY + menuHeight > window.innerHeight - padding) {
            const availableForMessage = window.innerHeight - padding - (headerHeight + padding) - reactionsHeight - 10 - menuHeight - 10;
            scale = availableForMessage / rect.height;
            scale = Math.max(0.3, Math.min(1, scale));
            // Recalculate everything again
            const finalScaledHeight = rect.height * scale;
            const finalMessageTop = headerHeight + padding + reactionsHeight + 10;
            const finalMessageBottom = finalMessageTop + finalScaledHeight;
            newMenuY = finalMessageBottom + 10;
            moveY = finalMessageTop - (rect.top - (finalScaledHeight - rect.height) / 2);
        }
    }
    
    // Apply final transform
    messageElement.style.position = 'relative';
    messageElement.style.zIndex = '1002';
    messageElement.style.transition = 'transform 0.2s ease-out';
    messageElement.style.transformOrigin = 'center center';
    
    if (scale !== 1 || moveY !== 0) {
        messageElement.style.transform = `translateY(${moveY}px) scale(${scale})`;
    } else {
        messageElement.style.transition = '';
        messageElement.style.transform = '';
    }
    
    // Calculate horizontal positions (centered)
    const messageCenterX = rect.left + (rect.width / 2);
    
    // Reactions - horizontal position
    let reactionsX = messageCenterX - (reactionsWidth / 2);
    if (reactionsX < padding) {
        reactionsX = padding;
    } else if (reactionsX + reactionsWidth > window.innerWidth - padding) {
        reactionsX = window.innerWidth - reactionsWidth - padding;
    }
    
    // Menu - horizontal position
    const menuWidth = 200;
    let menuX = messageCenterX - (menuWidth / 2);
    if (menuX < padding) {
        menuX = padding;
    } else if (menuX + menuWidth > window.innerWidth - padding) {
        menuX = window.innerWidth - menuWidth - padding;
    }
    
    // Reset animations by removing and adding class
    quickReactions.classList.remove('show');
    void quickReactions.offsetWidth; // Force reflow
    
    // Position reactions (ALWAYS above message)
    quickReactions.style.left = reactionsX + 'px';
    quickReactions.style.top = newReactionsY + 'px';
    quickReactions.classList.add('show');
    
    // Position menu (ALWAYS below message) - ENSURE IT DOESN'T CUT
    contextMenu.style.left = menuX + 'px';
    contextMenu.style.top = Math.min(newMenuY, window.innerHeight - padding - menuHeight) + 'px';
    contextMenu.classList.add('show');
    
    // Show overlay with blur
    if (menusOverlay) {
        menusOverlay.classList.add('show');
    }
    
    // Check message type and show/hide options
    const copiarItem = document.getElementById('contextItemCopiar');
    const baixarItem = document.getElementById('contextItemBaixar');
    
    // Check if it's media (photo, video, audio, location, story, pack, forwarded post)
    const isMedia = !!(
        messageElement.querySelector('.message-photo') ||
        messageElement.querySelector('.message-video') ||
        messageElement.querySelector('.message-video-pack') ||
        messageElement.querySelector('.story-encaminhado-recebido') ||
        messageElement.querySelector('.audio-recebido') ||
        messageElement.querySelector('.message-location') ||
        messageElement.querySelector('.post-encaminhado-recebido')
    );
    
    // Check if it's text - get .message-content that is NOT inside .message-reply
    const allMessageContents = messageElement.querySelectorAll('.message-content');
    let mainMessageContent = null;
    for (let content of allMessageContents) {
        if (!content.closest('.message-reply')) {
            mainMessageContent = content;
            break;
        }
    }
    const hasText = mainMessageContent && mainMessageContent.textContent.trim();
    const isText = hasText && !isMedia;
    
    // Show/hide options based on type
    if (copiarItem) {
        copiarItem.style.display = isText ? 'flex' : 'none';
    }
    if (baixarItem) {
        baixarItem.style.display = isMedia ? 'flex' : 'none';
    }
    
    // Check if it's sent message to change "Report" to "Cancel send"
    const denunciarItem = document.getElementById('contextItemDenunciar');
    const denunciarIcon = denunciarItem ? denunciarItem.querySelector('.denunciar-icon') : null;
    const denunciarText = denunciarItem ? denunciarItem.querySelector('.denunciar-text') : null;
    const isSent = messageElement.classList.contains('sent');
    
    if (denunciarItem && denunciarIcon && denunciarText) {
        if (isSent) {
            // Sent message: show "Cancel send" with empty circle icon and back arrow (same as reply)
            denunciarText.textContent = 'Cancel send';
            denunciarIcon.setAttribute('aria-label', 'Cancel send');
            denunciarIcon.innerHTML = '<title>Cancel send</title><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M12.5 9.5H8.2l3.3-3.3M8.2 9.5l3.3 3.3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/><path d="M8.2 9.5h4.3" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>';
        } else {
            // Received message: keep "Report"
            denunciarText.textContent = 'Report';
            denunciarIcon.setAttribute('aria-label', 'Report');
            denunciarIcon.innerHTML = '<title>Denunciar</title><path d="M18.001 1h-12a5.006 5.006 0 0 0-5 5v9.005a5.006 5.006 0 0 0 5 5h2.514l2.789 2.712a1 1 0 0 0 1.394 0l2.787-2.712h2.516a5.006 5.006 0 0 0 5-5V6a5.006 5.006 0 0 0-5-5Zm3 14.005a3.003 3.003 0 0 1-3 3h-2.936a1 1 0 0 0-.79.387l-2.274 2.212-2.276-2.212a1 1 0 0 0-.79-.387H6a3.003 3.003 0 0 1-3-3V6a3.003 3.003 0 0 1 3-3h12a3.003 3.003 0 0 1 3 3Zm-9-1.66a1.229 1.229 0 1 0 1.228 1.228A1.23 1.23 0 0 0 12 13.344Zm0-8.117a1.274 1.274 0 0 0-.933.396 1.108 1.108 0 0 0-.3.838l.347 4.861a.892.892 0 0 0 1.77 0l.348-4.86a1.106 1.106 0 0 0-.3-.838A1.272 1.272 0 0 0 12 5.228Z" fill="currentColor"/>';
        }
    }
}


// Mostrar menu de contexto
function showContextMenu(x, y, messageElement) {
    selectedMessage = messageElement;
    contextMenu.style.left = x + 'px';
    contextMenu.style.top = y + 'px';
    contextMenu.classList.add('show');
    
    // Check message type
    const copiarItem = document.getElementById('contextItemCopiar');
    const baixarItem = document.getElementById('contextItemBaixar');
    
    // Check if it's media (photo, video, audio, location, story, pack, forwarded post)
    const isMedia = !!(
        messageElement.querySelector('.message-photo') ||
        messageElement.querySelector('.message-video') ||
        messageElement.querySelector('.message-video-pack') ||
        messageElement.querySelector('.story-encaminhado-recebido') ||
        messageElement.querySelector('.audio-recebido') ||
        messageElement.querySelector('.message-location') ||
        messageElement.querySelector('.post-encaminhado-recebido')
    );
    
    // Check if it's text - get .message-content that is NOT inside .message-reply
    const allMessageContents = messageElement.querySelectorAll('.message-content');
    let mainMessageContent = null;
    for (let content of allMessageContents) {
        if (!content.closest('.message-reply')) {
            mainMessageContent = content;
            break;
        }
    }
    const hasText = mainMessageContent && mainMessageContent.textContent.trim();
    const isText = hasText && !isMedia;
    
    // Show/hide options based on type
    if (copiarItem) {
        copiarItem.style.display = isText ? 'flex' : 'none';
    }
    if (baixarItem) {
        baixarItem.style.display = isMedia ? 'flex' : 'none';
    }
    
    // Check if it's sent message to change "Report" to "Cancel send"
    const denunciarItem = document.getElementById('contextItemDenunciar');
    const denunciarIcon = denunciarItem ? denunciarItem.querySelector('.denunciar-icon') : null;
    const denunciarText = denunciarItem ? denunciarItem.querySelector('.denunciar-text') : null;
    const isSent = messageElement.classList.contains('sent');
    
    if (denunciarItem && denunciarIcon && denunciarText) {
        if (isSent) {
            // Sent message: show "Cancel send" with empty circle icon and back arrow (same as reply)
            denunciarText.textContent = 'Cancel send';
            denunciarIcon.setAttribute('aria-label', 'Cancel send');
            denunciarIcon.innerHTML = '<title>Cancel send</title><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M12.5 9.5H8.2l3.3-3.3M8.2 9.5l3.3 3.3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/><path d="M8.2 9.5h4.3" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>';
        } else {
            // Received message: keep "Report"
            denunciarText.textContent = 'Report';
            denunciarIcon.setAttribute('aria-label', 'Report');
            denunciarIcon.innerHTML = '<title>Denunciar</title><path d="M18.001 1h-12a5.006 5.006 0 0 0-5 5v9.005a5.006 5.006 0 0 0 5 5h2.514l2.789 2.712a1 1 0 0 0 1.394 0l2.787-2.712h2.516a5.006 5.006 0 0 0 5-5V6a5.006 5.006 0 0 0-5-5Zm3 14.005a3.003 3.003 0 0 1-3 3h-2.936a1 1 0 0 0-.79.387l-2.274 2.212-2.276-2.212a1 1 0 0 0-.79-.387H6a3.003 3.003 0 0 1-3-3V6a3.003 3.003 0 0 1 3-3h12a3.003 3.003 0 0 1 3 3Zm-9-1.66a1.229 1.229 0 1 0 1.228 1.228A1.23 1.23 0 0 0 12 13.344Zm0-8.117a1.274 1.274 0 0 0-.933.396 1.108 1.108 0 0 0-.3.838l.347 4.861a.892.892 0 0 0 1.77 0l.348-4.86a1.106 1.106 0 0 0-.3-.838A1.272 1.272 0 0 0 12 5.228Z" fill="currentColor"/>';
        }
    }
}

// Show quick reactions
function showQuickReactions(x, y, messageElement) {
    selectedMessage = messageElement;
    quickReactions.style.left = (x - 150) + 'px';
    quickReactions.style.top = (y - 60) + 'px';
    quickReactions.classList.add('show');
}

// Close menus when clicking outside or on overlay
document.addEventListener('click', function(e) {
    if (e.target === menusOverlay) {
        closeAllMenus();
    } else if (!contextMenu.contains(e.target) && !quickReactions.contains(e.target)) {
        closeAllMenus();
    }
});

// Context menu actions
const contextItems = document.querySelectorAll('.context-item');
contextItems.forEach(item => {
    item.addEventListener('click', function() {
        const action = this.textContent.trim();
        
        if (action.includes('Reply') || action.includes('Responder')) {
            showBlockedPopup(blockedMessages.reply);
        } else if (action.includes('Forward') || action.includes('Encaminhar')) {
            forwardMessage();
        } else if (action.includes('Copy') || action.includes('Copiar')) {
            copyMessage();
        } else if (action.includes('Download') || action.includes('Baixar')) {
            downloadMessage();
        } else if (action.includes('Delete for you') || action.includes('Excluir pra você') || action.includes('Cancel send') || action.includes('Cancelar envio')) {
            showBlockedPopup(blockedMessages.cancel);
        } else if (action.includes('Report') || action.includes('Denunciar')) {
            reportMessage();
        }
        
        closeAllMenus();
    });
});

// Add reaction
const reactionEmojis = document.querySelectorAll('.reaction-emoji');
reactionEmojis.forEach(emoji => {
    emoji.addEventListener('click', function() {
        if (selectedMessage) {
            addReaction(selectedMessage, this.textContent);
        }
        closeAllMenus();
    });
});

// Function to add reaction (new logic: appears → waits → disappears → popup)
function addReaction(messageElement, emoji) {
    const bubble = messageElement.querySelector('.message-bubble');
    let reaction = bubble.querySelector('.message-reaction');
    
    // If it already exists, remove to create new one
    if (reaction) {
        reaction.remove();
    }
    
    // Create new reaction
        reaction = document.createElement('div');
        reaction.className = 'message-reaction';
        reaction.textContent = emoji;
        bubble.appendChild(reaction);
    
    // Close reactions menu
    closeAllMenus();
    
    // After 1.5s, hide the reaction
    setTimeout(() => {
        if (reaction && reaction.parentNode) {
            reaction.classList.add('hidden');
        }
        
        // After reaction disappears (0.3s transition), show popup
        setTimeout(() => {
            if (reaction && reaction.parentNode) {
                reaction.remove();
            }
            showBlockedPopup();
        }, 300);
    }, 1500);
}

// Copy message
function copyMessage() {
    if (selectedMessage) {
        const content = selectedMessage.querySelector('.message-content');
        if (content) {
            navigator.clipboard.writeText(content.textContent);
            showNotification('Message copied');
        }
    }
}

// Forward message
function forwardMessage() {
    if (selectedMessage) {
        showBlockedPopup();
    }
}

// Download message
function downloadMessage() {
    if (selectedMessage) {
        // Create download link for the file
        const link = document.createElement('a');
        link.href = '../../imagens/quereracessovip.png';
        link.download = 'quereracessovip.png';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}

// Delete message
function deleteMessage() {
    if (selectedMessage) {
        showBlockedPopup();
    }
}

// Report message
function reportMessage() {
    if (selectedMessage) {
        showBlockedPopup();
    }
}

// Notification
function showNotification(text) {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background-color: #262626;
        color: #F9F9F9;
        padding: 12px 24px;
        border-radius: 8px;
        font-size: 14px;
        z-index: 10000;
        animation: fadeIn 0.3s ease;
    `;
    notification.textContent = text;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'fadeOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 2000);
}

// Voice call
if (callBtn) {
callBtn.addEventListener('click', function() {
    addSystemMessage('fas fa-phone', 'Calling...', true);
    
    setTimeout(() => {
        const lastMsg = chatMessages.lastElementChild;
        lastMsg.querySelector('span').textContent = 'Missed voice call';
        lastMsg.querySelector('i').className = 'fas fa-phone-slash';
    }, 3000);
});
}

// Video call
if (videoBtn) {
videoBtn.addEventListener('click', function() {
    addSystemMessage('fas fa-video', 'Calling...', true);
    
    setTimeout(() => {
        const lastMsg = chatMessages.lastElementChild;
        lastMsg.querySelector('span').textContent = 'Missed video call';
        lastMsg.querySelector('i').className = 'fas fa-video-slash';
    }, 3000);
});
}

// Add system message
function addSystemMessage(icon, text, addTime = false) {
    const now = new Date();
    const time = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
    
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message-system';
    messageDiv.innerHTML = `
        <i class="${icon}"></i>
        <span>${text}</span>
        ${addTime ? `<span class="system-time">${time}</span>` : ''}
    `;
    
    chatMessages.appendChild(messageDiv);
    scrollToBottom();
}

// Record audio
if (voiceBtn) {
voiceBtn.addEventListener('click', function() {
    if (!isRecordingVoice) {
        // Start recording
        isRecordingVoice = true;
        this.style.color = '#ed4956';
        showNotification('Recording audio...');
        
        // Simulate recording
        setTimeout(() => {
            isRecordingVoice = false;
            voiceBtn.style.color = '#F9F9F9';
            sendAudioMessage();
        }, 3000);
    }
});
}

// Send audio
function sendAudioMessage() {
    const now = new Date();
    const time = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
    const duration = Math.floor(Math.random() * 20) + 5;
    
    // Gerar barras de waveform com alturas suaves (evitando contrastes muito grandes)
    const chatId = getChatId();
    const audioCounterKey = `${chatId}_audio_sent_counter`;
    let audioCounter = parseInt(localStorage.getItem(audioCounterKey) || '0');
    audioCounter++;
    localStorage.setItem(audioCounterKey, audioCounter.toString());
    
    const audioKey = `${chatId}_audio_sent_${duration}_${audioCounter}`;
    let savedHeights = localStorage.getItem(audioKey);
    
    let heights = [];
    if (savedHeights) {
        heights = JSON.parse(savedHeights);
    } else {
        // Generate fixed heights (random but always the same for this audio)
        let currentHeight = Math.floor(Math.random() * 21) + 15; // 15-36px
    const numBars = 30;
        
    for (let i = 0; i < numBars; i++) {
            const rand = Math.random();
            const variation = rand < 0.5 
                ? Math.floor(Math.random() * 17) - 8   // 50%: -8 a +8
                : rand < 0.8 
                    ? Math.floor(Math.random() * 31) - 15  // 30%: -15 a +15
                    : Math.floor(Math.random() * 41) - 20; // 20%: -20 a +20
            
            currentHeight = Math.max(12, Math.min(40, currentHeight + variation));
            heights.push(currentHeight);
        }
        localStorage.setItem(audioKey, JSON.stringify(heights));
    }
    
    let waveformBars = '';
    heights.forEach(height => {
        waveformBars += `<div class="audio-recebido-waveform-bar" style="height: ${height}px;"></div>`;
    });
    
    // ONLY sent audio - NO duplication
    const messageDivSent = document.createElement('div');
    messageDivSent.className = 'message sent';
    messageDivSent.innerHTML = `
        <div class="message-bubble">
            <div class="audio-recebido">
                <button class="audio-recebido-play-btn">
                    <i class="fas fa-play"></i>
                </button>
                <div class="audio-recebido-waveform">
                    ${waveformBars}
                </div>
                <span class="audio-recebido-duration">0:${duration.toString().padStart(2, '0')}</span>
            </div>
            <div class="message-time">${time}</div>
        </div>
    `;
    chatMessages.appendChild(messageDivSent);
    
    // Apply rounded corners after adding new message
    applyMessageRoundedCorners();
    
    // Configure transcription buttons (if there are new received audios)
    setupTranscricaoButtons();
    
    // Adicionar funcionalidade de play no enviado (usa as mesmas classes do recebido)
    const playBtnSent = messageDivSent.querySelector('.audio-recebido-play-btn');
    const audioContainerSent = messageDivSent.querySelector('.audio-recebido');
    const durationElementSent = audioContainerSent.querySelector('.audio-recebido-duration');
    const originalDurationTextSent = durationElementSent.textContent;
    const originalSecondsSent = parseInt(originalDurationTextSent.split(':')[1]);
    const totalDurationSent = originalSecondsSent * 1000;
    
    let animationFrameIdSent = null;
    let isPlayingSent = false;
    let startTimeSent = null;
    let elapsedBeforePauseSent = 0;
    
    playBtnSent.addEventListener('click', function() {
        const icon = this.querySelector('i');
        const waveformContainer = audioContainerSent.querySelector('.audio-recebido-waveform');
        const bars = waveformContainer.querySelectorAll('.audio-recebido-waveform-bar');
        
        if (icon.classList.contains('fa-play')) {
            if (isPlayingSent) return; // Already playing, ignore
            
            // Pause all other audios (simulates click on pause)
            document.querySelectorAll('.audio-recebido-play-btn').forEach(otherBtn => {
                if (otherBtn !== playBtnSent) {
                    const otherIcon = otherBtn.querySelector('i');
                    if (otherIcon && otherIcon.classList.contains('fa-pause')) {
                        otherBtn.click();
                    }
                }
            });
            
            // Mostrar popup VIP
            showAudioVIPPopup();
            
            icon.classList.remove('fa-play');
            icon.classList.add('fa-pause');
            isPlayingSent = true;
            
            // Initialize all bars as white with opacity (playing without active) - SENT AUDIO
            bars.forEach(bar => {
                // Remove all previous classes and styles
                bar.classList.remove('active');
                bar.classList.add('playing');
                // Remove any previous inline styles
                bar.style.removeProperty('background-color');
                bar.style.removeProperty('opacity');
                // Apply white color with 60% opacity for sent audio
                bar.style.setProperty('background-color', 'rgba(249, 249, 249, 0.6)', 'important');
            });
            
            startTimeSent = Date.now();
            
            const animate = () => {
                if (!isPlayingSent) {
                    if (animationFrameIdSent) {
                        cancelAnimationFrame(animationFrameIdSent);
                        animationFrameIdSent = null;
                    }
                    return;
                }
                
                const currentElapsed = Date.now() - startTimeSent;
                const totalElapsed = elapsedBeforePauseSent + currentElapsed;
                const progress = Math.min(totalElapsed / totalDurationSent, 1);
                
                // Calculate exact progress position (not rounded) for smooth animation
                const exactPosition = progress * bars.length;
                
                const remainingSeconds = Math.max(0, originalSecondsSent - Math.floor(totalElapsed / 1000));
                durationElementSent.textContent = `0:${remainingSeconds.toString().padStart(2, '0')}`;
            
                // Update visual state of bars with smooth animation - SENT AUDIO (white with opacity)
                bars.forEach((bar, barIndex) => {
                    // Ensure all have 'playing' when playing
                    bar.classList.add('playing');
                    
                    // Calculate if bar has completely passed
                    const barProgress = exactPosition - barIndex;
                    
                    if (barProgress >= 1) {
                        // Bar has completely passed - stays white with 90% opacity
                        bar.classList.add('active');
                        bar.style.setProperty('background-color', 'rgba(249, 249, 249, 0.9)', 'important');
                    } else if (barProgress > 0) {
                        // Current bar - gradual transition between 60% and 90% opacity based on progress
                        bar.classList.add('active');
                        // Smooth interpolation between 0.6 and 0.9 opacity based on progress
                        const opacity = 0.6 + (0.9 - 0.6) * barProgress;
                        bar.style.setProperty('background-color', `rgba(249, 249, 249, ${opacity})`, 'important');
                    } else {
                        // Bar hasn't arrived yet - stays white with 60% opacity
                        bar.classList.remove('active');
                        bar.style.setProperty('background-color', 'rgba(249, 249, 249, 0.6)', 'important');
                    }
                });
                
                if (progress < 1 && isPlayingSent) {
                    animationFrameIdSent = requestAnimationFrame(animate);
                } else if (progress >= 1) {
                    icon.classList.remove('fa-pause');
                    icon.classList.add('fa-play');
                    playBtnSent.classList.add('listened');
                    isPlayingSent = false;
                    
                    bars.forEach(bar => {
                        bar.classList.remove('playing');
                        bar.classList.remove('active');
                        // Remove inline style to return to default state (white)
                        bar.style.removeProperty('background-color');
                        bar.style.removeProperty('opacity');
                    });
                    durationElementSent.textContent = originalDurationTextSent;
                    elapsedBeforePauseSent = 0;
                    startTimeSent = null;
                }
            };
            
            animationFrameIdSent = requestAnimationFrame(animate);
            
        } else {
            if (!isPlayingSent) return; // Already paused, ignore
            
            icon.classList.remove('fa-pause');
            icon.classList.add('fa-play');
            isPlayingSent = false;
            
            if (animationFrameIdSent) {
                cancelAnimationFrame(animationFrameIdSent);
                animationFrameIdSent = null;
            }
            
            // Salvar progresso atual
            if (startTimeSent) {
                elapsedBeforePauseSent += Date.now() - startTimeSent;
                startTimeSent = null;
            }
        }
    });
    
    addMessageListeners(messageDivSent);
    scrollToBottom();
}

// Options menu (photo, location, post)
if (photoBtn) {
photoBtn.addEventListener('click', function() {
    const options = ['foto', 'localização', 'post'];
    const random = options[Math.floor(Math.random() * options.length)];
    
    if (random === 'foto') {
        const photos = [
            '../../imagens/fotoblur1.jpg',
            'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400',
            'https://images.unsplash.com/photo-1511367461989-f85a21fda167?w=400',
            'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=400'
        ];
        const randomPhoto = photos[Math.floor(Math.random() * photos.length)];
        sendPhotoMessage(randomPhoto);
    } else if (random === 'localização') {
        sendLocationMessage();
    } else {
        sendForwardedPost();
    }
});
}

// Sticker button to send post or location
if (stickerBtn) {
stickerBtn.addEventListener('click', function() {
    const options = ['post', 'localização'];
    const random = options[Math.floor(Math.random() * options.length)];
    
    if (random === 'post') {
        sendForwardedPost();
    } else {
        sendLocationMessage();
    }
});
}

// Enviar nudes
function sendPhotoMessage(photoUrl) {
    const now = new Date();
    const time = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
    
    // ONLY sent nudes - NO duplication
    const messageDivSent = document.createElement('div');
    messageDivSent.className = 'message sent';
    messageDivSent.innerHTML = `
        <div class="message-bubble">
            <div class="message-photo">
                <img src="${photoUrl}" alt="Nudes">
                <div class="video-sensitive-overlay">
                    <div class="video-sensitive-content">
                        <div class="video-sensitive-icon">
                            <i class="fas fa-eye-slash"></i>
                        </div>
                    </div>
                </div>
            </div>
            <div class="message-time">${time}</div>
        </div>
    `;
    chatMessages.appendChild(messageDivSent);
    addMessageListeners(messageDivSent);
    
    // Update gradient (nudes don't have .message-content, so not needed)
    
    scrollToBottom();
}

// Send location
function sendLocationMessage() {
    const now = new Date();
    const time = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
    
    const locations = [
        { name: 'Avenida Paulista', address: 'São Paulo, SP', coords: '-46.6333,-23.5505' },
        { name: 'Cristo Redentor', address: 'Rio de Janeiro, RJ', coords: '-43.2105,-22.9519' },
        { name: 'Parque Ibirapuera', address: 'São Paulo, SP', coords: '-46.6575,-23.5873' },
        { name: 'Copacabana', address: 'Rio de Janeiro, RJ', coords: '-43.1729,-22.9711' },
    ];
    
    const randomLocation = locations[Math.floor(Math.random() * locations.length)];
    
    // ONLY sent location - NO duplication
    const messageDivSent = document.createElement('div');
    messageDivSent.className = 'message sent';
    messageDivSent.innerHTML = `
        <div class="message-bubble">
            <div class="message-location">
                <div class="location-map">
                    <img src="../../imagens/fundomaps.png" alt="Mapa">
                    <div class="location-profile">
                        <img src="https://i.pravatar.cc/150?img=1" alt="Profile" class="location-profile-img">
                    </div>
                </div>
                <div class="location-info">
                    <div class="location-name">${randomLocation.name}</div>
                    <div class="location-address">${randomLocation.address}</div>
                </div>
            </div>
            <div class="message-time">${time}</div>
        </div>
    `;
    chatMessages.appendChild(messageDivSent);
    addMessageListeners(messageDivSent);
    
    // Update gradient (location doesn't have .message-content, so not needed)
    
    scrollToBottom();
}

// Send forwarded post
function sendForwardedPost() {
    const now = new Date();
    const time = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
    
    const posts = [
        { username: 'maria_photos', image: 'https://images.unsplash.com/photo-1682687220742-aba13b6e50ba?w=400', caption: 'Pôr do sol incrível hoje! 🌅', avatar: 'https://i.pravatar.cc/150?img=5' },
        { username: 'joao_viagens', image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400', caption: 'Natureza perfeita! 🌲', avatar: 'https://i.pravatar.cc/150?img=6' },
        { username: 'ana_foodie', image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400', caption: 'Pizza deliciosa! 🍕', avatar: 'https://i.pravatar.cc/150?img=7' },
        { username: 'pedro_tech', image: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=400', caption: 'Codando muito hoje! 💻', avatar: 'https://i.pravatar.cc/150?img=8' },
    ];
    
    const randomPost = posts[Math.floor(Math.random() * posts.length)];
    
    // ONLY sent post - NO duplication
    const messageDivSent = document.createElement('div');
    messageDivSent.className = 'message sent';
    messageDivSent.innerHTML = `
        <div class="message-bubble">
            <div class="post-encaminhado-enviado">
                <div class="post-encaminhado-header">
                    <img src="${randomPost.avatar}" alt="User" class="post-encaminhado-avatar">
                    <span class="post-encaminhado-username">${randomPost.username}</span>
                </div>
                <img src="${randomPost.image}" alt="Post" class="post-encaminhado-image">
                <div class="post-encaminhado-caption">
                    <span class="post-encaminhado-username-caption">${randomPost.username}</span>
                    <span class="post-encaminhado-text">${randomPost.caption}</span>
                </div>
            </div>
            <div class="message-time">${time}</div>
        </div>
    `;
    chatMessages.appendChild(messageDivSent);
    addMessageListeners(messageDivSent);
    scrollToBottom();
}

// Quick like
if (likeBtn) {
likeBtn.addEventListener('click', function() {
    const now = new Date();
    const time = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
    
    // ONLY sent like - NO duplication
    const messageDivSent = document.createElement('div');
    messageDivSent.className = 'message sent';
    messageDivSent.innerHTML = `
        <div class="message-bubble">
            <div class="message-content" style="font-size: 48px; padding: 8px;">❤️</div>
            <div class="message-time">${time}</div>
        </div>
    `;
    chatMessages.appendChild(messageDivSent);
    addMessageListeners(messageDivSent);
    
    // Update gradient (post doesn't have .message-content, so not needed)
    
    scrollToBottom();
});
}

// Adicionar event listeners em mensagens existentes
document.querySelectorAll('.message').forEach(msg => {
    addMessageListeners(msg);
    // Atualizar gradiente das mensagens enviadas existentes
    if (msg.classList.contains('sent')) {
        updateMessageGradient(msg);
    }
});

// Play received and sent audio
document.querySelectorAll('.audio-recebido-play-btn').forEach((btn, index) => {
    // Check if audio has already been listened to (persistence)
    const audioContainer = btn.closest('.audio-recebido');
    const messageElement = btn.closest('.message');
    const isSent = messageElement && messageElement.classList.contains('sent');
    
    const chatId = getChatId();
    const audioId = `${chatId}_audio-${index}-${audioContainer.querySelector('.audio-recebido-duration')?.textContent || '0:00'}`;
    
    if (localStorage.getItem(audioId) === 'listened') {
        btn.classList.add('listened');
    }
    
    // Save original audio time (NEVER changes)
    const durationElement = audioContainer.querySelector('.audio-recebido-duration');
    const originalDurationText = durationElement.textContent;
    const originalSeconds = parseInt(originalDurationText.split(':')[1]);
    const totalDuration = originalSeconds * 1000;
    
    let animationFrameId = null;
    let isPlaying = false;
    let startTime = null;
    let elapsedBeforePause = 0;
    
    btn.addEventListener('click', function() {
        const icon = this.querySelector('i');
        const waveformContainer = audioContainer.querySelector('.audio-recebido-waveform');
        const bars = waveformContainer.querySelectorAll('.audio-recebido-waveform-bar');
        
        const currentAudioId = audioId;
        
        if (icon.classList.contains('fa-play')) {
            if (isPlaying) return; // Already playing, ignore
            
            // Pause all other audios (simulates click on pause)
            document.querySelectorAll('.audio-recebido-play-btn').forEach(otherBtn => {
                if (otherBtn !== btn) {
                    const otherIcon = otherBtn.querySelector('i');
                    if (otherIcon && otherIcon.classList.contains('fa-pause')) {
                        otherBtn.click();
                    }
                }
            });
            
            // Mostrar popup VIP
            showAudioVIPPopup();
            
            icon.classList.remove('fa-play');
            icon.classList.add('fa-pause');
            isPlaying = true;
            
            // Initialize bars - different for sent and received
            if (isSent) {
                // SENT AUDIO - white with 60% opacity
                bars.forEach(bar => {
                    bar.classList.remove('active');
                    bar.classList.add('playing');
                    bar.style.removeProperty('background-color');
                    bar.style.removeProperty('opacity');
                    bar.style.setProperty('background-color', 'rgba(249, 249, 249, 0.6)', 'important');
                });
            } else {
                // RECEIVED AUDIO - gray
                bars.forEach(bar => {
                    bar.classList.remove('active');
                    bar.classList.add('playing');
                    bar.style.removeProperty('background-color');
                    bar.style.removeProperty('opacity');
                    bar.style.setProperty('background-color', 'rgb(103, 103, 103)', 'important');
                    bar.style.setProperty('opacity', '1', 'important');
                });
            }
            
            startTime = Date.now();
            
            const animate = () => {
                if (!isPlaying) {
                    if (animationFrameId) {
                        cancelAnimationFrame(animationFrameId);
                        animationFrameId = null;
                    }
                    return;
                }
                
                const currentElapsed = Date.now() - startTime;
                const totalElapsed = elapsedBeforePause + currentElapsed;
                const progress = Math.min(totalElapsed / totalDuration, 1);
                
                // Calculate exact progress position (not rounded) for smooth animation
                const exactPosition = progress * bars.length;
                
                const remainingSeconds = Math.max(0, originalSeconds - Math.floor(totalElapsed / 1000));
                durationElement.textContent = `0:${remainingSeconds.toString().padStart(2, '0')}`;
            
                // Update visual state of bars with smooth animation
                bars.forEach((bar, barIndex) => {
                    // Ensure all have 'playing' when playing
                    bar.classList.add('playing');
                    
                    // Calculate if bar has completely passed
                    const barProgress = exactPosition - barIndex;
                    
                    if (isSent) {
                        // SENT AUDIO - transition between 60% and 90% opacity
                        if (barProgress >= 1) {
                            // Bar has completely passed - stays white with 90% opacity
                            bar.classList.add('active');
                            bar.style.setProperty('background-color', 'rgba(249, 249, 249, 0.9)', 'important');
                        } else if (barProgress > 0) {
                            // Current bar - gradual transition between 60% and 90% opacity
                            bar.classList.add('active');
                            const opacity = 0.6 + (0.9 - 0.6) * barProgress;
                            bar.style.setProperty('background-color', `rgba(249, 249, 249, ${opacity})`, 'important');
                        } else {
                            // Bar hasn't arrived yet - stays white with 60% opacity
                            bar.classList.remove('active');
                            bar.style.setProperty('background-color', 'rgba(249, 249, 249, 0.6)', 'important');
                        }
                    } else {
                        // RECEIVED AUDIO - transition between gray and white
                        if (barProgress >= 1) {
                            // Bar has completely passed - stays white
                            bar.classList.add('active');
                            bar.style.setProperty('background-color', '#F9F9F9', 'important');
                            bar.style.setProperty('opacity', '1', 'important');
                        } else if (barProgress > 0) {
                            // Current bar - gradual transition based on progress within it
                            bar.classList.add('active');
                            // Smooth interpolation between gray and white based on progress
                            const opacity = barProgress;
                            const grayValue = 103;
                            const whiteValue = 249;
                            const r = Math.round(grayValue + (whiteValue - grayValue) * opacity);
                            const g = Math.round(grayValue + (whiteValue - grayValue) * opacity);
                            const b = Math.round(grayValue + (whiteValue - grayValue) * opacity);
                            bar.style.setProperty('background-color', `rgb(${r}, ${g}, ${b})`, 'important');
                            bar.style.setProperty('opacity', '1', 'important');
                        } else {
                            // Bar hasn't arrived yet - stays gray
                            bar.classList.remove('active');
                            bar.style.setProperty('background-color', 'rgb(103, 103, 103)', 'important');
                            bar.style.setProperty('opacity', '1', 'important');
                        }
                    }
                });
                
                if (progress < 1 && isPlaying) {
                    animationFrameId = requestAnimationFrame(animate);
                } else if (progress >= 1) {
                icon.classList.remove('fa-pause');
                icon.classList.add('fa-play');
                    btn.classList.add('listened');
                    isPlaying = false;
                    localStorage.setItem(currentAudioId, 'listened');
                    
                bars.forEach(bar => {
                    bar.classList.remove('playing');
                    bar.classList.remove('active');
                    // Remove inline style to return to default state
                    bar.style.removeProperty('background-color');
                    bar.style.removeProperty('opacity');
                });
                    durationElement.textContent = originalDurationText;
                    elapsedBeforePause = 0;
                    startTime = null;
                }
            };
            
            animationFrameId = requestAnimationFrame(animate);
            
        } else {
            if (!isPlaying) return; // Already paused, ignore
            
            icon.classList.remove('fa-pause');
            icon.classList.add('fa-play');
            isPlaying = false;
            
            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId);
                animationFrameId = null;
            }
            
            if (startTime) {
                const currentElapsed = Date.now() - startTime;
                elapsedBeforePause += currentElapsed;
                startTime = null;
            }
        }
    });
});

// Sensitive content modal - fullscreen
const videoFullscreenModal = document.getElementById('videoFullscreenModal');
const videoFullscreenBtn = document.getElementById('videoFullscreenBtn');
const videoFullscreenBack = document.getElementById('videoFullscreenBack');
const videoFullscreenContent = document.getElementById('videoFullscreenContent');
const videoFullscreenContentPurchase = document.getElementById('videoFullscreenContentPurchase');
const videoFullscreenFooter = document.querySelector('.video-fullscreen-footer');
let currentClickedVideo = null;
let currentImageId = null;
let hasTriedToView = false;

// Function to check if image has already been viewed
function hasViewedImage(imageId) {
    const viewedImages = JSON.parse(localStorage.getItem('viewedChatImages') || '[]');
    return viewedImages.includes(imageId);
}

// Function to mark image as viewed
function markImageAsViewed(imageId) {
    const viewedImages = JSON.parse(localStorage.getItem('viewedChatImages') || '[]');
    if (!viewedImages.includes(imageId)) {
        viewedImages.push(imageId);
        localStorage.setItem('viewedChatImages', JSON.stringify(viewedImages));
    }
}

// Open modal when clicking on blurred video (image or pack) or overlay
document.addEventListener('click', function(e) {
    // Detect click on overlay or image
    const overlay = e.target.closest('.video-sensitive-overlay') || e.target.closest('.pack-sensitive-overlay');
    const videoContainer = e.target.closest('.message-video') || e.target.closest('.message-video-pack');
    
    // If clicked on overlay, get parent container and specific image
    let container = null;
    let blurredImg = null;
    
    if (overlay) {
        // If clicked on overlay, get pack-item or message-video that contains this overlay
        const packItem = overlay.closest('.pack-item');
        if (packItem) {
            // It's a pack - get specific image of this pack-item
            blurredImg = packItem.querySelector('.pack-blurred');
            container = packItem.closest('.message-video-pack');
        } else {
            // It's a normal image
            container = overlay.closest('.message-video');
            blurredImg = container ? container.querySelector('.video-blurred') : null;
        }
    } else if (videoContainer) {
        // Clicked directly on image or container
        container = videoContainer;
        blurredImg = container.querySelector('.video-blurred') || container.querySelector('.pack-blurred');
    }
    
    if (container && blurredImg) {
        e.preventDefault();
        e.stopPropagation();
        
        const videoImg = blurredImg;
        
        // Generate unique image ID based on src
        currentImageId = videoImg.src ? btoa(videoImg.src).substring(0, 50) : null;
        const alreadyViewed = currentImageId && hasViewedImage(currentImageId);
        
        // If image has already been viewed, show blocked action popup
        if (alreadyViewed) {
            showBlockedPopup("Become a VIP member of Stalkea.ai<br>to review chat images");
            return;
        }
        
        // If it's the first time, open modal normally
        currentClickedVideo = container;
        hasTriedToView = false;
        
        if (videoImg) {
            // Create background image with blur in modal
            const modalBg = videoFullscreenModal.querySelector('.video-fullscreen-bg');
            if (!modalBg) {
                const bgImg = document.createElement('img');
                bgImg.src = videoImg.src;
                bgImg.className = 'video-fullscreen-bg';
                videoFullscreenModal.insertBefore(bgImg, videoFullscreenModal.firstChild);
            } else {
                modalBg.src = videoImg.src;
                modalBg.classList.remove('revealing');
                modalBg.classList.remove('revealing-back');
                // Remove inline styles to allow CSS to work
                modalBg.style.filter = '';
                modalBg.style.transform = '';
            }
        }
        
        // First time viewing - show initial content
        if (videoFullscreenContent) {
            videoFullscreenContent.classList.remove('hidden');
            videoFullscreenContent.classList.add('visible');
            videoFullscreenContent.style.display = 'flex';
        }
        if (videoFullscreenContentPurchase) {
            videoFullscreenContentPurchase.classList.add('u-hidden');
            videoFullscreenContentPurchase.style.display = 'none';
        }
        if (videoFullscreenBtn) {
            videoFullscreenBtn.textContent = 'View image';
        }
        
        if (videoFullscreenFooter) {
            videoFullscreenFooter.style.display = 'flex';
        }
        if (videoFullscreenBack) {
            videoFullscreenBack.style.display = 'flex';
        }
        videoFullscreenModal.classList.add('active');
    }
});

// Function to close modal
function closeVideoFullscreenModal() {
    videoFullscreenModal.classList.remove('active');
    videoFullscreenModal.classList.remove('revealing');
    videoFullscreenModal.classList.remove('revealing-back');
    // Reset states
    if (videoFullscreenContent) {
        videoFullscreenContent.classList.add('hidden');
        videoFullscreenContent.classList.remove('visible');
    }
    if (videoFullscreenContentPurchase) {
        videoFullscreenContentPurchase.style.display = 'none';
        videoFullscreenContentPurchase.classList.remove('visible');
        
        // Restore default text
        const subtextElement = videoFullscreenContentPurchase.querySelector('.video-fullscreen-subtext');
        if (subtextElement) {
            subtextElement.textContent = 'To unlock censored photos and videos, you must be a VIP member';
        }
    }
    // NEVER remove blur - image must always remain censored
    if (currentClickedVideo) {
        // Do nothing - keep blur and overlay (both video-blurred and pack-blurred)
    }
    currentClickedVideo = null;
    currentImageId = null;
    hasTriedToView = false;
}

// Close modal when clicking back button
if (videoFullscreenBack) {
    videoFullscreenBack.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        closeVideoFullscreenModal();
    });
}

// Click on "View image" / "Purchase" button
if (videoFullscreenBtn) {
    videoFullscreenBtn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        if (!hasTriedToView) {
            // First time: reveal animation
            hasTriedToView = true;
            const modalBg = videoFullscreenModal.querySelector('.video-fullscreen-bg');
            
            // Hide initial content, footer and arrow
            if (videoFullscreenContent) {
                videoFullscreenContent.classList.add('hidden');
                videoFullscreenContent.classList.remove('visible');
                videoFullscreenContent.style.display = 'none';
            }
            if (videoFullscreenFooter) {
                videoFullscreenFooter.style.display = 'none';
            }
            if (videoFullscreenBack) {
                videoFullscreenBack.style.display = 'none';
            }
            
            // Add shaking animation ALONG with reveal
            if (modalBg) {
                modalBg.classList.add('shaking');
                modalBg.classList.remove('revealing-back');
                modalBg.classList.add('revealing');
            }
            
            // Add class to modal to animate overlay
            videoFullscreenModal.classList.add('revealing');
            
            // Remove shaking class after 600ms (when shaking ends)
            setTimeout(() => {
                if (modalBg) {
                    modalBg.classList.remove('shaking');
                }
            }, 600);
            
            // After complete reveal (3000ms), "block" image again
            setTimeout(() => {
                if (modalBg) {
                    modalBg.classList.remove('revealing');
                    modalBg.classList.add('revealing-back');
                }
                
                // Add class to modal to return overlay
                videoFullscreenModal.classList.remove('revealing');
                videoFullscreenModal.classList.add('revealing-back');
                
                // Ensure initial content is hidden
                if (videoFullscreenContent) {
                    videoFullscreenContent.style.display = 'none';
                }
                
                // Mark image as viewed after reveal
                if (currentImageId) {
                    markImageAsViewed(currentImageId);
                }
                
                // Show purchase content after blocking animation (wait for end of tieDyeHide animation which lasts 0.5s)
                setTimeout(() => {
                    if (videoFullscreenContentPurchase) {
                        // Remove u-hidden class first (has !important)
                        videoFullscreenContentPurchase.classList.remove('u-hidden');
                        // Force display flex with !important to override u-hidden
                        videoFullscreenContentPurchase.style.setProperty('display', 'flex', 'important');
                        videoFullscreenContentPurchase.style.opacity = '0';
                        videoFullscreenContentPurchase.style.visibility = 'visible';
                        
                        // Animate fade in
                        setTimeout(() => {
                            videoFullscreenContentPurchase.classList.add('visible');
                            // Ensure it's visible after adding visible class
                            videoFullscreenContentPurchase.style.setProperty('display', 'flex', 'important');
                            videoFullscreenContentPurchase.style.opacity = '1';
                            videoFullscreenContentPurchase.style.visibility = 'visible';
                        }, 50);
                    }
                    if (videoFullscreenBtn) {
                        videoFullscreenBtn.textContent = 'Become VIP';
                    }
                    // Show footer and arrow again
                    if (videoFullscreenFooter) {
                        videoFullscreenFooter.style.display = 'flex';
                    }
                    if (videoFullscreenBack) {
                        videoFullscreenBack.style.display = 'flex';
                    }
                    
                    // Remove revealing-back class from modal
                    videoFullscreenModal.classList.remove('revealing-back');
                }, 600); // Wait a bit longer than animation duration (0.5s + 100ms margin)
            }, 3000); // Reveal with simultaneous shaking
        } else {
            // Second time: purchase action - redirect to CTA
            window.location.href = './cta.html';
        }
    });
}

// Close modal when clicking outside
videoFullscreenModal.addEventListener('click', function(e) {
    if (e.target === videoFullscreenModal) {
        videoFullscreenModal.classList.remove('active');
    }
});

// ============= STORY FULLSCREEN MODAL =============
const storyFullscreenModal = document.getElementById('storyFullscreenModal');
const storyFullscreenImage = document.getElementById('storyFullscreenImage');

function openStoryFullscreen(storyImageSrc, sourceElement) {
    // Capture position and size of original image in chat
    const sourceRect = sourceElement.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    // Calculate scale needed to fill 100% of screen
    const scaleX = viewportWidth / sourceRect.width;
    const scaleY = viewportHeight / sourceRect.height;
    const finalScale = Math.max(scaleX, scaleY); // Use Math.max to fill entire screen
    
    // Calculate initial position (center of original image)
    const initialCenterX = sourceRect.left + sourceRect.width / 2;
    const initialCenterY = sourceRect.top + sourceRect.height / 2;
    
    // Calculate final position (center of screen)
    const finalCenterX = viewportWidth / 2;
    const finalCenterY = viewportHeight / 2;
    
    // Calculate necessary displacement (from initial center to final center)
    const translateX = finalCenterX - initialCenterX;
    const translateY = finalCenterY - initialCenterY;
    
    // Set initial state - position image centered on screen with original size
    storyFullscreenImage.src = storyImageSrc;
    storyFullscreenImage.style.width = sourceRect.width + 'px';
    storyFullscreenImage.style.height = sourceRect.height + 'px';
    storyFullscreenImage.style.top = (finalCenterY - sourceRect.height / 2) + 'px';
    storyFullscreenImage.style.left = (finalCenterX - sourceRect.width / 2) + 'px';
    storyFullscreenImage.style.transform = 'scale(1)';
    storyFullscreenImage.style.transformOrigin = 'center center';
    
    // Show modal
    storyFullscreenModal.classList.add('active');
    
    // Force reflow to ensure initial state is applied
    void storyFullscreenImage.offsetWidth;
    
    // Animate to final state - expand until filling 100% of screen
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            storyFullscreenImage.style.width = viewportWidth + 'px';
            storyFullscreenImage.style.height = viewportHeight + 'px';
            storyFullscreenImage.style.top = '0px';
            storyFullscreenImage.style.left = '0px';
            storyFullscreenImage.style.transform = 'scale(1)';
        });
    });
    
    // After animation completes (300ms) + 0.2s pause, close automatically
    setTimeout(() => {
        closeStoryFullscreen();
    }, 500); // 300ms animation + 200ms pause = 500ms total
}

function closeStoryFullscreen() {
    storyFullscreenModal.classList.remove('active');
    // Reset styles after transition
    setTimeout(() => {
        storyFullscreenImage.style.width = '';
        storyFullscreenImage.style.height = '';
        storyFullscreenImage.style.top = '';
        storyFullscreenImage.style.left = '';
        storyFullscreenImage.style.transform = '';
        storyFullscreenImage.src = '';
    }, 200);
    
    // Show "Action blocked" popup
    showBlockedPopup();
}

function showAudioVIPPopup() {
    const popup = document.getElementById('audio-vip-popup');
    if (popup) {
        // Remove show class if already visible to restart animation
        popup.classList.remove('show');
        // Force reflow
        void popup.offsetWidth;
        // Add show class
        popup.classList.add('show');
        // Remove after 3 seconds
        setTimeout(() => {
            popup.classList.remove('show');
        }, 3000);
        }
}

// Default messages by context for blocked popup
const blockedMessages = {
    default: "Become a VIP member of Stalkea.ai<br>to interact in conversations",
    input: "Become a VIP member of Stalkea.ai<br>to send media and files",
    location: "Become a VIP member of Stalkea.ai<br>to view locations",
    call: "Become a VIP member of Stalkea.ai<br>to make calls",
    profile: "Become a VIP member of Stalkea.ai<br>to view profiles",
    reply: "Become a VIP member of Stalkea.ai<br>to reply to messages",
    cancel: "Become a VIP member of Stalkea.ai<br>to cancel sends"
};

function showBlockedPopup(customMessage) {
    const popup = document.getElementById('blocked-popup');
    const overlay = document.getElementById('blocked-popup-overlay');
    
    const message = customMessage || blockedMessages.default;
    
    if (popup && overlay) {
        // Criar conteúdo do pop-up estilo iOS glassmorphism
        popup.innerHTML = `
            <h3 style="font-size: 16px; font-weight: 600; margin: 0 0 10px 0; letter-spacing: -0.1px; opacity: 0.95;">
                ⚠︎ Action blocked
            </h3>
            <p style="font-size: 13px; opacity: 0.85; margin: 0 0 20px 0; line-height: 1.4; font-weight: 400;">
                ${message}
            </p>
            <button onclick="window.location.href='./cta.html'" style="background: rgba(249, 249, 249, 0.3); color: #F9F9F9; padding: 10px 20px; border-radius: 10px; font-weight: 500; font-size: 13px; border: 1px solid rgba(249, 249, 249, 0.3); cursor: pointer; width: 100%; transition: all 0.2s; backdrop-filter: blur(10px);" onmouseover="this.style.background='rgba(249, 249, 249, 0.4)'; this.style.borderColor='rgba(249, 249, 249, 0.4)'" onmouseout="this.style.background='rgba(249, 249, 249, 0.3)'; this.style.borderColor='rgba(249, 249, 249, 0.3)'">
                Get VIP Access
            </button>
        `;
        
        popup.classList.add('show');
        overlay.classList.add('show');
        
        // Close when clicking on overlay
        overlay.onclick = function() {
            popup.classList.remove('show');
            overlay.classList.remove('show');
        };
        
        // Close after 5 seconds
        setTimeout(() => {
            popup.classList.remove('show');
            overlay.classList.remove('show');
        }, 5000);
    }
}

// Detect click on forwarded story
document.addEventListener('click', function(e) {
    const storyContainer = e.target.closest('.story-encaminhado-recebido');
    if (storyContainer) {
        const storyImg = storyContainer.querySelector('.story-encaminhado-image');
        if (storyImg && storyImg.src) {
            e.preventDefault();
            e.stopPropagation();
            openStoryFullscreen(storyImg.src, storyImg);
        }
    }
});

// Close when clicking outside image
storyFullscreenModal.addEventListener('click', function(e) {
    if (e.target === storyFullscreenModal) {
        closeStoryFullscreen();
    }
});

// ============= CLIQUE NO CORAÇÃO =============
document.addEventListener('click', function(e) {
    // Check if clicked on heart icon
    const heartIcon = e.target.closest('svg[aria-label="Like"]') || e.target.closest('svg[aria-label="Curtir"]');
    if (heartIcon) {
        e.preventDefault();
        e.stopPropagation();
        sendHeartMessage();
        return;
    }
});

// ============= REACTION CLICK (OLD REACTION) =============
// When clicking on a reaction that already exists in the message
document.addEventListener('click', function(e) {
    const reaction = e.target.closest('.message-reaction');
    if (reaction && !reaction.classList.contains('hidden')) {
        e.preventDefault();
        e.stopPropagation();
        
        // Hide the reaction
        reaction.classList.add('hidden');
        
        // Adjust message spacing (will be adjusted automatically by CSS :has())
        const message = reaction.closest('.message');
        if (message) {
            // Force reflow to apply new margin-bottom
            void message.offsetHeight;
        }
        
        // After 0.6s, show reaction again with animation
        setTimeout(() => {
            reaction.classList.remove('hidden');
            reaction.classList.add('returning');
            
            // Remove animation class after animation completes
            setTimeout(() => {
                reaction.classList.remove('returning');
            }, 300);
        }, 600);
        
        // After 0.8s total (0.6s + 0.2s), show popup
        setTimeout(() => {
            showBlockedPopup();
        }, 800);
    }
});


// Restore sent messages from localStorage when loading the page
function restoreSentMessages() {
    const chatId = getChatId();
    const storageKey = `${chatId}_sentMessages`;
    const sentMessages = JSON.parse(localStorage.getItem(storageKey) || '[]');
    const lastMessageId = sentMessages.length > 0 ? sentMessages[sentMessages.length - 1].id : null;
    
    sentMessages.forEach((msgData, index) => {
        // Check if message already exists in DOM
        const existingMessage = document.querySelector(`[data-message-id="${msgData.id}"]`);
        if (existingMessage) return;
        
        const messageDivSent = document.createElement('div');
        messageDivSent.className = msgData.isHeart ? 'message sent message-heart' : 'message sent new-message';
        messageDivSent.setAttribute('data-message-id', msgData.id);
        
        if (msgData.isHeart) {
            // Heart message
            messageDivSent.innerHTML = `
                <div class="message-bubble">
                    <div class="message-content-heart">❤️</div>
                    <div class="message-time">${msgData.time}</div>
                </div>
            `;
        } else {
            // Normal text message
            const processedText = applyBlurToText(escapeHtml(msgData.text));
            messageDivSent.innerHTML = `
                <div class="message-bubble">
                    <div class="message-content">${processedText}</div>
                    <div class="message-time">${msgData.time}</div>
                </div>
            `;
        }
        
        chatMessages.appendChild(messageDivSent);
        addMessageListeners(messageDivSent);
        
        // Apply rounded corners after restoring messages
        applyMessageRoundedCorners();
        
        // Update gradient of restored message
        setTimeout(() => {
            updateMessageGradient(messageDivSent);
        }, 50);
        
        // Add VIP error only to last message
        if (msgData.id === lastMessageId) {
            const errorDiv = document.createElement('div');
            errorDiv.className = 'message-vip-error';
            errorDiv.innerHTML = '<span>Message not sent. <span class="saiba-mais">Learn more</span></span>';
            
            // Add event listener for "Learn more"
            const saibaMais = errorDiv.querySelector('.saiba-mais');
            if (saibaMais) {
                saibaMais.addEventListener('click', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    showBlockedPopup();
                });
            }
            messageDivSent.insertAdjacentElement('afterend', errorDiv);
        }
    });
    
    if (sentMessages.length > 0) {
        scrollToBottom();
        // Update gradients after restoring all messages
        setTimeout(() => {
            updateAllMessageGradients();
        }, 200);
    }
}

// Update gradients when scrolling (without debounce for real-time update)
chatMessages.addEventListener('scroll', function() {
    updateAllMessageGradients();
});

// Update gradients when resizing window
window.addEventListener('resize', function() {
    updateAllMessageGradients();
});

// Update initial gradients on load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        setTimeout(() => {
            updateAllMessageGradients();
        }, 300);
    });
} else {
    setTimeout(() => {
        updateAllMessageGradients();
    }, 300);
}

// Event listeners para ações bloqueadas (usando event delegation)
document.addEventListener('click', function(e) {
    // Check first if it's the heart (to not block)
    const heartIcon = e.target.closest('svg[aria-label="Like"]') || e.target.closest('svg[aria-label="Curtir"]');
    if (heartIcon && heartIcon.closest('.input-action-icon')) {
        return; // Deixar o event listener do coração tratar
    }
    
    // Ícones do input (exceto coração e enviar)
    const inputIcon = e.target.closest('.input-action-icon:not(.input-send-icon)');
    if (inputIcon) {
        e.preventDefault();
        e.stopPropagation();
        showBlockedPopup(blockedMessages.input);
        return;
    }
    
    // Botões de chamada no header
    if (e.target.closest('.header-icon-btn')) {
        e.preventDefault();
        e.stopPropagation();
        showBlockedPopup(blockedMessages.call);
        return;
    }
    
    // Foto de perfil no header
    if (e.target.closest('.chat-avatar-btn')) {
        e.preventDefault();
        e.stopPropagation();
        showBlockedPopup(blockedMessages.profile);
        return;
    }
    
    // Ícone da câmera no input
    if (e.target.closest('#cameraIcon')) {
        e.preventDefault();
        e.stopPropagation();
        showBlockedPopup(blockedMessages.input);
        return;
    }
    
    // Botões de localização e chamada
    const systemBtn = e.target.closest('.message-system-btn');
    if (systemBtn) {
        e.preventDefault();
        e.stopPropagation();
        // Check if it's "Call back" (call) or "View" (location)
        const btnText = systemBtn.textContent.trim();
        if (btnText.includes('Call back') || btnText.includes('Ligar de volta')) {
            showBlockedPopup(blockedMessages.call);
        } else {
            // It's the "View" location button
            showBlockedPopup(blockedMessages.location);
        }
        return;
    }
});

// Generate unique heights for each received audio (same logic as sent ones)
function randomizeAudioBars() {
    const numBars = 30;
    let audioIndexReceived = 0;
    let audioIndexSent = 0;

    // Find all audio containers
    const audioContainers = document.querySelectorAll('.audio-recebido');
    
    if (audioContainers.length === 0) {
        return; // No audios on the page
    }

    audioContainers.forEach(audioContainer => {
        const waveform = audioContainer.querySelector('.audio-recebido-waveform');
        if (!waveform) {
            return; // No waveform container
        }
        
        // Check if it already has bars
        const existingBars = waveform.querySelectorAll('.audio-recebido-waveform-bar');
        if (existingBars.length === numBars) {
            return; // Already has all bars, don't need to generate again
        }
        
        const isSent = audioContainer.closest('.message.sent') !== null;
        const chatId = getChatId();
        
        // Use different indices for sent and received
        let audioKey;
        if (isSent) {
            audioKey = `${chatId}_audio_sent_${audioIndexSent}`;
            audioIndexSent++;
        } else {
            audioKey = `${chatId}_audio_received_${audioIndexReceived}`;
            audioIndexReceived++;
        }

        // Generate or retrieve unique heights from localStorage
        let heights = JSON.parse(localStorage.getItem(audioKey) || 'null');

        if (!heights || heights.length !== numBars) {
            let currentHeight = Math.floor(Math.random() * 21) + 15;
            heights = [];

            for (let i = 0; i < numBars; i++) {
                const rand = Math.random();
                const variation = rand < 0.5
                    ? Math.floor(Math.random() * 17) - 8
                    : rand < 0.8
                        ? Math.floor(Math.random() * 31) - 15
                        : Math.floor(Math.random() * 41) - 20;

                currentHeight = Math.max(12, Math.min(40, currentHeight + variation));
                heights.push(currentHeight);
            }

            localStorage.setItem(audioKey, JSON.stringify(heights));
        }

        // Clear existing bars if there are fewer than necessary
        if (existingBars.length > 0 && existingBars.length < numBars) {
            existingBars.forEach(bar => bar.remove());
                }

        // Create all necessary bars
            for (let i = 0; i < numBars; i++) {
                const bar = document.createElement('div');
                bar.className = 'audio-recebido-waveform-bar';
            bar.style.cssText = `
                height: ${heights[i]}px;
                width: 3px;
                border-radius: 1.5px;
                min-height: 4px;
                display: block;
            `;
                waveform.appendChild(bar);
        }
    });
}

// ============================================================================
// FUNÇÕES DE LOCALIZAÇÃO (API) - Mesmas do feed.html
// ============================================================================

function normalizeRegion(region) {
    if (!region) return '';
    
    const regionMap = {
        'paraná': 'PR', 'parana': 'PR',
        'são paulo': 'SP', 'sao paulo': 'SP',
        'rio de janeiro': 'RJ',
        'minas gerais': 'MG',
        'rio grande do sul': 'RS',
        'santa catarina': 'SC',
        'bahia': 'BA',
        'goiás': 'GO', 'goias': 'GO',
        'pernambuco': 'PE',
        'ceará': 'CE', 'ceara': 'CE',
        'distrito federal': 'DF',
        'espírito santo': 'ES', 'espirito santo': 'ES',
        'mato grosso': 'MT',
        'mato grosso do sul': 'MS',
        'pará': 'PA', 'para': 'PA',
        'amazonas': 'AM'
    };
    
    const regionLower = region.toLowerCase().trim();
    
    // Se já é sigla (2 letras), retornar como está
    if (region.length === 2 && region.match(/^[A-Z]{2}$/i)) {
        return region.toUpperCase();
    }
    
    // Tentar encontrar no mapa
    for (const [key, sigla] of Object.entries(regionMap)) {
        if (regionLower.includes(key) || key.includes(regionLower)) {
            return sigla;
        }
    }
    
    return region;
}

// Função para obter localização do usuário via IP
async function getUserLocation() {
    // Verificar cache primeiro
    const cachedLocation = localStorage.getItem('userLocation');
    if (cachedLocation) {
        try {
            const location = JSON.parse(cachedLocation);
            if (location && location.city) {
                console.log('✅ Location from cache:', location.city);
                return location;
            }
        } catch (e) {
            console.warn('⚠️ Error reading location cache');
        }
    }
    
    // Usar função do api.js (detectCityByIP retorna { cidade, estado, lat, lon })
    // Converter para formato esperado por esta função { city, region, country, lat, lon }
    const location = await detectCityByIP();
    if (location && location.cidade) {
        const normalizedRegion = normalizeRegion(location.estado || '');
        const result = {
            city: location.cidade,
            region: normalizedRegion,
            country: 'Brasil',
            lat: location.lat,
            lon: location.lon
        };
        // Salvar no formato antigo também para compatibilidade
        localStorage.setItem('userLocation', JSON.stringify(result));
        console.log('✅ Location obtained:', location.cidade);
        return result;
    }
    
    console.error('❌ Could not obtain location');
    return null;
}

// Função para calcular distância entre duas coordenadas (Haversine)
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Raio da Terra em km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

// Função para obter cidades próximas (retorna array de cidades ordenadas por proximidade)
// Usa getNeighborCity do api.js múltiplas vezes para obter várias cidades
async function getNearbyCities(lat, lon, userCity) {
    try {
        const cities = [];
        const excludeCities = [];
        
        // Buscar até 4 cidades vizinhas
        for (let i = 0; i < 4; i++) {
            const neighbor = await getNeighborCity(lat, lon, excludeCities);
            if (neighbor && neighbor.toLowerCase() !== userCity?.toLowerCase()) {
                cities.push(neighbor);
                excludeCities.push(neighbor);
            } else {
                break; // Não há mais cidades disponíveis
            }
        }
        
        return cities;
    } catch (error) {
        console.error('❌ Error searching nearby cities:', error);
    }
    
    return [];
}

// Função para obter cidade vizinha com fallbacks (1ª, 2ª, 3ª, 4ª, ou cidade do IP)
async function getNeighborCityWithFallbacks(lat, lon, userCity) {
    if (!lat || !lon) {
        return userCity || 'casa';
    }
    
    // Buscar cidades próximas
    const nearbyCities = await getNearbyCities(lat, lon, userCity);
    
    // Retornar a primeira cidade disponível, ou a cidade do IP como fallback
    if (nearbyCities.length > 0) {
        return nearbyCities[0]; // 1ª cidade mais próxima
    }
    
    // Se não encontrou nenhuma, usar a cidade do IP
    return userCity || 'casa';
}

// Função para obter dia da semana de ontem (abreviado)
function getPreviousWeekday() {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    
    const weekdays = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB'];
    const dayIndex = yesterday.getDay();
    
    return weekdays[dayIndex] || 'depois';
}

// Função para obter dia da semana de ontem (por extenso)
function getPreviousWeekdayFull() {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    
    const weekdays = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
    const dayIndex = yesterday.getDay();
    
    return weekdays[dayIndex] || 'depois';
}

// Função para aplicar bordas arredondadas dinâmicas baseadas em grupos de mensagens
function applyMessageRoundedCorners() {
    const chatMessages = document.getElementById('chatMessages');
    if (!chatMessages) {
        console.log('⚠️ [BORDERS] chatMessages not found');
        return;
    }
    
    // Primeiro, remover todas as classes de bordas arredondadas existentes
    document.querySelectorAll('.message-content').forEach(content => {
        content.classList.remove('rounded-all', 'rounded-bottom', 'rounded-top', 'rounded-middle');
    });
    
    // Percorrer todos os filhos do chatMessages para detectar grupos consecutivos
    const allChildren = Array.from(chatMessages.children);
    let currentGroup = [];
    let currentType = null;
    
    console.log('🔍 [BORDERS] Processing', allChildren.length, 'elements');
    
    allChildren.forEach((element, index) => {
        // Verificar se é uma mensagem de texto (sent ou received)
        const isTextMessage = element.classList.contains('message') && 
                             (element.classList.contains('sent') || element.classList.contains('received'));
        
        if (!isTextMessage) {
            // Se não é mensagem de texto, finalizar grupo atual e começar novo
            if (currentGroup.length > 0) {
                console.log('📦 [BORDERS] Finalizing group of', currentGroup.length, 'messages (type:', currentType + ')');
                applyRoundedCornersToGroup(currentGroup);
                currentGroup = [];
                currentType = null;
            }
            return; // Pular este elemento
        }
        
        // Verificar se tem message-content (não é heart, photo, etc)
        const hasContent = element.querySelector('.message-content:not(.message-content-heart)');
        if (!hasContent) {
            // Se não tem conteúdo de texto, finalizar grupo atual
            if (currentGroup.length > 0) {
                console.log('📦 [BORDERS] Finalizing group of', currentGroup.length, 'messages (no content)');
                applyRoundedCornersToGroup(currentGroup);
                currentGroup = [];
                currentType = null;
            }
            return;
        }
        
        // Determinar tipo da mensagem
        const isSent = element.classList.contains('sent');
        const isReceived = element.classList.contains('received');
        const msgType = isSent ? 'sent' : (isReceived ? 'received' : null);
        
        // Se mudou o tipo, finalizar grupo anterior e iniciar novo
        if (msgType !== currentType && currentType !== null) {
            if (currentGroup.length > 0) {
                console.log('📦 [BORDERS] Finalizing group of', currentGroup.length, 'messages (type changed)');
                applyRoundedCornersToGroup(currentGroup);
            }
            currentGroup = [element];
            currentType = msgType;
            console.log('🆕 [BORDERS] New group started (type:', msgType + ')');
        } else {
            // Continuar o grupo atual ou iniciar primeiro grupo
            if (currentType === null) {
                currentGroup = [element];
                currentType = msgType;
                console.log('🆕 [BORDERS] First group started (type:', msgType + ')');
            } else {
                currentGroup.push(element);
                console.log('➕ [BORDERS] Adding message to group (total:', currentGroup.length + ')');
            }
        }
    });
    
    // Aplicar classes ao último grupo
    if (currentGroup.length > 0) {
        console.log('📦 [BORDERS] Finalizing last group of', currentGroup.length, 'messages');
        applyRoundedCornersToGroup(currentGroup);
    }
    
    console.log('✅ [BORDERS] Processing completed');
}

// Função para aplicar bordas arredondadas a um grupo de mensagens
function applyRoundedCornersToGroup(group) {
    if (group.length === 0) return;
    
    console.log('🎨 [BORDERS] Applying classes to group of', group.length, 'messages');
    
    group.forEach((msg, index) => {
        const content = msg.querySelector('.message-content:not(.message-content-heart)');
        if (!content) {
            console.log('⚠️ [BORDERS] Message without content found');
            return;
        }
        
        // Remover classes anteriores
        content.classList.remove('rounded-all', 'rounded-bottom', 'rounded-top', 'rounded-middle');
        
        if (group.length === 1) {
            // Mensagem sozinha - todos os cantos arredondados
            content.classList.add('rounded-all');
            console.log('  ✓ Message', index + 1, ': rounded-all');
        } else if (group.length === 2) {
            // 2 mensagens - primeira com canto menor embaixo, segunda com canto menor em cima
            if (index === 0) {
                content.classList.add('rounded-bottom');
                console.log('  ✓ Message', index + 1, ': rounded-bottom');
            } else {
                content.classList.add('rounded-top');
                console.log('  ✓ Message', index + 1, ': rounded-top');
            }
        } else {
            // 3+ mensagens - primeira com canto menor embaixo, última com canto menor em cima, meio com ambos
            if (index === 0) {
                // Primeira mensagem
                content.classList.add('rounded-bottom');
                console.log('  ✓ Message', index + 1, '(first): rounded-bottom');
            } else if (index === group.length - 1) {
                // Última mensagem
                content.classList.add('rounded-top');
                console.log('  ✓ Message', index + 1, '(last): rounded-top');
            } else {
                // Mensagens do meio
                content.classList.add('rounded-middle');
                console.log('  ✓ Message', index + 1, '(middle): rounded-middle');
            }
        }
    });
}

// Função para calcular e formatar datas das mensagens
function calculateMessageDates() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    document.querySelectorAll('.message-date').forEach(dateElement => {
        const text = dateElement.textContent.trim();
        
        // Se contém "dias atrás", calcular dinamicamente
        const diasAtrasMatch = text.match(/(\d+)\s*dias?\s*atrás/i);
        if (diasAtrasMatch) {
            const diasAtras = parseInt(diasAtrasMatch[1]);
            const messageDate = new Date(today);
            messageDate.setDate(today.getDate() - diasAtras);
            
            // Extrair horário se existir
            const horaMatch = text.match(/(\d{1,2}):(\d{2})/);
            const hora = horaMatch ? `${horaMatch[1]}:${horaMatch[2]}` : '';
            
            // Calcular diferença real de dias
            const diffTime = today - messageDate;
            const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
            
            let formattedDate = '';
            if (diffDays === 0) {
                formattedDate = hora || '';
            } else if (diffDays === 1) {
                formattedDate = hora ? `ONTEM, ${hora}` : 'ONTEM';
            } else if (diffDays < 7) {
                const weekdays = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB'];
                const dayIndex = messageDate.getDay();
                formattedDate = hora ? `${weekdays[dayIndex]}, ${hora}` : weekdays[dayIndex];
            } else if (diffDays < 30) {
                const day = messageDate.getDate();
                const months = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];
                const month = months[messageDate.getMonth()];
                formattedDate = hora ? `${day} DE ${month}, ${hora}` : `${day} DE ${month}`;
            } else {
                formattedDate = hora ? `${diffDays} dias atrás, ${hora}` : `${diffDays} dias atrás`;
            }
            
            dateElement.textContent = formattedDate;
        }
        // Se é "ONTEM", calcular se realmente foi ontem
        else if (text === 'ONTEM' || text.startsWith('ONTEM,')) {
            const horaMatch = text.match(/(\d{1,2}):(\d{2})/);
            const hora = horaMatch ? `${horaMatch[1]}:${horaMatch[2]}` : '';
            
            // Verificar se realmente foi ontem (pode ser que o HTML tenha "ONTEM" mas já passou mais tempo)
            // Por enquanto, manter "ONTEM" se estiver no HTML
            if (hora) {
                dateElement.textContent = `ONTEM, ${hora}`;
            } else {
                dateElement.textContent = 'ONTEM';
            }
        }
    });
}

// Função para substituir placeholders de localização nas mensagens
async function replaceLocationPlaceholders() {
    // Verificar se já temos valores salvos no localStorage
    let cityToUse = localStorage.getItem('placeholder_city') || null;
    let ipCity = localStorage.getItem('placeholder_ip_city') || null;
    let yesterdayWeekdayFull = localStorage.getItem('placeholder_weekday_full') || null;
    let yesterdayWeekday = localStorage.getItem('placeholder_weekday') || null;
    
    // Se não tiver salvos, calcular e salvar
    if (!cityToUse || !ipCity) {
        const location = await getUserLocation();
        
        // Cidade do IP (para "aqui.")
        if (!ipCity) {
            ipCity = location && location.city ? location.city : 'aqui';
            localStorage.setItem('placeholder_ip_city', ipCity);
        }
        
        // Cidade vizinha (para "casa.")
        if (!cityToUse) {
            cityToUse = 'casa'; // Fallback final: "casa"
            
            if (location && location.city) {
                // Tentar obter cidade vizinha
                if (location.lat && location.lon) {
                    const nearbyCities = await getNearbyCities(location.lat, location.lon, location.city);
                    // Usar apenas a primeira cidade (não todas)
                    const nearbyCity = Array.isArray(nearbyCities) ? nearbyCities[0] : nearbyCities;
                    if (nearbyCity && nearbyCity !== location.city) {
                        cityToUse = nearbyCity;
                    } else {
                        // Fallback 1: usar a cidade do IP
                        cityToUse = location.city;
                    }
                } else {
                    // Fallback 1: usar a cidade do IP
                    cityToUse = location.city;
                }
            }
            
            // Garantir que cityToUse seja sempre uma string (não array)
            if (Array.isArray(cityToUse)) {
                cityToUse = cityToUse[0] || 'casa';
            }
            
            // Garantir que cityToUse não contenha vírgulas (apenas uma cidade)
            if (typeof cityToUse === 'string' && cityToUse.includes(',')) {
                cityToUse = cityToUse.split(',')[0].trim() || 'casa';
            }
            
            // Salvar no localStorage (apenas uma cidade)
            localStorage.setItem('placeholder_city', cityToUse);
        }
    }
    
    // Se não tiver salvos, calcular e salvar
    if (!yesterdayWeekdayFull || !yesterdayWeekday) {
        yesterdayWeekdayFull = 'depois'; // Fallback fixo
        yesterdayWeekday = 'depois'; // Fallback fixo
        
        try {
            const today = new Date();
            const yesterday = new Date(today);
            yesterday.setDate(today.getDate() - 1);
            
            const weekdaysFull = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
            const weekdays = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB'];
            const yesterdayDayIndex = yesterday.getDay();
            
            if (yesterdayDayIndex >= 0 && yesterdayDayIndex < 7) {
                yesterdayWeekdayFull = weekdaysFull[yesterdayDayIndex] || 'depois';
                yesterdayWeekday = weekdays[yesterdayDayIndex] || 'depois';
            }
        } catch (error) {
            // Se houver erro no cálculo, mantém "depois" como fallback
            console.error('Error calculating weekday:', error);
        }
        
        // Salvar no localStorage
        localStorage.setItem('placeholder_weekday_full', yesterdayWeekdayFull);
        localStorage.setItem('placeholder_weekday', yesterdayWeekday);
    }
    
    // Sempre substituir os placeholders (nunca deixar aparecer)
    // Substituir tanto em .message-content quanto em .message-content-line (caso já tenha sido dividido)
    const allElements = document.querySelectorAll('.message-content, .message-content-line');
    allElements.forEach(element => {
        const text = element.textContent || element.innerText || '';
        let html = element.innerHTML || '';
        
        if (text.includes('casa.')) {
            // Garantir que cityToUse seja uma string (não array)
            let cityString = Array.isArray(cityToUse) ? cityToUse[0] : cityToUse;
            html = html.replace(/casa\./g, cityString);
        }
        
        // Aplicar as mudanças
        if (html !== element.innerHTML) {
            element.innerHTML = html;
        }
        if (text.includes('aqui.')) {
            element.innerHTML = html.replace(/aqui\./g, ipCity);
        }
        if (text.includes('depois de amanhã')) {
            // Se o texto contém "amanhã ou", usar dia por extenso (dia de ontem)
            if (text.includes('amanhã ou')) {
                element.innerHTML = html.replace(/depois de amanhã/g, yesterdayWeekdayFull);
            } else {
                // Caso contrário, usar abreviação
                element.innerHTML = html.replace(/depois de amanhã/g, yesterdayWeekday);
            }
        }
    });
}

// Função para marcar mensagens como processadas e ajustar largura quando há múltiplas linhas
function wrapTextLinesInDivs() {
    document.querySelectorAll('.message-content:not([data-lines-wrapped="true"])').forEach(element => {
        // Ignorar se já tem divs de linha
        if (element.querySelector('.message-content-line')) {
            element.dataset.linesWrapped = 'true';
            return;
        }
        
        // Verificar se tem múltiplas linhas
        const computedStyle = window.getComputedStyle(element);
        const lineHeight = parseFloat(computedStyle.lineHeight) || 20;
        const elementHeight = element.offsetHeight;
        const paddingTop = parseFloat(computedStyle.paddingTop) || 0;
        const paddingBottom = parseFloat(computedStyle.paddingBottom) || 0;
        const contentHeight = elementHeight - paddingTop - paddingBottom;
        
        // Se tem mais de uma linha, calcular largura baseada nas linhas reais
        if (contentHeight > lineHeight * 1.5) {
            const messageBubble = element.closest('.message-bubble');
            const message = element.closest('.message');
            
            if (messageBubble && message) {
                // Obter largura disponível do container pai
                const messageWidth = message.offsetWidth;
                const paddingLeft = parseFloat(computedStyle.paddingLeft) || 0;
                const paddingRight = parseFloat(computedStyle.paddingRight) || 0;
                
                // Usar Range API para obter largura real das linhas
                const range = document.createRange();
                range.selectNodeContents(element);
                const rects = Array.from(range.getClientRects());
                
                if (rects.length > 1) {
                    // Agrupar retângulos por linha
                    const lineGroups = [];
                    rects.forEach(rect => {
                        const y = Math.round(rect.top);
                        let lineGroup = lineGroups.find(g => Math.abs(g.y - y) < lineHeight / 2);
                        
                        if (!lineGroup) {
                            lineGroup = { y: y, maxRight: 0, minLeft: Infinity };
                            lineGroups.push(lineGroup);
                        }
                        lineGroup.minLeft = Math.min(lineGroup.minLeft, rect.left);
                        lineGroup.maxRight = Math.max(lineGroup.maxRight, rect.right);
                    });
                    
                    // Encontrar a maior largura de linha
                    let maxLineWidth = 0;
                    lineGroups.forEach(group => {
                        const lineWidth = group.maxRight - group.minLeft;
                        maxLineWidth = Math.max(maxLineWidth, lineWidth);
                    });
                    
                    // Usar a maior largura de linha, mas limitada pela largura disponível
                    const availableWidth = messageWidth - paddingLeft - paddingRight;
                    const finalWidth = Math.min(maxLineWidth + paddingLeft + paddingRight, availableWidth);
                    
                    // Aplicar largura calculada
                    if (finalWidth > 0) {
                        element.style.width = finalWidth + 'px';
                    }
                } else {
                    // Se não conseguiu calcular, usar largura disponível
                    const availableWidth = messageWidth;
                    if (availableWidth > 0) {
                        element.style.width = availableWidth + 'px';
                    }
                }
            }
        }
        
        // Marcar como processado
        element.dataset.linesWrapped = 'true';
    });
    
    // Aplicar bordas arredondadas após processar todas as mensagens
    applyMessageRoundedCorners();
}

// Add clickable transcription element
function setupTranscricaoButtons() {
    document.querySelectorAll('.audio-recebido').forEach(audioContainer => {
        // Check if transcription button already exists
        let transcricaoBtn = audioContainer.querySelector('.audio-recebido-transcricao');
        
        if (!transcricaoBtn) {
            // Create transcription element if it doesn't exist
            transcricaoBtn = document.createElement('span');
            transcricaoBtn.className = 'audio-recebido-transcricao';
            transcricaoBtn.textContent = 'View transcription';
            audioContainer.appendChild(transcricaoBtn);
        }
    });
}

// Event delegation for transcription - works for all audios (sent and received)
document.addEventListener('click', function(e) {
    const transcricaoBtn = e.target.closest('.audio-recebido-transcricao');
    if (!transcricaoBtn) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    const text = transcricaoBtn.textContent.trim();
    if (text === 'View transcription' || text === 'Ver transcrição' || text === 'View transcription') {
        transcricaoBtn.textContent = 'Transcribing...';
        
        setTimeout(() => {
            // Create HTML with line break
            transcricaoBtn.innerHTML = 'Could not transcribe the message.<br>Requires VIP access';
            // Remove clickability
            transcricaoBtn.style.cursor = 'default';
            transcricaoBtn.style.pointerEvents = 'none';
        }, 1500);
    }
});

// Executar ao carregar a página
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        // Resetar contador de carregamentos ao recarregar a página
        const chatId = getChatId();
        const loadCountKey = `${chatId}_messagesLoadCount`;
        localStorage.setItem(loadCountKey, '0');
        
        // Gerar alturas aleatórias para áudios estáticos
        randomizeAudioBars();
        
        // Configure transcription buttons
        setupTranscricaoButtons();
        
        // Substituir placeholders de localização (ANTES de dividir em linhas)
        replaceLocationPlaceholders().then(() => {
            // Calcular datas das mensagens
            calculateMessageDates();
            
            // Dividir textos em divs por linha
            setTimeout(() => {
                wrapTextLinesInDivs();
                // Após dividir, substituir placeholders novamente nas linhas (caso tenham sido quebrados)
                replaceLocationPlaceholders();
            }, 100);
        });
        
        restoreSentMessages();
    });
} else {
    // Resetar contador de carregamentos ao recarregar a página
    const chatId = getChatId();
    const loadCountKey = `${chatId}_messagesLoadCount`;
    localStorage.setItem(loadCountKey, '0');
    
    // Gerar alturas aleatórias para áudios estáticos
    randomizeAudioBars();
    
    // Configurar botões de transcrição
    setupTranscricaoButtons();
    
        // Substituir placeholders de localização (ANTES de dividir em linhas)
        replaceLocationPlaceholders().then(() => {
            // Calcular datas das mensagens
            calculateMessageDates();
            
            // Dividir textos em divs por linha
            setTimeout(() => {
                wrapTextLinesInDivs();
                // Após dividir, substituir placeholders novamente nas linhas (caso tenham sido quebrados)
                replaceLocationPlaceholders();
                // Aplicar bordas arredondadas após processar todas as mensagens
                applyMessageRoundedCorners();
            }, 100);
        });
    
    restoreSentMessages();
    
    // Aplicar bordas arredondadas após restaurar mensagens e processar tudo
    setTimeout(() => {
        applyMessageRoundedCorners();
    }, 300);
}

console.log('Instagram Direct Chat loaded! 🎉');
