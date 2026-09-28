// Easy Corona · web · comprobación de la clave Premium ANTES de comprar la mejora a Premium+.
// Usa las mismas funciones que el programa de ventas (licencias.js + tweetnacl) con la clave PÚBLICA
// de la app: puede comprobar claves, no crearlas. Después del pago el programa de ventas la vuelve a
// comprobar (esto solo evita que alguien pague con una clave mal copiada).

/** Qué hacer con el texto pegado: {ok, mensaje, correo?, compacta?}. */
function estadoDeClave(texto, clavePublica) {
  var t = String(texto || "").trim();
  if (!t) return { ok: false, mensaje: "" };
  var info;
  try {
    info = leerClave({ publicKey: clavePublica }, t);
  } catch (e) {
    return { ok: false, mensaje: e.message + " Cópiala entera del correo en el que te llegó." };
  }
  if (info.nivel === "premium_plus") {
    return { ok: false, mensaje: "Esta clave ya es Premium+: no necesitas la mejora." };
  }
  if (info.nivel !== "premium") return { ok: false, mensaje: "No es una clave Premium." };
  return {
    ok: true,
    correo: info.correo,
    compacta: t.replace(/\s+/g, ""),
    mensaje: "Clave Premium válida, a nombre de " + ocultarCorreo(info.correo) + "."
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
