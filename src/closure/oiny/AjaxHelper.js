goog.provide('oiny.Tester.AjaxHelper');

goog.require('goog.net.XhrIo');
goog.require('goog.net.EventType');

oiny.Tester.AjaxHelper.get = function( url, success, error ) {
	var request = new goog.net.XhrIo();

	goog.events.listen(request, goog.net.EventType.SUCCESS,  function(e) {
		if( goog.isFunction( success ) ) {
			success(e);
		}
	});

	goog.events.listen(request, goog.net.EventType.ABORT,  function(e) {
		console.log( e.currentTarget );
		if( goog.isFunction( error ) ) {
			error(e);
		}
	});

	request.send( oiny.Tester.CONFIG.PROXY + url );

	return request;
};