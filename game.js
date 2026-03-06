let peer
let conn
let esHost=false

let jugadores=[]
let conexiones=[]

let miNombre=""
let codigoSala=""

let miPalabra=""
let miRol=""

const categorias={

"Gastronomía":[
{palabra:"Pizza",similares:["Lasaña","Hamburguesa","Focaccia"]},
{palabra:"Sushi",similares:["Ceviche","Onigiri","Sashimi"]},
{palabra:"Café",similares:["Té","Chocolate caliente","Mate"]},
{palabra:"Cerveza",similares:["Sidra","Vino","Champaña"]},
{palabra:"Helado",similares:["Yogur helado","Granizado","Mousse"]},
{palabra:"Taco",similares:["Burrito","Quesadilla","Enchilada"]}
],

"Objetos":[
{palabra:"Espejo",similares:["Ventana","Pantalla","Cámara"]},
{palabra:"Cuchillo",similares:["Tijeras","Bisturí","Navaja"]},
{palabra:"Cama",similares:["Sofá","Hamaca","Litera"]},
{palabra:"Lámpara",similares:["Linterna","Vela","Faro"]},
{palabra:"Silla",similares:["Taburete","Sillón","Trono"]}
],

"Animales":[
{palabra:"León",similares:["Tigre","Leopardo","Puma"]},
{palabra:"Delfín",similares:["Tiburón","Ballena","Orca"]},
{palabra:"Águila",similares:["Halcón","Búho","Cóndor"]},
{palabra:"Perro",similares:["Lobo","Zorro","Hiena"]},
{palabra:"Gato",similares:["Lince","Pantera","Tigre"]}
]

}

function actualizarJugadores(){

let lista=document.getElementById("listaJugadores")
lista.innerHTML=""

jugadores.forEach(j=>{

let li=document.createElement("li")
li.innerText=j.nombre
lista.appendChild(li)

})

}

function crearSala(){

miNombre=document.getElementById("nombre").value

codigoSala=Math.floor(Math.random()*90000+10000).toString()

peer=new Peer(codigoSala)

esHost=true

peer.on("open",id=>{

document.getElementById("menu").classList.add("hidden")
document.getElementById("sala").classList.remove("hidden")

document.getElementById("codigo").innerText=id

jugadores.push({nombre:miNombre,id:peer.id})

actualizarJugadores()

})

peer.on("connection",connection=>{

conexiones.push(connection)

connection.on("data",data=>{

if(data.tipo==="unirse"){

jugadores.push(data.jugador)

actualizarJugadores()

broadcast({
tipo:"jugadores",
jugadores:jugadores
})

}

if(data.tipo==="voto"){

recibirVoto(data)

}

})

})

}

function unirseSala(){

miNombre=document.getElementById("nombre").value
codigoSala=document.getElementById("codigoSala").value

peer=new Peer()

peer.on("open",id=>{

conn=peer.connect(codigoSala)

conn.on("open",()=>{

conn.send({
tipo:"unirse",
jugador:{nombre:miNombre,id:id}
})

})

conn.on("data",data=>{

if(data.tipo==="jugadores"){

jugadores=data.jugadores

document.getElementById("menu").classList.add("hidden")
document.getElementById("sala").classList.remove("hidden")

document.getElementById("codigo").innerText=codigoSala

actualizarJugadores()

}

if(data.tipo==="inicio"){

recibirInicio(data)

}

if(data.tipo==="votacion"){

mostrarVotacion(data)

}

})

})

}

function broadcast(data){

conexiones.forEach(c=>c.send(data))

}

function iniciarJuego(){

let categoriasKeys=Object.keys(categorias)

let categoria=categoriasKeys[Math.floor(Math.random()*categoriasKeys.length)]

let lista=categorias[categoria]

let seleccion=lista[Math.floor(Math.random()*lista.length)]

let palabra=seleccion.palabra

let similares=seleccion.similares

let numJugadores=jugadores.length

let numImpostores=1

if(numJugadores>=6) numImpostores=2

let impostores=[]

while(impostores.length<numImpostores){

let r=Math.floor(Math.random()*jugadores.length)

if(!impostores.includes(r)) impostores.push(r)

}

jugadores.forEach((j,i)=>{

let rol="inocente"
let palabraJugador=palabra

if(impostores.includes(i)){

rol="impostor"

palabraJugador=similares[Math.floor(Math.random()*similares.length)]

}

if(j.id===peer.id){

mostrarMiRol(categoria,palabraJugador,rol)

}else{

let conexion=conexiones.find(c=>c.peer===j.id)

conexion.send({

tipo:"inicio",
categoria:categoria,
palabra:palabraJugador,
rol:rol,
jugadores:jugadores

})

}

})

broadcast({

tipo:"votacion",
jugadores:jugadores

})

}

function recibirInicio(data){

mostrarMiRol(data.categoria,data.palabra,data.rol)

jugadores=data.jugadores

}

function mostrarMiRol(cat,palabra,rol){

document.getElementById("sala").classList.add("hidden")
document.getElementById("juego").classList.remove("hidden")

document.getElementById("categoria").innerText="Categoría: "+cat

document.getElementById("infoJugador").innerHTML=

"<h3>"+rol+"</h3>" +
"<h2>"+palabra+"</h2>"

}

function mostrarVotacion(data){

let div=document.getElementById("votacion")
div.innerHTML=""

data.jugadores.forEach(j=>{

let b=document.createElement("button")
b.innerText=j.nombre

b.onclick=()=>votar(j)

div.appendChild(b)

})

}

function votar(j){

if(esHost){

recibirVoto({
jugador:j
})

}else{

conn.send({
tipo:"voto",
jugador:j
})

}

}

let votos={}

function recibirVoto(data){

let nombre=data.jugador.nombre

if(!votos[nombre]) votos[nombre]=0

votos[nombre]++

setTimeout(resolverVotos,2000)

}

function resolverVotos(){

let max=0
let eliminado=""

for(let j in votos){

if(votos[j]>max){

max=votos[j]
eliminado=j

}

}

alert("Eliminado: "+eliminado)

votos={}

}