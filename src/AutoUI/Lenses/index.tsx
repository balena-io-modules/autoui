import groupBy from 'lodash/groupBy';
import skhema from 'skhema';
import jsone from 'json-e';
import * as types from './types';
import type { JSONSchema7 } from 'json-schema';
import type { IconProp } from '@fortawesome/fontawesome-svg-core';

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

interface LensData {
	lens: LensTemplate;
	match: {
		valid: boolean;
		errors: string[];
		score: number;
	};
}

const lenses: LensTemplate[] = Object.values(types);

export const getLenses = <T,>(
	data: T[] | T,
	context: object = {},
	customLenses?: LensTemplate[],
) => {
	if (!data) {
		return [];
	}

	const filteredLenses: LensTemplate[] = lenses.concat(customLenses ?? []);

	const slugs = filteredLenses.map((lens) => lens.slug);
	if (new Set(slugs).size !== slugs.length) {
		throw new Error('Lenses must have unique slugs');
	}

	// pick the lenses with filters matching the data
	let sortedData: LensData[] = filteredLenses
		.map((lens) => {
			const filter = jsone(lens.data.filter, context);
			return {
				lens,
				match: skhema.match(filter, data),
			};
		})
		.filter((value) => value.match.valid);

	// pick the lens with the highest score for each format
	sortedData = Object.values(
		Object.fromEntries(
			Object.entries(groupBy(sortedData, (item) => item.lens.data.format)).map(
				([format, group]) => {
					return [
						format,
						group.reduce((prev, current) =>
							current.match.score > prev.match.score ? current : prev,
						),
					];
				},
			),
		),
	);

	return sortedData
		.sort((a, b) => b.match.score - a.match.score)
		.map((value) => value.lens);
};

export const getLens = <T,>(data: T[], context?: object) => {
	return getLenses(data, context)?.[0];
};

export const getLensBySlug = (slug: string) => {
	const fullList = Object.values(lenses).flat();
	return fullList.find((f) => f.slug === slug);
};

export const getLensForTarget = (target: string) => {
	return lenses.find(
		(lens) =>
			lens.data.pathRegExp && new RegExp(lens.data.pathRegExp).test(target),
	);
};
