const express = require('express');
const exphbs = require('express-handlebars');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const crypto = require('crypto');
const app = express();
const authTokens = {};
//instalando o Helmet para fazer a segurança da aplicação
//site referencia https://expressjs.com/pt-br/advanced/best-practice-security.html
const helmet = require('helmet');
const mysql = require('mysql');
require('devbox-linq');


//Banco de dados de teste local Tasks
// const conn = mysql.createConnection({
//     host: 'localhost',
//     user: 'root',
//     //password: 'Rodri*127',
//     database: 'task'
//   });
   
//   //connect to database
//   conn.connect((err) =>{
//     if(err) throw err;
//     console.log('Mysql Connected...');
//   });
   


app.use(helmet());

//Instalando o limit para controlar a quantidade de requisições
//controlar a quantidade de usuarios conectados com o mesmo id
var limiter = require('express-limiter')(app)


   

const users = [
    // This user is added to the array to avoid creating new user on each restart
    {
        firstName: 'John',
        lastName: 'Doe',
        email: 'rodrigo.martins@metodotelecom.com.br',
        // This is the SHA256 hash for value of `password`
        password: 'XohImNooBHFR0OVvjcYpJ3NgPQ1qq73WKhHvch0VQtg='
    }
];

const getHashedPassword = (password) => {
    const sha256 = crypto.createHash('sha256');
    const hash = sha256.update(password).digest('base64');
    return hash;
}

const generateAuthToken = () => {
    return crypto.randomBytes(30).toString('hex');
}

// to support URL-encoded bodies
app.use(bodyParser.urlencoded({ extended: true }));

app.use(cookieParser());

app.use((req, res, next) => {
    const authToken = req.cookies['AuthToken'];
    req.user = authTokens[authToken];
    next();
});

app.engine('hbs', exphbs({
    extname: '.hbs'
}));

app.set('view engine', 'hbs');

app.get('/', (req, res) => {
    res.render('home');
});

app.get('/login', (req, res) => {
    res.render('login');
});

app.post('/login', (req, res) => {
    const { email, password } = req.body;
    const hashedPassword = getHashedPassword(password);

    const user = users.find(u => {
        return u.email === email && hashedPassword === u.password
    });

    if (user) {
        const authToken = generateAuthToken();

        authTokens[authToken] = email;

        res.cookie('AuthToken', authToken , { 
            expires: new Date(Date.now() + 900000),
            httpOnly: true 
        });
        res.redirect('/protected');
        return;
    } else {
        res.render('login', {
            message: 'Invalid username or password',
            messageClass: 'alert-danger'
        });
    }
});



app.get('/register', (req, res) => {
    res.render('register');
});

app.post('/register', (req, res) => {
    const { email, firstName, lastName, password, confirmPassword } = req.body;

    if (password === confirmPassword) {
        if (users.find(user => user.email === email)) {

            res.render('register', {
                message: 'User already registered.',
                messageClass: 'alert-danger'
            });

            return;
        }

        const hashedPassword = getHashedPassword(password);

        users.push({
            firstName,
            lastName,
            email,
            password: hashedPassword
        });

        res.render('login', {
            message: 'Registration Complete. Please login to continue.',
            messageClass: 'alert-success'
        });
    } else {
        res.render('register', {
            message: 'Falha no login, as senhas não conferem.',
            messageClass: 'alert-danger'
        });
    }
});

app.get('/protected', (req, res) => {
    if (req.user) {
        res.render('protected');
    } else {
        res.render('login', {
            message: 'Porfavor refaça o login novamente',
            messageClass: 'alert-danger'
        });
    }
});

app.get('/outro', (req, res) => {
    if (req.user) {
        res.render('outro');
    } else {
        res.render('login', {
            message: 'Porfavor refaça o login novamente',
            messageClass: 'alert-danger'
        });
    }
});


app.post('/save3/:nome?/:ramal?/:nochamado?/:nuchamado?/:tipoligacao?/:datareg?',(req, res) => {
  let data = {nome: req.params.nome, ramal: req.params.ramal, nomechamado: req.params.nochamado, 
    numerochamado:req.params.nuchamado, tipoligacao:req.params.tipoligacao, datareg: req.params.datareg};
  let sql = "INSERT INTO registro SET ?";
  let query = conn.query(sql, data,(err, results) => {
    if(err) throw err;
    //res.redirect('/');
    res.render('dashboard');
  });
});

app.get('/dashboard', (req, res) => {
    if (req.user) {
        res.render('dashboard');
    } else {
        res.render('login', {
            message: 'Please login to continue',
            messageClass: 'alert-danger'
        });
    }


});

app.listen(3000);
console.log('Rodando na Porta 3000...');