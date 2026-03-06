let peer;
let conn;
let esHost = false;
let jugadores = [];
let conexiones = [];
let miNombre = "";
let codigoSala = "";

const categorias = {
    "Gastronomía": [
        { palabra: "Pizza", similares: ["Lasaña", "Hamburguesa", "Focaccia"] },
        { palabra: "Sushi", similares: ["Ceviche", "Onigiri", "Sashimi"] },
        { palabra: "Café", similares: ["Té", "Chocolate caliente", "Mate"] },
        { palabra: "Cerveza", similares: ["Sidra", "Vino", "Champaña"] },
        { palabra: "Helado", similares: ["Yogur helado", "Granizado", "Mousse"] },
        { palabra: "Taco", similares: ["Burrito", "Quesadilla", "Enchilada"] }
    ],
    "Objetos": [
        { palabra: "Espejo", similares: ["Ventana", "Pantalla", "Cámara"] },
        { palabra: "Cuchillo", similares: ["Tijeras", "Bisturí", "Navaja"] },
        { palabra: "Cama", similares: ["Sofá", "Hamaca", "Litera"] },
        { palabra: "Lámpara", similares: ["Linterna", "Vela", "Faro"] },
        { palabra: "Silla", similares: ["Taburete", "Sillón", "Trono"] }
    ],
    "Animales": [
        { palabra: "León", similares: ["Tigre", "Leopardo", "Puma"] },
        { palabra: "Delfín", similares: ["Tiburón", "Ballena", "Orca"] },
        { palabra: "Águila", similares: ["Halcón", "Búho", "Cóndor"] },
        { palabra: "Perro", similares: ["Lobo", "Zorro", "Hiena"] },
        { palabra: "Gato", similares: ["Lince", "Pantera", "Tigre"] }
    ],
    "Profesiones": [
        { palabra: "Médico", similares: ["Enfermero", "Veterinario", "Paramédico"] },
        { palabra: "Chef", similares: ["Panadero", "Carnicero", "Crítico culinario"] },
        { palabra: "Policía", similares: ["Guardia de seguridad", "Militar", "Detective"] },
        { palabra: "Maestro", similares: ["Profesor universitario", "Tutor", "Entrenador"] },
        { palabra: "Bombero", similares: ["Rescatista", "Buzo", "Voluntario"] }
    ],
    "Lugares": [
        { palabra: "París", similares: ["Roma", "Venecia", "Praga"] },
        { palabra: "Egipto", similares: ["México", "Marruecos", "Jordania"] },
        { palabra: "Japón", similares: ["China", "Corea del Sur", "Taiwán"] },
        { palabra: "Desierto", similares: ["Playa", "Sabana", "Marte"] },
        { palabra: "Hospital", similares: ["Clínica", "Farmacia", "Ambulatorio"] }
    ]
};


function empezarVotacion(){

    if(!esHost){
        alert("Solo el host puede iniciar la votación")
        return
    }

    broadcast({
        tipo: "votacion",
        jugadores: jugadores
    })

    mostrarVotacion({
        jugadores: jugadores
    })
}

function actualizarJugadores() {
    let lista = document.getElementById("listaJugadores");
    lista.innerHTML = "";
    jugadores.forEach(j => {
        let li = document.createElement("li");
        li.innerText = j.nombre;
        lista.appendChild(li);
    });
}

function crearSala() {
    miNombre = document.getElementById("nombre").value;
    if (!miNombre) return alert("Ponte un nombre");
    codigoSala = Math.floor(Math.random() * 90000 + 10000).toString();
    peer = new Peer(codigoSala);
    esHost = true;

    peer.on("open", id => {
        document.getElementById("menu").classList.add("hidden");
        document.getElementById("sala").classList.remove("hidden");
        document.getElementById("codigo").innerText = id;
        jugadores.push({ nombre: miNombre, id: id });
        actualizarJugadores();
    });

    peer.on("connection", connection => {
        conexiones.push(connection);
        connection.on("data", data => {
            if (data.tipo === "unirse") {
                jugadores.push(data.jugador);
                actualizarJugadores();
                broadcast({ tipo: "jugadores", jugadores: jugadores });
            }
            if (data.tipo === "voto") recibirVoto(data);
        });
    });
}

