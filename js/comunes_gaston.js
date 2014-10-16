var PIDE_DESAFIO = 1;
var AUTENTICA_USER = 2;

var funcionExterna = null;

function pideAutenticacion( funcionLocal ){
	funcionExterna = funcionLocal;
	autenticaUsuario("");
}

function autenticaUsuario( desafio )
{

	var usuario = window.localStorage.getItem("gaston_usuario");
	var shaPassword = window.localStorage.getItem("gaston_pass");

	if( usuario == "" || shaPassword == null )
		return;

	if( desafio == "" )
		enviaDatos( PIDE_DESAFIO, usuario, null );
	else{
		var respuesta = sha1(usuario+desafio+shaPassword);

		window.localStorage.setItem("gaston_respuesta_desafio", respuesta);
		enviaDatos(  AUTENTICA_USER, usuario, respuesta );
	}


}

// Genera un XMLHttpRequest para enviar peticiones POST pidiendo desafio o enviando autenticacion
function enviaDatos( tipo_peticion , usuario, respuesta_desafio)
{
	var param_post = "";

	var xhr = new XMLHttpRequest();
	if ( typeof xhr.withCredentials === undefined ){
		return false;
	}

	xhr.onerror = function(e){
		alert( "Error en peticiÃ³n de datos." );
	}

	xhr.onprogress = function(e){
		var ratio = e.loaded / e.total;
		//debug( ratio + "% descargado." );
	}

	// Se han recibido los datos solicitados
	xhr.onload = function(e){
		//debug( "Datos recibidos" );
		respuestaAutenticacion(e, xhr);
	}

	xhr.open("POST", "json/autentica.php", true);

	if( tipo_peticion === PIDE_DESAFIO ){
		//alert("Solicitando desafio...");
		param_post  = "tipo=" + tipo_peticion;
		param_post += "&usuario=" + usuario;
	}
	else if( tipo_peticion === AUTENTICA_USER ){
		//alert("Solicitando autenticaci&oacute;n...");
		param_post  = "tipo=" + tipo_peticion;
		param_post += "&usuario=" + usuario;
		param_post += "&respuesta=" + respuesta_desafio;
	}
	else
		return;

	xhr.setRequestHeader ('Content-type','application/x-www-form-urlencoded')
	xhr.send( param_post );

}


function respuestaAutenticacion(e, xhr)
{
	var aRespuesta = JSON.parse(xhr.responseText);
	if( aRespuesta.length != 2){
		alert( "La peticiÃ³n al servidor no ha obtenido respuesta." );
		return;
	}

	// Si hemos recibido un desafio lo respondemos
	if( aRespuesta[0] == PIDE_DESAFIO && aRespuesta[1] != ""){
		desafio = aRespuesta[1];
		//alert( "Recibido desafio: " + aRespuesta[1] );
		autenticaUsuario( aRespuesta[1] )
	}
	else if( aRespuesta[0] == AUTENTICA_USER &&  aRespuesta[1] > 0){
		window.localStorage.setItem("gaston_id_usuario", aRespuesta[1]);
		//alert( "Usuario " + aRespuesta[1] + " confirmado.");
		if ( funcionExterna != null )
			funcionExterna();
	}
	else
		alert( "Error: " + aRespuesta[0] + " " + aRespuesta[1] );

	//	window.localStorage.motivosGasto = JSON.stringify(global_aMotivos);

}

