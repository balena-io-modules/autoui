import React from 'react';
import { mount } from 'enzyme';
import {
	autoUIRunTransformers,
	autoUIGetModelForCollection,
	AutoUIProps,
	AutoUI,
} from './index';
import {
	dataExample,
	AugmentedSshKey,
	transformers,
	model as sshKeyModel,
} from './models/example';
import { Provider, Table } from 'rendition';
import { AutoUIProvider } from '../AutoUIProvider';
import { History } from 'history';

const props = {} as AutoUIProps<AugmentedSshKey>;
const TestAutoUI = () => <Demo {...props} />;

const Demo = ({ data, model, ...otherProps }: AutoUIProps<AugmentedSshKey>) => {
	const memoizedData = React.useMemo(
		() =>
			autoUIRunTransformers(dataExample, transformers, {
				accessRole: 'administrator',
			}),
		[dataExample],
	) as AugmentedSshKey[];

	return (
		<AutoUIProvider history={{ createHref: (_to: any) => 'porcodio' } as History} t={undefined}>
			<AutoUI<AugmentedSshKey>
				data={data ?? memoizedData}
				model={model ?? autoUIGetModelForCollection(sshKeyModel)}
				actions={[]}
				{...otherProps}
			/>
		</AutoUIProvider>
	);
};

describe('AutoUI', () => {
	describe('Collection component', () => {
		it('should render the collection with N results', () => {
			const component = mount(
				<Provider>
					<TestAutoUI />
				</Provider>,
			);
			const table = component.find(Table);
			const tableRows = table.find(
				'[data-display="table-body"] [data-display="table-row"]',
			);

			expect(tableRows).toHaveLength(dataExample.length);
		});
	});
});
