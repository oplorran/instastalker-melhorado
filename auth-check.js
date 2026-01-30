// ============================================
// SIMPLE AUTHENTICATION CHECK
// Checks if the user confirmed Instagram before accessing pages
// ============================================

(function() {
    // Check if on home page (don't redirect from there)
    const currentPage = window.location.pathname;
    if (currentPage.includes('inicio1.html') || currentPage.includes('index.html')) {
        return; // Allow access to home page
    }

    // Check if Instagram username is saved
    const espionadoUsername = localStorage.getItem('espionado_username');
    
    if (!espionadoUsername) {
        // Check if on localhost/local network (allow access without username for testing)
        const isLocalhost = window.location.hostname === 'localhost' || 
                           window.location.hostname === '127.0.0.1' ||
                           window.location.hostname.includes('manus.computer') ||
                           window.location.hostname.includes('192.168.') ||
                           window.location.hostname.includes('10.0.');
        
        if (!isLocalhost) {
            // No username saved and NOT on localhost - redirect to home
            console.log('⚠️ User did not confirm Instagram. Redirecting to home...');
            window.location.href = 'inicio1.html';
            return;
        } else {
            console.log('🔧 [DEV MODE] Localhost/local network detected - allowing access without username');
        }
    } else {
        // Has saved username - allow normal access
        console.log('✅ User authenticated:', espionadoUsername);
    }
})();
