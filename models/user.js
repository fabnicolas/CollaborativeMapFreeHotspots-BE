var connection = require('../connection');
var crypto = require('crypto');
var config = require('../config');
var mailer = require('../mailer');
var uuid=require('node-uuid');
var token = require('./token');

function validateEmail(email) {
    var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(email);
}

function validatePassword(password){
    var re = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])[0-9a-zA-Z]{8,}$/;
    return re.test(password);
}



function User() {
    
    
    this.create = function(user, res){
        connection.acquire(function(err, con) {
            if((user.email == null || user.email.length==0) && (user.password == null || user.password.length==0)){
                res.send({status: 1, message: 'ERROR_EMAIL_PASSWORD'});
            }else if(user.email == null || user.email.length==0 || !validateEmail(user.email)){
                res.send({status: 1, message: 'ERROR_EMAIL'});
            }else if(user.password == null || user.password.length==0 || !validatePassword(user.password)){
                res.send({status: 1, message: 'ERROR_PASSWORD'});
            }else if(user.password.length<8){
                res.send({status: 1, message: 'ERROR_PASSWORD_LENGTH'});
            }else{
                var hash_psw = crypto.createHash('sha1').update(user.password).digest("hex");
                con.query('INSERT INTO utente (email, password) VALUES (\'?\', \'?\')', [user.email, hash_psw], function(err, result) {
                    con.release();
                    if(err){
                        res.send({status: 1, message: 'ERROR_DB'});
                    }else{
                        res.send({status: 0, message: 'INSERT_OK'});
                    }
                });
            }
            con.release();
        });
    }
    
    this.reset_password_request = function(user, res){
        connection.acquire(function(err, con) {
            if(user.email == null || user.email.length == 0 || !validateEmail(user.email)){
                res.send({status: 1, message: 'ERROR_EMAIL'});
            }else{
                con.query('SELECT COUNT(id) AS n_found FROM utente WHERE email=?', [user.email], function(err, result){
                    if(result[0].n_found > 0){
                        // Generate token
                        token.generate(user.email).then(token_generated => {
                            console.log(user.email+","+token_generated);
                            if(token_generated != null){
                                // Encode frontend URL to be parsed from express into GET requests
                                var url = user.frontend_url.replace(/\//g, '%2F');
                                
                                // Send mail
                                mailer.transporter.sendMail({
                                    from: config.smtp_google_user,
                                    to: user.email,
                                    subject: user.email+', conferma la registrazione del tuo account su AlwaysConnected',
                                    text: 'Per confermare la registrazione, clicca qui: '+config.server_ip_address_http+':'+config.server_port+'/user/reset_password/token/'+token_generated+'/redirect/'+url
                                }, function (err, responseStatus){
                                    mailer.transporter.close();
                                });
                                
                                // Send JSON to middleware informing mail is sent
                                res.send({status: 0, message: 'RESET_REQUEST_OK'});
                            }else{
                                res.send({status: 1, message: 'ERROR_DB'});
                            }
                        }).catch(err => {
                            res.send({status: 1, message: 'ERROR_DB'});
                        });
                    }else{
                        res.send({status: 1, message: 'ERROR_EMAIL_NOT_FOUND'});
                    }
                });
            }
            con.release();
        });
    };
    
    this.set_password = function(email, password, res){
        if(password == null || password.length==0 || !validatePassword(password)){
            res.send({status: 1, message: 'ERROR_PASSWORD'});
        }else if(password.length<8){
            res.send({status: 1, message: 'ERROR_PASSWORD_LENGTH'});
        }else{
            connection.acquire(function(err, con) {
                var hash_psw = crypto.createHash('sha1').update(password).digest("hex");
                con.query('UPDATE utente SET password=? WHERE email=?', [hash_psw, email], function(err, result){
                    if(err){
                        res.send({status: 1, message: 'ERROR_DB'});
                    }else{
                        res.send({status: 0, message: 'PASSWORD_UPDATED'});
                    }
                });
            });
        }
    }
        
    this.login=function(req, res){
        connection.acquire(function(err, con){
            var mail=req.body.email, hash_psw = crypto.createHash('sha1').update(req.body.password).digest("hex");
            if(email == null || email.length == 0 || !validateEmail(email)){
                res.send({status: 1, message: 'ERROR_CREDENTIALS'});
            }
            con.query('SELECT password FROM utenti WHERE email=?',[mail], function(err, result){
                if(result[0]==null||result[0].password==""||result[0].password==null){
                    res.send({status:1, message: 'ERROR_CREDENTIALS'});}
                if(result.password==hash_psw){
                    var token=crypto.createHash('sha256').update(uuid.v1()).update(crypto.randomBytes(256)).digest("hex");//crea il token senza possibilità di collisioni
     
                    res.cookie('actoken32', token, { maxAge: 900000, httpOnly: true }); //maxage dovrebbe essere infinito, per ora settato a 900000
                    res.send(JSON.stringify(result));
                }       
            });
            con.release();
        });
    };
        
    
    
    /*genid=function(req){
    return crypto.createHash('sha256').update(uuid.v1()).update(crypto.randomBytes(256)).digest("hex");}*/

    /*
  this.get = function(res) {
    connection.acquire(function(err, con) {
      con.query('select * from users', function(err, result) {
        con.release();
        res.send(JSON.stringify(result));
      });
    });
  };

  this.create = function(user, res) {
    connection.acquire(function(err, con) {
      con.query('insert into users set ?', user, function(err, result) {
        con.release();
        if (err) {
          res.send({status: 1, message: 'USER creation failed', query: 'insert into users set ' + user});
        } else {
          res.send({status: 0, message: 'USER created successfully'});
        }
      });
    });
  };

  this.update = function(user, res) {
    connection.acquire(function(err, con) {
      con.query('update users set ? where email = ?', [user, user.email], function(err, result) {
        con.release();
        if (err) {
          res.send({status: 1, message: 'USER update failed'});
        } else {
          res.send({status: 0, message: 'USER updated successfully'});
        }
      });
    });
  };

  this.delete = function(email, res) {
    connection.acquire(function(err, con) {
      con.query('delete from users where email = ?', [email], function(err, result) {
        con.release();
        if (err) {
          res.send({status: 1, message: 'Failed to delete'});
        } else {
          res.send({status: 0, message: 'Deleted successfully'});
        }
      });
    });
  };

  this.search = function(email, res) {
    connection.acquire(function(err, con) {
      con.query('select * from users where email = ?', [email], function(err, result) {
        con.release();
        if(err) {
          res.send({status:1, message: 'Failed to search'});
        } else {
          if(result.length == 0) {
            res.send({status: 0, message: 'User not found'});
        } else {
          res.send(result);
          }
        }
      });
    });
  }*/
}
module.exports = new User();