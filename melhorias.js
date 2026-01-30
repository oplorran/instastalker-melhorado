// ============================================
// MELHORIAS DE CONVERSÃO - JavaScript
// Gamificação, FOMO, Animações Avançadas
// ============================================

(function() {
    'use strict';

    // ====== CONFIGURAÇÕES ======
    const CONFIG = {
        fomo: {
            enabled: true,
            minInterval: 8000,  // 8 segundos mínimo entre pop-ups
            maxInterval: 15000, // 15 segundos máximo
            displayDuration: 5000 // 5 segundos visível
        },
        decrypt: {
            enabled: true,
            duration: 8000, // 8 segundos de animação
            failAt: 87 // Porcentagem onde "falha"
        }
    };

    // ====== DADOS PARA FOMO ======
    const FOMO_DATA = {
        names: [
            'Maria C.', 'João P.', 'Ana S.', 'Pedro M.', 'Carla R.',
            'Lucas F.', 'Juliana B.', 'Rafael T.', 'Fernanda L.', 'Bruno G.',
            'Camila A.', 'Diego N.', 'Larissa O.', 'Thiago V.', 'Amanda K.',
            'Gustavo H.', 'Patricia E.', 'Rodrigo S.', 'Beatriz M.', 'Felipe C.'
        ],
        cities: [
            'São Paulo', 'Rio de Janeiro', 'Belo Horizonte', 'Curitiba', 'Porto Alegre',
            'Salvador', 'Brasília', 'Fortaleza', 'Recife', 'Manaus',
            'Goiânia', 'Campinas', 'Florianópolis', 'Vitória', 'Natal'
        ],
        times: ['agora', 'há 1 min', 'há 2 min', 'há 3 min', 'há 5 min']
    };

    // ====== UTILITÁRIOS ======
    function getRandomItem(array) {
        return array[Math.floor(Math.random() * array.length)];
    }

    function getRandomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    // ====== SISTEMA FOMO (PROVA SOCIAL DINÂMICA) ======
    function initFOMO() {
        if (!CONFIG.fomo.enabled) return;

        // Criar elemento do pop-up
        const fomoHTML = `
            <div class="fomo-popup" id="fomoPopup">
                <button class="fomo-close" onclick="closeFomoPopup()">&times;</button>
                <div class="fomo-avatar">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                </div>
                <div class="fomo-content">
                    <p class="fomo-text" id="fomoText"></p>
                    <p class="fomo-time" id="fomoTime"></p>
                </div>
            </div>
        `;

        // Adicionar ao body
        document.body.insertAdjacentHTML('beforeend', fomoHTML);

        // Iniciar ciclo de pop-ups
        scheduleFomoPopup();
    }

    function scheduleFomoPopup() {
        const delay = getRandomInt(CONFIG.fomo.minInterval, CONFIG.fomo.maxInterval);
        setTimeout(showFomoPopup, delay);
    }

    function showFomoPopup() {
        const popup = document.getElementById('fomoPopup');
        const textEl = document.getElementById('fomoText');
        const timeEl = document.getElementById('fomoTime');

        if (!popup || !textEl || !timeEl) return;

        // Gerar dados aleatórios
        const name = getRandomItem(FOMO_DATA.names);
        const city = getRandomItem(FOMO_DATA.cities);
        const time = getRandomItem(FOMO_DATA.times);

        // Atualizar conteúdo
        textEl.innerHTML = `<strong>${name}</strong> de ${city} acabou de comprar o <strong>Acesso VIP</strong>`;
        timeEl.textContent = time;

        // Mostrar pop-up
        popup.classList.remove('hide');
        popup.classList.add('show');

        // Esconder após duração
        setTimeout(() => {
            popup.classList.remove('show');
            popup.classList.add('hide');
            
            // Agendar próximo pop-up
            scheduleFomoPopup();
        }, CONFIG.fomo.displayDuration);
    }

    window.closeFomoPopup = function() {
        const popup = document.getElementById('fomoPopup');
        if (popup) {
            popup.classList.remove('show');
            popup.classList.add('hide');
        }
    };

    // ====== SISTEMA DE DESCRIPTOGRAFIA ======
    function initDecrypt() {
        if (!CONFIG.decrypt.enabled) return;

        // Criar overlay de descriptografia
        const decryptHTML = `
            <div class="decrypt-overlay" id="decryptOverlay">
                <div class="decrypt-container" id="decryptContainer">
                    <div class="decrypt-icon">
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                        </svg>
                    </div>
                    <h3 class="decrypt-title">Descriptografando Dados</h3>
                    <p class="decrypt-status" id="decryptStatus">Acessando servidores do Instagram...</p>
                    <div class="decrypt-progress-container">
                        <div class="decrypt-progress-bar" id="decryptProgress"></div>
                    </div>
                    <p class="decrypt-percentage" id="decryptPercentage">0%</p>
                    <p class="decrypt-file" id="decryptFile">Inicializando conexão segura...</p>
                    
                    <div class="decrypt-error-message" id="decryptError" style="display: none;">
                        <p>⚠️ <strong>Falha na autenticação!</strong><br>Acesso VIP necessário para completar a descriptografia dos dados protegidos.</p>
                        <p class="error-code">Erro: AUTH_REQUIRED_VIP_ACCESS</p>
                        <button class="decrypt-unlock-btn" onclick="redirectToCheckout()">
                            🔓 Desbloquear Acesso VIP
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', decryptHTML);
    }

    function startDecryptAnimation() {
        const overlay = document.getElementById('decryptOverlay');
        const container = document.getElementById('decryptContainer');
        const progress = document.getElementById('decryptProgress');
        const percentage = document.getElementById('decryptPercentage');
        const status = document.getElementById('decryptStatus');
        const file = document.getElementById('decryptFile');
        const error = document.getElementById('decryptError');

        if (!overlay) return;

        // Reset
        container.classList.remove('error');
        error.style.display = 'none';
        progress.style.width = '0%';
        percentage.textContent = '0%';

        // Mostrar overlay
        overlay.classList.add('show');

        // Mensagens de status
        const statusMessages = [
            { pct: 10, status: 'Conectando aos servidores...', file: 'ssl_handshake.bin' },
            { pct: 25, status: 'Autenticando credenciais...', file: 'auth_token.enc' },
            { pct: 40, status: 'Baixando dados do perfil...', file: 'profile_data.json' },
            { pct: 55, status: 'Descriptografando mensagens...', file: 'messages_inbox.db' },
            { pct: 70, status: 'Processando mídias...', file: 'media_cache.tmp' },
            { pct: 80, status: 'Decodificando localização...', file: 'location_history.gpx' },
            { pct: CONFIG.decrypt.failAt, status: 'Verificando permissões VIP...', file: 'vip_access.key' }
        ];

        let currentStep = 0;
        const stepDuration = CONFIG.decrypt.duration / statusMessages.length;

        function updateProgress() {
            if (currentStep >= statusMessages.length) {
                // Falha na descriptografia
                setTimeout(() => {
                    container.classList.add('error');
                    status.textContent = 'ERRO: Acesso negado!';
                    error.style.display = 'block';
                }, 500);
                return;
            }

            const step = statusMessages[currentStep];
            progress.style.width = step.pct + '%';
            percentage.textContent = step.pct + '%';
            status.textContent = step.status;
            file.textContent = step.file;

            currentStep++;
            setTimeout(updateProgress, stepDuration);
        }

        // Iniciar animação
        setTimeout(updateProgress, 500);
    }

    window.closeDecryptOverlay = function() {
        const overlay = document.getElementById('decryptOverlay');
        if (overlay) {
            overlay.classList.remove('show');
        }
    };

    window.redirectToCheckout = function() {
        closeDecryptOverlay();
        // Scroll para o botão de compra
        const ctaButton = document.querySelector('.pricing-cta-button');
        if (ctaButton) {
            ctaButton.scrollIntoView({ behavior: 'smooth', block: 'center' });
            // Destacar o botão
            ctaButton.style.animation = 'pulse-cta 0.5s ease 3';
        }
    };

    // ====== PAINEL DE CONTROLE GAMIFICADO ======
    function initControlPanel() {
        // Verificar se já existe o painel
        if (document.querySelector('.control-panel-gamified')) return;

        // Buscar nome do usuário
        const usernameEl = document.querySelector('.username-display');
        const username = usernameEl ? usernameEl.textContent : 'ele(a)';

        const panelHTML = `
            <div class="control-panel-gamified">
                <h3 class="control-panel-title">
                    Painel de Controle - <span class="gradient">${username}</span>
                </h3>
                <div class="control-buttons-grid">
                    <button class="control-btn" onclick="handleControlClick('messages')">
                        <div class="control-btn-icon messages">
                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
                            </svg>
                        </div>
                        <span class="control-btn-text">Ver Mensagens</span>
                        <span class="control-btn-status">
                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                            </svg>
                            Bloqueado
                        </span>
                    </button>
                    <button class="control-btn" onclick="handleControlClick('photos')">
                        <div class="control-btn-icon photos">
                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                            </svg>
                        </div>
                        <span class="control-btn-text">Fotos Privadas</span>
                        <span class="control-btn-status">
                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                            </svg>
                            Bloqueado
                        </span>
                    </button>
                    <button class="control-btn" onclick="handleControlClick('location')">
                        <div class="control-btn-icon location">
                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                            </svg>
                        </div>
                        <span class="control-btn-text">Localização</span>
                        <span class="control-btn-status">
                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                            </svg>
                            Bloqueado
                        </span>
                    </button>
                    <button class="control-btn" onclick="handleControlClick('stories')">
                        <div class="control-btn-icon stories">
                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                            </svg>
                        </div>
                        <span class="control-btn-text">Stories Ocultos</span>
                        <span class="control-btn-status">
                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                            </svg>
                            Bloqueado
                        </span>
                    </button>
                    <button class="control-btn" onclick="handleControlClick('alerts')">
                        <div class="control-btn-icon alerts">
                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path>
                            </svg>
                        </div>
                        <span class="control-btn-text">Alertas</span>
                        <span class="control-btn-status">
                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                            </svg>
                            Bloqueado
                        </span>
                    </button>
                    <button class="control-btn" onclick="handleControlClick('deleted')">
                        <div class="control-btn-icon deleted">
                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                            </svg>
                        </div>
                        <span class="control-btn-text">Apagados</span>
                        <span class="control-btn-status">
                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                            </svg>
                            Bloqueado
                        </span>
                    </button>
                </div>
            </div>
        `;

        // Inserir após o badge
        const badge = document.querySelector('.profile-card-badge');
        if (badge) {
            badge.insertAdjacentHTML('afterend', panelHTML);
        }
    }

    window.handleControlClick = function(type) {
        // Iniciar animação de descriptografia
        startDecryptAnimation();
    };

    // ====== CONTADOR DE VISUALIZAÇÕES ======
    function initViewersCounter() {
        const viewersHTML = `
            <div class="viewers-counter">
                <span class="dot"></span>
                <span><span class="count" id="viewersCount">47</span> pessoas visualizando agora</span>
            </div>
        `;

        // Inserir antes do pricing
        const pricing = document.querySelector('.pricing-value-container');
        if (pricing) {
            pricing.insertAdjacentHTML('beforebegin', viewersHTML);
        }

        // Atualizar contador periodicamente
        setInterval(() => {
            const counter = document.getElementById('viewersCount');
            if (counter) {
                const current = parseInt(counter.textContent);
                const change = getRandomInt(-3, 5);
                const newValue = Math.max(35, Math.min(89, current + change));
                counter.textContent = newValue;
            }
        }, 5000);
    }

    // ====== BADGE DE URGÊNCIA ======
    function initUrgencyBadge() {
        const urgencyHTML = `
            <div class="urgency-badge">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                </svg>
                <span>⚠️ <strong>Atenção:</strong> Esta sessão expira em breve. Após expirar, você <strong>nunca mais</strong> poderá acessar estes dados.</span>
            </div>
        `;

        // Inserir antes do botão CTA
        const ctaButton = document.querySelector('.pricing-cta-button');
        if (ctaButton) {
            ctaButton.insertAdjacentHTML('beforebegin', urgencyHTML);
        }
    }

    // ====== INICIALIZAÇÃO ======
    function init() {
        // Aguardar DOM estar pronto
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', initAll);
        } else {
            initAll();
        }
    }

    function initAll() {
        // Pequeno delay para garantir que outros scripts carregaram
        setTimeout(() => {
            initFOMO();
            initDecrypt();
            initControlPanel();
            initViewersCounter();
            initUrgencyBadge();
            console.log('✅ Melhorias de conversão carregadas');
        }, 500);
    }

    // Iniciar
    init();

})();
