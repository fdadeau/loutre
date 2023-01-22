describe("Relation", function () {

    it("should be able to create an empty relation", function () {
        let r = new Relation("toto");
        expect(r.cardinalite()).toEqual(0);
        expect(r.degre()).toEqual(0);
        expect(r.nom).toEqual("toto");
    });


    describe("with an empty relation", function() {
        
        var r;
        
        beforeEach(function() {
             r = new Relation("maRelation");
        });
        
        it("should be able to add a new attribute", function() {
            r.ajouterColonne("col1");
            expect(r.cardinalite()).toEqual(0);
            expect(r.degre()).toEqual(1);
        });
        
        it("should not be possible to add a new automatic record", function() {
            r.ajouterLigne();
            expect(r.cardinalite()).toEqual(0);
            expect(r.degre()).toEqual(0);
        });

        it("should not be possible to add a new manual record", function() {
            var b = r.ajouterEnregistrement({x: 42, y: 666});
            expect(b).toBeFalsy();
            expect(r.cardinalite()).toEqual(0);
            expect(r.degre()).toEqual(0);
        });
        
    });

});
