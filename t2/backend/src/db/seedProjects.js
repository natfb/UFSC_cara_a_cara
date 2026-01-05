require("./connection.js");
const seedProjetos = require("./seed"); 
const Projeto = require("./models/model"); 

// const seedDB = async () => {
async function seedDB() {
  console.log("****** SEEDING PROJETOS *******")
    //   se nao exitir projeto com o id do seed insere um novo, se existe atualiza
  const bulkOps = seedProjetos.map(proj => ({
        updateOne: {
            filter: { _id: proj._id }, 
            update: { $set: proj }, 
            upsert: true 
        }
    }));

    if (bulkOps.length > 0) {
        // Executa todas as operações em massa e aguarda a conclusão.
        const result = await Projeto.bulkWrite(bulkOps);
        console.log(`****** SEEDING CONCLUIDO`);
    } else {
        console.log("Nenhum dado de projeto para semear.");
    }

  console.log("****** PROJETOS SEEDED SUCCESFULLY *******");
};

seedDB()
