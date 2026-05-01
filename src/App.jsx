import { useState } from 'react'
import './App.css'

const initialForm = {
  exerciseName: '',
  sets: '',
  reps: '',
  weight: '',
}

function App() {
  const [formData, setFormData] = useState(initialForm)
  const [workouts, setWorkouts] = useState([])

  const handleChange = (event) => {
    const { name, value } = event.target
    setFormData((current) => ({
      ...current,
      [name]: value,
    }))
  }

  const handleSubmit = (event) => {
    event.preventDefault()

    const trimmedName = formData.exerciseName.trim()
    const trimmedSets = formData.sets.trim()
    const trimmedReps = formData.reps.trim()
    const trimmedWeight = formData.weight.trim()

    if (!trimmedName || !trimmedSets || !trimmedReps || !trimmedWeight) {
      return
    }

    setWorkouts((current) => [
      {
        id: `entry-${Date.now()}`,
        exerciseName: trimmedName,
        sets: trimmedSets,
        reps: trimmedReps,
        weight: trimmedWeight,
      },
      ...current,
    ])

    setFormData(initialForm)
  }

  return (
    <main className="app-shell">
      <header className="hero-panel">
        <div>
          <p className="eyebrow">FitTrack: Pro & Progress</p>
          <h1>Registro allenamenti</h1>
          <p className="subtitle">
            Registra esercizi, serie, ripetizioni e carichi in un elenco semplice e
            funzionale.
          </p>
        </div>
        <div className="summary-card">
          <span>{workouts.length}</span>
          <p>allenamenti salvati</p>
        </div>
      </header>

      <section className="card">
        <h2>Nuovo esercizio</h2>
        <form className="workout-form" onSubmit={handleSubmit}>
          <label>
            Nome Esercizio
            <input
              type="text"
              name="exerciseName"
              value={formData.exerciseName}
              onChange={handleChange}
              placeholder="Panca piana, Squat, Stacco..."
              autoComplete="off"
            />
          </label>

          <div className="row-group">
            <label>
              Serie
              <input
                type="number"
                min="1"
                name="sets"
                value={formData.sets}
                onChange={handleChange}
                placeholder="3"
              />
            </label>
            <label>
              Ripetizioni
              <input
                type="number"
                min="1"
                name="reps"
                value={formData.reps}
                onChange={handleChange}
                placeholder="10"
              />
            </label>
            <label>
              Carico (kg)
              <input
                type="number"
                min="1"
                name="weight"
                value={formData.weight}
                onChange={handleChange}
                placeholder="80"
              />
            </label>
          </div>

          <button type="submit" className="primary-button">
            Salva
          </button>
        </form>
      </section>

      <section className="card list-card">
        <div className="list-header">
          <div>
            <h2>Lista esercizi</h2>
            <p>Visualizza tutti i log salvati</p>
          </div>
          <span className="badge">{workouts.length}</span>
        </div>

        {workouts.length === 0 ? (
          <p className="empty-state">Nessun esercizio registrato. Inserisci un nuovo log.</p>
        ) : (
          <ul className="workout-list">
            {workouts.map((entry) => (
              <li key={entry.id} className="workout-item">
                <div>
                  <strong>{entry.exerciseName}</strong>
                  <p>
                    {entry.sets} serie · {entry.reps} ripetizioni
                  </p>
                </div>
                <div className="weight-tag">{entry.weight} kg</div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  )
}

export default App
