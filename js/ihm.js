/**
 *  IHM pour l'outil de théorie relationnelle : 
 *  - création de relation
 *  - opérations sur les relations
 *  - enregistrement/chargement depuis le local storage
 */

"use strict";

document.addEventListener("DOMContentLoaded", function (_e) {

    // clé utilisée pour le stockage local
    const STORAGE_NAME = "workspaces";
    
    if (!localStorage.getItem(STORAGE_NAME)) {
        localStorage.setItem(STORAGE_NAME, "{}");  
    }
    
    // Espace de travail
    var workspace = new Projet(document.querySelector("main"), document.querySelector("nav"));
            
    /********************************************************
     *          Gestion des exemples pré-existants          *
     ********************************************************/
    
    // Ensemble des exemples du cours, chargés depuis le fichier "examples.json" à la racine du projet.
    var examples = {};
    
    // chargement des modèles d'exemple 
    fetch("./examples.json").then(function(response) {
        var contentType = response.headers.get("content-type");
        if (contentType && contentType.indexOf("application/json") !== -1) {
            return response.json().then(function (json) {
                examples = json;
                var html = "";
                for (var i in examples) {
                    html += "<li class='btnOuvrirExample' data-projet='" + i + "'>" + i + "</li>";
                }
                document.querySelector("body > aside ul:first-of-type").innerHTML = html;
            });
        } else {
            console.log("Impossible de charger les exemples.");
        }
    });
    
    
    /********************************************************
     *            Ecouteurs d'événements de l'IHM           *
     ********************************************************/
    
    /** 
     *  Ecouteurs d'événement clavier (sur le document)
     */
    document.addEventListener("keydown", function (e) {
        if (e.ctrlKey) {
            switch (e.keyCode) {
                case 78:    // n
                    e.preventDefault();
                    if (e.shiftKey) {
                        nouvelleRelation();                        
                    }
                    else {
                        nouveauWorkspace();
                    }
                    break;
                case 79:    // o
                    e.preventDefault();
                    ouvrir();
                    break;
                case 83: 
                    e.preventDefault();
                    sauvegarder();
                    break;
            }
        }
        if (e.keyCode == 27) {  // echap
            document.querySelector("body > aside").classList.add("hidden");
        }
    });
    
    
    /**
     *  Clic sur le menu de navigation sur le côté 
     *      - boutons nouveau/ouvrir/sauvegarder le workspace actuel, 
     *      - masquer/voir une relation, 
     *      - supprimer une relation,
     ¨      - créer une nouvelle relation
     */
    document.querySelector("nav").addEventListener("click", function(e) {
        if (e.target.id == "btnNouveau") {
            nouveauWorkspace();
            return;
        }
        if (e.target.id == "btnOuvrir") {
            ouvrir();
            return;
        }
        if (e.target.id == "btnSauvegarder") {
            sauvegarder();
            return;   
        }
        if (e.target.id == "btnNouvelleRelation") {
            nouvelleRelation();
            return;
        }
        
        if (e.target.tagName == "LI") {
            var nom = e.target.dataset.nom;
            workspace.relations[nom].setVisible(! workspace.relations[nom].isVisible());
            e.target.classList.toggle("masque");
            return;
        }
        if (e.target.classList.contains("btnSupprimer")) {
            if (confirm("Êtes-vous sûr de vouloir supprimer cette relation ?")) {
                workspace.supprimer(e.target.parentElement.dataset.nom);
                workspace.miseAJour();
            }
        }
    });
       

    /**     
     *  Ecouteur de clic sur la popup d'ouverture de projet
     */
    document.querySelector("body aside").addEventListener("click", function(e) {
        // Bouton pour fermer la popup
        if (e.target.classList.contains("btnFermer")) {
            e.target.parentElement.parentElement.classList.add("hidden");
            return;
        }
        // Choix d'un projet à ouvrir 
        if (e.target.classList.contains("btnOuvrirProjet")) {
            ouvrirProjet(e.target.dataset.projet);
            this.classList.add("hidden");
            return;
        }
        // Choix d'un exemple à ouvrir
        if (e.target.classList.contains("btnOuvrirExample")) {
            ouvrirExample(e.target.dataset.projet);
            this.classList.add("hidden");
            return;
        }
        // Choix d'un modèle à supprimer 
        if (e.target.classList.contains("btnSupprimer")) {
            if (confirm("Êtes-vous sûr de vouloir supprimer ce projet ?\n(cette action sera définitive)")) {
                var workspaces = JSON.parse(localStorage.getItem(STORAGE_NAME));
                delete workspaces[e.target.parentElement.dataset.projet];
                localStorage.setItem(STORAGE_NAME, JSON.stringify(workspaces));
                ouvrir();
            }
            return;
        }
    });
    
    
    /** Ecouteur pour copier les exemples **/
    document.querySelector("footer").addEventListener("dblclick", function(e) {
        if (e.target.tagName == "CODE" && e.target.innerHTML.indexOf("=") > 0) {
            document.getElementById("query").value = e.target.innerHTML;
        }
    });
    
    
    
    var parser = new Parser();
    
    document.getElementById("btnExecuter").addEventListener("click", function(e) {
        try {
            var query = document.getElementById("query").value
            var commande = parser.parse(query);
            if (workspace.existe(commande.resultat)) {
                throw `La relation ${commande.resultat} existe déjà dans le projet.`;       
            }
            var contenu = apply(commande, workspace.relations);
            // création de la relation résultat
            workspace.creer(commande.resultat, { contenu: contenu, visible: true });
            var main = document.querySelector("main");
            workspace.relations[commande.resultat].setFormule(query.substr(query.indexOf("=")+1).trim());
            main.insertBefore(workspace.relations[commande.resultat].element, main.firstChild);
            workspace.miseAJour();
            // ajout dans l'historique
            var option = document.createElement("option");
            option.value = document.getElementById("query").value;
            document.getElementById("historique").insertBefore(option, document.getElementById("historique").firstChild); 
        }
        catch (e) {
            console.log(e);
            alert(e);
            document.getElementById("query").focus();
        }
    });
    
    
    
    /************************************************ 
     *              Fonctions de l'IHM
     ************************************************/
    
    /** 
     * Nouveau workspace 
     */
    function nouveauWorkspace() {
        if (confirm("Abandonner le projet courant pour en commencer un nouveau ?")) {
            workspace.reset();
        }
    }
    
    /**
     *  Nouvelle relation
     */
    function nouvelleRelation() {
        while (true) {    
            // saisie du nom
            var nom = window.prompt("Donnez le nom de la nouvelle relation :");
            // nom vide
            if (!nom) {
                return;
            }
            nom = nom.trim();
            // nom existe déjà 
            if (workspace.existe(nom)) {
                window.alert("Ajout impossible : le nom existe déjà. Recommencez.");   
            }
            else {
                // --> ajout aux relations existantes
                workspace.ajouter(new Relation(nom));
                return;
            }
        }
    };

        
    /**
     *  Sauvegarde du workspace.
     */
    function sauvegarder() {
        var workspaces = JSON.parse(localStorage.getItem(STORAGE_NAME));
        do {
            var ws = prompt("Nommez votre sauvegarde :", workspace.nom);
            if (! ws) {
               return;
            }
            if (workspaces[ws] && confirm("Ce workspace existe déjà. L'écraser ?") || !workspaces[ws]) {
                workspaces[ws] = workspace.exporter();
                localStorage.setItem(STORAGE_NAME, JSON.stringify(workspaces));
                workspace.nommer(ws);
                return;
            }
        } while (ws);
    }
    
    /**
     *  Ouvre la fenêtre permettant de charger un projet 
     */
    function ouvrir() {
        var workspaces = JSON.parse(localStorage.getItem(STORAGE_NAME));
        // affichage des workspaces : 
        var html = "";
        for (var i in workspaces) {
            html += "<li class='btnOuvrirProjet' data-projet='" + i + "'>" + i + "<button class='btnSupprimer'></button>";   
        }
        document.querySelector("body aside div ul:nth-of-type(2)").innerHTML = html;
        document.querySelector("body aside").classList.remove("hidden");
    }
    
    /**
     *  Ouvre le projet issu du stockage local dont le nom est passé en paramètre.
     *  @param  ws  string  le nom de l'espace de travail à ouvrir
     */
    function ouvrirProjet(ws) {
        var workspaces = JSON.parse(localStorage.getItem(STORAGE_NAME));
        if (workspaces[ws]) {
            workspace.reset();
            workspace.nommer(ws);
            for (var r in workspaces[ws]) {
                try {
                    workspace.creer(r, workspaces[ws][r]);
                }
                catch (err) {
                    alert(err);   
                }
            }
        }
    }
    
    /**
     *  Ouverture de l'exemple choisi.
     *  @param  ex  String  l'identifiant de l'exemple que l'on veut ouvrir. 
     */
    function ouvrirExample(ex) {
        if (examples[ex]) {
            workspace.reset();
            for (var r in examples[ex]) {
                try {
                    workspace.creer(r, { contenu: examples[ex][r], visible: true} );
                }
                catch (err) {
                    alert(err);   
                }
            }
        }
    }


    // Instance de l'interpréteur de requetes
    var interpreter = new Interpreter();
  
    /**
     *  Applique la commande demandée sur la base des relations existantes.
     *  @param commande     Object  Résultat de l'analyse syntaxique issue de la méthode "parse" ci-dessus. 
     *  @param relations    Map     Tableau associatif de relations nom => contenu 
     *  @return             Object  Contenu d'une nouvelle relation créée à partir des relations précédentes. 
     *  @throws erreur si l'interprétation de la commande n'a pas été possible 
     */
    function apply(commande, relations) {

        switch (commande.operation) {
            case "copy":
                if (!relations[commande.source]) {
                    throw `La relation ${commande.source} n'existe pas.`;
                }
                return interpreter.applyCopy(relations[commande.source]);
            case "union":
            case "except":
            case "intersect":
                if (!relations[commande.operande1]) {
                    throw `La relation ${commande.operande1} n'existe pas.`;
                }
                if (!relations[commande.operande2]) {
                    throw `La relation ${commande.operande2} n'existe pas.`;
                }
                return interpreter.applyUnionInterDiff(commande.operation, relations[commande.operande1], relations[commande.operande2]);
            case "pcart":
                if (!relations[commande.operande1]) {
                    throw `La relation ${commande.operande1} n'existe pas.`;
                }
                if (!relations[commande.operande2]) {
                    throw `La relation ${commande.operande2} n'existe pas.`;
                }
                if (commande.operande1 == commande.operande2) {
                    throw `Impossible d'effectuer un produit cartésien entre une relation et elle-même.\nFaites d'abord une copie avec la syntaxe New = Source.`;
                }
                return interpreter.applyProduitCartesien(relations[commande.operande1], relations[commande.operande2]);
            case "div":
                if (!relations[commande.operande1]) {
                    throw `La relation ${commande.operande1} n'existe pas.`;
                }
                if (!relations[commande.operande2]) {
                    throw `La relation ${commande.operande2} n'existe pas.`;
                }
                var attributs = relations[commande.operande1].entete().filter(e => relations[commande.operande2].contenu[e] !== undefined);
                if (attributs.length == 0) {
                    throw `Les deux relations n'ont pas d'attributs en commun.`;
                }
                return interpreter.applyDivision(relations[commande.operande1], attributs, relations[commande.operande2], attributs);
            case "selection":
                if (!relations[commande.relation]) {
                    throw `La relation ${commande.relation} n'existe pas.`;
                }
                return interpreter.applySelection(commande.condition, relations[commande.relation]);
            case "projection":
                if (!relations[commande.relation]) {
                    throw `La relation ${commande.relation} n'existe pas.`;
                }
                return interpreter.applyProjection(commande.attributs, relations[commande.relation]);
            case "jointure":
                if (!relations[commande.relation1]) {
                    throw `La relation ${commande.relation1} n'existe pas.`;
                }
                if (!relations[commande.relation2]) {
                    throw `La relation ${commande.relation2} n'existe pas.`;
                }
                if (commande.relation1 == commande.relation2) {
                    throw `Impossible d'effectuer une jointure entre une relation et elle-même.\nFaites d'abord une copie avec la syntaxe New = Source.`;
                }
                return interpreter.applyJointure(commande, relations[commande.relation1], relations[commande.relation2]);
            case "division":
                if (!relations[commande.relation1]) {
                    throw `La relation ${commande.relation1} n'existe pas.`;
                }
                if (!relations[commande.relation2]) {
                    throw `La relation ${commande.relation2} n'existe pas.`;
                }
                for (var att of commande.attributs[0]) {
                    if (relations[commande.relation1].contenu[att] !== undefined) {
                        continue;
                    }
                    if (att.indexOf(".") >= 0 && att.split(".")[0] == commande.relation1 && relations[commande.relation1].contenu[att.split(".")[1]] !== undefined) {
                        continue;
                    }
                    throw `L'attribut ${att} n'existe pas dans la relation ${commande.relation1}.`;
                }
                for (var att of commande.attributs[1]) {
                    if (relations[commande.relation2].contenu[att] !== undefined) {
                        continue;
                    }
                    if (att.indexOf(".") >= 0 && att.split(".")[0] == commande.relation2 && relations[commande.relation2].contenu[att.split(".")[1]] !== undefined) {
                        continue;
                    }
                    throw `L'attribut ${att} n'existe pas dans la relation ${commande.relation2}.`;
                }
                // enlève les préfixes inutiles
                var att1 = commande.attributs[0].map(e => {
                    if (relations[commande.relation1].contenu[e] === undefined) {
                        e = e.split(".")[1];
                    }
                    return e;
                });
                var att2 = commande.attributs[1].map(e => {
                    if (relations[commande.relation2].contenu[e] === undefined) {
                        e = e.split(".")[1];
                    }
                    return e;
                });
                return interpreter.applyDivision(relations[commande.relation1], att1, relations[commande.relation2], att2);
        }

        throw "Commande non supportée";
    }

    
});
