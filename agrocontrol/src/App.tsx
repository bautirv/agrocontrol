import { useEffect, useState } from 'react'
import './App.css'
import Acceso from './Acceso'
import MenuPrincipal from './MenuPrincipal'
import { alVencerSesion, cerrarSesion, leerSesion } from './api'

export default function App() {
  // Si se recarga la página dentro de la misma pestaña, se mantiene la sesión
  const [sesion, setSesion] = useState<{ usuario: string; rol: string } | null>(() => {
    const guardada = leerSesion()
    return guardada ? { usuario: guardada.usuario, rol: guardada.rol } : null
  })

  // Cuando el token vence (la API responde 401) se vuelve al login
  useEffect(() => {
    alVencerSesion(() => setSesion(null))
  }, [])

  const salir = () => {
    cerrarSesion()
    setSesion(null)
  }

  return sesion ? (
    <MenuPrincipal usuario={sesion.usuario} esAdmin={sesion.rol === 'ADMIN'} onSalir={salir} />
  ) : (
    <>
      <div className="fondo" />
      <Acceso onIngreso={(usuario, rol) => setSesion({ usuario, rol })} />
    </>
  )
}