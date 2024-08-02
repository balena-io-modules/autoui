import React from 'react';
import {
	ActionData,
	AutoUIBaseResource,
	AutoUIContext,
	AutoUIModel,
} from './schemaOps';
import { Create } from './Actions/Create';
import { NoDataInfo } from '.';
import { useTranslation } from '../hooks/useTranslation';
import {
	Callout,
	Material,
	MUILinkWithTracking,
} from '@balena/ui-shared-components';
const { Container, Typography } = Material;

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
				gap: 3,
			}}
		>
			<Typography variant="titleLg" fontWeight="bold">
				{noDataInfo?.title ??
					t('no_data.no_resource_data_title', {
						resource: t(`resource.${model.resource}_other`).toLowerCase(),
					})}
			</Typography>
			{noDataInfo?.subtitle && (
				<Typography variant="title">{noDataInfo?.subtitle}</Typography>
			)}
			{noDataInfo?.info && (
				<Callout severity="info" variant="subtle" sx={{ my: 3 }}>
					{noDataInfo.info}
				</Callout>
			)}
			<Typography variant="title">
				{noDataInfo?.description ?? t('no_data.no_resource_data_description')}
			</Typography>
			<Create
				model={model}
				autouiContext={autouiContext}
				hasOngoingAction={false}
				onActionTriggered={onActionTriggered}
			/>
			{noDataInfo?.docsLink && (
				<MUILinkWithTracking href={noDataInfo.docsLink}>
					{noDataInfo.docsLabel ?? noDataInfo.docsLink}
				</MUILinkWithTracking>
			)}
		</Container>
	);
};
