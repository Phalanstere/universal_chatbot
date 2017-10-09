'use strict';
var meta    = require('debug')('worker:meta');
var Session = require('./lib/session.js');

var Aiml    = require('./lib/aiml.js'); 


meta("Hier kommt der Universale Bot");

var version = "0.0.17";

console.log("UniversalBot - version: " + version)

var UniversalBot = function(params) {
    var self = this;

    this.sessions = [];
    this.interpreter = new aimlHigh({name:'Bot', age:'42'}, 'Goodbye');
    this.interpreter.loadFiles(['./aiml/bot_identity.xml']);

    this.aiml_callback = function(answer, wildCardArray, input){
        // console.log(answer + ' | ' + wildCardArray + ' | ' + input);
        console.log(input);
        console.log(answer);
    };


    this.process_aiml = function(params) {
        console.log( params );
    }


    this.init = function () {
        self.session = new Session(this);


    var list = [
            "./aiml.json",
            "./greeting.json"
        ];


    // This is the AIML Bot
    self.aiml    = new Aiml( list,self );


    // self.aiml.input( { pattern: "No", that: "Do you like movies?"  } );
    // self.aiml.input ( { pattern: "No" }, self.session, self.process_aiml);

    // self.interpreter.findAnswer('Thank you for following', self.aiml_callback);

    }


    self.init();

};



// var u = new UniversalBot();



module.exports = UniversalBot;