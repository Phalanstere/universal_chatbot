var debug               = require('debug')('relative:general');
var debugs              = require('debug')('relative:search');
var debugm              = require('debug')('relative:match');
var debugd              = require('debug')('relative:digest');
var debugc              = require('debug')('nc');
var dig                 = require('debug')('digest:all');
var digg                = require('debug')('digest:exluded');
var diggs               = require('debug')('digest:item');
var debugg              = require('debug')('genitive');
var debugf              = require('debug')('completed');
var digme               = require('debug')('digme:b');
var diggme              = require('debug')('digme:a');
var digc                = require('debug')('digme:c');
var digd                = require('debug')('digme:d');
var dige                = require('debug')('digme:e');
var digx                = require('debug')('excludes:a');
var digy                = require('debug')('excludes:b');
var digz                = require('debug')('digestor');
var dign                = require('debug')('negation');

var fs                  = require("fs");

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





    this.is_valid = function( item ) {
        if ( self.excludes ) {          
            // digc ("EXCLUDE LIEGT VOR: " + item.word);

            if ( Array.isArray( self.excludes )) {
                var list = self.excludes;
                for (var n = 0; n < list.length; n++) {
                   var it = list[n];
                   
                   digg ( it );


                   if (item[it] === true) return false;
                }
            }
        else digg("KEIN EXCLUDE");
        }
    return true;
    }


    this.is_valid_element = function( offset ) {
        var item = self.sequence[offset];
        if (item) {
            dig("Das zu suchende Element an der Stelle " + offset + ": " + item.word );
            return ( self.is_valid( item ) );
        }
    return false;  
    }


    this.next_valid_element = function() {

    } 


    this.check_sequence_element = function( element, offset ) {
        debugs("Now the search, ITEM is: ");
        var pattern = element.pattern;

        var item = self.sequence[offset];
        
        if (item) {
            if ( self.is_valid( item ) ) digc ("Das kann untersucht werden " + item.word);
            else                        self.next_valid_element();
            }


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
        var copy = Object.assign({}, obj);
        obj = [];
        obj.push( copy );      
        return obj;
    }



    this.delimited_pattern = function( item, el) {
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
                    dige ( key );
                    if (key !== "type") {
                            if (item[key]) some = true;
                        }

                    if ( item[key] === list[q] ) {
                        dige ("PATTERN GEFUNDEN " + item[key] );
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
    }


    this.is_delimited = function(item, del) {
        dige( del );
        
        for (var m = 0; m < del.length; m++) {
            el = del[m];

            var res = self.delimited_pattern( item, el );
            if (res === true) return true;
        }
    return false;
    }


    // CHECK OF THE NEGATION

    this.negated_pattern = function( item, el) {
        var mkeys = Object.keys(el); 

        for (var k = 0; k < mkeys.length; k++ ) {
            var key = mkeys[k];
            dign( key );

            if (Array.isArray( el[key] ) === true) {
                var list = el[key];
                digz("Ein Array " + list);
                var some = false;
                for (var q = 0; q < list.length; q++) {
                    dign ( key );
                    if (key !== "type") {
                            if (item[key]) some = true;
                        }

                    if ( item[key] === list[q] ) {
                        dign ("PATTERN GEFUNDEN " + item[key] );
                        some = true;
                        }
                }
                if (some === false) return false;
                else return true;
                }
            else {
               digz("Kein Array"); 
               if (item[key] === el[key]) return true;
               else                       return false;
            }
        }
    }



    this.is_negated = function(item, neg) {
        digx( neg );
        
        for (var m = 0; m < neg.length; m++) {
            el = neg[m];

            var res = self.negated_pattern( item, el );
            if (res === true) return true;
        }
    return false;
    }

    ////////////////////// END OF NEGATION  CHECK






    this.digest = function(element, results, offset) {
        // digy("DIGEST");

        var seq = element.pattern.sequence;  
        var valid = true;
        var inc   = 0;

        // diggme ("THE TYPE TO BE ANALYZED: " + element.type + " -- at offset: " + offset + " RESULTATE " + results);

        var toff = offset;

        var limited;


        for (var n = 0; n < seq.length; n ++) {     // cycling through the patterns
            var item = self.sequence[offset];       // getting the respective word;


            if (results[n] === true) {              // if the slot is valid

                if ( seq[n].delimiter )         self.actual_delimiter = seq[n].delimiter;
                else                            self.actual_delimiter = null;

                var item = self.sequence[offset];   // here is set the values to the sequence   

                var limited = false;

                if ( seq[n].delimiter ) 
                    {
                    var delimited = self.is_delimited( item, self.actual_delimiter );
                    if (delimited) { dige("AUSSCHLUSSKRITERIUM " + item.word); limited = true; }
                    }

                
                if (! limited) 
                    {
                    var desc = seq[n].desc;
                    item[self.params.type] = true;

                    digme ("WAHR IST: " + item.word + " IST EIN " + desc );



                    var copy = Object.assign({}, item);

                    var potentialObject = {
                        type: element.type, 
                        item: copy,
                    };

                    dige("Hier wird ein potenzielles Objekt gepusht - für das Wort  " + item.word );
                    self.valid_entries.push( potentialObject );
        
                    inc ++; 
                    offset ++; 

                    }
                else dige ("Begrenzung liegt vor ");
                
                }
            if ( seq[n].optional === false && results[n] === false) valid = false;


        }


        if (element.type === "genitive_object") {
            debugc("EIN GENITIV OBJEKT " + valid);
        }

        if (element.type === "subject") {
            dig("sollte nach dem Subjekt suchen");
        }


        if (valid) {
            diggme ( self.params.type +  " --- Aufgabe bewältigt: " + valid + " für das Element " + element.type  + " -- INKREMENT: " + inc );

            // debugc ( self.params.type );
            // debugc ( element.type );
            // self.valid_entries.push( potentialObject );

            if ( self.act[self.params.type][element.type] ) {
                digme("VORHANDEN: self.params.type: " + self.params.type + " --- element.type: " + element.type );
                self.act[self.params.type][element.type] = self.change_to_array(  self.act[self.params.type][element.type] );
            }
            else self.act[self.params.type][element.type] = {};
            var obj = self.act[self.params.type][element.type];


            if (Array.isArray( obj ) === true) {    
                digme("IST ARRAY");           
                obj = {};
                self.act[self.params.type][element.type].push( obj );
                // digme(  self.act[ self.params.type ] );
            }

            for (var n = 0; n < seq.length; n ++) {        
                if (results[n] === true) {

                    var desc = seq[n].desc;
                    var item = self.sequence[toff];
                    // diggme ("VALIDE " + item.word + " Offset steht bei " + toff);


                    obj[desc] = item;
                    
                    toff ++;
                    }
                }
            }
        else {
            diggme("NICHT VALIDE");
        }

    
        if ( limited === true ) {
            dige("sollte das letzte Element löschen ");
            self.valid_entries.pop();
        }


        if ( valid === false && element.optional === true) {
            diggs("OPTIONALES ELEMENT");
            valid   = true;
            inc     = 0;
            }

        var res = {
            valid: valid,
            inc:   inc
        }
        
        digg( res );


        return res;

        
    }

    this.consistency = function() {
        diggme ("Konsitenzcheck, Länge des Arrays " + self.valid_entries.length );
        // diggme ( self.valid_entries );
        var s = JSON.stringify( self.valid_entries, null, 4 );
        fs.writeFile( "valid_entries.json", s); 

    }


    this.valid_elements = [];





    // now the process cycles through the sequence
    this.process_sequence = function( sequence, offset ) {
        debug("Der Offset steht an Position " + offset );
        debug ( "Ich suche nach dem " + self.params.type );

        dig("Beginn Suchprozess " + self.excludes);

        // debug(" Anzahl möglicher Elemente" + sequence.length ); 

        var valid = true; 

        // here I am cycling throu the elements of the sequence
        for (var i = 0; i < sequence.length; i++) {
            if (valid) {
            
                debugc("I am looking for the " + sequence[i].type );
                var el = sequence[i];
            
                if (self.is_valid_element( offset ) === true) {
                    dig("VALIDES ELEMENT");
                }

                
                var res = self.check_sequence_element( el, offset );
                var result = self.digest( el, res, offset );

                debugc( result );
                offset  += result.inc;
                valid    = result.valid;

                if (i === sequence.length -1 ) self.consistency();
            }
        }
    
    debug (self.sequence);
    dig ( self.act ); 
    }


    /************************************ FOR THE SUBSENTENCES // ISOLATED ELEMENTS  ***********************************/

    this.get_filtered_sequence = function(offset) {

        if (! offset) offset = 0;
        self.filtered = [];

        for (var i = offset; i < self.sequence.length; i++) {
            var item = self.sequence[i];

            if (self.is_valid( item) ) {    
                digz( item.word );
                self.filtered.push( {
                    item: item,
                    pos: i
                    } );

                }
        }

    var s = JSON.stringify(self.filtered, null, 4);
    fs.writeFile("filtered.json", s);
    }


    this.check_pattern = function( pattern_sequence, offset ) {

        digy ("Now the search, ITEM is: " + pattern_sequence.type + " POSITION " + offset);
        var pattern = pattern_sequence.pattern;
        var actual = self.filtered[offset];

        // Die Liste bekommt die Ergebnisse der Sequenz
        var list = new Array( pattern.sequence.length );
        // digx("Länge der Liste " + list.length);

        var valid = true; 
        for (var i = 0; i < pattern.sequence.length; i++) {
            // if (i=== 1) valid = false;

            if (valid) {
                var p = pattern.sequence[i];
               

                if (actual) { 
                    var found = self.check_matching_pattern(actual.item, p); 
                    digx("Durchqueren der Pattern "  + p.desc  + " für " + actual.item.word + " : " + found); 
                    if ( found ) {
                        list[i]= true;
                        digx( list );
                        offset ++;
                        actual = self.filtered[offset];
                        if ( ! actual ) {
                            digx ("KEIN ITEM MEHR IN DER LISTE");
                            valid = false;  // Dann muss die Suche abgebrochen werden
                            }
                    }
                else {
                    // digy("Hier sollte das Element in der Liste auf false gesetzt werden");
                    list[i] = false;
                    }
                }
            }

            // digy( list );
            
        }
    return list;
    }


    this.compare_pattern_with_results = function( element, results, offset ) {
        var seq = element.pattern.sequence;  
        var inc   = 0; // incrementor
        var valid = true;
        var negated = false;
        var olist   = [];

        for (var n = 0; n < seq.length; n++) {

            if ( ! self.filtered[offset]) {
                return ({
                    valid: false,
                    inc: inc,
                    offset: offset
                })
            }

            var item = self.filtered[offset].item;       // getting the respective word;

            
            if (seq[n].negator) {
                dign("CHECK DER NEGATION");
                if ( self.is_negated( item, seq[n].negator) === true) {
                    dign("NEGATION !!! für " + item.word  + " --- makes the whole clause invalid ");
                    negated = true;

                    self.negated = true; // the whole clause is invalid
                    }

            }
            


            if (results[n] === true) {
                var desc = seq[n].desc;
                var copy = Object.assign({}, item);

                // digz("FUNDSTELLE " + item.word);
                var obj = {
                    type: element.type, 
                    item: copy,
                    };
                olist.push ( obj );

                inc ++; 
                offset ++; 
        }
        if ( seq[n].optional === false && results[n] === false) valid = false;        
        if ( negated === true ) valid = false;

        }
        
    return {
            valid: valid,
            inc: inc,
            offset: offset,
            list: olist
           };
    }




    self.excluded_check_optional = function(seq, resuls) {
        for (var n = 0; n < seq.length; n ++) {        
            if (results[n] === true) {

                var desc = seq[n].desc;
                var item = self.sequence[toff];
                // diggme ("VALIDE " + item.word + " Offset steht bei " + toff);


                obj[desc] = item;
                
                toff ++;
                }
            }
    }


    // Das müsste eine andere Liste sein als valid_entries

    this.exluded_add_potential_objects = function(list) {
        for (var q = 0; q < list.length; q++) {
        dign(" exluded_add_potential_objects ");
        self.valid_entries.push( list[q] );
        }
    dign("Anzahl potenzielle Items " + self.valid_entries.length);
    }

    this.excluded_delimiter = function() {

    }



                                    // element 
                                    // is the search patter, eg. subject
    this.excluded_digest = function(element, results, offset ) {

        var seq = element.pattern.sequence;  
        var toff = offset;
        var limited;
        var inf = self.compare_pattern_with_results( element, results, offset );

        if (! inf.valid) dign ("COMPARE GIBT UNGÜLTIG ZURÜCK");

        if ( inf.valid ) {
            // digz ( inf.list );
            dign ( self.params.type +  " --- Aufgabe bewältigt: " + inf.valid + " für das Element " + element.type  + " -- INKREMENT: " + inf.inc );
            // digz("Länge der Liste " + inf.list.length);
            

            var obj = {
                start: offset,
                type: element.type,
                elements: inf.list
            }

            dign("Push in die Entries");

            self.valid_entries.push( obj );

            // self.exluded_add_potential_objects( inf.list);
        }

    


        if ( inf.valid === false && element.optional === true) {
            digz("optionales Element, deshalb weiterhin valid");
            inf.valid   = true;
            inf.inc     = 0;
            }

        var res = {
            valid: inf.valid,
            inc:   inf.inc
        }
        
        digz ( res );

        return res;

    }




    this.process_filtered_sequence = function( sequence, offset ) {  
        this.valid_entries = [];
        self.get_filtered_sequence( offset);
        var valid = true; 
        var result = [];
        
        // cycling through the pattern sequence
        for (var i = 0; i < sequence.length; i++) {
        // for (var i = 0; i < 4; i++) {
            var pattern = sequence[i];
            // digx( pattern.type );

            // var res = self.check_pattern( pattern, offset );

            if (valid) {
                digz("CHECK DES PATTERNS " + pattern.type);
                var res = self.check_pattern( pattern, offset ); 
                
                var result = self.excluded_digest( pattern, res, offset );
                if ( result) {
                    dign ( result );
                    offset  += result.inc;
                    valid    = result.valid;
                }
                
                if (offset >= self.filtered.length) valid = false;
               
        
            }
        }
        
        dign("Funktion beendet - sollte das Ergebnis in eine Datei schreiben");
        dign("Anzahl valid_entries " + self.valid_entries.length);
        
        // digx( filtered );
        if (self.negated) return null;
        else return self.store_filtered_results();


    }





    this.store_filtered_results = function() {
        var s = JSON.stringify( self.valid_entries, null, 4);
        fs.writeFile( "exlusive_valid_entries.json", s);
        return self.valid_entries;

    }


    /************************************* ENDE EXCLUDED *****************************************/

    this.valid_entries = [];

    // the search process begins here
    this.process = function( params, offset, main ) {
        self.negated = false; 
        self.valid_entries = [];

        dig("BEGINN SUCHE");
        self.excludes = params.excludes;



        // debug( self.sequence );

        self.params = params;
        
        debugc( params.type ); 
        debugc( params.list );
        debugc ( params.sequence.pattern );

        diggs("Der Parameter Typ ist " + params.type + " --- Offset steht bei " + offset);
        

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

        if (! self.excludes) self.process_sequence ( params.sequence, offset );
        else return self.process_filtered_sequence(  params.sequence, offset  );

        // dig ( self.act[params.type] ); 
        
        // diggs ( self.sequence );

    }

};





module.exports = ISearch;