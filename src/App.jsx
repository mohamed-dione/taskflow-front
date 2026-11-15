import { useState } from 'react'
import {
  LayoutDashboard, Users, FolderKanban, CheckSquare,
  BarChart3, Settings, Search, Bell, Menu, Plus,
  TrendingUp, Clock, CheckCircle, CircleAlert
} from 'lucide-react'

const navigation = [
  { name: 'Dashboard', icon: LayoutDashboard },
  { name: 'Utilisateurs', icon: Users },
  { name: 'Projets', icon: FolderKanban },
  { name: 'Tâches', icon: CheckSquare },
  { name: 'Statistiques', icon: BarChart3 },
  { name: 'Paramètres', icon: Settings },
]

const stats = [
  { title: 'Utilisateurs', value: '1 248', change: '+12%', icon: Users },
  { title: 'Projets', value: '86', change: '+8%', icon: FolderKanban },
  { title: 'Tâches terminées', value: '324', change: '+18%', icon: CheckCircle },
  { title: 'Tâches en attente', value: '42', change: '-5%', icon: Clock },
]

const projects = [
  { name: 'Application TaskFlow', manager: 'Mohamed Dione', progress: 85, status: 'En cours' },
  { name: 'Refonte du site web', manager: 'Équipe Design', progress: 60, status: 'En cours' },
  { name: 'Gestion des utilisateurs', manager: 'Équipe Backend', progress: 100, status: 'Terminé' },
  { name: 'Application mobile', manager: 'Équipe Mobile', progress: 35, status: 'En cours' },
]

function App() {
  const [activePage, setActivePage] = useState('Dashboard')
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div className="app">
      <aside className={`sidebar ${menuOpen ? 'sidebar-open' : ''}`}>
        <div className="brand">
          <div className="brand-icon"><CheckSquare size={23} /></div>
          <span>TaskFlow<span className="brand-light"> Admin</span></span>
        </div>

        <p className="nav-label">MENU PRINCIPAL</p>
        <nav>
          {navigation.map(({ name, icon: Icon }) => (
            <button
              key={name}
              className={`nav-item ${activePage === name ? 'active' : ''}`}
              onClick={() => {
                setActivePage(name)
                setMenuOpen(false)
              }}
            >
              <Icon size={19} />
              <span>{name}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="avatar">MD</div>
          <div>
            <strong>Administrateur</strong>
            <small>Gestion du système</small>
          </div>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <button className="mobile-menu" onClick={() => setMenuOpen(!menuOpen)}>
            <Menu size={22} />
          </button>
          <div>
            <h1>{activePage}</h1>
            <p>Bienvenue sur votre espace d'administration.</p>
          </div>
          <div className="topbar-actions">
            <button className="icon-button" aria-label="Notifications">
              <Bell size={20} />
              <span className="notification-dot"></span>
            </button>
            <div className="top-avatar">MD</div>
          </div>
        </header>

        {activePage === 'Dashboard' ? (
          <>
            <section className="welcome-banner">
              <div>
                <span className="eyebrow">ESPACE ADMINISTRATEUR</span>
                <h2>Bonjour, bienvenue sur TaskFlow 👋</h2>
                <p>Voici un aperçu de l'activité de votre plateforme.</p>
              </div>
              <div className="banner-icon"><LayoutDashboard size={65} /></div>
            </section>

            <section className="stats-grid">
              {stats.map(({ title, value, change, icon: Icon }) => (
                <article className="stat-card" key={title}>
                  <div className="stat-top">
                    <span>{title}</span>
                    <div className="stat-icon"><Icon size={21} /></div>
                  </div>
                  <h3>{value}</h3>
                  <p className="stat-change"><TrendingUp size={15} /> {change} <span>ce mois-ci</span></p>
                </article>
              ))}
            </section>

            <section className="content-grid">
              <article className="panel projects-panel">
                <div className="panel-header">
                  <div>
                    <h2>Projets récents</h2>
                    <p>Suivi de l'avancement des projets</p>
                  </div>
                  <button className="primary-button" onClick={() => setActivePage('Projets')}>
                    <Plus size={17} /> Voir les projets
                  </button>
                </div>

                <div className="table-wrapper">
                  <table>
                    <thead>
                      <tr>
                        <th>Projet</th>
                        <th>Responsable</th>
                        <th>Progression</th>
                        <th>Statut</th>
                      </tr>
                    </thead>
                    <tbody>
                      {projects.map(project => (
                        <tr key={project.name}>
                          <td><strong>{project.name}</strong></td>
                          <td>{project.manager}</td>
                          <td>
                            <div className="progress-cell">
                              <div className="progress-track">
                                <div className="progress-fill" style={{ width: `${project.progress}%` }} />
                              </div>
                              <span>{project.progress}%</span>
                            </div>
                          </td>
                          <td>
                            <span className={`status ${project.status === 'Terminé' ? 'completed' : ''}`}>
                              {project.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </article>

              <article className="panel activity-panel">
                <div className="panel-header">
                  <div>
                    <h2>Activité récente</h2>
                    <p>État général de la plateforme</p>
                  </div>
                  <CircleAlert size={20} />
                </div>
                <div className="activity-item">
                  <div className="activity-icon blue"><Users size={18} /></div>
                  <div><strong>Utilisateurs</strong><p>Gestion des comptes inscrits</p></div>
                </div>
                <div className="activity-item">
                  <div className="activity-icon green"><CheckCircle size={18} /></div>
                  <div><strong>Projets terminés</strong><p>Suivi des projets achevés</p></div>
                </div>
                <div className="activity-item">
                  <div className="activity-icon orange"><Clock size={18} /></div>
                  <div><strong>Tâches en attente</strong><p>Éléments nécessitant un suivi</p></div>
                </div>
              </article>
            </section>
          </>
        ) : (
          <section className="panel page-placeholder">
            <div className="placeholder-icon"><Search size={28} /></div>
            <h2>{activePage}</h2>
            <p>Cette rubrique est prête à être développée et connectée à votre API TaskFlow.</p>
            <button className="primary-button" onClick={() => setActivePage('Dashboard')}>
              Retour au Dashboard
            </button>
          </section>
        )}

        <footer className="footer">© 2026 TaskFlow Admin. Tous droits réservés.</footer>
      </main>
    </div>
  )
}

export default App
