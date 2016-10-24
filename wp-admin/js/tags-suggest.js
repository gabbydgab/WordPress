( function( $ ) {
	var tempID = 0;
	var separator = ( window.tagsSuggestL10n && window.tagsSuggestL10n.tagDelimiter ) || ',';

	function split( val ) {
		return val.split( new RegExp( separator + '\\s*' ) );
	}

	function getLast( term ) {
		return split( term ).pop();
	}

	$.fn.wpTagsSuggest = function( options ) {
		var cache;
		var last;
		var $element = $( this );

		options = options || {};
		
		var taxonomy = options.taxonomy || $element.attr( 'data-wp-taxonomy' ) || 'post_tag';
		
		delete( options.taxonomy );

		options = $.extend( {
			source: function( request, response ) {				
				var term;

				if ( last === request.term ) {
					response( cache );
					return;
				}

				term = getLast( request.term );

				$.get( window.ajaxurl, {
					action: 'ajax-tag-search',
					tax: taxonomy,
					q: term
				} ).always( function() {
					$element.removeClass( 'ui-autocomplete-loading' ); // UI fails to remove this sometimes?
				} ).done( function( data ) {
					var value;
					var terms = [];

					if ( data ) {
						data = data.split( '\n' );

						for ( value in data ) {
							var id = ++tempID;

							terms.push({
								id: id,
								name: data[value]
							});
						}

						cache = terms;
						response( terms );
					} else {
						response( terms );
					}
				} );

				last = request.term;
			},
			focus: function( event, ui ) {
				$element.attr( 'aria-activedescendant', 'wp-tags-autocomplete-' + ui.item.id );

				// Don't empty the input field when using the arrow keys to
				// highlight items. See api.jqueryui.com/autocomplete/#event-focus
				event.preventDefault();
			},
			select: function( event, ui ) {
				var tags = split( $element.val() );
				// Remove the last user input.
				tags.pop();
				// Append the new tag and an empty element to get one more separator at the end.
				tags.push( ui.item.name, '' );

				$element.val( tags.join( separator + ' ' ) );

				if ( $.ui.keyCode.TAB === event.keyCode ) {
					if ( typeof window.uiAutocompleteL10n !== 'undefined' ) {
						// Audible confirmation message when a tag has been selected.
						window.wp.a11y.speak( window.uiAutocompleteL10n.itemSelected );
					}

					event.preventDefault();
				} else if ( $.ui.keyCode.ENTER === event.keyCode ) {
					// Do not close Quick Edit / Bulk Edit
					event.preventDefault();
					event.stopPropagation();
				}

				return false;
			},
			open: function() {
				$element.attr( 'aria-expanded', 'true' );
			},
			close: function() {
				$element.attr( 'aria-expanded', 'false' );
			},
			minLength: 2,
			position: {
				my: 'left top+2'
			},
			messages: {
				noResults: ( typeof window.uiAutocompleteL10n !== 'undefined' ) ? window.uiAutocompleteL10n.noResults : '',
				results: function( number ) {
					if ( typeof window.uiAutocompleteL10n !== 'undefined' ) {
						if ( number > 1 ) {
							return window.uiAutocompleteL10n.manyResults.replace( '%d', number );
						}

						return window.uiAutocompleteL10n.oneResult;
					}
				}
			}
		}, options );

		$element.on( 'keydown', function() {
			$element.removeAttr( 'aria-activedescendant' );
		} )
		.autocomplete( options )
		.autocomplete( 'instance' )._renderItem = function( ul, item ) {
			return $( '<li role="option" id="wp-tags-autocomplete-' + item.id + '">' )
				.text( item.name )
				.appendTo( ul );
		};

		$element.attr( {
			'role': 'combobox',
			'aria-autocomplete': 'list',
			'aria-expanded': 'false',
			'aria-owns': $element.autocomplete( 'widget' ).attr( 'id' )
		} )
		.on( 'focus', function() {
			var inputValue = split( $element.val() ).pop();

			// Don't trigger a search if the field is empty.
			// Also, avoids screen readers announce `No search results`.
			if ( inputValue ) {
				$element.autocomplete( 'search' );
			}
		} )
		// Returns a jQuery object containing the menu element.
		.autocomplete( 'widget' )
			.addClass( 'wp-tags-autocomplete' )
			.attr( 'role', 'listbox' )
			.removeAttr( 'tabindex' ) // Remove the `tabindex=0` attribute added by jQuery UI.

			// Looks like Safari and VoiceOver need an `aria-selected` attribute. See ticket #33301.
			// The `menufocus` and `menublur` events are the same events used to add and remove
			// the `ui-state-focus` CSS class on the menu items. See jQuery UI Menu Widget.
			.on( 'menufocus', function( event, ui ) {
				ui.item.attr( 'aria-selected', 'true' );
			})
			.on( 'menublur', function() {
				// The `menublur` event returns an object where the item is `null`
				// so we need to find the active item with other means.
				$( this ).find( '[aria-selected="true"]' ).removeAttr( 'aria-selected' );
			});
			
		return this;
	};

}( jQuery ) );
