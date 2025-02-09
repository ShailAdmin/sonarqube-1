/*
 * SonarQube
 * Copyright (C) 2009-2022 SonarSource SA
 * mailto:info AT sonarsource DOT com
 *
 * This program is free software; you can redistribute it and/or
 * modify it under the terms of the GNU Lesser General Public
 * License as published by the Free Software Foundation; either
 * version 3 of the License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
 * Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with this program; if not, write to the Free Software Foundation,
 * Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301, USA.
 */
import * as React from 'react';
import BubbleChart from '../../../components/charts/BubbleChart';
import ColorRatingsLegend from '../../../components/charts/ColorRatingsLegend';
import HelpTooltip from '../../../components/controls/HelpTooltip';
import QualifierIcon from '../../../components/icons/QualifierIcon';
import { RATING_COLORS } from '../../../helpers/constants';
import { translate, translateWithParameters } from '../../../helpers/l10n';
import { formatMeasure } from '../../../helpers/measures';
import { isDefined } from '../../../helpers/types';
import { getProjectUrl } from '../../../helpers/urls';
import { ComponentQualifier } from '../../../types/component';
import { Project } from '../types';

const X_METRIC = 'sqale_index';
const X_METRIC_TYPE = 'SHORT_WORK_DUR';
const Y_METRIC = 'coverage';
const Y_METRIC_TYPE = 'PERCENT';
const SIZE_METRIC = 'ncloc';
const SIZE_METRIC_TYPE = 'SHORT_INT';
const COLOR_METRIC_1 = 'reliability_rating';
const COLOR_METRIC_2 = 'security_rating';
const COLOR_METRIC_TYPE = 'RATING';

interface Props {
  helpText: string;
  projects: Project[];
}

interface State {
  ratingFilters: { [rating: number]: boolean };
}

export default class Risk extends React.PureComponent<Props, State> {
  state: State = {
    ratingFilters: {}
  };

  getMetricTooltip(metric: { key: string; type: string }, value?: number) {
    const name = translate('metric', metric.key, 'name');
    const formattedValue = value != null ? formatMeasure(value, metric.type) : '–';
    return (
      <div>
        {name}
        {': '}
        {formattedValue}
      </div>
    );
  }

  getTooltip(
    project: Project,
    x?: number,
    y?: number,
    size?: number,
    color1?: number,
    color2?: number
  ) {
    return (
      <div className="text-left">
        <div className="little-spacer-bottom display-flex-center display-flex-space-between">
          <strong>{project.name}</strong>

          {project.qualifier === ComponentQualifier.Application && (
            <div className="big-spacer-left nowrap">
              <QualifierIcon
                className="little-spacer-right"
                fill="currentColor"
                qualifier={ComponentQualifier.Application}
              />
              {translate('qualifier.APP')}
            </div>
          )}
        </div>
        {this.getMetricTooltip({ key: COLOR_METRIC_1, type: COLOR_METRIC_TYPE }, color1)}
        {this.getMetricTooltip({ key: COLOR_METRIC_2, type: COLOR_METRIC_TYPE }, color2)}
        {this.getMetricTooltip({ key: Y_METRIC, type: Y_METRIC_TYPE }, y)}
        {this.getMetricTooltip({ key: X_METRIC, type: X_METRIC_TYPE }, x)}
        {this.getMetricTooltip({ key: SIZE_METRIC, type: SIZE_METRIC_TYPE }, size)}
      </div>
    );
  }

  handleRatingFilterClick = (selection: number) => {
    this.setState(({ ratingFilters }) => {
      return { ratingFilters: { ...ratingFilters, [selection]: !ratingFilters[selection] } };
    });
  };

  render() {
    const { ratingFilters } = this.state;

    const items = this.props.projects
      .map(project => {
        const x =
          project.measures[X_METRIC] != null ? Number(project.measures[X_METRIC]) : undefined;
        const y =
          project.measures[Y_METRIC] != null ? Number(project.measures[Y_METRIC]) : undefined;
        const size =
          project.measures[SIZE_METRIC] != null ? Number(project.measures[SIZE_METRIC]) : undefined;
        const color1 =
          project.measures[COLOR_METRIC_1] != null
            ? Number(project.measures[COLOR_METRIC_1])
            : undefined;
        const color2 =
          project.measures[COLOR_METRIC_2] != null
            ? Number(project.measures[COLOR_METRIC_2])
            : undefined;

        const colorRating =
          color1 !== undefined && color2 !== undefined ? Math.max(color1, color2) : undefined;

        // Filter out items that match ratingFilters
        if (colorRating !== undefined && ratingFilters[colorRating]) {
          return undefined;
        }

        return {
          x: x || 0,
          y: y || 0,
          size: size || 0,
          color: colorRating !== undefined ? RATING_COLORS[colorRating - 1] : undefined,
          key: project.key,
          tooltip: this.getTooltip(project, x, y, size, color1, color2),
          link: getProjectUrl(project.key)
        };
      })
      .filter(isDefined);

    const formatXTick = (tick: number) => formatMeasure(tick, X_METRIC_TYPE);
    const formatYTick = (tick: number) => formatMeasure(tick, Y_METRIC_TYPE);

    return (
      <div>
        <BubbleChart
          formatXTick={formatXTick}
          formatYTick={formatYTick}
          height={600}
          items={items}
          padding={[80, 20, 60, 100]}
          yDomain={[100, 0]}
        />

        <div className="measure-details-bubble-chart-axis x">
          {translate('metric', X_METRIC, 'name')}
        </div>
        <div className="measure-details-bubble-chart-axis y">
          {translate('metric', Y_METRIC, 'name')}
        </div>
        <div className="measure-details-bubble-chart-axis size">
          <span className="measure-details-bubble-chart-title">
            <span className="text-middle">{translate('projects.visualization.risk')}</span>
            <HelpTooltip className="spacer-left" overlay={this.props.helpText} />
          </span>
          <div>
            <span className="spacer-right">
              {translateWithParameters(
                'component_measures.legend.color_x',
                translate('projects.worse_of_reliablity_and_security')
              )}
            </span>
            {translateWithParameters(
              'component_measures.legend.size_x',
              translate('metric', SIZE_METRIC, 'name')
            )}
            <ColorRatingsLegend
              className="big-spacer-top"
              filters={ratingFilters}
              onRatingClick={this.handleRatingFilterClick}
            />
          </div>
        </div>
      </div>
    );
  }
}
