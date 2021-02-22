/**
 *  Classe permettant de gérer une relation et les opérations associées. 
 *  @author Frederic Dadeau
 */
function Relation(nom) {

    // nom de la relation
    this.nom = nom;

    this.formula = null;
    
    // contenu de la relation: map (nom colonne -> tableau de valeurs)
    this.contenu = {};  // format : { att1 => [ v1-1, v1-2, v1-3, ... ], att2 => [ v2-1, v2-2, v2-3, ... ] };

    // degré d'une relation
    this.degre = function() {
        return Object.keys(this.contenu).length;   
    }

    // cardinalité d'une relation
    this.cardinalite = function() {
        if (Object.keys(this.contenu).length == 0) {
            return 0;   
        }
        return this.contenu[Object.keys(this.contenu)[0]].length;
    }

    // entete d'une relation 
    this.entete = function() {
        return Object.keys(this.contenu);   
    }

    // suppression d'une colonne
    this.supprimerColonne = function(k) {
        k = Object.keys(this.contenu)[k];
        delete this.contenu[k];
        // verification des lignes en doublons --> suppression
        this.supprimeLignesEnDouble();            
    }

    // suppression d'une ligne
    this.supprimerLigne = function(i) {
        for (var k in this.contenu) {
            this.contenu[k].splice(i, 1);   
        }
    }

    // ajout d'une ligne (vide)
    this.ajouterLigne = function(k) {
        if (this.degre() == 0) {
            return;
        }
        var att0 = this.entete()[0];
        do {
            var nb = Math.random() * 10000 | 0;
        }
        while (this.contenu[att0].indexOf(att0 + "-" + nb) >= 0);
        for (var k in this.contenu) {
            this.contenu[k].push(k + "-" + nb);   
        }
    }
        
    // ajout d'un enregistrement
    this.ajouterEnregistrement = function(enr) {
        // verification que la map contient les bonnes entrées
        if (this.degre() > 0 && Object.keys(this.contenu).every(function(e) { return enr[e] != undefined; })) {
            for (var i in this.contenu) {
                this.contenu[i].push(enr[i]);   
            }
            return true;
        }
        return false;        
    }
    
    // récupérer enregistrement 
    this.extraireEnregistrement = function(i) {
        var enr = {};
        for (var att in this.contenu) {
            if (this.contenu[att][i] === undefined) {
                return {};   
            }
            enr[att] = this.contenu[att][i];   
        }
        return enr;
    }
    
    // teste si l'enregistrement existe dans la relation
    this.contient = function(enr) {
        var entete = this.entete();
        for (var i=0; i < this.cardinalite(); i++) {
            if (entete.every(e => this.contenu[e][i] == enr[e])) {
                return i;
            }
        }
        return -1;   
    }
    

    // ajout d'une colonne en fin de tableau
    this.ajouterColonne = function(k) {
        this.contenu[k] = [];
        var card = this.cardinalite();
        for (var i=1; i <= card; i++) {
            this.contenu[k].push(k + "-" + i);   
        }
    }


    // retire les lignes en double
    this.supprimeLignesEnDouble = function() {
        for (var i=0; i < this.cardinalite(); i++) {
            var j = this.existeEnDouble(i);
            if (j >= 0) {
                this.supprimerLigne(j);    
            }
        }
    }

    /** 
     *  Vérifie si la ligne existe en double. 
     *  @return l'indice >= 0 auquel la ligne existe en double, -1 sinon.  
     */
    this.existeEnDouble = function(i) {
        var entete = this.entete();
        for (var j=0; j < this.cardinalite(); j++) {
            if (i != j && entete.every(att => this.contenu[att][i] == this.contenu[att][j])) {
                return j;
            }
        }
        return -1;
    }
    
    /** 
     *  Verifie si la relation possède l'attribut passé en paramètre.
     *  Cas problématiques : att possède un préfixe
     */
    this.possedeAttribut = function(att) {
        if (att.indexOf(".") > 0) {
            att = att.split(".")[1];   
        }
        for (var a in this.contenu) {
            if (a.indexOf(".") > 0) {
                a = a.split(".")[1];   
            }
            if (a == att) {
                return true;
            }
        }
        return false;
    }

    
    // export 
    this.export = function() {
        return { contenu: this.contenu, visible: this.isVisible(), formula: this.formula };
    }
    
    // import
    this.import = function(data) {
        var keys = Object.keys(data.contenu);
        for (var att in data.contenu) {
            // si attribut préfixé, mais aucun autre attribut n'a le même nom (sans préfixe), on retire le préfixe inutile)
            if (att.split(".").length == 2 && keys.every(e => e == att || !e.endsWith("." + att.split(".")[1]))) {
                this.contenu[att.split(".")[1]] = data.contenu[att];
            }
            else {
                this.contenu[att] = data.contenu[att];   
            }
        }
        this.setVisible(data.visible);
        if (data.formula) {
            this.setFormule(data.formula);   
        }
        this.render();
    }
    
        

    // updates the rendering
    this.render = function() {

        while (this.element.hasChildNodes()) {
            this.element.removeChild(this.element.firstChild);   
        }

        var entete = this.entete();

        var table = document.createElement("table");

        var tr0 = document.createElement("tr");
        var j=0;
        for (var k in entete) {
            tr0.innerHTML += "<th data-nom='" + entete[k] + "'><span class='btnSupprimer' data-index='" + j + "' title='Supprimer cet attribut'></span></th>";
            j++;
        }                
        tr0.innerHTML += "<th class='btnAjouter' title='Ajouter un nouvel attribut'></th></tr>";
        table.appendChild(tr0);

        var card = this.cardinalite();

        for (var i=0; i < card; i++) {
            var trLigne = document.createElement("tr");
            for (var j of entete) {
                var tdColonne = document.createElement("td");
                var input = document.createElement("input");
                input.type = "text";
                input.value = this.contenu[j][i];
                input.setAttribute("data-index", i);
                input.setAttribute("data-attribut", j);
                input.addEventListener("change", function(e) {
                    var old = this.contenu[e.target.dataset.attribut][e.target.dataset.index];
                    this.contenu[e.target.dataset.attribut][e.target.dataset.index] = e.target.value;
                    if (this.existeEnDouble(e.target.dataset.index) >= 0) {
                        alert("Modification impossible : enregistrements dupliqués");
                        e.target.value = old;
                        this.contenu[e.target.dataset.attribut][e.target.dataset.index] = old;
                        e.target.focus();
                    }
                }.bind(this));
                tdColonne.appendChild(input);
                trLigne.appendChild(tdColonne);
            }
            var tdSupprimer = document.createElement("td");
            tdSupprimer.className = "btnSupprimer";
            tdSupprimer.setAttribute("data-index", i);
            tdSupprimer.title = "Supprimer cet enregistrement";
            trLigne.appendChild(tdSupprimer);
            table.appendChild(trLigne);
        }
        var tdAjouter = document.createElement("td");
        tdAjouter.setAttribute("colspan", this.degre());
        tdAjouter.className = "btnAjouter";
        tdAjouter.title = "Ajouter un nouvel enregistrement";
        var trDerniere = document.createElement("tr");
        trDerniere.appendChild(tdAjouter);

        table.appendChild(trDerniere);
        this.element.appendChild(table);
    }


    // fonction immédiatement invoquée
    this.element = (function() {
        var elem = document.createElement("div");
        elem.className = "relation";
        elem.dataset["nom"] = nom;
        if (this.formula) {
            elem.dataset["formule"] = this.formula;
        }

        var that = this;
        elem.addEventListener("click", function(e) {
            // clic sur le bouton de suppression...
            if (e.target.classList.contains("btnSupprimer")) {
                // ...d'une relation :
                if (e.target.tagName == "BUTTON") {
                    that.setVisible(false);
                    return;
                }
                // ...d'une ligne 
                if (e.target.tagName == "TD") {
                    if (confirm("Supprimer l'enregistrement ?")) {
                        that.supprimerLigne(1*e.target.dataset.index);  // conversion en number  
                        that.render();
                    }
                    return;
                }
                // ...d'une colonne 
                if (e.target.tagName == "SPAN") {
                    if (confirm("Supprimer l'attribut ?")) {
                        that.supprimerColonne(1*e.target.dataset.index);
                        that.render();
                    }
                    return;
                }
                return;
            }
            // clic sur un bouton d'ajout...
            if (e.target.classList.contains("btnAjouter")) {
                // d'une colonne/un attribut
                if (e.target.tagName == "TH") {
                    var k = window.prompt("Saisir le nom du nouvel attribut");
                    while (that.contenu[k]) {
                        alert("Creation imposible, l'attribut existe déjà.");
                        k = window.prompt("Saisir le nom du nouvel attribut", k);
                    }
                    if (k) {
                        that.ajouterColonne(k);
                        that.render();
                    }
                    return;
                }
                // d'une ligne/un enregistrement
                if (e.target.tagName == "TD") {
                    that.ajouterLigne();
                    that.render();
                    return;
                }
            }
        });

        // TODO : dblclick => renommage attribut

        return elem;
    }.bind(this))();

    this.render();    
    
    
    this.isVisible = function() {
        return !this.element.classList.contains("hidden");   
    }
    this.setVisible = function(b) {
        if (b) {
            this.element.classList.remove("hidden");
        }
        else {
            this.element.classList.add("hidden");
        }
    }
    
    this.setFormule = function(f) {
        this.formula = f;
        this.element.dataset.formule = f;
    }

}