var debug              = require('debug')('ana');


var SpeechActAnalysis = function(parent) {

    var self = this;
    self.act = parent.act;
    self.sequence = parent.sequence;

    
   






    this.analysis = {};




    this.main_clause = function(main) {
        self.MAIN = true;
        self.analysis.main = {};

        for (var i = 0; i < main.length; i++) {
            var x = main[i];
            var s = self.analysis.main;
            s[x.type] = x.elements;
        }
        // debug( self.analysis );
    }





    this.add_clause = function( type, clause ) {
        // debug( clause );
        for (var key in clause) {
            // self.clean_null_elements( clause[key ]);
        }

        debug( clause );
    }

    this.clean_null_elements = function(obj) {
        for (var key in obj) {
           if (obj[key] === null)  delete obj[key];
        }
    }



    this.init = function() {
        this.MAIN               = false;
        this.RELATIVE           = false;
        this.IDENTITY           = false;
        this.ADVERBIAL          = false;   
    }



    this.process = function() {
        if (parent.act.main) self.main_clause( parent.act.main );
        if (parent.act.relative_clause) self.add_clause( "relative_clause", parent.act.relative_clause );

    }

}





module.exports = SpeechActAnalysis;