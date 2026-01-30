// ============================================
// SIMULAÇÃO DE DESCRIPTOGRAFIA - Feed/Direct
// Animação imersiva antes de redirecionar para CTA
// ============================================

(function() {
    'use strict';

    // ====== CONFIGURAÇÕES ======
    const CONFIG = {
        triggerDelay: 15000, // 15 segundos após carregar a página
        decryptDuration: 10000, // 10 segundos de animação
        failAtPercent: 92, // Porcentagem onde "falha"
        redirectDelay: 2000 // Delay antes de redirecionar
    };

    // ====== CRIAR OVERLAY DE DESCRIPTOGRAFIA ======
    function createDecryptOverlay() {
        // Verificar se já existe
        if (document.getElementById('decryptSimOverlay')) return;

        const overlayHTML = `
            <div id="decryptSimOverlay" class="decrypt-sim-overlay">
                <div class="decrypt-sim-container" id="decryptSimContainer">
                    <div class="decrypt-sim-header">
                        <div class="decrypt-sim-logo">
                            <img src="imagens/logo-vert-transparente.png" alt="Stalkea.ai" onerror="this.style.display='none'">
                        </div>
                    </div>
                    
                    <div class="decrypt-sim-icon" id="decryptSimIcon">
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
                        </svg>
                    </div>
                    
                    <h2 class="decrypt-sim-title" id="decryptSimTitle">Descriptografando Dados Protegidos</h2>
                    <p class="decrypt-sim-subtitle" id="decryptSimSubtitle">Acessando informações privadas do Instagram...</p>
                    
                    <div class="decrypt-sim-progress-wrapper">
                        <div class="decrypt-sim-progress-bar">
                            <div class="decrypt-sim-progress-fill" id="decryptSimProgress"></div>
                        </div>
                        <span class="decrypt-sim-percentage" id="decryptSimPercentage">0%</span>
                    </div>
                    
                    <div class="decrypt-sim-status" id="decryptSimStatus">
                        <div class="decrypt-sim-status-icon">
                            <div class="decrypt-sim-spinner"></div>
                        </div>
                        <span id="decryptSimStatusText">Iniciando conexão segura...</span>
                    </div>
                    
                    <div class="decrypt-sim-files" id="decryptSimFiles">
                        <div class="decrypt-sim-file-item" id="decryptSimFile">
                            <span class="file-icon">📄</span>
                            <span class="file-name">ssl_handshake.bin</span>
                        </div>
                    </div>
                    
                    <!-- Área de erro (inicialmente oculta) -->
                    <div class="decrypt-sim-error" id="decryptSimError" style="display: none;">
                        <div class="decrypt-sim-error-icon">
                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                            </svg>
                        </div>
                        <h3 class="decrypt-sim-error-title">Acesso Negado!</h3>
                        <p class="decrypt-sim-error-text">
                            Não foi possível completar a descriptografia.<br>
                            <strong>Autenticação VIP necessária</strong> para acessar dados protegidos.
                        </p>
                        <p class="decrypt-sim-error-code">Erro: VIP_AUTH_REQUIRED_0x7F</p>
                        <button class="decrypt-sim-unlock-btn" onclick="redirectToCTA()">
                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z"></path>
                            </svg>
                            Desbloquear Acesso VIP
                        </button>
                    </div>
                </div>
            </div>
            
            <style>
                .decrypt-sim-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0, 0, 0, 0.98);
                    z-index: 99999;
                    display: none;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    padding: 20px;
                    animation: fadeInOverlay 0.5s ease;
                }
                
                .decrypt-sim-overlay.show {
                    display: flex;
                }
                
                @keyframes fadeInOverlay {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                
                .decrypt-sim-container {
                    background: linear-gradient(180deg, rgba(12, 16, 17, 0.98) 0%, rgba(20, 26, 28, 0.98) 100%);
                    border: 1px solid rgba(100, 82, 212, 0.3);
                    border-radius: 24px;
                    padding: clamp(28px, 7vw, 40px);
                    max-width: 420px;
                    width: 100%;
                    text-align: center;
                    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5), 0 0 40px rgba(100, 82, 212, 0.1);
                }
                
                .decrypt-sim-header {
                    margin-bottom: 24px;
                }
                
                .decrypt-sim-logo img {
                    height: 50px;
                    width: auto;
                }
                
                .decrypt-sim-icon {
                    width: 80px;
                    height: 80px;
                    margin: 0 auto 20px;
                    background: linear-gradient(135deg, rgba(100, 82, 212, 0.2), rgba(171, 88, 244, 0.1));
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    animation: pulseIcon 2s ease-in-out infinite;
                }
                
                @keyframes pulseIcon {
                    0%, 100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(100, 82, 212, 0.4); }
                    50% { transform: scale(1.05); box-shadow: 0 0 30px 10px rgba(100, 82, 212, 0.15); }
                }
                
                .decrypt-sim-icon svg {
                    width: 40px;
                    height: 40px;
                    color: #ab58f4;
                }
                
                .decrypt-sim-icon.error {
                    background: linear-gradient(135deg, rgba(239, 68, 68, 0.2), rgba(239, 68, 68, 0.1));
                    animation: shakeIcon 0.5s ease;
                }
                
                .decrypt-sim-icon.error svg {
                    color: #EF4444;
                }
                
                @keyframes shakeIcon {
                    0%, 100% { transform: translateX(0); }
                    25% { transform: translateX(-10px); }
                    75% { transform: translateX(10px); }
                }
                
                .decrypt-sim-title {
                    font-size: clamp(20px, 5.5vw, 26px);
                    font-weight: 700;
                    color: #F9F9F9;
                    margin-bottom: 8px;
                    line-height: 1.3;
                }
                
                .decrypt-sim-subtitle {
                    font-size: clamp(13px, 3.5vw, 15px);
                    color: #9CA3AF;
                    margin-bottom: 28px;
                    line-height: 1.5;
                }
                
                .decrypt-sim-progress-wrapper {
                    margin-bottom: 20px;
                }
                
                .decrypt-sim-progress-bar {
                    background: rgba(100, 82, 212, 0.15);
                    border-radius: 10px;
                    height: 14px;
                    overflow: hidden;
                    margin-bottom: 10px;
                }
                
                .decrypt-sim-progress-fill {
                    height: 100%;
                    background: linear-gradient(90deg, #4a37b6, #ab58f4);
                    border-radius: 10px;
                    width: 0%;
                    transition: width 0.3s ease;
                    position: relative;
                }
                
                .decrypt-sim-progress-fill::after {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
                    animation: shimmerProgress 1.5s infinite;
                }
                
                @keyframes shimmerProgress {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(100%); }
                }
                
                .decrypt-sim-progress-fill.error {
                    background: linear-gradient(90deg, #EF4444, #DC2626);
                }
                
                .decrypt-sim-percentage {
                    font-size: clamp(28px, 7vw, 36px);
                    font-weight: 800;
                    background: linear-gradient(135deg, #4a37b6, #ab58f4);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                }
                
                .decrypt-sim-percentage.error {
                    background: linear-gradient(135deg, #EF4444, #DC2626);
                    -webkit-background-clip: text;
                    background-clip: text;
                }
                
                .decrypt-sim-status {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 10px;
                    margin-bottom: 16px;
                }
                
                .decrypt-sim-spinner {
                    width: 16px;
                    height: 16px;
                    border: 2px solid rgba(100, 82, 212, 0.3);
                    border-top-color: #ab58f4;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                }
                
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
                
                .decrypt-sim-status span {
                    font-size: 13px;
                    color: #D1D5DB;
                }
                
                .decrypt-sim-files {
                    margin-top: 16px;
                }
                
                .decrypt-sim-file-item {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    font-size: 11px;
                    color: #6B7280;
                    font-family: monospace;
                }
                
                .decrypt-sim-error {
                    margin-top: 24px;
                    padding: 20px;
                    background: rgba(239, 68, 68, 0.1);
                    border: 1px solid rgba(239, 68, 68, 0.3);
                    border-radius: 16px;
                    animation: slideUp 0.5s ease;
                }
                
                @keyframes slideUp {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                
                .decrypt-sim-error-icon {
                    width: 50px;
                    height: 50px;
                    margin: 0 auto 12px;
                    background: rgba(239, 68, 68, 0.2);
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                
                .decrypt-sim-error-icon svg {
                    width: 28px;
                    height: 28px;
                    color: #EF4444;
                }
                
                .decrypt-sim-error-title {
                    font-size: 18px;
                    font-weight: 700;
                    color: #EF4444;
                    margin-bottom: 8px;
                }
                
                .decrypt-sim-error-text {
                    font-size: 14px;
                    color: #F9F9F9;
                    line-height: 1.5;
                    margin-bottom: 8px;
                }
                
                .decrypt-sim-error-code {
                    font-size: 11px;
                    color: #EF4444;
                    font-family: monospace;
                    margin-bottom: 16px;
                }
                
                .decrypt-sim-unlock-btn {
                    background: linear-gradient(135deg, #10B981, #059669);
                    color: white;
                    border: none;
                    border-radius: 12px;
                    padding: 14px 28px;
                    font-size: 15px;
                    font-weight: 700;
                    cursor: pointer;
                    width: 100%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    transition: all 0.3s ease;
                    box-shadow: 0 4px 15px rgba(16, 185, 129, 0.3);
                }
                
                .decrypt-sim-unlock-btn:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 6px 20px rgba(16, 185, 129, 0.4);
                }
                
                .decrypt-sim-unlock-btn svg {
                    width: 20px;
                    height: 20px;
                }
            </style>
        `;

        document.body.insertAdjacentHTML('beforeend', overlayHTML);
    }

    // ====== INICIAR ANIMAÇÃO DE DESCRIPTOGRAFIA ======
    function startDecryptSimulation() {
        const overlay = document.getElementById('decryptSimOverlay');
        const container = document.getElementById('decryptSimContainer');
        const progress = document.getElementById('decryptSimProgress');
        const percentage = document.getElementById('decryptSimPercentage');
        const title = document.getElementById('decryptSimTitle');
        const subtitle = document.getElementById('decryptSimSubtitle');
        const statusText = document.getElementById('decryptSimStatusText');
        const fileItem = document.getElementById('decryptSimFile');
        const icon = document.getElementById('decryptSimIcon');
        const error = document.getElementById('decryptSimError');

        if (!overlay) return;

        // Mostrar overlay
        overlay.classList.add('show');

        // Etapas da descriptografia
        const steps = [
            { pct: 5, status: 'Estabelecendo conexão segura...', file: 'ssl_handshake.bin' },
            { pct: 15, status: 'Autenticando credenciais...', file: 'auth_token.enc' },
            { pct: 28, status: 'Acessando banco de dados...', file: 'instagram_db.sql' },
            { pct: 42, status: 'Baixando perfil completo...', file: 'profile_data.json' },
            { pct: 55, status: 'Descriptografando mensagens...', file: 'direct_messages.db' },
            { pct: 68, status: 'Processando mídias privadas...', file: 'media_cache.tmp' },
            { pct: 78, status: 'Decodificando localização...', file: 'location_history.gpx' },
            { pct: 85, status: 'Extraindo stories ocultos...', file: 'hidden_stories.mp4' },
            { pct: CONFIG.failAtPercent, status: 'Verificando permissões VIP...', file: 'vip_access.key' }
        ];

        let currentStep = 0;
        const stepDuration = CONFIG.decryptDuration / steps.length;

        function updateStep() {
            if (currentStep >= steps.length) {
                // Falha na descriptografia
                setTimeout(() => {
                    icon.classList.add('error');
                    progress.classList.add('error');
                    percentage.classList.add('error');
                    title.textContent = 'Falha na Descriptografia!';
                    subtitle.textContent = 'Não foi possível completar o acesso aos dados.';
                    statusText.textContent = 'ERRO: Autenticação negada';
                    error.style.display = 'block';
                    
                    // Ocultar spinner
                    document.querySelector('.decrypt-sim-status-icon').style.display = 'none';
                }, 500);
                return;
            }

            const step = steps[currentStep];
            progress.style.width = step.pct + '%';
            percentage.textContent = step.pct + '%';
            statusText.textContent = step.status;
            fileItem.querySelector('.file-name').textContent = step.file;

            currentStep++;
            setTimeout(updateStep, stepDuration);
        }

        // Iniciar após pequeno delay
        setTimeout(updateStep, 500);
    }

    // ====== REDIRECIONAR PARA CTA ======
    window.redirectToCTA = function() {
        window.location.href = 'cta.html';
    };

    // ====== TRIGGER BASEADO EM INTERAÇÃO ======
    function setupTriggers() {
        // Trigger quando clicar em elementos bloqueados
        document.addEventListener('click', function(e) {
            const target = e.target;
            
            // Verificar se clicou em elemento com blur ou bloqueado
            const isBlocked = target.closest('.blur-word') ||
                             target.closest('.message-photo') ||
                             target.closest('.video-blurred') ||
                             target.closest('.pack-blurred') ||
                             target.closest('[style*="blur"]') ||
                             target.closest('.media-overlay') ||
                             target.closest('.story-item');
            
            if (isBlocked) {
                e.preventDefault();
                e.stopPropagation();
                createDecryptOverlay();
                setTimeout(startDecryptSimulation, 100);
            }
        });

        // Trigger automático após tempo na página
        setTimeout(() => {
            // Verificar se já não está mostrando
            const overlay = document.getElementById('decryptSimOverlay');
            if (!overlay || !overlay.classList.contains('show')) {
                createDecryptOverlay();
                startDecryptSimulation();
            }
        }, CONFIG.triggerDelay);
    }

    // ====== INICIALIZAÇÃO ======
    function init() {
        // Verificar se estamos em página de simulação (feed ou direct)
        const isFeed = window.location.pathname.includes('feed');
        const isDirect = window.location.pathname.includes('direct');
        const isChat = window.location.pathname.includes('chat');
        
        if (isFeed || isDirect || isChat) {
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', setupTriggers);
            } else {
                setupTriggers();
            }
            console.log('✅ Decrypt Simulation carregado');
        }
    }

    init();

})();
