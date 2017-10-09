'use strict';
var meta    = require('debug')('worker:meta');
var Session = require('./lib/session.js');

var Aiml    = require('./lib/aiml.js'); 


meta("Hier kommt der Universale Bot");

var version = "0.0.18";

console.log("UniversalBot - version: " + version)

var UniversalBot = function(params) {

    if (params) meta( params.aiml );

    var self = this;

    this.sessions = [];

    this.process_aiml = function(params) {
        console.log("CALLBACK");
        console.log( params.answer.template );
    }


    this.init = function () {
        self.session = new Session(this, params.strategy);



    var list = [
            "./aiml.json",
            "./greeting.json"
        ];


    if (params.aiml ) list = params.aiml;


    // This is the AIML Bot
    self.aiml    = new Aiml( list, self );


    // self.aiml.input( { pattern: "No", that: "Do you like movies?"  } );
    // self.aiml.input ( { pattern: "No" }, self.session, self.process_aiml);

    // self.interpreter.findAnswer('Thank you for following', self.aiml_callback);

    }


    self.init();

};



// var u = new UniversalBot();



module.exports = UniversalBot;