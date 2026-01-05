const mongoose = require("mongoose");

const projetosModel = new mongoose.Schema({
    _id: {
        type: String,
        required: true,
        trim: true,
    },
    title: {
        type: String,
        required: true,
        trim: true,
    },
    description: {
        type: String,
        required: true,
        trim: true,
    },
    participants: {
        type: [String],
        required: true,
    },
    category: {
        type: String,   
        required: true,
    },
    materials: {
        type: [String],
        required: true,
    },
    image: {
        type: String,
        required: true,
        trim: true,
    },
    avaliacao: {
        type: Number,
        default: null,
    },
    num_de_avaliacoes: {
        type: Number,
        default: null,
    }
});

const Projeto = mongoose.model("Projetos", projetosModel);
module.exports = Projeto;