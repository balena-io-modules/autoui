import ArrayWidget from './ArrayWidget';
import ObjectWidget from './ObjectWidget';
import TxtWidget from './TxtWidget';
import { ElapsedTimeWidget } from './ElapsedTimeWidget';
import { DurationWidget } from './DurationWidget';
import { HashWidget } from './HashWidget';
import { TemperatureWidget } from './TemperatureWidget';
import { PercentageWidget } from './PercentageWidget';
import { DisabledTextWidget } from './DisabledTextWidget';
import { BooleanAsIconWidget } from './BooleanAsIconWidget';
import { PlaceholderTextWidget } from './PlaceholderTextWidget';
import { WrapWidget } from './WrapWidget';
import { Format, Widget } from '../utils';
export { WidgetWrapperUiOptions } from './ui-options';
export { default as WidgetMeta } from './WidgetMeta';

type Widgets = {
	[key: string]: Widget;
};

export const defaultFormats: Format[] = [
	{
		name: 'elapsed-date-time',
		format: '.*',
		widget: ElapsedTimeWidget,
	},
	{
		name: 'duration',
		format: '.*',
		widget: DurationWidget,
	},
	{
		name: 'hash',
		format: '.*',
		widget: HashWidget,
	},
	{
		name: 'temperature',
		format: '.*',
		widget: TemperatureWidget,
	},
	{
		name: 'percentage',
		format: '.*',
		widget: PercentageWidget,
	},
	{
		name: 'disabled-text',
		format: '.*',
		widget: DisabledTextWidget,
	},
	{
		name: 'wrap',
		format: '.*',
		widget: WrapWidget,
	},
	{
		name: 'boolean-as-icon',
		format: '.*',
		widget: BooleanAsIconWidget,
	},
	{
		name: 'placeholder-text',
		format: '.*',
		widget: PlaceholderTextWidget,
	},
];

export const typeWidgets: Widgets = {
	object: ObjectWidget,
	string: TxtWidget,
	null: TxtWidget,
	integer: TxtWidget,
	number: TxtWidget,
	boolean: TxtWidget,
	array: ArrayWidget,
	default: TxtWidget,
};
