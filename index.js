'use strict';

var resolve         = require('path').resolve;

var meta    = require('debug')('worker:meta');
var Session = require('./lib/session.js');
var Strategy = require("./lib/strategy.js");

var Aiml    = require('./lib/aiml.js'); 


meta("Hier kommt der Universale Bot");

var version = "0.0.19";

console.log("UniversalBot - version: " + version)

var UniversalBot = function(params) {

    if (params) meta( params.aiml );

    var self = this;

    this.sessions = [];

    this.process_aiml = function(params) {

        if (params) {
            console.log("CALLBACK");
            console.log( params );
        } else {
            meta("KEINE ANTWORT");
        }




        // console.log( params.answer.template );

    }


    this.init = function () {
        self.session = new Session(this, params.strategy);
        

        if ( params.strategy) {
            meta("STRATEGY IS DEFINED");
            var f = resolve( params.strategy );
            self.strategy = new Strategy("normal", f );
        }        

        if (params.bot_identity) {
            meta("BOT_IDENTITY");
            self.bot_identity = params.bot_identity;
        }


        /////
        meta("NOW THE AIML PART");

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