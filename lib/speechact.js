'use strict';

var meta                = require('debug')('wordnet');
var spa                 = require('debug')('speechact');
var spa2                = require('debug')('speechact:plural');
var debugm              = require('debug')('speechact:match');
var debugo              = require('debug')('object:object');
var debugt              = require('debug')('tidy');
var debuga              = require('debug')('adv');
var debugr              = require('debug')('relative');
var debugc              = require('debug')('nc');
var debugg              = require('debug')('digest:act');
var debugs              = require('debug')('storage');

var ISearch             = require('./iSearch.js');
var SpeechactTagger     = require('./speechact_tagger.js');
var Analysis            = require('./speechact_analysis.js');

debugs( Analysis);

var DictionaryStorage   = require('./dictionaryStorage.js');


var fs                  = require("fs");

var adverbial_clause    = require('./speechacts/adverbial_clause.json');
var relative_clause     = require('./speechacts/relative_clause.json');


var ARTICLE             =  { type: ["article", "possessive", "demonstrative"] } ;
var NOUN                =  { type: ["noun", "pronoun"] }
var NEGATION            =  { type:  "negation" };
var AUXILIARY           =  { type: "auxiliary" }; 
var ADJECTIVE           =  { type: "adjective" }; 
var ARTICLE_ADJECTIVE   =  { type: ["adjective", "article"] }
var VERB                =  { type: ["verb", "noun", "adjective"] };
var DOVERB              =  { type: ["verb", "noun", "adjective", "auxiliary"] };
var PREPOSITION         = {  type: "preposition" }; 
var ADVERB              = {  type: "adverb" };
var RELATIVE_PRONOUN    = {  type: "relative_pronoun" };
var DEGREE_ADVERB       = {  type: "degree_adverb" };
var GENITIVE_MARKER     = {  word: "of" };
var INFINITIVE          = {  word: "to" };
var HAVE                = {  word: ["has", "have", "had"] };



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
    this.possessive         = require('./language_en/possessive.json');
    this.nouns              = require('./language_en/nouns.json');
    this.relative_pronoun   = require('./language_en/relative_pronouns.json');
    this.aclause            = require('./language_en/adverbial_clause.json');
    this.synsets            = require('./language_en/synsets.json');


    this.Analysis           = new Analysis( this );

    this.colloquials = [
        {
        word: " don't ",
        replace: " do not "
        },
        {
        word: " dont ",
        replace: " do not "
        },
        {
        word: " didn't ",
        replace: " did not "
        },
        {
        word: " wouldn't ", 
        replace: " would not "
        },
        {
        word: " wouldnt ", 
        replace: " would not "
        },
        {
        word: " won't ", 
        replace: " will not "
        },
        {
        word: " haven't ", 
        replace: " have not "
        },
        {
        word: " hadn't ", 
        replace: " had not "
        },
        {
        word: " shouldn't ", 
        replace: " should not "
        },
        {
        word: " can't ", 
        replace: " can not "
        },
        {
        word: " couldn't ", 
        replace: " could not "
        },

    ]


