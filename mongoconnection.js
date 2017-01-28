// Require mongoose ORM driver for connecting with database
var config = require('./config');

// Connection function for DB interaction
function Mongoconnection() {
    var mongoose=null;
    var mongomodels=null;

    // Initialize connection. At moment, no username and password for this database.
    this.init = function() {
        this.mongoose = require('mongoose');
        this.mongomodels = require('./mongomodels')(this.mongoose);
        this.mongoose.connect('mongodb://localhost:21700/gopher_main');
    };
    
    this.switch_db = function(new_db) {
        if(this.mongoose!=null){
            this.mongoose.disconnect();
            this.mongoose.connect('mongodb://localhost:21700/'+new_db);
        }
    };
    
    this.acquire = function(callback) {
        callback(this.mongoose, this.mongomodels);
    };
}

// Export this function to other node scripts
module.exports = new Mongoconnection();