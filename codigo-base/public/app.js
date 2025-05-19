const socket = io();

// Authentication elements
const authSection = document.getElementById('auth-section');
const userSelectionSection = document.getElementById('user-selection-section');
const gameContent = document.getElementById('game-content');

// Auth tab elements
const loginTabBtn = document.getElementById('loginTabBtn');
const registerTabBtn = document.getElementById('registerTabBtn');
const loginTab = document.getElementById('loginTab');
const registerTab = document.getElementById('registerTab');

// Login elements
const loginUsername = document.getElementById('loginUsername');
const loginPassword = document.getElementById('loginPassword');
const loginButton = document.getElementById('loginButton');

// Register elements
const registerUsername = document.getElementById('registerUsername');
const registerPassword = document.getElementById('registerPassword');
const confirmPassword = document.getElementById('confirmPassword');
const registerButton = document.getElementById('registerButton');

// Auth status
const authStatusArea = document.getElementById('auth-status-area');

// User selection elements
const loggedUsername = document.getElementById('loggedUsername');
const onlineUsersList = document.getElementById('onlineUsersList');
const challengeManualButton = document.getElementById('challengeManualButton');
const refreshUsersButton = document.getElementById('refreshUsersButton');
const logoutButton = document.getElementById('logoutButton');
const selectionStatusArea = document.getElementById('selection-status-area');

// Game elements
const invitationPopup = document.getElementById('invitation-popup');
const invitationText = document.getElementById('invitation-text');
const acceptInviteButton = document.getElementById('acceptInvite');
const rejectInviteButton = document.getElementById('rejectInvite');

const mensagensRecebidas = document.getElementById('mensagensRecebidas');
const inputMsg = document.getElementById('inputMsg');
const sendGameMsgButton = document.getElementById('sendGameMsgButton');
const confirmLeaveGameButton = document.getElementById('confirmLeaveGameButton');

const yourCharacterImage = document.getElementById('your-character-image');
const opponentUsernameDisplay = document.getElementById('opponent-username-display');
const characterGuessSelect = document.getElementById('characterGuessSelect');
const makeGuessButton = document.getElementById('makeGuessButton');

// Global variables
let currentRoomId = null;
let myUsername = null;
let myCharacterId = null;
let opponentUsernameGlobal = null;
let pendingInitiatorUsername = null;

const characterData = [
    { id: 'alessandro', name: 'Alessandro' }, { id: 'alfredo', name: 'Alfredo' },
    { id: 'anita', name: 'Anita' }, { id: 'anna', name: 'Anna' },
    { id: 'bernardo', name: 'Bernardo' }, { id: 'carlo', name: 'Carlo' },
    { id: 'chiara', name: 'Chiara' }, { id: 'davide', name: 'Davide' },
    { id: 'ernesto', name: 'Ernesto' }, { id: 'filippo', name: 'Filippo' },
    { id: 'giacomo', name: 'Giacomo' }, { id: 'giorgio', name: 'Giorgio' },
    { id: 'giuseppe', name: 'Giuseppe' }, { id: 'guglielmo', name: 'Guglielmo' },
    { id: 'manuele', name: 'Manuele' }, { id: 'marco', name: 'Marco' },
    { id: 'maria', name: 'Maria' }, { id: 'pietro', name: 'Pietro' },
    { id: 'poolo', name: 'Poolo' }, { id: 'riccardo', name: 'Riccardo' },
    { id: 'roberto', name: 'Roberto' }, { id: 'samuele', name: 'Samuele' },
    { id: 'susanna', name: 'Susanna' }, { id: 'tommaso', name: 'Tommaso' }
];

var vetorImagens = [];

// Utility functions
function capitalizeFirstLetter(string) {
    if (!string) return '';
    return string.charAt(0).toUpperCase() + string.slice(1);
}

function showAuthStatus(message, type = 'info') {
    authStatusArea.textContent = message;
    authStatusArea.className = `status-message status-${type}`;
    authStatusArea.style.display = 'block';
}

function showSelectionStatus(message, type = 'info') {
    selectionStatusArea.textContent = message;
    selectionStatusArea.className = `status-message status-${type}`;
    selectionStatusArea.style.display = 'block';
}

function appendGameMessage(text) {
    mensagensRecebidas.value += text + '\n';
    mensagensRecebidas.scrollTop = mensagensRecebidas.scrollHeight;
}

function reInicia() {
    console.log('Reinicia o estado do tabuleiro local');
    for (let a = 0; a < vetorImagens.length; a++) {
        vetorImagens[a].style.filter = 'opacity(1)';
    }
    mensagensRecebidas.value = '';
    myCharacterId = null;
    yourCharacterImage.src = '';
    yourCharacterImage.alt = 'Seu Personagem';
    characterGuessSelect.value = '';
    makeGuessButton.disabled = false;
    sendGameMsgButton.disabled = false;
    inputMsg.disabled = false;
}

