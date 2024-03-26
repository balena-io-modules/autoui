import React from 'react';
import { LensTemplate } from '.';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Material } from '@balena/ui-shared-components';
import { useTranslation } from '../../hooks/useTranslation';
const { ToggleButtonGroup, ToggleButton } = Material;

interface LensSelectionProps {
	lenses: LensTemplate[];
	lens: LensTemplate;
	setLens: (lens: LensTemplate) => void;
}

export const LensSelection = ({
	lenses,
	lens,
	setLens,
}: LensSelectionProps) => {
	const { t } = useTranslation();
	if (lenses.length <= 1) {
		return null;
	}
	return (
		<ToggleButtonGroup
			exclusive
			aria-label={t('labels.lenses')}
			value={lens?.slug}
		>
			{lenses.map((item) => {
				return (
					<ToggleButton
						aria-label={item.name}
						title={item.name}
						key={item.slug}
						value={item.slug}
						data-test={`lens-selector--${item.slug}`}
						data-slug={item.slug}
						onClick={() => setLens(item)}
					>
						<FontAwesomeIcon icon={item.data.icon} />
					</ToggleButton>
				);
			})}
		</ToggleButtonGroup>
	);
};
