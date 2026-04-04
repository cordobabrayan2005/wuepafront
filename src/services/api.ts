// Servicio API simplificado para modo offline/demostración
// Todos los métodos retornan datos simulados sin realizar llamadas reales a la red

export const api = {
  login: async (email: string, password: string) => {
    // Simula el retardo de inicio de sesión
    await new Promise(resolve => setTimeout(resolve, 500));

    if (email && password) {
      return {
        user: {
          id: '1',
          email,
          name: 'Usuario',
          lastname: 'Demo',
          age: 25
        },
        token: 'mock-token-' + Date.now()
      };
    }
    throw new Error('Credenciales inválidas');
  },

  register: async (userData: any) => {
    // Simula el retardo de registro
    await new Promise(resolve => setTimeout(resolve, 500));

    return {
      user: {
        id: '1',
        email: userData.email,
        name: userData.name,
        lastname: userData.lastname,
        age: userData.age
      },
      token: 'mock-token-' + Date.now()
    };
  },

  signup: async (userData: any) => {
    // Alias de register para mantener compatibilidad con Signup.tsx
    return api.register(userData);
  },

  me: async () => {
    return {
      id: '1',
      email: 'usuario@demo.com',
      name: 'Usuario',
      lastname: 'Demo',
      age: 25
    };
  },

  forgot: async (email: string) => {
    await new Promise(resolve => setTimeout(resolve, 500));

    if (email) {
      return { message: 'Enlace de recuperación enviado.' };
    }
    throw new Error('Debes ingresar un correo válido.');
  },

  reset: async (token: string, password: string) => {
    await new Promise(resolve => setTimeout(resolve, 500));

    if (token && password) {
      return { message: 'Contraseña actualizada.' };
    }
    throw new Error('Token o contraseña inválidos.');
  },

  changePassword: async (currentPassword: string, newPassword: string, confirmPassword: string) => {
    await new Promise(resolve => setTimeout(resolve, 500));

    if (!currentPassword || !newPassword || !confirmPassword) {
      throw new Error('Todos los campos son obligatorios.');
    }

    if (newPassword !== confirmPassword) {
      throw new Error('Las contraseñas no coinciden.');
    }

    if (newPassword.length < 6) {
      throw new Error('La contraseña debe tener mínimo 6 caracteres.');
    }

    // Simulación de éxito
    return {
      message: 'Contraseña cambiada correctamente.'
    };
  },

  socialLogin: async (idToken: string, provider: string) => {
    await new Promise(resolve => setTimeout(resolve, 500));

    return {
      user: {
        id: '1',
        email: 'social@demo.com',
        name: 'Usuario',
        lastname: 'Social',
        age: 25
      },
      token: 'mock-token-' + Date.now()
    };
  }
};