function marcaDesmarca(imgElement) {
    const isMarked = imgElement.style.filter === 'opacity(0.1)';
    imgElement.style.filter = isMarked ? 'opacity(1)' : 'opacity(0.1)';
}

function populateGuessSelect() {
    characterGuessSelect.innerHTML = '<option selected disabled value="">Escolha um personagem...</option>';
    characterData.forEach(char => {
        const option = document.createElement('option');
        option.value = char.id;
        option.textContent = char.name;
        characterGuessSelect.appendChild(option);
    });
}

function showSection(sectionToShow) {
    authSection.style.display = 'none';
    userSelectionSection.style.display = 'none';
    gameContent.style.display = 'none';
    
    sectionToShow.style.display = 'block';
}

function clearAuthInputs() {
    loginUsername.value = '';
    loginPassword.value = '';
    registerUsername.value = '';
    registerPassword.value = '';
    confirmPassword.value = '';
}

function updateOnlineUsersList(users) {
    
    if (users.length === 0) {
        onlineUsersList.innerHTML = '<p class="text-muted">Nenhum usuário online para desafiar</p>';
        return;
    }

    onlineUsersList.innerHTML = '';
    users.forEach(username => {
        const userItem = document.createElement('div');
        userItem.className = 'online-user-item';
        userItem.innerHTML = `
            <span>${username}</span>
            <button class="btn btn-primary btn-sm" onclick="challengeUser('${username}')">
                <i class="bi bi-play-fill"></i> Desafiar
            </button>
        `;
        onlineUsersList.appendChild(userItem);
    });
}

function challengeUser(username) {
    if (username && username !== myUsername) {
        socket.emit('request_game', { targetUsername: username });
        showSelectionStatus(`Convite enviado para ${username}. Aguardando resposta...`, 'info');
    }
}

// Initialize DOM elements
document.addEventListener("DOMContentLoaded", () => {
    const imagens = document.querySelectorAll('.tabuleiro img');
    vetorImagens = Array.from(imagens);
    populateGuessSelect();
    
    // Show auth section by default
    showSection(authSection);
});

// Auth tab switching
loginTabBtn.addEventListener('click', () => {
    loginTabBtn.classList.add('active');
    loginTabBtn.classList.remove('btn-outline-primary');
    loginTabBtn.classList.add('btn-primary');
    
    registerTabBtn.classList.remove('active');
    registerTabBtn.classList.add('btn-outline-secondary');
    registerTabBtn.classList.remove('btn-secondary');
    
    loginTab.classList.add('active');
    registerTab.classList.remove('active');
    
    authStatusArea.style.display = 'none';
});

registerTabBtn.addEventListener('click', () => {
    registerTabBtn.classList.add('active');
    registerTabBtn.classList.remove('btn-outline-secondary');
    registerTabBtn.classList.add('btn-secondary');
    
    loginTabBtn.classList.remove('active');
    loginTabBtn.classList.add('btn-outline-primary');
    loginTabBtn.classList.remove('btn-primary');
    
    registerTab.classList.add('active');
    loginTab.classList.remove('active');
    
    authStatusArea.style.display = 'none';
});

// Login functionality
loginButton.addEventListener('click', async () => {
    const username = loginUsername.value.trim();
    const password = loginPassword.value.trim();

    if (!username || !password) {
        showAuthStatus('Por favor, preencha todos os campos.', 'error');
        return;
    }

    loginButton.disabled = true;
    loginButton.textContent = 'Entrando...';

    try {
        const response = await fetch('/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password }),
        });

        const data = await response.json();

        if (data.success) {
            myUsername = data.username;
            loggedUsername.textContent = myUsername;
            
            // Register user with socket
            socket.emit('register_user', myUsername);
            
            showAuthStatus(data.message, 'success');
            clearAuthInputs();
            
            setTimeout(() => {
                showSection(userSelectionSection);
                // Request online users list
                socket.emit('request_online_users');
            }, 1500);
        } else {
            showAuthStatus(data.message, 'error');
        }
    } catch (error) {
        console.error('Login error:', error);
        showAuthStatus('Erro de conexão. Tente novamente.', 'error');
    } finally {
        loginButton.disabled = false;
        loginButton.textContent = 'Entrar';
    }
});

