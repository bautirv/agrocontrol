import { useState, type FormEvent } from 'react'
import { login, registrar } from './api'

type Modo = 'login' | 'registro'
type Mensaje = { tipo: 'error' | 'ok'; texto: string } | null

const REGEX_USUARIO = /^[A-Za-z0-9]+$/
const REGEX_NOMBRE = /^[A-Za-zÁÉÍÓÚáéíóúÑñÜü]+(?:[ '-][A-Za-zÁÉÍÓÚáéíóúÑñÜü]+)*$/

type Props = { onIngreso: (usuario: string, rol: string) => void }

export default function Acceso({ onIngreso }: Props) {
  const [modo, setModo] = useState<Modo>('login')
  const [nombre, setNombre] = useState('')
  const [apellido, setApellido] = useState('')
  const [usuario, setUsuario] = useState('')
  const [clave, setClave] = useState('')
  const [clave2, setClave2] = useState('')
  const [mensaje, setMensaje] = useState<Mensaje>(null)
  const [enviando, setEnviando] = useState(false)

  const cambiarModo = (nuevo: Modo) => {
    setModo(nuevo)
    setMensaje(null)
    setNombre('')
    setApellido('')
    setClave('')
    setClave2('')
  }

  const enviar = async (e: FormEvent) => {
    e.preventDefault()

    if (modo === 'registro') {
      if (!REGEX_NOMBRE.test(nombre.trim())) {
        return setMensaje({ tipo: 'error', texto: 'El nombre solo puede contener letras.' })
      }
      if (!REGEX_NOMBRE.test(apellido.trim())) {
        return setMensaje({ tipo: 'error', texto: 'El apellido solo puede contener letras.' })
      }
    }
    if (usuario.length < 3) {
      return setMensaje({ tipo: 'error', texto: 'El usuario debe tener al menos 3 caracteres.' })
    }
    if (!REGEX_USUARIO.test(usuario)) {
      return setMensaje({
        tipo: 'error',
        texto: 'El usuario solo puede tener letras y números, sin espacios ni símbolos.',
      })
    }
    if (clave.length < 8) {
      return setMensaje({ tipo: 'error', texto: 'La contraseña debe tener al menos 8 caracteres.' })
    }
    if (modo === 'registro' && clave !== clave2) {
      return setMensaje({ tipo: 'error', texto: 'Las contraseñas no coinciden.' })
    }

    setEnviando(true)
    setMensaje(null)
    try {
      if (modo === 'login') {
        const sesion = await login(usuario, clave)
        onIngreso(sesion.usuario, sesion.rol)
      } else {
        await registrar({ nombre: nombre.trim(), apellido: apellido.trim(), nombre_usuario: usuario, contrasena: clave })
        // Cuenta creada: se pasa al login con el usuario ya escrito
        setModo('login')
        setNombre('')
        setApellido('')
        setClave('')
        setClave2('')
        setMensaje({ tipo: 'ok', texto: 'Cuenta creada. Ya podés ingresar.' })
      }
    } catch (err) {
      setMensaje({ tipo: 'error', texto: err instanceof Error ? err.message : 'No se pudo completar la operación.' })
    } finally {
      setEnviando(false)
    }
  }

  return (
    <main className="contenedor">
      <section className="tarjeta">
        <header className="encabezado">
          <h1>AgroControl</h1>
          <p>Gestión simple para tu campo</p>
        </header>

        <div className="tabs">
          <button
            type="button"
            className={modo === 'login' ? 'tab activa' : 'tab'}
            onClick={() => cambiarModo('login')}
          >
            Ingresar
          </button>
          <button
            type="button"
            className={modo === 'registro' ? 'tab activa' : 'tab'}
            onClick={() => cambiarModo('registro')}
          >
            Registrarse
          </button>
        </div>

        <form onSubmit={enviar} className="formulario">
          {modo === 'registro' && (
            <div className="fila">
              <label>
                Nombre
                <input
                  type="text"
                  value={nombre}
                  onChange={(e) =>
                    setNombre(e.target.value.replace(/[^A-Za-zÁÉÍÓÚáéíóúÑñÜü '-]/g, ''))
                  }
                  autoComplete="given-name"
                />
              </label>
              <label>
                Apellido
                <input
                  type="text"
                  value={apellido}
                  onChange={(e) =>
                    setApellido(e.target.value.replace(/[^A-Za-zÁÉÍÓÚáéíóúÑñÜü '-]/g, ''))
                  }
                  autoComplete="family-name"
                />
              </label>
            </div>
          )}

          <label>
            Usuario
            <input
              type="text"
              value={usuario}
              onChange={(e) => setUsuario(e.target.value.replace(/[^A-Za-z0-9]/g, ''))}
              autoComplete="username"
            />
          </label>

          <label>
            Contraseña
            <input
              type="password"
              value={clave}
              onChange={(e) => setClave(e.target.value)}
              autoComplete={modo === 'login' ? 'current-password' : 'new-password'}
            />
          </label>

          {modo === 'registro' && (
            <label>
              Repetir contraseña
              <input
                type="password"
                value={clave2}
                onChange={(e) => setClave2(e.target.value)}
                autoComplete="new-password"
              />
            </label>
          )}

          {mensaje && <p className={`mensaje ${mensaje.tipo}`}>{mensaje.texto}</p>}

          <button type="submit" className="boton" disabled={enviando}>
            {enviando ? 'Un momento…' : modo === 'login' ? 'Ingresar' : 'Crear cuenta'}
          </button>
        </form>
      </section>
    </main>
  )
}