/*
extremely	adjective	The water was extremely cold.
quite	adjective	The movie is quite interesting.
just	verb	He was just leaving.
almost	verb	She has almost finished.
very	adverb	She is running very fast.
too	adverb	You are walking too slowly.
enough	adverb	You are running fast enough.
*/

    this.degree_adverbs      = [
        {
        word: "extremely",
        following: "adjective"  
        },
        {
        word: "just",
        following: "verb"
        },
        {
        word: "almost",
        following: "verb"    
        },
        {
        word: "too",
        following: "adverb"
        },
        {
        word: "enough",
        followiing: ""
        }
    ];


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



    this.not_identified = [];
    this.storage        = null;

     

    this.get_missing_words = function(defs) {
        meta("bekomme die fehlenden Wörter " + defs.length);
        if ( ! self.storage )  self.storage = new DictionaryStorage( self );
        self.storage.process( defs );

    }


    this.unidentified = function( callback) {
        var list = [];

        for (var i = 0; i < self.sequence.length; i++) {
            var v = self.sequence[i];
            if (v.type === null) {
                meta("unidentified " + v.word);
                var o = {
                    item: v,
                    pos: i
                };
                self.not_identified.push( o );
                list.push( v.word);
                }
        }
    
    meta ( list );
    self.wordnet.process( list, self.get_missing_words, self.sentence_analysis );

    meta( self.not_identified[0]);
    }


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


    this.check_gerund_object = function(pos) {
        var assigned = false;

        if (self.sequence[pos+1]) {
            spa("Gerundivum Objekt");
            var item = self.sequence[pos+1];
            if (item.verb) {
                spa( item.verb );
                if (item.verb.form === "gerund") {
                    spa("Der Gerundivum ist das Objekt");
                    
                    self.set_sequence_item(item.word, "object");
                    self.act.object = item;
                    assigned = true;
                }
            }

        }

        if (assigned == false && self.sequence[pos+2]) {
            spa("vielleicht gibt es ein Adjektiv");
            var adj     = self.sequence[pos+1];
            var gerund  = self.sequence[pos+2];

            if (adj.type === "adjective" && gerund.verb) {
            spa("möglicherweise ein Gerund Objekt");
             if (gerund.verb.form === "gerund") {
                    self.set_sequence_item(gerund.word, "object");
                    self.act.object = gerund;
                    self.act.object.adjective = adj;
                    assigned = true; 
                }
            }

        }


    }


    this.check_gerund_subject = function() {
        var item = self.sequence[0];
        if (item) {
            if (item.verb) {
                spa( item.verb );
                if (item.verb.form === "gerund") {
                    spa("Der Gerundivum ist das Subjekt");
                    
                    self.set_sequence_item(item.word, "subject");
                    self.act.subject = item;
                }
            }


        }
    }



    this.check_combined_subject = function() {
        debugo("KOMBINATION");

        var pattern = [
            {
            word: "and"
            },            {
            type: ["article", "possessive"]
            },
        
            {
            type: "noun",
            subject: null,
            prepositional_object: null,
            genitive: null
            }
        ]
    
    var found = self.sequential_search( pattern );
    if (found) {
        debugo("KOMBINIERT - Fundstelle " + found)
        self.sequence[found+2].subject = true;

        self.act.subject.combined = true;
        if (! self.act.subject.coactors) self.act.subject.coactors = [];
            self.act.subject.coactors.push( self.sequence[found+2] );

            debugo("nochmalige Suche");
            self.check_combined_subject(found + 2);

        }
    }





    this.get_subject_position = function() {
        for (var i = 0; i < self.sequence.length; i++) {
          if (self.sequence[i].subject) return i;
        }
    }


    this.find_probable_predicate = function() {
        if (! self.act.subject) debugt("Hier gibt es ein Problem");
        var assigned = false;

        var x = self.act.subject;      
        var no = x.position;
        if (! no && self.act.subject_position) no = self.act.subject_position;



        // if (self.act.subject && ! self.act.subject_position) self.act.subject_position = self.get_subject_position();            
        // spa(self.act.subject_position);

        debugo("Position des SUBJEKTS definiert " + no);

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

        if (assigned === false) {
            spa("Kein Prädikat gefunden");
            // looking for the first verb
            for (var i = 0; i < self.sequence.length; i++ ) {
                var item = self.sequence[i];
                if (item.verb) {
                    
                    debugo ("Potenzielles Prädikat " + item.verb.form);
                    debugo ( item );
                    self.act.predicate = item;
                    self.sequence[i].predicate = true; 
                    self.act.predicate.position = i; 
                    }
            }
        }
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

    this.check_prepositional_object = function( pos ) {
        debugo("PREPOSDITION");


        if (self.sequence[ pos + 1 ]) {
            spa("Gibt es hier eine Präposition?");
            var item = self.sequence[ pos + 1 ];
            if ( item.type === "preposition") {
                if (self.sequence[pos + 3] ) {
                    var art = self.sequence[pos + 2];
                    var obj = self.sequence[pos + 3];
                    spa("nach einem Artikel fragen ");
                    spa( art );
                    spa("nach einem Objekt fragen ");
                    spa( obj );

                    var article = false;
                    if (art.type === "article" || art.type === "possessive") article = true;
  
                    if (article && obj.noun) {

                        debugt("PREPPER");

                        var phrase = item.word + " " + art.word + " " + obj.word;
                        spa( phrase );

                        self.act.prepositional_object = {
                            phrase: phrase,
                            prepositon: item,
                            article: art,
                            object: obj
                        }

                        spa (  self.act.prepositional_object );
                    }
                    else
                    {
                        spa( obj );
                        debugt("komplizierte Konstruktion");
                        var adj = obj;

                        if (adj.type === "adjective" || art.type === "possessive" && self.sequence[pos + 4]) {
                           var nobj =  self.sequence[pos + 4];
                           if (nobj.type === "noun") {
                                
                                debugt("PREPPER");
                                
                                var phrase = item.word + " " + art.word + " " + adj.word + " " + nobj.word;
                                spa( phrase );

                                self.act.prepositional_object = {
                                    phrase: phrase,
                                    prepositon: item,
                                    article: art,
                                    adjective: adj,
                                    object: nobj
                                }

                           }
                        }
                    }

                }


            }

        }

    }



    this.check_matching_pattern = function(item, el) {
        var keys = Object.keys(el);
        var found   = true;

 
        for (var k = 0; k < keys.length; k++) {
            var key = keys[k];
            if (found) {
            if (Array.isArray( el[key] ) === true) {
               
                var list = el[key];
                var some = false;
                for (var q = 0; q < list.length; q++) {
                    if ( item[key] === list[q] ) some = true;
                }
                if (some === false) found = false;
                else debugm("Das Array hat einen Treffer gegeben");
            }
            else if (item[key] !== el[key]) found = false;
            }

        }
        return found;
    }

                                                 // startpos is new
    this.find_sequential_element = function( el, startpos ) {
        var start = -1;
        var found = false;

        debuga("Übergebe Element");
        debuga( el );

        if ( ! startpos) startpos = 0;

        for (var i = startpos; i < self.sequence.length; i++) {
            var item = self.sequence[i];
            if (! found) {
                if (self.check_matching_pattern(item, el) === true) { start = i; found = true; }
                }

            }

        if (start !== -1) return start;
        else              return null;
        
    }


    this.sequential_search = function( pattern, startpos ) {
        var start = self.find_sequential_element( pattern[0] , startpos );
        var found = true; // I assume optimnistically I can find the pattern

        debuga(pattern );

        if (start) {
            debuga("Start-Element gefunden an der Position " + start);

            for (var n = 0; n < pattern.length; n++) {
            
                if (found) {
                    var p = pattern[n];
                    var item = self.sequence[n+start];

                    if (! item) found = false;
                    else found = self.check_matching_pattern(item, p);
                }
               
            }
        }

       if (found === true) return start;
       else                return null;
    }



    this.search_main_sentence = function(solution, offset) {
        var found = false;
        if (! found) {
            debuga("IMMER NOCH NICHT, offset steht bei " + offset);
            var ofound = self.intelligent_search("adverbial_phrase", offset);
            if (ofound) debuga("IMMERHIN !!!!!!!!!!!!!");
            else debuga ( self.sequence );
        }
    }


    this.intelligent_properties = function( obj, params) {
        debuga("sollte die Properties setzen");
        debuga ( params );

        obj[params.type] = {};
        var tg = obj[params.type];
        
        for (var i = 0; i < params.actual.length; i++) {
            var key = params.actual[i];
            debuga ( key);
            tg[key] = self.sequence[params.position + i];
            tg.phrase = params.phrase;
        }

        // debuga( self.act );
    }





    // analyzes the adverbial clause
   this.new_adverbial_clause = function( solution ) {
        if (! self.isearch) self.isearch = new ISearch( this );
        var seq = adverbial_clause;
        debugs("ADVERBIAL");
        debugs( solution);
        

        var ln = solution.item.split(" ").length;
        var pt = solution.offset - ln;
        for (var i = pt; i < solution.offset; i++) {
            self.sequence[pt].adverbial_clause = true;
        }


        self.isearch.process( seq, solution.offset );
   }
    

    // analyzes the relative clause
    this.relative_clause = function() {
        if (! self.isearch) self.isearch = new ISearch( this );
        var list = [];
        var seq = relative_clause;
        self.isearch.process( seq );
    }



    this.intelligent_search = function( type, offset ) {
        
        var list = [];
        var actual = [];

        var ARTICLE             =  { type: ["article", "possessive", "demonstrative"] } ;
        var NOUN                =  { type: ["noun", "pronoun"] }
        var NEGATION            =  { type:  "negation" };
        var AUXILIARY           = {  type: "auxiliary" }; 
        var ADJECTIVE           = {  type: "adjective" }; 
        var ARTICLE_ADJECTIVE   =  { type: ["adjective", "article"] }
        var VERB                =  { type: ["verb", "noun", "adjective"] };
        var PREPOSITION         = {  type: "preposition" }; 
        var ADVERB              = {  type: "adverb" };


        switch(type) {
            case "adverbial_phrase":
                debuga("ADVERBIALE PHRASE");

                // if the facts do not fit the theory
                var pt1 = [ ARTICLE, NOUN, AUXILIARY, NEGATION, VERB, ARTICLE, NOUN ];
                list.push( pt1 );
                actual.push (["article", "subject", "auxiliary", "negation", "predicate", "article", "object"]);

                // if the facts fit the theory
                var pt2 = [ ARTICLE, ADJECTIVE, NOUN, AUXILIARY, NEGATION, VERB, ARTICLE, NOUN ];
                list.push( pt2 );
                actual.push (["article", "asdjective", "subject", "auxiliary", "negation", "predicate", "article", "object"]);

                // if the king understands the game
                var pt3 = [ ARTICLE, NOUN, VERB, ARTICLE, NOUN ];
                list.push( pt3 );
                actual.push (["article", "subject", "predicate", "article", "object"]);

                // if the king is crazy
                var pt4 = [ ARTICLE, NOUN, AUXILIARY, ADJECTIVE ];
                list.push( pt4 );
                actual.push (["article", "subject", "predicate", "adjective"]);

                // if the king is crazy
                var pt5 = [ ARTICLE, NOUN, VERB, ADJECTIVE ];
                list.push( pt5 );
                actual.push (["article", "subject", "predicate", "adjective"]);

                // if this crazy language made any sense i would be glad
                var pt6 = [ ARTICLE, ADJECTIVE, NOUN, VERB, ARTICLE_ADJECTIVE, NOUN ];
                list.push( pt6 );
                actual.push (["article", "subject", "predicate", "adjective", "object"]);

                // if all the rich people in the world
                var pt7 = [ ADJECTIVE, ARTICLE, ADJECTIVE, NOUN, PREPOSITION, ARTICLE, NOUN, VERB, ARTICLE, NOUN ];
                actual.push (["adjective", "article", "adjective", "subject", "predicate", "adjective", "prepositional_object", "verb", "article", "object"]);
                list.push( pt7 );
                
                // golf was originally restricted to fat protestants  --- today it's open to anybody 
                var pt8 = [ NOUN, AUXILIARY, ADVERB, VERB, PREPOSITION, ADJECTIVE, NOUN ];
                actual.push (["noun", "auxiliary", "adverb", "predicate", "preposition", "adjective", "prepositional_object"]);
                list.push( pt8 );

                // golf was originally restricted to fat protestants  --- today it's open to anybody 
                var pt9 = [ NOUN, AUXILIARY, ADVERB, VERB, PREPOSITION, ADJECTIVE, ADJECTIVE, NOUN ];
                actual.push (["noun", "auxiliary", "adverb", "predicate", "preposition", "adjective", "prepositional_object"]);
                list.push( pt9 );

                // i know your name
                var pt10 = [ NOUN, VERB, ARTICLE, NOUN ];
                actual.push (["noun", "verb", "article", "object"]);
                list.push( pt10 );

                // i do not know your name
                var pt10 = [ NOUN, AUXILIARY, NEGATION, VERB, ARTICLE, NOUN ];
                actual.push (["noun", "verb", "article", "object"]);
                list.push( pt10 );

                // i have been called by the police
                var pt11 = [ NOUN, AUXILIARY, AUXILIARY, VERB, PREPOSITION, ARTICLE, NOUN ];
                actual.push (["noun", "verb", "article", "object"]);
                list.push( pt11 );

                // i do not have been called by the police
                var pt12 = [ NOUN, AUXILIARY, NEGATION, AUXILIARY, AUXILIARY, VERB, PREPOSITION, ARTICLE, NOUN ];
                actual.push (["noun", "verb", "article", "object"]);
                list.push( pt12 );

                // a fat man hit me
                var pt13 = [ ARTICLE, ADJECTIVE, NOUN, VERB, NOUN ];
                actual.push (["noun", "verb", "article", "object"]);
                list.push( pt13 );

            break;

            case "object":                  // the combination of obects             
               
                var pt1 = [ { type: ["article", "possessive"]}, { type: "adjective"}, { type: ["noun"]}  ];
                var pt2 = [ { type: ["article", "possessive"]}, { type: ["noun"]}  ];

                list.push( pt1 );
                list.push( pt2 );
                actual.push (["article", "adjective", "object"]);
                actual.push (["article", "object"]);

            break;
        }

        debuga("Länge der Liste " + list.length );
        // debuga( self.sequence );

        var assigned = false;

        for ( var i = 0; i < list.length; i++ ) {
            var pt = list[i];            
            if (! assigned) {
                var found = self.sequential_search( pt, offset );

                if ( found ) {
                    var phrase = self.get_subsequence(offset, pt.length);
                    debuga( type + " gefunden: " + phrase);

                    assigned = true;
                    
                    var o = {
                        type: type,
                        phrase: phrase,
                        position: offset,
                        actual: actual[i]
                        }

                    return o;
                }
                else debuga("NICHT GEFUNDEN");
            }

        }


        // var pt2 = [ { type: ["possessive", "article"]}, { type: ["noun"]}  ];
    }


    this.next_element = function(offset, type) {

        for (var n = offset; n < self.sequence.length; n++) {
            var item = self.sequence[n];
            debuga ( item.word );

            if ( Array.isArray( type )) {
                debuga("Das ist ein Array");
                for (var k = 0; k < type.length; k++) {
                    var key = type[k];
                    if ( item[key] ) return n;
                }

            }
            else {
                if ( item[type]) return n;
            }

        }
        return null;
    }

    this.mark_adverbial_clause = function( solution, offset) {
        debugg("sollte den CLAUSE markieren");


        if (solution.pos === 0) {
            debugg("NULLPOS");
            self.sequence[0].adverbial_clause = true;

            self.act.adverbial_clause = { position: 0 };

            for (var n = 0; n < offset; n++) {
               self.sequence[n].adverbial_clause = true;
            }

            debugc ("Jetzt die Suche nach dem CLAUSE ");
            debugc ( solution );

            debuga("Der Satz beginnt mit einem CLAUSE");
            
            // self.search_main_sentence(solution, offset);
            
           
            solution.offset = solution.it.word.split(" ").length;
            debugg("JETZT DER NEUE Adverbial " + solution.offset);
            self.new_adverbial_clause(solution);
        }
        else {
            debugc("Nicht am Anfang des Satzes " + offset);
            var x = solution.it.word.split(" ");

            debugc( x );
            var found = false;
            var off = 0;

            for (var i = 0; i < self.sequence.length; i++) {
                if (! found) {
                if ( self.sequence[i].word === x[0]) {
                    debugc("Position " + i);
                    off = i + x.length;
                    found = true;

                    }
            
                }
                
            }

            // offset += x.length;
            debugc("OFFSET " + off );
            solution.offset = off;

            self.new_adverbial_clause(solution, off);
        }
    }

    this.get_solution_offset = function( solution ) {
        var x = solution.it.word.split(" ");
        debugg( x );
    }



    this.check_adverbial_clause = function(pattern) {
        var found = self.sequential_search( pattern );
        if (found) return found;
        else return null;
        
    }



    // checks if there is an adverbial clause
    this.adverbial_clause = function() {
        debuga( self.phrase );
        var occ = [];

        for (var i = 0; i < self.aclause.length; i++) {
            var item = self.aclause[i].word;
            var s = item.split(" ");

            if (s.length === 1 || item.search('{') === -1 ) {
                item += "\\b";
                var reg = new RegExp(item, 'g');
                var x = self.phrase.search(reg);
                if (x !== -1) occ.push({ item: item, pos: x, it: self.aclause[i] } );
            } else {
                item = item.replace("{}", "\\w{1,}")
                var reg = new RegExp(item, 'g');
                var x = self.phrase.search(reg);
                if (x !== -1) occ.push({ item: item, pos: x, it: self.aclause[i] } );
            }           
        }
        
        debuga("Anzahl Fundstellen " + occ.length);

        if (occ.length > 0) debugc ("Adverbialklause liegt vor");
        {
            var solution;
            if (occ.length === 1) solution = occ[0];
            if (occ.length > 1) {

                var max = 0;
                var selected = -1;
                for (var i = 0; i < occ.length; i++) {
                    if (occ[i].item.length > max) {
                        max = occ[i].item.length;
                        selected = i;
                    }
                }
            solution = occ[selected];
            }
        
        if (solution) {
            // solution.phrase = self.phrase;
            var offset = solution.item.split(" ").length;
            self.mark_adverbial_clause( solution, offset );
            }

        }
    }



    this.find_probable_object = function() {
        debugo("sollte nach einem Objekt suchen");

        var pattern = [
            {
            type: ["article", "possessive"]
            
            },
            {
            type: "noun",
            subject: null,
            prepositional_object: null,
            genitive: null
            }
        ]

        debugo( pattern );

        var found = self.sequential_search( pattern );
        if( found ) {
            debugo("Objekt ist gefunden worden " + found);
            var candidate = self.sequence[ found + 1];
            if (! candidate.subject && ! candidate.prepositional_object) {
                candidate.object = true;
                
                self.set_sequence_item(candidate.word, "object");
                self.act.object = candidate;
                self.act.object.position = found + 1;
                var phrase = self.sequence[ found].word + " " + self.sequence[ found+1 ].word;
                self.act.object.phrase = phrase;                    

            }
            // self.sequence[ found + 1].object;
        }
        else  {

        var pattern = [
            {
            type: ["article", "possessive"]
            },
            {
            type: "adjective"
            },
            {
            type: "noun",
            subject: null,
            prepositional_object: null,
            genitive: null
            }
        ]
        
            debugo("NEUE SUCHE");
            var found = self.sequential_search( pattern );
            if (found) {
                var candidate = self.sequence[ found + 2];

                if (! candidate.subject && ! candidate.genitive) {
                    debugo("kein Subjekt und kein Genitiv");
                    
                    var phrase = self.sequence[ found].word + " " +  self.sequence[ found+1 ].word + " " + self.sequence[ found+2 ].word;
                    
                    debugo(phrase);

                    self.act.object = candidate;
                    self.act.object.article     = self.sequence[found];
                    self.act.object.adjective   = self.sequence[found+1];
                    self.act.object.phrase      = phrase;
                    self.act.object.position    = found + 2;


                }
            }
        }


    }


    this.check_genitive_object = function(pos) {
        spa2("Gibt es hier einen Genitiv");

        var pattern = [
            {
            type: "preposition",
            word: "of"    
            },
            {
            type: ["article", "possessive"]
            },
            {
            type: "noun",
            subject: null,
            object: null    
            }
        
        ]

        var found = self.sequential_search( pattern );
        if (found) {

            var phrase = self.sequence[found].word + " " + self.sequence[found+1].word + " " + self.sequence[found+2].word;
            debugm( phrase );

            debugm( self.act.subject.position);

            if (found === self.act.subject.position + 1) {
                var o = {
                    phrase: phrase,
                    position: found,
                    prepositon: self.sequence[found],
                    article: self.sequence[found+1],
                    object: self.sequence[found+2],
                }
                self.act.subject.genitive = o;
                self.sequence[found+2].genitive = true;
            }
            else {
                debugm("Das Genitiv Objekt bezieht sich nicht auf das Subjekt");
                if (self.act.object) debugm("Es gibt ein Objekt");
            }

            

            }
        else {
            debugm("sollte es erneut versuchen");

            var pattern = [
                {
                type: "preposition",
                word: "of"    
                },
                {
                type: "noun", 
                }
            ]

            debugm( pattern);

            var found = self.sequential_search( pattern );
            if (found) {
                 var o = {
                    phrase: phrase,
                    position: found,
                    prepositon: self.sequence[found],
                    object: self.sequence[found+1],
                }
                
                
                self.act.subject.genitive = o;
                if ( self.sequence[found+2] ) self.sequence[found+2].genitive = true;
            }
        }

    }



    this.get_predicate_time = function() {
       
        if (self.act.auxiliary) {
            var comb = self.act.auxiliary.word + " " + self.act.predicate.word;
            // debugt( self.act.predicate );

            if (self.phrase.search(comb) !== -1) 
                {
                if (self.act.aux.length === 1) 
                    {
                    debugt("gefunden " + self.act.predicate);
                    debugt( self.act.auxiliary );

                    // Perfekt-Konstruktion
                    var participle = false;

                    if ( self.act.predicate.verb.form == "past or participle" || 
                    self.act.predicate.verb.form == "participle") participle = true;

                    if (self.act.auxiliary.tempus === "present" && participle) return "present perfect";             
                    if (self.act.auxiliary.tempus === "past" && participle)  return "past perfect";


                    // check will 
                    var list = ['would'];
                    var conditional = false;
                    if (list.includes( self.act.auxiliary.word ) ) conditional = true;

                    if (self.act.auxiliary.tempus === "future" && ! conditional) return "future";
                    if (self.act.auxiliary.tempus === "future" && conditional) return "conditional";

                    // check subjunctive
                    var list2 = ['should', 'could'];
                    var subjunctive = false;
                    if (list2.includes( self.act.auxiliary.word ) ) subjunctive = true;

                    if (subjunctive) return "subjunctive";
                    }
                else {
                    debugt( self.act.aux );
                    debugt("Ende Hilsverb");
                    }
                
                }

        }
        else {
            
            if ( self.act.predicate.verb.form === '3rd person present' || 
                self.act.predicate.verb.form === 'infinitive' ) 
                        return "simple present";
                
           
            if ( self.act.predicate.verb.form === 'past') return "simple past";

        }
    }

    

    this.passive_combination = function()
    {

    }

    this.genus_verbi = function() {
        if (self.act.aux) {
            debugt("Check des Passivs " + self.act.aux.length);

            if (self.act.aux.length === 1) {
                debugt ( self.act.aux );
                debugt( self.act.aux[0].stem );

                var word = self.act.aux[0].word;

                var infinitive = false;
                if (self.act.predicate) { if (self.act.predicate.verb.form === "infinitive") infinitive = true; }

                if (infinitive && self.act.aux[0].word === "will") {   
                   return { genus: "active", tempus:"simple future" };         
                }

                if (infinitive && self.act.aux[0].word === "can") {   
                   return { genus: "active", tempus:"present", modal: word };         
                }

                if (infinitive && self.act.aux[0].word === "could") {   
                   return { genus: "active", tempus:"present", modal: "could", subjunctive: true };         
                }

                if (infinitive && self.act.aux[0].word === "shall") {   
                   return { genus: "active", tempus:"present", modal: "shall" };         
                }

                if (infinitive && self.act.aux[0].word === "should") {   
                   return { genus: "active", tempus:"present", modal: "should", subjunctive: true };         
                }

                if (infinitive && self.act.aux[0].word === "must") {   
                   return { genus: "active", tempus:"present", modal: "must" };         
                }


                if (self.act.predicate && self.act.aux[0].stem === "be") {
                    debugt("maybe passive");
                    var comb = self.act.aux[0].word + " " + self.act.predicate.word;
                    debugt(comb);
                    if (self.phrase.search(comb) !== -1) {
                        if ( self.act.aux[0].tempus === "present" ) {
                            debugt
                            return { genus: "passive", tempus:"present" };
                            }
                        if ( self.act.aux[0].tempus === "past" ) {
                            debugt
                            return { genus: "passive", tempus:"past" };
                            }
                        }
                }
               
            }
            else {
            ///
                debugt("Es gibt eine Kombination");
                if (self.act.aux.length === 2) {
                    var comb = self.act.aux[0].word + " " + self.act.aux[1].word + " " + self.act.predicate.word;
                    if (self.phrase.search(comb) !== -1) {
                        if (self.act.aux[0].stem === "have" 
                            && self.act.aux[1].stem === "be") {
                                var s = self.act.aux[0].word + " " +  self.act.aux[1].word;
                                debugt (s );
                                if (s === "has been") return { genus: "passive", tempus:"present perfect" };
                                if (s === "have been") return { genus: "passive", tempus:"present perfect" };
                                if (s === "had been") return { genus: "passive", tempus:"past perfect" };

                            }
                        var w = self.act.aux[0];

                        if (w.stem === "will" || w.stem === "can" || w.stem === "shall" || w.stem === "must") {
                            debugt("Das könnte ein Futur sein");
                            var s = self.act.aux[0].word + " " +  self.act.aux[1].word;
                            if (self.act.predicate) {
                                var type = self.act.predicate.verb.form;
                                var just = false;
                                if (type === "particle" || "past or particle") just = true;
                                if (just) {
                                    if (s === "will be")  return { genus: "passive", tempus:"simple future" };
                                    if (s === "would be")  return { genus: "passive", tempus:"present", modal: "would", subjunctive: true };

                                    if (s === "can be")     return { genus: "passive", tempus:"present", modal: "can" };
                                    if (s === "could be")   return { genus: "passive", tempus:"present", modal: "could", subjunctive: true };

                                    if (s === "shall be")     return { genus: "passive", tempus:"present", modal: "shall" };
                                    if (s === "should be")   return { genus: "passive", tempus:"present", modal: "should", subjunctive: true };

                                    if (s === "must be")     return { genus: "passive", tempus:"present", modal: "must" };

                                }
                            }

                        }
                    }

                }
            
                if (self.act.aux.length === 3) {
                    debugt("3 Hilfsverben");
                    var list = self.act.aux;
                    if (list[0].genus === "modal")
                        {
                        var p = list[0].word + " " + list[1].word + " " + list[2].word;
                        debugt( p );
                        if (p == "may have been") return { genus: "passive", tempus:"present perfect", modal: "may" };
                        if (p == "may had been") return { genus: "passive", tempus:"past perfect", modal: "may" };
                        if (p == "might have been") return { genus: "passive", tempus:"present perfect", modal: "might", subjunctive: true };                        
                        if (p == "might had been") return { genus: "passive", tempus:"past perfect", modal: "might", subjunctive: true };
                        
                        if (p == "could have been") return { genus: "passive", tempus:"past perfect", modal: "could", subjunctive: true };
                        if (p == "should have been") return { genus: "passive", tempus:"past perfect", modal: "should", subjunctive: true };
 
                        if (p == "would have been") return { genus: "passive", tempus:"past perfect", modal: "would", subjunctive: true };


                        }

                }

            ///
            }



        }
    }


    this.assign_adverbs = function(pos) {
        for (var i = 0; i <  self.sequence.length; i++) {
            var item =  self.sequence[i];
            if (item.type === "adverb") {
               if (i > pos -2) return item;

               if ( i === pos +1) return item;
            }
        }
    }


    this.tidy = function() {
        debugt("TIDY");
        // debugt( self.act );

        var act = {
            phrase: self.phrase
            }

        if (self.act.subject) {
           
            act.subject = Object.assign( self.act.subject );
            // debugt( act );
            
            delete act.subject.object;
            delete act.subject.subject;
            delete act.subject.prepositional_object;
            delete act.subject.adjective;

            }
        
        if (self.act.adverbial_clause) {
            act.adverbial_clause = Object.assign( self.act.adverbial_clause );
        }

        if (self.act.predicate) {
            act.predicate = Object.assign( self.act.predicate );
            act.predicate.type = "verb";

            // delete act.predicate.predicate;
            delete act.predicate.object;
            delete act.predicate.subject;
            delete act.predicate.genitive;
            delete act.predicate.prepositional_object;
            delete act.predicate.numerus;
            delete act.predicate.predicate;
            delete act.predicate.noun;
            
            act.predicate.tempus = self.get_predicate_time();
            var mode            = self.genus_verbi();
            if ( mode ) {
              debugt( mode );  
                act.predicate.genus     = mode.genus;
                act.predicate.tempus    = mode.tempus;
            if (mode.modal)             act.predicate.modal    = mode.modal;
                if (mode.subjunctive)   act.predicate.subjunctive = true;
            }

            var adv = self.assign_adverbs(act.predicate.position);
            if (adv) act.predicate.adverb = adv;

            //debugt( act );

        }

        if (self.act.prepositional_object) {
            debugt("EIN PRÄPOSITIONALES OBJEKT");

            act.prepositional_object = Object.assign( self.act.prepositional_object );
            delete act.prepositional_object.object.object;

            self.clean_null_elements( act.prepositional_object.object);
        }

        debugt("INFINITIVE ====================")

        if (self.act.infinitive_construction) {

            act.infinitive_construction = Object.assign( self.act.infinitive_construction );
            act.infinitive_construction.verb.type = "verb";
            delete act.infinitive_construction.verb.noun; 
            self.clean_null_elements( act.infinitive_construction.verb);


            debugt("CLEANUP ====================")
   
            if ( act.infinitive_construction.object) {
                debugt("TIDY ====================")

                debugt("Hier gibt es ein Objekt");
                self.clean_null_elements( act.infinitive_construction.object);
            }
        }

        // debugt(self.act);
       

        if (self.act.predicate) {

        debugt("ANALYSE");
        debugt( act );
        }

    debugt (" Das gesäuberte Objekt ");
    debugt( act );
    }

    this.clean_null_elements = function(obj) {
        for (var key in obj) {
            if (obj[key] === null)  delete obj[key];
        }
    }


    this.get_subsequence = function(pos, no) {
        var phrase = "";
        for (var i = pos; i < pos+no; i++) {
            phrase += self.sequence[i].word;
            if (i < pos + no -1 ) phrase += " ";
        }

        return phrase;
    }

    this.find_infinitive_construction = function() {
        debugo("Suche - Infinitivkonstruktion");

        var pattern0 = [{word: "to"},{ type: ["verb", "noun"] }, { type: "preposition"}, { type: ["article", "possessive"]}, { type: "adjective"}, { type: "noun"} ];
        var pattern = [{word: "to"},{ type: ["verb", "noun"] }, { type: "preposition"}, { type: ["article", "possessive"]}, { type: "noun"} ];
        var pattern1 = [{word: "to"},{ type: ["verb", "noun"] }, { type: ["article", "possessive"]}, { type: "noun"} ];
        var pattern2 = [{word: "to"},{ type: ["verb", "noun"] }, { type: ["noun", "pronoun", "conjunction"]} ];
        var pattern3 = [{word: "to"},{ type: ["verb", "noun"] }];

        var plist = [pattern0, pattern, pattern1, pattern2, pattern3];
        var assigned = false;

        for ( var i = 0; i < plist.length; i++ ) {
            var pt = plist[i];
            
            if (! assigned) {
                
                var found = self.sequential_search( pt );
                if ( found ) {
                    var phrase = self.get_subsequence(found, pt.length);
                    debugo("INITIVKONSTRUKTION");
                    debugo( phrase );
                    assigned = true;

                    

                    self.act.infinitive_construction = {
                        phrase: phrase
                    }

                    if ( pt.length === 2) {
                        debugt("hier gibt es nur zwei Elemente");
                        self.act.infinitive_construction.infinitive = self.sequence[found];
                        self.act.infinitive_construction.verb = self.sequence[found+1];
                    }
                    if ( pt.length === 3) {
                        debugt("hier gibt es drei Elemente");
                        self.act.infinitive_construction.infinitive = self.sequence[found];
                        self.act.infinitive_construction.verb = self.sequence[found+1];
                        self.act.infinitive_construction.object = self.sequence[found+2];
                    }
                    if ( pt.length === 4) {
                        debugt("hier gibt es vier Elemente");
                        self.act.infinitive_construction.infinitive = self.sequence[found];
                        self.act.infinitive_construction.verb = self.sequence[found+1];
                        self.act.infinitive_construction.article = self.sequence[found+2];
                        self.act.infinitive_construction.object = self.sequence[found+3];
                    }
                    if ( pt.length === 5) {
                        debugt("hier gibt es fünf Elemente");
                        self.act.infinitive_construction.infinitive = self.sequence[found];
                        self.act.infinitive_construction.verb = self.sequence[found+1];
                        self.act.infinitive_construction.preposition = self.sequence[found+2];
                        self.act.infinitive_construction.article = self.sequence[found+3];
                         self.act.infinitive_construction.object = self.sequence[found+4];
                    }

                }
            }
        }

    }

    

    this.check_speechacts = function() {
        // Frage, Wunsch, Belehrung, Kommando, Bitte, Gefühlsausdruck, Aussage [Repräsentativa], Verpflichtung, Deklaration
        // question, ..., ..., imperative
        if ( self.act.subject ) debuga("Das Subjekt ist bereits definiert");
        
        self.check_identified_pronouns();
        self.check_gerund_subject();

        if (! self.act.subject) self.find_probable_subject();
        if (self.act.subject) self.check_genitive_object( );


        if (self.act.subject && ! self.act.predicate) self.find_probable_predicate();

        if (self.act.subject && self.act.predicate) {
            var pos = self.act.predicate.position; 
            self.check_gerund_object(pos);
            };


        if (self.act.subject && self.act.predicate) {
            var pos = self.act.predicate.position; 
            debugo("CHECK PREPOSITION");
            self.check_prepositional_object( pos );
            }
        else {
            if (self.act.subject) {
                
                var pos = self.act.subject.position; 
                debugo("Position des Subjekts" + pos);
                self.check_prepositional_object( pos );
                
                }
            }

        self.find_infinitive_construction();


        if (self.act.subject) self.find_probable_object();

        if (self.act.subject && self.act.predicate) {
            var pos = self.act.predicate.position;
            }


        if (! self.act.predicate && self.act.subject) self.find_probable_predicate();
        else debugt("Es gibt weder Subjekt noch Prädikat");


        spa("SPRECHAKT");

        debugo ( self.act);
        
        spa("SEQUENZ");
        debugt( self.sequence);
        return self.tidy();


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
                    self.act.subject_position = first + 1;
                    self.act.subject.position = first + 1;
                    self.check_combined_subject(first + 2);

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
                    self.act.subject.position = first + 2;
                }


               spa("mal sehen ... ")
           } 
        }

    }





    this.infinitive_clause = function() {
        debugs("sollte einen infinitive clause ausfindig machen");
        if (! self.isearch) self.isearch = new ISearch( this );

    

        var pattern = {word: "to"};
        var off = self.find_sequential_element(pattern);

        if (off) 
        {
        debugs("TO AN DER POSITION " + off);

            var seq = {
                    type: "infinitive_clause",
                    list: "subject_nouns", // the array that hold the entries

                    excludes: ["relative_clause", "adverbial_clause"],
        
                    sequence: [
                            {
                            type: "infinitive",
                            optional: false,
                            pattern:     {
                                        sequence: [
                                                    { type: INFINITIVE, optional: true, desc: "infinitive"}, 
                                                ],
                                        delimiter: [ ARTICLE, ADJECTIVE, PREPOSITION, NOUN],
                                        on_finished: null
                                        },
                            },
                            {
                            type: "predicate",
                            optional: false,
                                pattern:    {
                                        sequence: [
                                                    { type: VERB, optional: false, desc: "genitive_marker"}, 
                                                ],
                                        delimiter: [ PREPOSITION, NOUN],
                                        on_finished: null
                                        },

                            },
                            {
                            /*
                                the street
                                the crowded street
                                the extremely crowded street

                            */    
                            type: "object",
                            optional: true,
                            pattern:    {
                                        sequence: [
                                                    { type: ARTICLE, optional: true, desc: "article"}, 
                                                    { type: DEGREE_ADVERB, optional: true, desc: "degree_adverb"},
                                                    { type: ADVERB, optional: true, desc: "adverb"},
                                                    { type: ADJECTIVE, optional: true, desc: "adjective" },
                                                    { type: NOUN, optional: false, desc: "noun" }
                                                ],
                                        on_finished: null
                                        },
                            },
                            {
                            type: "prepositional_object",
                            optional: true,
                            pattern:    {
                                        sequence: [
                                                { type: PREPOSITION, optional: false, desc: "adverb"}, 
                                                { type: ARTICLE, optional: true, desc: "article"}, 
                                                { type: DEGREE_ADVERB, optional: true, desc: "degree_adverb"},
                                                { type: ADJECTIVE, optional: true, desc: "adjective" },
                                                { type: NOUN, optional: false, desc: "noun" }
                                            ],
                                        }    
                            }
                    ]

            }


            var res = self.isearch.process( seq, off, "infinitive_clause" ); // at the beginning of the sentence
            if (res.length > 0) self.mark_elements(res, "infinitive_clause", off);
        
            return res;

        }
        else debugs("Es gibt keine Infinitivkonstruktion");
            

    }


    self.mark_elements = function(seq, type, offset) {
        debugs("sollte die Elemente markieren");


        for (var i = 0; i < seq.length; i++) {
            var obj = seq[i];
            for (var k = 0; k < obj.elements.length; k++) {
                // var el = obj.elements[ k ];
                var s = self.sequence[offset];
                s[type] = true;

                debugs( s.word );
                /*
                if (el.item.word === s.word) {
                    s[type] = true;
                }
                */

                offset ++;
            }

        }

        var txt = JSON.stringify(self.sequence, null, 4);
        fs.writeFile("sequence.json", txt);

    }



    this.identity_clause = function() {
        if (! self.isearch) self.isearch = new ISearch( this );
        var list = [];

        var seq = {
                   type: "subject",
                   list: "subject_nouns", // the array that hold the entries

                   excludes: ["relative_clause", "adverbial_clause", "infinitive_clause"],


                   // who thougtfully looked
                   // who did not see
                   // skillfully was beaten
                   //            had eaten
                   // who could not see                 
     
                   sequence: [
                        {
                        type: "subject",
                        optional: false,
                        pattern:     {
                                    sequence: [
                                                { type: ARTICLE, optional: true, desc: "article"}, 
                                                { type: DEGREE_ADVERB, optional: true, desc: "degree_adverb"},
                                                { type: ADJECTIVE, optional: true, desc: "adjective" },
                                                { type: NOUN, optional: false, desc: "noun" },
                                            ],
                                    delimiter: [ PREPOSITION, NOUN],
                                    on_finished: null
                                    },
                        },
                        {
                        type: "genitive_object",
                        optional: true,
                            pattern:    {
                                    sequence: [
                                                { type: GENITIVE_MARKER, optional: false, desc: "genitive_marker"}, 
                                                { type: ARTICLE, optional: true, desc: "article"}, 
                                                { type: NOUN, optional: false, desc: "noun" }
                                            ],
                                    delimiter: [ PREPOSITION, NOUN],
                                    on_finished: null
                                    },

                        },
                        {
                        type: "predicate",
                        optional: false,
                        pattern:     {
                                    sequence: [
                                                { type: HAVE, optional: true, desc: "first_auxiliary", negator: [ VERB ] },                                                
                                                { type: AUXILIARY, optional: false, desc: "auxiliary", negator: [ VERB ] },
                                            ],
                                    on_finished: null
                                    },
                        },
                        {
 
                        type: "adjective",
                        optional: true,
                        pattern:    {
                                    sequence: [
                                                { type: DEGREE_ADVERB, optional: true, desc: "degree_adverb"},
                                                { type: ADVERB, optional: true, desc: "adverb"},
                                                { type: ADJECTIVE, optional: false, desc: "adjective" },
                                            ],
                                    on_finished: null
                                    },
                        },

                        {
                        /*
                            the street
                            the crowded street
                            the extremely crowded street

                        */    
                        type: "subject_quality",
                        optional: true,
                        pattern:    {
                                    sequence: [
                                                { type: ARTICLE, optional: true, desc: "article"}, 
                                                { type: DEGREE_ADVERB, optional: true, desc: "degree_adverb"},
                                                { type: ADVERB, optional: true, desc: "adverb"},
                                                { type: ADJECTIVE, optional: true, desc: "adjective" },
                                                { type: NOUN, optional: true, desc: "noun" }
                                            ],
                                    on_finished: null
                                    },
                        },
                        {
                        type: "prepositional_object",
                        optional: true,
                        pattern:    {
                                    sequence: [
                                            { type: PREPOSITION, optional: false, desc: "adverb"}, 
                                            { type: ARTICLE, optional: true, desc: "article"}, 
                                            { type: DEGREE_ADVERB, optional: true, desc: "degree_adverb"},
                                            { type: ADJECTIVE, optional: true, desc: "adjective" },
                                            { type: NOUN, optional: false, desc: "noun" }
                                        ],
                                    }    
                        }
                   ]

         }


        var res = self.isearch.process( seq, 0, "identity_clause" ); // at the beginning of the sentence
        
        if (res) self.mark_elements(res, "identity_clause", 0);
        return res;


    }



    this.main_sentence = function() {
        if (! self.isearch) self.isearch = new ISearch( this );
        var list = [];

        var seq = {
                   type: "subject",
                   list: "subject_nouns", // the array that hold the entries

                   excludes: ["relative_clause", "adverbial_clause", "infinitive_clause"],


                   // who thougtfully looked
                   // who did not see
                   // skillfully was beaten
                   //            had eaten
                   // who could not see                 
     
                   sequence: [
                        {
                        type: "subject",
                        optional: false,
                        pattern:     {
                                    sequence: [
                                                { type: ARTICLE, optional: true, desc: "article"}, 
                                                { type: DEGREE_ADVERB, optional: true, desc: "degree_adverb"},
                                                { type: ADJECTIVE, optional: true, desc: "adjective" },
                                                { type: NOUN, optional: false, desc: "noun" },
                                            ],
                                    delimiter: [ PREPOSITION, NOUN],
                                    on_finished: null
                                    },
                        },
                        {
                        type: "genitive_object",
                        optional: true,
                            pattern:    {
                                    sequence: [
                                                { type: GENITIVE_MARKER, optional: false, desc: "genitive_marker"}, 
                                                { type: ARTICLE, optional: true, desc: "article"}, 
                                                { type: NOUN, optional: false, desc: "noun" }
                                            ],
                                    delimiter: [ PREPOSITION, NOUN],
                                    on_finished: null
                                    },

                        },
                        {
                        type: "predicate",
                        optional: false,
                        pattern:     {
                                    sequence: [
                                                { type: ADVERB, optional: true, desc: "adverb"}, 
                                                { type: AUXILIARY, optional: true, desc: "auxiliary" },
                                                { type: NEGATION, optional: true, desc: "negation" },
                                                { type: ADVERB, optional: true, desc: "adverb"},
                                                { type: DOVERB, optional: false, desc: "verb" }
                                            ],
                                    on_finished: null
                                    },
                        },
                        {
                        /*
                            the street
                            the crowded street
                            the extremely crowded street

                        */    
                        type: "object",
                        optional: true,
                        pattern:    {
                                    sequence: [
                                                { type: ARTICLE, optional: true, desc: "article"}, 
                                                { type: DEGREE_ADVERB, optional: true, desc: "degree_adverb"},
                                                { type: ADVERB, optional: true, desc: "adverb"},
                                                { type: ADJECTIVE, optional: true, desc: "adjective" },
                                                { type: NOUN, optional: false, desc: "noun" }
                                            ],
                                    on_finished: null
                                    },
                        },
                        {
                        type: "prepositional_object",
                        optional: true,
                        pattern:    {
                                    sequence: [
                                            { type: PREPOSITION, optional: false, desc: "adverb"}, 
                                            { type: ARTICLE, optional: true, desc: "article"}, 
                                            { type: DEGREE_ADVERB, optional: true, desc: "degree_adverb"},
                                            { type: ADJECTIVE, optional: true, desc: "adjective" },
                                            { type: NOUN, optional: false, desc: "noun" }
                                        ],
                                    }    
                        }
                   ]

         }


        var res = self.isearch.process( seq, 0, "main" ); // at the beginning of the sentence
   
        return res;

    }



    this.speechact_analysis = function(phrase) {
        debugs ("Neue Analyse des Sprechakts");

        self.check_identified_pronouns();
        self.check_gerund_subject();
;
        var main = self.main_sentence();
        if (main) 
                {
                debugs( main );
                self.act.main = main;
                }
        else {
            debugs("Kein Hauptsatz");
            // self.identity_clause();
        }


        // if (self.act.subject) debugg( self.act);

        // debugg( self.act.adverbial_clause );

        
        var s = JSON.stringify( self.act, null, 4 );
        fs.writeFile("analysis.json", s);

        s = JSON.stringify( self.sequence, null, 4 );
        fs.writeFile("sequence.json", s);

        self.Analysis.process();

        
    }


    this.get_phrase = function(type) {
        var s = "";

        for (var i = 0; i < self.sequence.length; i++) {
            var item = self.sequence[i];
            if ( item[type] === true) s += item.word + " ";
        }

        debugg ( s );
        return s;
    }


    this.sentence_analysis = function() {
        var phrase = self.phrase;
        debugs("Jetzt kommt die Satzanalyse");
        self.levelled_phrase(phrase);
        self.tagger = new SpeechactTagger(self, phrase);

        /*
        self.adverbial_clause();
        if ( self.act.adverbial_clause) self.act.adverbial_clause.phrase = self.get_phrase("adverbial_clause");
        if (self.act.relative_pronouns) self.relative_clause();
        var main = self.speechact_analysis();
        self.act.push(main);
        */
        self.analysis();


            // self.check_relations();

        // meta( self.sequence );
        meta("Anzeige des Sprechakts");
        // debugs( self.sequence );
        self.Analysis.process();

    }


    this.remove_colloquial = function(phrase) {
        for (var i = 0; i < self.colloquials.length; i++) {
            var n = self.colloquials[i];
            phrase = phrase.replace(n.word, n.replace);
        }

        return phrase; 
    }


    this.analysis = function() {
        self.adverbial_clause();
        if ( self.act.adverbial_clause) self.act.adverbial_clause.phrase = self.get_phrase("adverbial_clause");
        if (self.act.relative_pronouns) self.relative_clause();
        else debugg("Es gibt keinen Relative - Clause");
        var inf = self.infinitive_clause();
        if ( inf ) {
            if (inf.elements ) debugs("Es gibt einen Infinitive Clause");
            debugs( inf );
            self.act.infinitive_clause = inf;
            }

        self.identity_clause();
        self.speechact_analysis();
    }


    this.process = function(phrase) {
        phrase = self.remove_colloquial( phrase );

        self.phrase = phrase;
        
        self.act = {};
        self.levelled_phrase(phrase);
        self.tagger = new SpeechactTagger(self, phrase);

        self.unidentified();   
        meta("Anzahl der fehlenden Wörter " + self.not_identified.length );


        if ( self.not_identified.length === 0) {
            self.analysis();
        }
        else {
            debugs( self.not_identified );
            debugs("sollte einen Timeout starten für " + self.not_identified);   
            setTimeout(self.sentence_analysis, 5000);
        }

    


    }
}


module.exports = SpeechAct;