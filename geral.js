// ============================================
// ARQUIVO GERAL - FUNÇÕES E CONFIGURAÇÕES COMPARTILHADAS
// ============================================

// ============================================
// VERIFICAR SE TIMER EXPIROU - REDIRECT IMEDIATO PARA CTA
// ============================================
(function() {
    // Não executar no CTA (para não criar loop)
    if (window.location.pathname.includes('cta.html')) return;
    
    // Verificar se timer expirou - REDIRECT IMEDIATO
    if (localStorage.getItem('cta_timer_expired') === '1') {
        // Redirecionar IMEDIATAMENTE para CTA
        window.location.replace('./cta.html');
        return; // Parar execução
    }
})();

// ============================================
// CONFIGURAÇÕES DO SITE
// ============================================
const SITE_CONFIG = {
    name: "Stalkea.ai",
    fullName: "Stalkea.ai - The largest Instagram stalking software in Latin America",
    description: "Stalkea.ai - The largest Instagram stalking software in Latin America. Discover the truth about anyone on Instagram.",
    apiPort: 8002,
    defaultPort: 8001
    // redirectUrl removido - não há mais lógica de redirecionamento
};

// Funções de cookie removidas

// ============================================
// COMPLETE DATA CLEANUP FUNCTION
// ============================================

/**
 * Clears ALL stored data: localStorage, sessionStorage, IndexedDB
 */
function clearAllData() {
    // 1. Limpar localStorage completamente (incluindo chaves específicas)
    try {
        const prefixes = ['feed', 'direct', 'processed_stories', 'user_data', 
                          'followers', 'following', 'chaining_results', 'posts',
                          'feedPostsOrder', 'feedPostsHash', 'feed_real_posts',
                          'feed_posts_html', 'feed_timestamp', 'last_searched_username'];
        
        Object.keys(localStorage).forEach(key => {
            if (prefixes.some(prefix => key.includes(prefix))) {
                localStorage.removeItem(key);
            }
        });
        
        localStorage.clear();
    } catch (e) {
        console.error('❌ Erro ao limpar localStorage:', e);
    }
    
    // 2. Limpar sessionStorage completamente
    try {
        sessionStorage.clear();
    } catch (e) {
        console.error('❌ Erro ao limpar sessionStorage:', e);
    }
    
    // Cookies e cache removidos
    
    // 4. Tentar limpar IndexedDB (se existir)
    try {
        if ('indexedDB' in window) {
            indexedDB.databases().then(databases => {
                databases.forEach(db => {
                    if (db.name) {
                        indexedDB.deleteDatabase(db.name).catch(() => {});
                    }
                });
            }).catch(() => {});
        }
    } catch (e) {
        // Silencioso
    }
    
    // Cache removido
}

// ============================================
// FUNCTIONS TO GENERATE RANDOM DATA
// ============================================

/**
 * Generates a random name
 * @returns {string} - Random name
 */
function generateRandomName() {
    const firstNames = ['Ana', 'Maria', 'João', 'Pedro', 'Carlos', 'Julia', 'Fernanda', 'Lucas', 'Gabriel', 'Mariana', 'Rafael', 'Beatriz', 'Thiago', 'Camila', 'Bruno', 'Isabela', 'Larissa', 'André', 'Amanda'];
    const lastNames = ['Silva', 'Santos', 'Oliveira', 'Pereira', 'Costa', 'Rodrigues', 'Almeida', 'Nascimento', 'Lima', 'Araújo', 'Fernandes', 'Carvalho', 'Gomes', 'Martins', 'Rocha', 'Ribeiro', 'Alves', 'Monteiro', 'Barbosa'];
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    return `${firstName} ${lastName}`;
}

/**
 * Generates a random username (more realistic)
 * @returns {string} - Random username
 */
function generateRandomUsername() {
    const firstNames = ['ana', 'maria', 'joao', 'pedro', 'carlos', 'julia', 'fernanda', 'lucas', 'gabriel', 'mariana', 'rafael', 'beatriz', 'thiago', 'camila', 'bruno', 'isabela', 'larissa', 'andre', 'amanda', 'sophia', 'enzo', 'valentina', 'benjamin', 'helena', 'arthur', 'alice', 'theo', 'laura', 'davi'];
    const lastNames = ['silva', 'santos', 'oliveira', 'pereira', 'costa', 'rodrigues', 'almeida', 'nascimento', 'lima', 'araujo', 'fernandes', 'carvalho', 'gomes', 'martins', 'rocha', 'ribeiro', 'alves', 'monteiro', 'barbosa'];
    const separators = ['.', '_', ''];
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    const separator = separators[Math.floor(Math.random() * separators.length)];
    const numbers = Math.random() > 0.7 ? Math.floor(Math.random() * 99) : ''; // 30% chance de ter números
    return `${firstName}${separator}${lastName}${numbers}`;
}

