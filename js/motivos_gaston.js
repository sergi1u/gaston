// tipos de accion que se pide al enviar motivo
var INSERTA	= 1;
var ACTUALIZA	= 2;
var BORRA	= 3;

function gestionMotivos()
{


	var elemPadre = document.getElementById( "principal" );
	var elemVentana = creaVentana ( elemPadre, "lista_motivos" );

	//styleVentana( elemVentana );

	elemVentana.innerHTML = rellenaHTML();

	elemPadre.appendChild(elemVentana);

}

function rellenaHTML()
{
	var txt = "";

	var jsonMotivos = window.localStorage.getItem("motivosGasto");
	var aMotivos = JSON.parse( jsonMotivos );
	if ( aMotivos === null )
		aMotivos = new Array();

	txt  = "<a href=\"javascript:cierraVentana('lista_motivos');\">X Cerrar</a>";
	txt += "<br />";

	var idMotivo = "";
	var i = 1;		// se salta el primer motivo que es "Elige motivo..."
	while ( i <  aMotivos.length ){
		idMotivo =  aMotivos[i][0];
		txt += "<input type=\"text\" size=\"20\" id=\"txtMotivo" + idMotivo + "\"";
		txt += " value=\"" + aMotivos[i][1] + "\" />";

		txt += "<input size=\"6\" type=\"number\" id=\"importeMotivo" + idMotivo + "\"";
		txt += " value=\"" + aMotivos[i][2] + "\" />";

		txt += "<input type=\"button\" name=\"btnEnviaMotivo" + idMotivo + "\"";
		txt += " value=\"Env&iacute;a\"";
		txt += " onclick=\"javascript:enviaMotivo(" + ACTUALIZA + "," + idMotivo + ");\" />";

		txt += "<input type=\"button\" name=\"btnBorraMotivo" + idMotivo + "\"";
		txt += " onclick=\"javascript:enviaMotivo(" + BORRA + "," + idMotivo + ");\"";
		txt += " value=\"Borra\" />";

		txt += "<br />";

		i++;
	}

	// OpciÃ³n de creaciÃ³n de nuevo apunte
	txt += "<input type=\"text\" size=\"20\" id=\"txtMotivo0\" value=\"\" />";
	txt += "<input type=\"number\" size=\"6\" id=\"importeMotivo0\" value=\"\" />";

	txt += "<input type=\"button\" name=\"btnMotivo0\" value=\"Crea\"" ;
	txt += " onclick=\"javascript:enviaMotivo(INSERTA, 0);\" />";
	return txt;
}


// Envia un motivo para modificarlo en la base de datos. Si el idMotivo es igual a 0, lo crea
function enviaMotivo( accion, idMotivo )
{

	if( accion == BORRA ){
		var resp = confirm("Â¿ Quieres borrar el motivo " +  document.getElementById("txtMotivo" + idMotivo ).value + " ?" );
	
		if( !resp )
			return;
	}

	var xhr = new XMLHttpRequest();
	if ( typeof xhr.withCredentials === undefined ){
		alert("Este navegador no acepta envios XML!");
		return false;
	}

	var id_usuario = window.localStorage.getItem("gaston_id_usuario");
	var respuesta_desafio = window.localStorage.getItem("gaston_respuesta_desafio");

	var motivo	= document.getElementById("txtMotivo" + idMotivo ).value;
	var importe	= document.getElementById("importeMotivo" + idMotivo ).value;

	var param_post = "";

	if ( id_usuario == "" || respuesta_desafio == ""){
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

	xhr.onerror = function(e){
		alert( "Error en peticiÃ³n de datos." );
	}

	xhr.onprogress = function(e){
		var ratio = e.loaded / e.total;
		//debug( ratio + "% descargado." );
	}

	// Se han recibido los datos solicitados
	xhr.onload = function(e){
		respuestaEnviaMotivo(e, xhr);
	}

	xhr.open("POST", "json/modificaMotivo.php", true);

	param_post  = "id_usuario=" + id_usuario;
	param_post += "&accion=" + accion;
	param_post += "&respuesta_desafio=" + respuesta_desafio;
	param_post += "&id_motivo=" + idMotivo;
	param_post += "&motivo=" + motivo;
	param_post += "&importe=" + importe;

	xhr.setRequestHeader ('Content-type','application/x-www-form-urlencoded')
	xhr.send( param_post );

}

function respuestaEnviaMotivo(e, xhr)
{
	var aRespuesta = JSON.parse(xhr.responseText);
	if(aRespuesta.length == 0){
		debug( "La grabaciÃ³n del motivo de gasto no ha devuelto datos de resultado" );
	}
	else if ( aRespuesta[0] < 0 ){
		alert( "La grabaciÃ³n de motivo de gasto gasto ha fallado: " + aRespuesta[1]);
	}
	/*
	else{
		alert( "Grabado motivo id " + aRespuesta[0] );
	}
	*/

	var id_usuario = window.localStorage.getItem("gaston_id_usuario");
	pide_motivos( id_usuario );
	cierraVentana('lista_motivos');

}


function styleVentana( elemVentana )
{
	elemVentana.style.position	= "absolute";
	elemVentana.style.top		= "5px";
	elemVentana.style.backgroundColor	= "#EEEEFF";
	elemVentana.style.borderStyle	= "solid";
	elemVentana.style.borderWidth	= "3px";
	elemVentana.style.borderColor	= "#000000";

}
