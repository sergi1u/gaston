var PIDE_DESAFIO = 1;
var AUTENTICA_USER = 2;
var CAMBIA_PASSWORD = 3;
var NUEVO_USUARIO = 4;

function gestionaUsuario(desafio){
	autenticaUsuario(desafio);
}

function autenticaUsuario(desafio){

	var usuario	= document.getElementById("txt_usuario").value;
	var password	= document.getElementById("txt_password").value;
	var password2	= document.getElementById("txt_password2").value;
	// Confirma password en cambio de password
	var password3	= document.getElementById("txt_password3").value;
	// Confirma password de usuario nuevo
	var password4	= document.getElementById("txt_password4").value;
	var email	= document.getElementById("txt_email").value;
	var nombre	= document.getElementById("txt_nombre").value;
	var tipo_envio	= AUTENTICA_USER;		// identificaciÃ³n de usuario
	var shaPassword;

	if ( usuario == "" ){
		alert("Introduce el identificador de usuario.");
		return;
	}
	if ( password == "" ){
		alert("Introduce la contraseÃ±a.");
		return;
	}

	// Se estÃ¡ se estÃ¡ aÃ±adiendo usuario
	if( password2 != "" && password2 === password3 ){
		tipo_envio = CAMBIA_PASSWORD;
	}
	else if( password2 != "") {
		alert("No coincide la contraseÃ±a nueva con la de verificaciÃ³n");
		return;
	}

	// si se estÃ¡ creando usuario nuevo
	if( password4 != "" && password === password4  ){
		if ( desafio == "" )
			tipo_envio = NUEVO_USUARIO;
		else
			tipo_envio = AUTENTICA_USER;	// Ya se ha creado y ahora registro el desafio
	}
	else if( password4 != ""){
		alert("No coincide la contraseÃ±a con la de verificaciÃ³n");
		return;
	}

	shaPassword = sha1( password );
	if( document.getElementById("chkGuardaPassword").checked )
		window.localStorage.setItem("gaston_pass", shaPassword);
	else
		window.localStorage.removeItem("gaston_pass");

	document.getElementById("btn_enviar").disabled=true;

	window.localStorage.setItem("gaston_usuario", usuario);

	if( tipo_envio == NUEVO_USUARIO ){
		var datos2 = "&email=" + email + "&nombre=" + nombre;
		enviaDatos( NUEVO_USUARIO, usuario, sha1(password) , datos2 );
	}

	if( desafio == "" && tipo_envio != NUEVO_USUARIO ){
		enviaDatos( PIDE_DESAFIO, usuario, null );
	}
	if( desafio == "" && tipo_envio == NUEVO_USUARIO ){
		//enviaDatos( PIDE_DESAFIO, usuario, null );
	}

	if( desafio != "" && tipo_envio == AUTENTICA_USER ){
		var respuesta = sha1(usuario+desafio+shaPassword);

		window.localStorage.setItem("gaston_respuesta_desafio", respuesta);
		enviaDatos(  AUTENTICA_USER, usuario, respuesta );
	}

	else if( desafio != "" && tipo_envio == CAMBIA_PASSWORD ){
		var respuesta = sha1(usuario+desafio+shaPassword);

		window.localStorage.setItem("gaston_respuesta_desafio", respuesta);
		enviaDatos(  CAMBIA_PASSWORD, usuario, respuesta, sha1(password2) );
	}

	document.getElementById("btn_enviar").disabled=false;

}


function cambia_password(){
	var eDiv = document.getElementById("div_ocultable1");

	document.getElementById("span_activa_cambia_pass").style.display="none";
	document.getElementById("span_activa_creacion").style.display="none";

	eDiv.style.display="inline";
	
}

function activa_creacion(){
	var eDiv = document.getElementById("div_ocultable2");

	document.getElementById("span_activa_cambia_pass").style.display="none";
	document.getElementById("span_activa_creacion").style.display="none";

	eDiv.style.display="inline";
	
}

