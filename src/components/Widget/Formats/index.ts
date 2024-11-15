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
import type { Format, Widget } from '../utils';
import { CodeWidget } from './CodeWidget';

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
		name: 'code',
		format: '.*',
		widget: CodeWidget,
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

/* eslint-disable id-denylist	*/
export const typeWidgets: Widgets = {
	string: TxtWidget,
	null: TxtWidget,
	integer: TxtWidget,
	number: TxtWidget,
	boolean: TxtWidget,
	default: TxtWidget,
};
