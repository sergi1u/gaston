
function creaVentana ( elemPadre, ventana )
{

	var elemVentana = document.getElementById( ventana );

	if( elemVentana != null )
		cierraVentana( ventana );

	elemVentana = document.createElement("div");
	elemVentana.id = ventana;

	return ( elemVentana );
}

function cierraVentana( ventana )
{
	var elemVentana = document.getElementById(ventana);

	if( elemVentana != null ){
		var elemPadre = elemVentana.parentNode;
		elemPadre.removeChild(elemVentana);
	}
}
