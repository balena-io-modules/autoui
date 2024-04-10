import React from 'react';
// import { Button } from '../Button';
// import { Flex } from '../Flex';
// import { Form } from '../Form';
// import { Modal } from '../Modal';
// import { Txt } from '../Txt';
import type { JSONSchema7 as JSONSchema } from 'json-schema';
import FilterDescription from './FilterDescription';
import { Material } from '@balena/ui-shared-components';
import { Typography } from '@mui/material';
const { Box, Button} = Material;

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
	return (
		<>
			<Box flex="1" flexDirection="column">
				<Box flex="1" justifyContent="space-between">
					<Box>
						<Typography variant='h4'>Filters</Typography>
						<Typography mr={1}>({filters.length})</Typography>
						<Button variant='text' onClick={onClearFilters}>
							Clear all
						</Button>
					</Box>
					{showSaveView && (
						<Box>
							<Button variant='text' onClick={() => setShowViewForm(true)}>
								Save view
							</Button>
						</Box>
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
			{showViewForm && (
				<Modal
					title="Save current view"
					cancel={() => setShowViewForm(false)}
					done={() => {
						if (!viewData?.name) {
							return;
						}
						onSaveView(viewData);
						setShowViewForm(false);
					}}
					action="Save"
					primaryButtonProps={{
						disabled: !viewData?.name,
					}}
				>
					<Form
						width="100%"
						hideSubmitButton
						liveValidate
						onFormChange={({ formData }: { formData: { name: string } }) =>
							setViewData(formData)
						}
						schema={schema}
						value={viewData}
					/>
				</Modal>
			)}
		</>
	);
};
