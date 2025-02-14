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
package org.sonar.server.platform.monitoring;

import org.picocontainer.Startable;
import org.sonar.process.Jmx;
import org.sonar.process.systeminfo.SystemInfoSection;

/**
 * Base implementation of a {@link SystemInfoSection}
 * that is exported as a JMX bean
 */
public abstract class BaseSectionMBean implements SystemInfoSection, Startable {

  /**
   * Auto-registers to MBean server
   */
  @Override
  public void start() {
    Jmx.register(objectName(), this);
  }

  /**
   * Unregister, if needed
   */
  @Override
  public void stop() {
    Jmx.unregister(objectName());
  }

  String objectName() {
    return "SonarQube:name=" + name();
  }

  /**
   * Name of section in System Info page
   */
  abstract String name();
}
