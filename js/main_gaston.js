/*
  Funciones principales que utiliza la webApp gaston
*/

// Variables globales
var global_aMotivos = Array();	// Motivos de gasto habituales del usuario
//var id_usuario		= "";
var ignoraGeo		= false;
var archivoLocal	= false;
var geo_disponible	= false;
var ajax_disponible	= false;

var peticionesAutenticacion=0;

window.addEventListener("load",inicializa,true);

function debug(msg){
	var status = document.getElementById("status");
	status.innerHTML =  msg;
}

function inicializa(){
	
	var apunte    = gup( "id_apunte" );
	var latitude  = gup( "latitude" );
	var longitude = gup( "longitude" );

	// Se pone a 1 si se pasa geoLocalizaciÃ³n por parÃ¡metros
	window.localStorage.setItem("geoMaual","0");

	//if ( apunte == "" )		
	//	var apunte = "0";	// Si no lo encuentro pongo el id a piÃ±Ã³n

	if( isNumeric(latitude) && isNumeric(longitude) ){
		document.getElementById("span_latitude").innerHTML = latitude;
		document.getElementById("span_longitude").innerHTML = longitude;
		document.getElementById("span_accuracy").innerHTML = "1";
		window.localStorage.setItem("geoMaual","1");
	}

	//id_usuario = "4";	// de momento pongo el id a piÃ±Ã³n
	peticionesAutenticacion=0;
	var id_usuario = window.localStorage.getItem("gaston_id_usuario");

	archivoLocal = testLocalStorage();
	informaArchivo( archivoLocal );

	if ( archivoLocal ){
		// Si se ha de ignorar la GeolocalizaciÃ³n lo aviso en el check
		ignoraGeo = informaChkIgnoraGeo();
	}

	setFechaActual();

	// Cuando cambiamos el motivo del SELECT modifica los valores INPUT de motivo e importe
	document.getElementById("selectMotivos").addEventListener("change",
		function(e){
			// Si el Select contiene elementos...
			if(e.target.length > 0 && e.target.selectedIndex > 0){	
				document.getElementById("txt_motivo").value =
					 e.target.options[e.target.selectedIndex].text;

				if( global_aMotivos[e.target.selectedIndex][2] > 0
				 && document.getElementById("txt_importe").value == ""){
					document.getElementById("txt_importe").value =
					 global_aMotivos[e.target.selectedIndex][2];
				}

			}
		}
		, true);

	// Variaciones en el check de ingorar geolocalizaciÃ³n
	document.getElementById("chkIgnoraGeo").addEventListener("change",
		function(e){
			ignoraGeo = document.getElementById("chkIgnoraGeo").checked;
			if ( archivoLocal ){
				window.sessionStorage.setItem('ignoraGeo', ignoraGeo );
			}
			if( !ignoraGeo ){
				geo_disponible = geoLocalizacion();
				informaGeo( geo_disponible );
			}
			else{
				document.getElementById("span_latitude").innerHTML = "?";
				document.getElementById("span_longitude").innerHTML= "?";
				document.getElementById("span_accuracy").innerHTML = "?";
				document.getElementById("span_antiguedad").innerHTML= "?";
			}

		}
		, true);


	// Boton para resetear el formulario a la fecha / hora actual
	document.getElementById("btnAhora").addEventListener("click", setFechaActual, true );

	// BotÃ³n grabaciÃ³n apunte de gasto
	document.getElementById("btnGrabaApunte").addEventListener("click", function(){
		 		grabaApunte();
				}, true );

	// Boton de gestiÃ³n de motivos de gasto
	document.getElementById("btnMotivos").addEventListener("click", gestionMotivos, true );

	// BotÃ³n reenvia apuntes pendientes de grabar
	document.getElementById("btnReenvia").addEventListener("click", function(){
		 		reenviaPendiente();
				}, true );

	// BotÃ³n refresco geolocalizacion
	document.getElementById("btnRefrescaGeo").addEventListener("click", function(){
				window.localStorage.setItem("geoMaual","0");
		 		if( !ignoraGeo ){
					geo_disponible = geoLocalizacion();
					informaGeo( geo_disponible );
				}
				}, true );

	// BotÃ³n creacion manual de geolocalizacion
	document.getElementById("btnGeoManual").addEventListener("click", function(){
					geoManual( geo_disponible );
				}, true );

	informaUsuario();
	// AquÃ­ tendrÃ­a que autenticarme si todavÃ­a no lo estoy.....

	ajax_disponible = peticionesAjax( id_usuario );
	informaAjax( ajax_disponible );

	if( !ignoraGeo && window.localStorage.getItem("geoMaual") != "1" )
		geo_disponible = geoLocalizacion();

	informaGeo( geo_disponible );
	
	informaEnviosPendientes();

	// Si se ha pasado por parÃ¡metro el id de un gasto existente, relleno el formulario con sus datos
	if ( apunte != "" )
		recuperaApunte( apunte );

}

