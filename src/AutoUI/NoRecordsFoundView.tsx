import React from 'react';
import { Flex, Heading, Link, useTheme } from 'rendition';
import {
	ActionData,
	AutoUIBaseResource,
	AutoUIContext,
	AutoUIModel,
} from './schemaOps';
import { Create } from './Actions/Create';

import { NoDataInfo } from '.';
import { useTranslation } from '../hooks/useTranslation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faInfo } from '@fortawesome/free-solid-svg-icons';
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
	const theme = useTheme();
	return (
		<Flex
			flexDirection="column"
			alignItems="center"
			maxWidth="600px"
			margin="auto"
			style={{ textAlign: 'center' }}
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
				<Flex
					bg="info.light"
					my="3"
					maxWidth="80%"
					style={{ borderRadius: '8px' }}
				>
					<Flex
						maxWidth={70}
						minWidth={70}
						justifyContent="center"
						alignItems="center"
					>
						<FontAwesomeIcon
							icon={faInfo}
							fontSize={26}
							style={{
								border: `2.5px solid ${theme.colors.info.semilight}`,
								padding: '5px 12px',
								borderRadius: '50%',
								fontSize: '22px',
								color: `${theme.colors.info.semilight}`,
							}}
						/>
					</Flex>
					<Flex py={3} pr={4} justifyContent="flex-start">
						<i style={{ textAlign: 'left' }}>{noDataInfo.info}</i>
					</Flex>
				</Flex>
			)}
			<Heading.h3 my="3">
				{noDataInfo?.description ?? t('no_data.no_resource_data_description')}
			</Heading.h3>
			<Flex my="3">
				<Create
					model={model}
					autouiContext={autouiContext}
					hasOngoingAction={false}
					onActionTriggered={onActionTriggered}
				/>
			</Flex>
			{noDataInfo?.docsLink && (
				<Link href={noDataInfo.docsLink} blank my="2">
					{noDataInfo.docsLabel ?? noDataInfo.docsLink}
				</Link>
			)}
		</Flex>
	);
};
