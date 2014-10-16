// Funciones comunes en JavaScript usadas por las aplicaciones de gaston


// Devuelve el valor del parÃ¡metro "name" si se ha incluido en la URL de la pÃ¡gina
function gup( name ){
	var regexS = "[\\?&]"+name+"=([^&#]*)";
	var regex = new RegExp ( regexS );
	var tmpURL = window.location.href;
	var results = regex.exec( tmpURL );
	if( results == null )
		return"";
	else
		return results[1];
}

function trim( unString )
{
	return  unString.replace( /^\s+/,'').replace(/\s+$/g,'');
}


// Comprueba si el texto pasado como parÃ¡metro es numÃ©rico
function isNumeric(val) {
if( val == "0.000" )
	return true;

return ( parseInt(val).toString() == val && val.toString() === '0' ) || val/parseFloat(val) === 1 ;
}

function date2Fecha( date )
{
  txtFecha = date.toISOString();
  return( txtFecha.substring(8,10)  + "/" + txtFecha.substring(5,7) + "/" + txtFecha.substring(0,4) );
}

function fecha2date( dia, hora ){

	// Date( year, month, day, hours, minutes, seconds, milliseconds)
	var date = new Date( dia.substring(6,10), dia.substring(3,5), dia.substring(0,2) ,
				hora.substring(0,2), hora.substring(3,5), 0 );

	return( date.getTime() );
}

function date2Hora( date )
{
  txtFecha = date.toISOString();
   return( txtFecha.substring(11,16) );
}

function timestamp2String( t )
{
	return ( t.substring(8,10) + "/" + t.substring(5,7) + "/" + t.substring(0,4) +
		 ' ' + t.substring(11,16)  );
}
