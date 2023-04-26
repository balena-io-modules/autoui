import React from 'react';
import { AutoUIBaseResource, AutoUIModel } from '../schemaOps';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Button } from 'rendition';
import { faDownload } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from '../../hooks/useTranslation';

// // Source: https://stackoverflow.com/questions/41028114/how-to-convert-array-of-nested-objects-to-csv
// const pivot = (arr: object[]) => {
// 	const mp = new Map();

// 	const setValue = (a: string[], path: string[], val: any) => {
// 		if (Object(val) !== val) {
// 			// primitive value
// 			const pathStr = path.join('.');
// 			const i = (mp.has(pathStr) ? mp : mp.set(pathStr, mp.size)).get(pathStr);
// 			a[i] = val;
// 		} else {
// 			for (const key of Object.keys(val)) {
// 				setValue(a, key === '0' ? path : path.concat(key), val[key]);
// 			}
// 		}
// 		return a;
// 	};

// 	const result = arr.map((obj) => setValue([], [], obj));
// 	return [[...mp.keys()], ...result];
// };

// // Source: https://stackoverflow.com/questions/41028114/how-to-convert-array-of-nested-objects-to-csv
// const toCsv = (arr: any[][]) => {
// 	return arr
// 		.map((row) =>
// 			row.map((val) => (isNaN(val) ? JSON.stringify(val) : +val)).join(','),
// 		)
// 		.join('\n');
// };

const toCsv = <T extends AutoUIBaseResource<T>>(
	data: T[],
	model: AutoUIModel<T>,
) => {
	console.log('*** data', data);
	console.log('*** model', model);
	const { schema, priorities } = model;
	const { properties } = schema;
	if (!properties || !priorities) {
		return '';
	}
	const allPriorities = [...priorities.primary, ...priorities.secondary, ...priorities.tertiary];
	const propertiesWithPriority = [
		...allPriorities.map((priority) => properties[priority]),
	].filter((property) => property != null)
	const arr = [
		propertiesWithPriority.map((property) => typeof property != 'boolean' && 'title' in property ? property.title : ''),
	];
	console.log('*** arr', arr);
	return arr
		.map((row) => row.map((val) => JSON.stringify(val)).join(','))
		.join('\n');
};

const download = <T extends AutoUIBaseResource<T>>(
	data: T[],
	model: AutoUIModel<T>,
	fileName: string,
) => {
	// const csvData = toCsv(pivot(data));
	const csvData = toCsv(data, model);
	return;
	const CSVFile = new Blob([csvData], { type: 'text/csv' });
	const tempLink = document.createElement('a');
	tempLink.download = `${fileName}.csv`;
	const url = window.URL.createObjectURL(CSVFile);
	tempLink.href = url;
	tempLink.style.display = 'none';
	document.body.appendChild(tempLink);
	tempLink.click();
	document.body.removeChild(tempLink);
};

interface DownloadCSVProps<T extends AutoUIBaseResource<T>> {
	model?: AutoUIModel<T>;
	downloadCSV?: {
		getData: ($filter: any) => Promise<T[]>;
		fileName: string;
	};
	$filter: any;
}

export const DownloadCSV = <T extends AutoUIBaseResource<T>>({
	model,
	downloadCSV,
	$filter,
}: DownloadCSVProps<T>) => {
	const { t } = useTranslation();

	if (!downloadCSV || !model) {
		return null;
	}

	const { getData, fileName } = downloadCSV;

	return (
		<Button
			onClick={async () => {
				const data = await getData($filter);
				download(data, model, fileName);
			}}
			tooltip={t('actions.download_csv')}
			icon={<FontAwesomeIcon icon={faDownload} />}
		/>
	);
};
