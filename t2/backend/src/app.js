const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')

// conexao e seed do banco de dados
require("./db/connection.js");
const Projeto = require("./db/models/model.js");
require("./db/seedProjects.js");

const app = express()
app.use(express.static('public'));

app.use(bodyParser.json())
app.use(cors())

app.get('/', (req, res) => {
  res.send('hello world')
})

// retorna informacoes de um projeto
app.get('/projeto/:id', async (req, res) => {
    const { id } = req.params
    
    try {
        const project = await Projeto.findOne({ _id: id });

        if (project) {
            res.json(project);
        } else {
            console.log(`Projeto com ID '${id}' não encontrado.`);
            res.status(404).json({ message: `Projeto com ID '${id}' não encontrado.` });
        }
    } catch (error) {
        console.error(`Erro ao buscar projeto '${id}':`, error);
        // Para qlqr outro erro de servidor
        res.status(500).json({ message: 'Erro interno do servidor ao buscar o projeto.' });
    }
});

// post avaliacao
// calcula a media de avaliacoes de um projeto
app.post('/avaliar/:id/:nota', async (req, res) => {
    const { id } = req.params[0]
    const { nota } = req.params[1]
    console.log(id, nota)

    try {
        const project = await Projeto.findOne({ _id: id });

        if (project) {
            project.num_de_avaliacoes += 1;
            project.avaliacao =  (project.avaliacao + int(nota)) / project.num_de_avaliacoes            
            res.status(200)
        } else {
            console.log(`Projeto com ID '${id}' não encontrado.`);
            res.status(404).json({ message: `Projeto com ID '${id}' não encontrado.` });
        }
    } catch (error) {
        console.error(`Erro ao buscar projeto '${id}':`, error);
        // Para qlqr outro erro de servidor
        res.status(500).json({ message: 'Erro interno do servidor ao buscar o projeto.' });
    }  
});

app.listen(8081, () => {
    console.log("Server running on 8081")
})