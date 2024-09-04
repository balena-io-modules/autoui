import React, { useState } from 'react';
import { DialogWithCloseButton, Material } from '@balena/ui-shared-components';
import type { AutoUIEntityPropertyDefinition } from '../../AutoUI';
import { useTranslation } from '../../hooks/useTranslation';

const {
	DialogContent,
	DialogActions,
	FormGroup,
	FormControlLabel,
	Checkbox,
	Button,
	Tooltip,
	Typography,
} = Material;

interface AddTagHandlerProps {
	columns: Array<AutoUIEntityPropertyDefinition<any>>;
	tagKeys: string[];
	onClose: (selectedTagColumns: string[]) => void;
}

export const AddTagHandler: React.FC<AddTagHandlerProps> = ({
	columns,
	tagKeys,
	onClose,
}) => {
	const { t } = useTranslation();
	const tagColumnSet = React.useMemo(
		() =>
			new Set(
				columns
					.filter(
						(c) => typeof c.label === 'string' && c.label.startsWith('Tag:'),
					)
					.map((c) => c.title),
			),
		[columns],
	);
	const [tagColumns, setTagColumns] = useState(new Set<string>());

	const handleToggle = React.useCallback(
		(tagKey: string) => {
			setTagColumns((prevTagColumns) => {
				const newSet = new Set(prevTagColumns);
				if (tagColumnSet.has(tagKey) || newSet.has(tagKey)) {
					newSet.delete(tagKey);
				} else {
					newSet.add(tagKey);
				}
				return newSet;
			});
		},
		[tagColumnSet],
	);

	return (
		<DialogWithCloseButton
			title="Add tag columns"
			onClose={() => {
				onClose([]);
			}}
			open
		>
			<DialogContent>
				<FormGroup>
					{tagKeys.map((tagKey, i) => (
						<Tooltip
							key={`${tagKey}_${i}`}
							title={
								tagColumnSet.has(tagKey) ? t('info.already_visible') : null
							}
						>
							<FormControlLabel
								key={tagKey}
								control={
									<Checkbox
										disabled={tagColumnSet.has(tagKey)}
										checked={tagColumnSet.has(tagKey) || tagColumns.has(tagKey)}
										onClick={() => {
											handleToggle(tagKey);
										}}
									/>
								}
								label={
									<Typography noWrap maxWidth={200}>
										{tagKey}
									</Typography>
								}
							/>
						</Tooltip>
					))}
				</FormGroup>
			</DialogContent>
			<DialogActions>
				<Button
					aria-label={t('aria_labels.save_tag_columns')}
					onClick={() => {
						onClose([...tagColumns]);
					}}
					disabled={tagColumns.size === 0}
					variant="contained"
				>
					{t('actions.add_columns')}
				</Button>
			</DialogActions>
		</DialogWithCloseButton>
	);
};
