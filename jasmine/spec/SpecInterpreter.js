describe("Interpreter", function () {

    function etudiant() {
        var r = new Relation("ETUDIANT");
        r.import({ contenu: { 
                    id: [1, 2, 3, 4, 5], 
                    nom: ["étudiant 1", "étudiant 2", "étudiant 3", "étudiant 4", "étudiant 5"], 
                    date_naissance: [ 19981121, 19990203, 19990628, 20010301, 20071224 ] 
                },
                  visible: true
                 });
        return r;
    }
    
    var interpreter = new Interpreter();      
    
    var parser = new Parser();
                 
    it("should be able to copy a relation", function () {
        var etu = etudiant();
        var copy = new Relation("copy");
        copy.import({ visibilite: true, contenu: interpreter.applyCopy(etu) });
        // même degré
        expect(copy.degre()).toEqual(etu.degre());
        // même taille
        expect(copy.cardinalite()).toEqual(etu.cardinalite());
        // même contenu
        for (var i=0; i < etu.cardinalite(); i++) {
            var enr = etu.extraireEnregistrement(i);   
            expect(copy.contient(enr) >= 0).toBeTruthy();
        }
    });

    it("should be able to copy a relation", function () {
        var etu = etudiant();
        var copy = new Relation("copy");
        copy.import({ visibilite: true, contenu: interpreter.applyCopy(etu) });
        // même degré
        expect(copy.degre()).toEqual(etu.degre());
        // même taille
        expect(copy.cardinalite()).toEqual(etu.cardinalite());
        // même contenu
        for (var i=0; i < etu.cardinalite(); i++) {
            var enr = etu.extraireEnregistrement(i);   
            expect(copy.contient(enr) >= 0).toBeTruthy();
        }
    });

});
