"use strict";
var meta            = require('debug')('intent');
var fs              = require('fs');
var resolve         = require('path').resolve;


var Node = function(name) {

    this.name = name;
    this.weight = 0;
    this.in     = [];
    this.out    = [];

    this.aiml = "";
    this.keywords = [];
}


var Intentions = function(file) {
    var self = this;
    this.nodes = [];


    this.find_by_value = function( type, value) {    
        console.log("FIND " + self.nodes.length );

        var list = [];

        for (var i = 0; i < self.nodes.length; i++) {
            var node = self.nodes[i];
            if (node[type]) {
                if ( Array.isArray( node[type]) === true) {
                    var arr = node[type];
                    for (var n = 0; n < arr.length; n++) {
                        if (value === arr[n]) list.push( node );
                    }

                }

            }
            
        }
    if (list.length > 0) return list;
    else return null;
    }




    this.stream  = function(arr, direction, target) {
        var found = false;
        var copy = arr.slice(0);
        var n = arr.length -1;
        var node = arr[n];
        var additional = [];
        var dead = false;

        meta("Untersuchung des Knoten " + node.name + " -- Direction " + direction);
        

        if ( node[direction] )
        {
            // meta("Anzahl Ausgänge: " + node[direction].length );
            if (node[direction].length === 0) dead = true;

            for ( var i = 0; i < node[direction].length; i++) {
                var name = node[direction][i].name;
                if (name === target) {
                found = true;
                }
            }
        }


        if (! found && ! dead) {
            for ( var i = 0; i < node[direction].length; i++) {
                var item = node[direction][i];
                var n = self.find( item.name );

                // meta("Hier sollte ein neues Array angelegt werden"); 
                var c = copy.slice(0); 
                c.push( n );
                additional.push( c );
                
            }


        }


        return {
            dead: dead,
            additional: additional,
            found: found
        }

    }

    this.stream_iteration = function(direction, target ) {
        var temp = [];
        var deletable = [];
        var found = false;
        var ndx   = -1;

        meta(" ITERATION ...................... " + self.iterator);

        for (var q = 0; q < self.metalist.length; q++) {
            var n = self.metalist[q];

            var res = self.stream( n, direction, target );
            if ( res.dead ) {
                deletable.push ( q );
                }

            if (res.found === true) {
                meta("HIER GIT ES EINEN FUND");
                found = true;
                ndx = q;
            }

            for (var p = 0; p < res.additional.length; p++) {
                var item = res.additional[p];
                // meta( item );
                temp.push( item );
            }

        }

        if ( ! found) {
            self.iterator ++;
            self.metalist = [];

            for (var i = 0; i < temp.length; i++) {
                if ( ! deletable.includes( i) ) {
                    self.metalist.push( temp[i] );
                }
            }

            meta("Nach dem Löschen der Items: " + self.metalist.length );
            if (self.iterator < 10) self.stream_iteration( direction, target );
        }
        else {
              meta("ERFOLGREICH " + ndx);
              var n = self.metalist[ndx];
              self.shortest = n;

            }

    }


    this.metalist = [];
    this.iterator = 0;

    this.shortest_trajectory = function( target) {
        self.shortest = null;

        var node = self.actual;
        self.metalist = [];
        self.iterator = 0;
        self.metalist.push( [ node ]);
        var list = self.stream_iteration("out", target)  

        meta("=====================================================");
        if (self.shortest) meta ( self.shortest );     

    }



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
            }

            for (var n = 0; n < node.in.length; n++) {
                var item = node.in[n];
                item.weight = (1 / node.in.length).toFixed(2);
                item.weight = parseFloat( item.weight );
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


   this.characterize = function( name, obj ) {
    var n = self.find( name );

    if (n){
            var x = Object.keys( obj );

            for (var i = 0; i < x.length; i++) {
                var key = x[i];
                n[key] = obj[key];
            }
        }
   }



   // Die deutsche Version
   this.define_de = function() {

        self.addNodes(      ['price',
                             'availability',
                             'registration', 
                             'payment_mode',
                             'withdrawal',
                             'phone_call',
                             'further_info',
                             'info_text',
                             'plausibility',
                             'target_group',
                             'Martin Burckhardt',
                             'website'
                             ]);


        self.addRelation("availability", ["price", "registration", "payment_mode", "target_group"]);  
        self.addRelation("price", ["registration", "payment_mode", "withdrawal", "plausibility", "info_text" ]);  
        self.addRelation("registration", ["payment_mode", "withdrawal", "plausibility", "info_text", "phone_call" ]);  
        self.addRelation("plausibility", ["Martin Burckhardt"]);  
        self.addRelation("Martin Burckhardt", ["website"]);  


        self.characterize("price", {
            aiml: "HOW_MUCH",
            keywords: ["Preis", "Gebühren", "Summe", "Kosten"],
            excludes: ['NEGATION']
        })


        self.characterize("availability", {
            aiml: "AVAILABILITY",
            keywords: ["Plätze", "plätze", "verfügbar", "noch frei", "frei"],
            excludes: ['NEGATION']
        })


        self.characterize("payment_mode", {
            aiml: "PAYMENT_MODE",
            keywords: ["Kreditkarte", "Überweisung", "Bezahlung", "überweisen", "bezahlen", "bar"],
        })

        self.characterize("withdrawal", {
            aiml: "WITHDRAWAL",
            keywords: ["Storno", "stornieren", "zurücktreten", "rückgängig"],
        })


        self.characterize("website", {
            aiml: "PHONE",
            keywords: ["Website", "Webseite", "online", "einloggen", "log in", "anmelden", "Portal"],
        })


        self.characterize("phone_call", {
            aiml: "PHONE",
            keywords: ["Telefon", "telefon", "telefonisch", "Telefonat", "persönlich", "am Telefon"],
        })


        self.characterize("target_group", {
            aiml: "TARGET_GROUP",
            keywords: ["Zielgruppe", "zielgruppe", "für wen", "adressiert", "richtet sich"],
        })


        self.characterize("further_info", {
            aiml: "PHONE",
            keywords: ["Informationen", "Download", "Beschreibung", "schriftlich", "Infomaterial", "infos"],
        })


        self.characterize("plausibility", {
            aiml: "PHONE",
            keywords: ["realistisch", "zu komplex", "kompliziert", "Profis", "berufsmäßig"],
        })

        self.characterize("Martin Burckhardt", {
            aiml: "MARTIN_BURCKHARDT",
            keywords: ["Martin Burckhardt", "Seminarleiter", "Leiter", "Wer ist"],
        })




        self.calculateWeights();


        meta("Länge der Knoten " + self.nodes.length)
        meta( self.nodes );

        var s = JSON.stringify( self.nodes, null, 4);
        fs.writeFile("NITIntentions_DE.json", s);


   }


   this.define = function() {
        meta("sollte Intentionen definieren");

        self.addNodes(      ['price',
                             'registration', 
                             'payment_mode',
                             'withdrawal',
                             'phone_call',
                             'further_info',
                             'info_text',
                             'plausibility',
                             'Martin Burckhardt',
                             'website'
                             ]);


        self.addRelation("price", ["registration", "payment_mode", "withdrawal", "plausibility", "info_text" ]);  
        self.addRelation("registration", ["payment_mode", "withdrawal", "plausibility", "info_text", "phone_call" ]);  

        self.addRelation("plausibility", ["Martin Burckhardt"]);  

        self.addRelation("Martin Burckhardt", ["website"]);  


        self.characterize("price", {
            aiml: "HOW_MUCH",
            keywords: ["price", "how much", "pay"],
            excludes: ['NEGATION']
        })

        self.characterize("payment_mode", {
            aiml: "PAYMENT_MODE",
            keywords: ["credit card", "payment"]
        })

        self.characterize("withdrawal", {
            aiml: "WITHDRAWAL",
            keywords: ["withdraw", "resign"]
        })

        self.characterize("phone_call", {
            aiml: "PHONE",
            keywords: ["phone", "personally"]
        })

        self.characterize("info_text", {
            aiml: "INFO",
            keywords: ["info", "pdf", "written"]
        })


        self.characterize("plausibility", {
            aiml: "PLAUSIBILITY",
            keywords: ["realistic", "learning"]
        })


        self.characterize("Martin Burckhardt", {
            aiml: "MARTIN_BURCKHARDT",
            keywords: ["leader", "lecturer"]
        })



        self.calculateWeights();


        meta("Länge der Knoten " + self.nodes.length)
        meta( self.nodes );

        var s = JSON.stringify( self.nodes, null, 4);
        fs.writeFile("NITIntentions.json", s);



   }


    this.init = function() {
        
        // self.define_de();

        if (file) {
            self.nodes = require( resolve( file)  );
            meta ("Anzahl der Knoten " + self.nodes.length);
            self.calculateWeights();
            if (self.nodes.length > 0) self.actual = self.nodes[0];

            // self.shortest_trajectory("website");
            
            }
        else self.define();
    }


    self.init();

}



// var i = new Intentions();

module.exports = Intentions;