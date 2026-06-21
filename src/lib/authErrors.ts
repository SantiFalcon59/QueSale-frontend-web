/**
 * Translates Firebase and backend authentication errors into user-friendly Spanish messages.
 */
export const translateAuthError = (err: any): string => {
  if (!err) return 'Ha ocurrido un error inesperado.';
  
  const errorMessage = typeof err === 'string' ? err : (err.message || '');
  
  // Firebase Specific Code/Message checks
  if (
    errorMessage.includes('auth/invalid-credential') || 
    errorMessage.includes('auth/wrong-password') || 
    errorMessage.includes('auth/user-not-found') ||
    errorMessage.toLowerCase().includes('invalid credential')
  ) {
    return 'El correo electrónico o la contraseña son incorrectos.';
  }
  if (errorMessage.includes('auth/invalid-email')) {
    return 'El formato del correo electrónico no es válido.';
  }
  if (errorMessage.includes('auth/user-disabled')) {
    return 'Esta cuenta ha sido desactivada por un administrador.';
  }
  if (errorMessage.includes('auth/email-already-in-use') || errorMessage.toLowerCase().includes('email already in use')) {
    return 'Este correo electrónico ya está registrado.';
  }
  if (errorMessage.includes('auth/weak-password')) {
    return 'La contraseña debe tener al menos 6 caracteres.';
  }
  if (errorMessage.includes('auth/too-many-requests')) {
    return 'Demasiados intentos fallidos. Por favor, intenta de nuevo más tarde.';
  }
  if (errorMessage.includes('auth/popup-closed-by-user')) {
    return 'Se cerró la ventana de inicio de sesión con Google antes de completar el proceso.';
  }
  if (errorMessage.includes('auth/operation-not-allowed')) {
    return 'El método de inicio de sesión no está habilitado.';
  }
  if (errorMessage.includes('auth/network-request-failed')) {
    return 'Error de red. Verifica tu conexión a internet.';
  }
  
  // Backend Registration checks
  if (
    errorMessage.includes('Username already in use') || 
    errorMessage.toLowerCase().includes('username already exists') || 
    errorMessage.toLowerCase().includes('username is already taken')
  ) {
    return 'El nombre de usuario ya está en uso.';
  }

  // Fallback to the original error message if it's already in Spanish/custom, or translate generic ones
  if (errorMessage === 'Login failed') {
    return 'No se pudo iniciar sesión. Verifica tus datos.';
  }
  if (errorMessage === 'Google login failed') {
    return 'No se pudo iniciar sesión con Google.';
  }

  return errorMessage || 'Ha ocurrido un error. Intenta nuevamente.';
};
