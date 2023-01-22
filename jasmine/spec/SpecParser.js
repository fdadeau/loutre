describe("Parser", function () {

    var parser = new Parser();
    
    it("should fail when non starting with *** = ", function () {
        var query = "S(att > 42)R";
        expect(function() {
            parser.parse(query);
        }).toThrow("Il manque une affectation. Exemple : R = ...");
    });


    it("should be able to parse a copy", function() {
        var query = "X = Y";
        var r = parser.parse(query);
        expect(r.operation).toEqual("copy");
        expect(r.resultat).toEqual("X");
        expect(r.source).toEqual("Y");
    });
    
    it("should be able to recognize different names of relations", function() {
        var query = "X_D_D_S = Y_A_D1_2_3";
        var r = parser.parse(query);
        expect(r.operation).toEqual("copy");
        expect(r.resultat).toEqual("X_D_D_S");
        expect(r.source).toEqual("Y_A_D1_2_3");
    });
    
    describe("capability to parse set-based operators", function() {
    
        it("should be able to parse an union (UNION)", function() {
            var query = "X = Y UNION Z";
            var r = parser.parse(query);
            expect(r.operation).toEqual("union");
            expect(r.resultat).toEqual("X");
            expect(r.operande1).toEqual("Y");
            expect(r.operande2).toEqual("Z");
        });

        it("should be able to parse an intersection (INTERSECT)", function() {
            var query = "X = Y INTERSECT Z";
            var r = parser.parse(query);
            expect(r.operation).toEqual("intersect");
            expect(r.resultat).toEqual("X");
            expect(r.operande1).toEqual("Y");
            expect(r.operande2).toEqual("Z");
        });

        it("should be able to parse a difference (EXCEPT)", function() {
            var query = "X = Y EXCEPT Z";
            var r = parser.parse(query);
            expect(r.operation).toEqual("except");
            expect(r.resultat).toEqual("X");
            expect(r.operande1).toEqual("Y");
            expect(r.operande2).toEqual("Z");
        });

        it("should be able to parse a cartesian product (PCART)", function() {
            var query = "X = Y PCART Z";
            var r = parser.parse(query);
            expect(r.operation).toEqual("pcart");
            expect(r.resultat).toEqual("X");
            expect(r.operande1).toEqual("Y");
            expect(r.operande2).toEqual("Z");
        });
        
    });
    
    
    describe("capability to parse relational operators", function() {
        
        it("should be able to parse a selection with a simple equality condition", function() {
            var query = "X = S(x = 42) Y";
            var r = parser.parse(query);
            expect(r.operation).toEqual("selection");
            expect(r.resultat).toEqual("X");
            expect(r.condition).not.toEqual(undefined);
            expect(r.condition.op).toEqual("=");
            expect(r.condition.operandes[0].attribut).toEqual("x");
            expect(r.condition.operandes[1].nombre).toEqual("42");
            expect(r.relation).toEqual("Y");
        });                
        
        describe("capabilities to parse complex conditions", function() {

            it("should be able to parse a selection with a simple disequality condition", function() {
                var query = "X = S(x <> 42) Y";
                var r = parser.parse(query);
                expect(r.operation).toEqual("selection");
                expect(r.resultat).toEqual("X");
                expect(r.condition).not.toEqual(undefined);
                expect(r.condition.op).toEqual("<>");
                expect(r.relation).toEqual("Y");
            });        
            it("should be able to parse a selection with a simple inequality (<) condition", function() {
                var query = "X = S(x < 42) Y";
                var r = parser.parse(query);
                expect(r.operation).toEqual("selection");
                expect(r.resultat).toEqual("X");
                expect(r.condition).not.toEqual(undefined);
                expect(r.condition.op).toEqual("<");
                expect(r.condition.operandes[0].attribut).toEqual("x");
                expect(r.condition.operandes[1].nombre).toEqual("42");
                expect(r.relation).toEqual("Y");
            });        
            it("should be able to parse a selection with a simple inequality (<=) condition", function() {
                var query = "X = S(x <= 42) Y";
                var r = parser.parse(query);
                expect(r.operation).toEqual("selection");
                expect(r.resultat).toEqual("X");
                expect(r.condition).not.toEqual(undefined);
                expect(r.condition.op).toEqual("<=");
                expect(r.condition.operandes[0].attribut).toEqual("x");
                expect(r.condition.operandes[1].nombre).toEqual("42");
                expect(r.relation).toEqual("Y");
            });        
            it("should be able to parse a selection with a simple inequality (>) condition", function() {
                var query = "X = S(x > 42) Y";
                var r = parser.parse(query);
                expect(r.operation).toEqual("selection");
                expect(r.resultat).toEqual("X");
                expect(r.condition).not.toEqual(undefined);
                expect(r.condition.op).toEqual(">");
                expect(r.condition.operandes[0].attribut).toEqual("x");
                expect(r.condition.operandes[1].nombre).toEqual("42");
                expect(r.relation).toEqual("Y");
            });        
            it("should be able to parse a selection with a simple inequality (>=) condition", function() {
                var query = "X = S(x >= 42) Y";
                var r = parser.parse(query);
                expect(r.operation).toEqual("selection");
                expect(r.resultat).toEqual("X");
                expect(r.condition).not.toEqual(undefined);
                expect(r.condition.op).toEqual(">=");
                expect(r.condition.operandes[0].attribut).toEqual("x");
                expect(r.condition.operandes[1].nombre).toEqual("42");
                expect(r.relation).toEqual("Y");
            });        
            it("should be able to parse a selection with a conjunction (... && ...)", function() {
                var query = "X = S(x >= 42 && y < 12) Y";
                var r = parser.parse(query);
                expect(r.operation).toEqual("selection");
                expect(r.resultat).toEqual("X");
                expect(r.condition).not.toEqual(undefined);
                expect(r.condition.op).toEqual("and");
                expect(r.condition.operandes[0].op).toEqual(">=");
                expect(r.condition.operandes[1].op).toEqual("<");
                expect(r.relation).toEqual("Y");
            });        
            it("should be able to parse a selection with multiple conjunctions (...&&...&&...)", function() {
                var query = "X = S(x >= 42 && y < 12 && z = 16) Y";
                var r = parser.parse(query);
                expect(r.operation).toEqual("selection");
                expect(r.resultat).toEqual("X");
                expect(r.condition).not.toEqual(undefined);
                expect(r.condition.op).toEqual("and");
                expect(r.condition.operandes[0].op).toEqual(">=");
                expect(r.condition.operandes[1].op).toEqual("<");
                expect(r.condition.operandes[2].op).toEqual("=");
                expect(r.relation).toEqual("Y");
            });        
            it("should be able to parse a selection with a disjunction (...||...)", function() {
                var query = "X = S(x >= 42 || y < 12) Y";
                var r = parser.parse(query);
                expect(r.operation).toEqual("selection");
                expect(r.resultat).toEqual("X");
                expect(r.condition).not.toEqual(undefined);
                expect(r.condition.op).toEqual("or");
                expect(r.condition.operandes[0].op).toEqual(">=");
                expect(r.condition.operandes[1].op).toEqual("<");
                expect(r.relation).toEqual("Y");
            });        
            it("should be able to parse a selection with multiple disjunctions (...||...||...)", function() {
                var query = "X = S(x >= 42 || y < 12 || z = 16) Y";
                var r = parser.parse(query);
                expect(r.operation).toEqual("selection");
                expect(r.resultat).toEqual("X");
                expect(r.condition).not.toEqual(undefined);
                expect(r.condition.op).toEqual("or");
                expect(r.condition.operandes[0].op).toEqual(">=");
                expect(r.condition.operandes[1].op).toEqual("<");
                expect(r.condition.operandes[2].op).toEqual("=");
                expect(r.relation).toEqual("Y");
            });        
            it("should be able to parse a selection with disjunctions of conjuntions ( ... && ... || ...)", function() {
                var query = "X = S(x >= 42 && y < 12 || z = 16) Y";
                var r = parser.parse(query);
                expect(r.operation).toEqual("selection");
                expect(r.resultat).toEqual("X");
                expect(r.condition).not.toEqual(undefined);
                expect(r.condition.op).toEqual("or");
                expect(r.condition.operandes[0].op).toEqual("and");
                expect(r.condition.operandes[1].op).toEqual("=");
                expect(r.relation).toEqual("Y");
            });        
            it("should be able to parse a selection with disjunctions of conjuntions with useless parenthesis ( (... && ...) || ...)", function() {
                var query = "X = S((x >= 42 && y < 12) || z = 16) Y";
                var r = parser.parse(query);
                expect(r.operation).toEqual("selection");
                expect(r.resultat).toEqual("X");
                expect(r.condition).not.toEqual(undefined);
                expect(r.condition.op).toEqual("or");
                expect(r.condition.operandes[0].op).toEqual("and");
                expect(r.condition.operandes[1].op).toEqual("=");
                expect(r.relation).toEqual("Y");
            });        
            it("should be able to parse a selection with conjunctions of disjuntions with parenthesis ( ... && (... || ...) )", function() {
                var query = "X = S(x >= 42 && (y < 12 || z = 16)) Y";
                var r = parser.parse(query);
                expect(r.operation).toEqual("selection");
                expect(r.resultat).toEqual("X");
                expect(r.condition).not.toEqual(undefined);
                expect(r.condition.op).toEqual("and");
                expect(r.condition.operandes[0].op).toEqual(">=");
                expect(r.condition.operandes[1].op).toEqual("or");
                expect(r.relation).toEqual("Y");
            });        
            
        });
        
        describe("capability to parse join operations", function() {
        
            it("should be able to parse an inner join", function() {
                var query = "X = Y [ Y.x = Z.x ] Z";
                var r = parser.parse(query);
                expect(r.operation).toEqual("jointure");
                expect(r.resultat).toEqual("X");
                expect(r.relation1).toEqual("Y");
                expect(r.relation2).toEqual("Z");
                expect(r.condition).not.toEqual(undefined);
                expect(r.condition.op).toEqual("=");
                expect(r.condition.operandes[0].attribut).toEqual("Y.x");
                expect(r.condition.operandes[1].attribut).toEqual("Z.x");
            });

            it("should be able to parse a left outer join", function() {
                var query = "X = Y + [ Y.x = Z.x ] Z";
                var r = parser.parse(query);
                expect(r.operation).toEqual("jointure");
                expect(r.resultat).toEqual("X");
                expect(r.relation1).toEqual("Y");
                expect(r.relation1externe).toBeTruthy();
                expect(r.relation2).toEqual("Z");
                expect(r.condition).not.toEqual(undefined);
                expect(r.condition.op).toEqual("=");
                expect(r.condition.operandes[0].attribut).toEqual("Y.x");
                expect(r.condition.operandes[1].attribut).toEqual("Z.x");
            });

            it("should be able to parse a right outer join", function() {
                var query = "X = Y [ Y.x = Z.x ]+ Z";
                var r = parser.parse(query);
                expect(r.operation).toEqual("jointure");
                expect(r.resultat).toEqual("X");
                expect(r.relation1).toEqual("Y");
                expect(r.relation2externe).toBeTruthy();
                expect(r.relation2).toEqual("Z");
                expect(r.condition).not.toEqual(undefined);
                expect(r.condition.op).toEqual("=");
                expect(r.condition.operandes[0].attribut).toEqual("Y.x");
                expect(r.condition.operandes[1].attribut).toEqual("Z.x");
            });

            it("should be able to parse a full outer join", function() {
                var query = "X = Y +[ Y.x = Z.x ]+ Z";
                var r = parser.parse(query);
                expect(r.operation).toEqual("jointure");
                expect(r.resultat).toEqual("X");
                expect(r.relation1).toEqual("Y");
                expect(r.relation1externe).toBeTruthy();
                expect(r.relation2externe).toBeTruthy();
                expect(r.relation2).toEqual("Z");
                expect(r.condition).not.toEqual(undefined);
                expect(r.condition.op).toEqual("=");
                expect(r.condition.operandes[0].attribut).toEqual("Y.x");
                expect(r.condition.operandes[1].attribut).toEqual("Z.x");
            });

            it("should be able to parse a theta-join", function() {
                var query = "X = Y [ Y.x <> Z.x ] Z";
                var r = parser.parse(query);
                expect(r.operation).toEqual("jointure");
                expect(r.resultat).toEqual("X");
                expect(r.relation1).toEqual("Y");
                expect(r.relation2).toEqual("Z");
                expect(r.condition).not.toEqual(undefined);
                expect(r.condition.op).toEqual("<>");
                expect(r.condition.operandes[0].attribut).toEqual("Y.x");
                expect(r.condition.operandes[1].attribut).toEqual("Z.x");
            });

            
        });
            
    });
    
    
});