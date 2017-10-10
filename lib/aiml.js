"use strict";
var meta            = require('debug')('aiml:markov');
var meta2           = require('debug')('aiml:topic');

var reg             = require('debug')('reg:topic');
var reg2             = require('debug')('match');

var fs              = require('fs');

var meta    = require('debug')('worker:meta');
var resolve         = require('path').resolve





/*
<category>
  <pattern>THANK YOU *</pattern>

  <template>
    <random>
     <li>You are welcome!</li>
      <li>I am at your service</li>
      <li>That was nothing.</li>
    </random>
  </template>
*/


// a single file or an array of files

var Aiml = function(file) {

    var self = this;

    this.topics = [];
    this.topics.push("*");
    meta( this.topics );

    this.nodes = [];
    this.vars  = null;


    this.writeFile = function (name) {
        var filename = "lib/" + name + ".json";

        var s = JSON.stringify( self.nodes, null, 4 );
        fs.writeFile(filename, s);
    }

  

    this.check_star = function(str) {
        if (str.search("[*]") !== -1) return true;
        else return false;
    }


    self.wildCardArray = [];

    this.checkIfMessageMatchesPattern = function(userInput, patternText){
        //convert wildcards in of the pattern node into a regex that matches every char
        var regexPattern = self.convertWildcardToRegex(patternText);
        

        //add one with the text in function 'convertWildcardToRegex' here a space is added before and after the user input
        //to prevent false matching
        if(userInput.charAt(0) != " "){
            userInput = " " + userInput;
        }

        var lastCharacterPosition  = userInput.length - 1;
        var lastCharacter = userInput.charAt(lastCharacterPosition);
        if(lastCharacter != " "){
            userInput = userInput + " ";
        }

        //match userInput with the regex pattern
        //if it matches, matchedString is defined
        // var matchedString = userInput.toUpperCase().match(regexPattern);
        var matchedString = userInput.match(regexPattern);


        if(matchedString){
            reg2( matchedString );
            reg2 (regexPattern );

            var x = regexPattern.indexOf('[a-z|0-9|\\s]*[a-Z|0-9|-]*[a-z|A-Z|0-9]*[!|.|?|\\s]*') ;

            //the matched pattern must be at least as long as the user input or must contain the regex
            if(matchedString[0].length >= userInput.length || regexPattern.indexOf('[a-z|A-Z|0-9|\\s]*[a-z|A-Z|0-9|-]*[a-z|A-Z|0-9]*[!|.|?|\\s]*') > -1){
                //if patternText contained a wild card, get the user input that were put into this wild card
                //use original patternText (* is not replaced by regex!)
                // reg2("Das könnte klappen");

                self.information = self.getWildCardValue(userInput, patternText);
                reg2( self.information);

                return true;
            }
        }
        else{
            return false;
        }
    }




    this.getWildCardValue = function(userInput, patternText){
        var wildCardArray = [];
        var lastWildCardValue = '';

        //get all strings of the pattern that are divided by a *
        //e.g. WHAT IS THE RELATION BETWEEN * AND * -> [WHAT IS THE RELATION BETWEEN , AND ]
        var replaceArray = patternText.split('*');
        var wildCardInput = userInput;
        reg2("so weit so gut " + replaceArray);

        if(replaceArray.length > 1){
            //replace the string of the userInput which is fixed by the pattern
            for(var i = 0; i < replaceArray.length; i++){
                wildCardInput = wildCardInput.replace(new RegExp(replaceArray[i], 'i'), '|');
            }
            //split the wildCardInput string by | to differentiate multiple * inputs
            //e.g. userInput = WHAT IS THE RELATION BETWEEN TIM AND STRUPPI?
            //-> | TIM | STRUPPI
            //-> [TIM, STRUPPI]
            wildCardInput = wildCardInput.split('|');
            //split function can create an array which also includes spaces etc. -> e.g. [TIM, " ", "", STRUPPI, " "]
            //we just want the information
            var wildCardArrayIndex = 0;
            for(var i = 0; i < wildCardInput.length; i++){
                if(wildCardInput[i] != '' && wildCardInput[i] != ' ' && wildCardInput != undefined){
                    var wildCard = wildCardInput[i];
                    var wildCardLastCharIndex = wildCard.length - 1;
                    var firstCharOfWildCard = wildCard.charAt(0);
                    var lastCharOfWildCard = wildCard.charAt(wildCardLastCharIndex);

                    try{
                        //harmonize the wildcard string
                        //remove first char if it is a space.
                        //calculate the last index again since the length of the string changed
                        if(firstCharOfWildCard === ' '){
                            wildCard = wildCard.splice(0);
                            wildCardLastCharIndex = wildCard.length - 1;
                            lastCharOfWildCard = wildCard.charAt(wildCardLastCharIndex);
                        }
                        //if the last char is a space, remove it
                        //calculate the last index again since the length of the string changed
                        if(lastCharOfWildCard === ' '){
                            wildCard = wildCard.substr(0, wildCardLastCharIndex);
                            wildCardLastCharIndex = wildCard.length - 1;
                            lastCharOfWildCard = wildCard.charAt(wildCardLastCharIndex);
                        }
                        if(lastCharOfWildCard === '?'){
                            wildCard = wildCard.substr(0, wildCardLastCharIndex);
                        }
                    }
                    catch(e){

                    }
                    wildCardArray[wildCardArrayIndex] = wildCard;
                    wildCardArrayIndex++;
                }
            }
        }
        if(wildCardArray.length - 1 >= 0){
            lastWildCardValue = wildCardArray[wildCardArray.length - 1];
        }

        return wildCardArray;
    }



    this.convertWildcardToRegex = function ( text ) {
        var firstCharacter = text.charAt(0);

        if(firstCharacter != "*" && firstCharacter != "_"){
            var text = " " + text;
        }

        var lastCharacterPosition = text.length - 1;
        var lastCharacter = text.charAt(lastCharacterPosition);

        var modifiedText = text.replace(' _', '*').replace(' *', '*');
        modifiedText = modifiedText.replace(/\*/g, '[a-z|A-Z|0-9|\\s]*[a-z»A-Z|0-9|\*|-]*[a-z|A-Z|0-9]*[!|.|?|\\s]*');

        if(lastCharacter != "*"){
            // text = text + " ";
            //pattern should also match when user inputs ends with a space, ?, ! or .
            modifiedText = modifiedText + '[\\s|?|!|.]*';
        }


        reg("REGEX: " + modifiedText);
        return modifiedText;


    }


    this.compare = function(str1, str2) {
        self.information = null;

        meta2("Vergleiche " + str1 + " mit " + str2);
        if ( self.check_star(str1) === true || self.check_star(str2) === true) {
            // self.convertWildcardToRegex( str1 );
            var matchedString = self.checkIfMessageMatchesPattern(str1, str2);
                        
            reg2( matchedString );

            if (matchedString) {
                reg2("matched String erfolgreich");
                return matchedString;
                }
            else return false;
            
        }
        else
        {
            if (str1 === str2) return true;
            else               return false;
        }
    }


    this.check_condition_type = function( state, template) {
      var keys = Object.keys(state);
      reg2(keys)

    }

    this.check_condition = function( params, node) {
        if ( params.condition ) {
            if (Array.isArray( params.condition) ) reg2("Das ist ein Array");

            if( typeof( params.condition ) === "object") {

                var states = Object.keys(params.condition);
                reg2( states );

                for (var i = 0; i < node.template.length; i++) {
                    reg2("Template " + i);
                    var temp = node.template[i];
                    var tempkeys = Object.keys( temp) ;
                    for (var n = 0; n < tempkeys.length; n++) {
                        var k = tempkeys[n];
                        if (states.includes(k) === true) {
                            // reg2( "Übereinstimmung: " + params.condition[k] );
                            if (params.condition[k] === temp[k]) return temp.template;
                        }
                    }

                }


            }
        }
        return null;
    }


    this.node_match = function(params, node) {
        var item = null;
        var res = self.compare( params.pattern, node.pattern);

        reg2( res );
        if (res && params.that) {
            if (params.that !== node.that) res = false;
        }


        if (res) {
            reg2("MATCH");
            reg2( node );

           
            if (!node.srai) return node;
            else 
                {    
                reg2("kein srai");

                var item = self.find({
                    pattern: node.srai,
                    topic: params.topic
                    });
                
                if (item ) return item; 
            }
        }


    }


    this.find = function( params ) {
        if (self.check_star( params.pattern ) === true) meta2 ("STAR");

        for (var i = 0; i < self.nodes.length; i++) {
                var node = self.nodes[i];  
                if (params.topic) {
                    if (node.topic === params.topic) {
                        reg2("Hier gibt es ein Topic");

                        var item = self.node_match ( params, node );
                        // if ( node.condition)  item.template = self.check_condition( params, node );


                        reg2 ( item );
                         if ( item && node.condition)  item.template.template = self.check_condition( params, node );
                        if (item) return item;
                        }
                } 
                else 
                {

                    var item = self.node_match ( params, node );

                    reg2 ( "ITEM ");
                    reg2( item );


                    if ( item && node.condition)  item.template.template = self.check_condition( params, node );
                    if (item ) return item; 
                }

        }
    }


    this.substitute_stars = function( str ) {
        var answer = str;

        for (var i = 0; i <self.information.length; i++) {
            var inf = self.information[i];
            reg2( inf );

            console.log("Die Antwort lautet: ");
            console.log( answer );
            // answer = answer.replace("*", inf);
        }
  
    reg2("SUBSITUTE STARS returns " + answer );

    return answer;
    }


    this.get_vars = function( item ){
        var index = 0;
        var list = [];
        var checking = true;


        while(checking) {
            index = item.indexOf("{", index);   
            var open = index;
            var close = item.indexOf("}", index);    
            var bracket = item.slice(open+1, close);
            list.push(bracket);
            index = parseInt( close );  
            var test = item.indexOf("{", index);
            if (test === -1) checking = false;
        }

        return list;

    }


    this.substitute_vars= function ( item)  {
        self.vars = null;     

        if ( item.search("{") !== -1) {
            self.vars = self.get_vars( item );    
            reg2( self.vars);
        }
    }   



    this.respond = function( item ) {
        self.topic_change = item.topic_change;

        if (self.information ) {
            if (Array.isArray(item.template) === true) {
            var list = [];
            for (var i = 0; i < item.template.length; i++) {
                var it = item.template[i];           
                self.substitute_vars( it ); // I don't know if this is necessary here
                list.push( self.substitute_stars( it ) );
            }

            reg2( list );
            
            var x = parseInt( Math.random() * list.length );


            reg2( "Eine Liste muss zurückgegeben werden " + list);
            return list[x];

            }
        else return self.substitute_stars( item );
        }
        else return item.template;
    }


    this.set_state = function( state) {
        if (! self.state)  self.state = {};

        for(var index in state) { 
            var attr = state[index]; 
            self.state[index] = attr;
        }

        reg2( self.state );
    }


    this.input = function( params, session, callback ) {
        if (params.state) self.set_state( params.state );

        var res = self.find ( params );
        var answer = '';
        if ( res ) {          
            answer = self.respond( res );
            reg2("Nach self.respond");

            reg2 ("Die Antwort ist: " + answer );
            
            var params = {
                         answer: answer,
                         information: self.information,
                         vars: self.vars,
                         topic_change: self.topic_change,
                         session_id: session.id
                         }

            if (callback) callback( params );
            // if (callback) callback( answer );


        }
       else self.unidentifed_input( callback, params, session ); 
       

    } 



    this.unidentifed_input = function( callback, params, session ) {
        params.session_id = session.id;
        reg2("Der Bot hat kein eindeutiges Resultat bekommen");
        // var x = self.input( { pattern: "UNCLEAR" }); 
        callback( null, params);

    }




    this.init = function() {
        if (file) {
            if (Array.isArray(file)) {

                meta("INIT DES AIML");

                var x = resolve( file[0] );
                meta( x );


               for (var i = 0; i < file.length; i++ ) {
                 
                 var f = resolve( file[i] );
                 var x = require( f );  
                 
                 self.nodes = self.nodes.concat( x );
               }

            // self.input( { pattern: "No", that: "Do you like movies?"  } );

            } else {
                self.nodes = require( file );
                reg2 ("Anzahl der Knoten " + self.nodes.length);
                self.input( { pattern: "Who are you"  } );
                }
            }
        else
            {
            meta("Ich sollte Knoten erzeugen");  

            var x = {
                pattern: "Hello *",
                srai: null,
                template: ["Hi", "How is it going"]
                };

            self.nodes.push(x);


            self.input( { pattern: "What is the relation between Tim and Struppi", mood: "happy"  } );
            self.writeFile("greeting");

            }
    }


    self.init();




}





module.exports = Aiml;