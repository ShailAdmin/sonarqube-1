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
package org.sonar.server.rule;

import com.google.common.collect.Ordering;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;
import javax.annotation.CheckForNull;
import javax.annotation.Nullable;
import org.sonar.api.rule.RuleKey;
import org.sonar.api.rule.RuleStatus;
import org.sonar.api.rules.Rule;
import org.sonar.api.rules.RuleFinder;
import org.sonar.api.rules.RulePriority;
import org.sonar.api.rules.RuleQuery;
import org.sonar.core.util.stream.MoreCollectors;
import org.sonar.db.DbClient;
import org.sonar.db.DbSession;
import org.sonar.db.rule.RuleDefinitionDto;
import org.sonar.db.rule.RuleDto;
import org.sonar.db.rule.RuleParamDto;
import org.sonar.markdown.Markdown;

import static java.util.Collections.emptyList;
import static java.util.Collections.unmodifiableMap;
import static org.sonar.core.util.stream.MoreCollectors.uniqueIndex;

/**
 * A {@link RuleFinder} implementation that retrieves all rule definitions and their parameter when instantiated, cache
 * them in memory and provide implementation of {@link RuleFinder}'s method which only read from this data in memory.
 */
public class CachingRuleFinder implements ServerRuleFinder {

  private static final Ordering<Map.Entry<RuleDefinitionDto, Rule>> FIND_BY_QUERY_ORDER = Ordering.natural().reverse().onResultOf(entry -> entry.getKey().getUpdatedAt());

  private final Map<RuleKey, RuleDefinitionDto> ruleDtosByKey;
  private final Map<String, RuleDefinitionDto> ruleDtosByUuid;
  private final Map<RuleDefinitionDto, Rule> rulesByRuleDefinition;
  private final Map<RuleKey, Rule> rulesByKey;

  public CachingRuleFinder(DbClient dbClient) {
    try (DbSession dbSession = dbClient.openSession(false)) {
      List<RuleDefinitionDto> dtos = dbClient.ruleDao().selectAllDefinitions(dbSession);
      this.ruleDtosByKey = dtos.stream().collect(Collectors.toMap(RuleDefinitionDto::getKey, d -> d));
      this.ruleDtosByUuid = dtos.stream().collect(Collectors.toMap(RuleDefinitionDto::getUuid, d -> d));
      this.rulesByRuleDefinition = buildRulesByRuleDefinitionDto(dbClient, dbSession, dtos);
      this.rulesByKey = this.rulesByRuleDefinition.entrySet().stream()
        .collect(uniqueIndex(entry -> entry.getKey().getKey(), Map.Entry::getValue));
    }
  }

  private static Map<RuleDefinitionDto, Rule> buildRulesByRuleDefinitionDto(DbClient dbClient, DbSession dbSession, List<RuleDefinitionDto> dtos) {
    Map<String, List<RuleParamDto>> ruleParamsByRuleUuid = retrieveRuleParameters(dbClient, dbSession);
    Map<RuleDefinitionDto, Rule> rulesByDefinition = new HashMap<>(dtos.size());
    for (RuleDefinitionDto definition : dtos) {
      rulesByDefinition.put(definition, toRule(definition, ruleParamsByRuleUuid.getOrDefault(definition.getUuid(), emptyList())));
    }
    return unmodifiableMap(rulesByDefinition);
  }

  private static Map<String, List<RuleParamDto>> retrieveRuleParameters(DbClient dbClient, DbSession dbSession) {
    return dbClient.ruleDao().selectAllRuleParams(dbSession).stream()
      .collect(Collectors.groupingBy(RuleParamDto::getRuleUuid));
  }

  @Override
  @CheckForNull
  public Rule findByKey(@Nullable String repositoryKey, @Nullable String key) {
    if (repositoryKey == null || key == null) {
      return null;
    }
    return findByKey(RuleKey.of(repositoryKey, key));
  }