/*+++++++++++++++++++*/



function debug( msg ){
	ediv = document.getElementById("debug");
	ediv.innerHTML = msg;
}

// Genera un XMLHttpRequest para enviar peticiones POST
function enviaDatos( tipo_peticion , usuario, datos, datos2)
{
	var param_post = "";

	var xhr = new XMLHttpRequest();
	if ( typeof xhr.withCredentials === undefined ){
		return false;
	}

	xhr.onerror = function(e){
		debug( "Error en peticiÃ³n de datos." );
	}

	xhr.onprogress = function(e){
		var ratio = e.loaded / e.total;
		//debug( ratio + "% descargado." );
	}

	// Se han recibido los datos solicitados
	xhr.onload = function(e){
		//debug( "Datos recibidos" );
		recibidoRespuesta(e, xhr);
	}

	xhr.open("POST", "json/autentica.php", true);

	if( tipo_peticion === NUEVO_USUARIO ){
		debug("Creando usuario...");
		param_post  = "tipo=" + NUEVO_USUARIO;
		param_post += "&usuario=" + usuario;
		param_post += "&shaPassword=" + datos;
		param_post += datos2;
	}
	else if( tipo_peticion === PIDE_DESAFIO ){
		debug("Solicitando desafio...");
		param_post  = "tipo=" + PIDE_DESAFIO;
		param_post += "&usuario=" + usuario;
	}
	else if( tipo_peticion === AUTENTICA_USER ){
		debug("Solicitando autenticaci&oacute;n...");
		param_post  = "tipo=" + AUTENTICA_USER;
		param_post += "&usuario=" + usuario;
		param_post += "&respuesta=" + datos;
	}
	else if( tipo_peticion === CAMBIA_PASSWORD ){
		debug("Solicitando cambio de contrase&ntilde;a...");
		param_post  = "tipo=" + CAMBIA_PASSWORD;
		param_post += "&usuario=" + usuario;
		param_post += "&respuesta=" + datos;
		param_post += "&nueva_pass=" + datos2;
	}
	else
		return;

	xhr.setRequestHeader ('Content-type','application/x-www-form-urlencoded')
	xhr.send( param_post );

}


function recibidoRespuesta(e, xhr)
{
	var aRespuesta = JSON.parse(xhr.responseText);
	if( aRespuesta.length != 2){
		debug( "La peticiÃ³n al servidor no ha obtenido respuesta." );
		return;
	}

	// Si hemos recibido un desafio lo respondemos
	if( aRespuesta[0] == PIDE_DESAFIO && aRespuesta[1] != ""){
		desafio = aRespuesta[1];
		debug( "Recibido desafio: " + aRespuesta[1] );
		autenticaUsuario( aRespuesta[1] )
	}
	else if( aRespuesta[0] == NUEVO_USUARIO && aRespuesta[1] != ""){
		desafio = aRespuesta[1];
		debug( "Recibido desafio para usuario nuevo: " + aRespuesta[1] );
		autenticaUsuario( aRespuesta[1] )
	}
	else if( aRespuesta[0] == AUTENTICA_USER &&  aRespuesta[1] > 0){
		window.localStorage.setItem("gaston_id_usuario", aRespuesta[1]);
		debug( "Usuario " + aRespuesta[1] + " confirmado.");
		// redirecciona la URL hacia nuevo apunete
		window.location.assign("index.html");
	}
	else if( aRespuesta[0] == CAMBIA_PASSWORD &&  aRespuesta[1] > 0){
		window.localStorage.setItem("gaston_id_usuario", aRespuesta[1]);
		debug( "Contrase&ntilde;a de usuario " + aRespuesta[1] + " modificada.");
		// redirecciona la URL hacia nuevo apunete
		window.location.assign("index.html");
	}
	else
		debug( "Error: " + aRespuesta[0] + " " + aRespuesta[1] );

	//	window.localStorage.motivosGasto = JSON.stringify(global_aMotivos);

}
