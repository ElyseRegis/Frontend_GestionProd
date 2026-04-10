import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const Sprints = () => {
    const { projectId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [sprints, setSprints] = useState([]);
    const [project, setProject] = useState(null);
    const [loading, setLoading] = useState(true);
    const [expandedSprints, setExpandedSprints] = useState({});
    const [showSprintModal, setShowSprintModal] = useState(false);
    const [sprintErrors, setSprintErrors] = useState({});
    const [creatingSprint, setCreatingSprint] = useState(false);
    const [newSprint, setNewSprint] = useState({
        name: '',
        percent: 0,
        start_date: '',
        end_date: ''
    });
    const [showTaskModal, setShowTaskModal] = useState(false);
    const [taskErrors, setTaskErrors] = useState({});
    const [creatingTask, setCreatingTask] = useState(false);
    const [newTask, setNewTask] = useState({
        title: '',
        description: '',
        assigned_dev_id: '',
        start_date: '',
        end_date: '',
        priority: 0,
        sprint_id: null
    });
    const [users, setUsers] = useState([]);
    
    // State for editing tasks
    const [editingTask, setEditingTask] = useState(null);
    const [editTaskData, setEditTaskData] = useState({});
    const [editErrors, setEditErrors] = useState({});
    const [savingEdit, setSavingEdit] = useState(false);

    useEffect(() => {
        fetchData();
    }, [projectId]);

    const fetchData = async () => {
        try {
            const [sprintsRes, projectRes] = await Promise.all([
                api.get(`/sprints/project/${projectId}`),
                api.get(`/projects/${projectId}`)
            ]);
            setSprints(sprintsRes.data);
            setProject(projectRes.data);

            // Fetch users (only for admin/cdp)
            try {
                const usersRes = await api.get('/users');
                setUsers(usersRes.data);
            } catch (error) {
                // If not admin, try alternative endpoint or use empty array
                console.error('Error fetching users:', error);
                setUsers([]);
            }

            // Fetch tasks for each sprint
            const tasksBySprint = {};
            await Promise.all(
                sprintsRes.data.map(async (sprint) => {
                    try {
                        const tasksRes = await api.get(`/tasks/sprint/${sprint.id}`);
                        tasksBySprint[sprint.id] = tasksRes.data;
                    } catch (error) {
                        console.error(`Error fetching tasks for sprint ${sprint.id}:`, error);
                        tasksBySprint[sprint.id] = [];
                    }
                })
            );

            // Store tasks in sprints object
            setSprints(prev => prev.map(sprint => ({
                ...sprint,
                tasks: tasksBySprint[sprint.id] || []
            })));
        } catch (error) {
            console.error('Erreur:', error);
            // Show user-friendly error
            if (error.response?.status === 500) {
                console.error('Server error - possibly missing database columns. Please run migration 003.');
            }
        } finally {
            setLoading(false);
        }
    };

    const toggleSprint = (sprintId) => {
        setExpandedSprints(prev => ({
            ...prev,
            [sprintId]: !prev[sprintId]
        }));
    };

    const handleAddSprint = async (e) => {
        e.preventDefault();
        const errors = {};
        if (!newSprint.name.trim()) errors.name = 'Le nom est requis';
        if (newSprint.percent <= 0 || newSprint.percent > 100) errors.percent = 'Pourcentage invalide';
        if (!newSprint.start_date) errors.start_date = 'Date de début requise';
        if (!newSprint.end_date) errors.end_date = 'Date de fin requise';
        
        if (Object.keys(errors).length > 0) {
            setSprintErrors(errors);
            return;
        }
        
        setCreatingSprint(true);
        try {
            await api.post('/sprints', {
                ...newSprint,
                project_id: parseInt(projectId),
                percent: parseInt(newSprint.percent)
            });
            setShowSprintModal(false);
            setNewSprint({ name: '', percent: 0, start_date: '', end_date: '' });
            setSprintErrors({});
            fetchData();
        } catch (error) {
            setSprintErrors({ submit: error.response?.data?.error || 'Erreur lors de la création' });
        } finally {
            setCreatingSprint(false);
        }
    };

    const handleAddTask = async (e) => {
        e.preventDefault();
        const errors = {};
        if (!newTask.title.trim()) errors.title = 'Le titre est requis';
        if (!newTask.assigned_dev_id) errors.assigned_dev_id = 'Sélectionnez un développeur';

        // Validation des dates par rapport au projet
        const projectDeadline = project?.deadline ? new Date(project.deadline) : null;
        const projectStart = project?.created_at ? new Date(project.created_at) : new Date();
        projectStart.setHours(0, 0, 0, 0);
        
        if (newTask.start_date) {
            const startDate = new Date(newTask.start_date);
            startDate.setHours(0, 0, 0, 0);
            if (startDate < projectStart) {
                errors.start_date = `Date de début avant la création du projet (${projectStart.toLocaleDateString('fr-FR')})`;
            }
        }
        
        if (newTask.end_date) {
            const endDate = new Date(newTask.end_date);
            endDate.setHours(0, 0, 0, 0);
            if (projectDeadline) {
                const deadlineCopy = new Date(projectDeadline);
                deadlineCopy.setHours(0, 0, 0, 0);
                if (endDate > deadlineCopy) {
                    errors.end_date = `Date de fin dépasse le deadline du projet (${deadlineCopy.toLocaleDateString('fr-FR')})`;
                }
            }
            if (newTask.start_date) {
                const startDate = new Date(newTask.start_date);
                startDate.setHours(0, 0, 0, 0);
                if (endDate <= startDate) {
                    errors.end_date = 'La date de fin doit être après la date de début';
                }
            }
        }

        if (Object.keys(errors).length > 0) {
            setTaskErrors(errors);
            return;
        }
        
        setCreatingTask(true);
        try {
            await api.post('/tasks', {
                ...newTask,
                sprint_id: parseInt(newTask.sprint_id),
                assigned_dev_id: parseInt(newTask.assigned_dev_id),
                priority: parseInt(newTask.priority)
            });
            setShowTaskModal(false);
            setNewTask({ title: '', description: '', assigned_dev_id: '', start_date: '', end_date: '', priority: 0, sprint_id: null });
            setTaskErrors({});
            setExpandedSprints(prev => ({ ...prev, [newTask.sprint_id]: true }));
            fetchData();
        } catch (error) {
            setTaskErrors({ submit: error.response?.data?.error || 'Erreur lors de la création' });
        } finally {
            setCreatingTask(false);
        }
    };

    const handleValidateSprint = async (sprintId) => {
        if (window.confirm('Valider ce sprint déclenchera le calcul automatique des primes. Continuer ?')) {
            try {
                await api.post(`/sprints/${sprintId}/validate`);
                alert('Sprint validé avec succès ! Les primes ont été distribuées.');
                fetchData();
            } catch (error) {
                alert(error.response?.data?.error || 'Erreur lors de la validation');
            }
        }
    };

    const handleDeleteTask = async (taskId, taskTitle) => {
        if (window.confirm(`Supprimer la tâche "${taskTitle}" ?`)) {
            try {
                await api.delete(`/tasks/${taskId}`);
                fetchData();
            } catch (error) {
                console.error('Erreur lors de la suppression:', error);
                alert(error.response?.data?.error || 'Erreur lors de la suppression');
            }
        }
    };

    // Validate task (CDP/Admin only)
    const handleValidateTask = async (taskId, taskTitle) => {
        if (window.confirm(`Valider la tâche "${taskTitle}" ?`)) {
            try {
                await api.patch(`/tasks/${taskId}`, { status: 'validated' });
                fetchData();
            } catch (error) {
                console.error('Erreur lors de la validation:', error);
                alert(error.response?.data?.error || 'Erreur lors de la validation');
            }
        }
    };

    // Mark task for rework (CDP/Admin only)
    const handleReworkTask = async (taskId, taskTitle) => {
        if (window.confirm(`Marquer la tâche "${taskTitle}" comme "À revoir" ?`)) {
            try {
                await api.patch(`/tasks/${taskId}`, { status: 'rework' });
                fetchData();
            } catch (error) {
                console.error('Erreur:', error);
                alert(error.response?.data?.error || 'Erreur lors de la modification');
            }
        }
    };

    const handleUpdateTaskStatus = async (taskId, status) => {
        try {
            await api.patch(`/tasks/${taskId}/status`, { status });
            fetchData();
        } catch (error) {
            console.error('Erreur:', error);
        }
    };

    // Open edit modal for a task
    const handleOpenEditTask = (task) => {
        setEditingTask(task);
        setEditTaskData({
            title: task.title,
            description: task.description || '',
            assigned_dev_id: task.assigned_dev_id || '',
            start_date: task.start_date || '',
            end_date: task.end_date || '',
            priority: task.priority,
            status: task.status
        });
        setEditErrors({});
    };

    // Save edited task
    const handleSaveEdit = async () => {
        const errors = {};
        if (!editTaskData.title.trim()) errors.title = 'Le titre est requis';
        if (!editTaskData.assigned_dev_id) errors.assigned_dev_id = 'Sélectionnez un développeur';
        
        // Validation des dates
        const projectDeadline = project?.deadline ? new Date(project.deadline) : null;
        const projectStart = project?.created_at ? new Date(project.created_at) : new Date();
        projectStart.setHours(0, 0, 0, 0);
        
        if (editTaskData.start_date) {
            const startDate = new Date(editTaskData.start_date);
            startDate.setHours(0, 0, 0, 0);
            if (startDate < projectStart) {
                errors.start_date = `Date de début avant la création du projet`;
            }
        }
        
        if (editTaskData.end_date) {
            const endDate = new Date(editTaskData.end_date);
            endDate.setHours(0, 0, 0, 0);
            if (projectDeadline) {
                const deadlineCopy = new Date(projectDeadline);
                deadlineCopy.setHours(0, 0, 0, 0);
                if (endDate > deadlineCopy) {
                    errors.end_date = `Date de fin dépasse le deadline du projet`;
                }
            }
            if (editTaskData.start_date) {
                const startDate = new Date(editTaskData.start_date);
                startDate.setHours(0, 0, 0, 0);
                if (endDate <= startDate) {
                    errors.end_date = 'La date de fin doit être après la date de début';
                }
            }
        }
        
        if (Object.keys(errors).length > 0) {
            setEditErrors(errors);
            return;
        }
        
        setSavingEdit(true);
        try {
            // Update task fields
            await api.patch(`/tasks/${editingTask.id}`, {
                title: editTaskData.title,
                description: editTaskData.description,
                assigned_dev_id: parseInt(editTaskData.assigned_dev_id),
                start_date: editTaskData.start_date || null,
                end_date: editTaskData.end_date || null,
                priority: parseInt(editTaskData.priority),
                status: editTaskData.status
            });
            
            setEditingTask(null);
            fetchData();
        } catch (error) {
            setEditErrors({ submit: error.response?.data?.error || 'Erreur lors de la modification' });
        } finally {
            setSavingEdit(false);
        }
    };

    const getDevName = (devId) => {
        const dev = users.find(u => u.id === parseInt(devId));
        return dev ? dev.full_name : null;
    };

    const getDevInitials = (fullName) => {
        if (!fullName) return '?';
        return fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    };

    const getTaskDelayInfo = (task) => {
        if (!task.end_date) return { isOverdue: false, text: '', color: '', bg: '' };
        
        const endDate = new Date(task.end_date);
        endDate.setHours(0, 0, 0, 0);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const diffTime = today - endDate;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        // Tâche terminée ou validée = pas de retard
        if (task.status === 'done' || task.status === 'validated') {
            return { isOverdue: false, text: '', color: '', bg: '' };
        }
        
        if (diffDays > 0) {
            return {
                isOverdue: true,
                text: `⚠️ Retard de ${diffDays}j`,
                color: '#dc2626',
                bg: '#fee2e2'
            };
        } else if (diffDays === 0) {
            return {
                isOverdue: true,
                text: '🔴 Deadline aujourd\'hui',
                color: '#ea580c',
                bg: '#fff7ed'
            };
        } else if (diffDays > -3) {
            return {
                isOverdue: false,
                text: `⏰ ${Math.abs(diffDays)}j restant${Math.abs(diffDays) > 1 ? 's' : ''}`,
                color: '#d97706',
                bg: '#fef3c7'
            };
        }
        
        return { isOverdue: false, text: '', color: '', bg: '' };
    };

    const getPriorityIcon = (priority) => {
        const icons = {
            0: { icon: 'fa-minus-circle', color: '#3b82f6', label: 'Normale' },
            1: { icon: 'fa-exclamation-circle', color: '#f97316', label: 'Haute' },
            2: { icon: 'fa-bug', color: '#ef4444', label: 'Critique' }
        };
        return icons[priority] || icons[0];
    };

    const getStatusConfig = (status) => {
        const configs = {
            pending: { emoji: '⏳', label: 'En attente', color: '#64748b', bg: '#f1f5f9' },
            progress: { emoji: '🔄', label: 'En cours', color: '#3b82f6', bg: '#dbeafe' },
            done: { emoji: '✅', label: 'Terminée', color: '#10b981', bg: '#d1fae5' },
            rework: { emoji: '🔧', label: 'À revoir', color: '#f97316', bg: '#ffedd5' },
            validated: { emoji: '✓', label: 'Validée', color: '#10b981', bg: '#a7f3d0' }
        };
        return configs[status] || configs.pending;
    };

    if (loading) return <div className="loading-spinner">Chargement...</div>;

    const totalPercent = sprints.reduce((sum, s) => sum + s.percent, 0);
    const remainingPercent = 100 - totalPercent;
    const devs = users.filter(u => u.role === 'dev');

    return (
        <div>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div>
                    <button onClick={() => navigate('/projects')} className="btn-secondary" style={{ marginRight: '16px' }}>
                        <i className="fas fa-arrow-left"></i> Retour
                    </button>
                    <h1 className="page-title" style={{ display: 'inline-block' }}>
                        <i className="fas fa-folder-tree"></i> {project?.name}
                    </h1>
                    <p style={{ color: '#64748b', marginTop: '4px', fontSize: '0.9rem' }}>
                        Vue arborescence • {sprints.length} sprint{sprints.length !== 1 ? 's' : ''} • {totalPercent}% alloué
                    </p>
                </div>
                {(user?.role === 'admin' || user?.role === 'cdp') && (
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <button onClick={() => setShowTaskModal(true)} className="btn-primary" style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>
                            <i className="fas fa-plus"></i> Nouvelle tâche
                        </button>
                        {remainingPercent > 0 && (
                            <button onClick={() => setShowSprintModal(true)} className="btn-primary">
                                <i className="fas fa-plus"></i> Nouveau sprint
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Progress Bar */}
            <div className="card-modern" style={{ marginBottom: '24px' }}>
                <div className="progress-header">
                    <h3><i className="fas fa-chart-line"></i> Progression du projet</h3>
                    <div className="progress-stats">
                        <span>{sprints.filter(s => s.validated).length}/{sprints.length} validés</span>
                        <span>{totalPercent}% alloué</span>
                    </div>
                </div>
                <div className="progress-bar-container">
                    <div className="progress-bar-segmented">
                        {sprints.map(sprint => (
                            <div
                                key={sprint.id}
                                className={`progress-segment ${sprint.validated ? 'validated' : ''}`}
                                style={{ width: `${sprint.percent}%` }}
                            ></div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Deadline Info Bar */}
            {project?.deadline && (
                <div className="deadline-info-bar">
                    <div className="deadline-item">
                        <i className="fas fa-calendar-check"></i>
                        <span>Deadline du projet :</span>
                        <span className="deadline-value">
                            {new Date(project.deadline).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </span>
                    </div>
                    <div className="deadline-item">
                        <i className="fas fa-clock"></i>
                        <span>
                            {(() => {
                                const deadline = new Date(project.deadline);
                                const today = new Date();
                                today.setHours(0, 0, 0, 0);
                                deadline.setHours(0, 0, 0, 0);
                                const diffDays = Math.ceil((deadline - today) / (1000 * 60 * 60 * 24));
                                if (diffDays < 0) {
                                    return <span style={{ color: '#dc2626' }}>⚠️ Dépassé de {Math.abs(diffDays)} jours</span>;
                                } else if (diffDays === 0) {
                                    return <span style={{ color: '#ea580c' }}>🔴 Deadline aujourd'hui</span>;
                                } else if (diffDays <= 7) {
                                    return <span style={{ color: '#d97706' }}>⏰ {diffDays} jours restants</span>;
                                } else {
                                    return <span style={{ color: '#10b981' }}>✅ {diffDays} jours restants</span>;
                                }
                            })()}
                        </span>
                    </div>
                </div>
            )}

            {/* Tree View - Finder Mac Style */}
            <div className="tree-view-container">
                {/* Projet Root */}
                <div className="tree-item tree-root">
                    <div className="tree-item-header">
                        <i className="fas fa-folder-open tree-icon folder-icon"></i>
                        <span className="tree-item-name">{project?.name}</span>
                        <span className="tree-item-badge">{sprints.length} sprints</span>
                    </div>
                    
                    {/* Sprints List */}
                    <div className="tree-children">
                        {sprints.length === 0 ? (
                            <div className="tree-empty">
                                <i className="fas fa-chart-line"></i>
                                <p>Aucun sprint créé</p>
                                {(user?.role === 'admin' || user?.role === 'cdp') && (
                                    <button onClick={() => setShowSprintModal(true)} className="btn-sm btn-primary">
                                        <i className="fas fa-plus"></i> Créer le premier sprint
                                    </button>
                                )}
                            </div>
                        ) : (
                            sprints.map(sprint => {
                                const isExpanded = expandedSprints[sprint.id];
                                const sprintTasks = sprint.tasks || [];
                                
                                return (
                                    <div key={sprint.id} className="tree-item sprint-item">
                                        <div 
                                            className="tree-item-header"
                                            onClick={() => toggleSprint(sprint.id)}
                                        >
                                            <i className={`fas fa-chevron-${isExpanded ? 'down' : 'right'} tree-expand-icon`}></i>
                                            <i className={`fas ${sprint.validated ? 'fa-check-circle' : 'fa-flag'} tree-icon sprint-icon`}></i>
                                            <span className="tree-item-name">{sprint.name}</span>
                                            <div className="tree-item-badges">
                                                <span className="tree-percent-badge">{sprint.percent}%</span>
                                                {sprint.validated ? (
                                                    <span className="tree-status-badge validated">✓ Validé</span>
                                                ) : (
                                                    <span className="tree-status-badge pending">En attente</span>
                                                )}
                                                {(user?.role === 'admin' || user?.role === 'cdp') && !sprint.validated && (
                                                    <button 
                                                        className="tree-action-btn validate-btn"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleValidateSprint(sprint.id);
                                                        }}
                                                    >
                                                        <i className="fas fa-check-double"></i> Valider
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                        
                                        {/* Tasks under Sprint */}
                                        {isExpanded && (
                                            <div className="tree-children">
                                                {sprintTasks.length === 0 ? (
                                                    <div className="tree-empty-small">
                                                        <p>Aucune tâche</p>
                                                        {(user?.role === 'admin' || user?.role === 'cdp') && (
                                                            <button 
                                                                className="btn-sm btn-primary"
                                                                onClick={() => {
                                                                    setNewTask(prev => ({ ...prev, sprint_id: sprint.id.toString() }));
                                                                    setShowTaskModal(true);
                                                                }}
                                                            >
                                                                <i className="fas fa-plus"></i> Ajouter
                                                            </button>
                                                        )}
                                                    </div>
                                                ) : (
                                                    sprintTasks.map(task => {
                                                        const statusConfig = getStatusConfig(task.status);
                                                        const priorityInfo = getPriorityIcon(task.priority);
                                                        const devName = getDevName(task.assigned_dev_id);
                                                        const delayInfo = getTaskDelayInfo(task);
                                                        
                                                        return (
                                                            <div key={task.id} className={`tree-item task-item ${delayInfo.isOverdue ? 'task-overdue' : ''}`}>
                                                                <div className="tree-item-header task-header-layout">
                                                                    {/* GAUCHE: Nom de la tâche + Priorité */}
                                                                    <div className="task-left-section">
                                                                        <i className={`fas ${priorityInfo.icon} tree-icon priority-icon`} style={{ color: priorityInfo.color }} title={priorityInfo.label}></i>
                                                                        <div className="task-title-container">
                                                                            <span className="tree-item-name task-name-text">{task.title}</span>
                                                                        </div>
                                                                    </div>
                                                                    
                                                                    {/* CENTRE: Infos (dates, dev, statut) */}
                                                                    <div className="task-center-section">
                                                                        <div className="task-info-row">
                                                                            {task.start_date ? (
                                                                                <span className="task-info-badge start-date">
                                                                                    <i className="fas fa-play-circle"></i>
                                                                                    {new Date(task.start_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                                                                                </span>
                                                                            ) : (
                                                                                <span className="task-info-badge no-date">
                                                                                    <i className="fas fa-calendar"></i> Pas de début
                                                                                </span>
                                                                            )}
                                                                            
                                                                            {task.end_date ? (
                                                                                <span className={`task-info-badge end-date ${delayInfo.isOverdue ? 'overdue' : ''}`}>
                                                                                    <i className={`fas ${delayInfo.isOverdue ? 'fa-exclamation-triangle' : 'fa-flag-checkered'}`}></i>
                                                                                    {new Date(task.end_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                                                                                </span>
                                                                            ) : (
                                                                                <span className="task-info-badge no-date">
                                                                                    <i className="fas fa-calendar"></i> Pas de deadline
                                                                                </span>
                                                                            )}
                                                                            
                                                                            {devName ? (
                                                                                <span className="task-info-badge dev-badge">
                                                                                    <div className="dev-avatar-xsmall" style={{
                                                                                        background: `hsl(${(task.assigned_dev_id * 60) % 360}, 70%, 60%)`
                                                                                    }}>
                                                                                        {getDevInitials(devName)}
                                                                                    </div>
                                                                                    <span>{devName}</span>
                                                                                </span>
                                                                            ) : (
                                                                                <span className="task-info-badge no-dev">
                                                                                    <i className="fas fa-user-slash"></i> Non assigné
                                                                                </span>
                                                                            )}
                                                                            
                                                                            <span 
                                                                                className={`task-info-badge task-status-badge ${task.status}`}
                                                                                style={{ color: statusConfig.color, background: statusConfig.bg }}
                                                                            >
                                                                                {statusConfig.emoji} {statusConfig.label}
                                                                            </span>
                                                                            
                                                                            {task.points_earned > 0 && (
                                                                                <span className="task-info-badge points-badge">
                                                                                    <i className="fas fa-star"></i> {task.points_earned} pts
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                    
                                                                    {/* DROITE: Boutons d'action */}
                                                                    <div className="task-right-section">
                                                                        <button
                                                                            className="task-action-btn view-btn"
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                alert(`Détails de la tâche:\n\nTitre: ${task.title}\nDescription: ${task.description || 'Aucune'}\nDéveloppeur: ${devName || 'Non assigné'}\nStatut: ${statusConfig.label}\nPriorité: ${priorityInfo.label}\nPoints: ${task.points_earned || 0}`);
                                                                            }}
                                                                            title="Visualiser"
                                                                        >
                                                                            <i className="fas fa-eye"></i>
                                                                        </button>
                                                                        
                                                                        {/* Bouton Valider (vert) - CDP/Admin uniquement */}
                                                                        {(user?.role === 'admin' || user?.role === 'cdp') && task.status !== 'validated' && (
                                                                            <button
                                                                                className="task-action-btn validate-task-btn"
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    handleValidateTask(task.id, task.title);
                                                                                }}
                                                                                title="Valider la tâche"
                                                                            >
                                                                                <i className="fas fa-check"></i>
                                                                            </button>
                                                                        )}
                                                                        
                                                                        {/* Bouton À revoir (orange) - CDP/Admin uniquement */}
                                                                        {(user?.role === 'admin' || user?.role === 'cdp') && task.status !== 'validated' && task.status !== 'rework' && (
                                                                            <button
                                                                                className="task-action-btn rework-btn"
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    handleReworkTask(task.id, task.title);
                                                                                }}
                                                                                title="Marquer comme 'À revoir'"
                                                                            >
                                                                                <i className="fas fa-undo"></i>
                                                                            </button>
                                                                        )}
                                                                        
                                                                        {(user?.role === 'admin' || user?.role === 'cdp') && (
                                                                            <button
                                                                                className="task-action-btn edit-btn"
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    handleOpenEditTask(task);
                                                                                }}
                                                                                title="Modifier"
                                                                            >
                                                                                <i className="fas fa-edit"></i>
                                                                            </button>
                                                                        )}
                                                                        {(user?.role === 'admin' || user?.role === 'cdp') && (
                                                                            <button
                                                                                className="task-action-btn delete-btn"
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    handleDeleteTask(task.id, task.title);
                                                                                }}
                                                                                title="Supprimer"
                                                                            >
                                                                                <i className="fas fa-trash-alt"></i>
                                                                            </button>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        );
                                                    })
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>

            {/* Sprint Modal */}
            {showSprintModal && (
                <div className="modal-overlay" onClick={() => !creatingSprint && setShowSprintModal(false)}>
                    <div className="modal-content sprint-modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2><i className="fas fa-flag"></i> Nouveau sprint</h2>
                            <button className="btn-close" onClick={() => setShowSprintModal(false)} disabled={creatingSprint}>
                                <i className="fas fa-times"></i>
                            </button>
                        </div>
                        <form onSubmit={handleAddSprint}>
                            <div className="form-step">
                                <div className="form-group">
                                    <label>Nom du sprint *</label>
                                    <input type="text" value={newSprint.name} onChange={e => setNewSprint({...newSprint, name: e.target.value})} className={sprintErrors.name ? 'error' : ''} autoFocus />
                                    {sprintErrors.name && <p className="error-message">{sprintErrors.name}</p>}
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Pourcentage * (reste: {remainingPercent}%)</label>
                                        <input type="number" value={newSprint.percent} onChange={e => setNewSprint({...newSprint, percent: parseInt(e.target.value) || 0})} min="1" max={remainingPercent} className={sprintErrors.percent ? 'error' : ''} />
                                        {sprintErrors.percent && <p className="error-message">{sprintErrors.percent}</p>}
                                    </div>
                                    <div className="form-group">
                                        <label>Date de début *</label>
                                        <input type="date" value={newSprint.start_date} onChange={e => setNewSprint({...newSprint, start_date: e.target.value})} className={sprintErrors.start_date ? 'error' : ''} />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label>Date de fin *</label>
                                    <input type="date" value={newSprint.end_date} onChange={e => setNewSprint({...newSprint, end_date: e.target.value})} className={sprintErrors.end_date ? 'error' : ''} />
                                    {sprintErrors.end_date && <p className="error-message">{sprintErrors.end_date}</p>}
                                </div>
                            </div>
                            {sprintErrors.submit && <div className="error-banner">{sprintErrors.submit}</div>}
                            <div className="modal-footer">
                                <button type="button" className="btn-secondary" onClick={() => setShowSprintModal(false)}>Annuler</button>
                                <button type="submit" className="btn-success" disabled={creatingSprint}>
                                    {creatingSprint ? <><i className="fas fa-spinner fa-spin"></i> Création...</> : <><i className="fas fa-check"></i> Créer</>}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Task Modal */}
            {showTaskModal && (
                <div className="modal-overlay" onClick={() => !creatingTask && setShowTaskModal(false)}>
                    <div className="modal-content task-modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2><i className="fas fa-tasks"></i> Nouvelle tâche</h2>
                            <button className="btn-close" onClick={() => setShowTaskModal(false)} disabled={creatingTask}>
                                <i className="fas fa-times"></i>
                            </button>
                        </div>
                        <form onSubmit={handleAddTask}>
                            <div className="form-step">
                                <div className="form-group">
                                    <label>Titre *</label>
                                    <input type="text" value={newTask.title} onChange={e => setNewTask({...newTask, title: e.target.value})} className={taskErrors.title ? 'error' : ''} autoFocus />
                                    {taskErrors.title && <p className="error-message">{taskErrors.title}</p>}
                                </div>
                                <div className="form-group">
                                    <label>Description</label>
                                    <textarea value={newTask.description} onChange={e => setNewTask({...newTask, description: e.target.value})} rows="2" />
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Sprint *</label>
                                        <select value={newTask.sprint_id || ''} onChange={e => setNewTask({...newTask, sprint_id: e.target.value})}>
                                            <option value="">Sélectionner un sprint</option>
                                            {sprints.filter(s => !s.validated).map(s => (
                                                <option key={s.id} value={s.id}>{s.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>Priorité</label>
                                        <select value={newTask.priority} onChange={e => setNewTask({...newTask, priority: parseInt(e.target.value)})}>
                                            <option value="0">🔵 Normale</option>
                                            <option value="1">🟠 Haute</option>
                                            <option value="2">🔴 Critique</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label>Assigner à un développeur *</label>
                                    <select value={newTask.assigned_dev_id} onChange={e => setNewTask({...newTask, assigned_dev_id: e.target.value})} className={taskErrors.assigned_dev_id ? 'error' : ''}>
                                        <option value="">Sélectionner un développeur</option>
                                        {devs.map(dev => (
                                            <option key={dev.id} value={dev.id}>{dev.full_name} ({dev.email})</option>
                                        ))}
                                    </select>
                                    {taskErrors.assigned_dev_id && <p className="error-message">{taskErrors.assigned_dev_id}</p>}
                                </div>
                                <div className="form-row">
                                    <div className="form-group date-input-with-hint">
                                        <label>Date de début</label>
                                        <input type="date" value={newTask.start_date} onChange={e => setNewTask({...newTask, start_date: e.target.value})} />
                                        {project?.created_at && (
                                            <p className="date-input-hint">
                                                <i className="fas fa-info-circle"></i>
                                                Min: {new Date(project.created_at).toLocaleDateString('fr-FR')}
                                            </p>
                                        )}
                                    </div>
                                    <div className="form-group date-input-with-hint">
                                        <label>Date de fin</label>
                                        <input type="date" value={newTask.end_date} onChange={e => setNewTask({...newTask, end_date: e.target.value})} />
                                        {project?.deadline && (
                                            <p className="date-input-hint">
                                                <i className="fas fa-calendar-check"></i>
                                                Max: {new Date(project.deadline).toLocaleDateString('fr-FR')}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                            {taskErrors.submit && <div className="error-banner">{taskErrors.submit}</div>}
                            <div className="modal-footer">
                                <button type="button" className="btn-secondary" onClick={() => setShowTaskModal(false)}>Annuler</button>
                                <button type="submit" className="btn-success" disabled={creatingTask}>
                                    {creatingTask ? <><i className="fas fa-spinner fa-spin"></i> Création...</> : <><i className="fas fa-check"></i> Créer la tâche</>}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Task Modal */}
            {editingTask && (
                <div className="modal-overlay" onClick={() => !savingEdit && setEditingTask(null)}>
                    <div className="modal-content task-modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2><i className="fas fa-edit"></i> Modifier la tâche</h2>
                            <button className="btn-close" onClick={() => setEditingTask(null)} disabled={savingEdit}>
                                <i className="fas fa-times"></i>
                            </button>
                        </div>
                        <div className="form-step">
                            <div className="form-group">
                                <label>Titre *</label>
                                <input 
                                    type="text" 
                                    value={editTaskData.title} 
                                    onChange={e => {
                                        setEditTaskData({...editTaskData, title: e.target.value});
                                        if (editErrors.title) setEditErrors({...editErrors, title: null});
                                    }} 
                                    className={editErrors.title ? 'error' : ''} 
                                    autoFocus 
                                />
                                {editErrors.title && <p className="error-message">{editErrors.title}</p>}
                            </div>
                            
                            <div className="form-group">
                                <label>Description</label>
                                <textarea 
                                    value={editTaskData.description} 
                                    onChange={e => setEditTaskData({...editTaskData, description: e.target.value})} 
                                    rows="2" 
                                />
                            </div>
                            
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Statut</label>
                                    <select value={editTaskData.status} onChange={e => setEditTaskData({...editTaskData, status: e.target.value})}>
                                        <option value="pending">⏳ En attente</option>
                                        <option value="progress">🔄 En cours</option>
                                        <option value="done">✅ Terminée</option>
                                        {/* Les statuts 'validated' et 'rework' sont gérés par les boutons dédiés */}
                                        {(user?.role === 'admin' || user?.role === 'dev') && (
                                            <>
                                                <option value="rework">🔧 À revoir</option>
                                                <option value="validated">✓ Validée</option>
                                            </>
                                        )}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Priorité</label>
                                    <select value={editTaskData.priority} onChange={e => setEditTaskData({...editTaskData, priority: parseInt(e.target.value)})}>
                                        <option value="0">🔵 Normale</option>
                                        <option value="1">🟠 Haute</option>
                                        <option value="2">🔴 Critique</option>
                                    </select>
                                </div>
                            </div>
                            
                            <div className="form-group">
                                <label>Assigner à un développeur *</label>
                                <select 
                                    value={editTaskData.assigned_dev_id} 
                                    onChange={e => {
                                        setEditTaskData({...editTaskData, assigned_dev_id: e.target.value});
                                        if (editErrors.assigned_dev_id) setEditErrors({...editErrors, assigned_dev_id: null});
                                    }} 
                                    className={editErrors.assigned_dev_id ? 'error' : ''}
                                >
                                    <option value="">Sélectionner un développeur</option>
                                    {devs.map(dev => (
                                        <option key={dev.id} value={dev.id}>{dev.full_name} ({dev.email})</option>
                                    ))}
                                </select>
                                {editErrors.assigned_dev_id && <p className="error-message">{editErrors.assigned_dev_id}</p>}
                            </div>
                            
                            <div className="form-row">
                                <div className="form-group date-input-with-hint">
                                    <label>Date de début</label>
                                    <input
                                        type="date"
                                        value={editTaskData.start_date}
                                        onChange={e => setEditTaskData({...editTaskData, start_date: e.target.value})}
                                    />
                                    {project?.created_at && (
                                        <p className="date-input-hint">
                                            <i className="fas fa-info-circle"></i>
                                            Min: {new Date(project.created_at).toLocaleDateString('fr-FR')}
                                        </p>
                                    )}
                                </div>
                                <div className="form-group date-input-with-hint">
                                    <label>Date de fin</label>
                                    <input
                                        type="date"
                                        value={editTaskData.end_date}
                                        onChange={e => setEditTaskData({...editTaskData, end_date: e.target.value})}
                                    />
                                    {project?.deadline && (
                                        <p className="date-input-hint">
                                            <i className="fas fa-calendar-check"></i>
                                            Max: {new Date(project.deadline).toLocaleDateString('fr-FR')}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                        {editErrors.submit && <div className="error-banner">{editErrors.submit}</div>}
                        <div className="modal-footer">
                            <button type="button" className="btn-secondary" onClick={() => setEditingTask(null)} disabled={savingEdit}>
                                Annuler
                            </button>
                            <button type="button" className="btn-success" onClick={handleSaveEdit} disabled={savingEdit}>
                                {savingEdit ? <><i className="fas fa-spinner fa-spin"></i> Modification...</> : <><i className="fas fa-check"></i> Enregistrer</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Sprints;