/**
 * Generates a random photo URL
 * @returns {string} - Random photo URL
 */
function generateRandomPhotoUrl() {
    // Retornar perfil-sem-foto.jpeg como padrão
    // Se quiser usar imagens aleatórias, pode retornar uma URL aleatória
    // Mas por padrão, retornar a foto padrão
    return '../imagens/perfil-sem-foto.jpeg';
}

/**
 * Generates random user data
 * @param {number} count - Number of users
 * @returns {Array} - Array of random users
 */
function generateRandomUsers(count = 10) {
    const users = [];
    for (let i = 0; i < count; i++) {
        users.push({
            username: generateRandomUsername(),
            full_name: generateRandomName(),
            profile_pic_url: '../imagens/perfil-sem-foto.jpeg',
            profile_pic_url_hd: '../imagens/perfil-sem-foto.jpeg',
            pk: String(Math.floor(Math.random() * 1000000000)),
            id: String(Math.floor(Math.random() * 1000000000)),
            follower_count: Math.floor(Math.random() * 5000),
            following_count: Math.floor(Math.random() * 1000),
            media_count: Math.floor(Math.random() * 500)
        });
    }
    return users;
}

// APIs e proxies removidos
// Verificações de cookie removidas - código limpo

// ============================================
// NAVIGATION FUNCTIONS
// ============================================

/**
 * Redirects to CTA
 * @param {string} page - Destination page (default: 'cta.html')
 */
function goToCTA(page = 'cta.html') {
    window.location.href = page;
}

/**
 * Returns CTA URL
 * @param {string} page - Destination page (default: 'cta.html')
 * @returns {string} - Page URL
 */
function getCTAUrl(page = 'cta.html') {
    return page;
}

// ============================================
// FUNÇÕES AUXILIARES
// ============================================

/**
 * Masks a username (shows 3 letters + *****)
 * @param {string} username - Username to mask
 * @returns {string} - Masked username
 */
function maskUsername(username) {
    if (!username || username.length === 0) {
        return 'xxx*****';
    }
    
    // Remover emojis e caracteres especiais, mantendo apenas letras, números, . e _
    const cleanUsername = username.replace(/[^\w.]/g, '');
    
    // Se o username já contém asteriscos, extrair as letras antes dos asteriscos
    if (cleanUsername.includes('*')) {
        const lettersOnly = cleanUsername.split('*')[0];
        if (lettersOnly.length >= 3) {
            return lettersOnly.substring(0, 3) + '*****';
        } else if (lettersOnly.length > 0) {
            return lettersOnly + '*****';
        }
        return 'xxx*****';
    }
    
    // Se após limpeza não sobrou nada, retornar padrão
    if (cleanUsername.length === 0) {
        return 'xxx*****';
    }
    
    // Mostrar 3 letras + *****
    const visibleChars = cleanUsername.length >= 3 ? cleanUsername.substring(0, 3) : cleanUsername;
    return visibleChars + '*****';
}

/**
 * Formats a number (ex: 1000 -> 1K, 1000000 -> 1M)
 * @param {number} num - Number to format
 * @returns {string} - Formatted number
 */
function formatNumber(num) {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
}

// ============================================
// EXPORTAR FUNÇÕES (para compatibilidade)
// ============================================

// Tornar funções disponíveis globalmente
if (typeof window !== 'undefined') {
    window.SITE_CONFIG = SITE_CONFIG;
    window.clearAllData = clearAllData;
    window.maskUsername = maskUsername;
    window.formatNumber = formatNumber;
    window.generateRandomName = generateRandomName;
    window.generateRandomUsername = generateRandomUsername;
    window.generateRandomPhotoUrl = generateRandomPhotoUrl;
    window.generateRandomUsers = generateRandomUsers;
    window.goToCTA = goToCTA;
    window.getCTAUrl = getCTAUrl;
}
