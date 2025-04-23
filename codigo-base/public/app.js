            var vetorImagens = [];

            function enviaPergunta() {
                console.log('Envia pergunta');
            }

            function reInicia() {
                console.log('Cancela jogo e reinicia partida');

                for (let a = 0; a < vetorImagens.length; a++) {
                    vetorImagens[a].style.filter = 'opacity(1)';
                }
            }

            function marcaDesmarca(x) {

                if (x.style.filter == 'opacity(0.1)') x.style.filter = 'opacity(1)';
                else x.style.filter = 'opacity(0.1)';

            }

            document.addEventListener("DOMContentLoaded", (event) => {
                const imagens = document.getElementsByTagName('img');
                vetorImagens = Array.from(imagens);
            });
