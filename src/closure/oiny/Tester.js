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
oiny.Tester.AjaxRequestValidCompleteCount = 0;

oiny.Tester.Active_ = false;

oiny.Tester.testCycleCountEle = null;
oiny.Tester.testValidCycleCountEle = null;

oiny.Tester.TestUrls_ = [];

oiny.Tester.NextUrlIndex_ = -1;

oiny.Tester.Init = function() {
	oiny.Tester.attachEvents();
	oiny.Tester.initOptions();
	oiny.Tester.HandleTabs(); // experimental
	oiny.Tester.initUI();
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

	oiny.Tester.startTestButtonEle_.disabled = true;

	oiny.Tester.Active_ = true;
	oiny.Tester.AjaxRequestCompleteCount = 0;
	oiny.Tester.AjaxRequestValidCompleteCount = 0;

	oiny.Tester.Tests[testType]( formEle );

	e.preventDefault();
	return false;
};

oiny.Tester.Tests = {
	'link-check-test': function( formMap ) {
		var url = formMap.get('url')[0],
			lengthOfTest = formMap.get('test-time'),
			jsValidation = ( formMap.get('load-test-response-javascript')[0].length > 0 ) ?
				new Function("response", formMap.get('load-test-response-javascript')[0]) :
				function(){ return true; };

		oiny.Tester.TestUrls_ = [ url ];

		oiny.Tester.ResponseValidation_ = jsValidation;

		setTimeout( oiny.Tester.EndTest, lengthOfTest * 1000 );

		for( var i = 0; i < oiny.Tester.CONFIG.THREADS; i++ ) {
			oiny.Tester.fireRequest();
		}
	},

	'load-test': function( formMap ) {
		var code =  formMap.get('load-test-code')[0],
			value = (new Function(code)).call();

		if( goog.isFunction( value ) ) {
			oiny.Tester.GetNextUrl = value;
		} else if( goog.isArray( value ) ) {
			oiny.Tester.TestUrls_ = value;
		} else if( goog.isString( value ) ) {
			oiny.Tester.TestUrls_ = [ value ];
		} else {
			throw Error("its not any of these types, not sure what else to do");
		}

		oiny.Tester.log("Tests['load-test']()", 'load-tests', value);
	}
};

/**
 * @param {bool} successful whether or not the ajax completed succesfully or not
 * @param xhr
 */
oiny.Tester.AjaxComplete = function( successful, e ) {
	var xhr = e.currentTarget;

	oiny.Tester.update();

	goog.array.remove( oiny.Tester.XHRS_, xhr );

	if( successful ) {
		if( oiny.Tester.ResponseValidation_( e.currentTarget.getResponseText() ) ) {
			oiny.Tester.AjaxRequestValidCompleteCount += 1;
		}

		oiny.Tester.AjaxRequestCompleteCount += 1;
		oiny.Tester.fireRequest();
	}
};

oiny.Tester.fireRequest = function() {
	if( oiny.Tester.Active_ ) {
		oiny.Tester.XHRS_.push(
			oiny.Tester.AjaxHelper.get( oiny.Tester.GetNextUrl(),
				function(xhr) { oiny.Tester.AjaxComplete( true, xhr ); },
				function(xhr) { oiny.Tester.AjaxComplete( false, xhr ); }
			)
		);
	}
};

oiny.Tester.EndTest = function() {
	oiny.Tester.Active_ = false;

	oiny.Tester.startTestButtonEle_.disabled = false;

	oiny.Tester.log('EndTest', 'Test Complete!');
};

oiny.Tester.GetNextUrl = function() {
	oiny.Tester.NextUrlIndex_ = ( oiny.Tester.NextUrlIndex_ + 1 == oiny.Tester.TestUrls_.length ) ?
		0 :
		oiny.Tester.NextUrlIndex_ + 1;

	return oiny.Tester.TestUrls_[ oiny.Tester.NextUrlIndex_ ];
};

oiny.Tester.log = function( funcName, message ) {
	console.log( funcName + '(): ', message );
};

oiny.Tester.initUI = function() {
	oiny.Tester.testValidCycleCountEle = goog.dom.getElement('test-valid-count-cycles');
	oiny.Tester.testCycleCountEle = goog.dom.getElement('test-count-cycles');
	oiny.Tester.startTestButtonEle_ = goog.dom.getElement('start-test');
};

oiny.Tester.update = function() {
	goog.dom.setTextContent( oiny.Tester.testCycleCountEle, oiny.Tester.AjaxRequestCompleteCount );
	goog.dom.setTextContent( oiny.Tester.testValidCycleCountEle, oiny.Tester.AjaxRequestValidCompleteCount );
};

oiny.Tester.HandleTabs = function() {
	goog.array.forEach( goog.dom.getElementsByTagNameAndClass('textarea', 'enable-tab'), function( ele ) {
		goog.events.listen( ele , goog.events.EventType.KEYDOWN, checkTab );
	});

	/**
	 * from: http://ajaxian.com/archives/handling-tabs-in-textareas
 	 */
	// Set desired tab defaults to four space softtab
	var tab = "\t";

	function checkTab(evt) {
		var t = evt.target;
		var ss = t.selectionStart;
		var se = t.selectionEnd;

		// Tab key - insert tab expansion
		if (evt.keyCode == 9) {
			evt.preventDefault();

			// Special case of multi line selection
			if (ss != se && t.value.slice(ss,se).indexOf("\n") != -1) {
				// In case selection was not of entire lines (e.g. selection begins in the middle of a line)
				// we ought to tab at the beginning as well as at the start of every following line.
				var pre = t.value.slice(0,ss);
				var sel = t.value.slice(ss,se).replace(/\n/g,"\n"+tab);
				var post = t.value.slice(se,t.value.length);
				t.value = pre.concat(tab).concat(sel).concat(post);

				t.selectionStart = ss + tab.length;
				t.selectionEnd = se + tab.length;
			}

			// "Normal" case (no selection or selection on one line only)
			else {
				t.value = t.value.slice(0,ss).concat(tab).concat(t.value.slice(ss,t.value.length));
				if (ss == se) {
					t.selectionStart = t.selectionEnd = ss + tab.length;
				}
				else {
					t.selectionStart = ss + tab.length;
					t.selectionEnd = se + tab.length;
				}
			}
		}

		// Backspace key - delete preceding tab expansion, if exists
		else if (evt.keyCode==8 && t.value.slice(ss - 4,ss) == tab) {
			evt.preventDefault();

			t.value = t.value.slice(0,ss - 4).concat(t.value.slice(ss,t.value.length));
			t.selectionStart = t.selectionEnd = ss - tab.length;
		}

		// Delete key - delete following tab expansion, if exists
		else if (evt.keyCode==46 && t.value.slice(se,se + 4) == tab) {
			evt.preventDefault();

			t.value = t.value.slice(0,ss).concat(t.value.slice(ss + 4,t.value.length));
			t.selectionStart = t.selectionEnd = ss;
		}
		// Left/right arrow keys - move across the tab in one go
		else if (evt.keyCode == 37 && t.value.slice(ss - 4,ss) == tab) {
			evt.preventDefault();
			t.selectionStart = t.selectionEnd = ss - 4;
		}
		else if (evt.keyCode == 39 && t.value.slice(ss,ss + 4) == tab) {
			evt.preventDefault();
			t.selectionStart = t.selectionEnd = ss + 4;
		}
	}
}