function geoManual(){
	var id_apunte  = document.getElementById("txt_id").value;
	var latitude = document.getElementById("span_latitude").innerHTML;
	var longitude = document.getElementById("span_longitude").innerHTML;
	window.location.assign("geoManual.html?id_apunte=" + id_apunte + "&latitude=" + latitude + "&longitude=" + longitude);
}

function recuperaApunte( apunte )
{
	var id_usuario = window.localStorage.getItem("gaston_id_usuario");
	var respuesta_desafio = window.localStorage.getItem("gaston_respuesta_desafio");

	if ( respuesta_desafio == "" )
		return -1;

	// Datos de comprobaciÃ³n de usuario
	param_post = "id_usuario=" + id_usuario;
	param_post += "&respuesta_desafio=" + respuesta_desafio;
	param_post += "&id_marcador=" + apunte;


	var xhr = new XMLHttpRequest();
	xhr.onerror = function(e){
		debug( "Error enviando formulario." );
	}

	xhr.onprogress = function(e){
		var ratio = e.loaded / e.total;
		//debug( ratio + "% descargado." );
	}

	// Se han recibido los datos solicitados
	xhr.onload = function(e){
		retorno_recuperaApunte(e, xhr);
	}

	xhr.open("POST", "xml/listaGastosUsuario.php", true);


	// Envia el formulario
	xhr.setRequestHeader ('Content-type','application/x-www-form-urlencoded')
	xhr.send( param_post );

}	// fin  recuperaApunte( apunte )

function retorno_recuperaApunte(e, xhr)
{

	var xml = xhr.responseXML;

	var aError = xml.getElementsByTagName("error");
	if( aError.length > 0 ){
		alert (aError[0].getAttribute("id") + " " + aError[0].getAttribute("motivo"));
		// Si hay sesion caducada pero aun mantego los datos de usuario, me reconecto
		if ( aError[0].getAttribute("id") == -3					&&
			 	window.localStorage.getItem("gaston_usuario") != ""	&&
				window.localStorage.getItem("pass") != ""){
			pideAutenticacion( null );
		}
		return;
	}

	var aGastos = xml.getElementsByTagName("gasto");

	if( aGastos.length == 0 )
		return;

	document.getElementById("span_tipo_apunte").innerHTML = "Modificaci&oacute;n de apunte"
	document.getElementById("txt_id").value = aGastos[0].getAttribute("id");
	document.getElementById("txt_importe").value = aGastos[0].getAttribute("importe");
	document.getElementById("txt_motivo").value = aGastos[0].getAttribute("motivo");
	setFecha( aGastos[0].getAttribute("fecha") );

	if ( window.localStorage.getItem("geoMaual") != "1" ){
		document.getElementById("span_latitude").innerText = aGastos[0].getAttribute("geo_latitude");
		document.getElementById("span_longitude").innerText = aGastos[0].getAttribute("geo_longitude");
		document.getElementById("span_accuracy").innerText = aGastos[0].getAttribute("geo_accuracy");
	}
	document.getElementById("span_antiguedad").innerText = "?";


}	// fin retorno_recuperaApunte(e, xhr);