// Register functionality
registerButton.addEventListener('click', async () => {
    const username = registerUsername.value.trim();
    const password = registerPassword.value.trim();
    const confirmPass = confirmPassword.value.trim();

    if (!username || !password || !confirmPass) {
        showAuthStatus('Por favor, preencha todos os campos.', 'error');
        return;
    }

    if (password !== confirmPass) {
        showAuthStatus('As senhas não coincidem.', 'error');
        return;
    }

    if (password.length < 6) {
        showAuthStatus('A senha deve ter pelo menos 6 caracteres.', 'error');
        return;
    }

    registerButton.disabled = true;
    registerButton.textContent = 'Criando conta...';

    try {
        const response = await fetch('/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password }),
        });

        const data = await response.json();

        if (data.success) {
            showAuthStatus(`${data.message} Agora você pode fazer login.`, 'success');
            clearAuthInputs();
            
            // Switch to login tab
            setTimeout(() => {
                loginTabBtn.click();
                loginUsername.value = username;
                loginUsername.focus();
            }, 2000);
        } else {
            showAuthStatus(data.message, 'error');
        }
    } catch (error) {
        console.error('Register error:', error);
        showAuthStatus('Erro de conexão. Tente novamente.', 'error');
    } finally {
        registerButton.disabled = false;
        registerButton.textContent = 'Criar Conta';
    }
});

// Enter key handlers for auth forms
loginPassword.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        loginButton.click();
    }
});

confirmPassword.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        registerButton.click();
    }
});

refreshUsersButton.addEventListener('click', () => {
    socket.emit('request_online_users');
    showSelectionStatus('Atualizando lista de usuários...', 'info');
});

logoutButton.addEventListener('click', () => {
    myUsername = null;
    currentRoomId = null;
    opponentUsernameGlobal = null;
    socket.disconnect();
    socket.connect();
    clearAuthInputs();
    showSection(authSection);
    showAuthStatus('Logout realizado com sucesso.', 'success');
});

// Socket event handlers
socket.on('registration_success', (data) => {
    console.log('Socket registration successful:', data.username);
    // Request online users after successful socket registration
    if (userSelectionSection.style.display !== 'none') {
        socket.emit('request_online_users');
    }
});

socket.on('registration_error', (data) => {
    showSelectionStatus(`Erro de conexão: ${data.message}`, 'error');
    // If there's a socket registration error, go back to auth
    setTimeout(() => {
        showSection(authSection);
        showAuthStatus('Erro de conexão. Faça login novamente.', 'error');
        myUsername = null;
    }, 3000);
});

socket.on('online_users_update', (users) => {
    updateOnlineUsersList(users);
    if (selectionStatusArea.textContent.includes('Atualizando')) {
        selectionStatusArea.style.display = 'none';
    }
});

socket.on('invitation_sent', (data) => {
    showSelectionStatus(`Convite enviado para ${data.targetUsername}. Aguardando resposta...`, 'info');
});

socket.on('game_request_error', (data) => {
    showSelectionStatus(data.message, 'error');
});

socket.on('game_invitation', (data) => {
    pendingInitiatorUsername = data.initiatorUsername;
    invitationText.textContent = `${pendingInitiatorUsername} convidou você para jogar!`;
    invitationPopup.style.display = 'block';
});

acceptInviteButton.addEventListener('click', () => {
    if (pendingInitiatorUsername) {
        socket.emit('accept_game', { initiatorUsername: pendingInitiatorUsername });
        invitationPopup.style.display = 'none';
        pendingInitiatorUsername = null;
    }
});

rejectInviteButton.addEventListener('click', () => {
    if (pendingInitiatorUsername) {
        socket.emit('reject_game', { initiatorUsername: pendingInitiatorUsername });
        invitationPopup.style.display = 'none';
        pendingInitiatorUsername = null;
    }
});

socket.on('invitation_rejected', (data) => {
    showSelectionStatus(`${data.rejectedBy} rejeitou seu convite.`, 'info');
});

socket.on('game_acceptance_error', (data) => {
    showSelectionStatus(`Erro ao aceitar o jogo: ${data.message}`, 'error');
});

socket.on('game_started', (data) => {
    showSelectionStatus(data.message, 'success');
    currentRoomId = data.roomId;
    showSection(gameContent);
    reInicia();

    opponentUsernameGlobal = data.players.find(p => p !== myUsername);
    opponentUsernameDisplay.textContent = opponentUsernameGlobal || 'Oponente';

    if (data.playerCharacters && data.playerCharacters[myUsername]) {
        myCharacterId = data.playerCharacters[myUsername];
        yourCharacterImage.src = `${myCharacterId}.png`;
        yourCharacterImage.alt = `Seu personagem: ${capitalizeFirstLetter(myCharacterId)}`;
        appendGameMessage(`*** Seu personagem secreto foi definido! ***`);
    } else {
        appendGameMessage(`*** Erro ao definir seu personagem! ***`);
        console.error("Character assignment missing for user:", myUsername, data);
    }
});

// Game functionality
sendGameMsgButton.addEventListener('click', () => {
    const message = inputMsg.value.trim();
    if (message && currentRoomId) {
        socket.emit('send_game_message', {
            roomId: currentRoomId,
            message: message,
            type: 'chat_message'
        });
        appendGameMessage(`Você: ${message}`);
        inputMsg.value = '';
    }
});

