goog.provide('oiny.Tester.AjaxHelper');

goog.require('goog.net.XhrIo');
goog.require('goog.net.EventType');

oiny.Tester.AjaxHelper.get = function( url, complete, error ) {
	var request = new goog.net.XhrIo();

	goog.events.listen(request, goog.net.EventType.COMPLETE,  function(e) {
		if( goog.isFunction( complete ) ) {
			complete(e.currentTarget);
		}
	});

	goog.events.listen(request, goog.net.EventType.ERROR,  function() {
		console.log('failed!');

		if( goog.isFunction( error ) ) {
			error(e.currentTarget);
		}
	});

	request.send( oiny.Tester.CONFIG.PROXY + url );

	return request;
};