function grabaApunte()
{

	var id_usuario = window.localStorage.getItem("gaston_id_usuario");

	// Comprueba que los datos del formulario sean coherentes.
	var importe = document.getElementById("txt_importe").value;
	var motivo  = document.getElementById("txt_motivo").value;
	var num_envio = 0;
	var param_post = "";	// POST con parametros para enviar

	if ( id_usuario == "" ){
		alert("No hay sesi&oacute;n de usuario. Es necesario identificarse.");
		return false;
	}
	if ( !isNumeric( importe ) ){
		alert("Importe ha de contener un valor numÃ©rico");
		return false;
	}

	motivo = trim( motivo );
	if( motivo.length === 0 ){
		alert("El motivo esta en vacÃ­o");
		return false;
	}

	var id_apunte  = document.getElementById("txt_id").value;
	var dia  = document.getElementById("txt_fecha").value;
	var hora = document.getElementById("txt_hora").value;
	//var fecha = fecha2date( dia, hora );
	var fecha = dia + " " + hora;

	// desactiva el botÃ³n para evitar los doble-clicks
	document.getElementById("btnGrabaApunte").disabled= true;

	param_post = "id_usuario=" + id_usuario;
	param_post += "&id_apunte=" + id_apunte;
	param_post += "&importe=" + importe;
	param_post += "&motivo=" + motivo;
	param_post += "&fecha=" + fecha;

	// Datos de geolocalizacion
	if( !ignoraGeo ){
		param_post += "&latitude=" + document.getElementById("span_latitude").innerHTML;
		param_post += "&longitude=" + document.getElementById("span_longitude").innerHTML;
		param_post += "&accuracy=" + document.getElementById("span_accuracy").innerHTML;
		//param_post += "&antiguedad=" + document.getElementById("span_antiguedad").innerHTML;
	}


	// limpia el formulario enviar lo mismo 2 veces
	reseteaCampos();

	num_envio = window.localStorage.getItem("num_envio");
	if ( num_envio === null )
		num_envio = 0;
	else
		num_envio++;
	window.localStorage.setItem("num_envio",num_envio);
	param_post += "&num_envio=" + num_envio;

	// Graba el formulario en el bloque de pendientes
	var aPendientes;
	var jsonPendientes = window.localStorage.getItem("enviosPendientes");
	aPendientes = new Array();
	if ( jsonPendientes ){
		aPendientes = JSON.parse( jsonPendientes );
	}

	aPendientes.push(param_post);

	window.localStorage.enviosPendientes = JSON.stringify(aPendientes);
	informaEnviosPendientes();

	enviaXhr( param_post );
}

function reenviaPendiente()
{
	peticionesAutenticacion++;
	if( peticionesAutenticacion > 2 ){
		alert("Error. Se han pedido datos 3 veces sin exito.");
		return;
	}

	var jsonPendientes = window.localStorage.getItem("enviosPendientes");
	var param_post = "";

	aPendientes =  JSON.parse( jsonPendientes );
	if( aPendientes === null || aPendientes.length == 0 )
		return;
	else{
		param_post = aPendientes.pop();
		//alert("Enviando: " + param_post);
		enviaXhr( param_post );
	}
}

function enviaXhr( param_post )
{

	var respuesta_desafio = window.localStorage.getItem("gaston_respuesta_desafio");

	if ( respuesta_desafio == "" )
		return -1;

	// Datos de comprobaciÃ³n de usuario
	param_post += "&respuesta_desafio=" + respuesta_desafio;


	var xhr = new XMLHttpRequest();
	xhr.onerror = function(e){
		debug( "Error enviando formulario." );
	}

	xhr.onprogress = function(e){
		var ratio = e.loaded / e.total;
		//debug( ratio + "% descargado." );
	}

	// Se han recibido los datos solicitados
	xhr.onload = function(e){
		retorno_grabaDatos(e, xhr);
	}

	xhr.open("POST", "json/grabaGasto.php", true);


	// Envia el formulario
	xhr.setRequestHeader ('Content-type','application/x-www-form-urlencoded')
	xhr.send( param_post );

}


function retorno_grabaDatos(e, xhr)
{
	var aRespuesta = JSON.parse(xhr.responseText);
	if(aRespuesta.length == 0){
		debug( "La grabaciÃ³n de gasto no ha devuelto datos de resultado" );
	}
	else if ( aRespuesta[0] < 0 ){
		debug( "La grabaciÃ³n de gasto ha fallado: " + aRespuesta[1]);
		// SesiÃ³n caducada
		if ( aRespuesta[0] == "-3" )
			pideAutenticacion( reenviaPendiente );  // reintenta autenticarse
	}
	else{
		debug( "Grabado gasto id " + aRespuesta[0] );
		eliminaEnvioPendiente( aRespuesta[0] );
		var pendientes = informaEnviosPendientes();

		//como que la cosa ha ido bien, me motivo y envio lo pendiente...
		if (pendientes > 0 )
			reenviaPendiente();

	}
}	// fin retorno_grabaDatos()


