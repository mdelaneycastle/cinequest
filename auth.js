let currentUser = null;

function handleCredentialResponse(response) {
    const responsePayload = decodeJwtResponse(response.credential);
    
    currentUser = {
        email: responsePayload.email,
        name: responsePayload.name,
        picture: responsePayload.picture,
        sub: responsePayload.sub
    };
    
    document.getElementById('userName').textContent = currentUser.name;
    document.getElementById('userDisplay').classList.remove('hidden');
    document.getElementById('googleSignIn').style.display = 'none';
    document.getElementById('streakDisplay').classList.remove('hidden');
    
    saveUserToSupabase(currentUser);
    loadUserStats();
}

function decodeJwtResponse(token) {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    
    return JSON.parse(jsonPayload);
}

document.getElementById('signOutBtn')?.addEventListener('click', () => {
    google.accounts.id.disableAutoSelect();
    currentUser = null;
    
    document.getElementById('userDisplay').classList.add('hidden');
    document.getElementById('googleSignIn').style.display = 'block';
    document.getElementById('streakDisplay').classList.add('hidden');
    
    location.reload();
});

window.onload = function() {
    google.accounts.id.initialize({
        client_id: config.GOOGLE_CLIENT_ID,
        callback: handleCredentialResponse,
        auto_select: false,
        cancel_on_tap_outside: false
    });
    
    google.accounts.id.renderButton(
        document.getElementById('googleSignIn'),
        { 
            theme: 'filled_black',
            size: 'large',
            type: 'standard',
            text: 'continue_with',
            shape: 'rectangular',
            logo_alignment: 'left',
            width: 250
        }
    );
    
    google.accounts.id.prompt();
};