  @Override
  @CheckForNull
  public Rule findByKey(@Nullable RuleKey key) {
    return rulesByKey.get(key);
  }

  @Override
  @CheckForNull
  public Rule find(@Nullable RuleQuery query) {
    if (query == null) {
      return null;
    }

    return rulesByRuleDefinition.entrySet().stream()
      .filter(entry -> matchQuery(entry.getKey(), query))
      .sorted(FIND_BY_QUERY_ORDER)
      .map(Map.Entry::getValue)
      .findFirst()
      .orElse(null);
  }

  @Override
  public Collection<Rule> findAll(@Nullable RuleQuery query) {
    if (query == null) {
      return Collections.emptyList();
    }
    return rulesByRuleDefinition.entrySet().stream()
      .filter(entry -> matchQuery(entry.getKey(), query))
      .sorted(FIND_BY_QUERY_ORDER)
      .map(Map.Entry::getValue)
      .collect(MoreCollectors.toList());
  }

  private static boolean matchQuery(RuleDefinitionDto ruleDefinition, RuleQuery ruleQuery) {
    if (RuleStatus.REMOVED.equals(ruleDefinition.getStatus())) {
      return false;
    }
    String repositoryKey = ruleQuery.getRepositoryKey();
    if (ruleQuery.getRepositoryKey() != null && !repositoryKey.equals(ruleDefinition.getRepositoryKey())) {
      return false;
    }
    String key = ruleQuery.getKey();
    if (key != null && !key.equals(ruleDefinition.getRuleKey())) {
      return false;
    }
    String configKey = ruleQuery.getConfigKey();
    return configKey == null || configKey.equals(ruleDefinition.getConfigKey());
  }

  private static Rule toRule(RuleDefinitionDto ruleDefinition, List<RuleParamDto> params) {
    String severity = ruleDefinition.getSeverityString();
    String description = ruleDefinition.getDescription();
    RuleDto.Format descriptionFormat = ruleDefinition.getDescriptionFormat();

    Rule apiRule = new Rule();
    apiRule
      .setName(ruleDefinition.getName())
      .setLanguage(ruleDefinition.getLanguage())
      .setKey(ruleDefinition.getRuleKey())
      .setConfigKey(ruleDefinition.getConfigKey())
      .setIsTemplate(ruleDefinition.isTemplate())
      .setCreatedAt(new Date(ruleDefinition.getCreatedAt()))
      .setUpdatedAt(new Date(ruleDefinition.getUpdatedAt()))
      .setRepositoryKey(ruleDefinition.getRepositoryKey())
      .setSeverity(severity != null ? RulePriority.valueOf(severity) : null)
      .setStatus(ruleDefinition.getStatus().name())
      .setSystemTags(ruleDefinition.getSystemTags().toArray(new String[ruleDefinition.getSystemTags().size()]))
      .setTags(new String[0]);
    if (description != null && descriptionFormat != null) {
      if (RuleDto.Format.HTML.equals(descriptionFormat)) {
        apiRule.setDescription(description);
      } else {
        apiRule.setDescription(Markdown.convertToHtml(description));
      }
    }

    List<org.sonar.api.rules.RuleParam> apiParams = new ArrayList<>();
    for (RuleParamDto param : params) {
      apiParams.add(new org.sonar.api.rules.RuleParam(apiRule, param.getName(), param.getDescription(), param.getType())
        .setDefaultValue(param.getDefaultValue()));
    }
    apiRule.setParams(apiParams);

    return apiRule;
  }

  @Override
  public Optional<RuleDefinitionDto> findDtoByKey(RuleKey key) {
    return Optional.ofNullable(this.ruleDtosByKey.get(key));
  }

  @Override
  public Optional<RuleDefinitionDto> findDtoByUuid(String uuid) {
    return Optional.ofNullable(this.ruleDtosByUuid.get(uuid));
  }

  @Override
  public Collection<RuleDefinitionDto> findAll() {
    return ruleDtosByUuid.values();
  }

}
