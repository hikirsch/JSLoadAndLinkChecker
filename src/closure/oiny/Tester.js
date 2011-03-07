goog.provide('oiny.Tester');

goog.require('oiny.Tester.CONFIG');
goog.require('oiny.events');
goog.require('oiny.Tester.AjaxHelper');

goog.require('goog.dom');
goog.require('goog.dom.classes');
goog.require('goog.dom.query');
goog.require('goog.dom.forms');
goog.require('goog.array');

oiny.Tester.XHRS_ = [];

oiny.Tester.AjaxRequestCompleteCount = 0;

oiny.Tester.Active_ = false;

oiny.Tester.Init = function() {
	oiny.Tester.attachEvents();
	oiny.Tester.initOptions();
};

oiny.Tester.initOptions = function() {
	var testTypes = goog.dom.getElement('check-type-options'),
		optionEles = goog.dom.query('#test-options > li');

	function handler(e) {
		var currentElement = e.target.parentNode,
			currentIndex = goog.array.indexOf( testTypes.children, currentElement );

		goog.array.forEach( optionEles, function( ele ) {
			goog.dom.classes.remove(ele, 'active');
		});

		goog.dom.classes.add( optionEles[currentIndex], oiny.Tester.CONFIG.CLASSES.ACTIVE );

		return false;
	};

	oiny.events.delegate( testTypes, 'input', '', goog.events.EventType.CLICK, handler );
};

oiny.Tester.attachEvents = function() {
	goog.events.listen( goog.dom.getElement('main-form'), goog.events.EventType.SUBMIT, oiny.Tester.startTest )
};

oiny.Tester.startTest = function(e) {
	var formEle = goog.dom.forms.getFormDataMap( goog.dom.getElement('main-form') ),
		testType = formEle.get('test-type')[0];

	oiny.Tester.Active_ = true;

	oiny.Tester.Tests[testType]( formEle );

	e.preventDefault();
	return false;
};

oiny.Tester.Tests = {
	'link-check-test': function( formMap ) {
		var url = formMap.get('url'),
			lengthOfTest = formMap.get('test-time'),
			testEnd = (new Date()).getTime() + ( lengthOfTest * 1000 );

		oiny.Tester.HACK_URL = url;

		setTimeout( oiny.Tester.EndTest, lengthOfTest * 1000 );

		for( var i = 0; i < oiny.Tester.CONFIG.THREADS; i++ ) {
			oiny.Tester.FireRequest();
		}
	},

	'load-test': function( formMap ) {
		var code =  formMap.get('load-test-code')[0];
		var value = (new Function(code)).call();
		console.log("load-tests", value);
	}
};

oiny.Tester.AjaxComplete = function( successful, xhr ) {
	goog.array.remove( oiny.Tester.XHRS_, xhr );

	oiny.Tester.AjaxRequestCompleteCount += 1;
	if( oiny.Tester.Active_ ) {
		oiny.Tester.FireRequest();
	} else {
		debugger;
		console.log( xhr.getStatus() );
	}
};

oiny.Tester.FireRequest = function() {

	if( ! oiny.Tester.Active_ ) {
		debugger;
	} else {
		console.log("Request Fired." + oiny.Tester.AjaxRequestCompleteCount);
		oiny.Tester.XHRS_.push(
			oiny.Tester.AjaxHelper.get( oiny.Tester.GetNextUrl(),
				function(xhr) { oiny.Tester.AjaxComplete( true, xhr ); },
				function(xhr) { oiny.Tester.AjaxComplete( false, xhr ); }
			)
		);

	}
};

oiny.Tester.EndTest = function() {
	console.log("TEST COMPLETE!");
	goog.array.forEach( oiny.Tester.XHRS_, function( xhr ) {
		try {
			xhr.__ABORTED = true;
			xhr.abort(501);
		} catch(e) { }
	});
	oiny.Tester.Active_ = false;
	console.log( "Test Completed " + oiny.Tester.AjaxRequestCompleteCount + " times." );
};


oiny.Tester.GetNextUrl = function() {
	return oiny.Tester.HACK_URL;
};
