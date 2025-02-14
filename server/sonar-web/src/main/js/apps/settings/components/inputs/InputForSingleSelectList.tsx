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
import SelectLegacy from '../../../../components/controls/SelectLegacy';
import { SettingCategoryDefinition } from '../../../../types/settings';
import { DefaultSpecializedInputProps } from '../../utils';

type Props = DefaultSpecializedInputProps & Pick<SettingCategoryDefinition, 'options'>;

export default class InputForSingleSelectList extends React.PureComponent<Props> {
  handleInputChange = ({ value }: { value: string }) => {
    this.props.onChange(value);
  };

  render() {
    const options = this.props.options.map(option => ({
      label: option,
      value: option
    }));

    return (
      <SelectLegacy
        className="settings-large-input"
        clearable={false}
        name={this.props.name}
        onChange={this.handleInputChange}
        options={options}
        value={this.props.value}
      />
    );
  }
}
