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
import throwGlobalError from '../app/utils/throwGlobalError';
import { getJSON } from '../helpers/request';
import { BranchParameters } from '../types/branch-like';
import { Component } from '../types/types';

type NavComponent = Omit<Component, 'alm' | 'qualifier' | 'leakPeriodDate' | 'path' | 'tags'>;

export function getComponentNavigation(
  data: { component: string } & BranchParameters
): Promise<NavComponent> {
  return getJSON('/api/navigation/component', data).catch(throwGlobalError);
}

export function getMarketplaceNavigation(): Promise<{ serverId: string; ncloc: number }> {
  return getJSON('/api/navigation/marketplace').catch(throwGlobalError);
}

export function getSettingsNavigation(): Promise<any> {
  return getJSON('/api/navigation/settings').catch(throwGlobalError);
}
