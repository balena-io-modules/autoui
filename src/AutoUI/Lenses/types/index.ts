import type {
	BoxProps,
	TableSortOptions,
	Pagination,
	CheckedState,
} from 'rendition';
import { AutoUIEntityPropertyDefinition } from '../../';
import { AutoUIContext, AutoUIModel } from '../../schemaOps';
export { table } from './table';
export { entity } from './entity';

export interface LensRendererBaseProps<T> extends Pick<BoxProps, 'flex'> {
	properties: Array<AutoUIEntityPropertyDefinition<T>>;
	autouiContext: AutoUIContext<T>;
	model: AutoUIModel<T>;
	hasUpdateActions: boolean;
	onEntityClick?: (
		entity: T,
		event: React.MouseEvent<HTMLAnchorElement, MouseEvent>,
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
}

export interface EntityLensRendererProps<T> extends LensRendererBaseProps<T> {
	data: T;
}
