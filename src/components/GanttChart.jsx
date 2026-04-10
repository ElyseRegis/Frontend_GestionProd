import React, { useState, useMemo } from 'react';
import './GanttChart.css';

const GanttChart = ({ sprints, projectDeadline, projectCreatedAt }) => {
  const [filterDev, setFilterDev] = useState('all');

  // Calculate date range for the chart
  const { startDate, endDate, months } = useMemo(() => {
    if (!sprints || sprints.length === 0) {
      const today = new Date();
      const threeMonthsLater = new Date(today);
      threeMonthsLater.setMonth(today.getMonth() + 3);
      return { startDate: today, endDate: threeMonthsLater, months: [] };
    }

    const dates = sprints.flatMap(s => [
      new Date(s.start_date || new Date()),
      new Date(s.end_date || new Date())
    ]);

    if (projectDeadline) {
      dates.push(new Date(projectDeadline));
    }

    const minDate = new Date(Math.min(...dates));
    const maxDate = new Date(Math.max(...dates));

    // Add buffer
    minDate.setDate(minDate.getDate() - 7);
    maxDate.setDate(maxDate.getDate() + 30);

    // Generate months array
    const monthsArray = [];
    const current = new Date(minDate);
    while (current <= maxDate) {
      monthsArray.push(new Date(current));
      current.setMonth(current.getMonth() + 1);
    }

    return {
      startDate: minDate,
      endDate: maxDate,
      months: monthsArray
    };
  }, [sprints, projectDeadline]);

  // Calculate position percentage for a date
  const getDatePosition = (date) => {
    const targetDate = new Date(date);
    const totalDays = (endDate - startDate) / (1000 * 60 * 60 * 24);
    const daysFromStart = (targetDate - startDate) / (1000 * 60 * 60 * 24);
    return (daysFromStart / totalDays) * 100;
  };

  // Calculate width percentage between two dates
  const getWidthPercent = (startDate, endDate) => {
    const totalDays = (endDate - startDate) / (1000 * 60 * 60 * 24);
    const chartDays = (endDate - startDate) / (1000 * 60 * 60 * 24);
    return (totalDays / chartDays) * 100;
  };

  // Get sprint status
  const getSprintStatus = (sprint) => {
    if (sprint.validated) return 'validated';
    
    const end = new Date(sprint.end_date);
    const today = new Date();
    end.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    
    const diffDays = Math.ceil((end - today) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'overdue';
    if (diffDays <= 3) return 'at_risk';
    return 'in_progress';
  };

  // Get status label
  const getStatusLabel = (status) => {
    const labels = {
      validated: 'Validé',
      in_progress: 'En cours',
      at_risk: 'À risque',
      overdue: 'En retard',
      not_started: 'Pas commencé'
    };
    return labels[status] || status;
  };

  // Get unique developers
  const developers = useMemo(() => {
    if (!sprints || !sprints[0]?.tasks) return [];
    
    const devMap = new Map();
    sprints.forEach(sprint => {
      if (sprint.tasks) {
        sprint.tasks.forEach(task => {
          if (task.assigned_dev_id && task.assigned_dev_name) {
            devMap.set(task.assigned_dev_id, task.assigned_dev_name);
          }
        });
      }
    });
    
    return Array.from(devMap.entries()).map(([id, name]) => ({ id, name }));
  }, [sprints]);

  // Filter sprints by developer
  const filteredSprints = useMemo(() => {
    if (filterDev === 'all' || !sprints) return sprints;
    
    return sprints.filter(sprint => {
      if (!sprint.tasks) return false;
      return sprint.tasks.some(task => task.assigned_dev_id === parseInt(filterDev));
    });
  }, [sprints, filterDev]);

  // Calculate stats
  const stats = useMemo(() => {
    if (!sprints || sprints.length === 0) {
      return { total: 0, validated: 0, inProgress: 0, atRisk: 0, overdue: 0 };
    }

    const stats = {
      total: sprints.length,
      validated: 0,
      inProgress: 0,
      atRisk: 0,
      overdue: 0
    };

    sprints.forEach(sprint => {
      const status = getSprintStatus(sprint);
      if (status === 'validated') stats.validated++;
      else if (status === 'in_progress') stats.inProgress++;
      else if (status === 'at_risk') stats.atRisk++;
      else if (status === 'overdue') stats.overdue++;
    });

    return stats;
  }, [sprints]);

  if (!sprints || sprints.length === 0) {
    return (
      <div className="gantt-container">
        <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
          <i className="fas fa-chart-gantt" style={{ fontSize: '3rem', marginBottom: '16px' }}></i>
          <p>Aucun sprint à afficher dans le diagramme de Gantt</p>
        </div>
      </div>
    );
  }

  return (
    <div className="gantt-container">
      <div className="gantt-header">
        <h2>
          <i className="fas fa-chart-gantt"></i> Diagramme de Gantt
        </h2>
        <div className="gantt-controls">
          <select
            className="gantt-filter"
            value={filterDev}
            onChange={(e) => setFilterDev(e.target.value)}
          >
            <option value="all">Tous les développeurs</option>
            {developers.map(dev => (
              <option key={dev.id} value={dev.id}>{dev.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Stats */}
      <div className="gantt-stats">
        <div className="gantt-stat">
          <div className="gantt-stat-icon" style={{ color: '#3b82f6' }}>📊</div>
          <div className="gantt-stat-info">
            <div className="gantt-stat-label">Total Sprints</div>
            <div className="gantt-stat-value">{stats.total}</div>
          </div>
        </div>
        <div className="gantt-stat">
          <div className="gantt-stat-icon" style={{ color: '#10b981' }}>✅</div>
          <div className="gantt-stat-info">
            <div className="gantt-stat-label">Validés</div>
            <div className="gantt-stat-value">{stats.validated}</div>
          </div>
        </div>
        <div className="gantt-stat">
          <div className="gantt-stat-icon" style={{ color: '#3b82f6' }}>🔄</div>
          <div className="gantt-stat-info">
            <div className="gantt-stat-label">En cours</div>
            <div className="gantt-stat-value">{stats.inProgress}</div>
          </div>
        </div>
        <div className="gantt-stat">
          <div className="gantt-stat-icon" style={{ color: '#f97316' }}>⚠️</div>
          <div className="gantt-stat-info">
            <div className="gantt-stat-label">À risque</div>
            <div className="gantt-stat-value">{stats.atRisk}</div>
          </div>
        </div>
        <div className="gantt-stat">
          <div className="gantt-stat-icon" style={{ color: '#dc2626' }}>🚨</div>
          <div className="gantt-stat-info">
            <div className="gantt-stat-label">En retard</div>
            <div className="gantt-stat-value">{stats.overdue}</div>
          </div>
        </div>
      </div>

      {/* Gantt Chart */}
      <div className="gantt-chart">
        {/* Timeline */}
        <div className="gantt-timeline">
          {months.map((month, index) => (
            <div key={index} className="gantt-month">
              {month.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })}
            </div>
          ))}
        </div>

        {/* Sprint bars */}
        {filteredSprints.map((sprint) => {
          const status = getSprintStatus(sprint);
          const leftPercent = getDatePosition(sprint.start_date);
          const widthPercent = getWidthPercent(
            new Date(sprint.start_date),
            new Date(sprint.end_date)
          );

          return (
            <div key={sprint.id} className="gantt-row">
              <div className="gantt-label" title={sprint.name}>
                {sprint.name}
              </div>
              <div className="gantt-bars-container">
                <div
                  className={`gantt-bar ${status}`}
                  style={{
                    left: `${leftPercent}%`,
                    width: `${Math.max(widthPercent, 2)}%`
                  }}
                  title={`${sprint.name}\n${getStatusLabel(status)}\n${new Date(sprint.start_date).toLocaleDateString('fr-FR')} - ${new Date(sprint.end_date).toLocaleDateString('fr-FR')}`}
                >
                  <span className="gantt-bar-label">
                    {sprint.percent}%
                  </span>
                </div>
              </div>
            </div>
          );
        })}

        {/* Project deadline marker */}
        {projectDeadline && (
          <div className="gantt-row">
            <div className="gantt-label" style={{ color: '#dc2626', fontWeight: '700' }}>
              🚩 Deadline Projet
            </div>
            <div className="gantt-bars-container">
              <div
                className="gantt-deadline-marker"
                style={{ left: `${getDatePosition(projectDeadline)}%` }}
              >
                <div className="gantt-deadline-label">
                  {new Date(projectDeadline).toLocaleDateString('fr-FR')}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="gantt-legend">
        <div className="gantt-legend-item">
          <div className="gantt-legend-color" style={{ background: '#10b981' }}></div>
          <span>Validé</span>
        </div>
        <div className="gantt-legend-item">
          <div className="gantt-legend-color" style={{ background: '#3b82f6' }}></div>
          <span>En cours</span>
        </div>
        <div className="gantt-legend-item">
          <div className="gantt-legend-color" style={{ background: '#f97316' }}></div>
          <span>À risque</span>
        </div>
        <div className="gantt-legend-item">
          <div className="gantt-legend-color" style={{ background: '#dc2626' }}></div>
          <span>En retard</span>
        </div>
      </div>
    </div>
  );
};

export default GanttChart;
