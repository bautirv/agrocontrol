/* Conexión con el backend (FastAPI). Toda la comunicación pasa por acá. */

const BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://127.0.0.1:8000'

export type Sesion = { token: string; usuario: string; rol: string }

let token: string | null = null
let alVencer: (() => void) | null = null

/** Recupera la sesión si se recargó la página (dura mientras la pestaña esté abierta). */
export function leerSesion(): Sesion | null {
  try {
    const guardada = sessionStorage.getItem('sesion')
    if (!guardada) return null
    const sesion = JSON.parse(guardada) as Sesion
    token = sesion.token
    return sesion
  } catch {
    return null
  }
}

function guardarSesion(sesion: Sesion) {
  token = sesion.token
  try {
    sessionStorage.setItem('sesion', JSON.stringify(sesion))
  } catch {
    /* si el navegador no deja guardar, la sesión igual funciona hasta recargar */
  }
}

export function cerrarSesion() {
  token = null
  try {
    sessionStorage.removeItem('sesion')
  } catch {
    /* nada que hacer */
  }
}

/** La app se entera cuando el token vence (la API responde 401) para volver al login. */
export function alVencerSesion(fn: () => void) {
  alVencer = fn
}

async function mensajeDeError(r: Response): Promise<string> {
  try {
    const cuerpo = await r.json()
    const detalle = cuerpo?.detail
    if (typeof detalle === 'string') return detalle
    if (Array.isArray(detalle)) return detalle.map((d: { msg?: string }) => d.msg ?? 'Dato inválido').join(' · ')
  } catch {
    /* la respuesta no era JSON */
  }
  return `Error del servidor (${r.status}).`
}

export async function api<T>(ruta: string, opciones: RequestInit = {}, conSesion = true): Promise<T> {
  const headers = new Headers(opciones.headers)
  if (typeof opciones.body === 'string' && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json')
  if (conSesion && token) headers.set('Authorization', `Bearer ${token}`)

  let r: Response
  try {
    r = await fetch(`${BASE}${ruta}`, { ...opciones, headers })
  } catch {
    throw new Error('No se pudo conectar con el servidor. Revisá que el backend esté encendido.')
  }

  if (r.status === 401 && conSesion) {
    cerrarSesion()
    alVencer?.()
    throw new Error('La sesión venció. Volvé a ingresar.')
  }
  if (!r.ok) throw new Error(await mensajeDeError(r))
  if (r.status === 204) return undefined as T
  return (await r.json()) as T
}

/** El login de FastAPI no recibe JSON: recibe un formulario con "username" y "password". */
export async function login(usuario: string, clave: string): Promise<Sesion> {
  const datos = await api<{ access_token: string; nombre_usuario: string; rol: string }>(
    '/usuarios/login',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ username: usuario, password: clave }),
    },
    false,
  )
  const sesion = { token: datos.access_token, usuario: datos.nombre_usuario, rol: datos.rol }
  guardarSesion(sesion)
  return sesion
}

export function registrar(datos: { nombre: string; apellido: string; nombre_usuario: string; contrasena: string }) {
  return api('/usuarios/', { method: 'POST', body: JSON.stringify(datos) }, false)
}
