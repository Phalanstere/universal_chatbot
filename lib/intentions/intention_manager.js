"use strict";
var meta            = require('debug')('intent');
var debug            = require('debug')('intentions');

var fs              = require('fs');
var resolve         = require('path').resolve;


var Intentions = require('./intentions.js');

var IntentionManager = function(file) {
    var self = this;
   

    this.find_by_value = function( type, value) {
        var s = self.intentions.find_by_value( type, value );
        meta( s );

        meta( self.intentions.actual );
    }


    this.best_match = function( list) {
        var min = 1000;
        var selected = null;

        debug("Der beste MATCH");


        for (var j = 0; j < list.length; j++) {
            debug( j );
            var item = list[j];
            debug ( item );
            self.intentions.shortest_trajectory( item );
            if ( self.intentions.shortest) 
                {
                min = self.intentions.shortest.length;
                selected = j;
                }
            else debug("shortest ist leer");
        }

        if (min !== 1000)  return list[selected];
        else return null;
    }


    this.check = function( input ) {
        var list = [];
        var phrase = input.pattern;

        for (var i = 0; i < self.intentions.nodes.length; i++) {
            var item = self.intentions.nodes[i];
            // debug ( item.keywords );
            for (var n = 0; n < item.keywords.length; n++) {
                var word = item.keywords[n];
                var x = phrase.search( word );
                if (x !== -1) {
                    debug("Für " + word + " gibt es ein Ergebnis");
                    list.push( item.name );
                }
            }

        }

        debug( list );
        if (list.length > 0) {
           var n = self.best_match( list );
           var node = self.intentions.find( n );

           if (node ) return node;
           else return null;

        }

    }





    this.init = function() {

        if (file) {
            console.log( file );
            self.intentions = new Intentions( resolve( file)  );
            // self.intentions.shortest_trajectory( "Martin Burckhardt" );          
        }
        else meta("kein File");

    }

    self.init();

}


// var i = new IntentionManager();
module.exports = IntentionManager;