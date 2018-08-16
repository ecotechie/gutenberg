/**
 * Internal dependencies
 */
import withHistoryAmender, { BEGIN, END } from '../';

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
				withHistoryAmend: { type: BEGIN, id: 123 },
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
				withHistoryAmend: { type: END, id: 123 },
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
				withHistoryAmend: { type: END, id: 123 },
			} ) ).toEqual( {
				past: [ 0, 1, 5, 5 ],
				present: 5,
				future: [],
				lastAction: null,
				shouldCreateUndoLevel: false,
				incompleteActions: {},
			} );
		} );

		xit( 'sensibly forgets begun transactions after a while', () => {} );

		xit( 'avoids returning a new object reference when possible', () => {} );
	} );
	describe( 'with `blocks` reducer', () => {
		const initialState = {
			// From withHistory
			past: [],
			present: {},
			future: [],
			lastAction: null,
			shouldCreateUndoLevel: false,

			// From withHistoryAmender
			incompleteActions: {},
		};

		const blocksEnhanced = ( state = initialState, { type, clientId, attributes } ) => {
			if ( type === 'UPDATE_BLOCK_ATTRIBUTES' ) {
				return {
					past: [ ...state.past, state.present ],
					present: {
						...state.present,
						[ clientId ]: {
							...state.present[ clientId ],
							...attributes,
						},
					},
					future: [],
					lastAction: null,
					shouldCreateUndoLevel: false,
				};
			}

			return state;
		};

		const merge = ( next, prev, action ) => {
			const { clientId } = action;
			return {
				...prev,
				[ clientId ]: {
					...prev[ clientId ],
					...next[ clientId ],
				},
			};
		};

		it( 'should deeply amend from the antepenultimate action', () => {
			const reducer = withHistoryAmender( { merge } )( blocksEnhanced );
			const past = [
				{},
				{
					broccoli: { color: 'green', taste: 'bleh' },
				},
				{
					broccoli: { color: 'green', taste: 'bleh' },
					potato: { color: 'yellow', taste: 'bland' },
				},
			];
			const state = {
				past,
				present: {
					broccoli: { color: 'green', taste: 'bleh' },
					potato: { color: 'yellow', taste: 'bland' },
					tomato: { color: 'red', taste: 'delicious' },
				},
				future: [],
				lastAction: null,
				shouldCreateUndoLevel: false,
				incompleteActions: { 123: past[ 1 ] },
			};

			expect( reducer( state, {
				type: 'UPDATE_BLOCK_ATTRIBUTES',
				clientId: 'broccoli',
				attributes: { taste: 'tolerable' },
				withHistoryAmend: { type: END, id: 123 },
			} ) ).toEqual( {
				past: [
					{},
					{
						broccoli: { color: 'green', taste: 'tolerable' },
					},
					{
						broccoli: { color: 'green', taste: 'tolerable' },
						potato: { color: 'yellow', taste: 'bland' },
					},
				],
				present: {
					broccoli: { color: 'green', taste: 'tolerable' },
					potato: { color: 'yellow', taste: 'bland' },
					tomato: { color: 'red', taste: 'delicious' },
				},
				future: [],
				lastAction: null,
				shouldCreateUndoLevel: false,
				incompleteActions: {},
			} );
		} );
	} );
} );
