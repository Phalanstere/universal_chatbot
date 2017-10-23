var fs = require("fs");
var debug             = require('debug')('storage');



var DictionaryStorage = function( parent ) {

    var self = this;
    this.parent = parent;

    this.noun_list          = './lib/language_en/nouns.json';
    this.verb_list          = './lib/language_en/verbs.json';
    this.adjective_list     = './lib/language_en/adjectives.json';

    this.synsets    = './lib/language_en/synsets.json';

    this.store = function(name, list, styled) {
        var s = JSON.stringify( list );
        if (styled) s = JSON.stringify( list, null, 4);

        fs.writeFile( name, s); 
    }


    this.check_presence = function(word, ref) {
        for (var i = 0; i < ref.length; i++) {
            if (ref[i].word === word) return true;
        }
    return false;
    }


    this.get_list = function( it, ref ) {
        var list = [];
        var synset = [];

        for ( var n = 0; n < it.meta.words.length; n++) {
            var x = it.meta.words[n].word;  
            synset.push( x );  
            var res = self.check_presence(x, ref);
            if (! res) list.push( x );
            
        }

        return {
            list: list,
            synset: synset
        }
    }
    /*
    {
        "word": [
            "arrange",
            "arranged",
            "arranged",
            "arranges",
            "arranging"
        ]
    },
    */

    this.get_verb = function( word ) {

        debug( word );
        var n = word.length;
        debug (word[n-1] );

        var x = {
            word: []
        }
        var o = x.word;

        o.push( word);  


        // o.push ( word + "ed");
        // o.push ( word + "ed");

        var s;

        switch( word[n-1] ) {
            case "e":
                s = word + "d";
            break;

            case "y":
                s = word.slice(0, n-1) + "ied";
            break;

            default: 
              s = word + "ed";
            break;
        }

        debug ( s  );

        // past time
        o.push(s);

        // perfect
        o.push(s);



        // present
        switch( word[n-1] ) {
            case "y":
                s = word.slice(0, n-1) + "ies";
            break;

            default: 
              s = word + "s";
            break;
        }

        o.push (s);

        var n = word.length;
        if (word[n-1] === "e") {
            var s = word.slice(0, n-1);
            s += "ing";
            o.push ( s );
        }
        else  o.push ( word + "ing");

        return x;
    }


    this.get_all_verbs = function(list) {
        var res = [];
        for (var i = 0; i < list.length; i++) {
            var w = list[i];
            debug( w );
            var x = self.get_verb(w);
            res.push(x);
        }

    return res;
    }

    this.get_all_adjectives = function(list) {
        var res = [];
        for (var i = 0; i < list.length; i++) {
            var w = list[i];
            w = { word: w,
                 sentiment: null };

            res.push(w);
        }

    return res;
    }



    this.get_all_nouns = function( list ) {
        var res = [];
        for (var i = 0; i < list.length; i++) {
            var w = list[i];
            w = { word: w,
                 type: null };
            res.push(w);
        }

    return res;
    }





    this.store_synset = function( synset) {

        parent.synsets.push( synset);
        var s = JSON.stringify( parent.synsets, null, 4 );
        fs.writeFile( this.synsets, s);
    
    }


    this.process = function(defs, callback) {
        debug("sollte die Definitionen speichern " + defs.length);
        
        if (callback) debug( callback );


        for (var i = 0; i < defs.length; i++) {
            var it = defs[i];

            debug ( it );

            if (it) {
                // debug( it );

                if (it.meta.synsetType) {

                    switch( it.meta.synsetType ) 
                    {
                    case "noun":
                        self.list = self.parent.nouns;
                        debug("gespeicherte Wörter " + self.list.length);
                        
                        var res = self.get_list ( it, self.list );   
                        var words = self.get_all_nouns ( res.list );
                        for (var i = 0; i < words.length; i++) {
                             self.list.push(words[i]);
                         }

                        self.store( self.noun_list, self.list );
                        if (res.synset.length > 1) self.store_synset( res.synset );
                        
                    break; 

                    case "adjective":
                        self.list = self.parent.adjectives;
                        var res = self.get_list ( it, self.list );   
                        var words = self.get_all_adjectives ( res.list );
                        for (var i = 0; i < words.length; i++) {
                             self.list.push(words[i]);
                         }
                        self.store( self.adjective_list, self.list );
                        if (res.synset.length > 1) self.store_synset( res.synset );
                        
                        // if (callback) callback();
                    break; 

                    case "adjective satellite":
                        debug("Hier kommt ein abhängiges Adjektiv");
                        self.list = self.parent.adjectives;
                        var res = self.get_list ( it, self.list );   
                        var words = self.get_all_adjectives ( res.list );
                        for (var i = 0; i < words.length; i++) {
                             self.list.push(words[i]);
                         }
                        self.store( self.adjective_list, self.list );
                        if (res.synset.length > 1) self.store_synset( res.synset );

                        // if (callback) callback();

                    break;

                    case "adverb":
                        debug("Hier kommt ein Adverb ");
                        
                    break;


                    case "verb":
                        self.list = self.parent.verbs;                        
                         var res = self.get_list ( it, self.list );                      
                         var words = self.get_all_verbs( res.list );
                         for (var i = 0; i < words.length; i++) {
                             self.list.push(words[i]);
                         }

                         self.store( self.verb_list, self.list, true );
                         if (res.synset.length > 1) self.store_synset( res.synset );


                    break;

                    default: 
                        debug("noch nicht identifiziert " + it.meta.synsetType );
                    break;

                    }
                  
                }
                
                else debug("Das Wort ist unbekannt");
                // meta( it.meta.words[3] );
            }
        }
    }
}





module.exports = DictionaryStorage;