function peticionesAjax( id_usuario )
{

	if ( id_usuario == "" ){
		alert("No hay id de usuario");
		return;
	}


	pide_motivos( id_usuario );


	return true;
}

// Actualiza el Select con los motivos de gasto
function pide_motivos( id_usuario )
{
	var param_post = "";

	var xhr = new XMLHttpRequest();
	if ( typeof xhr.withCredentials === undefined ){
		return false;
	}

		xhr.onerror = function(e){
			debug( "Error en peticiÃ³n de datos." );

			// intento recuperar los motivos del localStorage
			var jsonPendientes = window.localStorage.getItem("motivosGasto");
			if ( jsonPendientes ){
				global_aMotivos =  JSON.parse( jsonPendientes );
				rellenaSelectMotivos( );
			}

		}

		xhr.onprogress = function(e){
			var ratio = e.loaded / e.total;
			//debug( ratio + "% descargado." );
		}

		// Se han recibido los datos solicitados
		xhr.onload = function(e){
			//debug( "Datos recibidos" );
			recibidoMotivosGasto(e, xhr);
		}


		// formData no funciona con versiones Android < 3
		//formData = new FormData();
  		//formData.append('username', 'johndoe');
		//xhr.send(formData);

		param_post = "txt_motivo=" + document.getElementById("txt_motivo").value;
		param_post += "&id_usuario=" + id_usuario;

		xhr.open("POST", "json/listaMotivos.php", true);
		xhr.setRequestHeader ('Content-type','application/x-www-form-urlencoded')
		xhr.send( param_post );

}


function recibidoMotivosGasto(e, xhr)
{
	global_aMotivos = JSON.parse(xhr.responseText);
	if(global_aMotivos.length == 0){
		debug( "El listado de motivos no contiene datos" );
	}
	else{
		rellenaSelectMotivos();
		if( archivoLocal )
			window.localStorage.motivosGasto = JSON.stringify(global_aMotivos);

	}
}

function rellenaSelectMotivos( )
{
	var eSelect = document.getElementById("selectMotivos");
	while ( eSelect.length != 0 )
		eSelect.remove(eSelect.length-1);

	if( global_aMotivos.length > 0 && global_aMotivos[0][0] != 0 )
		global_aMotivos.unshift( new Array(0,"Elige motivo...","") );

	for (var i=0; i<global_aMotivos.length; i++){
		var opt = document.createElement("option");
		opt.text = global_aMotivos[i][1];
		opt.value = global_aMotivos[i][0];
		eSelect.add(opt);
	}

}

function geoLocalizacion()
{
	// GeolocalizaciÃ³n
	if(! navigator.geolocation)
		return false;

	navigator.geolocation.getCurrentPosition(updateLocation, handleLocationError,
			{enableHighAccuracy:true,maximunAge:10000,timeout:10000});

	return true;
}

// Se ha obtenido nueva geolocalizaciÃ³n
function updateLocation( position ){

	var latitude = position.coords.latitude;
	var longitude = position.coords.longitude;
	var accuracy = position.coords.accuracy;
	var timestamp = position.timestamp;

	//var antiguedadMedida =  Math.round( ( (new Date).getTime() - timestamp ) / 1000 );
	var date = new Date(timestamp);
	var antiguedad =  date2Fecha( date ) + " " + date2Hora(date);

	document.getElementById("span_latitude").innerHTML = Math.round(latitude * 100000)/100000;
	document.getElementById("span_longitude").innerHTML = Math.round(longitude * 100000)/100000;
	document.getElementById("span_accuracy").innerHTML = accuracy;
	document.getElementById("span_antiguedad").innerHTML = antiguedad;


}	// fin updateLocation


