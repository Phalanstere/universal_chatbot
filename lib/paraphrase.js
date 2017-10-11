var wordnet = require('wordnet');
var meta            = require('debug')('wordnet');
// var sw = require('stopword')
var stopwords       = require('./stopwords_en.json');



/*
wordnet.lookup('affectionate', function(err, definitions) {

    if (definitions) 
    {

        definitions.forEach(function(definition) {
            // console.log('  words: %s', words.trim());
            meta ('  %s', definition.glossary);

            var x = Object.keys(definition.meta);

            meta( x );
            meta( definition.meta.synsetType );
            // words sind Synonyme
            meta( definition.meta.words );


        });
    }
    else meta("Kein Resultat");

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

    this.digest = function( definitions) {
        // meta("Anzahl erhaltene Definitionen " + definitions.length);
    }


    this.init = function() {
       var list = self.cleanup.process(phrase); 
       meta( list );

       self.WordNet.process( list, self.digest );
    }


    self.init();
}


var p = new Paraphrase("however, I want to stop pondering on poltics");



module.exports = Paraphrase;