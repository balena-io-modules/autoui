import React from 'react';
import { JSONSchema7 as JSONSchema } from 'json-schema';
import {
	DialogWithCloseButton,
	Material,
	RJSForm,
} from '@balena/ui-shared-components';
import { useTranslation } from '../../hooks/useTranslation';
import { FilterDescription } from './FilterDescription';

const { Box, Typography, Button, DialogContent, DialogActions } = Material;

interface ViewData {
	name: string;
}
interface SummaryProps {
	filters: JSONSchema[];
	onEdit: (filter: JSONSchema) => void;
	onDelete: (filter: JSONSchema) => void;
	onClearFilters: () => void;
	showSaveView?: boolean;
	dark?: boolean;
	onSaveView: (viewData: ViewData) => void;
}

const schema: JSONSchema = {
	type: 'object',
	properties: {
		name: {
			title: 'View name',
			type: 'string',
		},
	},
};

export const Summary = ({
	filters,
	showSaveView,
	dark,
	onClearFilters,
	onSaveView,
	onEdit,
	onDelete,
}: SummaryProps) => {
	const { t } = useTranslation();
	const [showViewForm, setShowViewForm] = React.useState(false);
	const [viewData, setViewData] = React.useState<ViewData | undefined>();
	return (
		<Box display="flex" flexDirection="column" my={2}>
			<Box display="flex" justifyContent="space-between" alignItems="center">
				<Box
					display="flex"
					gap={1}
					alignItems="center"
					sx={{ color: dark ? 'white' : 'primary' }}
				>
					<Typography sx={{ fontWeight: 'bold' }}>
						{t('labels.filter_other')}
					</Typography>
					<Typography>({filters.length})</Typography>
					<Button variant="text" onClick={onClearFilters}>
						{t('actions.clear_all')}
					</Button>
				</Box>
				{showSaveView && (
					<Button variant="text" onClick={() => setShowViewForm(true)}>
						{t('actions.save_view')}
					</Button>
				)}
			</Box>
			<Box display="flex" flexWrap="wrap">
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
			</Box>
			<DialogWithCloseButton
				fullWidth
				open={showViewForm}
				title={t('labels.save_current_view')}
				onClose={() => {
					setShowViewForm(false);
				}}
			>
				<DialogContent>
					<RJSForm
						liveValidate
						hideSubmitButton
						onChange={({ formData }: { formData: { name: string } }) =>
							setViewData(formData)
						}
						schema={schema}
						formData={viewData}
					/>
				</DialogContent>
				<DialogActions>
					<Button
						aria-label={t('aria_labels.create_view')}
						onClick={() => {
							if (!viewData) {
								return;
							}
							onSaveView?.(viewData);
							setShowViewForm(false);
						}}
						disabled={!viewData?.name?.length}
						variant="contained"
					>
						{t('actions.save_view')}
					</Button>
				</DialogActions>
			</DialogWithCloseButton>
		</Box>
	);
};
