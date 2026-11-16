import { useEffect, useRef, useState } from 'react'
import './MenuPrincipal.css'
import Campanias from './Campanias'
import Stock from './Stock'
import Usuarios from './Usuarios'
import type { Producto } from './datos'
import { listarProductos } from './servicios'

type Tema = 'claro' | 'oscuro'
type Vista = 'inicio' | 'campanias' | 'stock' | 'usuarios'

type Props = { usuario: string; esAdmin: boolean; onSalir: () => void }

function temaInicial(): Tema {
  try {
    return localStorage.getItem('tema') === 'oscuro' ? 'oscuro' : 'claro'
  } catch {
    return 'claro'
  }
}

export default function MenuPrincipal({ usuario, esAdmin, onSalir }: Props) {
  const [vista, setVista] = useState<Vista>('inicio')
  // El stock se comparte: las aplicaciones de Campañas lo descuentan y Stock lo muestra
  const [productos, setProductos] = useState<Producto[]>([])
  const [errorProductos, setErrorProductos] = useState('')
  const [tema, setTema] = useState<Tema>(temaInicial)
  const [configAbierta, setConfigAbierta] = useState(false)
  const configRef = useRef<HTMLDivElement>(null)

  const elegirTema = (nuevo: Tema) => {
    setTema(nuevo)
    try {
      localStorage.setItem('tema', nuevo)
    } catch {
      /* si el navegador no permite guardar, el tema igual cambia */
    }
  }

  // El stock se pide a la API una sola vez al entrar
  useEffect(() => {
    listarProductos()
      .then(setProductos)
      .catch((e: Error) => setErrorProductos(e.message))
  }, [])

  // Cierra el panel de configuración al hacer clic afuera
  useEffect(() => {
    const cerrar = (e: MouseEvent) => {
      if (configRef.current && !configRef.current.contains(e.target as Node)) {
        setConfigAbierta(false)
      }
    }
    document.addEventListener('mousedown', cerrar)
    return () => document.removeEventListener('mousedown', cerrar)
  }, [])

  return (
    <div className="menu" data-tema={tema}>
      <nav className="barra">
        <button type="button" className="marca" onClick={() => setVista('inicio')}>
          AgroControl
        </button>

        <div className="barra-centro">
          <button
            type="button"
            className={vista === 'campanias' ? 'enlace activo' : 'enlace'}
            onClick={() => setVista('campanias')}
          >
            Campañas
          </button>
          <button
            type="button"
            className={vista === 'stock' ? 'enlace activo' : 'enlace'}
            onClick={() => setVista('stock')}
          >
            Stock de Productos
          </button>
          {esAdmin && (
            <button
              type="button"
              className={vista === 'usuarios' ? 'enlace activo' : 'enlace'}
              onClick={() => setVista('usuarios')}
            >
              Usuarios
            </button>
          )}
        </div>

        <div className="barra-derecha">
          <span className="usuario">{usuario}</span>

          <div className="config" ref={configRef}>
            <button
              type="button"
              className="enlace"
              onClick={() => setConfigAbierta((v) => !v)}
              aria-expanded={configAbierta}
            >
              Configuración
            </button>

            {configAbierta && (
              <div className="config-panel">
                <p>Apariencia</p>
                <div className="selector">
                  <button
                    type="button"
                    className={tema === 'claro' ? 'opcion activa' : 'opcion'}
                    onClick={() => elegirTema('claro')}
                  >
                    Claro
                  </button>
                  <button
                    type="button"
                    className={tema === 'oscuro' ? 'opcion activa' : 'opcion'}
                    onClick={() => elegirTema('oscuro')}
                  >
                    Oscuro
                  </button>
                </div>
              </div>
            )}
          </div>

          <button type="button" className="salir" onClick={onSalir}>
            Salir
          </button>
        </div>
      </nav>

      <main className="contenido">
        {vista === 'inicio' && (
          <>
            <header className="saludo">
              <p>Menú principal</p>
              <h2>Hola, {usuario}</h2>
            </header>

            <div className="atajos">
              <button type="button" className="atajo" onClick={() => setVista('campanias')}>
                <span className="atajo-titulo">Campañas</span>
                <span className="atajo-texto">Campos, lotes, labores, riegos, aplicaciones y cosechas.</span>
              </button>
              <button type="button" className="atajo" onClick={() => setVista('stock')}>
                <span className="atajo-titulo">Stock de productos</span>
                <span className="atajo-texto">Qué hay disponible y qué conviene reponer.</span>
              </button>
              {esAdmin && (
                <button type="button" className="atajo" onClick={() => setVista('usuarios')}>
                  <span className="atajo-titulo">Usuarios</span>
                  <span className="atajo-texto">Editar cuentas, cambiar roles y dar de baja.</span>
                </button>
              )}
            </div>
          </>
        )}

        {/* Campañas queda montada para no perder lo cargado al cambiar de pestaña */}
        <div hidden={vista !== 'campanias'}>
          <Campanias esAdmin={esAdmin} productos={productos} setProductos={setProductos} />
        </div>

        {vista === 'stock' && <Stock productos={productos} setProductos={setProductos} esAdmin={esAdmin} error={errorProductos} />}
        {esAdmin && vista === 'usuarios' && <Usuarios usuarioActual={usuario} />}
      </main>
    </div>
  )
}