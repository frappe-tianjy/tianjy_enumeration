const oldSetVueGlobals = window.SetVueGlobals;

window.SetVueGlobals = function(app) {
	const DataControl = app.component('DataControl');
	if (DataControl) {
		app.component('TianjyEnumerationControl', DataControl);
	}
	return oldSetVueGlobals.apply(this, arguments);
};
