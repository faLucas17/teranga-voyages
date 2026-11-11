import { createContext, useContext, useEffect, useState } from 'react'
import api from '../api/client'

const DEFAULTS = {
  agency_name: 'Teranga Voyages',
  agency_slogan: "Voyagez avec l'hospitalité sénégalaise",
  agency_phone: '+221 33 800 00 00',
  agency_email: 'contact@teranga-voyages.sn',
  agency_address: 'Dakar, Sénégal',
  agency_whatsapp: '',
  agency_hours: 'Lun - Sam : 8h30 - 19h00',
  payment_methods: ['wave', 'orange_money', 'card', 'bank_transfer', 'cash'],
  payment_mode: 'simulation',
}

const SettingsContext = createContext(DEFAULTS)

/** Paramètres publics de l'agence (modifiables depuis le back-office). */
export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(DEFAULTS)

  useEffect(() => {
    api
      .get('/settings')
      .then(({ data }) => setSettings((s) => ({ ...s, ...data })))
      .catch(() => {})
  }, [])

  return <SettingsContext.Provider value={settings}>{children}</SettingsContext.Provider>
}

export const useSettings = () => useContext(SettingsContext)
