var debug             = require('debug')('relative:general');
var debugs             = require('debug')('relative:search');
var debugm             = require('debug')('relative:match');
var debugd             = require('debug')('relative:digest');
var debugc             = require('debug')('nc');
var dig                = require('debug')('digest');
var debugg             = require('debug')('genitive');


var ISearch = function( speechact ) {

    var self = this;
    self.sequence = speechact.sequence;
    self.act      = speechact.act; 

    this.check_matching_pattern = function(item, params) {
        var pattern = params.type.type;
        var el = params.type;
        var mkeys = Object.keys(el); 

        for (var k = 0; k < mkeys.length; k++ ) {
            var key = mkeys[k];
            debug( key );
            if ( key === "word") {
                debugg("GENITIV MARKER");
                debugg( item[key] );
                }


            if (Array.isArray( el[key] ) === true) {
                var list = el[key];
                debug("Ein Array " + list);
                var some = false;
                for (var q = 0; q < list.length; q++) {
                    if ( item[key] === list[q] ) {
                        debugs ("PATTERN GEFUNDEN");
                        some = true;
                        }
                }
                if (some === false) return false;
                else return true;
                }
            else {
               debug("Kein Array"); 
               if (item[key] === el[key]) return true;
               else                       return false;
            }
        }



        debugm ( "THE PATTERN IS " + mkeys);
     



        return false;
    }





    this.check_sequence_element = function( element, offset ) {
        debugs("Now the search, ITEM is: ");
        var pattern = element.pattern;

        var item = self.sequence[offset];
        // Die Liste bekommt die Ergebnisse der Sequenz
        var list = new Array( pattern.sequence.length );

        var valid = true;

        for (var i = 0; i < pattern.sequence.length; i++) {
        // for (var i = 0; i < 4; i++) {
            debugs( item );

            if ( valid ) {
            // holt das erste Element aus der Sequenz heraus
            var p = pattern.sequence[i];
            // Vergleich - ist es da
            if ( item ) 
                {
                var found = self.check_matching_pattern(item, p);
                debug("GEFUNDEN " + found);

                if ( found )   {              
                    list[i] = true;
                    // debugs( list );

                    offset ++;
                    item = self.sequence[offset];
                    if ( ! item ) valid = false;  // Dann muss die Suche abgebrochen werden
                    }
                else list[i] = false;
                }
            else return false;


            }

        debug( list );
        }

    return list;   
    }


    
    this.change_to_array = function( obj ) {
        debugc("WANDLUNG ARRAY");

        var copy = Object.assign({}, obj);
        debugc("Die Kopie");
        debugc( copy );

        obj = [];
        obj.push( copy );
        debugc ( "Länge des Arrays " + obj.length );
        
        return obj;
    }


    this.digest = function(element, results, offset) {
     
        debugc ( element );
        debugd("OPTIONAL ist " + element.optional);


        var seq = element.pattern.sequence;
        debugd( seq.length );
        var valid = true;
        var inc   = 0;

        debugc("TYPUS " + element.type );


        var toff = offset;

        for (var n = 0; n < seq.length; n ++) {          
            var item = self.sequence[offset];
            if (results[n] === true) { 

                var item = self.sequence[offset];                
                var desc = seq[n].desc;
                item[self.params.type] = true;

                debug ( item.word + " " + desc );

                inc ++; 
                offset ++; 
                }
            if ( seq[n].optional === false && results[n] === false) valid = false;


        }


        if (element.type === "genitive_object") {
            debugc("EIN GENITIV OBJEKT " + valid);
        }

        dig("Aufgabe bewältigt: " + valid);
        dig("inc steht bei " + inc);
        
        if (valid) {
            // debugc ( self.params.type );
            // debugc ( element.type );
            dig ("Offset steht bei " + toff);

            if ( self.act[self.params.type][element.type] ) {
                self.act[self.params.type][element.type] = self.change_to_array(  self.act[self.params.type][element.type] );
            }
            else self.act[self.params.type][element.type] = {};
            
            
            var obj = self.act[self.params.type][element.type];


            if (Array.isArray( obj ) === true) {               
                obj = {};
                self.act[self.params.type][element.type].push( obj );;
            }

            for (var n = 0; n < seq.length; n ++) {        
                if (results[n] === true) {
                    dig("TRUE");
                    var desc = seq[n].desc;
                    debugc( desc );

                    var item = self.sequence[toff];
                    debugc ( item.word );


                    obj[desc] = item;
                    
                    toff ++;
                    }
                }


            }

        


        if ( valid === false && element.optional === true) {
            valid   = true;
            inc     = 0;
            }

        var res = {
            valid: valid,
            inc:   inc
        }
        
        return res;

        
    }


    this.process_sequence = function( sequence, offset ) {
        debug("Der Offset steht an Position " + offset );
        debug ( "Ich suche nach dem " + self.params.type );



        // debug(" Anzahl möglicher Elemente" + sequence.length ); 

        var valid = true; 

        // here I am cycling throu the elements of the sequence
        for (var i = 0; i < sequence.length; i++) {
            if (valid) {
            
                debugc("I am looking for the " + sequence[i].type );
                var el = sequence[i];
                var res = self.check_sequence_element( el, offset );
                var result = self.digest( el, res, offset );

                debugc( result );
                offset  += result.inc;
                valid    = result.valid;

            }
        }
    
    debug (self.sequence);
    dig ( self.act ); 
    }


    this.process = function( params, offset ) {

        // debug( self.sequence );

        self.params = params;
        
        debugc( params.type ); 
        debugc( params.list );
        debugc ( params.sequence.pattern );

        debugc("Der Offset steht bei " + offset);
        

        if ( params.type === "relative_clause")  {
            debugc("Sollte den Offset korrigieren");

            var entries = self.act["relative_pronouns"];        
            offset = entries[0].position + 1;
            self.sequence[offset-1][self.params.type] = true;  
        }



       
        // var entries = self.act["relative_pronouns"];        
        // var offset = entries[0].position + 1;
        // self.sequence[offset-1][self.params.type] = true;
        
        if (! self.act[ self.params.type ]) {
            self.act[ self.params.type ] = {};
        }
        else {
            if (typeof(self.act[ self.params.type ] ) === "object") {
                var obj  = self.act[ self.params.type ] ;
                var copy = Object.assign({}, obj);
                self.act[ self.params.type] = [];
                self.act[ self.params.type].push( copy );
                self.act[ self.params.type].push( { });
            }
            else self.act[ self.params.type].push( { });  
        }

        
        debugc( params.sequence );

        self.process_sequence ( params.sequence, offset );
        debugg ( self.act[params.type] ); 
        
        // debugg ( self.sequence );

    }

};





module.exports = ISearch;