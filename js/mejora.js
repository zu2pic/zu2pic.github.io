// Easy Corona · web · comprobación de la clave Premium ANTES de comprar la mejora a Premium+.
// Usa las mismas funciones que el programa de ventas (licencias.js + tweetnacl) con la clave PÚBLICA
// de la app: puede comprobar claves, no crearlas. Después del pago el programa de ventas la vuelve a
// comprobar (esto solo evita que alguien pague con una clave mal copiada).
// V0_70 · en inglés si la página es inglesa (<html lang="en">): los mensajes de leerClave (licencias.js, compartido
// con la tienda: no se toca) se traducen aquí.

var EN = String(document.documentElement.lang || "").indexOf("en") === 0;
var ERRORES_EN = {
  "La clave está incompleta o tiene caracteres de más.": "The key is incomplete or has extra characters.",
  "La clave tiene caracteres que no son de una clave de Easy Corona.":
    "The key has characters that don't belong to an Easy Corona key.",
  "No es una clave de Easy Corona.": "It isn't an Easy Corona key.",
  "La clave está incompleta.": "The key is incomplete.",
  "La firma de la clave no es válida (¿está copiada entera?).": "The key's signature isn't valid (was it copied entirely?).",
  "Clave con un formato desconocido.": "Key with an unknown format."
};

function t(es, en) { return EN ? en : es; }

/** Qué hacer con el texto pegado: {ok, mensaje, correo?, compacta?}. */
function estadoDeClave(texto, clavePublica) {
  var s = String(texto || "").trim();
  if (!s) return { ok: false, mensaje: "" };
  var info;
  try {
    info = leerClave({ publicKey: clavePublica }, s);
  } catch (e) {
    var error = EN ? (ERRORES_EN[e.message] || e.message) : e.message;
    return { ok: false, mensaje: error + t(" Cópiala entera del correo en el que te llegó.",
                                           " Copy it entirely from the email you received it in.") };
  }
  if (info.nivel === "premium_plus") {
    return { ok: false, mensaje: t("Esta clave ya es Premium+: no necesitas la mejora.",
                                   "This key is already Premium+: you don't need the upgrade.") };
  }
  if (info.nivel !== "premium") return { ok: false, mensaje: t("No es una clave Premium.", "It isn't a Premium key.") };
  return {
    ok: true,
    correo: info.correo,
    compacta: s.replace(/\s+/g, ""),
    mensaje: t("Clave Premium válida, a nombre de ", "Valid Premium key, registered to ") + ocultarCorreo(info.correo) + "."
  };
}

/** «zu3run@gmail.com» → «zu3…@gmail.com» (para no mostrar el correo entero en pantalla). */
function ocultarCorreo(correo) {
  var partes = String(correo).split("@");
  return partes.length === 2 ? partes[0].slice(0, 3) + "…@" + partes[1] : correo;
}

function bytesDeHex(hex) {
  var out = new Uint8Array(hex.length / 2);
  for (var i = 0; i < out.length; i++) out[i] = parseInt(hex.substr(i * 2, 2), 16);
  return out;
}
