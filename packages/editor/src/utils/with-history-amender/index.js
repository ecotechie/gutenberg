/**
 * External dependencies
 */
import { findLastIndex, omit } from 'lodash';

const withHistoryAmender = () => ( reducer ) => {
	const initialState = {
		...reducer( undefined, {} ),
		incompleteActions: {},
	};

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
					newPast[ i ] = wrappedState.present;
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
