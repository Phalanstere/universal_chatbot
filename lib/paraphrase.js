var wordnet = require('wordnet');
var meta            = require('debug')('wordnet');
// var sw = require('stopword')
var stopwords       = require('./language_en/stopwords_en.json');
var fs              = require('fs');


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


/*
where	Where do you live?
who	Who are you?*
Who did you phone?**
when	When do you get up?
what	What is this?*
What are you doing?**
why	Why do you smoke?
whose	Whose book is this?
which	Which bus do you take to school?
how
*/

/*
Conjunctions Concession
though
although
even though
while
Conjunctions Condition
if
only if
unless
until
provided that
assuming that
even if
in case (that)
lest
Conjunctions Comparison
than
rather than
whether
as much as
whereas
Conjunctions Time
after
as long as
as soon as
before
by the time
now that
once
since
till
until
when
whenever
while
 
Conjunctions Reason
because
since
so that
in order (that)
why
Relative Adjective
that
what
whatever
which
whichever
 
Relative Pronoun
who
whoever
whom
whomever
whose
 
 
Conjunctions Manner
how
as though
as if
Conjunctions Place
where
wherever

*/



var SpeechAct = function() {
    var self = this;
    this.pronouns           = require('./language_en/pronouns.json');
    this.questions          = require('./language_en/questions.json');
    this.auxiliary          = require('./language_en/auxiliary.json');
    this.conjunctions       = require('./language_en/conjunctions.json');
    this.reflexive_pronouns = require('./language_en/reflexive_pronouns.json');


    /*
    this.reflexive_pronouns = [
        {
        word: "myself",
        type: "first person singular"    
        },
        {
        word: "yourself",
        type: "second person singular"    
        },
        {
        word: "himself",
        type: "third person singular",
        gender: "male"   
        },
        {
        word: "herself",
        type: "third person singular",
        gender: "female"   
        },
        {
        word: "itself",
        type: "third person singular",
        gender: "neutral"
        },

        {
        word: "ourselves",
        type: "first person plural", 
        },
        {
        word: "yourselves",
        type: "second person plural",   
        },
        {
        word: "themselves",
        type: "third person plural",   
        }
    ]
    */


    this.check_question_word = function(item) {
        var word = item.toLowerCase();

        meta("Check der Frage");

        for (var i = 0; i < self.questions.length; i++) {
            if (word === self.questions[i].word) 
                {
                return self.questions[i];    
                }

         }
    
    return null;
    }


    this.check_question = function(phrase) {
        var words = phrase.split(' ');
        var x = self.check_question_word( words[0]);

        
        if (x) {
            meta("Offendkundig eine Frage");
            
            self.act.type = "question", 
            self.act.probability = 1;
            self.sequence[0].type = "question_particle";
                       
        }
        else {
            meta("Die anderen Wörter");

            for (var n = 1; n < words.length; n++) {
                meta( words[n]);

               var x = self.check_question_word( words[n]); 
               if (x) {
                self.act.type = "question", 
                self.act.probability = 0.7;
                self.sequence[n].type = "question_particle";
               }
            }


        }

    meta(self.act);    
    }



    this.check_reflexive_pronoun_item = function( item ) {
        for (var n = 0; n < self.reflexive_pronouns.length; n++) {
            var p = self.reflexive_pronouns[n];
            if (p.word === item) return p;
        }
    }


    this.check_reflexive_pronoun = function() {
        meta("Reflexivpronomina");

        var words = self.splitted;
      
        for (var i = 0; i < words.length; i++) {
            var x = self.check_reflexive_pronoun_item( words[i] );
            if (x) {
                meta(" REFLEXIV " );
                
                if (! self.act.reflexive_pronoun) self.act.reflexive_pronoun = [];
                self.act.reflexive_pronoun.push(x);

                self.sequence[i].type = "reflexive_pronoun";
                self.sequence[i].reflexive_pronoun = x;
                
                }
            }

    }



    this.check_pronoun_item = function(item) {
        for (var n = 0; n < self.pronouns.length; n++) {
            var p = self.pronouns[n];
            if (p.word === item) return p;
        }
    }


    this.check_pronoun = function() {
      meta("Suche nach dem Subjekt");
      var words = self.splitted;
      
      for (var i = 0; i < words.length; i++) {
        var x = self.check_pronoun_item( words[i] );
        if (x) {
            if (! self.act.pronoun) self.act.pronoun = [];
            self.act.pronoun.push(x);

            self.sequence[i].type = "pronoun";
            self.sequence[i].pronoun = x;
            }
        }
    }


    this.check_auxiliary_item = function(item) {
        for (var n = 0; n < self.auxiliary.length; n++) {
            var p = self.auxiliary[n];
            if (p.word === item) return p;
        }
    }


    this.check_auxiliary = function () {
        meta("Suche nach Hilfsverben");
        var words = self.splitted;
        for (var i = 0; i < words.length; i++) {
        var x = self.check_auxiliary_item( words[i] );
        if (x) {
            self.act.auxiliary = x;
            self.sequence[i].type = "auxiliary";
            }
        }
    }

    this.check_conjunction_item = function( item ) {
        for (var n = 0; n < self.conjunctions.length; n++) {
            var p = self.conjunctions[n];
            if (p.word === item) return p;
        }
    }


    this.check_conjunctions = function() {
        meta("Suche nach Konkunktionen");
        var words = self.splitted;
        for (var i = 0; i < words.length; i++) {
        var x = self.check_conjunction_item( words[i] );
        if (x) {
            meta("Konjunktion gefunden");
            self.act.conjunction = x;
            self.sequence[i].type = "conjunction";
            }
        }
    }



    this.act = {};
    this.sequence = [];
    
    this.levelled_phrase = function(phrase) {
        var w = phrase.toLowerCase();
        self.splitted = w.split(' ');

        // creates the sequence
        for (var i = 0; i < self.splitted.length; i++) {
            var s = self.splitted[i];
            self.sequence.push( { word: s,
                                  type: null,
                                  } );
        }

    }


    this.unidentified = function() {
        for (var i = 0; i < self.sequence.length; i++) {
            var v = self.sequence[i];
            if (v.type === null) meta("unidentified " + v.word);
        }
    }


    this.process = function(phrase) {
        self.act = {};

        self.levelled_phrase(phrase);
        self.check_reflexive_pronoun();
        
        self.check_conjunctions();   
        self.check_auxiliary();
        self.check_question(phrase);
        self.check_pronoun();
        
        self.unidentified();


        meta( self.sequence );
        meta("Anzeige des Sprechakts");

        meta( self.act );
        


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


var p = new Paraphrase("I love myself");



module.exports = Paraphrase;