/**
 * External dependencies
 */
import { findLastIndex, identity, omit } from 'lodash';

const withHistoryAmender = ( options = {} ) => ( reducer ) => {
	const initialState = {
		...reducer( undefined, {} ),
		incompleteActions: {},
	};

	const { merge = identity } = options;

	return ( state = initialState, action ) => {
		const wrappedState = reducer( state, action );
		const { withHistoryAmends: amends = false } = action;

		if ( amends.begin ) {
			return {
				...wrappedState,
				incompleteActions: {
					...state.incompleteActions,
					[ amends.begin ]: wrappedState.present,
				},
			};
		}

		if ( amends.end ) {
			const snapshot = state.incompleteActions[ amends.end ];
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
					incompleteActions: omit( state.incompleteActions, amends.end ),
				};
			}
		}

		return { ...wrappedState, incompleteActions: state.incompleteActions };
	};
};

export default withHistoryAmender;
