import * as types from './types';
import type { JSONSchema7 } from 'json-schema';
import type { IconProp } from '@fortawesome/fontawesome-svg-core';
import uniq from 'lodash/uniq';
import { findInObject } from '../utils';

export interface LensTemplate<T = any> {
	slug: string;
	name: string;
	data: {
		label: string;
		format: string;
		renderer: (
			props:
				| types.CollectionLensRendererProps<T>
				| types.EntityLensRendererProps<T>,
		) => React.ReactElement | null;
		icon: IconProp;
		type: string;
		filter: JSONSchema7;
		pathRegExp?: string;
	};
}

const lenses: LensTemplate[] = Object.values(types);

// Returns an array of lenses that can be used to render `data`.
export const getLenses = <T extends object>(
	data: T[] | T | undefined,
	customLenses?: LensTemplate[],
) => {
	if (!data) {
		return [];
	}

	const filteredLenses: LensTemplate[] = lenses
		.concat(customLenses ?? [])
		.filter((l) =>
			Array.isArray(data)
				? l.data.format !== 'summary'
				: l.data.format !== 'table',
		);

	const slugs = filteredLenses.map((lens) => lens.slug);
	if (slugs.length > uniq(slugs).length) {
		throw new Error('Lenses must have unique slugs');
	}

	return filteredLenses;
};

export const getLens = <T extends object>(data: T[]) => {
	return getLenses(data)?.[0];
};

export const lensWithMoreProperties = <T extends object>(
	lenses?: LensTemplate[],
) => {
	if (!lenses) {
		return;
	}
	let filteredLens: LensTemplate<T> | null = null;
	let maxKeys = 0;

	for (const lens of lenses) {
		const properties = findInObject(lens.data.filter, 'properties') || {};
		const keyCount = Object.keys(properties).length;

		if (keyCount > maxKeys) {
			filteredLens = lens;
			maxKeys = keyCount;
		}
	}

	return filteredLens;
};
