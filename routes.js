// Models, MUST EDIT.
var user = require('./models/user');
var pin = require('./models/pin');
var segnala = require('./models/segnala');
var token = require('./models/token');
var uuid=require('node-uuid');
var config = require('./config');
var mailer = require('./mailer');

/*
sha1 encoding

var crypto = require('crypto');
console.log(crypto.createHash('sha1').update('email@boh.com').digest("hex"));
*/
 
module.exports = {
  configure: function(app) {
	  
	// localhost test at endpoint / for watch if node is working properly
    app.get('/', function(req, res) {
		res.end('If you reach this endpoint, then Node.js is working! :D');
	});

	app.post('/test_nodemailer/', function(req, res){
        mailer.transporter.sendMail({
            from: config.smtp_google_user,
            to: 'finalgalaxy@gmail.com',
            subject: 'Testsubj!',
            text: 'Testtext!'
        }, function (err, responseStatus){
            mailer.transporter.close();
        });
        res.send({status: 0});
    });
    
    // Verifica dell'esistenza del token nel DB (usato dagli scripts di preload in caso di ?token=TOKEN_VALUE).
    app.get('/token/:token/', function(req, res){
        token.check(req.params.token).then(token_gen => {
            res.send({status: 0, message: 'TOKEN_OK'});
        }).catch(err => {
            res.send({status: 1, message: 'ERROR_TOKEN'});
        });
    });
	
    
    
    
    // Endpoint per richiedere l'inserimento di un nuovo utente (success: invio mail, gen. token).
    app.post('/user/new/request', function(req, res) {
        user.create_user_request(req.body, res);
    });
    
    // Endpoint, link inviato nella mail, per inserire un nuovo utente nel DB (success: creazione nuova riga in utente).
    app.get('/user/new/do/token/:token/email/:email/password/:password', function(req, res) {
        token.check(req.params.token).then(token_gen => {
            user.create_do_request(req.params, res);
        }).catch(err => {
            res.send({status: 1, message: 'ERROR_TOKEN'});
        });
    });
    
    
    
    
    
    // Endpoint per richiedere il recupero della propria password (success: invio mail, gen. token).
    app.post('/user/reset_password/request', function(req, res){
        user.reset_password_request(req.body, res);
    });
    
    // Endpoint, link inviato nella mail, per permettere la reimpostazione della password nel caso il token sia valido (success: redirect alla home con ?token=TOKEN_VALUE.
    // Nella homepage, grazie all'aggiunta di ?token=TOKEN_VALUE, verrà inviata un'ulteriore richiesta sull'endpoint /token/:token per check sulla validità del token.
    app.get('/user/reset_password/token/:token/redirect/:redirect_url', function(req, res){
        token.check(req.params.token).then(token_got => {
           var url_parsed = req.params.redirect_url.replace('%2F', '/');
           console.log(url_parsed);
           res.redirect('http://'+url_parsed+'?token='+token_got);
        }).catch(err => res.send({status: 1, message: 'ERROR_TOKEN'}));
    });
 
    // Endpoint utilizzato per modificare la password dopo aver confermato l'operazione (success: password modificata).
    app.post('/user/reset_password/do/', function(req, res){
        token.get(req.body.token).then(token_data => {
            user.set_password(token_data.email, req.body.password, res);
        }).catch(err => {
            res.send({status: 1, message: 'ERROR_TOKEN'});
        });
        //user.set_password()
    });
 

    app.post('/user/login', function(req,res){
        var session_cookie=req.cookies.actoken32;
        console.log("cookie contains:"+session_cookie);
        if(session_cookie!=undefined||session_cookie!=null){
            console.log('You cannot login, session already active on your browser');
            res.send({status: 1, message: 'CANNOT_LOGIN'});
        }else{
            user.authorize(req.body).then(userId=>{
                var ipClient; //http://stackoverflow.com/questions/10849687/express-js-how-to-get-remote-client-address
                //da fare: ricavare indirizzo ip dal client
                session.create(userId, ipClient).then(token=>{
                    res.cookie('actoken32', token, { maxAge: 900000, httpOnly: true }); //maxage dovrebbe essere infinito, per ora settato a 900000
                    res.send({status:0, message:'LOGIN_SUCCESSFUL'});
                }).catch(err=>{
                    res.send({status:1, message: 'ERROR_GENERATING_SESSION'});
                });
                
            }).catch(err2=>{
                res.send({status:1, message:'ERROR_CREDENTIALS '+err2});
            });
        };
    });
    
    
    app.post('/segnala/', function(req, res){
        segnala.report(req, res);
    });
    
    // Endpoint per visualizza dettagli pin WiFi (success: dati della rete WiFi in JSON).
    app.get('/pin/getinfo/:id', function(req, res){
       pin.get(req, res); 
    });
    
    // Endpoint per visualizza mappa (success: lista di reti WiFi con le informazioni utili per la mappa in JSON).
    app.get('/pin/get_networks/:latitudine/:longitudine/:radius_lat/:radius_long', function(req, res){
		pin.getlistpin(req, res);
	});
    
    // Endpoint per inserire un nuovo pin (success: creazione riga in rete_wifi nel DB).
    app.post('/pin/new', function(req, res){
        pin.insert(req.body, res);
    });
    
    // Endpoint per modificare un pin esistente.
    app.post('/pin/edit', function(req, res){
        pin.edit(req.body, res);
    });
    
    // Endpoint per cancellare un pin esistente.
    app.post('/pin/delete', function(req, res){
        pin.delete(req.body, res);
    });
    
    // Endpoint per valutare un pin esistente di cui NON si è proprietari.
    app.post('/pin/rank', function(req, res){
        pin.rank(req.body, res);
    });
    
    
    
    
    
    
    
    
    
    
    
	// Default endpoints. MUST EDIT, WORK IN PROGRESS.
    /*app.get('/user/', function(req, res) {
      user.get(res);
    });
 
 
    app.put('/user/', function(req, res) {
      user.update(req.body, res);
    });
	
	app.post('/pin/testcoordinates/', function(req, res) {
		pin.testpoint(req, res);
    });
	
	
    
 
    app.delete('/user/:email/', function(req, res) {
      user.delete(req.params.email, res);
    });

    app.get('/user/search/:email/', function(req, res) {
      user.search(req.params.email, res);
    });*/
  }
};
