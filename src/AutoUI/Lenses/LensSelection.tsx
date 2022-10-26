import React from 'react';
import { LensTemplate } from '.';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Box, Button, ButtonGroup } from 'rendition';

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
	if (lenses.length <= 1) {
		return null;
	}
	return (
		<Box {...rest}>
			<ButtonGroup>
				{lenses.map((item) => {
					return (
						<Button
							key={item.slug}
							active={lens && lens.slug === item.slug}
							data-test={`lens-selector--${item.slug}`}
							data-slug={item.slug}
							onClick={() => setLens(item)}
							tooltip={{
								text: item.data.label,
								placement: 'bottom',
							}}
							icon={<FontAwesomeIcon icon={item.data.icon} />}
							quartenary
							outline
						/>
					);
				})}
			</ButtonGroup>
		</Box>
	);
};
