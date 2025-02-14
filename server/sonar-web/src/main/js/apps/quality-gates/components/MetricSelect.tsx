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
import { sortBy } from 'lodash';
import * as React from 'react';
import withMetricsContext from '../../../app/components/metrics/withMetricsContext';
import SelectLegacy from '../../../components/controls/SelectLegacy';
import { getLocalizedMetricDomain, translate } from '../../../helpers/l10n';
import { Dict, Metric } from '../../../types/types';
import { getLocalizedMetricNameNoDiffMetric } from '../utils';

interface Props {
  metric?: Metric;
  metricsArray: Metric[];
  metrics: Dict<Metric>;
  onMetricChange: (metric: Metric) => void;
}

interface Option {
  disabled?: boolean;
  label: string;
  value: string;
}

export class MetricSelectComponent extends React.PureComponent<Props> {
  handleChange = (option: Option | null) => {
    if (option) {
      const { metricsArray: metrics } = this.props;
      const selectedMetric = metrics.find(metric => metric.key === option.value);
      if (selectedMetric) {
        this.props.onMetricChange(selectedMetric);
      }
    }
  };

  render() {
    const { metric, metricsArray, metrics } = this.props;

    const options: Array<Option & { domain?: string }> = sortBy(
      metricsArray.map(m => ({
        value: m.key,
        label: getLocalizedMetricNameNoDiffMetric(m, metrics),
        domain: m.domain
      })),
      'domain'
    );

    // Use "disabled" property to emulate optgroups.
    const optionsWithDomains: Option[] = [];
    options.forEach((option, index, options) => {
      const previous = index > 0 ? options[index - 1] : null;
      if (option.domain && (!previous || previous.domain !== option.domain)) {
        optionsWithDomains.push({
          value: '<domain>',
          label: getLocalizedMetricDomain(option.domain),
          disabled: true
        });
      }
      optionsWithDomains.push(option);
    });

    return (
      <SelectLegacy
        className="text-middle quality-gate-metric-select"
        id="condition-metric"
        onChange={this.handleChange}
        options={optionsWithDomains}
        placeholder={translate('search.search_for_metrics')}
        value={metric && metric.key}
      />
    );
  }
}

export default withMetricsContext(MetricSelectComponent);
