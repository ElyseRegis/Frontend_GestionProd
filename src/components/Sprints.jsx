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
    const [showAddSprint, setShowAddSprint] = useState(false);
    const [newSprint, setNewSprint] = useState({
        name: '',
        percent: 0,
        start_date: '',
        end_date: ''
    });
    const [selectedSprint, setSelectedSprint] = useState(null);
    const [tasks, setTasks] = useState([]);
    const [showAddTask, setShowAddTask] = useState(false);
    const [newTask, setNewTask] = useState({
        title: '',
        description: '',
        assigned_dev_id: '',
        start_date: '',
        end_date: '',
        priority: 0
    });
    const [users, setUsers] = useState([]);

    useEffect(() => {
        fetchData();
    }, [projectId]);

    const fetchData = async () => {
        try {
            const [sprintsRes, projectRes, usersRes] = await Promise.all([
                api.get(`/sprints/project/${projectId}`),
                api.get(`/projects/${projectId}`),
                api.get('/users')
            ]);
            setSprints(sprintsRes.data);
            setProject(projectRes.data);
            setUsers(usersRes.data);
        } catch (error) {
            console.error('Erreur:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchTasks = async (sprintId) => {
        try {
            const response = await api.get(`/tasks/sprint/${sprintId}`);
            setTasks(response.data);
        } catch (error) {
            console.error('Erreur:', error);
        }
    };

    const handleSelectSprint = async (sprint) => {
        setSelectedSprint(sprint);
        await fetchTasks(sprint.id);
    };

    const handleAddSprint = async (e) => {
        e.preventDefault();
        try {
            await api.post('/sprints', {
                ...newSprint,
                project_id: parseInt(projectId)
            });
            setShowAddSprint(false);
            setNewSprint({ name: '', percent: 0, start_date: '', end_date: '' });
            fetchData();
        } catch (error) {
            console.error('Erreur:', error);
            alert(error.response?.data?.error || 'Erreur lors de la création');
        }
    };

    const handleValidateSprint = async (sprintId) => {
        if (window.confirm('Valider ce sprint déclenchera le calcul automatique des primes. Continuer ?')) {
            try {
                await api.post(`/sprints/${sprintId}/validate`);
                alert('Sprint validé avec succès ! Les primes ont été distribuées.');
                fetchData();
                if (selectedSprint?.id === sprintId) {
                    await fetchTasks(sprintId);
                }
            } catch (error) {
                console.error('Erreur:', error);
                alert(error.response?.data?.error || 'Erreur lors de la validation');
            }
        }
    };

    const handleAddTask = async (e) => {
        e.preventDefault();
        try {
            await api.post('/tasks', {
                ...newTask,
                sprint_id: selectedSprint.id
            });
            setShowAddTask(false);
            setNewTask({ title: '', description: '', assigned_dev_id: '', start_date: '', end_date: '', priority: 0 });
            await fetchTasks(selectedSprint.id);
        } catch (error) {
            console.error('Erreur:', error);
            alert('Erreur lors de la création de la tâche');
        }
    };

    const handleUpdateTaskStatus = async (taskId, status) => {
        try {
            await api.patch(`/tasks/${taskId}/status`, { status });
            await fetchTasks(selectedSprint.id);
        } catch (error) {
            console.error('Erreur:', error);
        }
    };

    if (loading) return <div className="loading-spinner">Chargement...</div>;

    const totalPercent = sprints.reduce((sum, s) => sum + s.percent, 0);
    const remainingPercent = 100 - totalPercent;

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div>
                    <button onClick={() => navigate('/projects')} className="btn-secondary" style={{ marginRight: '16px' }}>
                        <i className="fas fa-arrow-left"></i> Retour
                    </button>
                    <h1 className="page-title" style={{ display: 'inline-block' }}>
                        <i className="fas fa-chart-line"></i> Sprints - {project?.name}
                    </h1>
                </div>
                {(user.role === 'admin' || user.role === 'cdp') && remainingPercent > 0 && (
                    <button onClick={() => setShowAddSprint(true)} className="btn-primary">
                        <i className="fas fa-plus"></i> Ajouter un sprint
                    </button>
                )}
            </div>

            {/* Barre de progression */}
            <div className="card-modern" style={{ marginBottom: '24px' }}>
                <h3>Avancement du projet</h3>
                <div style={{ marginTop: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <span>Sprints validés</span>
                        <span>{sprints.filter(s => s.validated).length}/{sprints.length}</span>
                    </div>
                    <div className="progress-bar-bg" style={{ height: '8px', background: '#e2e8f0', borderRadius: '4px' }}>
                        <div className="progress-fill" style={{ 
                            width: `${(sprints.filter(s => s.validated).length / sprints.length) * 100}%`,
                            height: '100%',
                            background: '#10b981',
                            borderRadius: '4px'
                        }}></div>
                    </div>
                </div>
            </div>

            {/* Liste des sprints */}
            <div className="stats-grid">
                {sprints.map(sprint => (
                    <div 
                        key={sprint.id} 
                        className={`stat-card ${selectedSprint?.id === sprint.id ? 'active' : ''}`}
                        style={{ 
                            cursor: 'pointer',
                            border: selectedSprint?.id === sprint.id ? '2px solid #2c6e9e' : 'none',
                            background: sprint.validated ? '#f0fdf4' : 'white'
                        }}
                        onClick={() => handleSelectSprint(sprint)}
                    >
                        <div className="stat-icon" style={{ background: sprint.validated ? '#d1fae5' : '#e2e8f0' }}>
                            <i className={`fas ${sprint.validated ? 'fa-check-circle' : 'fa-chart-line'}`} style={{ color: sprint.validated ? '#0b5e42' : '#64748b' }}></i>
                        </div>
                        <div className="stat-info" style={{ flex: 1 }}>
                            <h3 style={{ fontSize: '1.1rem' }}>{sprint.name}</h3>
                            <p>{sprint.percent}% du projet</p>
                            <p style={{ fontSize: '0.7rem', marginTop: '8px' }}>
                                {sprint.start_date ? new Date(sprint.start_date).toLocaleDateString() : '?'} → 
                                {sprint.end_date ? new Date(sprint.end_date).toLocaleDateString() : '?'}
                            </p>
                            {sprint.validated && (
                                <p style={{ color: '#10b981', fontSize: '0.7rem', marginTop: '4px' }}>
                                    <i className="fas fa-check-circle"></i> Validé le {new Date(sprint.validated_at).toLocaleDateString()}
                                </p>
                            )}
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <div className="badge-modern" style={{ background: sprint.validated ? '#d1fae5' : '#fef3c7' }}>
                                {sprint.validated ? 'Validé' : `${sprint.validated_tasks || 0}/${sprint.total_tasks || 0} tâches`}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Détails du sprint sélectionné */}
            {selectedSprint && (
                <div className="card-modern">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <h2>{selectedSprint.name}</h2>
                        <div>
                            {(user.role === 'admin' || user.role === 'cdp') && !selectedSprint.validated && (
                                <button 
                                    onClick={() => handleValidateSprint(selectedSprint.id)}
                                    className="btn-success"
                                    style={{ marginRight: '12px' }}
                                >
                                    <i className="fas fa-check-double"></i> Valider le sprint
                                </button>
                            )}
                            {(user.role === 'admin' || user.role === 'cdp') && !selectedSprint.validated && (
                                <button onClick={() => setShowAddTask(true)} className="btn-primary">
                                    <i className="fas fa-plus"></i> Ajouter une tâche
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Tâches du sprint */}
                    <div className="tasks-grid">
                        {tasks.map(task => (
                            <div key={task.id} className="task-card">
                                <div className="task-header">
                                    <h4>{task.title}</h4>
                                    <span className={`task-status ${task.status}`}>
                                        {task.status === 'pending' && '⏳ En attente'}
                                        {task.status === 'progress' && '🔄 En cours'}
                                        {task.status === 'done' && '✅ Terminée'}
                                        {task.status === 'validated' && '✓ Validée'}
                                    </span>
                                </div>
                                <div className="task-body">
                                    <p><strong>Assigné à:</strong> {task.assigned_dev_name || 'Non assigné'}</p>
                                    <p><strong>Dates:</strong> {task.start_date || '—'} → {task.end_date || '—'}</p>
                                    {task.description && <p><strong>Description:</strong> {task.description}</p>}
                                    {task.points_earned > 0 && (
                                        <p><strong>Prime générée:</strong> <span className="prime-value">{task.points_earned} pts</span></p>
                                    )}
                                </div>
                                {user.role === 'dev' && task.assigned_dev_id === user.id && (
                                    <div className="task-actions">
                                        {task.status === 'pending' && (
                                            <button onClick={() => handleUpdateTaskStatus(task.id, 'progress')} className="btn-primary">
                                                <i className="fas fa-play"></i> Commencer
                                            </button>
                                        )}
                                        {task.status === 'progress' && (
                                            <button onClick={() => handleUpdateTaskStatus(task.id, 'done')} className="btn-success">
                                                <i className="fas fa-check"></i> Terminer
                                            </button>
                                        )}
                                    </div>
                                )}
                                {(user.role === 'admin' || user.role === 'cdp') && task.status === 'done' && (
                                    <div className="task-actions">
                                        <button onClick={() => handleUpdateTaskStatus(task.id, 'validated')} className="btn-success">
                                            <i className="fas fa-check-double"></i> Valider la tâche
                                        </button>
                                        <button onClick={() => handleUpdateTaskStatus(task.id, 'rework')} className="btn-warning">
                                            <i className="fas fa-redo"></i> Demander révision
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                    {tasks.length === 0 && (
                        <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                            <i className="fas fa-inbox" style={{ fontSize: '48px', marginBottom: '16px' }}></i>
                            <p>Aucune tâche dans ce sprint</p>
                        </div>
                    )}
                </div>
            )}

            {/* Modal Ajout Sprint */}
            {showAddSprint && (
                <div className="modal-overlay" onClick={() => setShowAddSprint(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <h2>Ajouter un sprint</h2>
                        <form onSubmit={handleAddSprint}>
                            <div className="form-group">
                                <label>Nom du sprint</label>
                                <input type="text" value={newSprint.name} onChange={e => setNewSprint({...newSprint, name: e.target.value})} required />
                            </div>
                            <div className="form-group">
                                <label>Pourcentage (reste: {remainingPercent}%)</label>
                                <input type="number" value={newSprint.percent} onChange={e => setNewSprint({...newSprint, percent: parseInt(e.target.value)})} max={remainingPercent} required />
                            </div>
                            <div className="form-group">
                                <label>Date de début</label>
                                <input type="date" value={newSprint.start_date} onChange={e => setNewSprint({...newSprint, start_date: e.target.value})} />
                            </div>
                            <div className="form-group">
                                <label>Date de fin</label>
                                <input type="date" value={newSprint.end_date} onChange={e => setNewSprint({...newSprint, end_date: e.target.value})} />
                            </div>
                            <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                                <button type="submit" className="btn-primary">Créer</button>
                                <button type="button" onClick={() => setShowAddSprint(false)} className="btn-secondary">Annuler</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal Ajout Tâche */}
            {showAddTask && (
                <div className="modal-overlay" onClick={() => setShowAddTask(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <h2>Ajouter une tâche</h2>
                        <form onSubmit={handleAddTask}>
                            <div className="form-group">
                                <label>Titre</label>
                                <input type="text" value={newTask.title} onChange={e => setNewTask({...newTask, title: e.target.value})} required />
                            </div>
                            <div className="form-group">
                                <label>Description</label>
                                <textarea value={newTask.description} onChange={e => setNewTask({...newTask, description: e.target.value})} rows="3"></textarea>
                            </div>
                            <div className="form-group">
                                <label>Assigner à</label>
                                <select value={newTask.assigned_dev_id} onChange={e => setNewTask({...newTask, assigned_dev_id: e.target.value})}>
                                    <option value="">Sélectionner un développeur</option>
                                    {users.filter(u => u.role === 'dev').map(u => (
                                        <option key={u.id} value={u.id}>{u.full_name} ({u.email})</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Date de début</label>
                                <input type="date" value={newTask.start_date} onChange={e => setNewTask({...newTask, start_date: e.target.value})} />
                            </div>
                            <div className="form-group">
                                <label>Date de fin</label>
                                <input type="date" value={newTask.end_date} onChange={e => setNewTask({...newTask, end_date: e.target.value})} />
                            </div>
                            <div className="form-group">
                                <label>Priorité (0=normale, 1=haute, 2=critique)</label>
                                <select value={newTask.priority} onChange={e => setNewTask({...newTask, priority: parseInt(e.target.value)})}>
                                    <option value="0">Normale</option>
                                    <option value="1">Haute</option>
                                    <option value="2">Critique</option>
                                </select>
                            </div>
                            <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                                <button type="submit" className="btn-primary">Créer</button>
                                <button type="button" onClick={() => setShowAddTask(false)} className="btn-secondary">Annuler</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Sprints;