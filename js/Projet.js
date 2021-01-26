// Objet singleton : une seule instance existe dans le script                                            
function Projet(mElt, nElt) {
    
    const DEFAULT_NAME = "Sans titre";
    
    // liste de relations 
    this.relations = {};
 
    // nom du workspace 
    this.nom = DEFAULT_NAME;
    
    // flag indiquant si le workspace a été modifié depuis la dernière sauvegarde
    this.modifie = false;
    
    // Elements de l'IHM utilisé par le workspace pour mettre à jour l'affichage 
    this.mainElt = mElt;
    this.navElt = nElt;
    
    // teste si une relation existe 
    this.existe = function(nom) {
        return this.relations[nom] !== undefined;  
    };

    // renommage du workspace
    this.nommer = function(c) {
        this.nom = c;
    };

    // signale une modification depuis le dernier enregistrement
    this.touch = function() {
        this.modifie = true; 
    };

    // remise à zéro du workspace
    this.reset = function() {
        this.relations = {};
        this.modifie = false;
        this.nom = DEFAULT_NAME;
        this.mainElt.innerHTML = "";
        this.miseAJour();
    };

    // ajout d'une relation vide à l'ensemble des relations existantes
    this.ajouter = function(r) {
        this.relations[r.nom] = r;
        this.relations[r.nom].setVisible(true);
        this.mainElt.appendChild(r.element);
        this.miseAJour();
    };

    // supprimer de l'ensemble des relations existantes
    this.supprimer = function(nom) {
        this.relations[nom].setVisible(false);
        this.relations[nom].element.parentElement.removeChild(this.relations[nom].element);
        delete this.relations[nom];  
    };

    // creer une relation avec son contenu
    this.creer = function(nom, contenu) {
        if (this.existe(nom)) {
            throw "Une relation du même nom existe déjà.";
        }
        this.relations[nom] = new Relation(nom);
        this.relations[nom].import(contenu);
        this.mainElt.appendChild(this.relations[nom].element);
        this.miseAJour();

    };

    // mise à jour de la vue
    this.miseAJour = function() {
        var html = "";
        for (var i in this.relations) {
            var masqueCSS = this.relations[i].isVisible() ? "" : "masque";
            html += "<li data-nom='" + i + "' class='" + masqueCSS + "'>"
                + "<span class='fa fa-eye'></span><span class='fa fa-eye-slash'></span> " 
                + i + "<button class='btnSupprimer' title='Supprimer cette relation'></button>"
                + "</li>";
        }   
        this.navElt.querySelector("ul").innerHTML = html;
    };

    // exporter le workspace sous forme d'un objet serialisable
    this.exporter = function() {
        var exp = {}; 
        for (var nom in this.relations) {
            exp[nom] = this.relations[nom].export();
        }
        return exp;
    };

    /**
     *  Importer le workspace à partir des données en paramètres
     *  data : { nom => { contenu => { att => [ v1, v2 ], ... }, visible => true/false }, ... }
     */
    this.importer = function(data) {
        this.relations = {};
        for (var nom in data) {
            this.creer(nom, data[nom]);
        }
        this.miseAJour();
    };

}    
