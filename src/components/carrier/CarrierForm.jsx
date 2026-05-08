import { useState } from 'react'
import sb from '../../lib/supabase.js'

const VEHICLE_TYPES = [
  { value: 'fourgon', label: 'Fourgon' },
  { value: 'tautliner', label: 'Tautliner' },
  { value: 'plateau', label: 'Plateau' },
  { value: 'benne', label: 'Benne' },
  { value: 'frigo', label: 'Frigorifique' },
  { value: 'malaxeur', label: 'Malaxeur' },
  { value: 'porte-engins', label: 'Porte-engins' },
  { value: 'citerne', label: 'Citerne' },
  { value: 'grue', label: 'Bras / Grue' },
]

export default function CarrierForm({ onSuccess }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [societe, setSociete] = useState('')
  const [siret, setSiret] = useState('')
  const [licence, setLicence] = useState('')
  const [tva, setTva] = useState('')
  const [adresse, setAdresse] = useState('')
  const [contact, setContact] = useState('')
  const [poste, setPoste] = useState('')
  const [tel, setTel] = useState('')
  const [nbVehicules, setNbVehicules] = useState('')
  const [chargeMax, setChargeMax] = useState('')
  const [checkedVehicles, setCheckedVehicles] = useState(new Set())
  const [zones, setZones] = useState([])
  const [zoneInput, setZoneInput] = useState('')
  const [rayon, setRayon] = useState('')
  const [international, setInternational] = useState('non')
  const [presentation, setPresentation] = useState('')
  const [cgu, setCgu] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  function toggleVehicle(value) {
    setCheckedVehicles(prev => {
      const next = new Set(prev)
      if (next.has(value)) next.delete(value)
      else next.add(value)
      return next
    })
  }

  function addZone(val) {
    const trimmed = val.trim().replace(/,$/, '')
    if (!trimmed || zones.includes(trimmed)) return
    setZones(prev => [...prev, trimmed])
  }

  function removeZone(val) {
    setZones(prev => prev.filter(z => z !== val))
  }

  function handleZoneKeyDown(e) {
    if ((e.key === 'Enter' || e.key === ',') && zoneInput.trim()) {
      e.preventDefault()
      addZone(zoneInput)
      setZoneInput('')
    } else if (e.key === 'Backspace' && !zoneInput && zones.length) {
      removeZone(zones[zones.length - 1])
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()

    if (password.length < 8) {
      alert('Mot de passe trop court (8 caractères min.).')
      return
    }

    setSubmitting(true)

    // 1. Create auth account
    const { data: authData, error: authErr } = await sb.auth.signUp({
      email,
      password,
      options: { data: { full_name: societe, company_name: societe, account_type: 'carrier' } },
    })

    if (authErr) {
      setSubmitting(false)
      alert('Erreur auth : ' + authErr.message)
      return
    }

    const newUserId = authData.user?.id
    if (!newUserId) {
      setSubmitting(false)
      alert('Création du compte impossible.')
      return
    }

    // 2. Create transporter profile
    const transporteurData = {
      user_id: newUserId,
      company_name: societe,
      siret: siret || null,
      contact_name: contact || null,
      email,
      phone: tel || null,
      status: 'pending',
      is_available: false,
    }

    const { data: transporteur, error: tErr } = await sb
      .from('transporteurs')
      .insert([transporteurData])
      .select()
      .single()

    if (tErr) {
      setSubmitting(false)
      alert('Erreur fiche transporteur : ' + tErr.message)
      return
    }

    // 3. Insert vehicles
    if (transporteur && checkedVehicles.size > 0) {
      const maxWeightKg = parseFloat(chargeMax) * 1000 || null
      const vehicleRows = [...checkedVehicles].map(type => ({
        transporteur_id: transporteur.id,
        type,
        max_weight_kg: maxWeightKg,
        is_active: true,
      }))
      const { error: vErr } = await sb.from('vehicles').insert(vehicleRows)
      if (vErr) console.warn('Erreur véhicules :', vErr)
    }

    setSubmitting(false)
    if (onSuccess) onSuccess()
  }

  return (
    <section className="carrier-form-section" id="carrier-inscription">
      <div className="section-header">
        <div>
          <div className="section-tag">Inscription transporteur</div>
          <h2 className="section-title">Rejoignez le réseau</h2>
        </div>
        <p style={{ color: 'var(--muted)', fontSize: '14px', maxWidth: '280px', textAlign: 'right', lineHeight: 1.6 }}>
          Création du compte immédiate. Validation du dossier sous 48h.
        </p>
      </div>

      <div className="form-card">
        <form id="carrierForm" onSubmit={handleSubmit}>
          <div className="form-grid">

            <div className="form-divider">🔐 Accès à votre espace</div>
            <div className="form-group">
              <label>Email de connexion</label>
              <input
                type="email"
                placeholder="contact@votresociete.com"
                id="c_email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>Mot de passe (8 car. min.)</label>
              <input
                type="password"
                placeholder="Votre mot de passe"
                id="c_password"
                minLength="8"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
            </div>

            <div className="form-divider">🏢 Informations société</div>
            <div className="form-group">
              <label>Raison sociale</label>
              <input
                type="text"
                placeholder="Nom de votre entreprise"
                id="c_societe"
                value={societe}
                onChange={e => setSociete(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>SIRET</label>
              <input
                type="text"
                placeholder="14 chiffres"
                id="c_siret"
                maxLength="14"
                value={siret}
                onChange={e => setSiret(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>Numéro de licence transport</label>
              <input
                type="text"
                placeholder="Licence communautaire / nationale"
                id="c_licence"
                value={licence}
                onChange={e => setLicence(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Numéro TVA intracommunautaire</label>
              <input
                type="text"
                placeholder="FR xx xxxxxxxxx"
                id="c_tva"
                value={tva}
                onChange={e => setTva(e.target.value)}
              />
            </div>
            <div className="form-group full">
              <label>Adresse du siège social</label>
              <input
                type="text"
                placeholder="Adresse complète"
                id="c_adresse"
                value={adresse}
                onChange={e => setAdresse(e.target.value)}
                required
              />
            </div>

            <div className="form-divider">👤 Contact principal</div>
            <div className="form-group">
              <label>Prénom &amp; Nom du responsable</label>
              <input
                type="text"
                placeholder="Jean Dupont"
                id="c_contact"
                value={contact}
                onChange={e => setContact(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>Poste / Fonction</label>
              <input
                type="text"
                placeholder="Gérant, Directeur d'exploitation..."
                id="c_poste"
                value={poste}
                onChange={e => setPoste(e.target.value)}
              />
            </div>
            <div className="form-group full">
              <label>Téléphone direct</label>
              <input
                type="tel"
                placeholder="+33 6 xx xx xx xx"
                id="c_tel"
                value={tel}
                onChange={e => setTel(e.target.value)}
                required
              />
            </div>

            <div className="form-divider">🚛 Flotte &amp; équipements</div>
            <div className="form-group">
              <label>Nombre de véhicules</label>
              <input
                type="number"
                placeholder="Ex: 5"
                id="c_nb_vehicules"
                min="1"
                value={nbVehicules}
                onChange={e => setNbVehicules(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>Charge utile max (tonnes)</label>
              <input
                type="number"
                placeholder="Ex: 25"
                id="c_charge_max"
                min="0.1"
                step="0.1"
                value={chargeMax}
                onChange={e => setChargeMax(e.target.value)}
              />
            </div>
            <div className="form-group full">
              <label>Types de véhicules disponibles</label>
              <div className="vehicle-grid" id="vehicleCheckGroup">
                {VEHICLE_TYPES.map(v => (
                  <label
                    key={v.value}
                    className={`vehicle-option${checkedVehicles.has(v.value) ? ' checked' : ''}`}
                    onClick={() => toggleVehicle(v.value)}
                  >
                    <input
                      type="checkbox"
                      value={v.value}
                      checked={checkedVehicles.has(v.value)}
                      onChange={() => {}}
                    />
                    <span className="vcheck"></span>
                    <span className="vlabel">{v.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="form-divider">📍 Zones d'intervention</div>
            <div className="form-group full">
              <label>
                Régions / départements couverts{' '}
                <span style={{ color: 'var(--muted)', fontWeight: 400, letterSpacing: 0 }}>
                  (appuyez Entrée pour valider)
                </span>
              </label>
              <div
                className="tags-input-wrapper"
                id="zonesWrapper"
                onClick={() => document.getElementById('zonesInput').focus()}
              >
                {zones.map(zone => (
                  <span key={zone} className="zone-tag" data-zone={zone}>
                    {zone}
                    <button type="button" onClick={() => removeZone(zone)}>×</button>
                  </span>
                ))}
                <input
                  type="text"
                  className="tags-real-input"
                  id="zonesInput"
                  placeholder="Ex: Hauts-de-France, 59, Nord..."
                  value={zoneInput}
                  onChange={e => setZoneInput(e.target.value)}
                  onKeyDown={handleZoneKeyDown}
                />
              </div>
              <input type="hidden" id="zonesValue" value={zones.join(',')} />
            </div>

            <div className="form-group">
              <label>Rayon d'action max (km)</label>
              <input
                type="number"
                placeholder="Ex: 500"
                id="c_rayon"
                min="1"
                value={rayon}
                onChange={e => setRayon(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Transport international ?</label>
              <select
                id="c_international"
                value={international}
                onChange={e => setInternational(e.target.value)}
              >
                <option value="non">Non — France uniquement</option>
                <option value="europe">Oui — Europe</option>
                <option value="mondial">Oui — Mondial</option>
              </select>
            </div>

            <div className="form-divider">💬 Présentation</div>
            <div className="form-group full">
              <label>Présentez-vous en quelques mots</label>
              <textarea
                placeholder="Expérience, spécialités, points forts de votre société..."
                rows="4"
                id="c_presentation"
                style={{ resize: 'vertical' }}
                value={presentation}
                onChange={e => setPresentation(e.target.value)}
              ></textarea>
            </div>

            <div className="form-group full" style={{ marginTop: '8px' }}>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '14px',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-body)',
                  fontSize: '14px',
                  fontWeight: 400,
                  letterSpacing: 0,
                  textTransform: 'none',
                  color: 'rgba(240,237,232,0.6)',
                }}
              >
                <input
                  type="checkbox"
                  id="c_cgu"
                  required
                  checked={cgu}
                  onChange={e => setCgu(e.target.checked)}
                  style={{ position: 'absolute', opacity: 0, width: 0, height: 0 }}
                />
                <span className="cgu-check" onClick={() => setCgu(v => !v)}></span>
                J'accepte les{' '}
                <a href="#" style={{ color: 'var(--orange)' }}>conditions générales</a>{' '}
                du réseau FretNow et je certifie que les informations renseignées sont exactes.
              </label>
            </div>

            <div className="form-submit">
              <p className="submit-note">Compte créé instantanément, dossier examiné sous 48h</p>
              <button type="submit" className="btn-submit" disabled={submitting}>
                {submitting ? 'Création…' : 'Créer mon compte transporteur'}
              </button>
            </div>

          </div>
        </form>
      </div>
    </section>
  )
}
