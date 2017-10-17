var wordnet = require('wordnet');
var meta            = require('debug')('wordnet');
var spa             = require('debug')('speechact');


// var sw = require('stopword')
var stopwords       = require('./language_en/stopwords_en.json');
var fs              = require('fs');


var SpeechAct       = require('./speechact.js');


/*
fs.readFile('./lib/language_en/add_nouns.txt', 'utf8', function(err, data) { 

if (err) throw err;

  if (data) {

    var nouns         = require('./language_en/nouns.json');

    spa( "bisherige " + nouns.length );

    function check_nouns(word) {
        for (var n = 0; n < nouns.length; n++) {
            var it = nouns[n];
            if ( it.word !== word) {
                
            }
        }
    ///


}

    var list = data.split("\n");
    spa("Anzahl der Nouns " + list.length);
    var newlist = [];


    for (var i = 0; i < list.length; i++) {
        var found = false;
        var v = "";
        var w = list[i];

        for (var n = 0; n < nouns.length; n++) {

            if (nouns[n].word === w) {
                found = true;
                v = nouns[n].word;
                }
        }

        if (found === true) spa( v );
        else 
            {
            newlist.push( { word: w, type: null }  )    
            }
        // check_nouns( list[i] );
        // spa( list[i] );
    }


    newlist = newlist.concat( nouns );

    spa("Ende der Funktion " + newlist.length);
    var s = JSON.stringify( newlist);
    // spa(s);
    fs.writeFile("new_nouns.json", s);

  }


});
*/



/*
fs.readFile('./lib/language_en/negative.txt', 'utf8', function(err, data) {
  if (err) throw err;

  if (data) {
    spa("Hier werden Wörter eingelesen");
    var adjectives         = require('./language_en/adjectives.json');
    
    function check_adjectives(word) {
        for (var n = 0; n < adjectives.length; n++) {
            var it = adjectives[n];

            if ( it.word === word) {
                if (it.sentiment === null) it.sentiment = [];    
                if (it.sentiment.includes("negative_emotion") === false)  it.sentiment.push("negative_emotion");
                else spa("schon da");
                             
                
            }
        }
    }

    var list = data.split("\n");
    for (var i = 0; i < list.length; i++) {
        check_adjectives( list[i] );
    }


    var s = JSON.stringify( adjectives);
    // spa( s );

    // fs.writeFile("new_adjectives.json", s);

  }

});
*/


/*
fs.readFile('./lib/language_en/positive.txt', 'utf8', function(err, data) {
  if (err) throw err;

  if (data) {

    var nouns              = require('./language_en/nouns.json');
    spa("Bereits anwesende nouns " + nouns.length);

     spa("Verben sind eingelesen ");
    var x = data.replace(/\t/g, '');


    spa( x );
    var list = x.split("\n");
     // spa(list);

     
     var newlist = [];

     function checkNoun( item ) {
         for (var n = 0; n < nouns.length; n++) {
             var word = nouns[n].word;
             if (word === item) return true;
         }
     return false;
     }


     for (var i = 0; i < list.length; i++) {
            var item = list[i];
            
            
            if (checkNoun(item) === false) {
                // spa("noch nicht da");

                newlist.push({
                    word: item,
                    type: null
                })
            }
        }


     
     var s = JSON.stringify(newlist, null, 4);
     spa( s );
     fs.writeFile("1000nouns.json", s);
     
     }
  

});
*/



var RE = /[!"'(),–.:;<>?`{}|~\/\\\[\]]/g; // eslint-disable-line no-useless-escape

var Cleanup = function() {
    // const newString = sw.removeStopwords(oldString)
    var self = this;

    this.remove_punctuation = function(str) {
	    return str.replace( RE, '' );
    }


    this.remove_stopwords = function(phrase) {
        const oldList = phrase.split(' ');
        var list = [];

        for (var i = 0; i < oldList.length; i++) {
            var str = oldList[i];

            if (! stopwords.includes(str) ) {
                // meta( str );
                list.push( str );
            }
        }
        
        return list;
    }


    this.process = function(phrase) {
       var x = self.remove_punctuation(phrase);
       var list = self.remove_stopwords(x);
       return list;
    }

}


var WordnetSearch = function() {

    var self = this;

    this.definitions = [];

    this.retrieve = function(word) {
        wordnet.lookup(word, function(err, definitions) {

            if (definitions) 
            {

                definitions.forEach(function(definition) {
                    // console.log('  words: %s', words.trim());
                    meta ('  %s', definition.glossary);

                    var x = Object.keys(definition.meta);

                    /*
                    meta( x );
                    meta( definition.meta.synsetType );
                    meta( definition.meta.words );
                    meta( definitions.glossary);
                    */
                    
                    self.definitions.push(definition);

                    self.list.shift();
                    self.lookup();

                   

                });
            }
            else {
                    meta("Kein Resultat");
                     self.definitions.push(null);
                    self.list.shift();
                    self.lookup();
                 }

        });
    }

    

    this.lookup = function() {
        if (self.list.length > 0 ) {
            var x = self.list[0];
            self.retrieve(x);
        }
        else {

            self.callback(self.definitions);
        }
    }


    this.process = function(list, callback) {
       self.callback = callback;
       self.list = list;
       self.lookup();
    }


}


var Paraphrase = function(phrase) {

    meta("PARAPHRASE");
    var self = this;

    this.cleanup    = new Cleanup();
    this.WordNet    = new WordnetSearch();
    this.SpeechAct  = new SpeechAct();

    this.digest = function( definitions) {
        // meta("Anzahl erhaltene Definitionen " + definitions.length);
    }


    this.analyze = function() {
       var list = self.cleanup.process(phrase); 
       meta( list);
       self.WordNet.process( list, self.digest );
    }


    this.init = function() {
        // self.analyze();
        self.SpeechAct.process( phrase );
    }

    self.init();
}


var a = "after the king has finished the complicated theory he sings a song";
var b = "wherever i go i feel fine"; 
var c = "if the facts fit the theory the king changes the facts";
var d = "as long as the king is crazy I can notr help it";
var e = "as long as the king behaves crazy I can not help it";
var f = "if this crazy language made any sense i would be glad";
var g = "if all the rich people in the world shared their money there wouldn't be enough to go around"
var h = "although golf was originally restricted to big fat teachers today it's open to anybody who owns hideous clothing";

var i = "because I know her name i feel irritated";
var i = "because I do not know her name i feel irritated";
var j = "since i have been called by the police";
var k = "since i do not have been called by the police";
var l = "since this rich man hit me I can be rich myself";
var m = "as long as the music plays i feeld homesick";
var n = "i feel homesick although the house gives us a good plate of wonderful cheese";
var o = "i feel good since the music is playing";

var r1 = "The extremely fat man who did not cross the street was drunken";
var r2 = "The extremely fat man whom i did not see was drunken";
var r3 = "The extremely fat man who went over the crowded street was drunken";
var r3 = "The extremely fat man who sang a song with his children was drunk";

var p = new Paraphrase( n );
// var p = new Paraphrase("wherever a man smokes he can see birds");



module.exports = Paraphrase;



