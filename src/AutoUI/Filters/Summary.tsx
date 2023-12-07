import React from 'react';
import type { JSONSchema7 as JSONSchema } from 'json-schema';
import { Button, Flex, Txt } from 'rendition';
import FilterDescription from './FilterDescription';
import {
	DialogWithCloseButton,
	Material,
	RJSForm,
} from '@balena/ui-shared-components';
const { DialogContent, DialogActions } = Material;

interface ViewData {
	name: string;
}

export interface SummaryProps {
	filters: JSONSchema[];
	onEdit: (filter: JSONSchema) => void;
	onDelete: (filter: JSONSchema) => void;
	onClearFilters: () => void;
	showSaveView?: boolean;
	onSaveView: (viewData: ViewData) => void;
}

const schema: JSONSchema = {
	type: 'object',
	properties: {
		name: { type: 'string' },
	},
};

export const Summary = ({
	filters,
	onEdit,
	onDelete,
	onClearFilters,
	showSaveView,
	onSaveView,
}: SummaryProps) => {
	const [showViewForm, setShowViewForm] = React.useState(false);
	const [viewData, setViewData] = React.useState<ViewData | undefined>();

	const viewsFormId = crypto.randomUUID();

	return (
		<>
			<Flex flex="1" flexDirection="column">
				<Flex flex="1" justifyContent="space-between">
					<Flex>
						<Txt bold>Filters</Txt>
						<Txt mr={1}>({filters.length})</Txt>
						<Button plain primary onClick={onClearFilters}>
							Clear all
						</Button>
					</Flex>
					{showSaveView && (
						<Flex>
							<Button plain primary onClick={() => setShowViewForm(true)}>
								Save view
							</Button>
						</Flex>
					)}
				</Flex>
				<Flex flexWrap="wrap">
					{filters.map((filter, index) => (
						<FilterDescription
							key={filter.$id || index}
							filter={filter}
							onClick={() => {
								onEdit(filter);
							}}
							onClose={() => onDelete(filter)}
						/>
					))}
				</Flex>
			</Flex>
			<DialogWithCloseButton
				open={showViewForm}
				title="Save current view"
				onClose={() => setShowViewForm(false)}
			>
				<DialogContent>
					<RJSForm
						id={viewsFormId}
						hideSubmitButton
						liveValidate
						onChange={({ formData }: { formData: { name: string } }) =>
							setViewData(formData)
						}
						schema={schema}
						formData={viewData}
						onSubmit={() => {
							if (!viewData?.name) {
								return;
							}
							onSaveView(viewData);
							setShowViewForm(false);
						}}
					/>
				</DialogContent>
				<DialogActions>
					<Button
						// @ts-expect-error rendition Button typing does not acknowledge the existence of this HTMLButton attribute for some reason
						form={viewsFormId}
						primary
						type="submit"
						disabled={!viewData?.name}
					>
						Save
					</Button>
				</DialogActions>
			</DialogWithCloseButton>
		</>
	);
};
