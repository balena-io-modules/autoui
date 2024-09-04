import { AutoUIEntityPropertyDefinition } from '../../';
import { AutoUIContext, AutoUIModel } from '../../schemaOps';
import { Material } from '@balena/ui-shared-components';
import {
	CheckedState,
	Pagination,
	TableSortOptions,
} from '../../../components/Table/utils';
export { table } from './table';
export { entity } from './entity';

export interface LensRendererBaseProps<T>
	extends Pick<Material.BoxProps, 'flex'> {
	properties: Array<AutoUIEntityPropertyDefinition<T>>;
	autouiContext: AutoUIContext<T>;
	model: AutoUIModel<T>;
	hasUpdateActions: boolean;
	onEntityClick?: (
		entity: T,
		event: React.MouseEvent<HTMLTableCellElement, MouseEvent>,
	) => void;
}

export interface CollectionLensRendererProps<T>
	extends LensRendererBaseProps<T> {
	filtered: T[];
	selected: T[] | undefined;
	checkedState?: CheckedState;
	sort: TableSortOptions | null;
	changeSelected: (
		selected: T[] | undefined,
		allChecked?: CheckedState,
	) => void;
	data: T[];
	onPageChange?: (page: number, itemsPerPage: number) => void;
	onSort?: (sort: TableSortOptions) => void;
	pagination: Partial<Pagination>;
	rowKey?: keyof T;
}

export interface EntityLensRendererProps<T> extends LensRendererBaseProps<T> {
	data: T;
}
