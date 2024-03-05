import React from 'react';
import styled from 'styled-components';
import { faCube } from '@fortawesome/free-solid-svg-icons/faCube';
import { Update } from '../../Actions/Update';
import type { ActionData } from '../../schemaOps';
import type { LensTemplate } from '..';
import type { EntityLensRendererProps } from '.';
import { Card, Divider, Flex, Heading, TagLabelList, Txt } from 'rendition';

const Label = styled(Txt)`
	color: #252629;
	font-size: 11px;
	text-transform: uppercase;
	margin-bottom: 6px;
`;

export const entity: LensTemplate = {
	slug: 'entity',
	name: 'Default entity lens',
	data: {
		label: 'Entity',
		format: 'summary',
		renderer: ({
			data,
			properties,
			hasUpdateActions,
			model,
			autouiContext,
		}: EntityLensRendererProps<any>) => {
			const [actionData, setActionData] = React.useState<
				ActionData<any> | undefined
			>();
			const onActionTriggered = React.useCallback(
				(actionData: ActionData<any>) => {
					setActionData(actionData);
					if (actionData.action.actionFn) {
						actionData.action.actionFn({
							affectedEntries: actionData.affectedEntries || [],
							checkedState: undefined,
						});
					}
				},
				[],
			);

			const onActionDone = React.useCallback(() => {
				setActionData(undefined);
			}, []);

			return (
				<Card>
					{data && (
						<>
							<Flex flexDirection="row" justifyContent="space-between">
								<Flex flexDirection="column">
									<Heading.h2>
										{properties.length > 0 &&
											properties[0].render(data[properties[0].field], data)}
									</Heading.h2>
								</Flex>
								<Flex flexDirection="column" alignItems="flex-end">
									{hasUpdateActions && (
										<Update
											model={model}
											selected={[data]}
											checkedState={undefined}
											autouiContext={autouiContext}
											hasOngoingAction={false}
											onActionTriggered={onActionTriggered}
										/>
									)}
								</Flex>
							</Flex>
							<Divider />
							<Flex
								flexDirection="row"
								flexWrap="wrap"
								justifyContent="space-between"
								alignItems="center"
							>
								{properties.map(
									(property) =>
										property.priority !== 'primary' && (
											<Flex
												flexDirection="column"
												my={10}
												key={property.key}
												flex={['100%', '0 0 30%']}
											>
												<Label>{property.label}</Label>
												<Txt>{property.render(data[property.field], data)}</Txt>
											</Flex>
										),
								)}
								{!!data[`${model.resource}_tag`]?.length && (
									<Flex
										flexDirection="column"
										my={10}
										key={'device_tag'}
										flex={['100%', '0 0 30%']}
									>
										<Label>Tags</Label>
										<Txt>
											<TagLabelList tags={data[`${model.resource}_tag`]} />
										</Txt>
									</Flex>
								)}
							</Flex>
							{actionData?.action?.renderer &&
								actionData.action.renderer({
									schema: actionData.schema,
									affectedEntries: actionData.affectedEntries,
									onDone: onActionDone,
								})}
						</>
					)}
				</Card>
			);
		},
		icon: faCube,
		type: '*',
		filter: {
			type: 'object',
			properties: {
				id: {
					type: 'number',
				},
			},
		},
	},
};
