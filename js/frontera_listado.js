/*
  Funciones principales que utiliza la webApp gaston/listado.html
*/

var peticionesAutenticacion=0;

window.addEventListener("load",inicializa,true);

function debug(msg){
	var status = document.getElementById("status");
	status.innerHTML = status.innerHTML + "<br/>" + msg;
}

function inicializa(){

	var id_usuario = window.localStorage.getItem("gaston_id_usuario");
	if ( id_usuario != "" ){
		informaUsuario( window.localStorage.getItem("gaston_usuario") );		
		pideListaGastos( id_usuario, "fecha" );
	}
	else
		informaUsuario( "---" );		
}

function informaUsuario( usuario )
{
	document.getElementById("span_usuario").innerHTML = usuario;
}

function cambiaOrden( orden )
{

	var id_usuario = window.localStorage.getItem("gaston_id_usuario");

	if ( id_usuario != "" && ( orden === "fecha" ||  orden === "motivo" ||  orden === "importe" ) )
		pideListaGastos( id_usuario, orden );

	return;
}

function pideListaGastos( id_usuario, orden )
{

	window.localStorage.setItem("gaston_orden", orden);	

	var param_post = "";
	var xhr = new XMLHttpRequest();
	if ( typeof xhr.withCredentials === undefined ){
		debug("Error creando XMLHttpRequest");
		return false;
	}

	xhr.onerror = function(e){
		debug( "Error en peticiÃ³n de datos." );
	}

	xhr.onprogress = function(e){
		var ratio = e.loaded / e.total;
		if (  e.loaded < e.total && ratio > 10 )
			debug( ratio + "% descargado." );
	}

	// Se han recibido los datos solicitados
	xhr.onload = function(e){
		//debug( "Datos recibidos" );
		recibido_datos(e, xhr);
	}

	xhr.open("POST", "xml/listaGastosUsuario.php", true);

	// formData no funciona con versiones Android < 3
	//formData = new FormData();
	//formData.append('username', 'johndoe');
	//xhr.send(formData);

	param_post = "id_usuario=" + id_usuario;
	param_post += "&orden=" + orden;

	// Datos de comprobaciÃ³n de usuario
	param_post += "&respuesta_desafio=" + window.localStorage.getItem("gaston_respuesta_desafio");

	//debug( param_post );
	//debug( "Iniciado envio..." );
	xhr.setRequestHeader ('Content-type','application/x-www-form-urlencoded')
	xhr.send( param_post );

}

function reintentaListar()
{
	peticionesAutenticacion++;

	if( peticionesAutenticacion > 2 )
		alert("Error. Se han pedido datos 3 veces sin exito.");
	else{
		var id_usuario = window.localStorage.getItem("gaston_id_usuario");
		pideListaGastos( id_usuario, "fecha" );
	}
}

function recibido_datos(e, xhr)
{
	//debug("interpretando datos recibidos...");

	var tabla= document.getElementById("table_gastos");
	var aCols = new Array(7);

	var xml = xhr.responseXML;

	var aError = xml.getElementsByTagName("error");
	if( aError.length > 0 ){
		alert (aError[0].getAttribute("id") + " " + aError[0].getAttribute("motivo"));
		// Si hay sesion caducada pero aun mantego los datos de usuario, me reconecto
		if ( aError[0].getAttribute("id") == -3					&&
			 	window.localStorage.getItem("gaston_usuario") != ""	&&
				window.localStorage.getItem("pass") != ""){
			pideAutenticacion( reintentaListar );
		}
		return;
	}

	var aGastos = xml.getElementsByTagName("gasto");

	var txtNode;	// contendrÃ¡ el texto 
	var texto;	// El texto propiamente dicho
	var j;		// bucle for-next

	// Borra todas las columnas de la tabla excepto la primera (la cabecera)
	while( tabla.rows.length > 1 )
		tabla.deleteRow(1);

	// Rellena la tabla con los datos importados XML
	for ( var i=0; i<aGastos.length; i++ ){
		var newRow = document.createElement("tr");
		j=0;

		texto  = "<input type=\"checkbox\" name=\"chkId\" id=\"chkId";
		texto += aGastos[i].getAttribute("id");
		texto += "\"/>";
		aCols[j] = document.createElement("td");
		aCols[j].innerHTML=texto;
		newRow.appendChild(aCols[j++]);

		aCols[j] = document.createElement("td");
		txtNode = document.createTextNode( timestamp2String( aGastos[i].getAttribute("fecha") ));
		aCols[j].appendChild( txtNode ); 
		newRow.appendChild( aCols[j++]);

		aCols[j] = document.createElement("td");
		txtNode = document.createTextNode( aGastos[i].getAttribute("motivo") );
		aCols[j].appendChild( txtNode ); 
		newRow.appendChild(aCols[j++]);

		aCols[j] = document.createElement("td");
		txtNode = document.createTextNode( aGastos[i].getAttribute("importe") );
		aCols[j].className="decimal";
		aCols[j].appendChild( txtNode ); 
		newRow.appendChild(aCols[j++]);

		/*
		var aNombres = new Array("geo_latitude","geo_longitude","geo_accuracy");
		for ( var nomCol in aNombres){
			aCols[j] = document.createElement("td");
			txtNode = document.createTextNode( aGastos[i].getAttribute( aNombres[nomCol] ) );
			aCols[j].className="decimal";
			aCols[j].appendChild( txtNode ); 
			newRow.appendChild(aCols[j++]);
		}
		*/

		texto = "";
		aCols[j] = document.createElement("td");
		if( aGastos[i].getAttribute("geo_accuracy") != "" ){
			texto = "<a href=\"map.html?id=" + aGastos[i].getAttribute("id");
			texto += "\">";
			texto += accuracy2texto( aGastos[i].getAttribute("geo_accuracy") );
			texto += "</a>";
		}
		aCols[j].innerHTML=texto;
		aCols[j].className="link_decimal";
		//aCols[j].appendChild( txtNode ); 
		newRow.appendChild(aCols[j++]);

		texto = "";
		aCols[j] = document.createElement("td");
		texto = "<a href=\"index.html?id_apunte=" + aGastos[i].getAttribute("id");
		texto += "\">";
		texto += "edita";
		texto += "</a>";
		aCols[j].innerHTML=texto;
		newRow.appendChild(aCols[j++]);

		tabla.appendChild(newRow)
	}


	//debug("Fin interpretacion.");

}

