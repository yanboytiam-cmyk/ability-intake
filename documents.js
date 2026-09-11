/* ══════════════════════════════════════════════════════════════════════════
   Ability and Empowerment Services — fabrication du dossier d'admission
   ──────────────────────────────────────────────────────────────────────────
   Le dossier papier du cabinet, rempli et signe, en UN SEUL fichier, produit
   dans le navigateur au moment ou le patient valide le formulaire.

   Refait le 2026-09-11 sur le retour de Collins : « le rendu n'est pas
   conforme au document de depart », et « pour un seul client on a une
   dizaine de fichiers a l'arrivee au lieu d'un seul ». La version precedente
   recomposait chaque document dans une mise en page neuve, etiquettes
   au-dessus des valeurs, encadres, bandeaux de section : 22 pages au lieu de
   16, des signatures renvoyees seules en haut de la page suivante, et douze
   fichiers par patient.

   Trois regles, desormais :

     1. Chaque page du papier a sa page ici, avec les memes elements, dans le
        meme ordre, sous les memes libelles. Une signature reste sur la page
        du texte qu'elle signe.
     2. La mise en page est serree : les reponses s'ecrivent sur la ligne,
        comme au stylo sur le papier, et non sous leur etiquette.
     3. Un seul fichier, le dossier complet. Les photos vivent dans les
        documents, a cote du texte qu'elles prouvent : le visage du patient
        dans l'en-tete de chaque page, la piece d'identite sous « Personal
        Information », la carte d'assurance sous les lignes « Insurance » du
        consentement PRP (demande de Yanis, le 2026-09-11).

   Correspondance avec le PDF fourni par le cabinet :

     PRP Consent for Treatment ........................ page 1
     OMHC Consent for Treatment ....................... page 2
     Client Intake Questionnaire ...................... pages 3, 5, 4
       (le papier range « 3 of 3 » avant « 2 of 3 » ; remises dans l'ordre)
     PRP Initial Face-to-Face Screening ............... pages 6 et 9
       (seulement si le personnel l'a rempli ; ses deux moities, separees
        sur le papier par deux autres documents, tiennent sur une page)
     Emergency Contact and Primary Care Physician ..... page 7
     HIPAA Patient/Client Consent Form ................ page 8
     Informed Consent for Telehealth .................. pages 10, 11, 12
       (la page 12 ne portait que les signatures : elles closent la 11)
     Authorization to Exchange Information ............ pages 13, 14
       (la page 14 ne portait que trois lignes de signature : elles
        closent la 13)
     Acknowledge Receipt of Persons Served Handbook ... page 15
     Community Supports and Family of Origin .......... page 16

   Le texte juridique n'est jamais reformule : il est repris mot pour mot du
   dossier papier fourni par le cabinet. Ce que le patient a lu a l'ecran est
   exactement ce qui sort ici.
   ══════════════════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  /* Le bleu et le vert sont ceux du site du cabinet ; le marine et le rose
     sont ceux du bandeau de titre de son dossier papier, releves sur le PDF.

     Les reponses sont a l'encre bleue, le formulaire en noir. Sur le papier,
     c'est la difference entre l'imprime et le stylo, et c'est elle qui permet
     de relire un dossier en diagonale. */
  var MARINE = [31, 56, 100];     /* #1F3864 — le bandeau de titre du papier */
  var ROSE = [192, 57, 105];      /* l'etiquette PRP / OMHC du papier */
  var GRIS = [44, 48, 56];        /* les libelles, presque noirs comme au papier */
  var ENCRE = [20, 22, 26];       /* le texte imprime */
  var STYLO = [22, 46, 120];      /* les reponses du patient */
  var TRAIT = [120, 126, 136];    /* les lignes a remplir */
  var BARRE = [226, 230, 236];    /* les barres de section du questionnaire */
  var CADRE = [160, 166, 176];    /* bordures des tableaux et des cadres */
  var PALE = [140, 146, 156];     /* « Not provided », pied de page */
  var BLANC = [255, 255, 255];

  var CABINET = {
    nom: 'Ability and Empowerment Services, INC',
    adresse: '1 N Charles Street, Baltimore, MD, 21201',
    contact: '(443) 438-5538  ·  online@abilityempowermenths.com'
  };

  /* Format lettre, en points. BAS est la derniere ligne ou le contenu peut
     descendre : en dessous vit le pied de page. L'en-tete occupe le haut
     jusqu'a 70, photo du patient comprise ; le bandeau de titre se pose en
     Y_BANDEAU, et une page de suite commence en Y_SUITE. */
  var LARG = 612, HAUT = 792, L = 42;
  var R = LARG - L, UTILE = R - L;
  var BAS = HAUT - 40;
  var Y_BANDEAU = 74, Y_SUITE = 80;

  /* La photo du patient, en haut a droite de chaque page : 100 x 124 points,
     soit 35 x 44 mm, la taille d'une photo d'identite. Yanis l'a voulue deux
     fois plus grande que la photo de badge du premier jet, pour qu'on
     reconnaisse le patient au premier coup d'oeil. Elle descend plus bas que
     l'en-tete : ce qui commence a sa hauteur se raccourcit a sa gauche. */
  var W_PHOTO = 100, H_PHOTO = 124, Y_PHOTO = 8;
  var BAS_PHOTO = Y_PHOTO + H_PHOTO;

  /* Le corps du texte juridique, les libelles et les reponses. Une reponse
     se resserre jusqu'a T_REP_MIN avant de passer a la ligne.

     Ces tailles sont celles d'un document dense. Chaque document les agrandit
     de son facteur `echelle` : un consentement qui tient sur un tiers de page
     laissait un grand blanc sous sa signature, la ou le papier remplit la
     feuille. Le facteur est choisi pour le pire cas mesure (un mineur, son
     tuteur et toutes ses lignes) ; le banc d'essai refuse tout debordement. */
  var F = 1, T_TEXTE, IL, T_ETIQ, T_REP, T_REP_MIN, H_RANG, H_SIG;

  function appliquerEchelle(f) {
    F = f || 1;
    T_TEXTE = 8.7 * F; IL = 10.6 * F;
    T_ETIQ = 8.6 * F;
    T_REP = 9.2 * F; T_REP_MIN = 6.9;
    H_RANG = 16.5 * F; H_SIG = 31 + 30 * (F - 1);
  }
  appliquerEchelle(1);

  /* Le logo du cabinet, en tete de chaque page comme sur le papier.

     La page le sert par un fichier, `assets/ability-logo.png`. Une image
     servie par fichier est redessinee sur une toile pour en tirer son
     encodage ; la page et le PDF sont sur la meme origine, la toile n'est
     donc pas verrouillee. Un logo deja encode passe tel quel. */
  var logoRetenu = null, logoDejaCherche = false;

  function chargerLogoAbility() {
    if (logoDejaCherche) return Promise.resolve(logoRetenu);
    logoDejaCherche = true;
    return new Promise(function (resolve) {
      if (typeof document === 'undefined') { resolve(null); return; }
      var img = document.querySelector('.intro-logo, .header-logo');
      var src = (img && img.src) ? String(img.src) : '';
      if (!src) { resolve(null); return; }
      if (src.indexOf('data:image') === 0) { logoRetenu = src; resolve(src); return; }
      var chargeur = new Image();
      chargeur.onload = function () {
        try {
          var c = document.createElement('canvas');
          c.width = chargeur.width || 1;
          c.height = chargeur.height || 1;
          c.getContext('2d').drawImage(chargeur, 0, 0);
          logoRetenu = c.toDataURL('image/png');
        } catch (e) { logoRetenu = null; }
        resolve(logoRetenu);
      };
      chargeur.onerror = function () { resolve(null); };
      chargeur.src = src;
    });
  }

  function logoAbility() {
    return logoRetenu;
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

  /* « Name » devient « Name: », comme sur le papier. Un libelle qui porte
     deja sa ponctuation la garde : « Telephone # », « May we leave a
     message? », « I, », « Address: Street ». */
  function libelle(t) {
    t = nonVide(t);
    if (!t || t === 'I' || /[?:#,.]$/.test(t) || t.indexOf(':') >= 0) return t;
    return t + ':';
  }

  /* ────────────────────────────────────────────────────────────────────────
     Le gabarit : en-tete, bandeau de titre, pied de page, et les briques
     de mise en page. Les onze documents ne font qu'empiler ces briques.

     Convention : `etat.y` est le haut de l'espace libre. Chaque brique
     reserve sa hauteur avec place(), dessine, puis descend `etat.y`.
     ──────────────────────────────────────────────────────────────────────── */
  function nouveauDossier(photo) {
    var jsPDF = window.jspdf.jsPDF;
    var doc = new jsPDF({ unit: 'pt', format: 'letter', compress: true });
    var logo = logoAbility();
    var etat = { y: Y_SUITE, cle: '', vierge: true, marge: 0 };

    /* Ce que le banc d'essai relit : ou commence et finit chaque document,
       sur quelle page tombe chaque signature et chaque photo, et tout
       debordement. */
    var reperes = [], signatures = [], debordements = [], remplissage = {}, poses = [];

    function page() { return doc.internal.getNumberOfPages(); }
    function encre(c) { doc.setTextColor(c[0], c[1], c[2]); }
    function trait(c, w) { doc.setDrawColor(c[0], c[1], c[2]); doc.setLineWidth(w || 0.5); }
    function fond(c) { doc.setFillColor(c[0], c[1], c[2]); }
    function police(style, taille, c) {
      doc.setFont('helvetica', style || 'normal');
      doc.setFontSize(taille);
      encre(c || ENCRE);
    }
    function gauche() { return L + etat.marge; }

    /* Le bord droit du contenu. A hauteur de la photo, il recule jusqu'a
       elle : une ligne qui commence a cote de la photo s'arrete avant. */
    function droite() {
      var d = R - etat.marge;
      if (photo && etat.y < BAS_PHOTO + 2) d = Math.min(d, R - W_PHOTO - 12);
      return d;
    }

    /* Un tableau, un encadre ou une paire de cartes ne se raccourcit pas :
       ses colonnes et sa bordure doivent garder la meme largeur de haut en
       bas. S'il tombe a cote de la photo, il commence sous elle. */
    function sousPhoto() {
      if (photo && etat.y < BAS_PHOTO + 6) etat.y = BAS_PHOTO + 8;
    }
    function noter() {
      var p = page();
      remplissage[p] = Math.max(remplissage[p] || 0, etat.y);
    }

    /* L'en-tete du papier, repris sur chaque page comme sur le papier : le
       logo a gauche, la raison sociale centree, un filet. Et, en face du
       logo, la photo du patient : sur chaque page, une feuille detachee du
       dossier dit encore a qui elle appartient. */
    function enTete() {
      var x = L + 62, fin = photo ? R - W_PHOTO - 12 : R;
      if (logo) {
        try { doc.addImage(logo, 'PNG', L, 10, 52, 52); } catch (e) { }
      }
      if (photo) photoEnTete();
      var cx = (x + fin) / 2;
      doc.setFont('times', 'bold'); doc.setFontSize(13.5); encre(ENCRE);
      doc.text(CABINET.nom, cx, 29, { align: 'center' });
      doc.setFont('times', 'normal'); doc.setFontSize(9); encre(GRIS);
      doc.text(CABINET.adresse, cx, 41, { align: 'center' });
      doc.text(CABINET.contact, cx, 52, { align: 'center' });
      trait(ENCRE, 0.6);
      doc.line(x, 59, fin, 59);
      etat.y = Y_SUITE;
    }

    /* L'image est posee entiere, sans deformation, et n'est embarquee qu'une
       fois dans le PDF, quel que soit le nombre de pages. */
    function photoEnTete() {
      var w = W_PHOTO, h = H_PHOTO, x = R - w, y = Y_PHOTO;
      var ech = Math.min(w / photo.w, h / photo.h);
      var iw = photo.w * ech, ih = photo.h * ech;
      try {
        doc.addImage(photo.uri, photo.format, x + (w - iw) / 2, y + (h - ih) / 2, iw, ih, 'photo-client');
      } catch (e) { }
      trait(CADRE, 0.6);
      doc.rect(x, y, w, h);
      poses.push({ cle: etat.cle, quoi: 'face', page: page() });
    }

    /* Le bandeau marine du papier, titre en blanc, et l'etiquette rose du
       programme quand il y en a une (« PRP », « OMHC »). */
    function bandeau(titre, etiquette) {
      var y = Y_BANDEAU, h = 16, tT = 10.5, tE = 8.4, lE = 0;
      var fin = photo ? R - W_PHOTO - 12 : R, larg = fin - L;
      fond(MARINE); doc.rect(L, y, larg, h, 'F');
      doc.setFont('times', 'bold');
      if (etiquette) { doc.setFontSize(tE); lE = doc.getTextWidth(etiquette) + 9; }
      doc.setFontSize(tT);
      while (doc.getTextWidth(titre) + lE + 26 > larg && tT > 7) {
        tT -= 0.5; doc.setFontSize(tT);
      }
      var x = (L + fin) / 2 - (doc.getTextWidth(titre) + (lE ? lE + 6 : 0)) / 2;
      if (etiquette) {
        fond(ROSE); doc.rect(x, y + 3, lE, h - 6, 'F');
        doc.setFontSize(tE); encre(BLANC);
        doc.text(etiquette, x + 4.5, y + 10.9);
        x += lE + 6;
        doc.setFontSize(tT);
      }
      encre(BLANC);
      doc.text(titre, x, y + 11.6);
      etat.y = y + h + 11;
    }

    function suivre() {
      if (reperes.length) reperes[reperes.length - 1].fin = page();
    }

    /* Chaque document commence en haut d'une feuille, comme sur le papier,
       a la taille de texte qui remplit sa page. */
    function ouvrir(cle, titre, etiquette, f) {
      if (!etat.vierge) { noter(); doc.addPage(); }
      etat.vierge = false;
      etat.cle = cle;
      etat.marge = 0;
      appliquerEchelle(f);
      enTete();
      bandeau(titre, etiquette);
      reperes.push({ cle: cle, titre: titre, debut: page(), fin: page() });
    }

    /* Le saut de page du papier. Il est voulu : ce qui suit commence en haut
       de la feuille suivante, a la place qu'il occupe sur le papier. */
    function saut() {
      noter();
      doc.addPage(); enTete(); suivre();
    }

    /* Le saut que personne n'a voulu : le contenu deborde de sa page. Rien
       ne se perd, mais il est compte, et le banc d'essai le refuse sur les
       dossiers de test. Un debordement, c'est une signature qui risque de
       partir seule en haut de la page suivante, precisement ce que Collins
       a reproche. */
    function place(h) {
      if (etat.y + h <= BAS) return false;
      debordements.push({ cle: etat.cle, page: page() + 1 });
      noter();
      doc.addPage(); enTete(); suivre();
      return true;
    }

    function espace(h) { etat.y += h; }

    function pied() {
      noter();
      var n = page();
      for (var i = 1; i <= n; i++) {
        doc.setPage(i);
        trait(CADRE, 0.5);
        doc.line(L, HAUT - 30, R, HAUT - 30);
        police('normal', 6.8, PALE);
        doc.text('Confidential — protected health information.', L, HAUT - 20);
        doc.text(CABINET.nom + '  ·  Page ' + i + ' of ' + n, R, HAUT - 20, { align: 'right' });
      }
    }

    /* ─── Le texte ──────────────────────────────────────────────────────── */

    function paragraphe(txt, opts) {
      opts = opts || {};
      var style = ((opts.gras ? 'bold' : '') + (opts.italique ? 'italic' : '')) || 'normal';
      var taille = opts.taille || T_TEXTE, il = opts.interligne || IL;
      police(style, taille, opts.couleur || ENCRE);
      var x = gauche() + (opts.retrait || 0);
      /* La largeur se relit a chaque ligne : un paragraphe qui commence a cote
         de la photo reprend toute la largeur des qu'il l'a depassee. */
      var reste = String(txt);
      while (reste) {
        if (place(il)) police(style, taille, opts.couleur || ENCRE);
        var ligne = doc.splitTextToSize(reste, droite() - x)[0] || '';
        if (!ligne || reste.indexOf(ligne) !== 0) ligne = reste;
        doc.text(ligne, x, etat.y + il * 0.78);
        etat.y += il;
        reste = reste.slice(ligne.length).replace(/^\s+/, '');
      }
      etat.y += (opts.apres === undefined ? 3.5 : opts.apres);
    }

    /* Un intitule en gras, souligne quand le papier le souligne. Il reserve
       aussi la place de ce qui le suit : un intitule seul en bas de page
       ressemble a une piece manquante. */
    function intertitre(t, opts) {
      opts = opts || {};
      place(IL + (opts.suite || 18) * F);
      var taille = (opts.taille || 8.9) * F;
      police('bold', taille, ENCRE);
      var x = gauche(), lignes = doc.splitTextToSize(t, droite() - x);
      for (var i = 0; i < lignes.length; i++) {
        var yb = etat.y + 8.4 * F;
        doc.text(lignes[i], x, yb);
        if (opts.souligne) {
          trait(ENCRE, 0.5);
          doc.line(x, yb + 1.5, x + doc.getTextWidth(lignes[i]), yb + 1.5);
        }
        etat.y += 11 * F;
      }
      etat.y += (opts.apres === undefined ? 1.5 : opts.apres);
    }

    /* La barre grise centree du questionnaire : « Personal Information »,
       « History », « Additional Information ». */
    function barre(t) {
      place((14 + 18) * F);
      fond(BARRE);
      doc.rect(gauche(), etat.y, droite() - gauche(), 12 * F, 'F');
      police('bold', 8.6 * F, ENCRE);
      doc.text(t, (gauche() + droite()) / 2, etat.y + 8.7 * F, { align: 'center' });
      etat.y += 16 * F;
    }

    function puces(items) {
      var xP = gauche() + 14, xT = gauche() + 26;
      for (var i = 0; i < items.length; i++) {
        police('normal', T_TEXTE, ENCRE);
        var lg = doc.splitTextToSize(items[i], droite() - xT);
        if (place(lg.length * IL)) police('normal', T_TEXTE, ENCRE);
        fond(ENCRE);
        doc.circle(xP, etat.y + IL * 0.78 - 2.7 * F, 1.5, 'F');
        for (var j = 0; j < lg.length; j++) {
          doc.text(lg[j], xT, etat.y + IL * 0.78);
          etat.y += IL;
        }
        etat.y += 1.4;
      }
      etat.y += 2.5;
    }

    /* ─── Les cases et les reponses ─────────────────────────────────────── */

    /* Une case du papier. Cochee, elle recoit une coche a l'encre bleue,
       tracee comme au stylo : Yanis l'a preferee au carre plein le
       2026-09-11, c'est ainsi qu'on coche un formulaire papier. */
    function coteCase() { return 7.4 * Math.min(F, 1.12); }

    function carre(x, yb, coche) {
      var c = coteCase(), y = yb - c + 0.7;
      trait(ENCRE, 0.6);
      doc.rect(x, y, c, c);
      if (coche) {
        trait(STYLO, 1.25 * Math.min(F, 1.12));
        doc.setLineCap('round'); doc.setLineJoin('round');
        doc.lines([[0.24 * c, 0.3 * c], [0.62 * c, -0.84 * c]], x + 0.16 * c, y + 0.52 * c,
                  [1, 1], 'S', false);
        doc.setLineCap('butt'); doc.setLineJoin('miter');
      }
    }

    /* La plus grande taille, entre T_REP et T_REP_MIN, a laquelle une reponse
       tient sur sa ligne. Zero si elle n'y tient pas : elle passera alors a
       la ligne plutot que d'etre coupee. Une adresse sans son code postal
       n'est plus une adresse. */
    function taillePour(val, larg) {
      doc.setFont('helvetica', 'normal');
      for (var t = T_REP; t >= T_REP_MIN - 0.01; t -= 0.3) {
        doc.setFontSize(t);
        if (doc.getTextWidth(val) <= larg) return t;
      }
      return 0;
    }

    /* Largeur d'une rangee de cases « ☐ Yes  ☐ No », pour la placer. */
    function largeurCases(options, opts) {
      opts = opts || {};
      police('normal', opts.taille || T_ETIQ, ENCRE);
      var w = 0, d = coteCase() + 3;
      for (var i = 0; i < options.length; i++) {
        w += d + doc.getTextWidth(options[i].texte);
        if (options[i].autre !== undefined) w += 4 + (opts.largeAutre || 80) * F;
        if (i < options.length - 1) w += (opts.ecart || 11);
      }
      return w;
    }

    /* Des cases sur la ligne, comme le papier les pose. Une option « Other »
       porte sa ligne a remplir. */
    function cases(x, yb, options, opts) {
      opts = opts || {};
      var xs = x, d = coteCase() + 3;
      for (var i = 0; i < options.length; i++) {
        var o = options[i];
        police('normal', opts.taille || T_ETIQ, ENCRE);
        carre(xs, yb, o.coche);
        encre(ENCRE);
        doc.text(o.texte, xs + d, yb);
        xs += d + doc.getTextWidth(o.texte);
        if (o.autre !== undefined) {
          var lA = (opts.largeAutre || 80) * F;
          xs += 4;
          trait(TRAIT, 0.5); doc.line(xs, yb + 2, xs + lA, yb + 2);
          var v = nonVide(o.autre);
          if (v) {
            var t = taillePour(v, lA - 3) || T_REP_MIN;
            doc.setFontSize(t); encre(STYLO);
            doc.text(doc.splitTextToSize(v, lA - 3)[0], xs + 2, yb);
          }
          xs += lA;
        }
        xs += (opts.ecart || 11);
      }
    }

    /* La signature du patient posee sur sa ligne, a sa taille, sans
       deformation. Chaque place de signature est notee, signee ou non. */
    function signer(uri, x, yLigne, larg, lib, extra) {
      signatures.push({ cle: etat.cle, libelle: lib, page: page(), image: !!nonVide(uri) });
      extra = extra || {};
      if (nonVide(uri)) {
        try {
          var pr = doc.getImageProperties(uri);
          var hMax = 24 * F, wMax = Math.min(larg - 8, 128 * F);
          var ech = Math.min(wMax / pr.width, hMax / pr.height);
          doc.addImage(uri, 'PNG', x + 4, yLigne - pr.height * ech - 0.6,
                       pr.width * ech, pr.height * ech);
        } catch (e) { }
      }
      /* Le papier ne prevoit pas de nom sous la signature du temoin. Le
         formulaire le demande pourtant : il s'ecrit en petit au bout de la
         ligne plutot que de se perdre. */
      if (nonVide(extra.date) || nonVide(extra.nom)) {
        police('normal', 7.6, STYLO);
        doc.text([nonVide(extra.nom), nonVide(extra.date)].filter(Boolean).join('   '),
                 x + larg - 2, yLigne - 2.5, { align: 'right' });
      }
    }

    /* Une ligne du formulaire papier : « Libelle: ______ », un ou plusieurs
       segments cote a cote. `parts` donne la largeur de chaque segment en
       fraction de la ligne ; le libelle prend ce qu'il lui faut, le trait le
       reste, et la reponse s'ecrit sur le trait, a l'encre bleue.

       Une valeur peut etre :
         - un texte, ecrit sur le trait ;
         - { sig: image }, une signature posee sur le trait ;
         - { cases: [...] }, des cases a cocher sur la ligne ;
         - { texte: '...' }, du texte imprime, sans trait.

       `opts.brut` garde les libelles tels quels, sans deux-points : « Signed
       this ___ day of ___ 20___ » se lit d'une traite. `opts.etiquette`
       resserre les libelles d'une ligne trop chargee. */
    function rang(items, parts, opts) {
      opts = opts || {};
      var x0 = opts.depuis || (gauche() + (opts.retrait || 0));
      var dispo = droite() - x0, n = items.length, i;
      var tLab = opts.etiquette || T_ETIQ;
      if (!parts) { parts = []; for (i = 0; i < n; i++) parts.push(1 / n); }
      var avecSig = items.some(function (it) { return it[1] && it[1].sig !== undefined; });
      var hBase = avecSig ? H_SIG : H_RANG;

      /* 1. Mesurer : chaque reponse tient-elle sur son trait ? */
      var segs = [], x = x0, extra = 0;
      for (i = 0; i < n; i++) {
        var lab = opts.brut ? nonVide(items[i][0]) : libelle(items[i][0]), val = items[i][1];
        var larg = dispo * parts[i];
        police('normal', tLab, GRIS);
        var aCases = !!(val && typeof val === 'object' && val.cases);
        var s = { x: x, larg: larg, lab: lab,
                  lLab: lab ? doc.getTextWidth(lab) + (aCases ? 8 : 4) : 0,
                  val: val, fin: x + larg - (i < n - 1 ? 9 : 0) };
        if (val === null || val === undefined || typeof val !== 'object') {
          s.texte = nonVide(val);
          var zone = s.fin - (s.x + s.lLab) - 3;
          if (s.texte) {
            s.taille = taillePour(s.texte, zone);
            if (n === 1 && (!s.taille || s.taille < T_REP * 0.88)) {
              /* Seule sur sa ligne et trop longue pour son trait, la reponse
                 continue sur la ligne du dessous, a sa taille, comme on
                 continue d'ecrire sous la ligne d'un formulaire papier. La
                 resserrer jusqu'au bout la rendait illisible. */
              police('normal', T_REP, STYLO);
              var premiere = zone > 60 ? (doc.splitTextToSize(s.texte, zone)[0] || '') : '';
              var reste = s.texte.slice(premiere.length).trim();
              s.suite = [premiere].concat(reste ? doc.splitTextToSize(reste, s.fin - x0 - 12) : []);
              s.taille = T_REP;
              extra = Math.max(extra, (s.suite.length - 1) * 13 * F);
            } else if (!s.taille) {
              s.taille = 7.8;
              doc.setFontSize(s.taille);
              s.lignes = doc.splitTextToSize(s.texte, Math.max(zone, 40));
              extra = Math.max(extra, (s.lignes.length - 1) * 9.4);
            }
          }
        }
        segs.push(s);
        x += larg;
      }

      /* 2. Placer, puis dessiner. */
      place(hBase + extra);
      var yb = etat.y + hBase - 5;
      for (i = 0; i < segs.length; i++) {
        var g = segs[i], xz = g.x + g.lLab;
        if (g.lab) { police('normal', tLab, GRIS); doc.text(g.lab, g.x, yb); }
        var v = g.val;
        if (v && typeof v === 'object' && v.texte !== undefined) {
          police('normal', T_ETIQ, ENCRE);
          doc.text(String(v.texte), xz, yb);
        } else if (v && typeof v === 'object' && v.cases) {
          cases(xz, yb, v.cases, v);
        } else if (v && typeof v === 'object' && v.sig !== undefined) {
          trait(TRAIT, 0.5); doc.line(xz, yb + 2, g.fin, yb + 2);
          signer(v.sig, xz, yb + 2, g.fin - xz, g.lab, v);
        } else {
          trait(TRAIT, 0.5); doc.line(xz, yb + 2, g.fin, yb + 2);
          if (g.suite) {
            police('normal', g.taille, STYLO);
            if (g.suite[0]) doc.text(g.suite[0], xz + 2, yb);
            for (var q = 1; q < g.suite.length; q++) {
              var yq = yb + q * 13 * F;
              trait(TRAIT, 0.5); doc.line(x0 + 10, yq + 2, g.fin, yq + 2);
              doc.text(g.suite[q], x0 + 12, yq);
            }
          } else if (g.lignes) {
            police('normal', g.taille, STYLO);
            for (var j = 0; j < g.lignes.length; j++) {
              if (j > 0) { trait(TRAIT, 0.5); doc.line(xz, yb + 2 + j * 9.4, g.fin, yb + 2 + j * 9.4); }
              doc.text(g.lignes[j], xz + 2, yb + j * 9.4);
            }
          } else if (g.texte) {
            police('normal', g.taille, STYLO);
            doc.text(g.texte, xz + 2, yb);
          }
        }
      }
      etat.y += hBase + extra + (opts.apres || 0);
    }

    /* La question sur sa ligne, la reponse sur les lignes du dessous. Le
       papier laisse ainsi deux lignes vides sous « What do you consider to
       be some of your strengths » : on garde au moins ce nombre de lignes. */
    function rangDessous(question, val, opts) {
      opts = opts || {};
      var x0 = gauche() + (opts.retrait || 0);
      var v = nonVide(val);
      police('normal', T_REP, STYLO);
      var lg = v ? doc.splitTextToSize(v, droite() - x0 - 14) : [];
      var nb = Math.max(lg.length, opts.lignes || 1);
      police('normal', T_ETIQ, GRIS);
      var lq = doc.splitTextToSize(question, droite() - x0);
      place(lq.length * IL + nb * 14 * F + 2);
      police('normal', T_ETIQ, GRIS);
      for (var i = 0; i < lq.length; i++) {
        doc.text(lq[i], x0, etat.y + IL * 0.78);
        etat.y += IL;
      }
      for (var j = 0; j < nb; j++) {
        var yb = etat.y + 10.5 * F;
        trait(TRAIT, 0.5);
        doc.line(x0 + 10, yb + 2, droite(), yb + 2);
        if (lg[j]) { police('normal', T_REP, STYLO); doc.text(lg[j], x0 + 12, yb); }
        etat.y += 14 * F;
      }
      etat.y += (opts.apres === undefined ? 2 : opts.apres);
    }

    /* Une rangee de cases qui passe a la ligne si elle deborde, precedee ou
       non d'un libelle. */
    function rangCases(lab, options, opts) {
      opts = opts || {};
      var x0 = gauche() + (opts.retrait || 0), xMax = droite();
      police('normal', T_ETIQ, GRIS);
      var lLab = lab ? doc.getTextWidth(libelle(lab)) + 6 : 0;
      var lignes = [[]], xl = x0 + lLab;
      for (var i = 0; i < options.length; i++) {
        var w = largeurCases([options[i]], opts);
        if (xl + w > xMax && lignes[lignes.length - 1].length) { lignes.push([]); xl = x0 + lLab; }
        lignes[lignes.length - 1].push(options[i]);
        xl += w + (opts.ecart || 11);
      }
      place(lignes.length * 14 * F + 2);
      for (var k = 0; k < lignes.length; k++) {
        var yb = etat.y + 10.5 * F;
        if (k === 0 && lab) { police('normal', T_ETIQ, GRIS); doc.text(libelle(lab), x0, yb); }
        cases(x0 + lLab, yb, lignes[k], opts);
        etat.y += 14 * F;
      }
      etat.y += (opts.apres === undefined ? 2 : opts.apres);
    }

    /* Une case suivie d'une phrase, qui peut tenir sur plusieurs lignes. */
    function caseTexte(coche, texte, opts) {
      opts = opts || {};
      var x0 = gauche() + (opts.retrait || 0), d = coteCase() + 3.6;
      police('normal', T_ETIQ, ENCRE);
      var lg = doc.splitTextToSize(texte, droite() - x0 - d);
      if (place(lg.length * IL + 3)) police('normal', T_ETIQ, ENCRE);
      carre(x0, etat.y + IL * 0.78, coche);
      encre(ENCRE);
      for (var i = 0; i < lg.length; i++) {
        doc.text(lg[i], x0 + d, etat.y + IL * 0.78);
        etat.y += IL;
      }
      etat.y += (opts.apres === undefined ? 3.5 : opts.apres);
    }

    /* « Poor  Unsatisfactory  Satisfactory  Good  Very good » : le papier
       demande d'entourer. On entoure, a l'encre bleue. `separateur` rend le
       « yes / no » du tableau des antecedents familiaux. */
    function entourer(x, yb, options, choix, ecart, separateur) {
      var c = nonVide(choix).toLowerCase();
      police('normal', T_ETIQ, ENCRE);
      for (var i = 0; i < options.length; i++) {
        var w = doc.getTextWidth(options[i]);
        if (options[i].toLowerCase() === c) {
          trait(STYLO, 0.9);
          doc.ellipse(x + w / 2, yb - 2.9 * F, w / 2 + 4.5, 6.2 * F, 'S');
        }
        encre(ENCRE);
        doc.text(options[i], x, yb);
        x += w + (ecart || 20);
        if (separateur && i < options.length - 1) {
          doc.text(separateur, x, yb);
          x += doc.getTextWidth(separateur) + (ecart || 20);
        }
      }
    }

    function echelle(options, choix, opts) {
      opts = opts || {};
      place(16 * F);
      entourer(gauche() + (opts.retrait || 0), etat.y + 11 * F, options, choix, opts.ecart);
      etat.y += 16 * F + (opts.apres || 0);
    }

    /* ─── Tableaux et encadres ──────────────────────────────────────────── */

    /* Une cellule porte du texte, un intitule { titre }, une paire
       [libelle, reponse], une signature { sig }, des cases { cases }, ou un
       choix a entourer { entourer }. Sa hauteur se mesure avant d'etre
       dessinee. */
    function lignesCellule(c, w) {
      if (!c) return 1;
      if (typeof c === 'string') { police('normal', T_ETIQ); return doc.splitTextToSize(c, w - 8).length; }
      if (c.titre) { police('bold', T_ETIQ); return doc.splitTextToSize(c.titre, w - 8).length; }
      if (c.cases && c.cases.length === 1 && c.cases[0].autre === undefined) {
        police('normal', T_ETIQ); return doc.splitTextToSize(c.cases[0].texte, w - 20).length;
      }
      if (Array.isArray(c)) {
        police('normal', T_ETIQ);
        var lLab = doc.getTextWidth(libelle(c[0])) + 4, v = nonVide(c[1]);
        if (!v || taillePour(v, w - 8 - lLab)) return 1;
        police('normal', 7.8);
        return 1 + doc.splitTextToSize(v, w - 12).length;
      }
      return 1;
    }

    /* Dans une rangee haute, celle d'une signature, le texte se pose sur la
       ligne du bas, a hauteur du libelle de signature : « Date » en haut de
       sa case et la signature en bas de la sienne ne se lisaient plus comme
       une meme ligne. */
    function dessineCellule(c, x, y, w, h) {
      var yb = (h >= H_SIG - 2) ? y + h - 7 : y + 11.2 * F, i, pas = 10 * F;
      if (!c) return;
      if (typeof c === 'string') {
        police('normal', T_ETIQ, ENCRE);
        var lg = doc.splitTextToSize(c, w - 8);
        for (i = 0; i < lg.length; i++) doc.text(lg[i], x + 4, yb + i * pas);
      } else if (c.titre) {
        police('bold', T_ETIQ, ENCRE);
        var lt = doc.splitTextToSize(c.titre, w - 8);
        for (i = 0; i < lt.length; i++) {
          doc.text(lt[i], x + 4, yb + i * pas);
          if (c.souligne) {
            trait(ENCRE, 0.5);
            doc.line(x + 4, yb + i * pas + 1.5, x + 4 + doc.getTextWidth(lt[i]), yb + i * pas + 1.5);
          }
        }
      } else if (c.sig !== undefined) {
        police('normal', T_ETIQ, GRIS);
        var lab = libelle(c.libelle), lL = doc.getTextWidth(lab) + 6;
        doc.text(lab, x + 4, y + h - 7);
        signer(c.sig, x + 4 + lL, y + h - 5, w - lL - 8, c.libelle, c);
      } else if (c.cases) {
        if (c.cases.length === 1 && c.cases[0].autre === undefined) {
          var d = coteCase() + 3;
          police('normal', T_ETIQ, ENCRE);
          var lc = doc.splitTextToSize(c.cases[0].texte, w - 10 - d);
          carre(x + 5, yb, c.cases[0].coche);
          encre(ENCRE);
          for (i = 0; i < lc.length; i++) doc.text(lc[i], x + 5 + d, yb + i * pas);
        } else {
          cases(x + 5, yb, c.cases, c);
        }
      } else if (c.entourer) {
        entourer(x + 8, yb, c.entourer, c.choix, 8, '/');
      } else if (Array.isArray(c)) {
        police('normal', T_ETIQ, GRIS);
        var l2 = libelle(c[0]), lLab = doc.getTextWidth(l2) + 4, v = nonVide(c[1]);
        doc.text(l2, x + 4, yb);
        if (!v) return;
        var t = taillePour(v, w - 8 - lLab);
        if (t) { police('normal', t, STYLO); doc.text(v, x + 4 + lLab, yb); return; }
        police('normal', 7.8, STYLO);
        var lv = doc.splitTextToSize(v, w - 12);
        for (i = 0; i < lv.length; i++) doc.text(lv[i], x + 8, yb + 9.6 * (i + 1));
      }
    }

    /* Un tableau a bordures, comme ceux du papier. */
    function tableau(lignes, parts, opts) {
      opts = opts || {};
      sousPhoto();
      var x0 = gauche(), larg = droite() - x0;
      var total = parts.reduce(function (a, b) { return a + b; }, 0);
      var largeurs = parts.map(function (p) { return larg * p / total; });
      for (var r = 0; r < lignes.length; r++) {
        var ligne = lignes[r], h = (opts.hMin || 16) * F;
        for (var i = 0; i < ligne.length; i++) {
          var c = ligne[i];
          if (c && c.sig !== undefined) h = Math.max(h, H_SIG);
          else h = Math.max(h, 6 * F + lignesCellule(c, largeurs[i]) * 10 * F);
        }
        place(h);
        if (opts.fonds && opts.fonds[r]) {
          fond(opts.fonds[r]); doc.rect(x0, etat.y, larg, h, 'F');
        }
        var x = x0;
        for (var k = 0; k < ligne.length; k++) {
          dessineCellule(ligne[k], x, etat.y, largeurs[k], h);
          x += largeurs[k];
        }
        trait(CADRE, 0.6);
        doc.rect(x0, etat.y, larg, h);
        var xx = x0;
        for (var m = 0; m < ligne.length - 1; m++) {
          xx += largeurs[m];
          doc.line(xx, etat.y, xx, etat.y + h);
        }
        etat.y += h;
      }
      etat.y += (opts.apres === undefined ? 7 : opts.apres);
    }

    /* Un encadre du papier, par exemple le bloc « I agree that the
       information above has not changed » et ses lignes de signature. Les
       briques qu'il contient se decalent de sa marge. */
    function encadre(fn, opts) {
      opts = opts || {};
      sousPhoto();
      var y0 = etat.y, p0 = page();
      etat.marge = 6; etat.y += 2;
      fn();
      etat.marge = 0;
      etat.y += 2;
      var yH = (page() === p0) ? y0 : Y_SUITE;
      trait(CADRE, 0.7);
      doc.rect(L, yH, UTILE, etat.y - yH);
      etat.y += (opts.apres === undefined ? 7 : opts.apres);
    }

    /* Le filet qui separe deux lignes d'un encadre. */
    function filet() {
      trait(CADRE, 0.5);
      doc.line(L, etat.y + 1, R, etat.y + 1);
      etat.y += 2.5;
    }

    /* Le cadre d'une piece : taille fixe, l'image posee entiere et centree,
       jamais recadree, jamais deformee. Une piece d'identite rognee ne
       prouve plus rien. Un cadre vide dit « Not provided » : un blanc
       laisserait croire a un defaut de fabrication. */
    function cadreImage(img, x, y, w, h, legende) {
      police('bold', 7.4, GRIS);
      doc.text(legende.toUpperCase(), x, y - 4);
      if (img) {
        var ech = Math.min(w / img.w, h / img.h);
        var iw = img.w * ech, ih = img.h * ech;
        try { doc.addImage(img.uri, img.format, x + (w - iw) / 2, y + (h - ih) / 2, iw, ih); } catch (e) { }
        trait(CADRE, 0.7);
        doc.rect(x, y, w, h);
      } else {
        trait(CADRE, 0.7);
        doc.setLineDashPattern([3, 2], 0);
        doc.rect(x, y, w, h);
        doc.setLineDashPattern([], 0);
        police('italic', 8.4, PALE);
        doc.text('Not provided', x + w / 2, y + h / 2 + 3, { align: 'center' });
      }
    }

    /* Recto et verso cote a cote, au format d'une carte (85,6 x 54 mm), a la
       place du texte qu'ils prouvent. Sans aucune des deux images, une seule
       ligne le dit : deux grands cadres vides mangeraient la page pour rien. */
    function paireImages(a, b, legA, legB, opts) {
      opts = opts || {};
      var w = opts.largeur || 243, h = Math.round(w / 1.586), g = 16;
      var cles = opts.cles || [legA, legB];
      sousPhoto();
      if (!a && !b) {
        place(16);
        police('bold', 7.4, GRIS);
        var lib = (opts.vide || legA).toUpperCase();
        doc.text(lib, gauche(), etat.y + 10);
        police('italic', 8.4, PALE);
        doc.text('Not provided', gauche() + doc.getTextWidth(lib) + 12, etat.y + 10);
        etat.y += 16;
        return;
      }
      place(h + 22);
      var y = etat.y + 12;
      cadreImage(a, gauche(), y, w, h, legA);
      cadreImage(b, gauche() + w + g, y, w, h, legB);
      poses.push({ cle: etat.cle, quoi: cles[0], page: page(), image: !!a });
      poses.push({ cle: etat.cle, quoi: cles[1], page: page(), image: !!b });
      etat.y = y + h + 10;
    }

    return {
      doc: doc, etat: etat,
      reperes: reperes, signatures: signatures, debordements: debordements,
      remplissage: remplissage, poses: poses, paireImages: paireImages,
      ouvrir: ouvrir, saut: saut, place: place, espace: espace, pied: pied,
      paragraphe: paragraphe, intertitre: intertitre, barre: barre, puces: puces,
      rang: rang, rangDessous: rangDessous, rangCases: rangCases, caseTexte: caseTexte,
      echelle: echelle, tableau: tableau, encadre: encadre, filet: filet,
      cadreImage: cadreImage
    };
  }

  /* ────────────────────────────────────────────────────────────────────────
     Petites aides communes aux documents.
     ──────────────────────────────────────────────────────────────────────── */

  function ouiNon(v) {
    var s = nonVide(v);
    if (!s) return '';
    var b = s.toLowerCase();
    if (b === 'yes' || b === 'true' || b === '1') return 'Yes';
    if (b === 'no' || b === 'false' || b === '0') return 'No';
    return s;
  }

  /* « ☐ Yes  ☐ No », la reponse cochee. Sans reponse, rien n'est coche :
     on ne repond pas a la place du patient. */
  function ouiNonCases(v) {
    var r = ouiNon(v);
    return { cases: [{ texte: 'Yes', coche: r === 'Yes' }, { texte: 'No', coche: r === 'No' }] };
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
    return [haut, bas].filter(Boolean).join(', ');
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

  /* La meme chose, avec la case « Other » et sa ligne : une reponse absente
     de la liste la coche et s'ecrit dessus, plutot que de disparaitre. */
  function choixAvecAutre(options, valeur, autre) {
    var v = nonVide(valeur), a = nonVide(autre);
    var trouve = options.some(function (o) { return o.toLowerCase() === v.toLowerCase(); });
    return options.map(function (o) {
      var estAutre = o.toLowerCase() === 'other';
      var item = { texte: o, coche: trouve ? o.toLowerCase() === v.toLowerCase() : (estAutre && !!(v || a)) };
      if (estAutre) item.autre = a || (trouve ? '' : v);
      return item;
    });
  }

  function aTuteur(d) {
    return !!nonVide(d.guardian_signature_image);
  }

  /* Le nom qui accompagne la signature principale. */
  function nomImprime(d) {
    return nonVide(d.printed_name) || nomComplet(d);
  }

  /* Le papier n'a pas de ligne de tuteur sur les deux consentements ni sur
     le HIPAA. Un mineur ne signe pourtant pas seul : quand un tuteur a signe,
     sa ligne s'ajoute sous celle du client, et seulement alors. */
  function ligneTuteur(p, d) {
    if (!aTuteur(d)) return;
    p.rang([['Parent / Legal Guardian Signature', { sig: d.guardian_signature_image,
              nom: d.guardian_printed_name }], ['Date', d.signature_date]], [0.66, 0.34]);
  }

  var MENTION_MINEUR = '(Client is minor 13 years and older and is self-referred, client may '
    + 'sign without guardian)';

  /* ════════════════════════════════════════════════════════════════════════
     Pages 1 et 2. CONSENT FOR TREATMENT — PRP et OMHC
     Les deux consentements ont le meme corps, mot pour mot. Ils different par
     le programme, par la ligne d'assurance supplementaire du PRP, et par le
     second signataire : le representant PRP d'un cote, un temoin de l'autre.
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

  /* `apresChamps` pose ce qui doit suivre les lignes d'identite et
     d'assurance, avant le texte : la carte d'assurance, pour le PRP. */
  function corpsConsentement(p, d, deuxAssurances, apresChamps) {
    p.rang([['I,', nomComplet(d)]], [0.66]);
    p.rang([['Date of Birth', d.date_of_birth],
            ['Telephone #', nonVide(d.home_phone) || nonVide(d.cell_phone)]], [0.36, 0.52]);
    p.rang([['Emergency Phone Number', d.emergency_phone]], [0.6]);
    p.rang([['Consumer Address', adresseComplete(d)]], [0.92]);
    if (deuxAssurances) {
      p.rang([['Insurance', d.insurance_primary]], [0.5]);
      p.rang([['Insurance', d.insurance_secondary], ['SSN', d.ssn]], [0.5, 0.34]);
    } else {
      p.rang([['Insurance', d.insurance_primary], ['SSN', d.ssn]], [0.5, 0.34]);
    }
    if (apresChamps) apresChamps();
    p.espace(4);
    p.paragraphe('...hereby consent to participate in mental health treatment services provided by '
      + 'Ability & Empowerment Health Services. I understand that the purpose of these services '
      + 'is to address my mental health concerns, improve my well-being, and promote recovery.');
    p.paragraphe('I acknowledge that I have been informed of the following:', { apres: 2 });
    p.puces(CONSENTEMENT_PUCES);
    for (var i = 0; i < CONSENTEMENT_CORPS.length; i++) p.paragraphe(CONSENTEMENT_CORPS[i]);
    p.espace(10);
  }

  /* La carte d'assurance, recto et verso, sous les deux lignes « Insurance »
     qu'elle justifie. Un patient qui paie de sa poche n'en a pas : rien ne
     s'affiche alors, pas meme un cadre vide. */
  function carteAssurance(p, d, images) {
    if (/self-pay/i.test(nonVide(d.insurance_primary))) return;
    p.espace(2);
    p.paireImages(images.ins_front, images.ins_back, 'Insurance card — front',
      'Insurance card — back', { largeur: 204, vide: 'Insurance card', cles: ['ins_front', 'ins_back'] });
  }

  function contenuPrpConsent(p, d, images) {
    corpsConsentement(p, d, true, function () { carteAssurance(p, d, images || {}); });
    p.rang([['Client Signature', { sig: d.signature_image }], ['Date', d.signature_date]],
           [0.66, 0.34]);
    ligneTuteur(p, d);
    p.rang([['PRP Name', d.prp_name],
            ['Date and signature', { sig: d.prp_signature_image,
              date: nonVide(d.prp_signature_image) ? d.prp_signature_date : '' }]], [0.5, 0.5]);
  }

  function contenuOmhcConsent(p, d) {
    corpsConsentement(p, d, false);
    p.rang([['Client Signature', { sig: d.signature_image }], ['Date', d.signature_date]],
           [0.66, 0.34]);
    ligneTuteur(p, d);
    var temoin = nonVide(d.witness_signature_image);
    p.rang([['Witness (if applicable)', { sig: d.witness_signature_image, nom: d.witness_name }],
            ['Date', temoin ? (nonVide(d.witness_signature_date) || d.signature_date) : '']],
           [0.66, 0.34]);
  }

  /* ════════════════════════════════════════════════════════════════════════
     Pages 3, 5 et 4. CLIENT INTAKE QUESTIONNAIRE
     Trois pages dans le dossier papier, et elles y sont dans le desordre :
     la feuille « 3 of 3 » est classee avant la « 2 of 3 ». Elles sortent ici
     dans leur ordre, chacune avec son contenu exact.
     ════════════════════════════════════════════════════════════════════════ */

  var STATUTS_MARITAUX = ['Never Married', 'Domestic Partnership', 'Married',
                          'Separated', 'Divorced', 'Widowed'];

  var ECHELLE_SANTE = ['Poor', 'Unsatisfactory', 'Satisfactory', 'Good', 'Very good'];

  var FREQUENCE_DROGUE = ['Daily', 'Weekly', 'Monthly', 'Infrequently', 'Never'];

  var ANTECEDENTS_FAMILIAUX = [
    ['fam_alcohol', 'Alcohol/Substance Abuse'],
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
    images = images || {};
    /* ─── 1 of 3 : page 3 du papier ─── */
    p.paragraphe('Please note: information provided on this form is protected as confidential '
      + 'information.', { italique: true, apres: 2 });

    p.barre('Personal Information');
    p.rang([['Name', nomComplet(d)], ['Date', d.today_date]], [0.64, 0.36]);
    p.rang([['Parent / Legal Guardian (if under 18)', d.guardian_name]], [0.84]);
    p.rang([['Address', adresseComplete(d)]], [0.9]);
    p.rang([['Home Phone', d.home_phone],
            ['May we leave a message?', ouiNonCases(d.home_phone_message)]], [0.5, 0.5]);
    p.rang([['Cell / Work / Other Phone', d.cell_phone],
            ['May we leave a message?', ouiNonCases(d.cell_phone_message)]], [0.5, 0.5]);
    p.rang([['Email', d.email],
            ['May we leave a message?', ouiNonCases(d.email_message)]], [0.5, 0.5]);
    p.paragraphe('*Please note: Email correspondence is not considered to be a confidential '
      + 'medium of communication.', { italique: true, taille: 8, apres: 1 });
    p.rang([['DOB', d.date_of_birth], ['Age', d.age], ['Gender', d.gender]], [0.4, 0.24, 0.36]);
    p.intertitre('Marital Status', { apres: 0 });
    var statuts = grilleChoix(STATUTS_MARITAUX, d.marital_status);
    p.rangCases('', statuts.slice(0, 3), { ecart: 14, apres: 0 });
    p.rangCases('', statuts.slice(3), { ecart: 14 });
    p.rang([['Referred By (if any)', d.referred_by]], [0.78]);
    /* La piece d'identite, au pied de l'identite qu'elle prouve : nom,
       adresse, date de naissance. Au format reel d'une carte. */
    p.espace(2);
    p.paireImages(images.id_front, images.id_back, 'Photo ID — front', 'Photo ID — back',
      { largeur: 243, vide: 'Photo ID', cles: ['id_front', 'id_back'] });

    p.barre('History');
    p.paragraphe('Have you previously received any type of mental health services '
      + '(psychotherapy, psychiatric services, etc.)?', { couleur: GRIS, taille: T_ETIQ, apres: 0 });
    p.rang([['', ouiNonCases(d.prior_mh_services)],
            ['Previous therapist / practitioner', d.prior_practitioner]], [0.18, 0.82]);
    p.rang([['Are you currently taking any prescription medication?', ouiNonCases(d.current_meds)]], [1]);
    p.rang([['If yes, please list', d.current_meds_list]], [0.92]);
    p.rang([['Have you ever been prescribed psychiatric medication?', ouiNonCases(d.psych_meds_ever)]], [1]);
    p.rang([['If yes, please list and provide dates', d.psych_meds_list]], [0.92]);

    /* ─── 2 of 3 : page 5 du papier ─── */
    p.saut();
    p.intertitre('General and Mental Health Information', { apres: 3 });
    var r = 14;
    p.paragraphe('1. How would you rate your current physical health? (Please circle one)',
      { couleur: GRIS, taille: T_ETIQ, apres: 0 });
    p.echelle(ECHELLE_SANTE, d.physical_health_rating, { retrait: r });
    p.rang([['Please list any specific health problems you are currently experiencing',
             d.physical_health_problems]], [1], { retrait: r });
    p.paragraphe('2. How would you rate your current sleeping habits? (Please circle one)',
      { couleur: GRIS, taille: T_ETIQ, apres: 0 });
    p.echelle(ECHELLE_SANTE, d.sleep_rating, { retrait: r });
    p.rang([['Please list any specific health problems you are currently experiencing',
             d.sleep_problems]], [1], { retrait: r });
    p.rang([['3. How many times per week do you generally exercise?', d.exercise_frequency]], [0.7]);
    p.rang([['What types of exercise do you participate in?', d.exercise_types]], [1], { retrait: r });
    p.rangDessous('4. Please list any difficulties you experience with your appetite or eating problems:',
      d.appetite_problems);
    p.rang([['5. Are you currently experiencing overwhelming sadness, grief or depression?',
             ouiNonCases(d.depression)]], [1]);
    p.rang([['If yes, for approximately how long?', d.depression_duration]], [0.8], { retrait: r });
    p.rang([['6. Are you currently experiencing anxiety, panic attacks or have any phobias?',
             ouiNonCases(d.anxiety)]], [1]);
    p.rang([['If yes, when did you begin experiencing this?', d.anxiety_onset]], [1], { retrait: r });
    p.rang([['7. Are you currently experiencing any chronic pain?', ouiNonCases(d.chronic_pain)]], [1]);
    p.rang([['If yes, please describe', d.chronic_pain_describe]], [1], { retrait: r });
    p.rang([['8. Do you drink alcohol more than once a week?', ouiNonCases(d.alcohol_weekly)]], [1]);
    p.paragraphe('9. How often do you engage in recreational drug use?',
      { couleur: GRIS, taille: T_ETIQ, apres: 0 });
    p.rangCases('', grilleChoix(FREQUENCE_DROGUE, d.drug_use_frequency), { ecart: 14 });
    p.rang([['10. Are you currently in a romantic relationship?', ouiNonCases(d.relationship)]], [1]);
    p.rang([['If yes, for how long?', d.relationship_duration]], [0.7], { retrait: r });
    p.rang([['On a scale of 1-10 (with 1 being poor and 10 being exceptional), how would you rate '
             + 'your relationship?', d.relationship_rating]], [1]);
    p.rangDessous('11. What significant life changes or stressful events have you experienced recently?',
      d.life_changes);

    /* ─── 3 of 3 : page 4 du papier ─── */
    p.saut();
    p.intertitre('Family Mental Health History', { apres: 1 });
    p.paragraphe('In the section below, identify if there is a family history of any of the '
      + 'following. If yes, please indicate the family member\'s relationship to you in the '
      + 'space provided (e.g. father, grandmother, uncle, etc.)');
    var lignes = [['', 'Please Circle', 'List Family Member']];
    ANTECEDENTS_FAMILIAUX.forEach(function (a) {
      lignes.push([a[1], { entourer: ['yes', 'no'], choix: ouiNon(d[a[0]]) },
                   ['', nonVide(d[a[0] + '_who'])]]);
    });
    p.tableau(lignes, [4.2, 2.4, 3.4], { hMin: 17 });

    p.barre('Additional Information');
    p.rang([['1. Are you currently employed?', ouiNonCases(d.employed)]], [1]);
    p.rang([['If yes, what is your current employment situation?', d.employment_situation]],
           [1], { retrait: r });
    p.rang([['Do you enjoy your work? Is there anything stressful about your current work?',
             d.work_feelings]], [1], { retrait: r });
    p.rang([['2. Do you consider yourself to be spiritual or religious?', ouiNonCases(d.spiritual)]], [1]);
    p.rang([['If yes, describe your faith or belief', d.faith_describe]], [1], { retrait: r });
    p.rangDessous('3. What do you consider to be some of your strengths', d.strengths, { lignes: 2 });
    p.rangDessous('4. What do you consider to be some of your weaknesses?', d.weaknesses, { lignes: 2 });
    p.rangDessous('5. What would you like to accomplish out of your time in therapy?',
      d.therapy_goals, { lignes: 2 });
  }

  /* ════════════════════════════════════════════════════════════════════════
     Pages 6 et 9. PRP INITIAL FACE-TO-FACE SCREENING
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
    p.paragraphe('(Must be completed within five working days of referral)',
      { italique: true, taille: 7.8, apres: 2 });
    p.tableau([[['Applicant Name', nomComplet(d)],
                ['Date', nonVide(d.screening_date) || d.today_date],
                { cases: grilleChoix(['Adult', 'Minor'], d.screening_applicant_type) }]],
              [0.52, 0.26, 0.22]);
    p.paragraphe('The purpose of this form is to document the determination of the applicant’s '
      + 'acceptance or non-acceptance for enrollment in Ability and Empowerment Services '
      + 'Psychiatric Rehabilitation Program and has a task-completion checklist to document '
      + 'the completion of all required tasks relative to the screening assessment and '
      + 'subsequent required notifications. The rehabilitation specialist or designee shall '
      + 'maintain the checklist in the applicant’s medical record, if the applicant is '
      + 'accepted and subsequently enrolled, or if the applicant is subsequently not enrolled '
      + 'in the program.');

    p.intertitre('Name all parties present during the screening assessment and their '
      + 'relationship to the client:', { taille: 8.6 });
    var parties = Array.isArray(d.screening_parties) ? d.screening_parties : [];
    var lignes = [['Participant', 'Relationship']];
    parties.forEach(function (x) {
      if (x && (nonVide(x.name) || nonVide(x.relationship))) {
        lignes.push([['', nonVide(x.name)], ['', nonVide(x.relationship)]]);
      }
    });
    while (lignes.length < 3) lignes.push([null, null]);
    p.tableau(lignes, [1, 1]);

    p.intertitre('Assessing Applicant’s Rehabilitation Service Needs and Willingness to '
      + 'Participate in Rehabilitation Services', { taille: 8.6 });
    var q = { couleur: GRIS, taille: T_ETIQ, apres: 0 };
    p.encadre(function () {
      p.paragraphe('1. Has the applicant’s rehabilitation service needs been determined based '
        + 'on the information contained in the program referral form, documentation of medical '
        + 'necessity and a mental health treatment plan?', q);
      p.rang([['', ouiNonCases(d.screen_q1)], ['If no, Explain below', d.screen_q1_explain]], [0.2, 0.8]);
      p.filet();
      p.rang([['2. Is the client willing and able to participate in the PRP services?',
               ouiNonCases(d.screen_q2)]], [1]);
      p.rang([['If no, Explain below', d.screen_q2_explain]], [1], { retrait: 14 });
      p.filet();
      p.rang([['3. Is the program able to address the client’s needs as identified?',
               ouiNonCases(d.screen_q3)]], [1]);
      p.rang([['If no, Explain below and identify the date the applicant was notified in writing',
               d.screen_q3_explain]], [1], { retrait: 14 });
      p.rang([['Date applicant notified in writing', d.screen_q3_notified_date]], [0.6], { retrait: 14 });
      p.rang([['The applicant and family, as appropriate, was provided with the reasons for the '
               + 'determination?', ouiNonCases(d.screen_q3_reasons_provided)]], [1], { retrait: 14 });
      p.rang([['The applicant and family, as appropriate, was provided with recommendations for '
               + 'alternative services?', ouiNonCases(d.screen_q3_alternatives_provided)]], [1],
             { retrait: 14 });
      p.filet();
      p.rang([['4. If accepted, was the applicant’s level of acceptance identified in writing?',
               ouiNonCases(d.screen_q4)]], [1]);
      p.rang([['If no, Explain below', d.screen_q4_explain]], [1], { retrait: 14 });
      p.filet();
      p.rang([['5. When is enrollment anticipated?', d.screen_q5_enrollment]], [1]);
    });

    /* La page 9 du papier : la seconde moitie du screening. */
    var retards = RETARDS_SCREENING.map(function (r) {
      return { texte: r[1], coche: estOui(d[r[0]]) };
    });
    retards.push({
      texte: 'Other', autre: nonVide(d.screen_delay_other_text),
      coche: estOui(d.screen_delay_other) || !!nonVide(d.screen_delay_other_text)
    });
    var enRetard = retards.some(function (x) { return x.coche; })
      || ouiNon(d.screen_ontime) === 'No';
    p.encadre(function () {
      p.intertitre('6. Check box(es) as appropriate:', { taille: 8.6, apres: 0 });
      p.caseTexte(estOui(d.screen_ontime), 'Screening is on time (as initially scheduled)', { apres: 1 });
      p.caseTexte(enRetard, 'Screening is delayed due to:', { apres: 0 });
      p.rangCases('', retards, { retrait: 14, largeAutre: 120 });
      p.filet();
      p.intertitre('Staff name and Title completing this screening:', { taille: 8.6, apres: 0 });
      p.filet();
      p.rang([['Print Name', d.staff_print_name], ['Title', d.staff_title]], [0.5, 0.5]);
      p.rang([['Sign Name', { sig: d.staff_signature_image }],
              ['Date Signed', nonVide(d.staff_date_signed)]], [0.62, 0.38]);
    });
  }

  /* ════════════════════════════════════════════════════════════════════════
     Page 7. EMERGENCY CONTACT AND PRIMARY CARE PHYSICIAN INFORMATION
     ════════════════════════════════════════════════════════════════════════ */

  var RELATIONS_CONTACT = ['Legal Guardian', 'Foster Parent', 'Social Worker', 'Other'];

  /* Le papier porte deux blocs de contact. Le second reste imprime, vide, si
     le patient n'a donne qu'un contact : c'est la place que le cabinet lui
     reserve, et la case « I don't have a second emergency contact » y
     repond. */
  function blocContactUrgence(p, d, prefixe) {
    p.rang([['Name(s)', d[prefixe + '_name']]], [0.7]);
    p.rang([['Address: Street', nonVide(d[prefixe + '_street'])], ['Apt #', d[prefixe + '_apt']],
            ['City', d[prefixe + '_city']], ['State', d[prefixe + '_state']],
            ['Zip Code', d[prefixe + '_zip']]], [0.33, 0.13, 0.22, 0.13, 0.19]);
    p.rang([['Phone number(s): A.M.', d[prefixe + '_phone_am']], ['P.M.', d[prefixe + '_phone_pm']],
            ['Email', d[prefixe + '_email']]], [0.37, 0.25, 0.38]);
    p.rang([['Relationship to Client', { cases: choixAvecAutre(RELATIONS_CONTACT,
             d[prefixe + '_relationship'], d[prefixe + '_relationship_other']), largeAutre: 96 }]], [1]);
  }

  function contenuUrgencePcp(p, d) {
    p.rang([['I', nomComplet(d)],
            ['', { texte: 'give my consent to contact the individuals included on this form' }]],
           [0.42, 0.58]);
    p.paragraphe('(emergency contacts) in case of emergencies:', { italique: true, taille: 8, apres: 0 });
    p.rang([['Date', d.signature_date],
            ['Signature of client/legal guardian for clients', { sig: d.signature_image }]],
           [0.34, 0.66]);
    p.paragraphe(MENTION_MINEUR, { italique: true, taille: 7.8, apres: 2 });

    p.intertitre('Emergency Contacts:', { apres: 0 });
    blocContactUrgence(p, d, 'ec1');
    blocContactUrgence(p, d, 'ec2');
    p.caseTexte(estOui(d.ec_authorize_medical),
      'I authorize to give medical information to these contacts in case of emergency.', { apres: 1 });
    p.caseTexte(estOui(d.ec_no_second),
      "I don't have a second emergency contact (Only for children)");

    p.intertitre('Primary Care Physician Contact Form', { souligne: true, apres: 0 });
    p.rang([['Physician Name', d.pcp_name], ['Phone Number', d.pcp_phone]], [0.58, 0.42]);
    p.rang([['Address: Street', d.pcp_address]], [0.86]);
    p.rang([['Allergies', d.allergies]], [0.8]);
    p.rang([['Known Medical Conditions', d.medical_conditions]], [0.86]);
    p.espace(2);
    p.caseTexte(estOui(d.pcp_none),
      'I do not have a Primary Care Physician at present. I will find one and arrange to have a physical.',
      { apres: 1 });
    p.caseTexte(estOui(d.pcp_cannot_afford),
      'I am unable to afford physician health care and will not be able to arrange for a physical '
      + 'at this time.');

    p.encadre(function () {
      p.paragraphe('I agree that the information above has not changed since the last date signed.',
        { apres: 1 });
      p.filet();
      p.rang([['Client/Legal Guardian Signature', { sig: d.signature_image }],
              ['Printed Name', nomImprime(d)], ['Date', d.signature_date]], [0.5, 0.32, 0.18]);
      p.filet();
      p.rang([['Client/Legal Guardian Signature', { sig: aTuteur(d) ? d.guardian_signature_image : '' }],
              ['Printed Name', aTuteur(d) ? d.guardian_printed_name : ''],
              ['Date', aTuteur(d) ? d.signature_date : '']], [0.5, 0.32, 0.18]);
    });
  }

  /* ════════════════════════════════════════════════════════════════════════
     Page 8. HIPAA PATIENT / CLIENT CONSENT FORM
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
    p.intertitre('The Client understands that:', { apres: 1 });
    p.puces(HIPAA_CLIENT);
    p.paragraphe('Ability and Empowerment Services may condition treatment upon the execution '
      + 'of this consent (for example, you may be required to pay for your visit at the time '
      + 'of service for all Medicaid clients).');
    p.espace(8);

    var dt = dateEnMots(d.signature_date);
    p.rang([['Signed this', dt.jour], ['day of', dt.mois], ['20', dt.annee]], [0.26, 0.32, 0.16],
           { brut: true });
    p.rang([['Relationship to Patient', nonVide(d.hipaa_relationship)
              || nonVide(d.signer_relationship) || 'Self']], [0.66]);
    p.rang([['Signature', { sig: d.signature_image }]], [0.66]);
    ligneTuteur(p, d);
  }

  /* ════════════════════════════════════════════════════════════════════════
     Pages 10, 11 et 12. INFORMED CONSENT FOR TELEHEALTH (AUDIO AND VIDEO)
     AND TELEPHONIC SERVICES
     La page 12 du papier ne portait que les signatures, seules sur une
     feuille blanche. Elles closent ici la page du texte qu'elles signent.
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

  /* L'article 7 porte trois alineas que le papier pose en retrait, « a. »,
     « b. », « c. ». L'ecran les lit d'un seul tenant ; le document les
     remet a leur place, sans changer un mot. */
  function droitTelesante(p, i) {
    var t = TELEHEALTH_DROITS[i];
    var m = /^(.*request the following:) \(a\) (.*), \(b\) (.*), and\/or \(c\) (.*)$/.exec(t);
    if (!m) { p.paragraphe((i + 1) + '. ' + t); return; }
    p.paragraphe((i + 1) + '. ' + m[1], { apres: 1 });
    p.paragraphe('a. ' + m[2] + ',', { retrait: 18, apres: 1 });
    p.paragraphe('b. ' + m[3] + ', and/or', { retrait: 18, apres: 1 });
    p.paragraphe('c. ' + m[4], { retrait: 18 });
  }

  function contenuTelehealth(p, d) {
    p.intertitre('Definition of Telehealth (audio and video) and Telephonic', { souligne: true });
    for (var i = 0; i < TELEHEALTH_DEF.length; i++) p.paragraphe(TELEHEALTH_DEF[i]);
    p.paragraphe('I understand that I have the rights with respect to Telehealth (audio and '
      + 'video) and Telephonic:');
    for (var j = 0; j < 6; j++) droitTelesante(p, j);

    /* La page 11 du papier commence a l'article 7. */
    p.saut();
    for (var k = 6; k < TELEHEALTH_DROITS.length; k++) droitTelesante(p, k);
    p.paragraphe('Payment for Telehealth (audio and video) and Telephonic Services, Ability and '
      + 'Empowerment Services will bill insurance for Telehealth (audio and video) and '
      + 'Telephonic services when these services have been determined to be covered by an '
      + 'individual’s insurance plan. In the event that insurance does not cover Telehealth '
      + '(audio and video) and Telephonic, the individual wishes to pay out-of-pocket, or when '
      + 'there is no insurance coverage, a prompt pay discount is available. We will provide '
      + 'you with a statement of service to submit to your insurance company if you wish.');
    p.intertitre('Person Served Consent to the Use of Telehealth (audio and video) and Telephonic');
    p.paragraphe('I have read and understand the information provided above regarding '
      + 'Telehealth (audio and video) and Telephonic, have discussed it with my counselor, '
      + 'and all of my questions have been answered to my satisfaction.');
    p.paragraphe('I have read this document carefully and understand the risks and benefits '
      + 'related to the use of Telehealth (audio and video) and Telephonic services and have '
      + 'had my questions regarding the procedure explained. I hereby give my informed '
      + 'consent to participate in the use of Telehealth (audio and video) and Telephonic '
      + 'services for treatment under the terms described herein.');

    /* Ce qui etait seul sur la page 12 du papier. */
    p.espace(10);
    p.paragraphe('By my signature below, I hereby state that I have read, understood, and '
      + 'agree to the terms of this document.', { apres: 2 });
    p.rang([['Print Name', nomImprime(d)]], [0.66]);
    p.rang([['Person\'s Signature', { sig: d.signature_image }], ['Date', d.signature_date]],
           [0.66, 0.34]);
    p.rang([['Parent or Guardian Signature', { sig: aTuteur(d) ? d.guardian_signature_image : '',
              nom: aTuteur(d) ? d.guardian_printed_name : '' }],
            ['Date', aTuteur(d) ? d.signature_date : '']], [0.66, 0.34]);
  }

  /* ════════════════════════════════════════════════════════════════════════
     Pages 13 et 14. AUTHORIZATION TO EXCHANGE INFORMATION
     La page 14 du papier ne portait que trois lignes de signature. La
     premiere recoit la signature du jour ; les deux autres restent vides,
     pour les renouvellements annuels, comme sur le papier.
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
    p.rang([['Person Name', nomComplet(d)], ['DOB', d.date_of_birth]], [0.64, 0.36]);
    p.rang([['Address', adresseComplete(d)]], [0.86]);
    p.paragraphe('Exchange of Information with', { italique: true, apres: 0 });
    p.rang([['(Name/Agency)', d.exchange_agency_name]], [0.86]);
    p.rang([['Address', d.exchange_agency_address], ['Phone', d.exchange_agency_phone],
            ['Fax', d.exchange_agency_fax]], [0.5, 0.27, 0.23]);
    p.rang([['I,', nomComplet(d)]], [0.66]);
    p.paragraphe('freely give consent to A&E and the informant to exchange the below noted '
      + 'information for the purpose of payment, facilitating treatment, and continuity of '
      + 'care for me or for my child.');

    var items = ECHANGE_ELEMENTS.map(function (e) {
      return { cases: [{ texte: e[1], coche: estOui(d[e[0]]) }] };
    });
    items.push({ cases: [{ texte: 'Other', autre: nonVide(d.exch_other_text),
      coche: estOui(d.exch_other) || !!nonVide(d.exch_other_text) }], largeAutre: 150 });
    var grille = [];
    for (var i = 0; i < items.length; i += 2) grille.push([items[i], items[i + 1] || null]);
    p.tableau(grille, [1, 1]);

    p.rang([['If information is required for specific period of time, please specify from',
             d.exchange_from], ['to', d.exchange_to]], [0.72, 0.28]);
    p.paragraphe('I understand that my therapist may be supervised, and that the supervisor '
      + 'will have access to confidential information. I agree that the therapist’s '
      + 'supervisor may substitute for the therapist in exchange in information.', { apres: 1 });
    p.rangCases('', [
      { texte: 'Yes', coche: estOui(d.exchange_supervisor_consent) },
      { texte: 'No, I do not wish for A&E to exchange information with anyone at this time.',
        coche: estOui(d.exchange_declined) }
    ], { ecart: 30 });
    p.paragraphe('This consent to release information is given freely, voluntarily, and '
      + 'without coercion, and may be withdrawn by me at any time. Any information I '
      + 'authorize other professionals to release to A&E will be held strictly confidential '
      + 'and will not be released without my written permission except as permitted by State '
      + 'or Federal law. I understand that I have the right to inspect the record or mental '
      + 'health information about the above-named individual. The information to be disclosed '
      + 'may include information about medical conditions, including HIV/AIDS and substance '
      + 'abuse, which is pertinent and relevant to the facilitation of treatment.',
      { italique: true, taille: 8.4 });
    p.paragraphe('This authorization is effective for one year from the date below.',
      { gras: true, italique: true, apres: 0 });
    p.rang([['Date', d.signature_date], ['Please print your name', nomImprime(d)]], [0.4, 0.6]);
    p.paragraphe(MENTION_MINEUR, { italique: true, taille: 7.6, apres: 0 });
    p.rang([['Relationship to Person', { cases: choixAvecAutre(RELATIONS_ECHANGE,
             nonVide(d.exchange_relationship) || nonVide(d.signer_relationship) || 'Self',
             d.exchange_relationship_other), largeAutre: 90 }]], [1]);
    var temoin = nonVide(d.witness_signature_image);
    p.rang([['Signature of Witness', { sig: d.witness_signature_image, nom: d.witness_name }],
            ['Date', temoin ? (nonVide(d.witness_signature_date) || d.signature_date) : '']],
           [0.66, 0.34]);

    p.encadre(function () {
      p.paragraphe('I agree that the information above has not changed since the last date it '
        + 'was signed.', { apres: 1 });
      var lignesSig = [
        [d.signature_image, nomImprime(d), d.signature_date],
        aTuteur(d) ? [d.guardian_signature_image, d.guardian_printed_name, d.signature_date]
                   : ['', '', ''],
        ['', '', '']
      ];
      for (var k = 0; k < lignesSig.length; k++) {
        p.filet();
        p.rang([['Person/Legal Guardian Signature', { sig: lignesSig[k][0] }],
                ['Print Name of Person that Signed', lignesSig[k][1]],
                ['Date', lignesSig[k][2]]], [0.4, 0.43, 0.17], { etiquette: 7.8 });
      }
    });
  }

  /* ════════════════════════════════════════════════════════════════════════
     Page 15. ACKNOWLEDGE RECEIPT OF PERSONS SERVED HANDBOOK
     ════════════════════════════════════════════════════════════════════════ */

  function contenuManuel(p, d) {
    p.paragraphe('I acknowledge that I have received a copy of the Ability and Empowerment '
      + 'Services Persons Served Handbook (Orientation Handbook), and that its contents have '
      + 'been explained to me.', { apres: 8 });
    var staff = nonVide(d.staff_signature_image);
    p.tableau([
      [{ titre: 'Signatures' }, null],
      [{ sig: d.signature_image, libelle: 'Persons served', nom: nomImprime(d) },
       ['Date', d.signature_date]],
      [{ sig: aTuteur(d) ? d.guardian_signature_image : '', libelle: 'Parent/Guardian, if Applicable',
         nom: aTuteur(d) ? d.guardian_printed_name : '' },
       ['Date', aTuteur(d) ? d.signature_date : '']],
      [{ sig: d.staff_signature_image, libelle: 'Program Representative', nom: d.staff_print_name },
       ['Date', staff ? (nonVide(d.staff_date_signed) || d.signature_date) : '']]
    ], [0.72, 0.28]);
  }

  /* ════════════════════════════════════════════════════════════════════════
     Page 16. COMMUNITY SUPPORTS AND FAMILY OF ORIGIN
     Le contact d'urgence et le medecin traitant sont redemandes ici dans le
     dossier papier. Ils sont repris de la saisie unique, pas retapes.
     ════════════════════════════════════════════════════════════════════════ */

  function contenuSupports(p, d) {
    var villeEtatZip = [[nonVide(d.ec1_city), nonVide(d.ec1_state)].filter(Boolean).join(', '),
                        nonVide(d.ec1_zip)].filter(Boolean).join(' ');
    var rue1 = nonVide(d.ec1_street) + (nonVide(d.ec1_apt) ? ', Apt ' + nonVide(d.ec1_apt) : '');
    p.tableau([
      [{ titre: '1-  Emergency Contact' }, null],
      [['Name of Contact', d.ec1_name],
       ['Relationship to Person', nonVide(d.ec1_relationship_other) || nonVide(d.ec1_relationship)]],
      [['Address', rue1], ['City, State, Zip', villeEtatZip]],
      [['Contact number', nonVide(d.ec1_phone_am) || nonVide(d.ec1_phone_pm)], null],
      [{ titre: '2-  Community Supports', souligne: true }, null],
      [['Family / Significant Other', d.support_name], ['Phone #', d.support_phone]],
      [['Address', d.support_address], ['Relationship to Person', d.support_relationship]],
      [['Primary Care Physician', d.pcp_name], null],
      [['Phone #', d.pcp_phone], ['Address', d.pcp_address]],
      [{ titre: '3-  Family of Origin History', souligne: true }, null],
      [['Mother’s Name', d.mother_name], ['Age', d.mother_age]],
      [['Is Mother Alive?', ouiNon(d.mother_alive)], ['Nature of Relationship', d.mother_relationship]],
      [null, null],
      [['Father’s Name', d.father_name], ['Age', d.father_age]],
      [['Is Father Alive?', ouiNon(d.father_alive)], ['Nature of Relationship', d.father_relationship]],
      [['Siblings Name and Age', d.siblings], null],
      [['Other source of income if unemployed', d.other_income], null]
    ], [1, 1], { hMin: 22 });
  }

  /* ════════════════════════════════════════════════════════════════════════
     Assemblage
     Un seul fichier : les documents s'enchainent dans l'ordre du papier,
     chacun sur sa ou ses pages. `pages` est le nombre de feuilles que le
     document doit occuper ; le banc d'essai refuse tout ecart. `echelle`
     agrandit le texte des documents qui laissaient un grand blanc ; les plus
     denses (screening, echange) restent a 1.
     ════════════════════════════════════════════════════════════════════════ */

  var DOCUMENTS = [
    { cle: 'prp_consent', titre: 'CONSENT FOR TREATMENT', etiquette: 'PRP',
      papier: [1], pages: 1, echelle: 1.05, contenu: contenuPrpConsent },
    { cle: 'omhc_consent', titre: 'CONSENT FOR TREATMENT', etiquette: 'OMHC',
      papier: [2], pages: 1, echelle: 1.05, contenu: contenuOmhcConsent },
    { cle: 'intake', titre: 'CLIENT INTAKE QUESTIONNAIRE',
      papier: [3, 5, 4], pages: 3, echelle: 1.15, contenu: contenuIntake },
    { cle: 'screening', titre: 'PSYCHIATRIC REHABILITATION PROGRAM — INITIAL FACE-TO-FACE SCREENING',
      papier: [6, 9], pages: 1, echelle: 1, contenu: contenuScreening, siRempli: screeningRempli },
    { cle: 'emergency_pcp', titre: 'EMERGENCY CONTACT AND PRIMARY CARE PHYSICIAN INFORMATION',
      papier: [7], pages: 1, echelle: 1.1, contenu: contenuUrgencePcp },
    { cle: 'hipaa', titre: 'HIPAA PATIENT/CLIENT CONSENT FORM',
      papier: [8], pages: 1, echelle: 1.1, contenu: contenuHipaa },
    { cle: 'telehealth',
      titre: 'INFORMED CONSENT FOR TELEHEALTH (AUDIO AND VIDEO) AND TELEPHONIC SERVICES',
      papier: [10, 11, 12], pages: 2, echelle: 1.15, contenu: contenuTelehealth },
    { cle: 'exchange', titre: 'AUTHORIZATION TO EXCHANGE INFORMATION',
      papier: [13, 14], pages: 1, echelle: 1, contenu: contenuEchange },
    { cle: 'handbook', titre: 'ACKNOWLEDGE RECEIPT OF PERSONS SERVED HANDBOOK',
      papier: [15], pages: 1, echelle: 1.15, contenu: contenuManuel },
    { cle: 'supports', titre: 'COMMUNITY SUPPORTS AND FAMILY OF ORIGIN',
      papier: [16], pages: 1, echelle: 1.1, contenu: contenuSupports }
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
    /* Le logo est cherche une fois, avant la premiere page : l'en-tete le lit
       ensuite sans attendre. */
    await chargerLogoAbility();

    /* Une photo de telephone pese plusieurs megaoctets. Elle est reduite une
       seule fois, avant d'etre posee dans son cadre. */
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

    var p = nouveauDossier(images.face);
    for (var i = 0; i < actifs.length; i++) {
      p.ouvrir(actifs[i].cle, actifs[i].titre, actifs[i].etiquette, actifs[i].echelle);
      actifs[i].contenu(p, d, images);
    }
    p.pied();

    return {
      pdf_packet: p.doc.output('datauristring').split(',')[1],
      pdf_packet_nom: nomFichier(nomComplet(d), 'Admission Packet'),
      documents_produits: actifs.map(function (a) { return a.cle; }).join(','),
      /* Pour le banc d'essai seulement : la page ne recopie que les cles
         `pdf_`, rien de ceci ne part au cabinet. */
      _docs: { packet: p.doc },
      _mise_en_page: {
        reperes: p.reperes, signatures: p.signatures, debordements: p.debordements,
        remplissage: p.remplissage, poses: p.poses,
        prevues: actifs.map(function (a) { return { cle: a.cle, pages: a.pages }; })
      }
    };
  };

  /* Le banc d'essai Node rejoue ce fichier hors navigateur : il a besoin des
     descripteurs pour verifier les documents un par un. */
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { DOCUMENTS: DOCUMENTS };
  }
})();
