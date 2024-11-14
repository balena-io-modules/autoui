import template from 'lodash/template';
import { useContext } from 'react';
import type { Dictionary } from '../common';
import { ContextProvider } from '../contexts/ContextProvider';

export type TFunction = (str: string, options?: any) => string;

const translationMap = {
	'actions.manage_tags': 'Manage tags',
	'info.update_item_no_permissions':
		"You don't have permission to {{action}} the selected {{resource}}",
	'info.ongoing_action_wait': 'There is an ongoing action, please wait',
	'info.create_item_no_permissions':
		"You don't have permission to create a new {{resource}}",
	'info.edit_tag_no_permissions':
		"You don't have permission to edit the tags on the selected {{resource}}",
	'info.no_selected': "You haven't selected anything yet",
	'info.not_defined': 'Not defined',
	'info.learn_more': 'Learn more about {{title}}',
	'labels.lenses': 'Lenses',
	'labels.modify': 'Modify',
	'loading.resource': 'Loading {{resource}}',
	'no_data.no_resource_data': "You don't have any {{resource}} yet.",
	'no_data.no_resource_data_title': 'This is where all your {{resource}} live.',
	'no_data.no_resource_data_description':
		"This is a bit empty right now, let's go ahead and add one",
	'questions.how_about_adding_one': 'How about adding one?',
	'resource.item_other': 'Items',
	'success.resource_added_successfully': '{{name}} added successfully',
	'success.tags_updated_successfully': 'Tags updated successfully',

	'actions.add_filter': 'Add filter',
	'labels.filter_by': 'Filter by',
	'labels.info_no_views': "You haven't created any views yet",
	'labels.views': 'Views',
	'labels.filter_one': 'Filter',
	'labels.filter_other': 'Filters',

	'labels.save_current_view': 'Save current view',

	'aria_labels.remove_view': 'Delete the selected view',
	'aria_labels.create_view': 'Create named view',
	'aria_labels.add_filter_in_or': 'Add filter with OR condition',
	'aria_labels.remove_filter': 'Remove selected filter',

	'actions.clear_all': 'Clear filters',
	'actions.save_view': 'Save view',
	'actions.cancel': 'Cancel',
	'actions.add_alternative': 'Add alternative',
	'actions.remove_filter': 'Remove filter',

	'commons.or': 'or',
};

const getTranslation = (
	str: string,
	opts?: any,
	extraTranslationMap?: Dictionary<string>,
) => {
	let translation =
		extraTranslationMap?.[str as keyof typeof translationMap] ??
		translationMap[str as keyof typeof translationMap];
	if (!opts) {
		return translation;
	}
	if (opts.count != null && opts.count > 1) {
		const pluralKey = `${str}_other` as keyof typeof translationMap;
		translation =
			translationMap[pluralKey] ??
			translationMap[str as keyof typeof translationMap];
	}
	const compiled = template(translation, { interpolate: /{{([\s\S]+?)}}/g });
	return compiled(opts);
};

export const useTranslation = () => {
	const { t: externalT, externalTranslationMap } = useContext(ContextProvider);
	const t: TFunction = (str: string, opts?: any) => {
		let result = str;
		if (!!externalT && typeof externalT === 'function') {
			result = externalT(str, opts);
		}
		if (result == null || result === str) {
			result = getTranslation(str, opts, externalTranslationMap);
		}
		return result ?? str;
	};

	return { t };
};
