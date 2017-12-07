var UniversalBot = require("./index.js");
var debugs  = require('debug')('input');

console.log("Hier komt der Test ");



var params = {};

params.aiml = [
        "./user/Seminar.json",
        "./aiml_de/bot_identity.json",
        "./aiml_de/evokation.json",
        "./aiml_de/psychiater.json",
    ];

params.strategy = "./bot_configs/strategy.json";
params.intentions = "./NITIntentions_DE.json";




params.bot_identity = {
    name: "UniversalBot",
    age: 12,   
}





var bot = new UniversalBot( params );

// bot.input("Ich leide unter Hühneraugen", null, "AIML", function( data, error ) {
bot.input("ist es plausibel dass man das an einem Wochenende lernt", null, "AIML", function( data, error ) {
// bot.input("Ich frage mich ob das so in Ordnung ist", null, "AIML", function( data, error ) {
// bot.input("Kann ich eine Kreditkarte nutzen", null, "AIML", function( data, error ) {
// bot.input("Was sind die Kosten der Veranstaltung", null, "AIML", function( data, error ) {

    if (error) {
        console.log( "ERROR");
        console.log( error );
        
    }

    if (data) {
        debugs("Daten gehen ein");
        console.log("ANTWORT: " + data.answer );

        if (data.action) {
            var x = eval( data.action );
        }

    }

});


// bot.aiml.input ( { pattern: "What's about me?", condition:  { mood: "sad" }  }, bot.session, bot.process_aiml);

