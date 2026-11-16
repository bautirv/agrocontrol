import { useEffect, useState } from 'react'
import Modal from './Modal'
import { FormUsuario, Confirmar } from './Formularios'
import * as svc from './servicios'
import type { Usuario } from './servicios'
import './Stock.css'

type Props = { usuarioActual: string }

export default function Usuarios({ usuarioActual }: Props) {
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [error, setError] = useState('')
  const [filtro, setFiltro] = useState('')
  const [editando, setEditando] = useState<number | null>(null)
  const [eliminando, setEliminando] = useState<number | null>(null)

  useEffect(() => {
    svc.listarUsuarios().then(setUsuarios).catch((e: Error) => setError(e.message))
  }, [])

  const enEdicion = usuarios.find((u) => u.id_usuario === editando)
  const enBorrado = usuarios.find((u) => u.id_usuario === eliminando)
  const lista = usuarios.filter((u) =>
    `${u.nombre} ${u.apellido} ${u.nombre_usuario}`.toLowerCase().includes(filtro.toLowerCase()),
  )

  return (
    <section>
      <div className="campanias-cabecera">
        <div>
          <p className="etiqueta">Administración</p>
          <h2 className="titulo">Usuarios</h2>
        </div>
      </div>

      {error && <p className="aviso">No se pudo cargar la lista: {error}</p>}

      <input
        className="buscador"
        type="search"
        placeholder="Buscar por nombre o usuario"
        value={filtro}
        onChange={(e) => setFiltro(e.target.value)}
      />

      <div className="tabla-caja">
        <table className="tabla">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Usuario</th>
              <th>Rol</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {lista.map((u) => {
              const soyYo = u.nombre_usuario === usuarioActual
              return (
                <tr key={u.id_usuario}>
                  <td className="fuerte">{u.nombre} {u.apellido}</td>
                  <td>{u.nombre_usuario} {soyYo && <span className="suave">(vos)</span>}</td>
                  <td><span className={`chip ${u.rol === 'ADMIN' ? 'ok' : 'bajo'}`}>{u.rol === 'ADMIN' ? 'Administrador' : 'Campo'}</span></td>
                  <td>
                    <div className="acciones-fila">
                      <button type="button" className="link-agregar" onClick={() => setEditando(u.id_usuario)}>Editar</button>
                      {!soyYo && (
                        <button type="button" className="link-agregar peligro" onClick={() => setEliminando(u.id_usuario)}>Eliminar</button>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {lista.length === 0 && <p className="aviso centrado">No hay usuarios que coincidan con la búsqueda.</p>}
      </div>

      {enEdicion && (
        <Modal titulo="Editar usuario" onCerrar={() => setEditando(null)}>
          <FormUsuario
            usuario={enEdicion}
            esUnoMismo={enEdicion.nombre_usuario === usuarioActual}
            existentes={usuarios.filter((u) => u.id_usuario !== enEdicion.id_usuario).map((u) => u.nombre_usuario)}
            onGuardar={async (cambios) => {
              const guardado = await svc.editarUsuario(enEdicion.id_usuario, cambios)
              setUsuarios((prev) => prev.map((u) => (u.id_usuario === guardado.id_usuario ? guardado : u)))
              setEditando(null)
            }}
          />
        </Modal>
      )}

      {enBorrado && (
        <Modal titulo="Eliminar usuario" onCerrar={() => setEliminando(null)}>
          <Confirmar
            etiqueta={enBorrado.nombre_usuario}
            titulo="Eliminar usuario"
            mensaje={`¿Seguro que querés eliminar a "${enBorrado.nombre_usuario}"? Esta acción no se puede deshacer. Un usuario que ya cargó labores, riegos, aplicaciones, cosechas o movimientos de stock no se puede eliminar.`}
            textoBoton="Sí, eliminar"
            onConfirmar={async () => {
              await svc.eliminarUsuario(enBorrado.id_usuario)
              setUsuarios((prev) => prev.filter((u) => u.id_usuario !== enBorrado.id_usuario))
              setEliminando(null)
            }}
          />
        </Modal>
      )}
    </section>
  )
}
