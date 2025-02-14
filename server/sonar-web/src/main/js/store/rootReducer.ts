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
import { combineReducers } from 'redux';
import settingsApp, * as fromSettingsApp from '../apps/settings/store/rootReducer';
import { BranchLike } from '../types/branch-like';
import { AppState, CurrentUserSettingNames } from '../types/types';
import appState from './appState';
import branches, * as fromBranches from './branches';
import globalMessages, * as fromGlobalMessages from './globalMessages';
import users, * as fromUsers from './users';

export type Store = {
  appState: AppState;
  branches: fromBranches.State;
  globalMessages: fromGlobalMessages.State;
  users: fromUsers.State;

  // apps
  settingsApp: any;
};

export default combineReducers<Store>({
  appState,
  branches,
  globalMessages,
  users,

  // apps
  settingsApp
});

export function getAppState(state: Store) {
  return state.appState;
}

export function getGlobalMessages(state: Store) {
  return fromGlobalMessages.getGlobalMessages(state.globalMessages);
}

export function getCurrentUserSetting(state: Store, key: CurrentUserSettingNames) {
  return fromUsers.getCurrentUserSetting(state.users, key);
}

export function getCurrentUser(state: Store) {
  return fromUsers.getCurrentUser(state.users);
}

export function getGlobalSettingValue(state: Store, key: string) {
  return fromSettingsApp.getValue(state.settingsApp, key);
}

export function getSettingsAppAllDefinitions(state: Store) {
  return fromSettingsApp.getAllDefinitions(state.settingsApp);
}

export function getSettingsAppDefinition(state: Store, key: string) {
  return fromSettingsApp.getDefinition(state.settingsApp, key);
}

export function getSettingsAppAllCategories(state: Store) {
  return fromSettingsApp.getAllCategories(state.settingsApp);
}

export function getSettingsAppDefaultCategory(state: Store) {
  return fromSettingsApp.getDefaultCategory(state.settingsApp);
}

export function getSettingsAppSettingsForCategory(
  state: Store,
  category: string,
  component?: string
) {
  return fromSettingsApp.getSettingsForCategory(state.settingsApp, category, component);
}

export function getSettingsAppChangedValue(state: Store, key: string) {
  return fromSettingsApp.getChangedValue(state.settingsApp, key);
}

export function isSettingsAppLoading(state: Store, key: string) {
  return fromSettingsApp.isLoading(state.settingsApp, key);
}

export function getSettingsAppValidationMessage(state: Store, key: string) {
  return fromSettingsApp.getValidationMessage(state.settingsApp, key);
}

export function getBranchStatusByBranchLike(
  state: Store,
  component: string,
  branchLike: BranchLike
) {
  return fromBranches.getBranchStatusByBranchLike(state.branches, component, branchLike);
}
