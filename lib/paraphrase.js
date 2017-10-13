var wordnet = require('wordnet');
var meta            = require('debug')('wordnet');
var spa             = require('debug')('speechact');


// var sw = require('stopword')
var stopwords       = require('./language_en/stopwords_en.json');
var fs              = require('fs');


var SpeechAct       = require('./speechact.js');



/*
fs.readFile('./lib/language_en/1500nouns.txt', 'utf8', function(err, data) {
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


var p = new Paraphrase("You had driven a car");



module.exports = Paraphrase;




