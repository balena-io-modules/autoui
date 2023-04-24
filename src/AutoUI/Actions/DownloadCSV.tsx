import React from 'react';
import { AutoUIBaseResource } from '../schemaOps';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Button } from 'rendition';
import { faDownload } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from '../../hooks/useTranslation';

// Source: https://stackoverflow.com/questions/41028114/how-to-convert-array-of-nested-objects-to-csv
const pivot = (arr: object[]) => {
	const mp = new Map();

	const setValue = (a: string[], path: string[], val: any) => {
		if (Object(val) !== val) {
			// primitive value
			const pathStr = path.join('.');
			const i = (mp.has(pathStr) ? mp : mp.set(pathStr, mp.size)).get(pathStr);
			a[i] = val;
		} else {
			for (const key of Object.keys(val)) {
				setValue(a, key === '0' ? path : path.concat(key), val[key]);
			}
		}
		return a;
	};

	const result = arr.map((obj) => setValue([], [], obj));
	return [[...mp.keys()], ...result];
};

// Source: https://stackoverflow.com/questions/41028114/how-to-convert-array-of-nested-objects-to-csv
const toCsv = (arr: any[][]) => {
	return arr
		.map((row) =>
			row.map((val) => (isNaN(val) ? JSON.stringify(val) : +val)).join(','),
		)
		.join('\n');
};

const download = (data: object[], fileName: string) => {
	const csvData = toCsv(pivot(data));
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
	downloadCSV?: {
		getData: ($filter: any) => Promise<object[]>;
		fileName: string;
	};
	$filter: any;
}

export const DownloadCSV = <T extends AutoUIBaseResource<T>>({
	downloadCSV,
	$filter,
}: DownloadCSVProps<T>) => {
	const { t } = useTranslation();

	if (!downloadCSV) {
		return null;
	}

	const { getData, fileName } = downloadCSV;

	return (
		<Button
			onClick={async () => {
				const data = await getData($filter);
				download(data, fileName);
			}}
			tooltip={t('actions.download_csv')}
			icon={<FontAwesomeIcon icon={faDownload} />}
		/>
	);
};
