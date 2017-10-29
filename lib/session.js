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
    // this.strategy = new Strategy("normal", file);

    this.uuid = function() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);      
            return v.toString(16);
        });
    }


    this.conversation_history = [];

    this.eingabe = "male";

    this.set_var = function(type, value ) {
        self[type] = value; 
    }



    this.id = this.uuid();
    console.log(self.timestamp);

    self.topic_counter = 0;

    this.set_conversation_state = function(state) {
        self.topic_counter = 0;
        
        self.conversation_state = state;
        self.conversation_history.push( state );
        meta( "Konversations-Status gesetzt "  + state);

        meta( self.conversation_history);
    }

 


}





module.exports = Session;