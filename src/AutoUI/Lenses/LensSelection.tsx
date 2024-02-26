import React from 'react';
import { LensTemplate } from '.';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Material } from '@balena/ui-shared-components';
import { useTranslation } from '../../hooks/useTranslation';

const { ToggleButtonGroup, ToggleButton, Box } = Material;

interface LensSelectionProps {
	lenses: LensTemplate[];
	lens: LensTemplate;
	setLens: (lens: LensTemplate) => void;
	rest?: any;
}

export const LensSelection = ({
	lenses,
	lens,
	setLens,
	...rest
}: LensSelectionProps) => {
	const { t } = useTranslation();
	if (lenses.length <= 1) {
		return null;
	}
	return (
		<Box {...rest}>
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
		</Box>
	);
};
