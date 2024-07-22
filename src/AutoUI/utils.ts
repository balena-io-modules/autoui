import type {
	AutoUIBaseResource,
	Permissions,
	Priorities,
	AutoUITagsSdk,
} from './schemaOps';
import { getPropertyScheme } from './schemaOps';
import castArray from 'lodash/castArray';
import get from 'lodash/get';
import type { TFunction } from '../hooks/useTranslation';
import type {
	JSONSchema7 as JSONSchema,
	JSONSchema7Type as JSONSchemaType,
} from 'json-schema';
import type { CheckedState, TableSortFunction } from 'rendition';
import { JsonTypes } from 'rendition';

export const diff = <T>(a: T, b: T) => {
	if (a === b) {
		return 0;
	}
	return a > b ? 1 : -1;
};

export const stopEvent = (event: React.MouseEvent<HTMLElement>) => {
	event.preventDefault();
	event.stopPropagation();
};

export const getFromLocalStorage = <T>(key: string): T | undefined => {
	try {
		const val = localStorage.getItem(key);
		if (val != null) {
			return JSON.parse(val);
		}

		return undefined;
	} catch (err) {
		console.error(err);
		return undefined;
	}
};

export const setToLocalStorage = (key: string, value: any) => {
	try {
		localStorage.setItem(key, JSON.stringify(value));
	} catch (err) {
		console.error(err);
	}
};

export const findInObject = (
	obj: any,
	key: string,
): JSONSchemaType | undefined => {
	let result;
	for (const property in obj) {
		if (obj.hasOwn(property)) {
			if (property === key) {
				return obj[key]; // returns the value
			} else if (typeof obj[property] === 'object') {
				// in case it is an object
				result = findInObject(obj[property], key);

				if (typeof result !== 'undefined') {
					return result;
				}
			}
		}
	}
};

export const getTagsDisabledReason = async <T extends AutoUIBaseResource<T>>(
	selected: T[] | undefined,
	tagField: keyof T,
	checkedState: CheckedState | undefined,
	tagsSdk: AutoUITagsSdk<T>,
	t: TFunction,
) => {
	if (checkedState !== 'all' && (!selected || selected.length === 0)) {
		return t('info.no_selected');
	}

	const lacksPermissionsOnSelected =
		tagsSdk && 'canAccess' in tagsSdk
			? !(await tagsSdk.canAccess({ checkedState, selected }))
			: selected?.some((entry) => {
					return (
						!entry.__permissions.delete &&
						!entry.__permissions.create.includes(tagField) &&
						!entry.__permissions.update.includes(tagField)
					);
				});

	if (lacksPermissionsOnSelected) {
		// TODO: Pass the resource name instead.
		return t('info.edit_tag_no_permissions', { resource: 'item' });
	}
	return null;
};

export const getCreateDisabledReason = <T extends AutoUIBaseResource<T>>(
	permissions: Permissions<T>,
	hasOngoingAction: boolean,
	t: TFunction,
) => {
	if (hasOngoingAction) {
		return t('info.ongoing_action_wait');
	}

	if (!permissions.create?.length) {
		return t('info.create_item_no_permissions', { resource: 'item' });
	}
};

export const autoUIGetDisabledReason = <T extends AutoUIBaseResource<T>>(
	selected: T[] | undefined,
	checkedState: CheckedState | undefined,
	hasOngoingAction: boolean,
	actionType: 'update' | 'delete' | null,
	t: TFunction,
) => {
	if ((!selected && checkedState === 'none') || selected?.length === 0) {
		return t('info.no_selected');
	}

	if (hasOngoingAction) {
		return t('info.ongoing_action_wait');
	}

	if (!selected || !actionType) {
		return;
	}

	const lacksPermissionsOnSelected = selected.some((entry) => {
		return (
			!entry.__permissions[actionType] ||
			(Array.isArray(entry.__permissions[actionType]) &&
				(entry.__permissions[actionType] as Array<keyof T>).length <= 0)
		);
	});

	if (lacksPermissionsOnSelected) {
		return t('info.update_item_no_permissions', {
			action: actionType,
			resource: 'item',
		});
	}
};

const sortFn = (
	a: string | unknown,
	b: string | unknown,
	ref: string | string[],
) => {
	const aa = get(a, ref) ?? '';
	const bb = get(b, ref) ?? '';
	if (typeof aa === 'string' && typeof bb === 'string') {
		return aa.toLowerCase().localeCompare(bb.toLowerCase());
	}
	return diff(aa, bb);
};

export const getSortingFunction = <T>(
	schemaKey: Extract<keyof T, string>,
	schemaValue: JSONSchema,
): TableSortFunction<T> => {
	const types = castArray(schemaValue.type);
	const refScheme = getPropertyScheme(schemaValue);
	if (types.includes(JsonTypes.string)) {
		return (a: T, b: T) => sortFn(a, b, schemaKey);
	}
	if (types.includes(JsonTypes.object) && refScheme) {
		return (a: T, b: T) => sortFn(a, b, [schemaKey, ...refScheme]);
	}
	if (types.includes(JsonTypes.array) && refScheme) {
		return (a: T, b: T) => sortFn(a, b, [schemaKey, '0', ...refScheme]);
	}
	return (a: T, b: T) => diff(a[schemaKey], b[schemaKey]);
};

export const getSelected = <T, K extends keyof T>(
	key: K,
	priorities?: Priorities<T>,
) => {
	if (!priorities) {
		return true;
	}
	return (
		priorities?.primary.includes(key) || priorities?.secondary.includes(key)
	);
};
