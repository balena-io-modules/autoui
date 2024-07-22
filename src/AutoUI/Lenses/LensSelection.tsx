// import React from 'react';
// import type { LensTemplate } from '.';
// import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
// import { Material } from '@balena/ui-shared-components';
// import { useTranslation } from '../../hooks/useTranslation';
// const { ToggleButtonGroup, ToggleButton } = Material;

// interface LensSelectionProps<T> {
// 	lenses: Array<LensTemplate<T>>;
// 	lens: LensTemplate<T>;
// 	setLens: (lens: LensTemplate<T>) => void;
// }

// export const LensSelection = <T extends {}>({
// 	lenses,
// 	lens,
// 	setLens,
// }: LensSelectionProps<T>) => {
// 	const { t } = useTranslation();
// 	if (lenses.length <= 1) {
// 		return null;
// 	}
// 	return (
// 		<ToggleButtonGroup
// 			exclusive
// 			aria-label={t('labels.lenses')}
// 			value={lens?.slug}
// 		>
// 			{lenses.map((item) => {
// 				return (
// 					<ToggleButton
// 						aria-label={item.name}
// 						title={item.name}
// 						key={item.slug}
// 						value={item.slug}
// 						data-test={`lens-selector--${item.slug}`}
// 						data-slug={item.slug}
// 						onClick={() => {
// 							setLens(item);
// 						}}
// 					>
// 						<FontAwesomeIcon icon={item.data.icon} />
// 					</ToggleButton>
// 				);
// 			})}
// 		</ToggleButtonGroup>
// 	);
// };

import React from 'react';
import type { LensTemplate } from '.';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Material } from '@balena/ui-shared-components';
import { useTranslation } from '../../hooks/useTranslation';

const { ToggleButtonGroup, ToggleButton } = Material;

interface LensSelectionProps<T> {
	lenses: LensTemplate<T>[];
	lens: LensTemplate<T>;
	setLens: (lens: LensTemplate<T>) => void;
}

export const LensSelection = <T extends unknown>({
	lenses,
	lens,
	setLens,
}: LensSelectionProps<T>) => {
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
			{lenses.map((item) => (
				<ToggleButton
					aria-label={item.name}
					title={item.name}
					key={item.slug}
					value={item.slug}
					data-test={`lens-selector--${item.slug}`}
					data-slug={item.slug}
					onClick={() => {
						setLens(item);
					}}
				>
					<FontAwesomeIcon icon={item.data.icon} />
				</ToggleButton>
			))}
		</ToggleButtonGroup>
	);
};
