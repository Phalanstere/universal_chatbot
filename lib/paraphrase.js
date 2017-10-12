var wordnet = require('wordnet');
var meta            = require('debug')('wordnet');
var spa             = require('debug')('speechact');


// var sw = require('stopword')
var stopwords       = require('./language_en/stopwords_en.json');
var fs              = require('fs');


/*
fs.readFile('./lib/language_en/verb_list.txt', 'utf8', function(err, data) {
  if (err) throw err;

  if (data) {
     spa("Verben sind eingelesen ");
     var list = data.split("\n");


     var newlist = [];

     
     for (var i = 0; i < list.length; i++) {
            var item = list[i];
            item = item.replace(/[0-9]/g, "");

            var x =  item.split("\t");
            var y = x.slice(1);
            spa(y);

            newlist.push( {
                word: y
            });
     }


     
     var s = JSON.stringify(newlist, null, 4);
     fs.writeFile("100_verbs.json", s);
     
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




var SpeechAct = function() {
    var self = this;
    this.pronouns           = require('./language_en/pronouns.json');
    this.questions          = require('./language_en/questions.json');
    this.auxiliary          = require('./language_en/auxiliary.json');
    this.conjunctions       = require('./language_en/conjunctions.json');
    this.reflexive_pronouns = require('./language_en/reflexive_pronouns.json');
    this.articles           = require('./language_en/articles.json');
    this.prepositions       = require('./language_en/prepositions.json');
    this.adjectives         = require('./language_en/adjectives.json');
    this.verbs              = require('./language_en/verbs.json');
    this.nouns              = require('./language_en/nouns.json');

    this.demonstrative      = [
        {
        word: "this",    
        type: "singular"
        },
        {
        word: "that",
        type: "singular"    
        },
        {
        word: "these",
        type: "plural"    
        },
        {
        word: "those",
        type: "plural"    
        }
    ]



    meta(this.verbs);


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


    /*
    this.check_preposition_item = function(item) {
        for (var n = 0; n < self.prepositions.length; n++) {
            var p = self.prepositions[n];
            if (p.word === item) return p;
        }
    }
    */

    this.check_item = function(item, type) {
        meta(item);

        var list; 
        switch(type) {
            case "adjective":
                list = self.adjectives;
            break;

            case "preposition":
                list = self.prepositions;
            break;

            case "noun":
                list = self.nouns;
            break;

            case "verb":
                list = self.verbs;
            break;

            case "demonstrative":
                list = self.demonstrative;
            break;
        }

        for (var n = 0; n < list.length; n++) {
            var p = list[n];


            if (p.word === item) return p;
        }

    }


    this.check_nouns = function() {
        meta("sollte Nouns suchen");
        var words = self.splitted;
        for (var i = 0; i < words.length; i++) {
        var x = self.check_item( words[i], "noun" );
        if (x) {
            meta("Noun gefunden");
            self.sequence[i].type = "noun";
            self.sequence[i].noun = x;
            }
        }        
    }


    this.check_demonstrative = function() {
        meta("sollte Demonstrtiva suchen");
        var words = self.splitted;
        for (var i = 0; i < words.length; i++) {
        var x = self.check_item( words[i], "demonstrative" );
        if (x) {
            meta("Demostrativ gefunden");
            self.sequence[i].type = "demonstrative";
            self.sequence[i].demonstrative = x;
            }
        } 
    }



    this.check_verb_item = function( item ) {
        list = self.verbs;

        for (var n = 0; n < list.length; n++) {
            var p = list[n];

            if (Array.isArray(p.word)) {
                for (var k = 0; k < p.word.length; k++) {
                    var w = p.word[k];
                    if (w === item) {

                        var form = "";

                        switch(k) {
                            case 0:
                                form = "infinitive";
                            break;
                            case 1:
                                if (p.word[1] === p.word[2] ) form  = "past or participle";    
                                else                          form  = "past";
                            break;

                            case 2:
                                if (p.word[1] === p.word[2] ) form  = "past or participle";    
                                else                          form  = "participle";
                            break; 

                            case 3:
                                form = "3rd person present";
                            break;

                            case 4:
                                form = "gerund";
                            break;
                        }


                        var res = {
                            word: w,
                            stem: p.word[0],
                            form: form

                        }

                        return res;
                        }
                }

            }
            else if (p.word === item) return p;
        }
    }



    this.check_verbs = function() {
        spa("sollte Verben suchen");
        var words = self.splitted;

        
        for (var i = 0; i < words.length; i++) {
        // var x = self.check_item( words[i], "verb" );
        var x = self.check_verb_item( words[i], "verb" );
        if (x) {
            meta("Verb gefunden");
            self.sequence[i].type = "verb";
            self.sequence[i].verb = x;
            }
        } 
                
    }



    this.check_addjectives = function() {
        meta("sollte Adjektive suchen");
        var words = self.splitted;
        for (var i = 0; i < words.length; i++) {
        var x = self.check_item( words[i], "adjective" );
        if (x) {
            meta("Adjektiv gefunden");
            self.sequence[i].type = "adjective";
            self.sequence[i].adjective = x;
            }
        }        
    }


    this.check_prepositions = function() {
        meta("sollte die Präpositionen suchen");
        var words = self.splitted;
        for (var i = 0; i < words.length; i++) {
        var x = self.check_item( words[i], "preposition" );
        if (x) {
            meta("Präposition gefunden");
            self.sequence[i].type = "preposition";
            self.sequence[i].preposition = x;
            }
        }
    }


    this.check_article_item = function(item) {
        for (var n = 0; n < self.articles.length; n++) {
            var p = self.articles[n];
            if (p.word === item) return p;
        }
    }


    this.check_articles = function() {
        meta("Suche nach Artikeln");
        var words = self.splitted;
        for (var i = 0; i < words.length; i++) {
        var x = self.check_article_item( words[i] );
        if (x) {
            self.sequence[i].type = "article";
            self.sequence[i].article = x;
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


    /*
    this.modify_prepositions = function() {
        var list = [];

        for (var i = 0; i < self.prepositions.length; i++) {
            item = self.prepositions[i];

            var o = {
                word: item,
                type: null
            }

            list.push( o );
        }

        var s = JSON.stringify( list, null, 4);
        meta( s );

        fs.writeFile("prepositions.json", s);
    }
    */

    this.check_relations = function() {

    }


    this.set_sequence_item = function(word, type) {

        for (var i = 0; i < self.sequence.length; i++) {
            var item = self.sequence[i].word;
            if (item === word) {
                self.sequence[i][type] = true;
                spa("ITEM gefunden " + item);
                }

            // item[type] = true;
        }

    }



    this.get_sequence_item = function(no, type) {
        var ct = 0;

        for (var i = 0; i < self.sequence.length; i++) {
            var item = self.sequence[i];
            if (item.type === type) {
                if ( ct === no) {
                    spa("habs gefunden ");
                    return i;
                } else ct ++;
   
            }
        }
    }


    this.find_probable_subject = function() {
        spa("sollte das 'Subjekt ausfindig machen");
        var assigned = false;

        // Kombination Artikel Noun
        var first = self.get_sequence_item(0, "article"); 
        var p = self.sequence[first];

        if (p) {
            spa(p);
            if (self.sequence[first+1]) {
                var q = self.sequence[first+1];
                if (q.noun) {
                    self.set_sequence_item(q.word, "subject");
                    assigned = true;
                    self.act.subject = q;
                     self.act.subject_position = first + 2;
                    }
                }
            
           if (assigned === false && self.sequence[first+2]) {
                var q = self.sequence[first+1];
                var r = self.sequence[first+2];
                if (q.type === "adjective" && r.noun) {
                    self.set_sequence_item(r.word, "subject");
                    assigned = true;  
                    self.act.subject = r;

                    self.act.subject_position = first + 2;
                }


               spa("mal sehen ... ")
           } 
        }

    }


    this.get_subject_position = function() {
        for (var i = 0; i < self.sequence.length; i++) {
          if (self.sequence[i].subject) return i;
        }
    }


    this.find_probable_predicate = function() {
        var assigned = false;

        var x = self.act.subject;      
        var no = x.position;


        // if (self.act.subject && ! self.act.subject_position) self.act.subject_position = self.get_subject_position();            
        // spa(self.act.subject_position);

        spa("Position des SUBJEKTS definiert " + no);

        if (self.sequence[no+1]) {
            spa("nächstes Wort");
            var p = self.sequence[no+1];
            if (p.verb) 
                {
                assigned = true;
                self.sequence[no+1].predicate = true;    
                self.act.predicate = p;
                self.act.predicate.position = no+1;
                }
            spa(p);
        }

        if (assigned === false && self.sequence[no+2]) {
            spa("evtl. eine Hilfsverbknstruktion");
            var p = self.sequence[no+1];
            var q = self.sequence[no+2];

            spa( p.type);
            spa( q.type );

            if (p.type === "auxiliary" && q.verb ) {
                spa("PREDICATE ASSIGNED");

                assigned = true;
                self.sequence[no+2].predicate = true;    
                self.act.predicate = q;
                self.act.predicate.position = no+2;    
                self.act.predicate.auxiliary = p;
            }

        }

        if (assigned === false) spa("Kein Prädikat gefunden");


    }




    this.check_identified_pronouns = function() {
        spa("Die identifizierten Pronomina");

        var pending = null;

        for (var i = 0; i < self.sequence.length; i++) {
            var x = self.sequence[i];

             if (x.type === "pronoun") {

                if (x.pronoun.grammar === "subject") {
                    spa("ein eindeutig identifiziertes Subjekt");    
                    self.act.subject = x;
                    self.act.subject.position = i;
                }

                if (x.pronoun.grammar === "subject_object") {
                    spa("UNEINDEUTIG - SUBJEKT OBJEKT");
                    if (self.act.subject) {
                        self.act.object = x;
                        self.act.object.position = i;
                        }
                    else  {
                        // the case that you are addressed: "Would you", "Could you"
                        if (x.word === "you" && i == 1)  {
                            spa("könnte eine Bitte sein");
                            var first = self.sequence[0];
                            if (first.type === "auxiliary") {
                                var second = self.sequence[2];
                                if ( second ) {
                                    if (second.verb) {
                                        spa("Es folgt ein Verb " + second.verb);

                                        if ( second.verb.form === "infinitive") {
                                            spa("eindeutig SUBJEKT");
                                           
                                            self.act.type = "request";
                                            if (self.splitted.includes("please")) self.act.probability = 1;
                                            else self.act.probability = 0.7;

                                            self.act.subject = x;
                                            self.act.subject.position = i;
                                            self.act.predicate = second;
                                        }

                                    }
                                }


                            }
                        ///////////////////////////////////////////////////////////

                        }


                    }
                }


                // Identifikation des Ojekts
                if (x.pronoun.grammar === "object") {
                    spa("EINDEUTIG - OBJEKT");
                    self.act.object = x;
                    self.act.object.position = i;

                    if (i === 1) {
                        var first = self.sequence[0];
                        spa ( first );

                        if (first.verb) {
                            if (first.verb.form === "infinitive") {
                                self.act.type = "imperative";  
                                self.act.probability = 0.8;
                                
                                self.act.predicate   = first;

                                self.act.subject = {
                                        word: "you",
                                        type: "subjectless",
                                        position: -1
                                        }
                                }
                            }
                    }

                }

            }

        }



    }


    


    this.check_speechacts = function() {
        // Frage, Wunsch, Belehrung, Kommando, Bitte, Gefühlsausdruck, Aussage [Repräsentativa], Verpflichtung, Deklaration
        // question, ..., ..., imperative
        self.check_identified_pronouns();
   
        /*
        if (self.act.pronoun && self.act.type !== "imperative") {
            spa("Länge der Pronomina " + self.act.pronoun.length);
            
            if (self.act.pronoun.length > 1)  {
                if (self.act.type === "question") {
                    spa("Das ist eine Frage - Umkehrung der Pronouns");
                }
                else
                {
                var first = self.get_sequence_item(0, "pronoun");    
                spa("Pronoun befindet sich am Punkt " + first);
                var p = self.sequence[first];
           
                self.act.subject = p; 
                self.act.subject_position = first;
                self.set_sequence_item(p.word, "subject");

                var second = self.get_sequence_item(1, "pronoun"); 
                var q = self.sequence[second];
                spa(q);
                self.set_sequence_item(q.word, "object");
                self.act.object = q;
                self.act.object.position = second;
                }
                
            }
            else {
              var p = self.act.pronoun[0];
              var first = self.get_sequence_item(0, "pronoun"); 
              
              if (p.word === "i" || p.word === "we") {
                  spa("Das scheint das Subjekt zu sein");
                  self.act.subject = p;
                  self.act.subject_position = first;
                  self.set_sequence_item(p.word, "subject")
              }
              else
              {
                if (p.grammar === "object") spa("Eindeutig - Objekt");   
              }

            }
        }

    */

    
    if (! self.act.subject) self.find_probable_subject();
    if (self.act.subject && ! self.act.predicate) self.find_probable_predicate();

    spa("SPRECHAKT");

    spa( self.act);
    // spa( self.sequence);
    }


    this.process = function(phrase) {
        self.act = {};

        self.levelled_phrase(phrase);

         self.check_verbs();
        
        self.check_prepositions();
        self.check_nouns();

        
        self.check_addjectives();
        self.check_demonstrative();

        
        self.check_reflexive_pronoun();
        self.check_articles();        
        self.check_conjunctions();   
        self.check_auxiliary();
        self.check_question(phrase);
        self.check_pronoun();
        

       

        self.unidentified();
        
        self.check_speechacts();
        // self.check_relations();


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


var p = new Paraphrase("I can hear you through the wall");



module.exports = Paraphrase;