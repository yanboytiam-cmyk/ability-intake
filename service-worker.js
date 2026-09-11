/* Ability and Empowerment Services — dossier d'admission, coquille hors ligne.
 *
 * Deux regles :
 *   1. la page ET `documents.js` sont network-first, avec `cache: "no-store"`,
 *      pour qu'un correctif deploye arrive sur la tablette a la prochaine
 *      ouverture au lieu d'y rester epingle ;
 *   2. le reste de la coquille est cache-first, pour que le formulaire
 *      s'ouvre quand le wifi du cabinet tombe.
 *
 * `documents.js` est traite comme la page, et ce n'est pas un exces de zele :
 * il porte le dossier et les textes juridiques signes. Un jour ou il
 * etait servi depuis le cache pendant que la page etait a jour, un document
 * entier a disparu d'un envoi de test sans que rien ne le signale.
 *
 * Les envois ne sont jamais touches ici : ce sont des POST, le navigateur ne
 * les met pas en cache, et la page tient sa propre file de reprise.
 */
var VERSION = "aes-intake-v16";
var SHELL = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./assets/ability-logo.png",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./vendor/jspdf.umd.min.js"
];

self.addEventListener("install", function (ev) {
  ev.waitUntil(
    caches.open(VERSION).then(function (c) {
      // Une URL fautive ne doit pas faire echouer toute l'installation et
      // laisser l'application sans cache du tout.
      return Promise.all(SHELL.map(function (u) {
        return c.add(u).catch(function () {});
      }));
    }).then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener("activate", function (ev) {
  ev.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.map(function (k) {
        return k === VERSION ? null : caches.delete(k);
      }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener("fetch", function (ev) {
  var req = ev.request;
  if (req.method !== "GET") return;

  var url = new URL(req.url);
  // Uniquement notre origine. Le webhook n8n doit toujours aller au reseau,
  // et ne doit jamais sortir d'un cache.
  if (url.origin !== self.location.origin) return;

  var isPage = req.mode === "navigate" ||
               (req.headers.get("accept") || "").indexOf("text/html") !== -1;
  var estCritique = isPage || /\/documents\.js(\?|$)/.test(url.pathname);

  if (estCritique) {
    ev.respondWith(
      // no-store, et pas un fetch ordinaire : GitHub Pages sert le HTML avec
      // un max-age, donc un fetch ordinaire est servi par le cache HTTP du
      // navigateur et un correctif redeploye resterait invisible sur la
      // tablette aussi longtemps que cet en-tete le dit. Network-first doit
      // vouloir dire le reseau.
      fetch(req.url, { cache: "no-store", credentials: "same-origin" }).then(function (res) {
        var copy = res.clone();
        caches.open(VERSION).then(function (c) { c.put(req, copy); });
        return res;
      }).catch(function () {
        return caches.match(req).then(function (hit) {
          return hit || caches.match("./index.html");
        });
      })
    );
    return;
  }

  ev.respondWith(
    caches.match(req).then(function (hit) {
      if (hit) return hit;
      return fetch(req).then(function (res) {
        if (res && res.status === 200 && res.type === "basic") {
          var copy = res.clone();
          caches.open(VERSION).then(function (c) { c.put(req, copy); });
        }
        return res;
      });
    })
  );
});
