import React from 'react';
import { faCube } from '@fortawesome/free-solid-svg-icons/faCube';
import { Update } from '../../Actions/Update';
import type { ActionData } from '../../schemaOps';
import type { LensTemplate } from '..';
import type { EntityLensRendererProps } from '.';
import { TagLabelList } from 'rendition';
import { Material } from '@balena/ui-shared-components';
const { Box, Stack, Card, Divider, Typography } = Material;

const EntityRenderer = ({
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
		(triggeredActionData: ActionData<any>) => {
			setActionData(triggeredActionData);
			if (triggeredActionData.action.actionFn) {
				triggeredActionData.action.actionFn({
					affectedEntries: triggeredActionData.affectedEntries ?? [],
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
					<Box
						display="flex"
						flexDirection="row"
						justifyContent="space-between"
					>
						<Box display="flex" flexDirection="column">
							<Typography variant="titleLg">
								{properties.length > 0 &&
									properties[0].render(data[properties[0].field], data)}
							</Typography>
						</Box>
						<Stack alignItems="flex-end">
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
						</Stack>
					</Box>
					<Divider />
					<Box
						display="flex"
						flexDirection="row"
						flexWrap="wrap"
						justifyContent="space-between"
						alignItems="center"
					>
						{properties.map(
							(property) =>
								property.priority !== 'primary' && (
									<Box
										display="flex"
										flexDirection="column"
										my={10}
										key={property.key}
										flex={['100%', '0 0 30%']}
									>
										<Typography variant="overline">{property.label}</Typography>
										{property.render(data[property.field], data)}
									</Box>
								),
						)}
						{!!data[`${model.resource}_tag`]?.length && (
							<Box
								display="flex"
								flexDirection="column"
								my={10}
								key={'device_tag'}
								flex={['100%', '0 0 30%']}
							>
								<Typography variant="overline">Tags</Typography>
								<TagLabelList tags={data[`${model.resource}_tag`]} />
							</Box>
						)}
					</Box>
					{actionData?.action?.renderer?.({
						schema: actionData.schema,
						affectedEntries: actionData.affectedEntries,
						onDone: onActionDone,
					})}
				</>
			)}
		</Card>
	);
};

export const entity: LensTemplate = {
	slug: 'entity',
	name: 'Default entity lens',
	data: {
		label: 'Entity',
		format: 'summary',
		renderer: EntityRenderer,
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
