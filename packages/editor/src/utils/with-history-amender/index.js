/**
 * External dependencies
 */
import { findLastIndex, identity, omit } from 'lodash';

/**
 * Constant signaling the intention to mark an effected change as one on top of
 * which latter changes will be applied. Refer to withHistoryAmender
 * documentation for more.
 *
 * @see withHistoryAmender
 *
 * @type {String}
 */
export const BEGIN = 'BEGIN';

/**
 * Constant signaling the intention to mark an effected change for application
 * on top of past recorded changes. Refer to withHistoryAmender documentation
 * for more.
 *
 * @see withHistoryAmender
 *
 * @type {String}
 */
export const END = 'END';

/**
 * Higher-order reducer creator which transforms the result of the original
 * history-tracking reducer into an object whose history can be rewritten. By
 * "original history-tracking reducer" it is implied that the original reducer
 * has been enhanced by `withHistory`. The new object carries a new piece of
 * state, `incompleteActions`, to allow latter rewriting of history.
 *
 * @param {?Object}   options       Optional options.
 * @param {?Array}    options.merge Merge function for custom merging of new
 *                                  and former values of a snapshot of the
 *                                  past.
 *
 * @return {Function} Higher-order reducer.
 */
const withHistoryAmender = ( options = {} ) => ( originalReducer ) => {
	const { merge = identity } = options;

	const initialState = {
		...originalReducer( undefined, {} ),
		incompleteActions: {},
	};

	return ( state = initialState, action ) => {
		const { incompleteActions } = state;
		const { withHistoryAmend: amend = false } = action;

		const wrappedState = originalReducer( state, action );

		switch ( amend.type ) {
			case BEGIN:
				return {
					...wrappedState,
					incompleteActions: {
						...incompleteActions,
						[ amend.id ]: wrappedState.present,
					},
				};

			case END:
				const snapshot = incompleteActions[ amend.id ];
				const index = findLastIndex(
					wrappedState.past,
					( item ) => item === snapshot
				);

				if ( snapshot && index >= 0 ) {
					const newPast = [ ...wrappedState.past ];
					for ( let i = index; i < newPast.length; i++ ) {
						newPast[ i ] = merge(
							wrappedState.present,
							newPast[ i ],
							action
						);
					}
					newPast.pop();

					return {
						...wrappedState,
						past: newPast,
						incompleteActions: omit( incompleteActions, amend.id ),
					};
				}
		}

		return { ...wrappedState, incompleteActions };
	};
};

export default withHistoryAmender;
