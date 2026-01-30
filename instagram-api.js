// ===================================
// INSTAGRAM API - Clean Integration
// API: RapidAPI - Instagram Scraper Stable API
// ===================================

const RAPIDAPI_BASE_URL = 'https://instagram-scraper-stable-api.p.rapidapi.com';
const RAPIDAPI_KEY = 'd03f07c7c6mshb0e213b53734dcbp1c2ccfjsnc7937b7aa611';
const RAPIDAPI_HOST = 'instagram-scraper-stable-api.p.rapidapi.com';
const REQUEST_TIMEOUT = 30000; // 30 seconds

// Default headers for RapidAPI
function getRapidAPIHeaders(apiKey = RAPIDAPI_KEY) {
    return {
        'x-rapidapi-key': apiKey,
        'x-rapidapi-host': RAPIDAPI_HOST,
        'Content-Type': 'application/x-www-form-urlencoded'
    };
}

// Available endpoints (RapidAPI):
// - /ig_get_fb_profile_hover.php (GET)          → Basic profile hover data
// - /ig_get_fb_profile.php (POST)                → Full profile data
// - /get_ig_user_posts.php (POST)                → User posts with cursor pagination
// - /get_ig_user_followers_v2.php (POST)         → User followers with pagination_token

// ===================================
// UTILITY FUNCTIONS
// ===================================

/**
 * Image proxy to avoid CORS (only for external URLs)
 */
function getProxyImageUrl(imageUrl) {
    if (!imageUrl || imageUrl.trim() === '') {
        return './imagens/perfil-sem-foto.jpeg';
    }
    // Don't apply proxy to local URLs
    if (imageUrl.startsWith('./') || imageUrl.startsWith('/') || imageUrl.startsWith('../')) {
        return imageUrl;
    }
    // If already has proxy, return as is
    if (imageUrl.includes('images.weserv.nl') || imageUrl.includes('proxt-insta.projetinho-solo.workers.dev')) {
        return imageUrl;
    }
    // Only apply proxy to external URLs (http/https)
    if (!imageUrl.startsWith('http')) {
        return imageUrl;
    }
    return `https://proxt-insta.projetinho-solo.workers.dev/?url=${encodeURIComponent(imageUrl)}`;
}

/**
 * Image proxy for avatars (light version - stories)
 * Uses weserv.nl with reduced quality/size to load faster
 */
function getProxyImageUrlLight(imageUrl) {
    if (!imageUrl || imageUrl.trim() === '') {
        return './imagens/perfil-sem-foto.jpeg';
    }
    if (imageUrl.startsWith('./') || imageUrl.startsWith('/') || imageUrl.startsWith('../')) {
        return imageUrl;
    }
    if (imageUrl.includes('images.weserv.nl') || imageUrl.includes('proxt-insta.projetinho-solo.workers.dev')) {
        return imageUrl;
    }
    if (!imageUrl.startsWith('http')) {
        return imageUrl;
    }
    // Use weserv.nl with small size (80px) and low quality (50) for avatars
    const urlWithoutProtocol = imageUrl.replace(/^https?:\/\//, '');
    return `https://images.weserv.nl/?url=${encodeURIComponent(urlWithoutProtocol)}&w=80&h=80&fit=cover&q=50`;
}

/**
 * Fetch com timeout (adaptado para RapidAPI)
 */
async function fetchWithTimeout(url, options = {}, timeout = REQUEST_TIMEOUT) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
        const response = await fetch(url, {
            ...options,
            signal: controller.signal,
            headers: {
                ...getRapidAPIHeaders(),
                ...options.headers
            }
        });

        clearTimeout(timeoutId);

        let data;
        try {
            data = await response.json();
        } catch (parseError) {
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            throw parseError;
        }

        return data;
    } catch (error) {
        clearTimeout(timeoutId);

        if (error.name === 'AbortError') {
            throw new Error('Request timeout');
        }

        throw error;
    }
}

/**
 * Fetch with MULTIPLE PARALLEL attempts and NO short timeout
 * Makes 2 simultaneous requests, continues trying until maxTime
 */