inputMsg.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        sendGameMsgButton.click();
    }
});

makeGuessButton.addEventListener('click', () => {
    const guessedCharacterId = characterGuessSelect.value;
    if (!guessedCharacterId) {
        appendGameMessage('*** Por favor, escolha um personagem para palpitar. ***');
        return;
    }
    if (currentRoomId) {
        const guessedCharacterName = capitalizeFirstLetter(guessedCharacterId);
        appendGameMessage(`Você palpitou: ${guessedCharacterName}`);
        socket.emit('make_guess', {
            roomId: currentRoomId,
            guessedCharacter: guessedCharacterId
        });
    }
});

socket.on('receive_game_message', (data) => {
    if (data.type === 'chat_message') {
         appendGameMessage(`${data.sender}: ${data.message}`);
    } else if (data.type === 'pergunta') {
        appendGameMessage(`Pergunta de ${data.sender}: ${data.data.questionText}`);
    }
});

socket.on('guess_result', (data) => {
    const guessedCharName = capitalizeFirstLetter(data.guessedCharacter);
    if (data.correct) {
        appendGameMessage(`*** ${data.guesser} acertou! O personagem era ${guessedCharName}. Fim de jogo! ***`);
        makeGuessButton.disabled = true;
        sendGameMsgButton.disabled = true;
        inputMsg.disabled = true;
    } else {
        appendGameMessage(`*** ${data.guesser} palpitou ${guessedCharName}, mas estava errado! ***`);
    }
});

confirmLeaveGameButton.addEventListener('click', () => {
    if (currentRoomId) {
        socket.emit('leave_game', { roomId: currentRoomId });
        showSection(userSelectionSection);
        showSelectionStatus('Você saiu do jogo.', 'info');
        currentRoomId = null;
        opponentUsernameGlobal = null;
        reInicia();
        // Request updated users list
        socket.emit('request_online_users');
    }
});

socket.on('player_left', (data) => {
    if (currentRoomId) {
        appendGameMessage(`*** ${data.username} saiu do jogo. A partida foi encerrada. ***`);
        showSection(userSelectionSection);
        showSelectionStatus(`${data.username} saiu do jogo. A partida foi encerrada.`, 'info');
        currentRoomId = null;
        opponentUsernameGlobal = null;
        reInicia();
        // Request updated users list
        socket.emit('request_online_users');
    }
});

socket.on('opponent_disconnected', (data) => {
     if (currentRoomId) {
        appendGameMessage(`*** Seu oponente (${data.opponentUsername}) desconectou. A partida foi encerrada. ***`);
        showSection(userSelectionSection);
        showSelectionStatus(`Seu oponente (${data.opponentUsername}) desconectou. A partida foi encerrada.`, 'error');
        currentRoomId = null;
        opponentUsernameGlobal = null;
        reInicia();
        // Request updated users list
        socket.emit('request_online_users');
    }
});

socket.on('error_message', (data) => {
    if (gameContent.style.display !== 'none') {
        appendGameMessage(`*** Erro do servidor: ${data.message} ***`);
    } else if (userSelectionSection.style.display !== 'none') {
        showSelectionStatus(`Erro: ${data.message}`, 'error');
    } else {
        showAuthStatus(`Erro: ${data.message}`, 'error');
    }
});

socket.on('disconnect', () => {
    if (gameContent.style.display !== 'none') {
        appendGameMessage('*** Desconectado do servidor... ***');
        showSection(userSelectionSection);
        showSelectionStatus('Desconectado do servidor. Tentando reconectar...', 'error');
        currentRoomId = null;
        opponentUsernameGlobal = null;
        reInicia();
    } else if (userSelectionSection.style.display !== 'none') {
        showSelectionStatus('Desconectado do servidor. Tentando reconectar...', 'error');
    } else {
        showAuthStatus('Desconectado do servidor. Tentando reconectar...', 'error');
    }
});

socket.on('connect', () => {
    if (myUsername) {
        console.log('Reconnected! Re-registering user:', myUsername);
        socket.emit('register_user', myUsername);
        
        if (userSelectionSection.style.display !== 'none') {
            showSelectionStatus('Reconectado ao servidor!', 'success');
            // Request updated users list after reconnection
            setTimeout(() => {
                socket.emit('request_online_users');
            }, 1000);
        } else if (gameContent.style.display !== 'none') {
            appendGameMessage('*** Reconectado ao servidor! ***');
        } else {
            showAuthStatus('Conectado ao servidor!', 'success');
        }
    } else {
        if (authSection.style.display !== 'none') {
            showAuthStatus('Conectado ao servidor!', 'success');
        }
    }
});

// Make challengeUser globally accessible for inline onclick handlers
window.challengeUser = challengeUser;