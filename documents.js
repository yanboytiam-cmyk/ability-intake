/* ══════════════════════════════════════════════════════════════════════════
   Ability and Empowerment Services — fabrication du dossier d'admission
   ──────────────────────────────────────────────────────────────────────────
   Les DIX documents du dossier papier sont produits ici, dans le navigateur,
   deja signes, au moment ou le patient valide le formulaire :

     1. PRP Consent for Treatment
     2. OMHC Consent for Treatment
     3. Client Intake Questionnaire
     4. Emergency Contact and Primary Care Physician Information
     5. HIPAA Patient/Client Consent Form
     6. Informed Consent for Telehealth and Telephonic Services
     7. Authorization to Exchange Information
     8. Acknowledgement of Receipt — Persons Served Handbook
     9. Community Supports and Family of Origin
    10. PRP Initial Face-to-Face Screening        (rempli par le personnel)

   Chaque document est une fonction `contenuXxx(p, d, images)` qui empile des
   briques sur une page deja ouverte. C'est ce qui permet de les servir deux
   fois sans les ecrire deux fois : une fois enchainees dans le dossier
   complet, une fois seules dans leur propre fichier. Le cabinet classe le
   dossier relie ; les documents qui partent ailleurs (autorisation d echange,
   fiche du medecin traitant) partent seuls.

   Le texte juridique n'est jamais reformule : il est repris mot pour mot du
   dossier papier fourni par le cabinet. Ce que le patient a lu a l'ecran est
   exactement ce qui sort ici.
   ══════════════════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  /* Les couleurs sont celles du site du cabinet, relevees dans sa feuille de
     style : le patient qui arrive depuis leur site doit reconnaitre la marque
     sur le document ou il donne son numero de securite sociale.

     Une seule liberte prise sur la charte : l'accent est le vert fonce
     (#4E9E2E) et non le vert vif du logo (#80E050). L'accent porte du texte
     de 7 a 9 points sur fond blanc ; le vert vif y devient illisible, et
     disparait franchement a la photocopie. Un dossier medical se photocopie. */
  var BLEU = [48, 96, 176];      /* #3060B0 — le bleu du logo */
  var BLEU_SOMBRE = [39, 79, 146]; /* #274F92 */
  var VERT = [78, 158, 46];      /* #4E9E2E — le vert du logo, assombri pour rester lisible */
  var GRIS = [84, 96, 74];       /* #54604A */
  var ENCRE = [14, 19, 13];      /* #0E130D */
  var LIGNE = [221, 208, 174];   /* #DDD0AE */
  var DOUX = [244, 237, 220];    /* #F4EDDC — le creme du site */

  var CABINET = {
    nom: 'Ability and Empowerment Services, INC',
    adresse: '1 N Charles Street, Baltimore, MD 21201',
    contact: '(443) 438-5538  ·  online@abilityempowermenths.com',
    site: 'www.abilityempowermenths.com'
  };

  var L = 54, LARG = 612, HAUT = 792;
  var UTILE = LARG - L * 2;

  /* Un theme = les sept couleurs du gabarit plus la ligne de pied de page.
     Les briques de mise en page ne connaissent que ca. */
  var THEME_ABILITY = {
    style: 'ability',
    primaire: BLEU, second: BLEU_SOMBRE, accent: VERT,
    gris: GRIS, encre: ENCRE, ligne: LIGNE, doux: DOUX,
    pied: CABINET.nom
  };

  function logoAbility() {
    if (typeof document === 'undefined') return null;
    var img = document.querySelector('.intro-logo, .header-logo');
    return (img && img.src && img.src.indexOf('data:image') === 0) ? img.src : null;
  }

  function nonVide(v) {
    if (v === null || v === undefined) return '';
    v = String(v).trim();
    return (v === 'N/A' || v === 'undefined' || v === 'null') ? '' : v;
  }

  function estOui(v) {
    return String(v || '').trim().toLowerCase() === 'yes';
  }

  /* Une photo de carte d'assurance pese souvent plusieurs megaoctets. Telle
     quelle elle alourdirait le PDF autant que l'envoi. On la redimensionne
     avant de l'incruster : le texte de la carte reste lisible a 1400 px. */
  function preparerImage(dataUri, maxCote) {
    return new Promise(function (resolve) {
      if (!dataUri || dataUri.indexOf('data:image') !== 0) { resolve(null); return; }
      var img = new Image();
      img.onload = function () {
        try {
          var ech = Math.min(1, maxCote / Math.max(img.width, img.height));
          var w = Math.max(1, Math.round(img.width * ech));
          var h = Math.max(1, Math.round(img.height * ech));
          var c = document.createElement('canvas');
          c.width = w; c.height = h;
          var g = c.getContext('2d');
          g.fillStyle = '#fff'; g.fillRect(0, 0, w, h);
          g.drawImage(img, 0, 0, w, h);
          resolve({ uri: c.toDataURL('image/jpeg', 0.82), w: w, h: h, format: 'JPEG' });
        } catch (e) { resolve(null); }
      };
      img.onerror = function () { resolve(null); };
      img.src = dataUri;
    });
  }

  /* ────────────────────────────────────────────────────────────────────────
     Le gabarit : bandeau, pied de page, et les briques de mise en page.
     Les dix documents ne font qu'empiler ces briques.
     ──────────────────────────────────────────────────────────────────────── */
  function nouvellePage(titre, sousTitre, theme) {
    var jsPDF = window.jspdf.jsPDF;
    var doc = new jsPDF({ unit: 'pt', format: 'letter', compress: true });
    var etat = { y: 0 };
    var logo = logoAbility();

    /* Les briques ci-dessous ne connaissent que ces sept noms. En les
       redeclarant ici on rebadge tout le gabarit d'un seul coup, sans toucher
       a une seule ligne de contenu. */
    var T = theme || THEME_ABILITY;
    var FOREST = T.primaire, SAGE = T.second, GOLD = T.accent;
    var GREY = T.gris, INK = T.encre, LIGNE = T.ligne, DOUX = T.doux;

    function bandeau() {
      doc.setFillColor(FOREST[0], FOREST[1], FOREST[2]);
      doc.rect(0, 0, LARG, 6, 'F');
      doc.setFillColor(GOLD[0], GOLD[1], GOLD[2]);
      doc.rect(0, 6, LARG, 1.6, 'F');
      var y = 30, x = L;
      if (logo) {
        try { doc.addImage(logo, 'PNG', L, y, 62, 62); x = L + 78; } catch (e) { x = L; }
      }
      doc.setFont('times', 'bold'); doc.setFontSize(15);
      doc.setTextColor(FOREST[0], FOREST[1], FOREST[2]);
      var lgT = doc.splitTextToSize(titre, LARG - L - x);
      doc.text(lgT[0], x, y + 18);
      doc.setFont('times', 'normal'); doc.setFontSize(10);
      doc.setTextColor(GREY[0], GREY[1], GREY[2]);
      doc.text(doc.splitTextToSize(sousTitre || '', LARG - L - x)[0] || '', x, y + 33);
      doc.setFont('helvetica', 'bold'); doc.setFontSize(8.2);
      doc.setTextColor(FOREST[0], FOREST[1], FOREST[2]);
      doc.text(CABINET.nom, x, y + 50);
      doc.setFont('helvetica', 'normal'); doc.setFontSize(7.6);
      doc.setTextColor(GREY[0], GREY[1], GREY[2]);
      doc.text(CABINET.adresse, x, y + 60);
      doc.text(CABINET.contact, x, y + 70);
      etat.y = 112;
      doc.setDrawColor(GOLD[0], GOLD[1], GOLD[2]); doc.setLineWidth(0.8);
      doc.line(L, etat.y, LARG - L, etat.y);
      etat.y += 22;
    }

    /* Ouvre le document suivant du dossier relie : nouvelle page, nouveau
       bandeau, nouveau titre. C'est ce qui permet d'enchainer les dix
       documents dans un seul fichier sans reecrire leur contenu. */
    function entete(t, st) {
      doc.addPage();
      titre = t; sousTitre = st || '';
      etat.y = 0;
      bandeau();
    }

    function pied() {
      var n = doc.internal.getNumberOfPages();
      for (var i = 1; i <= n; i++) {
        doc.setPage(i);
        doc.setDrawColor(LIGNE[0], LIGNE[1], LIGNE[2]); doc.setLineWidth(0.6);
        doc.line(L, HAUT - 44, LARG - L, HAUT - 44);
        doc.setFont('helvetica', 'normal'); doc.setFontSize(7.2);
        doc.setTextColor(155, 165, 158);
        doc.text('Confidential — protected health information.', L, HAUT - 31);
        doc.text(T.pied + '  ·  Page ' + i + ' of ' + n, LARG - L, HAUT - 31, { align: 'right' });
      }
    }
    function place(h) {
      if (etat.y + h > HAUT - 62) { doc.addPage(); etat.y = 52; return true; }
      return false;
    }
    function saut() { doc.addPage(); etat.y = 52; }

    /* Bandeau de grande section (A, B, C, D) : il doit se voir au feuilletage. */
    function section(lettre, titre, chapeau) {
      place(80);
      var h = 34;
      doc.setFillColor(FOREST[0], FOREST[1], FOREST[2]);
      doc.rect(L, etat.y - 12, UTILE, h, 'F');
      doc.setFillColor(GOLD[0], GOLD[1], GOLD[2]);
      doc.rect(L, etat.y - 12, 4, h, 'F');
      doc.setFont('helvetica', 'bold');
      if (lettre) {
        doc.setFontSize(8);
        doc.setTextColor(GOLD[0], GOLD[1], GOLD[2]);
        doc.text('SECTION ' + lettre, L + 16, etat.y + 1);
      }
      doc.setFontSize(11); doc.setTextColor(255, 255, 255);
      doc.text(titre.toUpperCase(), L + 16, lettre ? etat.y + 15 : etat.y + 9);
      etat.y += h + 6;
      if (chapeau) {
        doc.setFont('helvetica', 'italic'); doc.setFontSize(8.2);
        doc.setTextColor(GREY[0], GREY[1], GREY[2]);
        var lg = doc.splitTextToSize(chapeau, UTILE);
        for (var i = 0; i < lg.length; i++) { doc.text(lg[i], L, etat.y); etat.y += 11; }
        etat.y += 6;
      }
    }

    /* `hSuite` : la hauteur de ce qui suit immediatement. Sans elle, un titre
       pouvait tomber en bas de page et ses images partir a la suivante, ce qui
       donne un intitule seul au-dessus du vide. Un document medical se relit
       en diagonale : un titre sans contenu ressemble a une piece manquante. */
    function titreSection(t, num, hSuite) {
      place(44 + (hSuite || 0));
      etat.y += 6;
      if (num) {
        doc.setFont('helvetica', 'bold'); doc.setFontSize(7.4);
        doc.setTextColor(GOLD[0], GOLD[1], GOLD[2]);
        doc.text(String(num), L, etat.y);
      }
      doc.setFont('helvetica', 'bold'); doc.setFontSize(9.4);
      doc.setTextColor(FOREST[0], FOREST[1], FOREST[2]);
      doc.text(t.toUpperCase(), num ? L + 26 : L, etat.y);
      etat.y += 6;
      doc.setDrawColor(LIGNE[0], LIGNE[1], LIGNE[2]); doc.setLineWidth(0.6);
      doc.line(L, etat.y, LARG - L, etat.y);
      etat.y += 14;
    }

    function paragraphe(txt, opts) {
      opts = opts || {};
      doc.setFont('helvetica', opts.gras ? 'bold' : (opts.italique ? 'italic' : 'normal'));
      doc.setFontSize(opts.taille || 9.2);
      var c = opts.couleur || INK;
      doc.setTextColor(c[0], c[1], c[2]);
      var lignes = doc.splitTextToSize(txt, opts.largeur || UTILE);
      var il = opts.interligne || 12.5;
      for (var i = 0; i < lignes.length; i++) {
        place(il);
        doc.text(lignes[i], opts.x || L, etat.y);
        etat.y += il;
      }
      etat.y += (opts.apres === undefined ? 8 : opts.apres);
    }

    function puces(items) {
      for (var i = 0; i < items.length; i++) {
        var lg = doc.splitTextToSize(items[i], UTILE - 16);
        place(lg.length * 11.6 + 2);
        doc.setFillColor(SAGE[0], SAGE[1], SAGE[2]);
        doc.circle(L + 3, etat.y - 3, 1.8, 'F');
        doc.setFont('helvetica', 'normal'); doc.setFontSize(9);
        doc.setTextColor(INK[0], INK[1], INK[2]);
        for (var j = 0; j < lg.length; j++) {
          if (j > 0) place(11.6);
          doc.text(lg[j], L + 16, etat.y);
          etat.y += 11.6;
        }
        etat.y += 2;
      }
      etat.y += 4;
    }

    function liste(items) {
      var indent = 18;
      for (var i = 0; i < items.length; i++) {
        var lg = doc.splitTextToSize(items[i], UTILE - indent);
        place(lg.length * 12.5 + 4);
        doc.setFont('helvetica', 'bold'); doc.setFontSize(9.2);
        doc.setTextColor(SAGE[0], SAGE[1], SAGE[2]);
        doc.text(String(i + 1) + '.', L, etat.y);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(INK[0], INK[1], INK[2]);
        for (var j = 0; j < lg.length; j++) {
          if (j > 0) place(12.5);
          doc.text(lg[j], L + indent, etat.y);
          etat.y += 12.5;
        }
        etat.y += 4;
      }
      etat.y += 4;
    }

    /* Champs en deux colonnes : libelle discret, valeur soulignee.
       Une valeur vide laisse un trait a remplir a la main. */
    function champs(paires, colonnes) {
      var nb = colonnes || 2;
      var colonne = UTILE / nb;
      doc.setFont('helvetica', 'bold'); doc.setFontSize(7.2);
      for (var i = 0; i < paires.length; i += nb) {
        /* Un libelle long tient sur deux lignes plutot que d'etre tronque :
           « IF AUTHORIZED REPRESENTATIVE, RELATIONSHIP TO » sans son
           dernier mot ne veut plus rien dire sur un document juridique. */
        var lignesEtiq = 1;
        for (var e = 0; e < nb; e++) {
          var pe = paires[i + e];
          if (!pe || !pe[0]) continue;
          var n = doc.splitTextToSize(pe[0].toUpperCase(), colonne - 16).length;
          if (n > lignesEtiq) lignesEtiq = Math.min(n, 2);
        }
        var hEtiq = lignesEtiq * 9;

        /* Et la valeur pareillement. « 2417 Greenmount Avenue, Apt 3B,
           Baltimore, MD 21218 » coupe apres « MD » n'est plus une adresse :
           on ne peut ni y envoyer un courrier, ni verifier une couverture.
           Le libelle avait ete corrige, la valeur souffrait du meme mal. */
        var lignesVal = 1;
        doc.setFont('helvetica', 'normal'); doc.setFontSize(9.6);
        for (var v = 0; v < nb; v++) {
          var pv = paires[i + v];
          if (!pv || !pv[0]) continue;
          var nv = doc.splitTextToSize(nonVide(pv[1]), colonne - 16).length;
          if (nv > lignesVal) lignesVal = Math.min(nv, 2);
        }
        var hVal = (lignesVal - 1) * 11;

        place(hEtiq + hVal + 27);
        for (var k = 0; k < nb; k++) {
          var p = paires[i + k];
          if (!p || !p[0]) continue;
          var x = L + k * colonne, larg = colonne - 16;
          doc.setFont('helvetica', 'bold'); doc.setFontSize(7.2);
          doc.setTextColor(SAGE[0], SAGE[1], SAGE[2]);
          var lg = doc.splitTextToSize(p[0].toUpperCase(), larg);
          for (var j = 0; j < lignesEtiq && j < lg.length; j++) {
            doc.text(lg[j], x, etat.y + j * 9);
          }
          doc.setFont('helvetica', 'normal'); doc.setFontSize(9.6);
          doc.setTextColor(INK[0], INK[1], INK[2]);
          var lv = doc.splitTextToSize(nonVide(p[1]), larg);
          for (var w = 0; w < lignesVal && w < lv.length; w++) {
            doc.text(lv[w], x, etat.y + hEtiq + 5 + w * 11);
          }
          doc.setDrawColor(LIGNE[0], LIGNE[1], LIGNE[2]); doc.setLineWidth(0.7);
          doc.line(x, etat.y + hEtiq + hVal + 10, x + larg, etat.y + hEtiq + hVal + 10);
        }
        etat.y += hEtiq + hVal + 27;
      }
      etat.y += 2;
    }

    /* Question ouverte : l'intitule au-dessus, la reponse dessous, sur toute
       la largeur. Une reponse vide affiche "Not provided" plutot que rien :
       un blanc laisse croire a un oubli de generation. */
    function question(q, r, opts) {
      opts = opts || {};
      var val = nonVide(r);
      var lgQ = doc.splitTextToSize(q, UTILE);
      var lgR = doc.splitTextToSize(val || 'Not provided', UTILE - 12);
      place(lgQ.length * 11 + lgR.length * 12 + 14);
      doc.setFont('helvetica', 'bold'); doc.setFontSize(8.4);
      doc.setTextColor(FOREST[0], FOREST[1], FOREST[2]);
      for (var i = 0; i < lgQ.length; i++) { doc.text(lgQ[i], L, etat.y); etat.y += 11; }
      etat.y += 3;
      doc.setFont('helvetica', val ? 'normal' : 'italic'); doc.setFontSize(9.4);
      if (val) doc.setTextColor(INK[0], INK[1], INK[2]);
      else doc.setTextColor(GREY[0], GREY[1], GREY[2]);
      for (var j = 0; j < lgR.length; j++) {
        place(12);
        doc.text(lgR[j], L + 12, etat.y);
        etat.y += 12;
      }
      etat.y += (opts.apres === undefined ? 8 : opts.apres);
    }

    /* Question fermee : intitule a gauche, reponse a droite, sur une ligne. */
    function questionCourte(q, r) {
      var val = nonVide(r) || '—';
      var largeQ = UTILE - 110;
      var lg = doc.splitTextToSize(q, largeQ);
      place(lg.length * 11.5 + 8);
      doc.setFont('helvetica', 'normal'); doc.setFontSize(8.8);
      doc.setTextColor(INK[0], INK[1], INK[2]);
      var yDebut = etat.y;
      for (var i = 0; i < lg.length; i++) {
        if (i > 0) place(11.5);
        doc.text(lg[i], L, etat.y);
        etat.y += 11.5;
      }
      doc.setFont('helvetica', 'bold'); doc.setFontSize(8.8);
      doc.setTextColor(estOui(val) ? GOLD[0] : SAGE[0], estOui(val) ? GOLD[1] : SAGE[1],
                       estOui(val) ? GOLD[2] : SAGE[2]);
      doc.text(val, LARG - L, yDebut, { align: 'right' });
      doc.setDrawColor(LIGNE[0], LIGNE[1], LIGNE[2]); doc.setLineWidth(0.5);
      doc.line(L, etat.y + 1, LARG - L, etat.y + 1);
      etat.y += 9;
    }

    function caseACocher(coche, texte) {
      var lg = doc.splitTextToSize(texte, UTILE - 22);
      place(lg.length * 12 + 6);
      var yb = etat.y - 8;
      doc.setDrawColor(SAGE[0], SAGE[1], SAGE[2]); doc.setLineWidth(0.9);
      doc.rect(L, yb, 10, 10);
      if (coche) {
        doc.setFillColor(SAGE[0], SAGE[1], SAGE[2]);
        doc.rect(L + 2, yb + 2, 6, 6, 'F');
      }
      doc.setFont('helvetica', coche ? 'bold' : 'normal'); doc.setFontSize(9);
      var c = coche ? INK : GREY;
      doc.setTextColor(c[0], c[1], c[2]);
      for (var i = 0; i < lg.length; i++) {
        if (i > 0) place(12);
        doc.text(lg[i], L + 20, etat.y);
        etat.y += 12;
      }
      etat.y += 6;
    }

    /* Grille de cases a cocher sur trois colonnes, comme la liste de symptomes
       du formulaire papier : on garde les non coches, leur absence est une
       information clinique. */
    function grilleCases(items, colonnes) {
      var nb = colonnes || 3;
      var colonne = UTILE / nb;
      for (var i = 0; i < items.length; i += nb) {
        place(20);
        for (var k = 0; k < nb; k++) {
          var it = items[i + k];
          if (!it) continue;
          var x = L + k * colonne;
          doc.setDrawColor(SAGE[0], SAGE[1], SAGE[2]); doc.setLineWidth(0.8);
          doc.rect(x, etat.y - 7.5, 8.5, 8.5);
          if (it.coche) {
            doc.setFillColor(SAGE[0], SAGE[1], SAGE[2]);
            doc.rect(x + 1.8, etat.y - 5.7, 4.9, 4.9, 'F');
          }
          doc.setFont('helvetica', it.coche ? 'bold' : 'normal'); doc.setFontSize(7.8);
          var c = it.coche ? INK : GREY;
          doc.setTextColor(c[0], c[1], c[2]);
          doc.text(doc.splitTextToSize(it.texte, colonne - 20)[0], x + 13, etat.y);
        }
        etat.y += 16;
      }
      etat.y += 6;
    }

    /* Tableau simple : en-tetes sur fond vert, lignes alternees. */
    function tableau(entetes, lignes, parts) {
      var total = parts.reduce(function (a, b) { return a + b; }, 0);
      var largeurs = parts.map(function (p) { return UTILE * p / total; });
      function ligne(cellules, opt) {
        var hauteurs = cellules.map(function (c, i) {
          return doc.splitTextToSize(String(c === undefined ? '' : c), largeurs[i] - 10).length;
        });
        var nbl = Math.max.apply(null, hauteurs);
        var h = nbl * 10.5 + 8;
        place(h);
        if (opt.entete) {
          doc.setFillColor(FOREST[0], FOREST[1], FOREST[2]);
          doc.rect(L, etat.y - 9, UTILE, h, 'F');
        } else if (opt.paire) {
          doc.setFillColor(DOUX[0], DOUX[1], DOUX[2]);
          doc.rect(L, etat.y - 9, UTILE, h, 'F');
        }
        var x = L;
        for (var i = 0; i < cellules.length; i++) {
          doc.setFont('helvetica', opt.entete ? 'bold' : 'normal');
          doc.setFontSize(opt.entete ? 7.6 : 8.4);
          if (opt.entete) doc.setTextColor(255, 255, 255);
          else doc.setTextColor(INK[0], INK[1], INK[2]);
          var lg = doc.splitTextToSize(String(cellules[i] === undefined ? '' : cellules[i]),
                                       largeurs[i] - 10);
          for (var j = 0; j < lg.length; j++) doc.text(lg[j], x + 5, etat.y + j * 10.5);
          x += largeurs[i];
        }
        doc.setDrawColor(LIGNE[0], LIGNE[1], LIGNE[2]); doc.setLineWidth(0.5);
        doc.line(L, etat.y + h - 9, LARG - L, etat.y + h - 9);
        etat.y += h;
      }
      ligne(entetes, { entete: true });
      for (var r = 0; r < lignes.length; r++) ligne(lignes[r], { paire: r % 2 === 1 });
      etat.y += 8;
    }

    /* Une piece jointe (carte d'assurance, piece d'identite) posee dans le
       document : c'est la seule copie conservee, elle doit rester lisible. */
    function piece(img, legende) {
      var largeMax = UTILE * 0.62, hautMax = 210;
      doc.setFont('helvetica', 'bold'); doc.setFontSize(7.6);
      doc.setTextColor(SAGE[0], SAGE[1], SAGE[2]);
      if (!img) {
        place(26);
        doc.text(legende.toUpperCase(), L, etat.y);
        doc.setFont('helvetica', 'italic'); doc.setFontSize(8.4);
        doc.setTextColor(GREY[0], GREY[1], GREY[2]);
        doc.text('Not provided', L + 200, etat.y);
        etat.y += 18;
        return;
      }
      var ech = Math.min(largeMax / img.w, hautMax / img.h, 1);
      var w = img.w * ech, h = img.h * ech;
      place(h + 30);
      doc.text(legende.toUpperCase(), L, etat.y);
      etat.y += 8;
      try { doc.addImage(img.uri, img.format, L, etat.y, w, h); } catch (e) { }
      doc.setDrawColor(LIGNE[0], LIGNE[1], LIGNE[2]); doc.setLineWidth(0.8);
      doc.rect(L, etat.y, w, h);
      etat.y += h + 16;
    }

    /* Bloc de signature : image si elle existe, sinon une ligne vierge a
       signer a la main. C'est ce qui laisse sa place a Caroline Bonu tant
       qu'elle n'a pas enregistre la sienne. */
    function signature(opts) {
      /* 96 points ne suffisent pas : avec le nom imprime et la qualite du
         signataire, le bloc en fait 110 et venait frotter le pied de page.
         On reserve la hauteur reelle plutot que celle du cas le plus court. */
      place(118);
      var larg = UTILE * 0.52;
      var yImg = etat.y;
      if (opts.image) {
        try { doc.addImage(opts.image, 'PNG', L, yImg, 150, 46); } catch (e) { }
      }
      var yl = yImg + 50;
      doc.setDrawColor(INK[0], INK[1], INK[2]); doc.setLineWidth(0.8);
      doc.line(L, yl, L + larg, yl);
      doc.setFont('helvetica', 'normal'); doc.setFontSize(7.4);
      doc.setTextColor(GREY[0], GREY[1], GREY[2]);
      doc.text(opts.libelle, L, yl + 11);

      var xd = L + larg + 30, largD = LARG - L - xd;
      doc.setDrawColor(INK[0], INK[1], INK[2]);
      doc.line(xd, yl, xd + largD, yl);
      doc.setFont('helvetica', 'normal'); doc.setFontSize(9.6);
      doc.setTextColor(INK[0], INK[1], INK[2]);
      if (nonVide(opts.date)) doc.text(opts.date, xd, yl - 6);
      doc.setFontSize(7.4); doc.setTextColor(GREY[0], GREY[1], GREY[2]);
      doc.text(opts.libelleDate || 'DATE SIGNED (MM/DD/YYYY)', xd, yl + 11);

      etat.y = yl + 26;
      if (nonVide(opts.nomImprime)) {
        doc.setFont('helvetica', 'bold'); doc.setFontSize(9.2);
        doc.setTextColor(INK[0], INK[1], INK[2]);
        doc.text(opts.nomImprime, L, etat.y); etat.y += 12;
      }
      if (nonVide(opts.sousTitre)) {
        doc.setFont('helvetica', 'normal'); doc.setFontSize(8.4);
        doc.setTextColor(GREY[0], GREY[1], GREY[2]);
        doc.text(opts.sousTitre, L, etat.y); etat.y += 12;
      }
      etat.y += 10;
    }

    function encadre(texte) {
      var lg = doc.splitTextToSize(texte, UTILE - 28);
      var h = lg.length * 11.5 + 20;
      place(h + 8);
      doc.setFillColor(DOUX[0], DOUX[1], DOUX[2]);
      doc.roundedRect(L, etat.y - 10, UTILE, h, 6, 6, 'F');
      doc.setDrawColor(SAGE[0], SAGE[1], SAGE[2]); doc.setLineWidth(2);
      doc.line(L, etat.y - 10, L, etat.y - 10 + h);
      doc.setFont('helvetica', 'normal'); doc.setFontSize(8.4);
      doc.setTextColor(INK[0], INK[1], INK[2]);
      var yy = etat.y + 4;
      for (var i = 0; i < lg.length; i++) { doc.text(lg[i], L + 14, yy); yy += 11.5; }
      etat.y += h + 4;
    }

    bandeau();
    return {
      doc: doc, etat: etat, place: place, saut: saut, section: section,
      titreSection: titreSection, paragraphe: paragraphe, puces: puces, liste: liste,
      champs: champs, question: question, questionCourte: questionCourte,
      caseACocher: caseACocher, grilleCases: grilleCases, tableau: tableau,
      piece: piece, signature: signature, encadre: encadre,
      entete: entete, pied: pied
    };
  }

  /* ────────────────────────────────────────────────────────────────────────
     Petites aides communes aux dix documents.
     ──────────────────────────────────────────────────────────────────────── */

  function ouiNon(v) {
    var s = nonVide(v);
    if (!s) return '';
    var b = s.toLowerCase();
    if (b === 'yes' || b === 'true' || b === '1') return 'Yes';
    if (b === 'no' || b === 'false' || b === '0') return 'No';
    return s;
  }

  function nomComplet(d) {
    var n = nonVide(d.full_name);
    if (n) return n;
    return (nonVide(d.first_name) + ' ' + nonVide(d.last_name)).trim();
  }

  /* L'adresse est saisie en morceaux pour que le patient tape le code postal
     au clavier numerique ; elle se relit d'un bloc sur le document. */
  function adresseComplete(d) {
    return adressePrefixe(d, 'address');
  }

  function adressePrefixe(o, prefixe) {
    var rue = nonVide(o[prefixe + '_street']);
    var apt = nonVide(o[prefixe + '_apt']);
    var villeEtat = [nonVide(o[prefixe + '_city']), nonVide(o[prefixe + '_state'])]
      .filter(Boolean).join(', ');
    var bas = [villeEtat, nonVide(o[prefixe + '_zip'])].filter(Boolean).join(' ');
    var haut = rue + (apt ? ', Apt ' + apt : '');
    return [haut, bas].filter(Boolean).join('  —  ');
  }

  /* « Signed this __ day of ________ 20__ » : le formulaire HIPAA date en
     toutes lettres. On decompose la date de signature plutot que de demander
     au patient de la retaper. */
  var MOIS = ['January', 'February', 'March', 'April', 'May', 'June',
              'July', 'August', 'September', 'October', 'November', 'December'];

  function dateEnMots(mmddyyyy) {
    var m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(nonVide(mmddyyyy));
    if (!m) return { jour: '', mois: '', annee: '' };
    return {
      jour: String(parseInt(m[2], 10)),
      mois: MOIS[parseInt(m[1], 10) - 1] || '',
      annee: m[3].slice(2)
    };
  }

  /* Un groupe de cases dont une seule est cochee : le document papier montre
     toutes les options, et l'absence de coche est une information. */
  function grilleChoix(options, valeur) {
    var v = nonVide(valeur).toLowerCase();
    return options.map(function (o) {
      return { texte: o, coche: o.toLowerCase() === v };
    });
  }

  /* La signature du patient, la meme partout : un seul trace appose sur les
     sept documents qui en reclament un. Le tuteur ne s'ajoute que s'il a
     effectivement signe. */
  function blocSignature(p, d, libelle, sousTitre) {
    p.signature({
      image: d.signature_image,
      date: d.signature_date,
      libelle: libelle || 'CLIENT SIGNATURE',
      nomImprime: nonVide(d.printed_name) || nomComplet(d),
      sousTitre: sousTitre || nonVide(d.signer_relationship) || 'Client',
      libelleDate: 'DATE SIGNED (MM/DD/YYYY)'
    });
    if (nonVide(d.guardian_signature_image)) {
      p.signature({
        image: d.guardian_signature_image,
        date: d.signature_date,
        libelle: 'PARENT / LEGAL GUARDIAN SIGNATURE',
        nomImprime: nonVide(d.guardian_printed_name),
        sousTitre: nonVide(d.guardian_relationship) || 'Parent or legal guardian',
        libelleDate: 'DATE SIGNED (MM/DD/YYYY)'
      });
    }
  }

  var MENTION_MINEUR = 'Client is a minor 13 years and older and is self-referred; '
    + 'client may sign without guardian.';

  /* ════════════════════════════════════════════════════════════════════════
     1 et 2. CONSENT FOR TREATMENT — PRP et OMHC
     Les deux consentements ont le meme corps, mot pour mot. Ils different par
     le programme, par la ligne d'assurance supplementaire du PRP, et par le
     second signataire : le specialiste PRP d'un cote, un temoin de l'autre.
     ════════════════════════════════════════════════════════════════════════ */

  var CONSENTEMENT_PUCES = [
    'The nature and purpose of the mental health services to be provided.',
    'The potential risks, benefits, and alternatives to the proposed treatment.',
    'My right to ask questions, seek clarification, and make informed decisions about my care.',
    'The confidentiality of my health information and the circumstances under which it may be disclosed.',
    'The right to withdraw consent for treatment at any time, subject to applicable legal and ethical considerations.'
  ];

  var CONSENTEMENT_CORPS = [
    'I understand that participation in treatment is voluntary, and I have the right to refuse or discontinue services at any time. I understand that my refusal to participate in treatment may impact the effectiveness of the services provided.',
    'I authorize Ability & Empowerment and its authorized personnel to provide mental health treatment services to me in accordance with the agreed-upon treatment plan. I consent to the use of appropriate therapeutic interventions, including individual therapy, group therapy, medication management, and other evidence-based practices deemed necessary by my treatment team.',
    'I acknowledge that I have received a copy of the Notice of Privacy Practices, which describes how my health information may be used and disclosed. I understand my rights regarding the privacy of my health information and agree to the terms outlined in the Notice of Privacy Practices.',
    'I certify that I have read and understand the information provided in this consent form. I agree to participate in mental health treatment services at Ability & Empowerment voluntarily and authorize the provision of care as described herein.'
  ];

  function corpsConsentement(p, d, deuxAssurances) {
    var paires = [
      ['Name', nomComplet(d)],
      ['Date of Birth', d.date_of_birth],
      ['Telephone #', nonVide(d.home_phone) || nonVide(d.cell_phone)],
      ['Emergency Phone Number', d.emergency_phone],
      ['Consumer Address', adresseComplete(d)],
      ['Social Security Number', d.ssn]
    ];
    if (deuxAssurances) {
      paires.push(['Insurance (primary)', d.insurance_primary]);
      paires.push(['Insurance (secondary)', d.insurance_secondary]);
    } else {
      paires.push(['Insurance', d.insurance_primary]);
      paires.push(['Insurance Member ID', d.insurance_member_id]);
    }
    p.champs(paires);

    p.paragraphe('I, ' + (nomComplet(d) || '_______________________________')
      + ', hereby consent to participate in mental health treatment services provided by '
      + 'Ability & Empowerment Health Services. I understand that the purpose of these '
      + 'services is to address my mental health concerns, improve my well-being, and '
      + 'promote recovery.');
    p.paragraphe('I acknowledge that I have been informed of the following:',
      { gras: true, apres: 4 });
    p.puces(CONSENTEMENT_PUCES);
    for (var i = 0; i < CONSENTEMENT_CORPS.length; i++) p.paragraphe(CONSENTEMENT_CORPS[i]);
  }

  function contenuPrpConsent(p, d) {
    p.encadre('Psychiatric Rehabilitation Program (PRP). Consent to participate in mental '
      + 'health treatment services provided by Ability and Empowerment Services.');
    corpsConsentement(p, d, true);
    blocSignature(p, d, 'CLIENT SIGNATURE');
    p.signature({
      image: d.prp_signature_image,
      date: d.prp_signature_date,
      libelle: 'PRP SIGNATURE',
      nomImprime: nonVide(d.prp_name),
      sousTitre: 'Psychiatric Rehabilitation Program representative',
      libelleDate: 'DATE SIGNED (MM/DD/YYYY)'
    });
  }

  function contenuOmhcConsent(p, d) {
    p.encadre('Outpatient Mental Health Clinic (OMHC). Consent to participate in mental '
      + 'health treatment services provided by Ability and Empowerment Services.');
    corpsConsentement(p, d, false);
    blocSignature(p, d, 'CLIENT SIGNATURE');
    p.signature({
      image: d.witness_signature_image,
      date: nonVide(d.witness_signature_date) || d.signature_date,
      libelle: 'WITNESS SIGNATURE (IF APPLICABLE)',
      nomImprime: nonVide(d.witness_name),
      sousTitre: 'Witness',
      libelleDate: 'DATE SIGNED (MM/DD/YYYY)'
    });
  }

  /* ════════════════════════════════════════════════════════════════════════
     3. CLIENT INTAKE QUESTIONNAIRE
     Trois pages dans le dossier papier, et elles y sont dans le desordre :
     la feuille « 3 of 3 » est classee avant la « 2 of 3 ». Elles sont remises
     dans leur ordre ici.
     ════════════════════════════════════════════════════════════════════════ */

  var STATUTS_MARITAUX = ['Never Married', 'Domestic Partnership', 'Married',
                          'Separated', 'Divorced', 'Widowed'];

  var ECHELLE_SANTE = ['Poor', 'Unsatisfactory', 'Satisfactory', 'Good', 'Very good'];

  var FREQUENCE_DROGUE = ['Daily', 'Weekly', 'Monthly', 'Infrequently', 'Never'];

  var ANTECEDENTS_FAMILIAUX = [
    ['fam_alcohol', 'Alcohol / Substance Abuse'],
    ['fam_anxiety', 'Anxiety'],
    ['fam_depression', 'Depression'],
    ['fam_domestic_violence', 'Domestic Violence'],
    ['fam_eating_disorders', 'Eating Disorders'],
    ['fam_obesity', 'Obesity'],
    ['fam_ocd', 'Obsessive Compulsive Behavior'],
    ['fam_schizophrenia', 'Schizophrenia'],
    ['fam_suicide_attempts', 'Suicide Attempts']
  ];

  function contenuIntake(p, d, images) {
    p.encadre('Please note: information provided on this form is protected as confidential '
      + 'information.');

    p.section('A', 'Personal Information');
    p.champs([
      ['Name', nomComplet(d)],
      ['Date', d.today_date],
      ['Parent / Legal Guardian (if under 18)', d.guardian_name],
      ['Referred By (if any)', d.referred_by],
      ['Address', adresseComplete(d)],
      ['Date of Birth', d.date_of_birth],
      ['Age', d.age],
      ['Gender', d.gender]
    ]);
    p.champs([
      ['Home Phone', d.home_phone],
      ['May we leave a message?', ouiNon(d.home_phone_message)],
      ['Cell / Work / Other Phone', d.cell_phone],
      ['May we leave a message?', ouiNon(d.cell_phone_message)],
      ['Email', d.email],
      ['May we leave a message?', ouiNon(d.email_message)]
    ]);
    p.paragraphe('Please note: email correspondence is not considered to be a confidential '
      + 'medium of communication.', { italique: true, taille: 8 });

    p.titreSection('Marital Status', 'A1');
    p.grilleCases(grilleChoix(STATUTS_MARITAUX, d.marital_status), 3);

    p.section('B', 'History');
    p.questionCourte('Have you previously received any type of mental health services '
      + '(psychotherapy, psychiatric services, etc.)?', ouiNon(d.prior_mh_services));
    p.question('Previous therapist / practitioner', d.prior_practitioner);
    p.questionCourte('Are you currently taking any prescription medication?',
      ouiNon(d.current_meds));
    p.question('If yes, please list', d.current_meds_list);
    p.questionCourte('Have you ever been prescribed psychiatric medication?',
      ouiNon(d.psych_meds_ever));
    p.question('If yes, please list and provide dates', d.psych_meds_list);

    p.section('C', 'General and Mental Health Information');
    p.titreSection('Current physical health', 'C1');
    p.grilleCases(grilleChoix(ECHELLE_SANTE, d.physical_health_rating), 5);
    p.question('Specific health problems currently experienced', d.physical_health_problems);

    p.titreSection('Current sleeping habits', 'C2');
    p.grilleCases(grilleChoix(ECHELLE_SANTE, d.sleep_rating), 5);
    p.question('Specific sleep problems currently experienced', d.sleep_problems);

    p.titreSection('Exercise', 'C3');
    p.champs([
      ['How many times per week do you generally exercise?', d.exercise_frequency],
      ['What types of exercise do you participate in?', d.exercise_types]
    ]);

    p.titreSection('Appetite and eating', 'C4');
    p.question('Please list any difficulties you experience with your appetite or eating problems',
      d.appetite_problems);

    p.titreSection('Mood, anxiety and pain', 'C5');
    p.questionCourte('Are you currently experiencing overwhelming sadness, grief or depression?',
      ouiNon(d.depression));
    p.question('If yes, for approximately how long?', d.depression_duration, { apres: 4 });
    p.questionCourte('Are you currently experiencing anxiety, panic attacks or have any phobias?',
      ouiNon(d.anxiety));
    p.question('If yes, when did you begin experiencing this?', d.anxiety_onset, { apres: 4 });
    p.questionCourte('Are you currently experiencing any chronic pain?', ouiNon(d.chronic_pain));
    p.question('If yes, please describe', d.chronic_pain_describe);

    p.titreSection('Alcohol and substance use', 'C6');
    p.questionCourte('Do you drink alcohol more than once a week?', ouiNon(d.alcohol_weekly));
    p.paragraphe('How often do you engage in recreational drug use?',
      { gras: true, taille: 8.4, apres: 4 });
    p.grilleCases(grilleChoix(FREQUENCE_DROGUE, d.drug_use_frequency), 5);

    p.titreSection('Relationships and recent events', 'C7');
    p.questionCourte('Are you currently in a romantic relationship?', ouiNon(d.relationship));
    p.champs([
      ['If yes, for how long?', d.relationship_duration],
      ['Relationship rating (1 poor to 10 exceptional)', d.relationship_rating]
    ]);
    p.question('What significant life changes or stressful events have you experienced recently?',
      d.life_changes);

    p.section('D', 'Family Mental Health History',
      'Family history of any of the following, and the family member concerned.');
    var lignes = ANTECEDENTS_FAMILIAUX.map(function (a) {
      return [a[1], ouiNon(d[a[0]]) || 'No', nonVide(d[a[0] + '_who']) || '—'];
    });
    p.tableau(['Condition', 'Yes / No', 'Family member'], lignes, [4, 2, 4]);

    p.section('E', 'Additional Information');
    p.questionCourte('Are you currently employed?', ouiNon(d.employed));
    p.question('If yes, what is your current employment situation?', d.employment_situation,
      { apres: 4 });
    p.question('Do you enjoy your work? Is there anything stressful about your current work?',
      d.work_feelings);
    p.questionCourte('Do you consider yourself to be spiritual or religious?',
      ouiNon(d.spiritual));
    p.question('If yes, describe your faith or belief', d.faith_describe);
    p.question('What do you consider to be some of your strengths?', d.strengths);
    p.question('What do you consider to be some of your weaknesses?', d.weaknesses);
    p.question('What would you like to accomplish out of your time in therapy?',
      d.therapy_goals);

  }

  /* ════════════════════════════════════════════════════════════════════════
     Les pieces d'identite, dans leur propre document
     ────────────────────────────────────────────────────────────────────────
     Elles etaient d'abord dans le questionnaire clinique. C'etait une erreur :
     ce questionnaire part parfois seul chez un confrere, et il aurait emporte
     avec lui le permis de conduire et la carte d'assurance du patient. Elles
     sont donc un document a part, qu'on transmet quand on veut le transmettre.
     ════════════════════════════════════════════════════════════════════════ */
  function contenuIdentite(p, d, images) {
    p.encadre('These are the copies the clinic holds of the client’s identification and '
      + 'insurance coverage. They are kept separately from the clinical record.');
    p.champs([
      ['Client Name', nomComplet(d)],
      ['Date of Birth', d.date_of_birth],
      ['Insurance (primary)', d.insurance_primary],
      ['Insurance Member ID', d.insurance_member_id]
    ]);
    if (!images) { p.paragraphe('No documents were provided.', { italique: true }); return; }
    /* 240 points : la hauteur maximale d'une piece (210) plus sa legende.
       En dessous, un titre pouvait encore se retrouver seul en bas de page,
       sa carte renvoyee a la suivante. */
    p.titreSection('Client photograph', 'A1', 240);
    p.piece(images.face, 'Client photograph');
    p.titreSection('Government-issued identification', 'A2', 240);
    p.piece(images.id_front, 'Photo ID — front');
    p.piece(images.id_back, 'Photo ID — back');
    p.titreSection('Insurance card', 'A3', 240);
    p.piece(images.ins_front, 'Insurance card — front');
    p.piece(images.ins_back, 'Insurance card — back');
  }

  /* ════════════════════════════════════════════════════════════════════════
     4. EMERGENCY CONTACT AND PRIMARY CARE PHYSICIAN INFORMATION
     ════════════════════════════════════════════════════════════════════════ */

  var RELATIONS_CONTACT = ['Legal Guardian', 'Foster Parent', 'Social Worker', 'Other'];

  function blocContactUrgence(p, d, prefixe, titre, numero) {
    p.titreSection(titre, numero);
    p.champs([
      ['Name(s)', d[prefixe + '_name']],
      ['Relationship to Client', nonVide(d[prefixe + '_relationship_other'])
        || nonVide(d[prefixe + '_relationship'])],
      ['Address', adressePrefixe(d, prefixe)],
      ['Email', d[prefixe + '_email']],
      ['Phone number — A.M.', d[prefixe + '_phone_am']],
      ['Phone number — P.M.', d[prefixe + '_phone_pm']]
    ]);
    p.grilleCases(grilleChoix(RELATIONS_CONTACT, d[prefixe + '_relationship']), 4);
  }

  function contenuUrgencePcp(p, d) {
    p.paragraphe('I, ' + (nomComplet(d) || '_______________________________')
      + ', give my consent to contact the individuals included on this form (emergency '
      + 'contacts) in case of emergencies.');
    p.paragraphe(MENTION_MINEUR, { italique: true, taille: 8 });

    p.section('A', 'Emergency Contacts');
    blocContactUrgence(p, d, 'ec1', 'First emergency contact', 'A1');
    /* Le formulaire ne demande plus qu'un contact, comme le papier qui ecrit
       « Name(s) » au pluriel dans un bloc unique. Le second bloc ne sort donc
       que si des donnees existent, par exemple un dossier repris d'une
       version anterieure. */
    if (String(d.ec2_name || '').trim()) {
      blocContactUrgence(p, d, 'ec2', 'Second emergency contact', 'A2');
    }
    p.caseACocher(estOui(d.ec_authorize_medical),
      'I authorize to give medical information to these contacts in case of emergency.');
    p.caseACocher(estOui(d.ec_no_second),
      "I don't have a second emergency contact (only for children).");

    p.section('B', 'Primary Care Physician Contact Form');
    p.champs([
      ['Physician Name', d.pcp_name],
      ['Phone Number', d.pcp_phone],
      ['Address — Street', d.pcp_address]
    ]);
    p.question('Allergies', d.allergies);
    p.question('Known Medical Conditions', d.medical_conditions);
    p.caseACocher(estOui(d.pcp_none),
      'I do not have a Primary Care Physician at present. I will find one and arrange to '
      + 'have a physical.');
    p.caseACocher(estOui(d.pcp_cannot_afford),
      'I am unable to afford physician health care and will not be able to arrange for a '
      + 'physical at this time.');

    p.paragraphe('I agree that the information above has not changed since the last date signed.',
      { gras: true });
    blocSignature(p, d, 'CLIENT / LEGAL GUARDIAN SIGNATURE');
  }

  /* ════════════════════════════════════════════════════════════════════════
     5. HIPAA PATIENT / CLIENT CONSENT FORM
     ════════════════════════════════════════════════════════════════════════ */

  var HIPAA_INTRO = [
    'The federal government requires all medical offices to make patients aware that they have rights regarding the use of their personal health information. Our notice of privacy practices is available for your review at our front office.',
    'By signing this form, you consent to our use and disclosure of protected health information according to the Notice of Privacy Practices available to you at the front desk.',
    'I understand that I have certain rights to privacy regarding my protected health information. These rights are given to me under the Health Insurance Portability and Accountability Act of 1996 (HIPAA). I understand that by signing this consent I authorize you to use and disclose my protected health information to carry out:'
  ];

  var HIPAA_PUCES = [
    'Treatment (including direct or indirect treatment by other healthcare providers involved in my treatment).',
    'The day-to-day healthcare operations of your practice.',
    'I have also been informed of and given the rights to review and secure a copy of your Notice of Privacy Practices which contains a more complete description of the use and disclosures of my protected health information, and my rights under HIPAA. I understand that you reserve the right to change the terms of this notice from time to time and that I may contact you at any time to obtain the most current copy of this notice.',
    'I understand that I have the right to request restrictions on how my protected health information is used and disclosed to carry out treatment, payment, and health care operations, but that you are not required to agree to these request restrictions.',
    'However, if you do agree, you are bound to comply with this restriction. I understand that I may revoke this consent at any time, in writing, signed by me.'
  ];

  var HIPAA_CLIENT = [
    'We will not release information to any future doctor, attorney, life insurance company, or workman’s company without your written consent.',
    'Protected health information may be used for treatment through one of your current doctors (such as your primary care physician or a specialist referral), payment with your insurance company, or healthcare operations within our office.',
    'Ability and Empowerment Services reserves the right to change the notice of privacy practices.',
    'The patient has the right to restrict the use of their information, but Ability and Empowerment Services does not have to agree to these restrictions if, for example, it interferes with payment, daily operations, or providing quality health care.',
    'The patient may revoke this consent in writing at any time and all future disclosures will then cease.'
  ];

  function contenuHipaa(p, d) {
    for (var i = 0; i < HIPAA_INTRO.length; i++) p.paragraphe(HIPAA_INTRO[i]);
    p.puces(HIPAA_PUCES);
    p.paragraphe('The Client understands that:', { gras: true, apres: 4 });
    p.puces(HIPAA_CLIENT);
    p.paragraphe('Ability and Empowerment Services may condition treatment upon the execution '
      + 'of this consent (for example, you may be required to pay for your visit at the time '
      + 'of service for all Medicaid clients).');

    var dt = dateEnMots(d.signature_date);
    p.champs([
      ['Signed this (day)', dt.jour],
      ['Month', dt.mois],
      ['Year (20__)', dt.annee],
      ['Relationship to Patient', nonVide(d.hipaa_relationship)
        || nonVide(d.signer_relationship) || 'Self']
    ]);
    blocSignature(p, d, 'SIGNATURE');
  }

  /* ════════════════════════════════════════════════════════════════════════
     6. INFORMED CONSENT FOR TELEHEALTH (AUDIO AND VIDEO) AND TELEPHONIC
     ════════════════════════════════════════════════════════════════════════ */

  var TELEHEALTH_DEF = [
    'Telehealth (audio and video) and telephonic involves the use of electronic communications to enable Ability and Empowerment Services, LLC mental health professionals to connect with individuals using interactive video and audio communications.',
    'Telehealth (audio and video) and telephonic includes the practice of behavioral healthcare delivery, diagnosis, consultation, treatment, referral to resources, education, and the transfer of medical and clinical data.'
  ];

  var TELEHEALTH_DROITS = [
    'The laws that protect the confidentiality of my personal information also apply to Telehealth (audio and video) and Telephonic. As such, I understand that the information disclosed by me during the course of my sessions is generally confidential. However, there are both mandatory and permissive exceptions to confidentiality, including, but not limited to, reporting child, elder, and dependent adult abuse; expressed threats of violence toward an ascertainable victim; and where I make my mental or emotional state an issue in a legal proceeding. I also understand that the dissemination of any personally identifiable images or information from the Telehealth (audio and video) and telephonic interaction to other entities shall not occur without my written consent.',
    'I understand that I have the right to withhold or withdraw my consent to the use of Telehealth (audio and video) and telephonic in the course of my care at any time, without affecting my right to future care or Treatment.',
    'I understand that there are risks and consequences from Telehealth (audio and video) and Telephonic, including, but not limited to, the possibility, despite reasonable efforts on the part of the counselor, that: the transmission of my personal information could be disrupted or distorted by technical failures, the transmission of my personal information could be interrupted by unauthorized persons, and/or the electronic storage of my personal information could be unintentionally lost or accessed by unauthorized persons. Ability and Empowerment Services utilize secure, encrypted audio/video transmission software to deliver Telehealth (audio and video) and Telephonic.',
    'I understand that if my counselor believes I would be better served by another form of intervention (e.g., face-to-face services), I will be referred to a mental health professional associated with any form of psychotherapy, and that despite my efforts and the efforts of my counselor, my condition may not improve, and in some cases may even get worse.',
    'I understand the alternatives to counseling through Telehealth (audio and video) and Telephonic as they have been explained to me, and in choosing to participate in Telehealth (audio and video) and Telephonic, I am agreeing to participate using video conferencing technology. I also understand that at my request or at the direction of my counselor, I may be directed to face-to-face psychotherapy.',
    'I understand that I may expect the anticipated benefits such as improved access to care and more efficient evaluation and management from the use of Telehealth (audio and video) and Telephonic in my care, but that no results can be guaranteed or assured.',
    'I understand that my healthcare information may be shared with other individuals for scheduling and billing purposes. Others may also be present during the consultation other than my counselor in order to operate the video equipment. The above-mentioned people will all maintain confidentiality of the information obtained. I further understand that I will be informed of their presence in the consultation and thus will have the right to request the following: (a) omit specific details of my medical history that are personally sensitive to me, (b) ask non-clinical personnel to leave the Telehealth (audio and video) and telephonic room, and/or (c) terminate the consultation at any time.',
    'I understand that my express consent is required to forward my personally identifiable information to a third party.',
    'I understand that I have a right to access my medical information and copies of my medical records in accordance with the laws pertaining to the state in which I reside.',
    'By signing this document, I agree that certain situations, including emergencies and crises, are inappropriate for audio-/video-/computer-based psychotherapy services. If I am in crisis or in an emergency, I should immediately call 9-1-1 or seek help from a hospital or crisis-oriented health care facility in my immediate area.',
    'I understand that different states have different regulations for the use of Telehealth (audio and video) and telephonic. In Maryland, Telehealth (audio and video) and Telephonic may only be conducted between certified office locations. I understand that, in Maryland, I am not able to connect from an alternative location for the provision of audio-/video-/computer-based psychotherapy and/or counseling services.'
  ];

  function contenuTelehealth(p, d) {
    p.titreSection('Definition of Telehealth (audio and video) and Telephonic');
    for (var i = 0; i < TELEHEALTH_DEF.length; i++) p.paragraphe(TELEHEALTH_DEF[i]);

    p.titreSection('My rights with respect to Telehealth and Telephonic');
    p.liste(TELEHEALTH_DROITS);

    p.titreSection('Payment for Telehealth and Telephonic Services');
    p.paragraphe('Ability and Empowerment Services will bill insurance for Telehealth (audio '
      + 'and video) and Telephonic services when these services have been determined to be '
      + 'covered by an individual’s insurance plan. In the event that insurance does not '
      + 'cover Telehealth (audio and video) and Telephonic, the individual wishes to pay '
      + 'out-of-pocket, or when there is no insurance coverage, a prompt pay discount is '
      + 'available. We will provide you with a statement of service to submit to your '
      + 'insurance company if you wish.');

    p.titreSection('Person Served Consent to the Use of Telehealth and Telephonic');
    p.paragraphe('I have read and understand the information provided above regarding '
      + 'Telehealth (audio and video) and Telephonic, have discussed it with my counselor, '
      + 'and all of my questions have been answered to my satisfaction.');
    p.paragraphe('I have read this document carefully and understand the risks and benefits '
      + 'related to the use of Telehealth (audio and video) and Telephonic services and have '
      + 'had my questions regarding the procedure explained. I hereby give my informed '
      + 'consent to participate in the use of Telehealth (audio and video) and Telephonic '
      + 'services for treatment under the terms described herein.');
    p.paragraphe('By my signature below, I hereby state that I have read, understood, and '
      + 'agree to the terms of this document.', { gras: true });
    blocSignature(p, d, 'PERSON’S SIGNATURE');
  }

  /* ════════════════════════════════════════════════════════════════════════
     7. AUTHORIZATION TO EXCHANGE INFORMATION
     ════════════════════════════════════════════════════════════════════════ */

  var ECHANGE_ELEMENTS = [
    ['exch_notification', 'Notification of beginning and/or ending of treatment'],
    ['exch_periodic_summary', 'Periodic summary of treatment progress'],
    ['exch_past_treatment', 'Past Treatment'],
    ['exch_intake_summary', 'Intake assessment summary'],
    ['exch_psych_eval', 'Psychological evaluation'],
    ['exch_financial', 'Financial Information'],
    ['exch_discharge_summary', 'Discharge summary'],
    ['exch_current_diagnosis', 'Current psychiatric diagnosis'],
    ['exch_medications', 'List of current psychotropic medication and dosages'],
    ['exch_verbal', 'Verbal exchange information'],
    ['exch_coordination', 'Coordination of services agreement/treatment planning']
  ];

  var RELATIONS_ECHANGE = ['Self', 'Legal guardian', 'Foster parent', 'Social worker', 'Other'];

  function contenuEchange(p, d) {
    p.champs([
      ['Person Name', nomComplet(d)],
      ['Date of Birth', d.date_of_birth],
      ['Address', adresseComplete(d)]
    ]);

    p.titreSection('Exchange of Information with', 'A1');
    p.champs([
      ['Name / Agency', d.exchange_agency_name],
      ['Phone', d.exchange_agency_phone],
      ['Address', d.exchange_agency_address],
      ['Fax', d.exchange_agency_fax]
    ]);

    p.paragraphe('I, ' + (nomComplet(d) || '_______________________________')
      + ', freely give consent to A&E and the informant to exchange the below noted '
      + 'information for the purpose of payment, facilitating treatment, and continuity of '
      + 'care for me or for my child.');

    p.titreSection('Information to be exchanged', 'A2');
    var items = ECHANGE_ELEMENTS.map(function (e) {
      return { texte: e[1], coche: estOui(d[e[0]]) };
    });
    items.push({
      texte: 'Other: ' + (nonVide(d.exch_other_text) || '—'),
      coche: estOui(d.exch_other) || !!nonVide(d.exch_other_text)
    });
    p.grilleCases(items, 2);

    p.champs([
      ['If information is required for a specific period, from', d.exchange_from],
      ['To', d.exchange_to]
    ]);

    p.paragraphe('I understand that my therapist may be supervised, and that the supervisor '
      + 'will have access to confidential information. I agree that the therapist’s '
      + 'supervisor may substitute for the therapist in exchange in information.');
    p.caseACocher(estOui(d.exchange_supervisor_consent),
      'Yes, the supervisor may substitute for the therapist.');
    p.caseACocher(estOui(d.exchange_declined),
      'No, I do not wish for A&E to exchange information with anyone at this time.');

    p.paragraphe('This consent to release information is given freely, voluntarily, and '
      + 'without coercion, and may be withdrawn by me at any time. Any information I '
      + 'authorize other professionals to release to A&E will be held strictly confidential '
      + 'and will not be released without my written permission except as permitted by State '
      + 'or Federal law. I understand that I have the right to inspect the record or mental '
      + 'health information about the above-named individual. The information to be disclosed '
      + 'may include information about medical conditions, including HIV/AIDS and substance '
      + 'abuse, which is pertinent and relevant to the facilitation of treatment.');
    p.paragraphe('This authorization is effective for one year from the date below.',
      { gras: true });
    p.paragraphe(MENTION_MINEUR, { italique: true, taille: 8 });

    p.titreSection('Relationship to Person', 'A3');
    p.grilleCases(grilleChoix(RELATIONS_ECHANGE,
      nonVide(d.exchange_relationship) || nonVide(d.signer_relationship) || 'Self'), 5);
    if (nonVide(d.exchange_relationship_other)) {
      p.champs([['Other — please specify', d.exchange_relationship_other]], 1);
    }

    p.paragraphe('I agree that the information above has not changed since the last date it '
      + 'was signed.', { gras: true });
    blocSignature(p, d, 'PERSON / LEGAL GUARDIAN SIGNATURE');
    p.signature({
      image: d.witness_signature_image,
      date: nonVide(d.witness_signature_date) || d.signature_date,
      libelle: 'SIGNATURE OF WITNESS',
      nomImprime: nonVide(d.witness_name),
      sousTitre: 'Witness',
      libelleDate: 'DATE SIGNED (MM/DD/YYYY)'
    });
  }

  /* ════════════════════════════════════════════════════════════════════════
     8. ACKNOWLEDGEMENT OF RECEIPT — PERSONS SERVED HANDBOOK
     ════════════════════════════════════════════════════════════════════════ */

  function contenuManuel(p, d) {
    p.paragraphe('I acknowledge that I have received a copy of the Ability and Empowerment '
      + 'Services Persons Served Handbook (Orientation Handbook), and that its contents have '
      + 'been explained to me.');
    blocSignature(p, d, 'PERSON SERVED — SIGNATURE', 'Person served');
    p.signature({
      image: d.staff_signature_image,
      date: nonVide(d.staff_date_signed) || d.signature_date,
      libelle: 'PROGRAM REPRESENTATIVE — SIGNATURE',
      nomImprime: nonVide(d.staff_print_name),
      sousTitre: nonVide(d.staff_title) || 'Program representative',
      libelleDate: 'DATE SIGNED (MM/DD/YYYY)'
    });
  }

  /* ════════════════════════════════════════════════════════════════════════
     9. COMMUNITY SUPPORTS AND FAMILY OF ORIGIN
     Le contact d'urgence et le medecin traitant sont redemandes ici dans le
     dossier papier. Ils sont repris de la saisie unique, pas retapes.
     ════════════════════════════════════════════════════════════════════════ */

  function contenuSupports(p, d) {
    p.section('1', 'Emergency Contact');
    p.champs([
      ['Name of Contact', d.ec1_name],
      ['Relationship to Person', nonVide(d.ec1_relationship_other) || nonVide(d.ec1_relationship)],
      ['Address', adressePrefixe(d, 'ec1')],
      ['Contact number', nonVide(d.ec1_phone_am) || nonVide(d.ec1_phone_pm)]
    ]);

    p.section('2', 'Community Supports');
    p.champs([
      ['Family / Significant Other', d.support_name],
      ['Relationship to Person', d.support_relationship],
      ['Phone #', d.support_phone],
      ['Address', d.support_address],
      ['Primary Care Physician', d.pcp_name],
      ['Phone #', d.pcp_phone],
      ['Address', d.pcp_address]
    ]);

    p.section('3', 'Family of Origin History');
    p.champs([
      ['Mother’s Name', d.mother_name],
      ['Age', d.mother_age],
      ['Is Mother Alive?', ouiNon(d.mother_alive)],
      ['Nature of Relationship', d.mother_relationship],
      ['Father’s Name', d.father_name],
      ['Age', d.father_age],
      ['Is Father Alive?', ouiNon(d.father_alive)],
      ['Nature of Relationship', d.father_relationship]
    ]);
    p.question('Siblings — name and age', d.siblings);
    p.question('Other source of income if unemployed', d.other_income);
  }

  /* ════════════════════════════════════════════════════════════════════════
     10. PRP INITIAL FACE-TO-FACE SCREENING
     Rempli par le specialiste en readaptation, pas par le patient. Il n'est
     produit que s'il a effectivement ete rempli : un formulaire de decision
     vide dans un dossier medical vaut moins que rien.
     ════════════════════════════════════════════════════════════════════════ */

  var RETARDS_SCREENING = [
    ['screen_delay_approval', 'Delay in receiving approval'],
    ['screen_delay_gender', 'Lack of availability in consumer gender request'],
    ['screen_delay_schedule', 'Conflict in schedules']
  ];

  function screeningRempli(d) {
    return !!(nonVide(d.staff_print_name) || nonVide(d.screen_q1) || nonVide(d.screen_q2)
      || nonVide(d.staff_signature_image));
  }

  function contenuScreening(p, d) {
    p.encadre('The purpose of this form is to document the determination of the applicant’s '
      + 'acceptance or non-acceptance for enrollment in Ability and Empowerment Services '
      + 'Psychiatric Rehabilitation Program and has a task-completion checklist to document '
      + 'the completion of all required tasks relative to the screening assessment and '
      + 'subsequent required notifications. The rehabilitation specialist or designee shall '
      + 'maintain the checklist in the applicant’s medical record, if the applicant is '
      + 'accepted and subsequently enrolled, or if the applicant is subsequently not enrolled '
      + 'in the program.');
    p.paragraphe('Must be completed within five working days of referral.',
      { italique: true, taille: 8 });

    p.champs([
      ['Applicant Name', nomComplet(d)],
      ['Date', nonVide(d.screening_date) || d.today_date]
    ]);
    p.grilleCases(grilleChoix(['Adult', 'Minor'], d.screening_applicant_type), 2);

    p.titreSection('Parties present during the screening assessment', 'A1');
    var parties = Array.isArray(d.screening_parties) ? d.screening_parties : [];
    var lignes = parties
      .filter(function (x) { return x && (nonVide(x.name) || nonVide(x.relationship)); })
      .map(function (x) { return [nonVide(x.name), nonVide(x.relationship)]; });
    if (!lignes.length) lignes = [['—', '—']];
    p.tableau(['Participant', 'Relationship'], lignes, [1, 1]);

    p.section('B', 'Assessing Rehabilitation Service Needs and Willingness to Participate');
    p.questionCourte('1. Has the applicant’s rehabilitation service needs been determined '
      + 'based on the information contained in the program referral form, documentation of '
      + 'medical necessity and a mental health treatment plan?', ouiNon(d.screen_q1));
    p.question('If no, explain', d.screen_q1_explain, { apres: 4 });

    p.questionCourte('2. Is the client willing and able to participate in the PRP services?',
      ouiNon(d.screen_q2));
    p.question('If no, explain', d.screen_q2_explain, { apres: 4 });

    p.questionCourte('3. Is the program able to address the client’s needs as identified?',
      ouiNon(d.screen_q3));
    p.question('If no, explain and identify the date the applicant was notified in writing',
      d.screen_q3_explain, { apres: 4 });
    p.champs([['Date applicant notified in writing', d.screen_q3_notified_date]], 1);
    p.questionCourte('The applicant and family, as appropriate, was provided with the reasons '
      + 'for the determination?', ouiNon(d.screen_q3_reasons_provided));
    p.questionCourte('The applicant and family, as appropriate, was provided with '
      + 'recommendations for alternative services?', ouiNon(d.screen_q3_alternatives_provided));

    p.questionCourte('4. If accepted, was the applicant’s level of acceptance identified '
      + 'in writing?', ouiNon(d.screen_q4));
    p.question('If no, explain', d.screen_q4_explain, { apres: 4 });
    p.question('5. When is enrollment anticipated?', d.screen_q5_enrollment);

    p.titreSection('6. Screening timeliness', 'B1');
    p.caseACocher(estOui(d.screen_ontime), 'Screening is on time (as initially scheduled)');
    p.caseACocher(!estOui(d.screen_ontime), 'Screening is delayed due to:');
    var retards = RETARDS_SCREENING.map(function (r) {
      return { texte: r[1], coche: estOui(d[r[0]]) };
    });
    retards.push({
      texte: 'Other: ' + (nonVide(d.screen_delay_other_text) || '—'),
      coche: estOui(d.screen_delay_other) || !!nonVide(d.screen_delay_other_text)
    });
    p.grilleCases(retards, 2);

    p.titreSection('Staff name and title completing this screening', 'B2');
    p.champs([
      ['Print Name', d.staff_print_name],
      ['Title', d.staff_title]
    ]);
    p.signature({
      image: d.staff_signature_image,
      date: nonVide(d.staff_date_signed) || d.today_date,
      libelle: 'SIGN NAME',
      nomImprime: nonVide(d.staff_print_name),
      sousTitre: nonVide(d.staff_title) || 'Rehabilitation specialist',
      libelleDate: 'DATE SIGNED (MM/DD/YYYY)'
    });
  }

  /* ════════════════════════════════════════════════════════════════════════
     Assemblage
     Chaque document est decrit une seule fois. Le meme descripteur sert a le
     produire seul, dans son fichier, et enchaine dans le dossier relie.
     ════════════════════════════════════════════════════════════════════════ */

  var DOCUMENTS = [
    { cle: 'prp_consent', fichier: 'PRP Consent for Treatment',
      titre: 'PRP CONSENT FOR TREATMENT',
      sousTitre: 'Psychiatric Rehabilitation Program',
      contenu: contenuPrpConsent },
    { cle: 'omhc_consent', fichier: 'OMHC Consent for Treatment',
      titre: 'OMHC CONSENT FOR TREATMENT',
      sousTitre: 'Outpatient Mental Health Clinic',
      contenu: contenuOmhcConsent },
    { cle: 'intake', fichier: 'Client Intake Questionnaire',
      titre: 'CLIENT INTAKE QUESTIONNAIRE',
      sousTitre: 'Confidential client information',
      contenu: contenuIntake },
    { cle: 'emergency_pcp', fichier: 'Emergency Contact and Primary Care Physician',
      titre: 'EMERGENCY CONTACT AND PRIMARY CARE PHYSICIAN',
      sousTitre: 'Consent to contact and physician information',
      contenu: contenuUrgencePcp },
    { cle: 'hipaa', fichier: 'HIPAA Consent',
      titre: 'HIPAA PATIENT / CLIENT CONSENT FORM',
      sousTitre: 'Health Insurance Portability and Accountability Act of 1996',
      contenu: contenuHipaa },
    { cle: 'telehealth', fichier: 'Informed Consent for Telehealth',
      titre: 'INFORMED CONSENT FOR TELEHEALTH',
      sousTitre: 'Audio and video, and telephonic services',
      contenu: contenuTelehealth },
    { cle: 'exchange', fichier: 'Authorization to Exchange Information',
      titre: 'AUTHORIZATION TO EXCHANGE INFORMATION',
      sousTitre: 'Valid for one year from the date signed',
      contenu: contenuEchange },
    { cle: 'handbook', fichier: 'Acknowledgement of Handbook Receipt',
      titre: 'ACKNOWLEDGEMENT OF RECEIPT',
      sousTitre: 'Persons Served Handbook — Orientation Handbook',
      contenu: contenuManuel },
    { cle: 'supports', fichier: 'Community Supports and Family of Origin',
      titre: 'COMMUNITY SUPPORTS AND FAMILY OF ORIGIN',
      sousTitre: 'Emergency contact, supports and family history',
      contenu: contenuSupports },
    { cle: 'identity', fichier: 'Identification and Insurance',
      titre: 'IDENTIFICATION AND INSURANCE',
      sousTitre: 'Copies held by the clinic',
      contenu: contenuIdentite },
    { cle: 'screening', fichier: 'PRP Initial Face-to-Face Screening',
      titre: 'PRP INITIAL FACE-TO-FACE SCREENING',
      sousTitre: 'To be completed by the rehabilitation specialist',
      contenu: contenuScreening, siRempli: screeningRempli }
  ];

  function nomFichier(nom, suffixe) {
    var base = nonVide(nom).replace(/[^A-Za-z0-9 _-]/g, '').trim().replace(/\s+/g, '_');
    if (!base) base = 'Client';
    var d = new Date();
    var horo = d.getFullYear() + String(d.getMonth() + 1).padStart(2, '0')
      + String(d.getDate()).padStart(2, '0') + '_'
      + String(d.getHours()).padStart(2, '0') + String(d.getMinutes()).padStart(2, '0');
    return base + '_' + suffixe.replace(/\s+/g, '_') + '_' + horo + '.pdf';
  }

  function documentSeul(desc, d, images) {
    var p = nouvellePage(desc.titre, desc.sousTitre, THEME_ABILITY);
    desc.contenu(p, d, images);
    p.pied();
    return p.doc;
  }

  /* Le dossier relie : les memes fonctions de contenu, enchainees, chacune
     ouvrant sa page et son bandeau. Le cabinet classe une seule piece. */
  function documentDossier(actifs, d, images) {
    var p = nouvellePage(actifs[0].titre, actifs[0].sousTitre, THEME_ABILITY);
    actifs[0].contenu(p, d, images);
    for (var i = 1; i < actifs.length; i++) {
      p.entete(actifs[i].titre, actifs[i].sousTitre);
      actifs[i].contenu(p, d, images);
    }
    p.pied();
    return p.doc;
  }

  /* ════════════════════════════════════════════════════════════════════════
     Les textes que le patient lit avant de signer.
     Ils sortent d'ici, pas d'une copie dans la page : ce qui est lu a l'ecran
     est litteralement ce qui est imprime dans le document. Une seule source,
     donc aucune derive possible entre les deux.
     ════════════════════════════════════════════════════════════════════════ */

  var DEUX_SAUTS = String.fromCharCode(10) + String.fromCharCode(10);

  window.TEXTES_LEGAUX_ABILITY = [
    {
      titre: 'PRP Consent for Treatment',
      sousTitre: 'Psychiatric Rehabilitation Program',
      intro: 'I hereby consent to participate in mental health treatment services provided '
        + 'by Ability & Empowerment Health Services. I understand that the purpose of these '
        + 'services is to address my mental health concerns, improve my well-being, and '
        + 'promote recovery. I acknowledge that I have been informed of the following:',
      puces: CONSENTEMENT_PUCES,
      corps: CONSENTEMENT_CORPS
    },
    {
      titre: 'OMHC Consent for Treatment',
      sousTitre: 'Outpatient Mental Health Clinic',
      intro: 'The same consent applies to services delivered through the Outpatient Mental '
        + 'Health Clinic. I acknowledge that I have been informed of the following:',
      puces: CONSENTEMENT_PUCES,
      corps: CONSENTEMENT_CORPS
    },
    {
      titre: 'HIPAA Patient / Client Consent Form',
      sousTitre: 'Health Insurance Portability and Accountability Act of 1996',
      intro: HIPAA_INTRO.join(DEUX_SAUTS),
      puces: HIPAA_PUCES,
      corps: ['The Client understands that:'].concat(HIPAA_CLIENT).concat([
        'Ability and Empowerment Services may condition treatment upon the execution of this '
        + 'consent (for example, you may be required to pay for your visit at the time of '
        + 'service for all Medicaid clients).'
      ])
    },
    {
      titre: 'Informed Consent for Telehealth and Telephonic Services',
      sousTitre: 'Audio and video, and telephonic',
      intro: TELEHEALTH_DEF.join(DEUX_SAUTS),
      puces: [],
      corps: TELEHEALTH_DROITS.map(function (t, i) { return (i + 1) + '. ' + t; }).concat([
        'Payment. Ability and Empowerment Services will bill insurance for Telehealth (audio '
        + 'and video) and Telephonic services when these services have been determined to be '
        + 'covered by an individual’s insurance plan. In the event that insurance does not '
        + 'cover Telehealth (audio and video) and Telephonic, the individual wishes to pay '
        + 'out-of-pocket, or when there is no insurance coverage, a prompt pay discount is '
        + 'available. We will provide you with a statement of service to submit to your '
        + 'insurance company if you wish.',
        'I have read and understand the information provided above regarding Telehealth '
        + '(audio and video) and Telephonic, have discussed it with my counselor, and all of '
        + 'my questions have been answered to my satisfaction. I hereby give my informed '
        + 'consent to participate in the use of Telehealth (audio and video) and Telephonic '
        + 'services for treatment under the terms described herein.'
      ])
    },
    {
      titre: 'Authorization to Exchange Information',
      sousTitre: 'Effective for one year from the date signed',
      intro: 'I freely give consent to Ability & Empowerment and the informant named in this '
        + 'form to exchange the information I have selected, for the purpose of payment, '
        + 'facilitating treatment, and continuity of care for me or for my child.',
      puces: [],
      corps: [
        'I understand that my therapist may be supervised, and that the supervisor will have '
        + 'access to confidential information. I agree that the therapist’s supervisor may '
        + 'substitute for the therapist in exchange in information.',
        'This consent to release information is given freely, voluntarily, and without '
        + 'coercion, and may be withdrawn by me at any time. Any information I authorize other '
        + 'professionals to release to A&E will be held strictly confidential and will not be '
        + 'released without my written permission except as permitted by State or Federal law. '
        + 'I understand that I have the right to inspect the record or mental health '
        + 'information about the above-named individual. The information to be disclosed may '
        + 'include information about medical conditions, including HIV/AIDS and substance '
        + 'abuse, which is pertinent and relevant to the facilitation of treatment.',
        'This authorization is effective for one year from the date signed below.'
      ]
    },
    {
      titre: 'Emergency Contacts and Primary Care Physician',
      sousTitre: 'Consent to contact',
      intro: 'I give my consent to contact the individuals included on this form (emergency '
        + 'contacts) in case of emergencies.',
      puces: [],
      corps: [
        'I agree that the information above has not changed since the last date signed.',
        MENTION_MINEUR
      ]
    },
    {
      titre: 'Acknowledgement of Receipt',
      sousTitre: 'Persons Served Handbook',
      intro: 'I acknowledge that I have received a copy of the Ability and Empowerment '
        + 'Services Persons Served Handbook (Orientation Handbook), and that its contents '
        + 'have been explained to me.',
      puces: [],
      corps: []
    }
  ];

  window.construireDocumentsAbility = async function (d) {
    /* Une photo de telephone pese plusieurs megaoctets. Elle est reduite une
       seule fois, puis servie aux deux exemplaires du questionnaire. */
    var images = {
      face: await preparerImage(d.image_face, 1400),
      id_front: await preparerImage(d.image_id_front, 1400),
      id_back: await preparerImage(d.image_id_back, 1400),
      ins_front: await preparerImage(d.image_insurance_front, 1400),
      ins_back: await preparerImage(d.image_insurance_back, 1400)
    };

    var actifs = DOCUMENTS.filter(function (desc) {
      return !desc.siRempli || desc.siRempli(d);
    });

    var nom = nomComplet(d);
    var sortie = { _docs: {} };

    var dossier = documentDossier(actifs, d, images);
    sortie.pdf_packet = dossier.output('datauristring').split(',')[1];
    sortie.pdf_packet_nom = nomFichier(nom, 'Admission Packet');
    sortie._docs.packet = dossier;

    for (var i = 0; i < actifs.length; i++) {
      var doc = documentSeul(actifs[i], d, images);
      sortie['pdf_' + actifs[i].cle] = doc.output('datauristring').split(',')[1];
      sortie['pdf_' + actifs[i].cle + '_nom'] = nomFichier(nom, actifs[i].fichier);
      sortie._docs[actifs[i].cle] = doc;
    }

    sortie.documents_produits = actifs.map(function (a) { return a.cle; }).join(',');
    return sortie;
  };

  /* Le banc d'essai Node rejoue ce fichier hors navigateur : il a besoin des
     descripteurs pour verifier les documents un par un. */
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { DOCUMENTS: DOCUMENTS, THEME_ABILITY: THEME_ABILITY };
  }
})();