// Gestiona los errores de geolocalizaciÃ³n
function handleLocationError( error )
{

	switch( error.code ){
	case 0:
		debug("Error en <strong>GeolocalizaciÃ³n</strong>: " + error.message);
	break;

	case 1:
		debug("Error en <strong>GeolocalizaciÃ³n</strong>. Bloqueada por usuario");
	break;

	case 2:
		debug("Error de navegador en <strong>GeolocalizaciÃ³n</strong>: " + error.message);
	break;

	case 3:
		debug("Error en <strong>GeolocalizaciÃ³n</strong>: error de timeout");
	break;
	}
	
}	// fin handleLocationError




function setFecha( fecha_millis){
	var date = new Date( fecha_millis );
	window.sessionStorage.fecha = date.getTime();

	document.getElementById("txt_fecha").value = date2Fecha( date );
	document.getElementById("txt_hora").value = date2Hora( date );
}

function setFechaActual(){
	var date = new Date();
	window.sessionStorage.fecha = date.getTime();

	document.getElementById("txt_fecha").value = date2Fecha( date );
	document.getElementById("txt_hora").value = date2Hora( date );
}

function reseteaCampos()
{
	document.getElementById("span_tipo_apunte").innerHTML = "Nuevo apunte";
	document.getElementById("txt_id").value = "";
	document.getElementById("txt_importe").value = "";
	document.getElementById("txt_motivo").value = "";
	document.getElementById("selectMotivos").selectedIndex=0;
	setFechaActual();
	document.getElementById("btnGrabaApunte").disabled= false;

}

function eliminaEnvioPendiente( num_envio )
{
	var aPendientes;
	var jsonPendientes = window.localStorage.getItem("enviosPendientes");
	var enviosPendientes = 0;

	aPendientes =  JSON.parse( jsonPendientes );
	if( aPendientes === null )
		debug("Error borrando envio de lista de pendientes.");
	else{
		var parametro = "num_envio=" + num_envio
	
		// busca el envio y lo elimina de la lista de pendientes.
		var envio, indx;
		var n=0;
		while ( n < aPendientes.length ){
			envio = aPendientes[n];
			indx = envio.indexOf( parametro );
			if ( indx > -1 ){
				aPendientes.splice(n,1);	// elimina el elemento
				window.localStorage.enviosPendientes = JSON.stringify(aPendientes);
				break;
			}
			n++;
		}

	}

}

/**********************************/
function testLocalStorage()
{

	if( window.sessionStorage && window.localStorage){
		return true;
	}
	else{
		return false;
	}
}

function informaUsuario(  ){
	var usuario = window.localStorage.getItem("gaston_usuario");

	if ( usuario == "" )
		document.getElementById("span_usuario").innerHTML = "---";
	else
		document.getElementById("span_usuario").innerHTML = usuario;

	return usuario;
}

function informaAjax( disponible ){
	if( disponible )
		document.getElementById("span_ajax").innerHTML = "SI";
	else
		document.getElementById("span_ajax").innerHTML = "NO";
}

function informaGeo( disponible ){
	if( disponible )
		document.getElementById("span_geo_disponible").innerHTML = "SI";
	else
		document.getElementById("span_geo_disponible").innerHTML = "NO";
}

function informaArchivo( disponible ){
	if( disponible )
		document.getElementById("span_localStorage").innerHTML = "SI";
	else
		document.getElementById("span_localStorage").innerHTML = "NO";
}

function informaChkIgnoraGeo(){
	if( window.sessionStorage.getItem("ignoraGeo") == "true" ){
		document.getElementById("chkIgnoraGeo").checked=true;
		return true;
	}
	else
		document.getElementById("chkIgnoraGeo").checked=false;

	return false;
}

// Indica los envios pendientes y devuelve ese valor como integer
function informaEnviosPendientes()
{
	var aPendientes;
	var jsonPendientes = window.localStorage.getItem("enviosPendientes");
	var enviosPendientes = 0;

	aPendientes =  JSON.parse( jsonPendientes );
	if( aPendientes === null )
		document.getElementById("txt_envios_pendientes").innerText = "--";
	else{
		enviosPendientes = aPendientes.length;
		document.getElementById("txt_envios_pendientes").innerText = enviosPendientes;
	}

	return enviosPendientes;
}


/**********************************/
