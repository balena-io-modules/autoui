import type { TableSortOptions, Pagination, CheckedState } from 'rendition';
import type { AutoUIEntityPropertyDefinition } from '../../';
import type { AutoUIContext, AutoUIModel } from '../../schemaOps';
import type { Material } from '@balena/ui-shared-components';

export { table } from './table';
export { entity } from './entity';

export interface LensRendererBaseProps<T = unknown>
	extends Pick<Material.BoxProps, 'flex'> {
	properties: Array<AutoUIEntityPropertyDefinition<T>>;
	autouiContext: AutoUIContext<T>;
	model: AutoUIModel<T>;
	hasUpdateActions: boolean;
	onEntityClick?: (
		entity: T,
		event: React.MouseEvent<HTMLAnchorElement>,
	) => void;
}

export interface CollectionLensRendererProps<T>
	extends LensRendererBaseProps<T> {
	filtered: T[];
	selected: T[] | undefined;
	changeSelected: (
		selected: T[] | undefined,
		allChecked?: CheckedState,
	) => void;
	data: T[];
	onPageChange?: (page: number, itemsPerPage: number) => void;
	onSort?: (sort: TableSortOptions<T>) => void;
	pagination?: Pagination;
	rowKey?: keyof T;
}

export interface EntityLensRendererProps<T> extends LensRendererBaseProps<T> {
	data: T;
}
