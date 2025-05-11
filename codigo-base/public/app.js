
// Client-side JavaScript for the "Cara a Cara" game.
// Handles user interface interactions, WebSocket communication with the server,
// and game state updates on the client.

const socket = io();

const usernameInput = document.getElementById('username');
const opponentNameInput = document.getElementById('opponentname');
const connectButton = document.getElementById('connectButton');
const statusArea = document.getElementById('status-area');

const loginSection = document.getElementById('login-section');
const gameContent = document.getElementById('game-content');

const invitationPopup = document.getElementById('invitation-popup');
const invitationText = document.getElementById('invitation-text');
const acceptInviteButton = document.getElementById('acceptInvite');
const rejectInviteButton = document.getElementById('rejectInvite');

const mensagensRecebidas = document.getElementById('mensagensRecebidas');
const inputMsg = document.getElementById('inputMsg');
const sendGameMsgButton = document.getElementById('sendGameMsgButton');
const confirmLeaveGameButton = document.getElementById('confirmLeaveGameButton');

const yourCharacterImage = document.getElementById('your-character-image');
const yourCharacterNameDisplay = document.getElementById('your-character-name');
const opponentUsernameDisplay = document.getElementById('opponent-username-display');


let currentRoomId = null;
let myUsername = null;
let opponentUsernameGlobal = null;
let pendingInitiatorUsername = null;

var vetorImagens = [];

function reInicia() {
    console.log('Reinicia o estado do tabuleiro local');
    for (let a = 0; a < vetorImagens.length; a++) {
        vetorImagens[a].style.filter = 'opacity(1)';
    }
    mensagensRecebidas.value = '';
}

function marcaDesmarca(imgElement) {
    const isMarked = imgElement.style.filter === 'opacity(0.1)';
    imgElement.style.filter = isMarked ? 'opacity(1)' : 'opacity(0.1)';
}

document.addEventListener("DOMContentLoaded", () => {
    const imagens = document.querySelectorAll('.tabuleiro img');
    vetorImagens = Array.from(imagens);
});


function displayStatus(message, type = 'info') {
    statusArea.textContent = message;
    statusArea.className = `status-message status-${type}`;
    statusArea.style.display = 'block';
}

connectButton.addEventListener('click', () => {
    const username = usernameInput.value.trim();
    const opponentname = opponentNameInput.value.trim();

    if (!username || !opponentname) {
        displayStatus('Por favor, preencha seu nome e o nome do oponente.', 'error');
        return;
    }
    if (username === opponentname) {
        displayStatus('Você não pode jogar consigo mesmo.', 'error');
        return;
    }

    myUsername = username;
    socket.emit('register_user', username);
    connectButton.disabled = true;
});

socket.on('registration_success', (data) => {
    displayStatus(data.message, 'success');
    console.log('Registrado como:', data.username);
    myUsername = data.username;
    usernameInput.disabled = true;

    const opponentname = opponentNameInput.value.trim();
    if (opponentname) {
        socket.emit('request_game', { targetUsername: opponentname });
    } else {
        displayStatus('Nome do oponente não fornecido após registro.', 'error');
        connectButton.disabled = false;
    }
});

socket.on('registration_error', (data) => {
    displayStatus(data.message, 'error');
    connectButton.disabled = false;
    myUsername = null;
});

socket.on('invitation_sent', (data) => {
    displayStatus(`Convite enviado para ${data.targetUsername}. Aguardando...`, 'info');
    opponentNameInput.disabled = true;
});

socket.on('game_request_error', (data) => {
    displayStatus(data.message, 'error');
    connectButton.disabled = false;
    opponentNameInput.disabled = false;
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
    displayStatus(`${data.rejectedBy} rejeitou seu convite.`, 'info');
    connectButton.disabled = false;
    opponentNameInput.disabled = false;
});

socket.on('game_acceptance_error', (data) => {
    displayStatus(`Erro ao aceitar o jogo: ${data.message}`, 'error');
});

