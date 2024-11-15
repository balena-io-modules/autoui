import type { JSONSchema7 as JSONSchema } from 'json-schema';
import { convertToPineClientFilter } from './jsonToOData';

type FilterTest = {
	testCase: string;
	filters: JSONSchema[];
	expected: any;
};

const filterTests: FilterTest[] = [
	{
		testCase: 'should convert string "contains" filter to pine $filter',
		filters: [
			{
				$id: 'cdhQsy7pZgpcXvuM',
				anyOf: [
					{
						$id: 'NoKJ2cRMrj1CovBc',
						title: 'contains',
						description: 'Release contains ',
						type: 'object',
						properties: {
							commit: {
								type: 'string',
								description: '',
								pattern: 'test',
							},
						},
						required: ['commit'],
					},
				],
			},
		],
		expected: { commit: { $contains: 'test' } },
	},
	{
		testCase: 'should convert string "not contains" filter to pine $filter',
		filters: [
			{
				$id: 'xJFFoZ0t84xbCw4v',
				anyOf: [
					{
						$id: 'Hwqs5HvzI1jKyq0Z',
						title: 'not_contains',
						description: 'Release does not contains',
						type: 'object',
						properties: {
							commit: {
								not: {
									type: 'string',
									// @ts-expect-error regexp is an ajv specific property
									regexp: {
										pattern: 'test',
										flags: 'i',
									},
								},
							},
						},
						required: ['commit'],
					},
				],
			},
		],
		expected: {
			$not: {
				$contains: [{ $tolower: { $: 'commit' } }, 'test'],
			},
		},
	},
	{
		testCase: 'should convert number "is_more_then" filter to pine $filter',
		filters: [
			{
				$id: 'D86bWslC9A2ySi6q',
				anyOf: [
					{
						$id: 'xh9KwGN5sOne9TQF',
						title: 'is_more_than',
						description:
							'{"title":"Total devices","field":"total_devices","operator":{"slug":"is_more_than","label":"is more than"},"value":"10"}',
						type: 'object',
						properties: {
							total_devices: {
								type: 'number',
								exclusiveMinimum: 10,
							},
						},
						required: ['total_devices'],
					},
				],
			},
		],
		expected: { total_devices: { $gt: 10 } },
	},
	{
		testCase: 'should convert number "is_not" filter to pine $filter',
		filters: [
			{
				$id: 'fkP80BWWcIPrkFX5',
				anyOf: [
					{
						$id: '8A79u1MS8MimDNzR',
						title: 'is_not',
						description:
							'{"title":"Total devices","field":"total_devices","operator":{"slug":"is_not","label":"is not"},"value":"0"}',
						type: 'object',
						properties: {
							total_devices: {
								type: 'number',
								not: {
									const: 0,
								},
							},
						},
						required: ['total_devices'],
					},
				],
			},
		],
		expected: { total_devices: { $ne: 0 } },
	},
	{
		testCase: 'should convert boolean "is" filter to pine $filter',
		filters: [
			{
				$id: 'do3507QsNAZo0XTj',
				anyOf: [
					{
						$id: 'D1pKThm7QFAIICXC',
						title: 'is',
						description:
							'{"title":"Is public","field":"is_public","operator":{"slug":"is","label":"is"},"value":"true"}',
						type: 'object',
						properties: {
							is_public: {
								const: true,
							},
						},
						required: ['is_public'],
					},
				],
			},
		],
		expected: { is_public: true },
	},
	{
		testCase: 'should convert object "is" filter to pine $filter',
		filters: [
			{
				$id: '86Wyfaw4m5jwUjyz',
				anyOf: [
					{
						$id: 'gaisWBbrv5vY03C7',
						title: 'is',
						description:
							'{"title":"Tags","field":"application_tag","operator":{"slug":"is","label":"is"},"value":{"tag_key":"test","value":"test"}}',
						type: 'object',
						properties: {
							application_tag: {
								contains: {
									title: 'Tags',
									properties: {
										tag_key: {
											const: 'test',
										},
										value: {
											const: 'test',
										},
									},
								},
							},
						},
						required: ['application_tag'],
					},
				],
			},
		],
		expected: {
			application_tag: {
				$any: {
					$alias: 'at',
					$expr: {
						$and: [{ at: { tag_key: 'test' } }, { at: { value: 'test' } }],
					},
				},
			},
		},
	},
	{
		testCase: 'should convert object "is_not" filter to pine $filter',
		filters: [
			{
				$id: 'G4odbfzGrpMnrjk5',
				anyOf: [
					{
						$id: 'OGZJ96jybeYW6Fbz',
						title: 'is_not',
						description:
							'{"title":"Tags","field":"application_tag","operator":{"slug":"is_not","label":"is not"},"value":{"tag_key":"test","value":"test"}}',
						type: 'object',
						properties: {
							application_tag: {
								not: {
									contains: {
										title: 'Tags',
										properties: {
											tag_key: {
												const: 'test',
											},
											value: {
												const: 'test',
											},
										},
									},
								},
							},
						},
					},
				],
			},
		],
		expected: {
			$not: {
				application_tag: {
					$any: {
						$alias: 'at',
						$expr: {
							$and: [{ at: { tag_key: 'test' } }, { at: { value: 'test' } }],
						},
					},
				},
			},
		},
	},
	{
		testCase: 'should convert array "is" filter to pine $filter',
		filters: [
			{
				$id: 'JYoijEvWurOUHNjV',
				anyOf: [
					{
						$id: 'cJDDgBlHZYmqWnXy',
						title: 'is',
						description:
							'{"title":"Device type","field":"is_for__device_type","operator":{"slug":"is","label":"is"},"value":"bananapi-m1-plus","refScheme":"slug"}',
						type: 'object',
						properties: {
							is_for__device_type: {
								type: 'array',
								minItems: 1,
								contains: {
									properties: {
										slug: {
											const: 'bananapi-m1-plus',
										},
									},
									required: ['slug'],
								},
							},
						},
						required: ['is_for__device_type'],
					},
				],
			},
		],
		expected: {
			is_for__device_type: {
				$any: {
					$alias: 'ifdt',
					$expr: {
						ifdt: {
							slug: 'bananapi-m1-plus',
						},
					},
				},
			},
		},
	},
	{
		testCase: 'should convert array "is_not" filter to pine $filter',
		filters: [
			{
				$id: 'DEVF5Y2fWZd84xWq',
				title: 'is_not',
				description:
					'{"title":"Device type","field":"is_for__device_type","operator":{"slug":"is_not","label":"is not"},"value":"fincm3","refScheme":"slug"}',
				type: 'object',
				properties: {
					is_for__device_type: {
						type: 'array',
						minItems: 1,
						contains: {
							properties: {
								slug: {
									not: {
										const: 'fincm3',
									},
								},
							},
						},
					},
				},
				required: ['is_for__device_type'],
			},
		],
		expected: {
			is_for__device_type: {
				$any: {
					$alias: 'ifdt',
					$expr: {
						ifdt: {
							slug: {
								$ne: 'fincm3',
							},
						},
					},
				},
			},
		},
	},
	{
		testCase: 'should convert enum "is" "null" filter to pine $filter', // is default
		filters: [
			{
				$id: 'EEVF5Y2fWZd84xWq',
				title: 'is',
				description:
					'{"title":"Release policy","field":"should_be_running__release","operator":{"slug":"is","label":"is"},"value":null}',
				type: 'object',
				properties: {
					should_be_running__release: {
						const: null,
					},
				},
				required: ['should_be_running__release'],
			},
		],
		expected: {
			should_be_running__release: null,
		},
	},
	{
		testCase: 'should convert enum "is" "not null" filter to pine $filter', // is pinned
		filters: [
			{
				$id: 'FEVF5Y2fWZd84xWq',
				title: 'is',
				description:
					'{"title":"Release policy","field":"should_be_running__release","operator":{"slug":"is","label":"is"},"value":{"not":null}}',
				type: 'object',
				properties: {
					should_be_running__release: {
						not: { const: null },
					},
				},
				required: ['should_be_running__release'],
			},
		],
		expected: {
			$not: {
				should_be_running__release: null,
			},
		},
	},
	{
		testCase: 'should convert enum "is_not" "null" filter to pine $filter', // is not pinned
		filters: [
			{
				$id: 'GEVF5Y2fWZd84xWq',
				title: 'is_not',
				description:
					'{"title":"Release policy","field":"should_be_running__release","operator":{"slug":"is_not","label":"is not"},"value":null}',
				type: 'object',
				properties: {
					should_be_running__release: {
						const: null,
					},
				},
				required: ['should_be_running__release'],
			},
		],
		expected: {
			should_be_running__release: null,
		},
	},
	{
		testCase: 'should convert enum "is_not" "not null" filter to pine $filter', // is not default
		filters: [
			{
				$id: 'HEVF5Y2fWZd84xWq',
				title: 'is_not',
				description:
					'{"title":"Release policy","field":"should_be_running__release","operator":{"slug":"is_not","label":"is not"},"value":{"not":null}}',
				type: 'object',
				properties: {
					should_be_running__release: {
						not: { const: null },
					},
				},
				required: ['should_be_running__release'],
			},
		],
		expected: {
			$not: {
				should_be_running__release: null,
			},
		},
	},
];

describe('JSONSchema to Pine client converter', () => {
	filterTests.forEach((test) => {
		it(test.testCase, () => {
			const $filter = convertToPineClientFilter([], test.filters);
			expect($filter).toStrictEqual(test.expected);
		});
	});
});
