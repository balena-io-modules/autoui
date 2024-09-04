// AddTagHandler.tsx
import React, { useState } from 'react';
import { DialogWithCloseButton, Material } from '@balena/ui-shared-components';
import { AutoUIEntityPropertyDefinition } from '../../AutoUI';
import { useTranslation } from '../../hooks/useTranslation';

const {
	DialogContent,
	DialogActions,
	FormGroup,
	FormControlLabel,
	Checkbox,
	Button,
	Tooltip,
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
	const [tagColumns, setTagColumns] = useState<Set<string>>(new Set());

	const handleToggle = (tagKey: string) => {
		const newSet = new Set(tagColumns);
		if (tagColumnSet.has(tagKey) || newSet.has(tagKey)) {
			newSet.delete(tagKey);
		} else {
			newSet.add(tagKey);
		}
		setTagColumns(newSet);
	};

	return (
		<DialogWithCloseButton
			title="Add tag columns"
			onClose={() => onClose([])}
			open={true}
		>
			<DialogContent>
				<FormGroup>
					{tagKeys.map((tagKey) => (
						<Tooltip
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
										onClick={() => handleToggle(tagKey)}
									/>
								}
								label={`Tag: ${tagKey}`}
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
