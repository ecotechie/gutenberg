/**
 * Internal dependencies
 */
import withHistoryAmender from '../';

// withHistoryAmender expects the input reducer to be withHistory-enhanced,
// i.e. to output state conforming to the following shape:
//
// const initialState = {
// 	past: [],
// 	present: reducer( undefined, {} ),
// 	future: [],
// 	lastAction: null,
// 	shouldCreateUndoLevel: false,
// };

describe( 'withHistoryAmender', () => {
	describe( 'with `counter` reducer', () => {
		const initialState = {
			// From withHistory
			past: [],
			present: 0,
			future: [],
			lastAction: null,
			shouldCreateUndoLevel: false,

			// From withHistoryAmender
			incompleteActions: {},
		};

		const counterEnhanced = ( state = initialState, { type } ) => {
			if ( type === 'INCREMENT' ) {
				return {
					past: [ ...state.past, state.present ],
					present: state.present + 1,
					future: [],
					lastAction: null,
					shouldCreateUndoLevel: false,
				};
			}

			return state;
		};

		it( 'should return a new reducer', () => {
			const reducer = withHistoryAmender()( counterEnhanced );

			expect( typeof reducer ).toBe( 'function' );
			expect( reducer( undefined, {} ) ).toEqual( {
				past: [],
				present: 0,
				future: [],
				lastAction: null,
				shouldCreateUndoLevel: false,
				incompleteActions: {},
			} );
		} );

		it( 'should respect existing history', () => {
			const reducer = withHistoryAmender()( counterEnhanced );
			const state = reducer( initialState, { type: 'INCREMENT' } );

			expect( state ).toEqual( {
				past: [ 0 ],
				present: 1,
				future: [],
				lastAction: null,
				shouldCreateUndoLevel: false,
				incompleteActions: {},
			} );
		} );

		it( 'should preserve its own state', () => {
			const reducer = withHistoryAmender()( counterEnhanced );
			const state = {
				past: [ 0, 1 ],
				present: 2,
				future: [],
				lastAction: null,
				shouldCreateUndoLevel: false,
				incompleteActions: { 123: 2 },
			};

			expect( reducer( state, {
				type: 'INCREMENT',
			} ) ).toEqual( {
				past: [ 0, 1, 2 ],
				present: 3,
				future: [],
				lastAction: null,
				shouldCreateUndoLevel: false,
				incompleteActions: { 123: 2 },
			} );
		} );

		it( 'should preserve history when receiving an incomplete action', () => {
			const reducer = withHistoryAmender()( counterEnhanced );
			const state = {
				past: [ 0, 1, 2 ],
				present: 3,
				future: [],
				lastAction: null,
				shouldCreateUndoLevel: false,
				incompleteActions: {},
			};
			const action = {
				type: 'INCREMENT',
				withHistoryAmends: { begin: 123 },
			};

			expect( reducer( state, action ) ).toEqual( {
				past: [ 0, 1, 2, 3 ],
				present: 4,
				future: [],
				lastAction: null,
				shouldCreateUndoLevel: false,
				incompleteActions: { 123: 4 },
			} );
		} );

		it( 'should amend the latest action', () => {
			const reducer = withHistoryAmender()( counterEnhanced );
			const state = {
				past: [ 0, 1, 2, 3 ],
				present: 4,
				future: [],
				lastAction: null,
				shouldCreateUndoLevel: false,
				incompleteActions: { 123: 4 },
			};

			expect( reducer( state, {
				type: 'INCREMENT',
				withHistoryAmends: { end: 123 },
			} ) ).toEqual( {
				past: [ 0, 1, 2, 3 ],
				present: 5,
				future: [],
				lastAction: null,
				shouldCreateUndoLevel: false,
				incompleteActions: {},
			} );
		} );

		it( 'should amend from the antepenultimate action', () => {
			const reducer = withHistoryAmender()( counterEnhanced );
			const state = {
				past: [ 0, 1, 2, 3 ],
				present: 4,
				future: [],
				lastAction: null,
				shouldCreateUndoLevel: false,
				incompleteActions: { 123: 2 },
			};

			expect( reducer( state, {
				type: 'INCREMENT',
				withHistoryAmends: { end: 123 },
			} ) ).toEqual( {
				past: [ 0, 1, 5, 5 ],
				present: 5,
				future: [],
				lastAction: null,
				shouldCreateUndoLevel: false,
				incompleteActions: {},
			} );
		} );
	} );
} );
