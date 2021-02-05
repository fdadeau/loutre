function Interpreter() {
  
    /**
     *  Réalise une copie de la relation donnée en paramètre. 
     *  @param  relation    Relation    la relation à copier
     *  @return Object  un tableau associatif servant de contenu à la nouvelle relation. 
     */
    this.applyCopy = function(relation) {
        var res = {};
        var entete = relation.entete();
        entete.forEach(function (e) {
            res[e] = [];
        });
        for (var i = 0; i < relation.cardinalite(); i++) {
            var enr = relation.extraireEnregistrement(i);
            for (var e in enr) {
                res[e].push(enr[e]);
            }
        }
        return res;
    }


    /**
     *  Applique un opérateur ensembliste du type UNION, INTERSECTION, DIFFERENCE
     *  @return Object  un tableau associatif servant de contenu à la nouvelle relation. 
     */
    this.applyUnionInterDiff = function(which, operande1, operande2) {

        var res = {};

        // vérification d'usage (même degré, mêmes attributs) et calcul de l'entete 
        var l1 = operande1.degre(),
            l2 = operande2.degre();
        if (l1 == 0 || l2 == 0) {
            throw "Les deux relations doivent avoir un dégré non nul.";
        }
        if (l1 != l2) {
            throw "Les deux relations doivent avoir le même dégré.";
        }
        for (var i in operande1.contenu) {
            if (!operande2.contenu[i]) {
                throw "Opération impossible : les deux relations n'ont pas les mêmes attributs.";
            }
            res[i] = [];
        }
        // remplissage
        for (var i = 0; i < operande1.cardinalite(); i++) {
            var enr = operande1.extraireEnregistrement(i);
            if (which == "union" || which == "inter" && operande2.contient(enr) >= 0 || which == "minus" && operande2.contient(enr) < 0) {
                for (var att in enr) {
                    res[att].push(enr[att]);
                }
            }
        }
        if (which == "union") {
            for (var i = 0; i < operande2.cardinalite(); i++) {
                var enr = operande2.extraireEnregistrement(i);
                if (operande1.contient(enr) < 0) {
                    for (var att in enr) {
                        res[att].push(enr[att]);
                    }
                }
            }
        }
        // fin
        return res;
    }


    /**
     *  Calcule un produit cartesien entre les deux relations. 
     */
    this.applyProduitCartesien = function(relation1, relation2) {
        var res = {};
        // nouveaux noms des colonnes issues de la relation1;
        var newNames1 = {};
        relation1.entete().forEach(e => {
            if (relation2.contenu[e]) {
                newNames1[e] = (e.indexOf(".") > 0) ? relation1.nom + "_" + e : relation1.nom + "." + e;
            } else {
                newNames1[e] = e;
            }
            res[newNames1[e]] = [];
        });
        // nouveaux noms des colonnes
        var newNames2 = {};
        relation2.entete().forEach(e => {
            if (relation1.contenu[e]) {
                newNames2[e] = (e.indexOf(".") > 0) ? relation2.nom + "_" + e : relation2.nom + "." + e;
            } else {
                newNames2[e] = e;
            }
            res[newNames2[e]] = [];
        });
        // remplissage 
        for (var i = 0; i < relation1.cardinalite(); i++) {
            var enr1 = relation1.extraireEnregistrement(i);
            for (var j = 0; j < relation2.cardinalite(); j++) {
                var enr2 = relation2.extraireEnregistrement(j);
                for (var att in enr1) {
                    res[newNames1[att]].push(enr1[att]);
                }
                for (var att in enr2) {
                    res[newNames2[att]].push(enr2[att]);
                }
            }
        }

        return res;
    }


    /**
     *  Applique une jointure entre les deux relations. 
     */
    this.applyJointure = function(commande, relation1, relation2) {

        var nj;
        if (commande.condition.attribut) {
            nj = commande.condition.attribut;
            if (!relation1.contenu[nj]) {
                throw `La relation ${relation1.nom} ne possède pas l'attribut ${nj}`;
            }
            if (!relation2.contenu[nj]) {
                throw `La relation ${relation2.nom} ne possède pas l'attribut ${nj}`;
            }
        }

        var res = {};
        // nouveaux noms des colonnes issues de la relation1;
        var newNames1 = {};
        relation1.entete().forEach(e => {
            if (relation2.contenu[e]) {
                newNames1[e] = (e.indexOf(".") > 0) ? relation1.nom + "_" + e : relation1.nom + "." + e;
            } else {
                newNames1[e] = e;
            }
            res[(nj == e) ? nj : newNames1[e]] = [];
        });
        // nouveaux noms des colonnes
        var newNames2 = {};
        relation2.entete().forEach(e => {
            if (relation1.contenu[e]) {
                newNames2[e] = (e.indexOf(".") > 0) ? relation2.nom + "_" + e : relation2.nom + "." + e;
            } else {
                newNames2[e] = e;
            }
            if (e != nj) {
                res[newNames2[e]] = [];
            }
        });

        var usedJ = {};

        // remplissage 
        for (var i = 0; i < relation1.cardinalite(); i++) {
            var enr1 = relation1.extraireEnregistrement(i);
            var ext = 0;
            for (var j = 0; j < relation2.cardinalite(); j++) {
                var enr2 = relation2.extraireEnregistrement(j);
                var newEnr = {};
                for (var att in enr1) {
                    newEnr[newNames1[att]] = enr1[att];
                }
                for (var att in enr2) {
                    newEnr[newNames2[att]] = enr2[att];
                }
                // jointure naturelle
                if (nj) {
                    if (enr1[nj] == enr2[nj]) {
                        for (var att in newEnr) {
                            if (att == relation1.nom + "." + nj) {
                                res[nj].push(newEnr[att]);
                            } else if (att != relation2.nom + "." + nj) {
                                res[att].push(newEnr[att]);
                            }
                        }
                        ext++;
                        usedJ[j] = true;
                    }
                }
                // equi-jointure ou theta-jointure 
                else {
                    var ev = evaluate(commande.condition, newEnr, relation1.nom, relation2.nom);
                    if (ev.bool == true) {
                        for (var att in newEnr) {
                            res[att].push(newEnr[att]);
                        }
                        ext++;
                        usedJ[j] = true;
                    }
                }
            } // fin boucle j    
            if (commande.relation1externe && ext == 0) {
                for (var att in enr1) {
                    res[(att == nj) ? nj : newNames1[att]].push(enr1[att]);
                }
                for (var att in newNames2) {
                    if (att != nj) {
                        res[newNames2[att]].push(null);
                    }
                }
            }
        } // fin boucle i
        if (commande.relation2externe) {
            for (var j = 0; j < relation2.cardinalite(); j++) {
                if (!usedJ[j]) {
                    var enr2 = relation2.extraireEnregistrement(j);
                    for (var att in enr2) {
                        res[(att == nj) ? nj : newNames2[att]].push(enr2[att]);
                    }
                    for (var att in newNames1) {
                        if (att != nj) {
                            res[newNames1[att]].push(null);
                        }
                    }
                }
            }
        }
        return res;
    }



    /**
     *  Applique à la relation une projection sur l'ensemble des attributs demandés.
     *  @param  attributs   array       tableau de chaines (noms des attributs sur lesquels projeter)
     *  @param  relation    Relation    la relation sur laquelle réaliser la projection
     *  @return Object  un tableau associatif servant de contenu à la nouvelle relation. 
     */
    this.applyProjection = function(attributs, relation) {
        var c = relation.cardinalite();
        var res = {};
        for (var att in relation.contenu) {
            if (attributs.indexOf(att) >= 0) {
                res[att] = [];
            }
        }
        var entete = Object.keys(res);
        for (var i = 0; i < c; i++) {
            var enr = relation.extraireEnregistrement(i);
            var found = false;
            for (var j = 0; j < i; j++) {
                if (entete.every(att => enr[att] == relation.contenu[att][j])) {
                    found = true;
                    break;
                }
            }
            if (!found) {
                entete.forEach(function (att) {
                    res[att].push(enr[att]);
                });
            }
        }
        return res;
    }


    /**
     *  Applique à la relation une sélection des enregistrements qui satisfont la condition de sélection. 
     *  @param  condition   Object      l'expression booléenne à évaluer
     *  @param  relation    Relation    la relation sur laquelle réaliser la sélection
     *  @return Object  un tableau associatif servant de contenu à la nouvelle relation. 
     */
    this.applySelection = function(condition, relation) {
        var c = relation.cardinalite();
        var res = {};
        var entete = relation.entete();
        for (var att in relation.contenu) {
            res[att] = [];
        }
        for (var i = 0; i < c; i++) {
            var enr = relation.extraireEnregistrement(i);
            var ev = evaluate(condition, enr, relation.nom);
            if (ev.bool === undefined) {
                throw "La condition de la sélection n'est pas une expression booléenne.";
            }
            if (ev.bool == true) {
                entete.forEach(function (att) {
                    res[att].push(enr[att]);
                });
            }
        }
        return res;
    }



    /**
     *  Réalise une division entre deux relations à partir des listes d'attributs
     */
    this.applyDivision = function(relation1, attributs1, relation2, attributs2) {
        var res = {};

        // calcul de l'entête : celle de relation1 - les attributs
        var entete = relation1.entete().filter(e => attributs1.indexOf(e) < 0);

        entete.forEach(e => {
            res[e] = [];
        });

        for (var i = 0; i < relation1.cardinalite(); i++) {

            // enregistrement courant
            var enr1 = relation1.extraireEnregistrement(i);

            // on vérifie si le préfixe de l'enregistrement précédent est le même que le courant pour éviter les doublons
            if (i > 0 && entete.every(e => enr1[e] == relation1.contenu[e][i - 1])) {
                continue;
            }

            // verification prefixe dans tous les enregistrements de enr2
            var tous = true;
            for (var j = 0; j < relation2.cardinalite(); j++) {
                // pour chaque enregistrement de la relation2
                var enr2 = relation2.extraireEnregistrement(j);
                var tous2 = false;
                for (var k = 0; k < relation1.cardinalite(); k++) {
                    // on vérifie qu'il existe au moins un enregistrement de la relation1
                    var enr3 = relation1.extraireEnregistrement(k);
                    // qui correspond au prefixe en cours de considération et pour lequel tous les attributs de la division sont égaux 2 à 2
                    if (tous && entete.every(e => enr1[e] == enr3[e]) && attributs1.every((att, index) => enr3[att] == enr2[attributs2[index]])) {
                        tous2 = true;
                        break;
                    }
                }
                tous = tous && tous2;
            }
            // si pas ok --> on passe à l'enregistrement suivant
            if (!tous) {
                continue;
            }
            // on recopie
            entete.forEach(e => {
                res[e].push(enr1[e]);
            });
        }

        return res;
    }



    /**
     *  Evaluation d'une expression.
     *  @param  expr    Object  l'expression à évaluer
     *  @param  enr     Object  l'enregistrement sur lequel évaluer l'expression
     *  @param  rel1     String  le nom de la relation courante
     *  @param  rel2     String  le nom de la relation courante
     */
    function evaluate(expr, enr, rel1, rel2) {
        if (expr.chaine !== undefined || expr.nombre !== undefined) {
            return expr;
        }
        if (expr.attribut !== undefined) {
            var a = expr.attribut.split(".");
            if (a.length == 2) {
                // attribut == RELATION.NomAttribut
                if (enr[expr.attribut]) {
                    // prefixe issu d'une autre relation, mais présent dnas la relation actuelle
                    return (enr[expr.attribut]) ? {
                        chaine: enr[expr.attribut]
                    } : {
                        nombre: enr[expr.attribut]
                    };
                } else if (enr[a[1]] && (rel1 == a[0] || rel2 == a[0])) {
                    // prefixe de la relation courante
                    return (enr[a[1]].match) ? {
                        chaine: enr[a[1]]
                    } : {
                        nombre: enr[a[1]]
                    };
                }
            } else if (enr[expr.attribut] !== undefined) {
                // attribut "simple" présent dans l'entete
                return (enr[expr.attribut].match) ? {
                    chaine: enr[expr.attribut]
                } : {
                    nombre: enr[expr.attribut]
                };
            }
            console.log(enr);
            throw `L'attribut ${expr.attribut} n'existe pas dans la relation ${rel1}`;
        }
        if (expr.op !== undefined) {
            var operandes = expr.operandes.map(e => evaluate(e, enr, rel1, rel2));
            switch (expr.op) {
                case "=":
                    var type = Object.keys(operandes[0])[0];
                    if (operandes[1][type] === undefined) {
                        throw "Les types des opérandes du = ne sont pas les mêmes.";
                    }
                    return {
                        bool: operandes[0][type] == operandes[1][type]
                    };
                case "<>":
                    var type = Object.keys(operandes[0])[0];
                    if (operandes[1][type] === undefined) {
                        throw "Les types des opérandes du <> ne sont pas les mêmes.";
                    }
                    return {
                        bool: operandes[0][type] != operandes[1][type]
                    };
                case "<=":
                    if (operandes[0].nombre === undefined || operandes[1].nombre === undefined) {
                        throw "Les comparaisons ne peuvent s'effectuer qu'entre des nombres.";
                    }
                    return {
                        bool: operandes[0].nombre <= operandes[1].nombre
                    };
                case ">=":
                    if (operandes[0].nombre === undefined || operandes[1].nombre === undefined) {
                        throw "Les comparaisons ne peuvent s'effectuer qu'entre des nombres.";
                    }
                    return {
                        bool: operandes[0].nombre >= operandes[1].nombre
                    };
                case "<":
                    if (operandes[0].nombre === undefined || operandes[1].nombre === undefined) {
                        throw "Les comparaisons ne peuvent s'effectuer qu'entre des nombres.";
                    }
                    return {
                        bool: operandes[0].nombre < operandes[1].nombre
                    };
                case ">":
                    if (operandes[0].nombre === undefined || operandes[1].nombre === undefined) {
                        throw "Les comparaisons ne peuvent s'effectuer qu'entre des nombres.";
                    }
                    return {
                        bool: operandes[0].nombre > operandes[1].nombre
                    };
                case "and":
                    var b = true;
                    operandes.forEach(function (e) {
                        if (e.bool === undefined) {
                            throw "Expression booléenne attendue dans la conjonction &&";
                        }
                        b = b && e.bool;
                    });
                    return {
                        bool: b
                    };
                case "or":
                    var b = false;
                    operandes.forEach(function (e) {
                        if (e.bool === undefined) {
                            throw "Expression booléenne attendue dans la conjonction &&";
                        }
                        b = b || e.bool;
                    });
                    return {
                        bool: b
                    };
            }
        }
        throw "Impossible d'évaluer l'expression.";
    }

}
