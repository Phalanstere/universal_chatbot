var meta            = require('debug')('worker:strategy');
var MarkovChain     = require('./markov');


var Strategy = function(name, file) {
    this.name = name;

    var self = this;
    this.chain = null;


    this.init = function() {
        if (file) {
            self.chain = new MarkovChain(file);    

            var el = self.chain.previous("greeting");
            if (el) meta( el.name );
            else meta("Es gibt kein Element");

        }

        // 
        else {

        meta("Initialisierung der Strategie");

        self.chain = new MarkovChain();
        self.chain.addNodes(['greeting', 
                             'identity', 
                             'age',
                             'wheather',
                             'irritation',
                             'veracity', 
                             'topicchange',
                             'metacommunication', 
                             'compliment',
                             'farewell',
                             'appointment',
                             'end'
                             ]);

        self.chain.addRelation("greeting", ["identity", "wheather", "compliment"]);   

        self.chain.addRelation("identity", ["veracity", "compliment", "age"]);   

        self.chain.addRelation("farewell", ["appointment", "end"]);
        self.chain.addRelation("appontment", ["farewell", "end"]);

        self.chain.addRelation("irritation", ["metacommunication"]);

        self.chain.writeFile();     
        }


    }


    self.init();

}





module.exports = Strategy;