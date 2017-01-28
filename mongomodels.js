module.exports = function(mongoose){
    var User = mongoose.model('User', new mongoose.Schema(
        {
            email: String,
            password: String
        }
    ));
    return {
        User: User
    };
};