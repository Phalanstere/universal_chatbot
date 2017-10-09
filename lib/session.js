var meta            = require('debug')('worker:session');
var resolve         = require('path').resolve;

var Strategy = require("./strategy.js");


var Session = function( parent, file ) {

    this.parent = parent;

    meta("SESSION WIRD ERZEUGT");

    if (file)  file = resolve( file);
    meta( file );


    var self = this;
    this.timestamp = new Date().getTime();

    // this.strategy = new Strategy("normal", "./Markov.json");
    this.strategy = new Strategy("normal", file);

    this.uuid = function() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);      
            return v.toString(16);
        });
    }


    this.id = this.uuid();
    console.log( self.id );
    console.log(self.timestamp);

}





module.exports = Session;