import template from 'lodash/template';
import { useContext } from 'react';
import { ContextProvider } from '../contexts/ContextProvider';

export type TFunction = (str: string, options?: any) => string;

const translationMap = {
	'labels.modify': 'Modify',
	'labels.actions': 'Actions',
	'info.update_item_no_permissions':
		"You don't have permission to {{action}} the selected {{resource}}",
	'info.ongoing_action_wait': 'There is an ongoing action, please wait',
	'info.create_item_no_permissions': "You don't have permission to create a new {{resource}}",
	'resource.item_plural': 'Items',
	'no_resource_data': "You don't have any {{resource}} yet.",
	'questions.how_about_adding_one': 'How about adding one?',
	'success.resource_added_successfully': '{{name}} added successfully',
};

const getTranslation = (str: string, opts?: any) => {
	let translation = translationMap[str as keyof typeof translationMap];
	if (!opts) {
		return translation;
	}
	if (opts.count != null && opts.count > 1) {
		const pluralKey = `${str}_plural` as keyof typeof translationMap;
		translation =
			translationMap[pluralKey] ??
			translationMap[str as keyof typeof translationMap];
	}
	const compiled = template(translation, { interpolate: /{{([\s\S]+?)}}/g });
	return compiled(opts);
};

export const useTranslation = () => {
	const { t: externalT } = useContext(ContextProvider);
	const t: TFunction = (str: string, opts?: any) => {
		let result = str;
		if (!!externalT && typeof externalT === 'function') {
			result = externalT(str, opts);
		}
		if (result == null || result === str) {
			result = getTranslation(str, opts);
		}
		return result ?? str;
	};

	return { t };
};
