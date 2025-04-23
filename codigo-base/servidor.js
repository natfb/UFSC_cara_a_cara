var express = require('express');
const session = require('express-session');
var handlebars  = require('express-handlebars');


var segredo="kjsjdr3kjdskjsfkjjkq4tfklf";



var app     = express();
const {
    MongoClient
} = require('mongodb');

var disciplinas;
var users;



app.use(express.json());
app.use(express.urlencoded({ extended: true })); // support encoded bodies
app.use(session({
    secret: segredo,                          // Chave usada para assinar o cookie da sessão
    resave: false,                            // Evita salvar a sessão se nada mudou
    saveUninitialized: true,                  // Salva sessões que ainda não foram inicializadas
    cookie: {   maxAge: 24 * 60 * 60 * 1000 } // 24 hours  Tempo de expiração do cookie
}));

app.engine('handlebars',  handlebars.engine() );
app.set('view engine', 'handlebars');
app.set('views', './views');



function autenticacao(req, resp, next){

    if (req.session.sessionId) next();
    else {
        console.log('Erro na autenticação, redireciona para login')
        resp.render('login');
    }


}
app.use(express.static(__dirname + '/public'));


app.post('/login',async function (req,resp){
    let MSG = {'status':'falha'};
    let credenciais = req.body;
    let dados;
    dados = await users.findOne({id:credenciais.id});
    if (dados)
    {
        if (credenciais.id == dados.id && credenciais.pass == dados.pass)
        {
            // retorna um token
            req.session.sessionId = dados.id;            
            console.log('redireciona para o dash');
           
            return resp.render('dashboard',  {usuario: req.session.sessionId, cores:['azul','amarelo','verde']});
        }
      
    }   
    resp.redirect('/');

});




// Rota para a página inicial
app.get('/', (req, resp) => {
    resp.render('login');
    
});

app.get('/login', (req, resp) => {
    resp.render('login');
    
});  

app.get('/dashboard',autenticacao, (req, resp) => {
    resp.render('dashboard',  {usuario: req.session.sessionId});

});
app.get('/teste', (req, resp) => {
    resp.send('Servidor no ar');

});

  // Rota para a página "sobre"
app.get('/sobre',autenticacao, (req, resp) => {
    resp.render('sobre',  {usuario: req.session.sessionId});

});

app.get('/jogo',autenticacao, (req, resp) => {
    resp.render('jogo',  {usuario: req.session.sessionId});

});
  
  // Rota para a página "contato"
app.get('/contato',autenticacao, (req, resp) => {
    resp.render('contato',  {usuario: req.session.sessionId});
});

app.get('/logoff',autenticacao, (req, resp) => {
    req.session.destroy();
    resp.render('login', {mensagem: "Usuário deslogado do sistema"});

});

app.get(/^(.+)$/, function(req, resp) {
    resp.render('login');

})


async function conecta()
{
    let db;
    var client = new MongoClient('mongodb://127.0.0.1:27017');
    await client.connect();
    db = await client.db("AULAS");
    disciplinas = await db.collection("disciplinas");
    users       = await db.collection('users');
    console.log('conectado ao banco de dados')

    app.listen(4000,function(){
        console.log("Servidor web rodando na porta 4000");
    });
  
}


conecta();
