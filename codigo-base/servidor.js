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

const characterList = [
    'alessandro', 'alfredo', 'anita', 'anna', 'bernardo', 'carlo',
    'chiara', 'davide', 'ernesto', 'filippo', 'giacomo', 'giorgio',
    'giuseppe', 'guglielmo', 'manuele', 'marco', 'maria', 'pietro',
    'poolo', 'riccardo', 'roberto', 'samuele', 'susanna', 'tommaso'
];


function assignCharacters(players) {
    const shuffled = [...characterList].sort(() => 0.5 - Math.random());
    const assignments = {};
    if (players && players.length >= 2) {
        assignments[players[0]] = shuffled[0];
        assignments[players[1]] = shuffled[1];
    } else {
        console.error("Cannot assign characters: Not enough players.", players);
    }
    return assignments;
}


io.on('connection', (socket) => {
    console.log(`Novo socket conectado: ${socket.id}`);
    let currentUsername = null;

    socket.on('register_user', (username) => {
        if (!username || typeof username !== 'string' || username.trim() === '') {
            socket.emit('registration_error', { message: 'Nome de usuário inválido.' });
            return;
        }
        const trimmedUsername = username.trim();
        if (activeUsers[trimmedUsername] && activeUsers[trimmedUsername].id !== socket.id) {
             socket.emit('registration_error', { message: `Usuário '${trimmedUsername}' já está conectado. Escolha outro nome.` });
             return;
        }

        currentUsername = trimmedUsername;
        activeUsers[currentUsername] = socket;
        socket.emit('registration_success', { username: currentUsername, message: `Você foi registrado como ${currentUsername}` });
        console.log(`Socket ${socket.id} registrado como usuário: ${currentUsername}`);

        for (const roomId in gameRooms) {
            const room = gameRooms[roomId];
            if (room.players.includes(currentUsername) && !room.sockets.some(s => s.id === socket.id)) {
                console.log(`Re-adicionando ${currentUsername} à sala ${roomId}`);
                socket.join(roomId);
                room.sockets = room.sockets.filter(s => s.username !== currentUsername);
                room.sockets.push({ id: socket.id, username: currentUsername });
                break;
            }
        }
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
            if (initiatorSocket) {
                initiatorSocket.emit('invitation_sent', { targetUsername: trimmedTargetUsername, message: `Convite enviado para ${trimmedTargetUsername}. Aguardando resposta.` });
            }
        } else {
            console.log(`Usuário ${trimmedTargetUsername} não está online ou não encontrado.`);
             if (initiatorSocket) {
                initiatorSocket.emit('game_request_error', { message: `Usuário ${trimmedTargetUsername} não está online.` });
             }
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

            const players = [initiatorUsername, acceptorUsername];
            const assignedCharacters = assignCharacters(players);

            if (!assignedCharacters[players[0]] || !assignedCharacters[players[1]]) {
                 console.error(`Falha ao atribuir personagens para a sala ${roomId}`, players);
                 initiatorSocket.emit('error_message', { message: 'Erro interno ao iniciar o jogo (atribuição de personagem).' });
                 acceptorSocket.emit('error_message', { message: 'Erro interno ao iniciar o jogo (atribuição de personagem).' });
                 initiatorSocket.leave(roomId);
                 acceptorSocket.leave(roomId);
                 return;
            }


            gameRooms[roomId] = {
                players: players,
                sockets: [
                    { id: initiatorSocket.id, username: initiatorUsername },
                    { id: acceptorSocket.id, username: acceptorUsername }
                ],
                characters: assignedCharacters,
                gameOver: false
            };

            console.log(`Personagens atribuídos para ${roomId}:`, assignedCharacters);

            io.to(roomId).emit('game_started', {
                roomId: roomId,
                players: players,
                playerCharacters: assignedCharacters,
                message: `Jogo iniciado entre ${initiatorUsername} e ${acceptorUsername}!`
            });
        } else {
            const errorMessage = !initiatorSocket ? `Usuário ${initiatorUsername} não está mais online.` : `Erro ao encontrar um dos jogadores.`;
            if (acceptorSocket) acceptorSocket.emit('game_acceptance_error', { message: errorMessage });
            if (initiatorSocket) initiatorSocket.emit('game_acceptance_error', { message: `Oponente ${acceptorUsername} não encontrado ou desconectou.` });
            console.log(`Erro ao aceitar jogo: um dos jogadores (${initiatorUsername} ou ${acceptorUsername}) não encontrado/conectado.`);
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
        const room = gameRooms[roomId];
        if (room && room.players.includes(currentUsername) && !room.gameOver) {
            socket.to(roomId).emit('receive_game_message', {
                sender: currentUsername,
                message: message,
                type: type,
                data: data
            });
        } else if (room && room.gameOver) {
             socket.emit('error_message', {message: "O jogo já terminou."});
        } else {
            socket.emit('error_message', {message: "Você não está nesta sala, a sala não existe ou você não está registrado."});
        }
    });

    socket.on('make_guess', ({ roomId, guessedCharacter }) => {
        if (!currentUsername) {
            socket.emit('error_message', { message: 'Você precisa estar registrado para palpitar.' });
            return;
        }
        const room = gameRooms[roomId];
        if (room && room.players.includes(currentUsername) && !room.gameOver) {
            const opponentUsername = room.players.find(p => p !== currentUsername);
            if (!opponentUsername || !room.characters[opponentUsername]) {
                 console.error(`Erro no palpite: Oponente ou personagem do oponente não encontrado na sala ${roomId}. Jogador: ${currentUsername}`);
                 socket.emit('error_message', { message: 'Erro ao processar o palpite: oponente não encontrado.' });
                 return;
            }

            const opponentActualCharacter = room.characters[opponentUsername];

            console.log(`Jogador ${currentUsername} palpitou ${guessedCharacter} para ${opponentUsername} (real: ${opponentActualCharacter}) na sala ${roomId}`);

            const isCorrect = (guessedCharacter === opponentActualCharacter);

            if (isCorrect) {
                room.gameOver = true;
                console.log(`Jogo ${roomId} encerrado. Vencedor: ${currentUsername}`);
            }

            io.to(roomId).emit('guess_result', {
                guesser: currentUsername,
                guessedCharacter: guessedCharacter,
                correct: isCorrect
            });

        } else if (room && room.gameOver) {
             socket.emit('error_message', {message: "O jogo já terminou."});
        } else {
             socket.emit('error_message', {message: "Você não está nesta sala ou a sala não existe."});
        }
    });

    socket.on('leave_game', ({ roomId }) => {
        if (!currentUsername) {
            return;
        }
        const room = gameRooms[roomId];
        if (room && room.players.includes(currentUsername)) {
            socket.leave(roomId);
            console.log(`Usuário ${currentUsername} saiu da sala ${roomId}`);

            socket.to(roomId).emit('player_left', { username: currentUsername, message: `${currentUsername} saiu do jogo.` });

            room.players = room.players.filter(p => p !== currentUsername);
            room.sockets = room.sockets.filter(s => s.id !== socket.id);

            if (room.players.length < 2) {
                 room.sockets.forEach(sInfo => {
                     const remainingSocket = io.sockets.sockets.get(sInfo.id);
                     if (remainingSocket) {
                         remainingSocket.leave(roomId);
                     }
                 });
                 delete gameRooms[roomId];
                 console.log(`Sala ${roomId} removida por falta de jogadores.`);
            }
        }
    });

    socket.on('disconnect', () => {
        console.log(`Socket ${socket.id} (usuário: ${currentUsername || 'não registrado'}) desconectou-se.`);
        if (currentUsername) {
            const disconnectedUser = currentUsername;

            for (const roomId in gameRooms) {
                const room = gameRooms[roomId];
                const playerIndex = room.players.indexOf(disconnectedUser);

                if (playerIndex !== -1) {
                    console.log(`Usuário ${disconnectedUser} estava na sala ${roomId} e desconectou.`);

                    room.sockets = room.sockets.filter(s => s.id !== socket.id);

                    const opponentInfo = room.sockets.find(s => s.username !== disconnectedUser);
                    if (opponentInfo) {
                        const opponentSocket = io.sockets.sockets.get(opponentInfo.id);
                        if (opponentSocket) {
                            opponentSocket.emit('opponent_disconnected', {
                                opponentUsername: disconnectedUser,
                                message: `Seu oponente (${disconnectedUser}) desconectou-se.`
                            });
                        }
                    }

                    if (room.sockets.length === 0) {
                        delete gameRooms[roomId];
                        console.log(`Sala ${roomId} removida pois todos desconectaram.`);
                    }
                    break;
                }
            }

             setTimeout(() => {
                if (activeUsers[disconnectedUser] && activeUsers[disconnectedUser].id === socket.id) {
                    console.log(`Removendo usuário inativo ${disconnectedUser} de activeUsers.`);
                    delete activeUsers[disconnectedUser];
                }
             }, 30000);

            currentUsername = null;
        }
    });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
    console.log(`🚀 Servidor Cara a Cara em http://localhost:${PORT}`);
});