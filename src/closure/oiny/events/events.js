/**
 * These are helper functions to help extend the builtin event system within Closure. These features may already be
 * part of closure but wasn't found at the time when this function was created.
 */
goog.provide('oiny.events');

goog.require('goog.events');

/**
 * Closure doesn't have really good support for event delegation. This is the start of that.
 * @param {EventTarget|goog.events.EventTarget} src The node to listen to events on.
 * @param {string|null} tagName the tag name in which we want to delegate
 * @param {string|null} className the class name we may want to consider to delegate
 * @param {string|Array.<string>} type Event type or array of event types.
 * @param {Function|Object} listener Callback method, or an object with a handleEvent function.
 * @param {boolean=} opt_capt Whether to fire in capture phase (defaults to false).
 * @param {Object=} opt_handler Element in whose scope to call the listener.
 * @return {?number} Unique key for the listener.
 */
oiny.events.delegate = function(src, tagName, className, type, listener, opt_capt, opt_handler) {
	var currentNode = null;

	goog.events.listen( src, type, handler, opt_capt, opt_handler );

	function handler(e) {
		currentNode = e.target;

		while ( currentNode != null ) {
			var isTagEmpty = tagName == null || tagName.length == 0,
				doesTagMatch = ( tagName != null && currentNode.tagName != null && currentNode.tagName.toLowerCase() == tagName.toLowerCase() ),
				isClassEmpty = className == null || className.length == 0,
				doesClassMatch = ( className != null && className.length > 0 &&  goog.dom.classes.has( currentNode, className ) );

			if( ( isTagEmpty || doesTagMatch ) && ( isClassEmpty || doesClassMatch ) ) {
				e.currentTarget = currentNode;
				if( goog.isFunction( listener ) ) { return listener(e); }
			}

			currentNode = currentNode.parentNode;
		}
	}
};