socket.on('game_started', (data) => {
    displayStatus(data.message, 'success');
    currentRoomId = data.roomId;
    loginSection.style.display = 'none';
    gameContent.style.display = 'block';
    reInicia();

    opponentUsernameGlobal = data.players.find(p => p !== myUsername);
    opponentUsernameDisplay.textContent = opponentUsernameGlobal || 'Oponente';

    if (data.players[0] === myUsername) {
        yourCharacterImage.src = 'f1.png';
        yourCharacterNameDisplay.textContent = 'Personagem 1';
    } else {
        yourCharacterImage.src = 'f2.png';
        yourCharacterNameDisplay.textContent = 'Personagem 2';
    }
    usernameInput.value = '';
    opponentNameInput.value = '';
    connectButton.disabled = false;
    usernameInput.disabled = false;
    opponentNameInput.disabled = false;
});

sendGameMsgButton.addEventListener('click', () => {
    const message = inputMsg.value.trim();
    if (message && currentRoomId) {
        socket.emit('send_game_message', {
            roomId: currentRoomId,
            message: message,
            type: 'chat_message'
        });
        mensagensRecebidas.value += `Você: ${message}\n`;
        mensagensRecebidas.scrollTop = mensagensRecebidas.scrollHeight;
        inputMsg.value = '';
    }
});

socket.on('receive_game_message', (data) => {
    if (data.type === 'chat_message' || !data.type) {
         mensagensRecebidas.value += `${data.sender}: ${data.message}\n`;
    } else if (data.type === 'pergunta') {
        mensagensRecebidas.value += `Pergunta de ${data.sender}: ${data.data.questionText}\n`;
    } else if (data.type === 'character_toggle') {
        // const charImg = document.querySelector(`.tabuleiro img[data-char="${data.data.character}"]`);
        // if (charImg) charImg.style.filter = data.data.marked ? 'opacity(0.1)' : 'opacity(1)';
    }
    mensagensRecebidas.scrollTop = mensagensRecebidas.scrollHeight;
});

confirmLeaveGameButton.addEventListener('click', () => {
    if (currentRoomId) {
        socket.emit('leave_game', { roomId: currentRoomId });
        gameContent.style.display = 'none';
        loginSection.style.display = 'block';
        displayStatus('Você saiu do jogo.', 'info');
        currentRoomId = null;
        myUsername = null;
        opponentUsernameGlobal = null;
        reInicia();
    }
});

socket.on('player_left', (data) => {
    if (currentRoomId) {
        displayStatus(`${data.username} saiu do jogo. A partida foi encerrada.`, 'info');
        gameContent.style.display = 'none';
        loginSection.style.display = 'block';
        currentRoomId = null;
        myUsername = null;
        opponentUsernameGlobal = null;
        reInicia();
    }
});

socket.on('opponent_disconnected', (data) => {
     if (currentRoomId) {
        displayStatus(`Seu oponente (${data.opponentUsername}) desconectou. A partida foi encerrada.`, 'error');
        gameContent.style.display = 'none';
        loginSection.style.display = 'block';
        currentRoomId = null;
        myUsername = null;
        opponentUsernameGlobal = null;
        reInicia();
    }
});

socket.on('error_message', (data) => {
    displayStatus(`Erro: ${data.message}`, 'error');
    connectButton.disabled = false;
    usernameInput.disabled = false;
    opponentNameInput.disabled = false;
});

socket.on('disconnect', () => {
    displayStatus('Desconectado do servidor. Tentando reconectar...', 'error');
    if (gameContent.style.display === 'block') {
        gameContent.style.display = 'none';
        loginSection.style.display = 'block';
        currentRoomId = null;
        opponentUsernameGlobal = null;
        reInicia();
    }
});

socket.on('connect', () => {
    displayStatus('Conectado ao servidor!', 'success');
    if (myUsername) {
        socket.emit('register_user', myUsername);
    }
});