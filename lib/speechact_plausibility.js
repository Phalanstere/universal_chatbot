


 this.tidy = function() {
        debugt("TIDY");
        // debugt( self.act );

        var act = {
            phrase: self.phrase
            }

        if (self.act.subject) {
           
            act.subject = Object.assign( self.act.subject );         
            delete act.subject.object;
            delete act.subject.subject;
            delete act.subject.prepositional_object;
            delete act.subject.adjective;

            }
        
        if (self.act.adverbial_clause) {
            act.adverbial_clause = Object.assign( self.act.adverbial_clause );
        }

        if (self.act.predicate) {
            act.predicate = Object.assign( self.act.predicate );
            act.predicate.type = "verb";

            // delete act.predicate.predicate;
            delete act.predicate.object;
            delete act.predicate.subject;
            delete act.predicate.genitive;
            delete act.predicate.prepositional_object;
            delete act.predicate.numerus;
            delete act.predicate.predicate;
            delete act.predicate.noun;
            
            act.predicate.tempus = self.get_predicate_time();
            var mode            = self.genus_verbi();
            if ( mode ) {
              debugt( mode );  
                act.predicate.genus     = mode.genus;
                act.predicate.tempus    = mode.tempus;
            if (mode.modal)             act.predicate.modal    = mode.modal;
                if (mode.subjunctive)   act.predicate.subjunctive = true;
            }

            var adv = self.assign_adverbs(act.predicate.position);
            if (adv) act.predicate.adverb = adv;

            //debugt( act );

        }

        if (self.act.prepositional_object) {
            debugt("EIN PRÄPOSITIONALES OBJEKT");

            act.prepositional_object = Object.assign( self.act.prepositional_object );
            delete act.prepositional_object.object.object;

            self.clean_null_elements( act.prepositional_object.object);
        }

        debugt("INFINITIVE ====================")

        if (self.act.infinitive_construction) {

            act.infinitive_construction = Object.assign( self.act.infinitive_construction );
            act.infinitive_construction.verb.type = "verb";
            delete act.infinitive_construction.verb.noun; 
            self.clean_null_elements( act.infinitive_construction.verb);


            debugt("CLEANUP ====================")
   
            if ( act.infinitive_construction.object) {
                debugt("TIDY ====================")

                debugt("Hier gibt es ein Objekt");
                self.clean_null_elements( act.infinitive_construction.object);
            }
        }

        // debugt(self.act);
       

        if (self.act.predicate) {

        debugt("ANALYSE");
        debugt( act );
        }

    debugt (" Das gesäuberte Objekt ");
    debugt( act );
    }