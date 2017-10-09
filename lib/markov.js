"use strict";
var meta            = require('debug')('worker:markov');
var fs              = require('fs');



var Node = function(name) {

    this.name = name;
    this.weight = 0;
    this.in     = [];
    this.out    = [];

}


var MarkovChain = function(file) {
    var self = this;
    this.nodes = [];



    this.find = function(name) {
        for (var i = 0; i < self.nodes.length; i++) {
            var node = self.nodes[i];
            if (node.name === name) return node;
        }
    return null;
    }

    this.addNodes = function( list) {
        for (var i = 0; i < list.length; i++) {
            self.nodes.push( new Node(list[i]));
        }
    
    meta("Anzahl der Knoten " + self.nodes.length);   
    }

    this.addRelation = function(source, target) {
        var s = self.find(source);
        if(s) {
            for (var n = 0; n < target.length; n++) {
                var t = self.find( target[n] );
                if (t) {
                    t.in.push({
                            name: s.name,
                            weight: 0,
                            });
                    
                    s.out.push({
                            name: t.name,
                            weight: 0,
                            });
                    }

            }

        meta("Länge der Verbindungen " + s.out.length);
        }
    }

    this.calculateWeights = function() {
        for (var i = 0; i < self.nodes.length; i++) {
            var node = self.nodes[i];
            
            for (var n = 0; n < node.out.length; n++) {
                var item = node.out[n];
                item.weight = (1 / node.out.length).toFixed(2);
                item.weight = parseFloat( item.weight );
                meta( item.name );
            }

            for (var n = 0; n < node.in.length; n++) {
                var item = node.in[n];
                item.weight = (1 / node.in.length).toFixed(2);
                item.weight = parseFloat( item.weight );
                meta( item.name );
            }


        }
    }


    this.writeFile = function () {
        self.calculateWeights();

        var s = JSON.stringify( self.nodes, null, 4 );
        
        fs.writeFile("lib/Markov.json", s);
    }


   this.get_element = function(list, value) {
        meta ( list );
        var next = 0;
        var last = 0;

        var elem = null;
        var name = null;

        meta( value );

        for (var i = 0; i < list.length; i++) {
           next += list[i].weight;

           if (value > last && value < next) {
               name = list[i].name;
               meta( name );
           }
           
           last = next;
        }

        elem = self.find( name );
        return elem;
   }

   this.next = function(name) {
        var node = self.find(name);
        if (node) {
            
            var r = Math.random();
            var elem = self.get_element(node.out, r);
            if ( elem) meta( elem.name); 

            return elem;
        }

        return null;
   }


   this.previous = function(name) {
        var node = self.find(name);
        if (node) {
            
            var r = Math.random();
            var elem = self.get_element(node.in, r);

            if ( elem) return elem;
        }
    
      return null;
   }


    this.init = function() {
        if (file) {
            self.nodes = require( file );
            meta ("Anzahl der Knoten " + self.nodes.length)

            }
    }


    self.init();

}


module.exports = MarkovChain;