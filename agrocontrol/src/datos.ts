// Tipos de lo que muestra la app. Tienen la misma forma que las respuestas del backend
// (ver /docs de la API); servicios.ts convierte las respuestas a estos tipos.

export type Producto = {
  nombre_comercial: string
  principio_activo: string
  concentracion: string
  tipo: string
  unidad_medida: string
  stock_actual: number
}

// fecha_fin es opcional en el backend: una campaña sin fecha de fin sigue "actual"
export type Campania = { id_campania: number; nombre: string; fecha_inicio: string; fecha_fin: string | null }
export type Campo = { id_campo: number; nombre: string; ubicacion: string; superficie_total: number; nombre_campania: string }
export type Lote = { nombre: string; superficie: number; variedad: string; fecha_siembra: string; cantidad_semilla: number; nombre_campo: string }
export type Labor = { id_labor: number; tipo: string; fecha: string; observaciones: string; nombre_lote: string; nombre_campo: string; nombre_usuario: string }
export type Riego = { id_riego: number; fecha: string; hora_inicio: string; hora_fin: string; cantidad_agua: number; nombre_lote: string; nombre_campo: string; observaciones: string }
export type Aplicacion = { id_aplicacion: number; fecha: string; temperatura: number; humedad: number; viento: number; nombre_lote: string; nombre_campo: string; productos: string; observaciones?: string }
export type Cosecha = { id_cosecha: number; fecha: string; cantidad_cosechada: number; nombre_lote: string; nombre_campo: string; dtve: string; camiones: number; observaciones?: string }
export type Orden = { id_orden_aplicacion: number; fecha: string; objetivo: string; observaciones: string; estado: 'PENDIENTE' | 'REALIZADA' | 'CANCELADA'; nombre_lote: string; nombre_campo: string; nombre_usuario: string }

// Todo lo que se carga en la pantalla de campañas
export type Datos = {
  campos: Campo[]
  lotes: Lote[]
  labores: Labor[]
  riegos: Riego[]
  aplicaciones: Aplicacion[]
  ordenes: Orden[]
  cosechas: Cosecha[]
}
