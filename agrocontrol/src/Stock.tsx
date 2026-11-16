import { useState, type Dispatch, type SetStateAction } from 'react'
import type { Producto } from './datos'
import Modal from './Modal'
import { FormProducto, FormIngreso, FormEgreso, Confirmar } from './Formularios'
import * as svc from './servicios'
import './Stock.css'

function estado(n: number) {
  if (n <= 0) return { clase: 'sin', texto: 'Sin stock' }
  if (n < 50) return { clase: 'bajo', texto: 'Stock bajo' }
  return { clase: 'ok', texto: 'Disponible' }
}

type Props = {
  productos: Producto[]
  setProductos: Dispatch<SetStateAction<Producto[]>>
  esAdmin: boolean
  error: string // si no se pudo cargar el stock desde la API
}

export default function Stock({ productos, setProductos, esAdmin, error }: Props) {
  const [filtro, setFiltro] = useState('')
  const [agregando, setAgregando] = useState(false)
  const [ingresando, setIngresando] = useState<string | null>(null) // nombre del producto
  const [retirando, setRetirando] = useState<string | null>(null)
  const [editando, setEditando] = useState<string | null>(null)
  const [eliminando, setEliminando] = useState<string | null>(null)
  const productoEdicion = productos.find((p) => p.nombre_comercial === editando)
  const productoBorrado = productos.find((p) => p.nombre_comercial === eliminando)
  const productoRetiro = productos.find((p) => p.nombre_comercial === retirando)
  const productoIngreso = productos.find((p) => p.nombre_comercial === ingresando)
  const lista = productos.filter((p) =>
    `${p.nombre_comercial} ${p.tipo} ${p.principio_activo}`.toLowerCase().includes(filtro.toLowerCase()),
  )

  return (
    <section>
      <div className="campanias-cabecera">
        <div>
          <p className="etiqueta">Sección</p>
          <h2 className="titulo">Stock de productos</h2>
        </div>
        {esAdmin && (
          <button type="button" className="agregar" onClick={() => setAgregando(true)}>+ Agregar producto</button>
        )}
      </div>

      {error && <p className="aviso">No se pudo cargar el stock: {error}</p>}

      <input
        className="buscador"
        type="search"
        placeholder="Buscar por nombre, tipo o principio activo"
        value={filtro}
        onChange={(e) => setFiltro(e.target.value)}
      />

      <div className="tabla-caja">
        <table className="tabla">
          <thead>
            <tr>
              <th>Producto</th>
              <th>Tipo</th>
              <th>Principio activo</th>
              <th className="num">Stock</th>
              <th>Estado</th>
              {esAdmin && <th />}
            </tr>
          </thead>
          <tbody>
            {lista.map((p) => {
              const e = estado(p.stock_actual)
              return (
                <tr key={p.nombre_comercial}>
                  <td className="fuerte">{p.nombre_comercial}</td>
                  <td>{p.tipo}</td>
                  <td>{p.principio_activo} <span className="suave">{p.concentracion}</span></td>
                  <td className="num">{p.stock_actual.toLocaleString('es-AR')} {p.unidad_medida}</td>
                  <td><span className={`chip ${e.clase}`}>{e.texto}</span></td>
                  {esAdmin && (
                    <td>
                      <div className="acciones-fila">
                        <button type="button" className="link-agregar" onClick={() => setIngresando(p.nombre_comercial)}>
                          Ingresar stock
                        </button>
                        <button type="button" className="link-agregar" onClick={() => setRetirando(p.nombre_comercial)}>
                          Retirar stock
                        </button>
                        <button type="button" className="link-agregar" onClick={() => setEditando(p.nombre_comercial)}>
                          Editar
                        </button>
                        <button type="button" className="link-agregar peligro" onClick={() => setEliminando(p.nombre_comercial)}>
                          Eliminar
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              )
            })}
          </tbody>
        </table>
        {lista.length === 0 && <p className="aviso centrado">No hay productos que coincidan con la búsqueda.</p>}
      </div>

      {agregando && (
        <Modal titulo="Agregar producto" onCerrar={() => setAgregando(false)}>
          <FormProducto
            existentes={productos.map((p) => p.nombre_comercial)}
            onGuardar={async (nuevo) => {
              try {
                const creado = await svc.crearProducto(nuevo)
                setProductos((prev) => [...prev, creado])
                setAgregando(false)
              } catch (e) {
                // si el producto llegó a crearse pero falló el stock inicial, se vuelve a pedir la lista
                svc.listarProductos().then(setProductos).catch(() => {})
                throw e
              }
            }}
          />
        </Modal>
      )}

      {productoEdicion && (
        <Modal titulo="Editar producto" onCerrar={() => setEditando(null)}>
          <FormProducto
            inicial={productoEdicion}
            existentes={productos.map((p) => p.nombre_comercial).filter((n) => n !== productoEdicion.nombre_comercial)}
            onGuardar={async ({ stock_inicial: _sinUso, ...cambios }) => {
              await svc.editarProducto(productoEdicion.nombre_comercial, cambios)
              // el stock no cambia: se conserva el que ya estaba
              setProductos((prev) =>
                prev.map((p) => (p.nombre_comercial === productoEdicion.nombre_comercial ? { ...cambios, stock_actual: p.stock_actual } : p)),
              )
              setEditando(null)
            }}
          />
        </Modal>
      )}

      {productoBorrado && (
        <Modal titulo="Eliminar producto" onCerrar={() => setEliminando(null)}>
          <Confirmar
            etiqueta={productoBorrado.nombre_comercial}
            titulo="Eliminar producto"
            mensaje={`¿Seguro que querés eliminar "${productoBorrado.nombre_comercial}"? Esta acción no se puede deshacer. Un producto que ya tuvo movimientos de stock o se usó en aplicaciones no se puede eliminar.`}
            textoBoton="Sí, eliminar"
            onConfirmar={async () => {
              await svc.eliminarProducto(productoBorrado.nombre_comercial)
              setProductos((prev) => prev.filter((p) => p.nombre_comercial !== productoBorrado.nombre_comercial))
              setEliminando(null)
            }}
          />
        </Modal>
      )}

      {productoRetiro && (
        <Modal titulo="Retirar stock" onCerrar={() => setRetirando(null)}>
          <FormEgreso
            producto={productoRetiro}
            onGuardar={async (cantidad, motivo, detalle) => {
              await svc.retirarStock(productoRetiro.nombre_comercial, cantidad, motivo, detalle)
              setProductos((prev) =>
                prev.map((p) => (p.nombre_comercial === productoRetiro.nombre_comercial ? { ...p, stock_actual: p.stock_actual - cantidad } : p)),
              )
              setRetirando(null)
            }}
          />
        </Modal>
      )}

      {productoIngreso && (
        <Modal titulo="Ingresar stock" onCerrar={() => setIngresando(null)}>
          <FormIngreso
            producto={productoIngreso}
            onGuardar={async (cantidad, observacion) => {
              await svc.ingresarStock(productoIngreso.nombre_comercial, cantidad, observacion)
              setProductos((prev) =>
                prev.map((p) => (p.nombre_comercial === productoIngreso.nombre_comercial ? { ...p, stock_actual: p.stock_actual + cantidad } : p)),
              )
              setIngresando(null)
            }}
          />
        </Modal>
      )}
    </section>
  )
}