function borraApuntes(  )
{
	var id_usuario = window.localStorage.getItem("gaston_id_usuario");
	var aChkIds = new Array();	// Array de checks de listado

	var aChecks = document.getElementsByName("chkId");

	if ( id_usuario == "" )
		return;

	for( var i = 0; i < aChecks.length; i++ ){
		if( aChecks[i].checked ){
			// Le quito la cadena "chkId" y guardo el id en el array
			aChkIds.push( parseInt( aChecks[i].id.substring(5) ) );
		}
	}

	if ( aChkIds.length == 0 )
		return;

	var resp = confirm("Realmente quieres borrar " + aChkIds.length + " apuntes.?" );

	if ( resp )
		pideBorradoApuntes( id_usuario, aChkIds );

}

// Envia un XMLHttpRequest con los id's de apuntes a borrar
function pideBorradoApuntes ( id_usuario, aChkIds )
{

	var xhr = new XMLHttpRequest();
	if ( typeof xhr.withCredentials === undefined ){
		debug("Error creando XMLHttpRequest");
		return false;
	}

	xhr.onerror = function(e){
		debug( "Error en peticiÃ³n de datos." );
	}

	xhr.onprogress = function(e){
		var ratio = e.loaded / e.total;
		if (  e.loaded < e.total && ratio > 10 )
			debug( ratio + "% descargado." );
	}

	// Se han recibido los datos solicitados
	xhr.onload = function(e){
		//debug( "Datos recibidos" );
		respuesta_borrado(e, xhr);
	}

	xhr.open("POST", "json/borraApuntes.php", true);

	param_post  = "id_usuario=" + id_usuario;
	param_post += "&jsonIds=" + JSON.stringify(aChkIds);

	// Datos de comprobaciÃ³n de usuario
	param_post += "&respuesta_desafio=" + window.localStorage.getItem("gaston_respuesta_desafio");

	xhr.setRequestHeader ('Content-type','application/x-www-form-urlencoded')
	xhr.send( param_post );

}

function respuesta_borrado(e, xhr)
{
	var aRespuesta = JSON.parse(xhr.responseText);
	if(aRespuesta.length == 0){
		debug( "El borrado de apuntes no ha devuelto datos de resultado" );
	}
	else if ( aRespuesta[0] < 0 ){
		debug( "El borrado de apuntes ha fallado: " + aRespuesta[1]);
	}
	else{
		debug( "Borrado apuntes " + aRespuesta[1] );
		var id_usuario = window.localStorage.getItem("gaston_id_usuario");
		var orden = window.localStorage.getItem("gaston_orden");

		pideListaGastos( id_usuario, orden );
	}

}

// Convierte una distancia en un texto expresado en metros o kilÃ³metros
function accuracy2texto( accuracy )
{
	var intA = parseInt( accuracy );

	if ( intA < 1E3 )
		return ( intA + " m." );

	var km = Math.floor (intA / 1E3);
	var m = intA - km*1E3;
	var decimales = "";

	if  ( m > 0 )
		return ( km + "," + m + " Km."  );
	else
		return ( km + " Km."  );

}
