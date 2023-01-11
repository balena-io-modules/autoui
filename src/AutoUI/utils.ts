import { AutoUIBaseResource, Permissions, Priorities } from './schemaOps';
import castArray from 'lodash/castArray';
import get from 'lodash/get';
import { TFunction } from '../hooks/useTranslation';
import {
	JSONSchema,
	JsonTypes,
	TableSortFunction,
	SchemaSieve,
} from 'rendition';

export const diff = <T extends unknown>(a: T, b: T) => {
	if (a === b) {
		return 0;
	}
	return a > b ? 1 : -1;
};

export const stopEvent = (event: React.MouseEvent<HTMLElement, MouseEvent>) => {
	event.preventDefault();
	event.stopPropagation();
};

export const getFromLocalStorage = <T extends any>(
	key: string,
): T | undefined => {
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

export const findInObject = (obj: any, key: string): any => {
	let result;
	for (const property in obj) {
		if (obj.hasOwnProperty(property)) {
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

export const ObjectFromEntries = (entries: any[]) => {
	const obj = {} as any;
	for (const [key, value] of entries) {
		obj[key] = value;
	}
	return obj;
};

export const getTagsDisabledReason = <T extends AutoUIBaseResource<T>>(
	selected: T[] | undefined,
	tagField: keyof T,
	t: TFunction,
) => {
	if (!selected || selected.length === 0) {
		return t('info.no_selected');
	}

	const lacksPermissionsOnSelected = selected.some((entry) => {
		return (
			!entry.__permissions.delete &&
			!entry.__permissions.create.includes(tagField) &&
			!entry.__permissions.update.includes(tagField as keyof T)
		);
	});

	if (lacksPermissionsOnSelected) {
		// TODO: Pass the resource name instead.
		return t('info.edit_tag_no_permissions', { resource: 'item' });
	}
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
	hasOngoingAction: boolean,
	actionType: 'update' | 'delete' | null,
	t: TFunction,
) => {
	if (!selected || !actionType) {
		return;
	}

	if (selected.length === 0) {
		return t('info.no_selected');
	}

	if (hasOngoingAction) {
		return t('info.ongoing_action_wait');
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

export const getSortingFunction = <T extends any>(
	schemaKey: keyof T,
	schemaValue: JSONSchema,
): TableSortFunction<T> => {
	const types = castArray(schemaValue.type);
	const refScheme = SchemaSieve.getPropertyScheme(schemaValue);
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

export const onClickOutOrEsc = (
	wrapper: HTMLDivElement,
	callback: () => void,
) => {
	const handleClickOutside = (event: MouseEvent) => {
		if (!wrapper.contains(event.target as Node)) {
			handler();
		}
	};
	const handleEsc = (event: KeyboardEvent) => {
		if (event.key === 'Escape') {
			handler();
		}
	};
	const handler = () => {
		callback();
		if (document.activeElement instanceof HTMLElement) {
			document.activeElement.blur();
		}
		document.removeEventListener('mousedown', handleClickOutside);
		document.removeEventListener('keydown', handleEsc);
	};
	document.addEventListener('mousedown', handleClickOutside);
	document.addEventListener('keydown', handleEsc);
};
