import Swal from 'sweetalert2'

export const toastSuccess = (msg: string) =>
  Swal.fire({ icon: 'success', title: msg, toast: true, position: 'top-end', showConfirmButton: false, timer: 3000, background: '#1a1a2e', color: '#fff' })

export const toastError = (msg: string) =>
  Swal.fire({ icon: 'error', title: msg, toast: true, position: 'top-end', showConfirmButton: false, timer: 4000, background: '#1a1a2e', color: '#fff' })

export const confirmAction = async (title: string, text?: string) => {
  const result = await Swal.fire({
    title,
    text,
    icon: 'question',
    showCancelButton: true,
    confirmButtonText: 'Sí',
    cancelButtonText: 'Cancelar',
    reverseButtons: true,
    background: '#1a1a2e',
    color: '#fff',
    confirmButtonColor: '#e11d48',
  })
  return result.isConfirmed
}
