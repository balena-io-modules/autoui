import groupBy from 'lodash/groupBy';
import sortBy from 'lodash/sortBy';
import find from 'lodash/find';
import flatten from 'lodash/flatten';
import values from 'lodash/values';
import skhema from 'skhema';
import jsone from 'json-e';
import * as types from './types';
import type { JSONSchema7 } from 'json-schema';
import type { IconProp } from '@fortawesome/fontawesome-svg-core';
import map from 'lodash/map';
import uniq from 'lodash/uniq';

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

// Returns an array of lenses that can be used to render `data`.
export const getLenses = <T extends object>(
	data: T[] | T | undefined,
	context: object = {},
	customLenses?: LensTemplate[],
) => {
	if (!data) {
		return [];
	}

	const filteredLenses: LensTemplate[] = lenses.concat(customLenses ?? []);

	const slugs = filteredLenses.map((lens) => lens.slug);
	if (slugs.length > uniq(slugs).length) {
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
	sortedData = flatten<LensData>(
		values(
			map(
				groupBy<LensData>(sortedData, 'lens.data.format'),
				(group: LensData[]) =>
					group.reduce((prev, current) => {
						if (current.match.score > prev.match.score) {
							return current;
						} else {
							return prev;
						}
					}),
			),
		),
	);

	return sortBy<LensData>(sortedData, 'match.score')
		.reverse()
		.map((value) => value.lens);
};

export const getLens = <T extends object>(data: T[], context?: object) => {
	return getLenses(data, context)?.[0];
};

export const getLensBySlug = (slug: string) => {
	const fullList = flatten(values(lenses));
	return (
		find(fullList, {
			slug,
		}) ?? null
	);
};

export const getLensForTarget = (target: string) => {
	return find(lenses, (lens) => {
		return (
			lens.data.pathRegExp && new RegExp(lens.data.pathRegExp).test(target)
		);
	});
};
