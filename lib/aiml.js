"use strict";
var meta            = require('debug')('aiml:markov');
var meta2           = require('debug')('aiml:topic');

var reg             = require('debug')('reg:topic');
var reg2             = require('debug')('match');
var reg3             = require('debug')('cond');

var fs              = require('fs');

var meta            = require('debug')('worker:meta');
var debugs          = require('debug')('check');


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

            // [a-zA-Z\x7f-\xff]
            // var x = regexPattern.indexOf('[a-zx7f-\xff|0-9|\\s]*[a-Z|0-9|-]*[a-zäöüß|A-Zx7f-\xff|0-9]*[!|.|?|\\s]*') ;
            var x = regexPattern.indexOf('[a-zäöüß|0-9|\\s]*[a-Z|0-9|-]*[a-zäöüß|A-ZÄÖÜ|0-9]*[!|.|?|\\s]*') ;

            //the matched pattern must be at least as long as the user input or must contain the regex
            if(matchedString[0].length >= userInput.length || regexPattern.indexOf('[a-zäöüß|A-ZÄÖÜ|0-9|\\s]*[a-zäöüß|A-ZÄÖÜ|0-9|-]*[a-zäöüß|A-ZÄÖÜ|0-9]*[!|.|?|\\s]*') > -1){
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
        modifiedText = modifiedText.replace(/\*/g, '[a-zäöüß|A-ZÄÖÜ|0-9|\\s]*[a-z»A-Z|0-9|\*|-]*[a-zäöüß|A-ZÄÖÜ|0-9]*[!|.|?|\\s]*');

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
        reg3("CHECK CONDITION");

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
        else {
           console.log("Hat das Session-Objekt eine Variable?"  + node.condition ); 
           var condition = self.session.eingabe;
           if (condition) debugs("Es gibt eine solche Variable");


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


    this.process_substitute_stars = function(ndx, str, subst ) {
        debugs( subst );

        switch(ndx) {
            case 0:
              var r = new RegExp(/\*/g);
              var x = str.search(r);
              str = str.replace(r, subst);
            break; 

            case 1:
              var r = new RegExp(/\*\*/g);
              var x = str.search(r);
              str = str.replace(r, subst);

            break;
        }

        return str;
    }


    this.substitute_stars = function( str ) {
        debugs( str );

        var n = self.information.length;
        while(n--) {
            var inf = self.information[n];
            str = self.process_substitute_stars(n, str, inf);
        }

        /*
        for (var i = 0; i <self.information.length; i++) {
            var inf = self.information[i];
            str = self.process_substitute_stars(i, str, inf);
        }
        */

    return str;
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





    this.condition_respond = function( item ){
        self.topic_change = item.topic_change;
        // console.log ( item );

        if (self.information) {
            var o = item.template;
            console.log( self.parent );
            

        }
    }



    this.get_var_type = function( item ) {
        var x = Object.keys( item );
        return x[0];
    }

    

    this.starvalues = ['*', '**', '***', '****', '*****'];

    this.get_joker = function( item, value) {
        var val;

        switch(value) {
            case '*':
                val = self.information[0];
             break;

            case '**':
                val = self.information[1];
            break; 

            case '***':
                val = self.information[2];
            break; 

            case '****':
                val = self.information[3];
            break; 

        }

    return val;
    }


    this.set_vars = function( item ) {
        if ( Array.isArray( item.think ) === true) {
            var t = item.think;
            for (var i = 0; i < t.length; i++) {
                var it = t[i];
                var type = self.get_var_type( it );
                var value = it[type];
                var x = null;

                if (self.starvalues.includes( value) === true) {
                    // console.log("EIN JOKER");
                    var x = self.get_joker( it, value );
                    }
                else x = value;

                self.session[type] = x;
            }

        }
        else {
            console.log("THINK ist kein Array");
             var it = item.think;
             console.log( it );
             var type = self.get_var_type( it );
             var value = it[type];
             console.log( "TYP " + type );
            
            var x = null;
            if (self.starvalues.includes( value) === true) {
                    x = self.get_joker( it, value );
                    console.log( " RETURN " + x );
                    }
                else x = value;

            self.session[type] = x;
            console.log(  self.session[type] );
        }

    }




    // the new version of variable replacement - with the session object integrated

    this.getWordsBetweenCurlies = function (str) {
        var results = [], re = /{([^}]+)}/g, text;

        while(text = re.exec(str)) {
            results.push(text[1]);
        }
    return results;
    }


    this.insert_vars = function( template ) {
        var r = self.getWordsBetweenCurlies( template );
        for (var i = 0; i < r.length; i++) {
             var v = r[i];
             v = v.replace(/ /g, "");
             
             var s = self.session[v];
             var c = '{' + r[i] + '}';

             template = template.replace(c, s); 
            }

    return template;
    }


    this.respond = function( item ) {
        self.topic_change = item.topic_change;
        
        self.action = item.action;
        
        if (item.think) self.set_vars( item );


        if (self.information ) {
            if (Array.isArray(item.template) === true) {
            var list = [];
            for (var i = 0; i < item.template.length; i++) {
                var it = item.template[i];   

                // self.substitute_vars( it ); // I don't know if this is necessary here

                var s = self.insert_vars( it );
                var xs = self.substitute_stars( s );

                list.push( self.substitute_stars( xs ) );
            }

            debugs ( "RESPOND ARRAY" );
            
            var x = parseInt( Math.random() * list.length );

            reg2( "Eine Liste muss zurückgegeben werden " + list);
            return list[x];

            }
        else {
            console.log("STARS ERSETZUNG");
            var s = self.insert_vars( item.template );

            reg2("nach insertVars " + s);

            return self.substitute_stars( s );
            }

        }
        else 
            {
            var s = self.insert_vars( item.template );
            return s;
            }
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
        debugs ("AIML Input");  
        self.session = session;

        if (params.state) self.set_state( params.state );

        var res = self.find ( params );
        var answer = '';
        if ( res ) {    
            if (res.condition) {
                answer = self.condition_respond ( res );
                answer = 'Hmm.. hier gibt es keine Antwort';
                }
            else answer = self.respond( res );
            // console.log(res);
            // console.log("Anzahl der Patterns " + res.length );

            debugs ("Die Antwort ist: " + answer );
            // debugs( answer.length );

            

            
            var params = {
                         answer: answer,
                         information: self.information,
                         vars: self.vars,
                         topic_change: self.topic_change,
                         session_id: session.id, 
                         action: self.action
                         }

            if (callback) callback( params );
            // if (callback) callback( answer );


        }
       else {
            console.log("Nicht identifiziert");
            self.unidentifed_input( callback, params, session ); 
            }
       

    } 


    this.paradoxical = function( callback, params, session) {
        reg2("paradoxical");
        params.pattern = "PARDOXICAL_INTERVENTION";
        params.topic   = "intervention";
        self.input( params, session, callback );

    }


    this.unidentifed_input = function( callback, params, session ) {
        debugs ("not identified");
        console.log( params );
        params.pattern

        if (session) {
            params.session_id = session.id;
  
        }

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