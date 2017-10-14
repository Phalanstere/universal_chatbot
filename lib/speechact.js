var meta            = require('debug')('wordnet');
var spa             = require('debug')('speechact');
var spa2             = require('debug')('speechact:plural');
var debugm           = require('debug')('speechact:match');
var debugo           = require('debug')('object:object');
var debugt           = require('debug')('tidy');


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
            
            if (! self.act.aux) self.act.aux = [];
            self.act.aux.push(x);
            
            self.act.auxiliary = x;
            self.sequence[i].type = "auxiliary";
            }
        }
    }


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

            case "possessive":
                list = self.possessive;
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


    this.check_adverbs = function() {
        var words = self.splitted;
        for (var i = 0; i < words.length; i++) {
            var l = words[i].length;
            var v = words[i];
            if (v.length > 3) {
                var ending = v.substring(l-2, l);
                
                if (ending == "ly") {   
                    var adj = v.substring(0, l-2);               
                    var nd = v.substring(l-3, l);
                    if (nd === "bly") var adj = v.substring(0, l-1) + "e";

                    debugt("Das könnte ein Adverb sein " + adj);
                    var x = self.check_item( adj, "adjective" );
                    if (x) {
                        self.sequence[i].type = "adverb";
                        x.word = v;
                        self.sequence[i].adverb = x;
                        self.sequence[i].adverb.adjective = adj;
                        }

                    }
            }

            

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
            self.sequence[i].subject = null;
            self.sequence[i].object = null;
            self.sequence[i].genitive = null;
            self.sequence[i].prepositional_object = null;
        } else {

            var w = words[i];
            if (w[w.length-1] === 's') {
                var short = w.slice(0, w.length-1);
                spa2( short );
                var x = self.check_item( short, "noun" );
                if (x) {
                    spa2(" Eine Plural-Form" );
                    self.sequence[i].type = "noun";
                    self.sequence[i].noun = x;
                    self.sequence[i].subject = null;
                    self.sequence[i].object = null;
                    self.sequence[i].genitive = null;
                    self.sequence[i].prepositional_object = null;
                    self.sequence[i].numerus = "plural";
                    }
                }
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



    this.check_possessive = function() {
        spa("sollte die Possiva checken");
        var words = self.splitted;
        for (var i = 0; i < words.length; i++) {
        var x = self.check_item( words[i], "possessive" );
        if (x) {
            meta("PossessivDeterminer gefunden");
            self.sequence[i].type = "possessive";
            self.sequence[i].possessive = x;
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


    this.check_negation = function() {
        meta("sollte die Präpositionen suchen");
        var words = self.splitted;
        for (var i = 0; i < words.length; i++) {
        if (words[i] === "not")
            {
            debugt("Verneinung");
            self.sequence[i].type = "negation";
            self.sequence[i].negation = "not";
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



    // the following the function allow the dynamic search of a pattern
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


    this.find_sequential_element = function( el ) {
        var start = -1;
        for (var i = 0; i < self.sequence.length; i++) {
            var item = self.sequence[i];
            if (self.check_matching_pattern(item, el) === true) start = i;
            }

        if (start !== -1) return start;
        else              return null;
        
    }


    this.sequential_search = function( pattern ) {
        var start = self.find_sequential_element( pattern[0] );
        var found = true; // I assume optimnistically I can find the pattern

        if (start) {
            debugm("Start-Element gefunden");

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
                self.sequence[found+2].genitive = true;
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


    this.process = function(phrase) {
        self.phrase = phrase;

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
        self.check_possessive();        
        self.check_adverbs();
        self.check_negation();


        self.unidentified();
        
        self.check_speechacts();
        // self.check_relations();


        meta( self.sequence );
        meta("Anzeige des Sprechakts");

        // meta( self.act );
        


    }
}


module.exports = SpeechAct;