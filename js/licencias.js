// =====================================================================================
// Easy Corona · claves de licencia (el MISMO formato que herramientas/licencias.py y que
// comprueba la app): «EC1-» + base32 de («EC1|nivel|correo|fecha» + firma Ed25519 de 64 bytes).
// Solo JavaScript normal (sin nada de Google), para poder probarlo también en un navegador.
// =====================================================================================
var PREFIJO_CLAVE = "EC1";
var NIVELES_DE_PAGO = ["premium", "premium_plus"];
var ALFABETO_B32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

function utf8Bytes(texto) {
  var s = unescape(encodeURIComponent(texto));
  var out = new Uint8Array(s.length);
  for (var i = 0; i < s.length; i++) out[i] = s.charCodeAt(i);
  return out;
}

function utf8Texto(bytes) {
  var s = "";
  for (var i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return decodeURIComponent(escape(s));
}

function aBase32(bytes) {                       // RFC 4648, sin «=» al final (como Python)
  var out = "", valor = 0, bits = 0;
  for (var i = 0; i < bytes.length; i++) {
    valor = (valor << 8) | bytes[i];
    bits += 8;
    while (bits >= 5) {
      out += ALFABETO_B32.charAt((valor >>> (bits - 5)) & 31);
      bits -= 5;
    }
    valor &= (1 << bits) - 1;
  }
  if (bits > 0) out += ALFABETO_B32.charAt((valor << (5 - bits)) & 31);
  return out;
}

function deBase32(texto) {
  var out = [], valor = 0, bits = 0;
  texto = texto.replace(/=+$/, "");
  // Igual de estricto que Python (base64.b32decode): con 1, 3 o 6 caracteres de sobra en el último
  // grupo de 8 la longitud es imposible (p. ej. una clave buena con una letra añadida al final).
  if ([0, 2, 4, 5, 7].indexOf(texto.length % 8) < 0) throw new Error("La clave está incompleta o tiene caracteres de más.");
  for (var i = 0; i < texto.length; i++) {
    var v = ALFABETO_B32.indexOf(texto.charAt(i));
    if (v < 0) throw new Error("La clave tiene caracteres que no son de una clave de Easy Corona.");
    valor = (valor << 5) | v;
    bits += 5;
    if (bits >= 8) {
      out.push((valor >>> (bits - 8)) & 255);
      bits -= 8;
    }
    valor &= (1 << bits) - 1;
  }
  return new Uint8Array(out);
}

/** Par de claves Ed25519 a partir de la semilla de 32 bytes (la clave privada de licencias.py). */
function parDesdeSemilla(semilla) {
  if (semilla.length !== 32) throw new Error("La semilla debe tener 32 bytes.");
  return nacl.sign.keyPair.fromSeed(semilla);
}

/** Clave de licencia para `nivel` («premium» o «premium_plus») a nombre de `correo`. */
function crearClave(par, nivel, correo, fecha) {
  if (NIVELES_DE_PAGO.indexOf(nivel) < 0) throw new Error("Nivel desconocido: " + nivel);
  correo = String(correo || "").trim();
  if (!correo || correo.indexOf("|") >= 0) throw new Error("Correo no válido: " + correo);
  var payload = utf8Bytes([PREFIJO_CLAVE, nivel, correo, fecha].join("|"));
  var firma = nacl.sign.detached(payload, par.secretKey);
  var blob = new Uint8Array(payload.length + firma.length);
  blob.set(payload, 0);
  blob.set(firma, payload.length);
  return PREFIJO_CLAVE + "-" + aBase32(blob);
}

/** {nivel, correo, fecha} de una clave firmada con este par; error si no es válida. */
function leerClave(par, texto) {
  var compacto = String(texto || "").replace(/\s+/g, "").toUpperCase();
  if (compacto.indexOf(PREFIJO_CLAVE + "-") !== 0) throw new Error("No es una clave de Easy Corona.");
  var blob = deBase32(compacto.slice(PREFIJO_CLAVE.length + 1).replace(/-/g, ""));
  if (blob.length <= 64) throw new Error("La clave está incompleta.");
  var payload = blob.slice(0, blob.length - 64);
  var firma = blob.slice(blob.length - 64);
  if (!nacl.sign.detached.verify(payload, firma, par.publicKey)) {
    throw new Error("La firma de la clave no es válida (¿está copiada entera?).");
  }
  var campos = utf8Texto(payload).split("|");
  if (campos.length !== 4 || campos[0] !== PREFIJO_CLAVE) throw new Error("Clave con un formato desconocido.");
  return { nivel: campos[1], correo: campos[2], fecha: campos[3] };
}

/** Mejora de Premium a Premium+: comprueba la clave Premium y crea la Premium+ para el mismo correo. */
function mejorarClave(par, clavePremium, fecha) {
  var info = leerClave(par, clavePremium);
  if (info.nivel !== "premium") {
    throw new Error("La clave es de la versión «" + info.nivel + "», no Premium: no se puede mejorar.");
  }
  return { clave: crearClave(par, "premium_plus", info.correo, fecha), correo: info.correo };
}