function unirseSala() {
    miNombre = document.getElementById("nombre").value;
    codigoSala = document.getElementById("codigoSala").value;
    if (!miNombre || !codigoSala) return alert("Faltan datos");

    peer = new Peer();
    peer.on("open", id => {
        conn = peer.connect(codigoSala);
        conn.on("open", () => {
            conn.send({ tipo: "unirse", jugador: { nombre: miNombre, id: id } });
        });
        conn.on("data", data => {
            if (data.tipo === "jugadores") {
                jugadores = data.jugadores;
                document.getElementById("menu").classList.add("hidden");
                document.getElementById("sala").classList.remove("hidden");
                document.getElementById("codigo").innerText = codigoSala;
                actualizarJugadores();
            }
            if (data.tipo === "inicio") recibirInicio(data);
            if (data.tipo === "votacion") mostrarVotacion(data);
        });
    });
}

function broadcast(data) {
    conexiones.forEach(c => c.send(data));
}

function iniciarJuego() {

    let numImpostores = parseInt(document.getElementById("numImpostores").value);

    if(numImpostores >= jugadores.length){

alert("Demasiados impostores")

return

}
    // 1. Elegir palabra
    let keys = Object.keys(categorias);
    let catRandom = keys[Math.floor(Math.random() * keys.length)];
    let seleccion = categorias[catRandom][Math.floor(Math.random() * categorias[catRandom].length)];

    // 2. Configuración de la sala
    let modo = document.getElementById("modo").value;
    
    
    // 3. Elegir impostores (usando IDs)
    let impostoresIds = [];
    let candidatos = jugadores.map(j => j.id);
    while(impostoresIds.length < numImpostores && candidatos.length > 0) {
        let indice = Math.floor(Math.random() * candidatos.length);
        impostoresIds.push(candidatos.splice(indice, 1)[0]);
    }

    // 4. Repartir
    jugadores.forEach(j => {

    let rol = "Inocente"
    let palabraFinal = seleccion.palabra

    if(impostoresIds.includes(j.id)){

        rol = "Impostor"

        palabraFinal = (modo === "original")
        ? "ERES EL IMPOSTOR"
        : seleccion.similares[Math.floor(Math.random()*seleccion.similares.length)]

    }

    j.rol = rol

        if (j.id === peer.id) {
            mostrarMiRol(catRandom, palabraFinal, rol);
        } else {
            let c = conexiones.find(con => con.peer === j.id);
            if(c) c.send({ tipo: "inicio", categoria: catRandom, palabra: palabraFinal, rol: rol, jugadores: jugadores });
        }
    });

    
}

function recibirInicio(data) {
    mostrarMiRol(data.categoria, data.palabra, data.rol);
    jugadores = data.jugadores;
}

function mostrarMiRol(cat, palabra, rol) {

    
    document.getElementById("sala").classList.add("hidden");
    document.getElementById("juego").classList.remove("hidden");
    document.getElementById("categoria").innerText = "Categoría: " + cat;
    document.getElementById("infoJugador").innerHTML = `<h3>Eres: ${rol}</h3><h2>${palabra}</h2>`;

    if(esHost){
    document.getElementById("btnVotacion").classList.remove("hidden")
}
}

function mostrarVotacion(data) {
    let div = document.getElementById("votacion");
    div.innerHTML = "";
    data.jugadores.forEach(j => {
        let b = document.createElement("button");
        b.innerText = j.nombre;
        b.onclick = () => votar(j);
        div.appendChild(b);
    });
}

function votar(j) {
    if (esHost) recibirVoto({ jugador: j });
    else conn.send({ tipo: "voto", jugador: j });
    
    // Deshabilitar botones tras votar
    document.getElementById("votacion").innerHTML = "<p>Voto enviado...</p>";
}

let votos = {};
function recibirVoto(data) {
    let nombre = data.jugador.nombre;
    votos[nombre] = (votos[nombre] || 0) + 1;
    
    let totalVotos = Object.values(votos).reduce((a, b) => a + b, 0);
    if (totalVotos === jugadores.length) {
        resolverVotos();
    }
}

function resolverVotos(){

    let max = 0
    let eliminado = ""

    for(let j in votos){

        if(votos[j] > max){

            max = votos[j]
            eliminado = j

        }

    }

    alert("Eliminado: " + eliminado)

    jugadores = jugadores.filter(j => j.nombre !== eliminado)

    votos = {}

    verificarVictoria()

}

function verificarVictoria(){

    let vivos = jugadores.length

    let impostores = jugadores.filter(j => j.rol === "Impostor").length

    let inocentes = vivos - impostores

    if(impostores === 0){

        alert("GANAN LOS INOCENTES")

        location.reload()

    }

    if(impostores >= inocentes){

        alert("GANAN LOS IMPOSTORES")

        location.reload()

    }

}