async function fetchWithParallelRetry(url, options = {}, maxTime = 40000) {
    const startTime = Date.now();
    let round = 0;
    
    while (Date.now() - startTime < maxTime) {
        round++;
        const roundStart = Date.now();
        
        console.log(`⚡⚡ Round ${round}: Making 2 PARALLEL requests`);
        
        try {
            // Make 2 requests AT THE SAME TIME, without short timeout
            // Uses Promise.race to get the first one that responds
            const promises = [
                fetch(url, {
                    ...options,
                    headers: {
                        ...RAPIDAPI_HEADERS,
                        ...options.headers
                    }
                }).then(async (response) => {
                    // Verificar status HTTP antes de fazer parse
                    if (!response.ok) {
                        // Tentar fazer parse do JSON mesmo em caso de erro
                        let errorData = null;
                        try {
                            errorData = await response.json();
                        } catch (e) {
                            // Se não conseguir fazer parse, usar mensagem padrão
                        }
                        
                        const error = new Error(errorData?.error || errorData?.message || `HTTP ${response.status}: ${response.statusText}`);
                        // Se for 404, marcar como fatal (usuário não encontrado)
                        if (response.status === 404) {
                            error.isFatal = true;
                        }
                        return { success: false, error, attempt: 1 };
                    }
                    
                    // Se resposta OK, fazer parse do JSON
                    const data = await response.json();
                    
                    // Verificar se a resposta tem status "ok" na estrutura
                    if (data && data.status === 'ok' && data.user) {
                        return { success: true, data, attempt: 1 };
                    }
                    
                    // Check if response contains error
                    if (data && data.error) {
                        const error = new Error(data.error);
                        // If user not found error, mark as fatal
                        if (data.error.includes('not found') || 
                            data.error.includes('User not found') ||
                            data.error.includes('não encontrado')) {
                            error.isFatal = true;
                        }
                        return { success: false, error, attempt: 1 };
                    }
                    
                    // Se não tem erro mas também não tem dados válidos, considerar como sucesso parcial
                    return { success: true, data, attempt: 1 };
                }).catch(err => ({ success: false, error: err, attempt: 1 })),
                
                fetch(url, {
                    ...options,
                    headers: {
                        ...RAPIDAPI_HEADERS,
                        ...options.headers
                    }
                }).then(async (response) => {
                    // Verificar status HTTP antes de fazer parse
                    if (!response.ok) {
                        // Tentar fazer parse do JSON mesmo em caso de erro
                        let errorData = null;
                        try {
                            errorData = await response.json();
                        } catch (e) {
                            // Se não conseguir fazer parse, usar mensagem padrão
                        }
                        
                        const error = new Error(errorData?.error || errorData?.message || `HTTP ${response.status}: ${response.statusText}`);
                        // Se for 404, marcar como fatal (usuário não encontrado)
                        if (response.status === 404) {
                            error.isFatal = true;
                        }
                        return { success: false, error, attempt: 2 };
                    }
                    
                    // Se resposta OK, fazer parse do JSON
                    const data = await response.json();
                    
                    // Verificar se a resposta tem status "ok" na estrutura
                    if (data && data.status === 'ok' && data.user) {
                        return { success: true, data, attempt: 2 };
                    }
                    
                    // Check if response contains error
                    if (data && data.error) {
                        const error = new Error(data.error);
                        // If user not found error, mark as fatal
                        if (data.error.includes('not found') || 
                            data.error.includes('User not found') ||
                            data.error.includes('não encontrado')) {
                            error.isFatal = true;
                        }
                        return { success: false, error, attempt: 2 };
                    }
                    
                    // Se não tem erro mas também não tem dados válidos, considerar como sucesso parcial
                    return { success: true, data, attempt: 2 };
                }).catch(err => ({ success: false, error: err, attempt: 2 }))
            ];
            
            // Wait for ANY ONE to respond (the fastest)
            const result = await Promise.race(promises);
            const roundDuration = Date.now() - roundStart;
            
            if (result.success) {
                // Check if data is valid before returning
                const responseData = result.data;
                
                // Verificar se a resposta tem a estrutura esperada: { status: "ok", user: {...} }
                if (responseData && responseData.status === 'ok' && responseData.user) {
                    console.log(`✅ VALID SUCCESS in round ${round} (attempt #${result.attempt}) in ${roundDuration}ms`);
                    return responseData;
                }
                
                // Tentar outras estruturas possíveis
                const profileData = responseData?.data || responseData?.user || responseData;
                const hasValidData = (profileData && profileData.username) || 
                                    (profileData && profileData.perfil_buscado && profileData.perfil_buscado.username) ||
                                    (responseData && responseData.user && responseData.user.username);
                
                if (hasValidData) {
                    console.log(`✅ VALID SUCCESS in round ${round} (attempt #${result.attempt}) in ${roundDuration}ms`);
                    return responseData;
                } else {
                    console.warn(`⚠️ Round ${round} returned invalid data in ${roundDuration}ms (attempt #${result.attempt}) - CONTINUING...`);
                    console.warn(`📊 Data received:`, responseData);
                }
            } else {
                // If fatal error (user not found), stop immediately
                if (result.error && result.error.isFatal) {
                    console.error(`🚫 Fatal error detected: ${result.error.message} - STOPPING attempts`);
                    throw result.error;
                }
                console.warn(`❌ Round ${round} falhou em ${roundDuration}ms (tentativa #${result.attempt}):`, result.error?.message, '- CONTINUANDO...');
            }
            
        } catch (error) {
            const roundDuration = Date.now() - roundStart;
            console.warn(`❌ Round ${round} exception em ${roundDuration}ms:`, error.message);
        }
        
        // Check if there's still time
        const elapsed = Date.now() - startTime;
        if (elapsed >= maxTime) {
            console.error(`⏱️ Time limit of ${maxTime}ms reached after ${round} rounds`);
            throw new Error('No API was able to return the profile');
        }
        
        // Wait 2 seconds between attempts to avoid overloading
        console.log(`🔄 Waiting 2s before next attempt... (elapsed time: ${elapsed}ms / ${maxTime}ms)`);
        await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    throw new Error('Maximum time exceeded without success');
}

// ===================================
// API ENDPOINTS
// ===================================

/**
 * Fetch profile by username (FAST - for confirmation modal)
 * Nova API: /ig_get_fb_profile_hover.php (GET) + /ig_get_fb_profile.php (POST)
 */
async function fetchProfileByUsername(username) {
    try {
        const cleanUsername = username.replace(/^@+/, '').trim();

        if (!cleanUsername) {
            throw new Error('Username inválido');
        }

        console.log('🔍 Searching profile quickly:', cleanUsername);

        // Buscar dados básicos (hover) e perfil completo em paralelo
        const [hoverResponse, profileResponse] = await Promise.allSettled([
            // Hover endpoint (GET) - dados básicos rápidos
            fetch(`${RAPIDAPI_BASE_URL}/ig_get_fb_profile_hover.php?username_or_url=${encodeURIComponent(cleanUsername)}`, {
                method: 'GET',
                headers: {
                    'x-rapidapi-key': RAPIDAPI_KEY,
                    'x-rapidapi-host': RAPIDAPI_HOST
                }
            }),
            // Profile endpoint (POST) - dados completos
            fetch(`${RAPIDAPI_BASE_URL}/ig_get_fb_profile.php`, {
                method: 'POST',
                headers: getRapidAPIHeaders(),
                body: new URLSearchParams({ username_or_url: cleanUsername })
            })
        ]);

        let hoverData = null;
        let profileData = null;

        // Processar resposta do hover
        if (hoverResponse.status === 'fulfilled' && hoverResponse.value.ok) {
            try {
                const hoverJson = await hoverResponse.value.json();
                if (hoverJson && hoverJson.user_data) {
                    hoverData = hoverJson.user_data;
                    console.log('✅ Hover data recebido');
                } else if (hoverJson && hoverJson.error) {
                    console.warn('⚠️ Hover response contém erro:', hoverJson.error);
                }
            } catch (e) {
                console.warn('⚠️ Erro ao processar hover response:', e.message);
            }
        } else if (hoverResponse.status === 'rejected') {
            console.warn('⚠️ Hover request falhou:', hoverResponse.reason?.message);
        } else if (hoverResponse.status === 'fulfilled' && !hoverResponse.value.ok) {
            console.warn(`⚠️ Hover HTTP ${hoverResponse.value.status}: ${hoverResponse.value.statusText}`);
        }

        // Processar resposta do profile
        if (profileResponse.status === 'fulfilled' && profileResponse.value.ok) {
            try {
                const profileJson = await profileResponse.value.json();
                if (profileJson && !profileJson.error) {
                    profileData = profileJson;
                    console.log('✅ Profile data recebido');
                } else if (profileJson && profileJson.error) {
                    console.warn('⚠️ Profile response contém erro:', profileJson.error);
                }
            } catch (e) {
                console.warn('⚠️ Erro ao processar profile response:', e.message);
            }
        } else if (profileResponse.status === 'rejected') {
            console.warn('⚠️ Profile request falhou:', profileResponse.reason?.message);
        } else if (profileResponse.status === 'fulfilled' && !profileResponse.value.ok) {
            const statusText = await profileResponse.value.text().catch(() => '');
            console.warn(`⚠️ Profile HTTP ${profileResponse.value.status}: ${profileResponse.value.statusText}`, statusText.substring(0, 200));
        }

        // Combinar dados (profile tem prioridade sobre hover)
        const userData = profileData || hoverData;

        if (!userData) {
            throw new Error('Profile not found. Please check if the username is correct.');
        }

        // Extrair dados do perfil
        const fullName = userData.full_name || hoverData?.full_name || '';
        const biography = userData.biography || hoverData?.biography || '';
        const pk = userData.pk || userData.id || hoverData?.pk || hoverData?.id || '';
        
        // Foto de perfil (prioridade: hd_profile_pic_url_info.url > profile_pic_url)
        const profilePicUrl = userData.hd_profile_pic_url_info?.url || 
                             userData.profile_pic_url || 
                             hoverData?.hd_profile_pic_url_info?.url ||
                             hoverData?.profile_pic_url ||
                             './imagens/perfil-sem-foto.jpeg';

        const profile = {
            pk: String(pk),
            username: cleanUsername,
            full_name: fullName,
            biography: biography,
            profile_pic_url: profilePicUrl,
            is_verified: !!(userData.is_verified ?? hoverData?.is_verified),
            is_private: !!(userData.is_private ?? hoverData?.is_private),
            is_business: !!(userData.is_business ?? hoverData?.is_business),
            media_count: userData.media_count ?? hoverData?.media_count ?? 0,
            follower_count: userData.follower_count ?? hoverData?.follower_count ?? 0,
            following_count: userData.following_count ?? hoverData?.following_count ?? 0
        };

        console.log('📋 Profile recebido:', {
            pk: profile.pk,
            username: profile.username,
            full_name: profile.full_name,
            is_private: profile.is_private,
            follower_count: profile.follower_count
        });

        console.log('✅ Perfil carregado:', profile.username);
        return profile;
    } catch (error) {
        console.error('❌ Error fetching profile:', error);
        throw error;
    }
}

/**
 * Fetch complete data (after confirming profile)
 * Nova API: múltiplas chamadas para obter todos os dados
 * 
 * Expected response (adapted format):
 * {
 *   perfil_buscado: { username, full_name, profile_pic_url, is_private },
 *   lista_perfis_publicos: [{ username, full_name, profile_pic_url, is_verified }],
 *   posts: [{ de_usuario: {...}, post: { image_url, video_url, is_video, ... } }]
 * }
 */
async function fetchCompleteData(username) {
    try {
        const cleanUsername = username.replace(/^@+/, '').trim();

        console.log('🔎 Fetching complete data:', cleanUsername);

        // Buscar dados em paralelo: profile, posts e followers
        const [profileResponse, postsResponse, followersResponse] = await Promise.allSettled([
            // Profile endpoint (POST) - perfil completo
            fetch(`${RAPIDAPI_BASE_URL}/ig_get_fb_profile.php`, {
                method: 'POST',
                headers: getRapidAPIHeaders(),
                body: new URLSearchParams({ username_or_url: cleanUsername })
            }),
            // Posts endpoint (POST) - posts do usuário
            fetch(`${RAPIDAPI_BASE_URL}/get_ig_user_posts.php`, {
                method: 'POST',
                headers: getRapidAPIHeaders(),
                body: new URLSearchParams({ username_or_url: cleanUsername })
            }),
            // Followers endpoint v2 (POST) - seguidores do usuário
            fetch(`${RAPIDAPI_BASE_URL}/get_ig_user_followers_v2.php`, {
                method: 'POST',
                headers: getRapidAPIHeaders(),
                body: new URLSearchParams({ username_or_url: cleanUsername })
            })
        ]);

        // Process profile response
        let profileData = null;
        if (profileResponse.status === 'fulfilled' && profileResponse.value.ok) {
            const profileJson = await profileResponse.value.json();
            if (profileJson && !profileJson.error) {
                profileData = profileJson;
                console.log('✅ [fetchCompleteData] Profile data recebido');
            } else {
                console.warn('⚠️ [fetchCompleteData] Profile response contém erro:', profileJson?.error);
            }
        } else {
            console.warn('⚠️ [fetchCompleteData] Profile response failed:', profileResponse.status, profileResponse.reason);
        }

        const userData = profileData;

        // Process posts response - nova API retorna { posts: [...] }
        let postsData = [];
        if (postsResponse.status === 'fulfilled' && postsResponse.value.ok) {
            const postsJson = await postsResponse.value.json();
            if (postsJson && !postsJson.error) {
                // Nova API retorna: { posts: [{ node: {...} }] }
                const postsArray = postsJson.posts || [];
                postsData = postsArray.map(p => p.node || p).filter(Boolean);
                console.log('✅ [fetchCompleteData] Posts recebidos:', postsData.length, 'posts');
                if (postsData.length > 0) {
                    console.log('📦 [fetchCompleteData] Sample post:', JSON.stringify(postsData[0], null, 2).substring(0, 300));
                }
            } else {
                console.warn('⚠️ [fetchCompleteData] Posts response contém erro:', postsJson?.error);
            }
        } else {
            console.warn('⚠️ [fetchCompleteData] Posts response failed:', postsResponse.status, postsResponse.reason);
        }

        // Process followers response - nova API retorna { users: [...] }
        let followersData = [];
        if (followersResponse.status === 'fulfilled' && followersResponse.value.ok) {
            const followersJson = await followersResponse.value.json();
            if (followersJson && !followersJson.error) {
                // Nova API retorna: { users: [...] }
                followersData = Array.isArray(followersJson.users) ? followersJson.users : [];
                console.log('✅ [fetchCompleteData] Followers recebidos:', followersData.length, 'usuários');
                if (followersData.length > 0) {
                    console.log('📦 [fetchCompleteData] Sample follower:', JSON.stringify(followersData[0], null, 2).substring(0, 400));
                    console.log('📸 [fetchCompleteData] Sample follower profile_pic_url:', followersData[0].profile_pic_url?.substring(0, 100));
                }
            } else {
                console.warn('⚠️ [fetchCompleteData] Followers response contém erro:', followersJson?.error);
            }
        } else {
            console.warn('⚠️ [fetchCompleteData] Followers response failed:', followersResponse.status, followersResponse.reason);
        }
        
        if (!userData) {
            console.warn('⚠️ [fetchCompleteData] Nenhum dado de perfil encontrado');
        }

        // Map full name - try multiple possible fields
        const fullName = userData?.full_name || '';
        
        // Map profile picture for main user - nova API usa hd_profile_pic_url_info.url
        const userProfilePicUrl = userData?.hd_profile_pic_url_info?.url || 
                                 userData?.profile_pic_url || 
                                 './imagens/perfil-sem-foto.jpeg';
        console.log('📸 [fetchCompleteData] User profile picture URL:', userProfilePicUrl.substring(0, 100));
        if (followersData.length > 0) {
            console.log('📸 [fetchCompleteData] Sample follower profile picture:', followersData[0].profile_pic_url?.substring(0, 100));
        }
        
        // Extrair dados do perfil
        const biography = userData?.biography || '';
        const mediaCount = userData?.media_count || 0;
        const followersCount = userData?.follower_count || 0;
        const followingCount = userData?.following_count || 0;
        
        const data = {
            perfil_buscado: {
                username: cleanUsername,
                full_name: fullName,
                profile_pic_url: userProfilePicUrl,
                is_private: userData?.is_private || false,
                biography: biography,
                media_count: mediaCount,
                follower_count: followersCount,
                following_count: followingCount,
                is_verified: userData?.is_verified || false,
                is_business: userData?.is_business || false,
                pk: userData?.pk || userData?.id || null
            },
            lista_perfis_publicos: Array.isArray(followersData) ? followersData.map(f => {
                // Nova API retorna profile_pic_url diretamente
                const profilePic = f.profile_pic_url || './imagens/perfil-sem-foto.jpeg';
                const username = f.username || '';
                const fullName = f.full_name || '';
                
                return {
                    username: username,
                    full_name: fullName,
                    profile_pic_url: profilePic,
                    is_verified: f.is_verified || false,
                    is_private: f.is_private || false
                };
            }) : [],
            posts: Array.isArray(postsData) ? postsData.map(p => {
                // Nova API usa image_versions2.candidates para imagens
                let imageUrl = '';
                const candidates = p.image_versions2?.candidates;
                if (Array.isArray(candidates) && candidates.length > 0) {
                    // Escolher melhor imagem (maior resolução)
                    const best = candidates.slice().sort((a, b) => (b.width * b.height) - (a.width * a.height))[0];
                    imageUrl = best?.url || '';
                }
                
                // Fallback para outros campos
                if (!imageUrl) {
                    imageUrl = p.display_url || p.image_url || '';
                }
                
                // Processar vídeo
                let videoUrl = p.video_url || null;
                
                // Processar timestamp - nova API usa taken_at
                let timestamp = 0;
                if (p.taken_at) {
                    timestamp = typeof p.taken_at === 'string' ? Math.floor(new Date(p.taken_at).getTime() / 1000) : parseInt(p.taken_at);
                } else if (p.taken_at_timestamp) {
                    timestamp = parseInt(p.taken_at_timestamp);
                }
                
                // Processar media_type (1=photo, 2=video, 8=carousel)
                const mediaType = parseInt(p.media_type || 0);
                const isVideo = mediaType === 2;
                
                // Caption - nova API usa caption.text
                const caption = p.caption?.text || p.caption || '';
                
                return {
                    de_usuario: {
                        username: cleanUsername,
                        full_name: fullName,
                        profile_pic_url: userProfilePicUrl
                    },
                    post: {
                        id: p.id || p.pk || '',
                        shortcode: p.code || p.shortcode || '',
                        image_url: imageUrl,
                        video_url: videoUrl,
                        is_video: isVideo,
                        caption: caption,
                        like_count: parseInt(p.like_count || 0),
                        comment_count: parseInt(p.comment_count || 0),
                        taken_at: timestamp,
                        media_type: mediaType
                    }
                };
            }) : []
        };

        console.log('📦 Complete data received:', data);

        if (data) {
            // 1. Salvar perfil do usuário principal primeiro (com foto)
            if (data.perfil_buscado) {
                const profileData = {
                    username: data.perfil_buscado.username || cleanUsername,
                    full_name: data.perfil_buscado.full_name || '',
                    profile_pic_url: data.perfil_buscado.profile_pic_url || './imagens/perfil-sem-foto.jpeg',
                    is_private: data.perfil_buscado.is_private || false,
                    is_verified: data.perfil_buscado.is_verified || false,
                    biography: data.perfil_buscado.biography || '',
                    media_count: data.perfil_buscado.media_count || 0,
                    follower_count: data.perfil_buscado.follower_count || 0,
                    following_count: data.perfil_buscado.following_count || 0,
                    pk: data.perfil_buscado.pk || null
                };
                localStorage.setItem('instagram_profile', JSON.stringify(profileData));
                console.log('💾 [SAVE] Perfil do usuário principal salvo:', profileData.username, '| Foto:', profileData.profile_pic_url.substring(0, 100), '| Posts:', profileData.media_count, '| Bio:', profileData.biography.substring(0, 50));
            }
            
            // 2. Salvar lista de perfis públicos como followers (para stories)
            if (data.lista_perfis_publicos && data.lista_perfis_publicos.length > 0) {
                const followers = data.lista_perfis_publicos.map((p, idx) => {
                    const followerData = {
                        username: p.username || '',
                        full_name: p.full_name || '',
                        profile_pic_url: p.profile_pic_url || './imagens/perfil-sem-foto.jpeg',
                        is_verified: p.is_verified || false,
                        is_private: p.is_private || false
                    };
                    if (idx < 3) {
                        console.log('💾 [SAVE] Follower', idx, ':', followerData.username, '| Foto:', followerData.profile_pic_url.substring(0, 100));
                    }
                    return followerData;
                });
                localStorage.setItem('followers', JSON.stringify(followers));
                localStorage.setItem('instagram_followers', JSON.stringify(followers));
                localStorage.setItem('chaining_results', JSON.stringify(followers));
                console.log('💾 [SAVE] Followers/Stories salvos:', followers.length, 'usuários');
                if (followers.length > 0) {
                    console.log('📸 [SAVE] Primeiros 3 followers salvos:', followers.slice(0, 3).map(f => ({ username: f.username, profile_pic_url: f.profile_pic_url.substring(0, 80) })));
                }
            } else {
                console.warn('⚠️ [SAVE] Nenhum follower para salvar! lista_perfis_publicos está vazio ou não existe.');
            }
            
            // 2. Salvar posts (mantendo formato esperado pelo feed.html)
            // O feed espera: { post: { image_url, ... }, username: "..." }
            if (data.posts && data.posts.length > 0) {
                const posts = data.posts.map(item => {
                    // Garantir que username sempre existe
                    const postUsername = item.de_usuario?.username || cleanUsername || '';
                    const postFullName = item.de_usuario?.full_name || fullName || '';
                    const postProfilePic = item.de_usuario?.profile_pic_url || userProfilePicUrl || './imagens/perfil-sem-foto.jpeg';
                    
                    console.log('💾 [SAVE POSTS] Salvando post com username:', postUsername, '| profile_pic_url:', postProfilePic.substring(0, 80));
                    
                    return {
                        // Dados aninhados do post (formato esperado pelo feed.html)
                        post: {
                            id: item.post?.id || '',
                            shortcode: item.post?.shortcode || '',
                            image_url: item.post?.image_url || '',
                            video_url: item.post?.video_url || null,
                            is_video: item.post?.is_video || false,
                            caption: item.post?.caption || '',
                            like_count: item.post?.like_count || 0,
                            comment_count: item.post?.comment_count || 0,
                            taken_at: item.post?.taken_at || 0,
                            media_type: item.post?.media_type || (item.post?.is_video ? 'VIDEO' : 'IMAGE')
                        },
                        // Dados de quem postou - SEMPRE preencher com valores válidos
                        username: postUsername,
                        full_name: postFullName,
                        profile_pic_url: postProfilePic
                    };
                });
                localStorage.setItem('feed_real_posts', JSON.stringify(posts));
                localStorage.setItem('instagram_posts', JSON.stringify(posts));
                console.log('💾 Posts saved:', posts.length);
            }
            
            // 3. Salvar/atualizar perfil buscado
            if (data.perfil_buscado) {
                const existingProfile = JSON.parse(localStorage.getItem('instagram_profile') || '{}');
                const updatedProfile = { 
                    ...existingProfile, 
                    ...data.perfil_buscado,
                    timestamp: Date.now()
                };
                localStorage.setItem('instagram_profile', JSON.stringify(updatedProfile));
                console.log('💾 Profile updated com media_count:', updatedProfile.media_count, '| Bio:', updatedProfile.biography?.substring(0, 50) || '');
            }
            
            console.log('✅ All data has been saved to localStorage');
        }

        return data;
    } catch (error) {
        console.error('❌ Error fetching complete data:', error);
        return null;
    }
}

/**
 * Fetch followers/suggested (for private profiles)
 * RapidAPI Endpoint: /user/suggested?username=X
 */
async function fetchPrivateProfile(username) {
    try {
        const cleanUsername = username.replace(/^@+/, '').trim();

        console.log('🔒 Fetching suggested profiles:', cleanUsername);

        const data = await fetchWithTimeout(
            `${RAPIDAPI_BASE_URL}/user/suggested?username=${encodeURIComponent(cleanUsername)}&limit=12`
        );

        const users = [];
        
        // RapidAPI may return in different formats
        const usersArray = data.data || data.results || data.suggested || data.users || [];
        
        if (Array.isArray(usersArray) && usersArray.length > 0) {
            usersArray.forEach(user => {
                // Map profile picture - try multiple possible fields
                const profilePicUrl = user.profile_pic_url || 
                                     user.profilePicUrl || 
                                     user.profile_pic_url_hd || 
                                     user.profilePicUrlHd ||
                                     user.profile_picture || 
                                     user.profilePicture ||
                                     user.profilePic ||
                                     user.avatar ||
                                     user.avatar_url ||
                                     user.picture ||
                                     user.picture_url ||
                                     user.image ||
                                     user.image_url ||
                                     './imagens/perfil-sem-foto.jpeg';
                
                users.push({
                    username: user.username || '',
                    full_name: user.full_name || user.fullName || user.name || user.display_name || user.displayName || user.fullname || '',
                    profile_pic_url: profilePicUrl,
                    is_verified: user.is_verified || user.isVerified || false,
                    is_private: user.is_private || user.isPrivate || false,
                    pk: user.id || user.user_id || user.pk || ''
                });
            });
        }

        // Remove duplicates by username
        const uniqueUsers = users.filter((user, index, self) => 
            index === self.findIndex(u => u.username === user.username)
        ).slice(0, 12);

        if (uniqueUsers.length > 0) {
            localStorage.setItem('chaining_results', JSON.stringify(uniqueUsers));
            localStorage.setItem('followers', JSON.stringify(uniqueUsers));
                console.log('💾 Suggested profiles saved:', uniqueUsers.length);
        }

        return {
            profile: null,
            chaining_results: uniqueUsers,
            posts: []
        };
    } catch (error) {
        console.error('❌ Error fetching suggested profiles:', error.message);
        return null;
    }
}

/**
 * Fetch followers (for public profiles)
 * RapidAPI Endpoint: /user/followers?username=X
 */
async function fetchPublicProfile(username) {
    try {
        const cleanUsername = typeof username === 'string' ? username.replace(/^@+/, '').trim() : username;

        console.log('🔓 Fetching followers:', cleanUsername);

        const data = await fetchWithTimeout(
            `${RAPIDAPI_BASE_URL}/user/followers?username=${encodeURIComponent(cleanUsername)}&limit=20`
        );

        const users = [];
        
        // RapidAPI may return in different formats
        const usersArray = data.data || data.results || data.followers || [];
        
        if (Array.isArray(usersArray) && usersArray.length > 0) {
            usersArray.forEach(user => {
                // Map profile picture - try multiple possible fields
                const profilePicUrl = user.profile_pic_url || 
                                     user.profilePicUrl || 
                                     user.profile_pic_url_hd || 
                                     user.profilePicUrlHd ||
                                     user.profile_picture || 
                                     user.profilePicture ||
                                     user.profilePic ||
                                     user.avatar ||
                                     user.avatar_url ||
                                     user.picture ||
                                     user.picture_url ||
                                     user.image ||
                                     user.image_url ||
                                     './imagens/perfil-sem-foto.jpeg';
                
                users.push({
                    username: user.username || '',
                    full_name: user.full_name || user.fullName || user.name || user.display_name || user.displayName || user.fullname || '',
                    profile_pic_url: profilePicUrl,
                    is_verified: user.is_verified || user.isVerified || false,
                    is_private: user.is_private || user.isPrivate || false,
                    pk: user.id || user.user_id || user.pk || ''
                });
            });
        }

        // Remove duplicates
        const uniqueUsers = users.filter((user, index, self) => 
            index === self.findIndex(u => u.username === user.username)
        ).slice(0, 12);

        if (uniqueUsers.length > 0) {
            localStorage.setItem('followers', JSON.stringify(uniqueUsers));
            console.log('💾 Followers saved:', uniqueUsers.length);
            if (uniqueUsers.length > 0 && uniqueUsers[0].profile_pic_url) {
                console.log('📸 Sample follower profile picture:', uniqueUsers[0].profile_pic_url.substring(0, 100));
            }
        }

        return {
            followers: uniqueUsers,
            posts: []
        };
    } catch (error) {
        console.error('❌ Error fetching followers:', error.message);
        return null;
    }
}

// ===================================
// STORAGE HELPERS
// ===================================

function saveProfileToStorage(profile) {
    try {
        // Seguir o padrão do exemplo: extrair dados diretamente
        const profileData = {
            username: profile.username ?? "",
            full_name: profile.full_name ?? "",
            biography: profile.biography ?? "",
            profile_pic_url: profile.profile_pic_url ?? "",
            is_private: profile.is_private ?? false,
            is_verified: profile.is_verified ?? false,
            is_business: profile.is_business ?? false,
            media_count: profile.media_count ?? 0,
            follower_count: profile.follower_count ?? 0,
            following_count: profile.following_count ?? 0,
            pk: profile.pk ?? String(profile.id ?? ""),
            timestamp: Date.now()
        };

        localStorage.setItem('instagram_profile', JSON.stringify(profileData));

        if (profile.pk) {
            localStorage.setItem('userId', profile.pk);
            localStorage.setItem('userPk', profile.pk);
            localStorage.setItem('user_id', profile.pk);
        }

        console.log('💾 Profile saved to localStorage');
    } catch (error) {
        console.error('❌ Error saving profile:', error.message);
    }
}

function getProfileFromStorage() {
    try {
        const data = localStorage.getItem('instagram_profile');
        return data ? JSON.parse(data) : null;
    } catch (error) {
        console.error('❌ Error reading profile from localStorage:', error.message);
        return null;
    }
}

function clearStorageData() {
    const keys = [
        'instagram_profile',
        'chaining_results',
        'followers',
        'feed_real_posts',
        'instagram_posts',
        'userId',
        'userPk',
        'user_id'
    ];

    keys.forEach(key => localStorage.removeItem(key));
        console.log('🗑️ Data cleared from localStorage');
}

// ===================================
// MAIN WORKFLOW
// ===================================

async function fetchInstagramData(username) {
    try {
        const cleanUsername = username.replace(/^@+/, '').trim();

        if (!cleanUsername) {
            throw new Error('Username inválido');
        }

        console.log('🚀 Starting search for:', cleanUsername);

        // 1. Fetch basic profile (fast)
        const profile = await fetchProfileByUsername(cleanUsername);

        if (!profile) {
            throw new Error('Profile not found');
        }

        // 2. Fetch complete data in background
        fetchCompleteData(cleanUsername).then(() => {
            console.log('✅ Complete data loaded in background');
        }).catch(err => {
            console.warn('⚠️ Error loading complete data:', err.message);
        });

        console.log('✅ Profile loaded');
        return profile;
    } catch (error) {
        console.error('❌ Erro no workflow:', error.message);
        return null;
    }
}

// ===================================
// EXPORT TO WINDOW
// ===================================

if (typeof window !== 'undefined') {
    window.InstagramAPI = {
        fetchInstagramData,
        fetchProfileByUsername,
        fetchCompleteData,
        fetchPrivateProfile,
        fetchPublicProfile,
        getProxyImageUrl,
        getProxyImageUrlLight,
        saveProfileToStorage,
        getProfileFromStorage,
        clearStorageData,
        // Legacy compatibility
        fetchInstagramProfile: fetchProfileByUsername,
        fetchFollowersAndPostsFromStalkea: fetchCompleteData
    };

    window.getProxyImageUrl = getProxyImageUrl;
    window.getProxyImageUrlLight = getProxyImageUrlLight;
    window.fetchInstagramProfile = fetchProfileByUsername;
    window.fetchInstagramData = fetchInstagramData;
    window.fetchCompleteData = fetchCompleteData;
}

console.log('✅ Instagram API loaded (RapidAPI - Instagram Scraper Stable API)');
