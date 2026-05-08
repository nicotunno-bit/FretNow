import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import sb from '../lib/supabase.js'

export default function TransportForm({ onSuccess }) {
  const { currentUser, currentRole, openAuth } = useAuth()

  const [depart, setDepart] = useState('')
  const [arrivee, setArrivee] = useState('')
  const [colisage, setColisage] = useState('')
  const [quantite, setQuantite] = useState('')
  const [dimL, setDimL] = useState('')
  const [dimW, setDimW] = useState('')
  const [dimH, setDimH] = useState('')
  const [poids, setPoids] = useState('')
  const [valeur, setValeur] = useState('')
  const [vehicleType, setVehicleType] = useState('fourgon')
  const [delaiValue, setDelaiValue] = useState('24h')
  const [societe, setSociete] = useState('')
  const [telephone, setTelephone] = useState('')
  const [email, setEmail] = useState('')
  const [infos, setInfos] = useState('')
  const [submitting, setSubmitting] = useState(false)

  function selectVehicle(val) {
    setVehicleType(val)
  }

  function selectDelai(val) {
    setDelaiValue(val)
  }

  async function handleSubmit(e) {
    e.preventDefault()

    if (!currentUser) {
      openAuth('client')
      return
    }
    if (currentRole !== 'client') {
      alert('Les comptes transporteurs ne peuvent pas passer commande.')
      return
    }

    setSubmitting(true)

    const courseData = {
      client_id: currentUser.id,
      pickup_address: depart,
      delivery_address: arrivee,
      package_type: colisage,
      weight_kg: parseFloat(poids) || null,
      declared_value: parseFloat(valeur) || null,
      vehicle_type_required: vehicleType,
      delay_required: delaiValue,
      notes: [
        infos,
        'Contact: ' + societe,
        telephone,
        email,
      ].filter(Boolean).join(' | '),
      status: 'pending',
    }

    const { data: course, error } = await sb.from('courses').insert([courseData]).select().single()

    setSubmitting(false)

    if (error) {
      console.error(error)
      alert('Erreur : ' + error.message)
      return
    }

    // Reset form
    setDepart('')
    setArrivee('')
    setColisage('')
    setQuantite('')
    setDimL('')
    setDimW('')
    setDimH('')
    setPoids('')
    setValeur('')
    setVehicleType('fourgon')
    setDelaiValue('24h')
    setSociete('')
    setTelephone('')
    setEmail('')
    setInfos('')

    if (onSuccess) onSuccess(course)
  }

  const vehicles = [
    { value: 'fourgon', label: '🔒 Fourgon' },
    { value: 'tautliner', label: '📦 Tautliner' },
    { value: 'plateau', label: '🏗 Plateau' },
    { value: 'benne', label: '⛏ Benne' },
    { value: 'frigo', label: '❄️ Frigorifique' },
    { value: 'malaxeur', label: '🔄 Malaxeur' },
  ]

  const delais = [
    { value: '24h', label: 'Express 24H' },
    { value: '48h', label: '48H' },
    { value: '1week', label: '1 semaine' },
    { value: '2weeks', label: '2 semaines' },
    { value: '1month', label: '1 mois' },
  ]

  return (
    <section className="form-section" id="commande">
      <div className="section-header">
        <div>
          <div className="section-tag">Commande rapide</div>
          <h2 className="section-title">Configurez votre transport</h2>
        </div>
        <p style={{ color: 'var(--muted)', fontSize: '14px', maxWidth: '280px', textAlign: 'right', lineHeight: 1.6 }}>
          Remplissez le formulaire, recevez votre devis sous 2h ouvrées.
        </p>
      </div>

      <div className="form-card">
        <form id="transportForm" onSubmit={handleSubmit}>
          <div className="form-grid">

            <div className="form-divider">📍 Lieux de transport</div>
            <div className="form-group">
              <label>Lieu d'expédition</label>
              <input
                type="text"
                placeholder="Ville, code postal ou adresse"
                id="depart"
                value={depart}
                onChange={e => setDepart(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>Lieu de réception</label>
              <input
                type="text"
                placeholder="Ville, code postal ou adresse"
                id="arrivee"
                value={arrivee}
                onChange={e => setArrivee(e.target.value)}
                required
              />
            </div>

            <div className="form-divider">📦 Type de colisage</div>
            <div className="form-group">
              <label>Type de colisage</label>
              <select id="colisage" value={colisage} onChange={e => setColisage(e.target.value)} required>
                <option value="" disabled>Sélectionner...</option>
                <option value="palette_europe">Palette Europe (80×120 cm)</option>
                <option value="palette_autre">Autre palette</option>
                <option value="carton">Carton / Colis</option>
                <option value="caisse_bois">Caisse bois</option>
                <option value="big_bag">Big Bag</option>
                <option value="piece_hors_gabarit">Pièce hors gabarit</option>
                <option value="autre">Autre (préciser)</option>
              </select>
            </div>
            <div className="form-group">
              <label>Nombre d'unités</label>
              <input
                type="number"
                placeholder="Ex: 3"
                id="quantite"
                min="1"
                value={quantite}
                onChange={e => setQuantite(e.target.value)}
                required
              />
            </div>

            <div className="form-group full">
              <label>Dimensions par unité (cm) — L × l × H</label>
              <div className="dim-grid">
                <input type="number" placeholder="Longueur" id="dim_l" min="1" value={dimL} onChange={e => setDimL(e.target.value)} />
                <input type="number" placeholder="Largeur" id="dim_w" min="1" value={dimW} onChange={e => setDimW(e.target.value)} />
                <input type="number" placeholder="Hauteur" id="dim_h" min="1" value={dimH} onChange={e => setDimH(e.target.value)} />
              </div>
            </div>

            <div className="form-group">
              <label>Poids total estimé (kg)</label>
              <input
                type="number"
                placeholder="Ex: 500"
                id="poids"
                min="1"
                value={poids}
                onChange={e => setPoids(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Valeur marchandise estimée (€)</label>
              <input
                type="number"
                placeholder="Optionnel — pour assurance"
                id="valeur"
                min="0"
                value={valeur}
                onChange={e => setValeur(e.target.value)}
              />
            </div>

            <div className="form-divider">🚛 Type de véhicule</div>
            <div className="form-group full">
              <label>Type de transport</label>
              <div className="chip-group" id="vehicleGroup">
                {vehicles.map(v => (
                  <div
                    key={v.value}
                    className={`chip${vehicleType === v.value ? ' active' : ''}`}
                    data-value={v.value}
                    onClick={() => selectVehicle(v.value)}
                  >
                    {v.label}
                  </div>
                ))}
              </div>
              <input type="hidden" id="vehicleType" value={vehicleType} />
            </div>

            <div className="form-divider">⏱ Délai souhaité</div>
            <div className="form-group full">
              <label>Délai maximum de livraison</label>
              <div className="delay-group" id="delayGroup">
                {delais.map(d => (
                  <div
                    key={d.value}
                    className={`delay-chip${delaiValue === d.value ? ' active' : ''}`}
                    data-value={d.value}
                    onClick={() => selectDelai(d.value)}
                  >
                    {d.label}
                  </div>
                ))}
              </div>
              <input type="hidden" id="delaiValue" value={delaiValue} />
            </div>

            <div className="form-divider">👤 Vos coordonnées</div>
            <div className="form-group">
              <label>Société / Nom</label>
              <input
                type="text"
                placeholder="Votre entreprise ou nom"
                id="societe"
                value={societe}
                onChange={e => setSociete(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>Téléphone</label>
              <input
                type="tel"
                placeholder="+33 6 xx xx xx xx"
                id="telephone"
                value={telephone}
                onChange={e => setTelephone(e.target.value)}
                required
              />
            </div>
            <div className="form-group full">
              <label>Email</label>
              <input
                type="email"
                placeholder="contact@votresociete.com"
                id="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="form-group full">
              <label>Informations complémentaires</label>
              <textarea
                placeholder="Marchandise dangereuse ? Contraintes horaires ? Accès particulier ?..."
                rows="3"
                id="infos"
                style={{ resize: 'vertical' }}
                value={infos}
                onChange={e => setInfos(e.target.value)}
              ></textarea>
            </div>

            <div className="form-submit">
              <p className="submit-note">Vos données sont confidentielles et sécurisées</p>
              <button type="submit" className="btn-submit" disabled={submitting}>
                {submitting ? 'Envoi…' : 'Demander mon devis'}
              </button>
            </div>

          </div>
        </form>
      </div>
    </section>
  )
}
