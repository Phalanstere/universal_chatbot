var meta            = require('debug')('tagger');

var SpeechactTagger = function(parent, phrase) {

    var self = this;

    this.pronouns           = parent.pronouns;
    this.questions          = parent.questions
    this.auxiliary          = parent.auxiliary;
    this.conjunctions       = parent.conjunctions;
    this.reflexive_pronouns = parent.reflexive_pronouns;
    this.articles           = parent.articles;  
    this.prepositions       = parent.prepositions;
    this.adjectives         = parent.adjectives;
    this.verbs              = parent.verbs;
    this.possessive         = parent.possessive;
    this.nouns              = parent.nouns;
    this.relative_pronoun   = parent.relative_pronoun;
    this.aclause            = parent.aclause;
    this.demonstrative      = parent.demonstrative;

    this.splitted           = parent.splitted;
    self.sequence           = parent.sequence;
    self.act                = parent.act;



    this.check_reflexive_pronoun_item = function( item ) {
        for (var n = 0; n < self.reflexive_pronouns.length; n++) {
            var p = self.reflexive_pronouns[n];
            if (p.word === item) return p;
        }
    }


    this.check_reflexive_pronoun = function() {
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

            case "relative_pronoun":
                list = self.relative_pronoun;
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

            default:
                list = [];
                debugr("Liste ist falsch definiert " + type )
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

                    meta("Das könnte ein Adverb sein " + adj);
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
                meta ( short );

                var test = new RegExp(/ies\b/);
                var ndx = w.search(test);
                if (ndx !== -1) meta("PLURAL MIT IES " + ndx);
                short = w.slice(0, ndx) + "y";
                meta ( short );

                var x = self.check_item( short, "noun" );
                if (x) {
                    meta (" Eine Plural-Form" );
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
        meta ("sollte Verben suchen");
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


    this.check_relative_pronouns = function() {
        var words = self.splitted;
        for (var i = 0; i < words.length; i++) {
        var x = self.check_item( words[i], "relative_pronoun" );
        if (x) {
            meta ("Relativ-Pronomen gefunden");
            self.sequence[i].type = "relative_pronoun";
            self.sequence[i].relative_pronoun = x;
            self.sequence[i].relative_pronoun.position = i;

            if (! self.act.relative_pronouns) self.act.relative_pronouns = [];
            self.act.relative_pronouns.push( self.sequence[i].relative_pronoun );

            }
        }  
    }


    this.check_possessive = function() {
        meta ("sollte die Possiva checken");
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
            meta ("Verneinung");
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



this.process = function() {
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
        self.check_relative_pronouns();
    }


    self.process();

}


module.exports = SpeechactTagger;