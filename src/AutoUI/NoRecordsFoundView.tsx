import React from 'react';
import { Heading, Link } from 'rendition';
import {
	ActionData,
	AutoUIBaseResource,
	AutoUIContext,
	AutoUIModel,
} from './schemaOps';
import { Create } from './Actions/Create';
import { NoDataInfo } from '.';
import { useTranslation } from '../hooks/useTranslation';
import { Material } from '@balena/ui-shared-components';
const { Container, Box, Alert } = Material;

export interface NoRecordsFoundViewProps<T> {
	model: AutoUIModel<T>;
	autouiContext: AutoUIContext<T>;
	onActionTriggered: (data: ActionData<T>) => void;
	noDataInfo?: NoDataInfo;
}

export const NoRecordsFoundView = <T extends AutoUIBaseResource<T>>({
	model,
	autouiContext,
	onActionTriggered,
	noDataInfo,
}: NoRecordsFoundViewProps<T>) => {
	const { t } = useTranslation();
	return (
		<Container
			maxWidth="sm"
			sx={{
				textAlign: 'center',
				display: 'flex',
				flexDirection: 'column',
				alignItems: 'center',
				my: 'auto',
			}}
		>
			<Heading.h2 bold my="3">
				{noDataInfo?.title ??
					t('no_data.no_resource_data_title', {
						resource: t(`resource.${model.resource}_other`).toLowerCase(),
					})}
			</Heading.h2>
			{noDataInfo?.subtitle && (
				<Heading.h3 my="3">{noDataInfo?.subtitle}</Heading.h3>
			)}
			{noDataInfo?.info && (
				<Alert sx={{ my: 3 }} severity="info">
					{noDataInfo.info}
				</Alert>
			)}
			<Heading.h3 my="3">
				{noDataInfo?.description ?? t('no_data.no_resource_data_description')}
			</Heading.h3>
			<Box display="flex" my={3}>
				<Create
					model={model}
					autouiContext={autouiContext}
					hasOngoingAction={false}
					onActionTriggered={onActionTriggered}
				/>
			</Box>
			{noDataInfo?.docsLink && (
				<Link href={noDataInfo.docsLink} blank my="2">
					{noDataInfo.docsLabel ?? noDataInfo.docsLink}
				</Link>
			)}
		</Container>
	);
};
