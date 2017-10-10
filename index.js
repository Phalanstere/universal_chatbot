'use strict';

var resolve         = require('path').resolve;

var meta    = require('debug')('worker:meta');
var Session = require('./lib/session.js');
var Strategy = require("./lib/strategy.js");

var Aiml    = require('./lib/aiml.js'); 


meta("Hier kommt der Universale Bot");

var version = "0.0.20";

console.log("UniversalBot - version: " + version)

var UniversalBot = function(params) {

    if (params) meta( params.aiml );

    var self = this;

    this.sessions = [];

    this.change_topic = function(session) {
                
        var actual = session.conversation_state;
        meta ("aktueller Status " + actual);
        var x = self.strategy.chain.next( actual );

        session.set_conversation_state(x.name);
    }




    this.process_aiml = function(params) {

        if (params) {
            console.log("CALLBACK");
            console.log( params );
            var s = self.find_session( params.session_id);
            if (params.topic_change) self.change_topic( s );
            else session.topic_counter ++;

            // könnte die Repetition hier abfangen

        } else {
            meta("KEINE ANTWORT");
        }

        // console.log( params.answer.template );

    }


    this.check_sessions = function() {

    }


    self.find_session = function(id) {
        meta("ID : " + id);

        for (var i = 0; i < self.sessions.length; i++) {
            var ses = self.sessions[i];
            if (ses.id === id) return ses;
        }
    return null;
    }



   

    this.input = function(text, session_id, callback) {

        meta("Hier kommt die Eingabe: " + text);
        if (! session_id) {
            meta("Neue Sitzung wird erzeugt ");
            
            var s = new Session(this, params.strategy);
            
            s.set_conversation_state( self.strategy.chain.nodes[0].name );

            session_id = s.id;
            self.sessions.push(s);
            meta("Number of sessions " + self.sessions.length);
        }

        var session = self.find_session(session_id);



        var input =  {
            pattern: text,
            topic: session.conversation_state.name
        }

        self.aiml.input (  input,  session, self.process_aiml);


    }

   


    this.init = function () {
        // self.session = new Session(this, params.strategy);
        

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