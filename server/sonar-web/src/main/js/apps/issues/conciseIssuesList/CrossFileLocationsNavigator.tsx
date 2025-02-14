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
import { translateWithParameters } from '../../../helpers/l10n';
import { collapsePath } from '../../../helpers/path';
import { FlowLocation, Issue } from '../../../types/types';
import ConciseIssueLocationsNavigatorLocation from './ConciseIssueLocationsNavigatorLocation';

interface Props {
  issue: Pick<Issue, 'key' | 'type'>;
  locations: FlowLocation[];
  onLocationSelect: (index: number) => void;
  scroll: (element: Element) => void;
  selectedLocationIndex: number | undefined;
}

interface State {
  collapsed: boolean;
}

interface LocationGroup {
  component: string | undefined;
  componentName: string | undefined;
  firstLocationIndex: number;
  locations: FlowLocation[];
}

const MAX_PATH_LENGTH = 15;

export default class CrossFileLocationsNavigator extends React.PureComponent<Props, State> {
  state: State = { collapsed: true };

  componentWillReceiveProps(nextProps: Props) {
    if (nextProps.issue.key !== this.props.issue.key) {
      this.setState({ collapsed: true });
    }

    // expand locations list as soon as a location in the middle of the list is selected
    const { locations: nextLocations } = nextProps;
    if (
      nextProps.selectedLocationIndex &&
      nextProps.selectedLocationIndex > 0 &&
      nextLocations !== undefined &&
      nextProps.selectedLocationIndex < nextLocations.length - 1
    ) {
      this.setState({ collapsed: false });
    }
  }

  handleMoreLocationsClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    event.currentTarget.blur();
    this.setState({ collapsed: false });
  };

  groupByFile = (locations: FlowLocation[]) => {
    const groups: LocationGroup[] = [];

    let currentLocations: FlowLocation[] = [];
    let currentComponent: string | undefined;
    let currentComponentName: string | undefined;
    let currentFirstLocationIndex = 0;

    for (let index = 0; index < locations.length; index++) {
      const location = locations[index];
      if (location.component === currentComponent) {
        currentLocations.push(location);
      } else {
        if (currentLocations.length > 0) {
          groups.push({
            component: currentComponent,
            componentName: currentComponentName,
            firstLocationIndex: currentFirstLocationIndex,
            locations: currentLocations
          });
        }
        currentLocations = [location];
        currentComponent = location.component;
        currentComponentName = location.componentName;
        currentFirstLocationIndex = index;
      }
    }

    if (currentLocations.length > 0) {
      groups.push({
        component: currentComponent,
        componentName: currentComponentName,
        firstLocationIndex: currentFirstLocationIndex,
        locations: currentLocations
      });
    }

    return groups;
  };

  renderLocation = (index: number, message: string | undefined) => {
    return (
      <ConciseIssueLocationsNavigatorLocation
        index={index}
        key={index}
        message={message}
        onClick={this.props.onLocationSelect}
        scroll={this.props.scroll}
        selected={index === this.props.selectedLocationIndex}
      />
    );
  };

  renderGroup = (
    group: LocationGroup,
    groupIndex: number,
    { onlyFirst = false, onlyLast = false } = {}
  ) => {
    const { firstLocationIndex } = group;
    const lastLocationIndex = group.locations.length - 1;
    return (
      <div className="concise-issue-locations-navigator-file" key={groupIndex}>
        <div className="concise-issue-location-file">
          <i className="concise-issue-location-file-circle little-spacer-right" />
          {collapsePath(group.componentName || '', MAX_PATH_LENGTH)}
        </div>
        {group.locations.length > 0 && (
          <div className="concise-issue-location-file-locations">
            {onlyFirst && this.renderLocation(firstLocationIndex, group.locations[0].msg)}

            {onlyLast &&
              this.renderLocation(
                firstLocationIndex + lastLocationIndex,
                group.locations[lastLocationIndex].msg
              )}

            {!onlyFirst &&
              !onlyLast &&
              group.locations.map((location, index) =>
                this.renderLocation(firstLocationIndex + index, location.msg)
              )}
          </div>
        )}
      </div>
    );
  };

  render() {
    const { locations } = this.props;
    const groups = this.groupByFile(locations);

    if (locations.length > 2 && groups.length > 1 && this.state.collapsed) {
      const firstGroup = groups[0];
      const lastGroup = groups[groups.length - 1];
      return (
        <div className="concise-issue-locations-navigator spacer-top">
          {this.renderGroup(firstGroup, 0, { onlyFirst: true })}
          <div className="concise-issue-locations-navigator-file">
            <div className="concise-issue-location-file">
              <i className="concise-issue-location-file-circle-multiple little-spacer-right" />
              <a
                className="concise-issue-location-file-more"
                href="#"
                onClick={this.handleMoreLocationsClick}>
                {translateWithParameters('issues.x_more_locations', locations.length - 2)}
              </a>
            </div>
          </div>
          {this.renderGroup(lastGroup, groups.length - 1, { onlyLast: true })}
        </div>
      );
    } else {
      return (
        <div className="concise-issue-locations-navigator spacer-top">
          {groups.map((group, groupIndex) => this.renderGroup(group, groupIndex))}
        </div>
      );
    }
  }
}
