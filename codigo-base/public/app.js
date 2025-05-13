
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
const opponentUsernameDisplay = document.getElementById('opponent-username-display');
const characterGuessSelect = document.getElementById('characterGuessSelect');
const makeGuessButton = document.getElementById('makeGuessButton');


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
    { id: 'poolo', name: 'Poolo' },
    { id: 'riccardo', name: 'Riccardo' }, { id: 'roberto', name: 'Roberto' },
    { id: 'samuele', name: 'Samuele' }, { id: 'susanna', name: 'Susanna' },
    { id: 'tommaso', name: 'Tommaso' }
];


var vetorImagens = [];

function capitalizeFirstLetter(string) {
    if (!string) return '';
    return string.charAt(0).toUpperCase() + string.slice(1);
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

document.addEventListener("DOMContentLoaded", () => {
    const imagens = document.querySelectorAll('.tabuleiro img');
    vetorImagens = Array.from(imagens);
    populateGuessSelect();
});


function displayStatus(message, type = 'info') {
    statusArea.textContent = message;
    statusArea.className = `status-message status-${type}`;
    statusArea.style.display = 'block';
}

function appendGameMessage(text) {
    mensagensRecebidas.value += text + '\n';
    mensagensRecebidas.scrollTop = mensagensRecebidas.scrollHeight;
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

    if (data.playerCharacters && data.playerCharacters[myUsername]) {
        myCharacterId = data.playerCharacters[myUsername];
        yourCharacterImage.src = `${myCharacterId}.png`;
        yourCharacterImage.alt = `Seu personagem: ${capitalizeFirstLetter(myCharacterId)}`;
        appendGameMessage(`*** Seu personagem secreto foi definido! ***`);
    } else {
        appendGameMessage(`*** Erro ao definir seu personagem! ***`);
        console.error("Character assignment missing for user:", myUsername, data);
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
        appendGameMessage(`Você: ${message}`);
        inputMsg.value = '';
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
        appendGameMessage(`*** ${data.username} saiu do jogo. A partida foi encerrada. ***`);
        displayStatus(`${data.username} saiu do jogo. A partida foi encerrada.`, 'info');
        gameContent.style.display = 'none';
        loginSection.style.display = 'block';
        currentRoomId = null;
        opponentUsernameGlobal = null;
        reInicia();
    }
});

socket.on('opponent_disconnected', (data) => {
     if (currentRoomId) {
        appendGameMessage(`*** Seu oponente (${data.opponentUsername}) desconectou. A partida foi encerrada. ***`);
        displayStatus(`Seu oponente (${data.opponentUsername}) desconectou. A partida foi encerrada.`, 'error');
        gameContent.style.display = 'none';
        loginSection.style.display = 'block';
        currentRoomId = null;
        opponentUsernameGlobal = null;
        reInicia();
    }
});

socket.on('error_message', (data) => {
    displayStatus(`Erro: ${data.message}`, 'error');
    appendGameMessage(`*** Erro do servidor: ${data.message} ***`);
    if (loginSection.style.display !== 'none') {
        connectButton.disabled = false;
        usernameInput.disabled = false;
        opponentNameInput.disabled = false;
    }
});

socket.on('disconnect', () => {
    displayStatus('Desconectado do servidor. Tentando reconectar...', 'error');
    if (gameContent.style.display === 'block') {
        appendGameMessage('*** Desconectado do servidor... ***');
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
        appendGameMessage('*** Reconectado! Registrando novamente... ***');
        socket.emit('register_user', myUsername);
    } else {
         appendGameMessage('*** Conectado ao servidor! ***');
    }
});