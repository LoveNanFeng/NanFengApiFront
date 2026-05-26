import {
  BarChart,
  EffectScatterChart,
  LineChart,
  LinesChart,
  MapChart,
  PieChart,
  RadarChart,
} from 'echarts/charts';
import {
  DatasetComponent,
  GeoComponent,
  GridComponent,
  LegendComponent,
  TitleComponent,
  ToolboxComponent,
  TooltipComponent,
  TransformComponent,
  VisualMapComponent,
} from 'echarts/components';
import * as echarts from 'echarts/core';
import {
  LabelLayout,
  LegacyGridContainLabel,
  UniversalTransition,
} from 'echarts/features';
import { CanvasRenderer } from 'echarts/renderers';

echarts.use([
  TitleComponent,
  PieChart,
  RadarChart,
  TooltipComponent,
  GridComponent,
  DatasetComponent,
  TransformComponent,
  BarChart,
  LineChart,
  LinesChart,
  MapChart,
  EffectScatterChart,
  LabelLayout,
  LegacyGridContainLabel,
  UniversalTransition,
  CanvasRenderer,
  LegendComponent,
  ToolboxComponent,
  GeoComponent,
  VisualMapComponent,
]);
export type { ECOption } from './types';

export default echarts;
