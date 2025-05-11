// --- START OF FILE servidor.js ---
// Server-side Node.js application for the "Cara a Cara" game.
// Uses Express for HTTP server and Socket.IO for real-time WebSocket communication.
// Manages user connections, game rooms, and relays messages between players.

const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'jogo.html'));
});

app.get('/jogo', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'jogo.html'));
});

const activeUsers = {};
const gameRooms = {};

io.on('connection', (socket) => {
    console.log(`Novo socket conectado: ${socket.id}`);
    let currentUsername = null;

    socket.on('register_user', (username) => {
        if (!username || typeof username !== 'string' || username.trim() === '') {
            socket.emit('registration_error', { message: 'Nome de usuário inválido.' });
            return;
        }
        const trimmedUsername = username.trim();
        if (activeUsers[trimmedUsername]) {
            socket.emit('registration_error', { message: `Usuário '${trimmedUsername}' já está conectado. Escolha outro nome.` });
            return;
        }

        currentUsername = trimmedUsername;
        activeUsers[currentUsername] = socket;
        socket.emit('registration_success', { username: currentUsername, message: `Você foi registrado como ${currentUsername}` });
        console.log(`Socket ${socket.id} registrado como usuário: ${currentUsername}`);
    });

    socket.on('request_game', ({ targetUsername }) => {
        if (!currentUsername) {
            socket.emit('error_message', { message: 'Você precisa se registrar primeiro.' });
            return;
        }
        if (!targetUsername || typeof targetUsername !== 'string' || targetUsername.trim() === '' || currentUsername === targetUsername.trim()) {
            socket.emit('game_request_error', { message: 'Nome do oponente inválido ou igual ao seu.' });
            return;
        }

        const trimmedTargetUsername = targetUsername.trim();
        console.log(`Usuário ${currentUsername} quer jogar com ${trimmedTargetUsername}`);
        const initiatorSocket = activeUsers[currentUsername];
        const targetSocket = activeUsers[trimmedTargetUsername];

        if (targetSocket) {
            console.log(`Enviando convite de ${currentUsername} para ${trimmedTargetUsername}`);
            targetSocket.emit('game_invitation', { initiatorUsername: currentUsername });
            initiatorSocket.emit('invitation_sent', { targetUsername: trimmedTargetUsername, message: `Convite enviado para ${trimmedTargetUsername}. Aguardando resposta.` });
        } else {
            console.log(`Usuário ${trimmedTargetUsername} não está online ou não encontrado.`);
            initiatorSocket.emit('game_request_error', { message: `Usuário ${trimmedTargetUsername} não está online.` });
        }
    });

    socket.on('accept_game', ({ initiatorUsername }) => {
        if (!currentUsername) {
            socket.emit('error_message', { message: 'Você precisa se registrar primeiro para aceitar um jogo.' });
            return;
        }
        const acceptorUsername = currentUsername;
        const initiatorSocket = activeUsers[initiatorUsername];
        const acceptorSocket = activeUsers[acceptorUsername];

        if (initiatorSocket && acceptorSocket) {
            const roomId = `game_${initiatorUsername}_vs_${acceptorUsername}_${Date.now()}`;
            console.log(`Jogo aceito entre ${initiatorUsername} e ${acceptorUsername}. Criando sala: ${roomId}`);

            initiatorSocket.join(roomId);
            acceptorSocket.join(roomId);

            gameRooms[roomId] = {
                players: [initiatorUsername, acceptorUsername],
                sockets: [initiatorSocket, acceptorSocket],
            };
            
            io.to(roomId).emit('game_started', { 
                roomId: roomId, 
                players: [initiatorUsername, acceptorUsername],
                message: `Jogo iniciado entre ${initiatorUsername} e ${acceptorUsername}!`
            });
        } else {
            const errorMessage = !initiatorSocket ? `Usuário ${initiatorUsername} não está mais online.` : `Erro ao encontrar um dos jogadores.`;
            if (acceptorSocket) acceptorSocket.emit('game_acceptance_error', { message: errorMessage });
            else if (initiatorSocket) initiatorSocket.emit('game_acceptance_error', { message: `Oponente ${acceptorUsername} não encontrado.` });
            console.log(`Erro ao aceitar jogo: um dos jogadores (${initiatorUsername} ou ${acceptorUsername}) não encontrado.`);
        }
    });

    socket.on('reject_game', ({ initiatorUsername }) => {
        if (!currentUsername) {
            socket.emit('error_message', { message: 'Você precisa se registrar para rejeitar um jogo.' });
            return;
        }
        const initiatorSocket = activeUsers[initiatorUsername];
        if (initiatorSocket) {
            initiatorSocket.emit('invitation_rejected', {
                rejectedBy: currentUsername,
                message: `Seu convite para ${currentUsername} foi rejeitado.`
            });
        }
        console.log(`${currentUsername} rejeitou o convite de ${initiatorUsername}`);
    });

    socket.on('send_game_message', ({ roomId, message, type, data }) => {
        if (!currentUsername) {
            socket.emit('error_message', { message: 'Você precisa estar registrado para interagir no jogo.' });
            return;
        }
        if (gameRooms[roomId] && gameRooms[roomId].players.includes(currentUsername)) {
            socket.to(roomId).emit('receive_game_message', { 
                sender: currentUsername, 
                message: message,
                type: type,
                data: data
            });
        } else {
            socket.emit('error_message', {message: "Você não está nesta sala, a sala não existe, ou você não está registrado."});
        }
    });
    
    socket.on('leave_game', ({ roomId }) => {
        if (!currentUsername) {
            socket.emit('error_message', { message: 'Você precisa estar registrado para sair de um jogo.' });
            return;
        }
        if (gameRooms[roomId] && gameRooms[roomId].players.includes(currentUsername)) {
            socket.leave(roomId);
            console.log(`Usuário ${currentUsername} saiu da sala ${roomId}`);
            
            socket.to(roomId).emit('player_left', { username: currentUsername, message: `${currentUsername} saiu do jogo.` });

            const room = gameRooms[roomId];
            const remainingPlayer = room.players.find(p => p !== currentUsername);
            if(remainingPlayer && activeUsers[remainingPlayer]) {
                activeUsers[remainingPlayer].leave(roomId);
            }
            delete gameRooms[roomId]; 
            console.log(`Sala ${roomId} removida.`);
        }
    });

    socket.on('disconnect', () => {
        console.log(`Socket ${socket.id} (usuário: ${currentUsername || 'não registrado'}) desconectou-se.`);
        if (currentUsername) {
            const disconnectedUser = currentUsername;
            delete activeUsers[disconnectedUser];

            for (const roomId in gameRooms) {
                const room = gameRooms[roomId];
                if (room.players.includes(disconnectedUser)) {
                    console.log(`Usuário ${disconnectedUser} estava na sala ${roomId} e desconectou.`);
                    
                    const otherPlayerSocket = room.sockets.find(s => s.id !== socket.id);
                    if(otherPlayerSocket){
                        otherPlayerSocket.emit('opponent_disconnected', { 
                            opponentUsername: disconnectedUser, 
                            message: `Seu oponente (${disconnectedUser}) desconectou-se.` 
                        });
                        otherPlayerSocket.leave(roomId);
                    }
                    
                    delete gameRooms[roomId];
                    console.log(`Sala ${roomId} removida devido à desconexão de ${disconnectedUser}.`);
                    break; 
                }
            }
            currentUsername = null;
        }
    });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
    console.log(`🚀 Servidor Cara a Cara em http://localhost:${PORT}`);
});