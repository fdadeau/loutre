/**
 *  Classe décrivant un parseur de requêtes en théorie relationnelle. 
 */
function Parser() {

    var REGEX_RELATION = /^[a-zA-Z][_a-zA-Z0-9]*$/g;
    var REGEX_ATTRIBUT = /^[a-zA-Z][_a-zA-Z0-9]*(\.[a-zA-Z][_a-zA-Z0-9]*)?$/g;
    var REGEX_NUMBER = /^[0-9]+(\.[0-9]+)?$/g;
    var REGEX_CHAINE = /^"[^"]*"$/g;

    /** 
     * Parse une chaine et renvoie un objet représentant l'opération demandée.
     */
    this.parse = function(s) {

        // recherche du (premier) "=" 
        var indexOfAssign = s.indexOf("=");
        if (indexOfAssign < 0) {
            throw "Il manque une affectation. Exemple : R = ...";   
        }

        // vérification de la syntaxe à gauche du "="
        var newRelation = s.substring(0, indexOfAssign).trim();
        if (! newRelation.match(REGEX_RELATION)) {
            throw `Le nom de la relation résultat ("${newRelation}") n'a pas le bon format.`; 
        }

        // initialisation du résultat 
        var ret = { resultat: newRelation };

        // récupération de l'expression à droite
        var expression = s.substring(indexOfAssign+1).trim();

        if (expression.match(REGEX_RELATION)) {
            ret.operation = "copy";
            ret.source = expression;
            return ret;
        }

        /* *************************************************************
         *             Cas simples : UNION, INTERSECT, EXCEPT (MINUS)
         ************************************************************* */
        ["union","intersect","except","div", "pcart"].forEach(function(e) {
            var indexOfBinaryOp = expression.toLowerCase().indexOf(" " + e + " ");
            if (indexOfBinaryOp >= 0) {
                var operande1 = expression.substring(0, indexOfBinaryOp).trim();
                if (!operande1.match(REGEX_RELATION)) {
                    throw `Le nom de la première opérande ("${operande1}") n'a pas le bon format.`;
                }
                var operande2 = expression.substring(indexOfBinaryOp+e.length+2).trim();
                if (!operande2.match(REGEX_RELATION)) {
                    throw `Le nom de la seconde opérande ("${operande2}") n'a pas le bon format.`;
                }
                ret.operation = e;
                ret.operande1 = operande1;
                ret.operande2 = operande2;
            }
        });
        if (ret.operation) {
            return ret;
        }

        /* *************************************************************
         *      Cas spécifiques : SELECTION, PROJECTION, JOINTURE
         ************************************************************* */
        // S(condition) RELATION
        if (expression.startsWith("S(")) {
            var indexOfClosingParenthesis = expression.lastIndexOf(")");
            if (indexOfClosingParenthesis < 0) {
                throw "Erreur de syntaxe dans l'opération de sélection.";
            }
            var condition = expression.substring(2, indexOfClosingParenthesis).trim();
            var R = expression.substring(indexOfClosingParenthesis+1).trim();
            if (! R.match(REGEX_RELATION)) {
                throw `Le nom de la relation ("${R}") n'a pas le bon format.`;
            }
            ret.operation = "selection";
            ret.relation = R;
            ret.condition = parseExpr(condition);
            return ret;
        }
        // [ att1, att2, att3 ] R
        if (expression.startsWith("[")) {
            var indexOfClosingBracket = expression.lastIndexOf("]");
            if (indexOfClosingBracket < 0) {
                throw "Erreur de syntaxe dans l'opération de projection.";   
            }
            var liste = expression.substring(1, indexOfClosingBracket);
            liste = liste.split(",").map(function(e) { return e.trim(); });
            liste.forEach(function(e) { 
                if (! e.match(REGEX_ATTRIBUT)) {
                    throw `Le format de l'attribut "${e}" est incorrect.`;
                }
            });
            var R = expression.substring(indexOfClosingBracket+1).trim();
            if (! R.match(REGEX_RELATION)) {
                throw `Le nom de la relation ("${R}") n'a pas le bon format.`;
            }
            ret.operation = "projection";
            ret.relation = R;
            ret.attributs = liste;
            return ret;
        }
        // R1[ condition ]R2
        var indexOfOpeningBracket = expression.indexOf("[");
        if (indexOfOpeningBracket > 0) {
            var indexOfClosingBracket = expression.lastIndexOf("]");
            var condition = expression.substring(indexOfOpeningBracket+1, indexOfClosingBracket).trim();
            var isDivision = condition.split("/").length == 2;
            var R1 = expression.substring(0, indexOfOpeningBracket).trim();
            if (!isDivision && R1.endsWith("+")) {
                ret.relation1externe = true;   
                R1 = R1.substring(0, R1.length-1).trim();
            }
            if (! R1.match(REGEX_RELATION)) {
                throw `Le nom de la relation ("${R1}") n'a pas le bon format.`;
            }
            var R2 = expression.substring(indexOfClosingBracket+1).trim();
            if (!isDivision && R2.startsWith("+")) {
                ret.relation2externe = true;   
                R2 = R2.substr(1).trim();
            }
            if (! R2.match(REGEX_RELATION)) {
                throw `Le nom de la relation ("${R2}") n'a pas le bon format.`;
            }
            ret.relation1 = R1;
            ret.relation2 = R2;
            if (isDivision) {
                ret.operation = "division";
                ret.attributs = condition.split("/");
                ret.attributs[0] = ret.attributs[0].split(",").map(function(e) { return e.trim(); });
                ret.attributs[0].forEach(function(e) {
                    if (! e.match(REGEX_ATTRIBUT)) {
                        throw `Le format de l'attribut "${e}" est incorrect.`;
                    }
                });
                ret.attributs[1] = ret.attributs[1].split(",").map(function(e) { return e.trim(); });
                ret.attributs[1].forEach(function(e) {
                    if (! e.match(REGEX_ATTRIBUT)) {
                        throw `Le format de l'attribut "${e}" est incorrect.`;
                    }
                });
                if (ret.attributs[0].length != ret.attributs[1].length) {
                    throw "Il doit y avoir autant d'attributs des deux côtés du /.";   
                }
            }
            else {
                ret.operation = "jointure";
                ret.condition = parseExpr(condition);
            }
            return ret;
        }


        if (!ret.operation) {
            throw "Erreur de syntaxe: commande non reconnue.\n\nReportez-vous à l'aide sur la syntaxe, disponible en cliquant sur le point d'interrogation en haut à droite de l'écran.";   
        }
    }

    /**
     *  Fonction utiilitaire : 
     *  Parse une expression booléenne (aka condition) pour en faire une sorte d'arbre de syntaxe abstraite.
     */
    function parseExpr(expression) {
        // retrait des espaces inutiles. 
        expression = expression.trim();
        if (expression.startsWith("(")) {
            if (expression.endsWith(")")) {
                return parseExpr(expression.substr(1, expression.length-2).trim());
            }
        }
        if (expression.split("||").length != 1 && expression.split("||").every(function(e) {
            e = e.trim();
            return (!e.startsWith("(") && !e.endsWith(")")) || (e.startsWith("(") && e.endsWith(")"));
        })) {
            return { op: "or", operandes: expression.split("||").map(function(e) { return parseExpr(e.trim()); }) };
        }
        if (expression.split("&&").length != 1 && expression.split("&&").every(function(e) {
            e = e.trim();
            return (!e.startsWith("(") && !e.endsWith(")")) || (e.startsWith("(") && e.endsWith(")"));
        })) {
            return { op: "and", operandes: expression.split("&&").map(function(e) { return parseExpr(e.trim()); }) };
        }
        if (expression.split("<>").length == 2) {
            return { op: "<>", operandes: expression.split("<>").map(function(e) { return parseExpr(e.trim()); }) };
        }
        if (expression.split("<=").length == 2) {
            return { op: "<=", operandes: expression.split("<=").map(function(e) { return parseExpr(e.trim()); }) };
        }
        if (expression.split(">=").length == 2) {
            return { op: ">=", operandes: expression.split(">=").map(function(e) { return parseExpr(e.trim()); }) };
        }
        if (expression.split(">").length == 2) {
            return { op: ">", operandes: expression.split(">").map(function(e) { return parseExpr(e.trim()); }) };
        }
        if (expression.split("<").length == 2) {
            return { op: "<", operandes: expression.split("<").map(function(e) { return parseExpr(e.trim()); }) };
        }
        if (expression.split("=").length == 2) {
            return { op: "=", operandes: expression.split("=").map(function(e) { return parseExpr(e.trim()); }) };
        }
        if (expression.match(REGEX_ATTRIBUT)) {
            return { attribut: expression };
        }
        if (expression.match(REGEX_CHAINE)) {
            return { chaine: expression.substr(1,expression.length-2) };
        }
        if (expression.match(REGEX_NUMBER)) {
            return { nombre: expression };
        }
        throw "Expression non reconnue : " + expression;
    }

}
